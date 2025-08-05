import { request } from '@stacks/connect';
import { 
  uintCV, 
  makeStandardFungiblePostCondition,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
  createAssetInfo,
  postConditionToHex,
  Pc,
  PostConditionMode
} from '@stacks/transactions';
import {
  DEX_CONTRACT_ADDRESS,
  DEX_CONTRACT_NAME,
  SATS_CONTRACT_ADDRESS,
  SATS_CONTRACT_NAME,
  TOKEN_CONTRACT_NAME,
  getCurrentPrice,
} from './fetchTokenData';

export async function handleTransaction(tab, amount, setErrorMessage, setToast, expectedPrice, setDuplicateCallback = null, slippageProtection = null, estimatedOutput = null, currentPrice = null) {
  // 🧪 EXPERIMENTAL: Router function to choose between flows
  if (slippageProtection && slippageProtection.enabled && slippageProtection.tolerance > 0 && slippageProtection.userAddress) {
    console.log('🧪 Using EXPERIMENTAL post-conditions flow');
    if (!estimatedOutput) {
      console.error('❌ ERROR: estimatedOutput is required for slippage protection!');
      return null;
    }
    return await handleTransactionWithPostConditions(tab, amount, setErrorMessage, setToast, expectedPrice, setDuplicateCallback, slippageProtection, estimatedOutput, currentPrice);
  } else {
    console.log('✅ Using standard transaction flow');
    return await handleTransactionWithoutPostConditions(tab, amount, setErrorMessage, setToast, expectedPrice, setDuplicateCallback, currentPrice);
  }
}

// ✅ STANDARD FLOW: No post conditions (existing logic)
async function handleTransactionWithoutPostConditions(tab, amount, setErrorMessage, setToast, expectedPrice, setDuplicateCallback = null, currentPrice = null) {
  let formattedTxId = '';
  let createdAtISO = null;
  let formattedSatsPerToken = '';
  let tradeType = tab;

  const functionName = tab === 'buy' ? 'buy' : 'sell';
  const satsTraded = tab === 'buy' ? parseInt(amount) : Math.round(parseFloat(amount) * 1e8);
  const functionArgs = [uintCV(satsTraded)];

  try {
    console.log('⏳ Standard Transaction Pending...');

    // No post conditions - standard flow
    const postConditions = [];
    const postConditionMode = 'allow';

    console.log('🚀 About to send request with:', {
      contract: `${DEX_CONTRACT_ADDRESS}.${DEX_CONTRACT_NAME}`,
      functionName,
      functionArgs,
      postConditionMode,
      postConditions: postConditions.length,
      network: 'testnet'
    });

    const response = await request('stx_callContract', {
      contract: `${DEX_CONTRACT_ADDRESS}.${DEX_CONTRACT_NAME}`,
      functionName,
      functionArgs,
      postConditionMode,
      postConditions,
      network: 'testnet',
    });
    
    console.log('✅ Request completed, response:', response);

    const { txid: txId } = response;
    formattedTxId = `0x${txId}`;

    // ✅ Check if this txId is already in localStorage
    const lastTx = localStorage.getItem('lastTx');
    if (lastTx === formattedTxId) {
      console.warn('⚠️ Duplicate transaction detected.');
      if (setDuplicateCallback) {
        setDuplicateCallback();
      }
      return null;
    }
    localStorage.setItem('lastTx', formattedTxId);

    console.log('View transaction:', `https://explorer.hiro.so/txid/${formattedTxId}?chain=testnet`);

    setToast({
      message: `🔄 ${tab.toUpperCase()} transaction submitted`,
      txId: formattedTxId,
      visible: true,
      status: 'pending',
    });

    const confirmedData = await waitForConfirmation(txId);

    if (confirmedData.tx_status !== 'success') {
      console.log('❌ Transaction failed:', txId);
      console.log('❌ Failed transaction data:', confirmedData);
      
      // 🔍 Log events even for failed transactions to debug post conditions
      if (confirmedData.events && confirmedData.events.length > 0) {
        console.log('🔍 Failed Transaction Events:');
        confirmedData.events.forEach((event, index) => {
          console.log(`Failed Event ${index + 1}:`, {
            type: event.event_type,
            asset: event.asset?.asset_id,
            sender: event.asset?.sender,
            recipient: event.asset?.recipient,
            amount: event.asset?.amount,
            raw_event: event
          });
        });
      }
      
      // Error handled via toast - no top banner needed

      setToast({
        message: `❌ ${tab.toUpperCase()} transaction failed`,
        txId: formattedTxId,
        visible: true,
        status: 'failed',
      });

      return null;
    }

    // ✅ Check Supabase for duplicate txId before saving
    const dupCheckRes = await fetch('/api/check-tx-duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: formattedTxId }),
    });

    const dupData = await dupCheckRes.json();
    if (dupData.exists) {
      console.warn('⚠️ This transaction already exists in Supabase.');
      // Error handled via toast - no top banner needed
      return null;
    }

    console.log('✅ Transaction confirmed:', txId);
    console.log('📄 Full transaction data:', confirmedData);
    
    // 🔍 Log transaction events for post condition debugging
    if (confirmedData.events && confirmedData.events.length > 0) {
      console.log('🎯 Transaction Events:');
      confirmedData.events.forEach((event, index) => {
        console.log(`Event ${index + 1}:`, {
          type: event.event_type,
          contract: event.contract_log?.contract_id,
          asset: event.asset?.asset_id,
          sender: event.asset?.sender,
          recipient: event.asset?.recipient,
          amount: event.asset?.amount,
          raw_event: event
        });
      });
    } else {
      console.log('⚠️ No events found in transaction data');
    }

    setToast({
      message: `✅ ${tab.toUpperCase()} transaction confirmed`,
      txId: formattedTxId,
      visible: true,
      status: 'success',
    });

    createdAtISO = confirmedData.block_time_iso || null;

    let tokensTraded = 0;
    let satsReceived = 0;

    if (tab === 'buy') {
      if (Array.isArray(confirmedData.events)) {
        const tokenEvent = confirmedData.events.find(
          (event) =>
            event.event_type === 'fungible_token_asset' &&
            event.asset.asset_event_type === 'transfer' &&
            event.asset.asset_id.includes('.dear-cyan') &&
            event.asset.recipient === confirmedData.sender_address
        );

        if (tokenEvent) {
          const rawAmount = tokenEvent.asset.amount;
          tokensTraded = parseInt(rawAmount) / 1e8;
          console.log(`✅ Tokens bought: ${tokensTraded}`);
        } else {
          console.warn('⚠️ No matching token transfer event found for buy.');
        }
      }
    } else if (tab === 'sell') {
      tokensTraded = -parseFloat(amount);
      console.log(`✅ Tokens sold (input): ${tokensTraded}`);

      if (Array.isArray(confirmedData.events)) {
        const sbtcEvent = confirmedData.events.find(
          (event) =>
            event.event_type === 'fungible_token_asset' &&
            event.asset.asset_event_type === 'transfer' &&
            event.asset.asset_id.includes('sbtc-token') &&
            event.asset.recipient === confirmedData.sender_address
        );

        if (sbtcEvent) {
          satsReceived = parseInt(sbtcEvent.asset.amount);
          console.log(`✅ SBTC received: ${satsReceived} sats`);
        } else {
          console.warn('⚠️ No SBTC transfer event found for sell.');
        }
      }
    }

    if (tab === 'buy' && satsTraded && tokensTraded) {
      const executedPrice = satsTraded / tokensTraded;
      formattedSatsPerToken = executedPrice.toFixed(7);
      console.log(`📊 Executed buy price: ${formattedSatsPerToken} sats/token`);
    } else if (tab === 'sell' && satsReceived && tokensTraded !== 0) {
      const executedPrice = satsReceived / Math.abs(tokensTraded);
      formattedSatsPerToken = executedPrice.toFixed(7);
      console.log(`📊 Executed sell price: ${formattedSatsPerToken} sats/token`);
    } else {
      const fallbackPrice = await getCurrentPrice();
      formattedSatsPerToken = (fallbackPrice * 1e8).toFixed(7);
      console.log(`⚠️ Fallback price used: ${formattedSatsPerToken} sats/token`);
    }

    const tradePayload = {
      transaction_id: formattedTxId,
      price: parseFloat(formattedSatsPerToken), // Actual executed price
      current_price: currentPrice || parseFloat(formattedSatsPerToken), // Market price at time of trade
      expected_price: expectedPrice || null, // Slippage-adjusted expected price
      type: tradeType,
      created_at: createdAtISO,
      tokens_traded: tokensTraded,
      sats_traded: tab === 'buy' ? satsTraded : satsReceived || null,
    };

    console.log('📤 Payload to Supabase:', tradePayload);
    console.log('🎯 Expected price in payload:', expectedPrice);

    try {
      const res = await fetch('/api/save-test-trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradePayload),
      });

      const data = await res.json();
      if (res.ok) {
        console.log('✅ Trade saved to Supabase.');
        console.log('📦 Saved data:', data);
      } else {
        console.warn('⚠️ Failed to save trade:', data.error);
      }
    } catch (err) {
      console.error('❌ Error calling save-test-trades API:', err.message);
    }

    return true;
  } catch (err) {
    if (err.message && err.message.includes('Failed to fetch')) {
      console.log('🚨 Error checking tx status: Failed to fetch.');
      // Error handled via toast - no top banner needed

      setToast({
        message: `❌ ${tab.toUpperCase()} transaction failed`,
        txId: formattedTxId || '',
        visible: true,
      });
    }

    console.error(`❌ Error in ${tab} transaction:`, err);

    setToast({
      message: `❌ ${tab.toUpperCase()} transaction failed`,
      txId: formattedTxId || '',
      visible: true,
    });

    // Error handled via toast - no top banner needed
    return null;
  }
}

// 🧪 EXPERIMENTAL FLOW: With post conditions for slippage protection
async function handleTransactionWithPostConditions(tab, amount, setErrorMessage, setToast, expectedPrice, setDuplicateCallback = null, slippageProtection, estimatedOutput, currentPrice = null) {
  let formattedTxId = '';
  let createdAtISO = null;
  let formattedSatsPerToken = '';
  let tradeType = tab;

  const functionName = tab === 'buy' ? 'buy' : 'sell';
  const satsTraded = tab === 'buy' ? parseInt(amount) : Math.round(parseFloat(amount) * 1e8);
  const functionArgs = [uintCV(satsTraded)];

  try {
    console.log('🧪 Experimental Transaction with Post Conditions...');
    console.log('🔧 Input amount:', amount);
    console.log('🔧 Calculated satsTraded:', satsTraded);
    console.log('🔧 Tab:', tab);
    console.log('🔧 Slippage settings:', slippageProtection);

    // 🧪 CREATE POST CONDITIONS using modern Pc helper
    let postConditions = [];
    const postConditionMode = 'deny'; // Recommended secure mode

    if (slippageProtection.userAddress && slippageProtection.tolerance > 0) {
      // For BUY: User sends exact sats, should receive minimum mas sats (accounting for slippage)
      // For SELL: User sends exact mas sats, should receive minimum sats (accounting for slippage)
      
      if (tab === 'buy') {
        // Use real estimated tokens from UI (no more hardcoded prices!)
        const slippagePercent = slippageProtection.tolerance / 100;
        const minExpectedMasSats = Math.floor(estimatedOutput * (1 - slippagePercent));
        
        // 🛡️ CONDITION 1: User sends exact SBTC amount
        const userSendsSbtcCondition = Pc.principal(slippageProtection.userAddress)
          .willSendEq(satsTraded)
          .ft('ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token', 'sbtc-token');
        
        // 🛡️ CONDITION 2: DEX contract sends at least minimum mas sats to user (slippage protection!)
        const contractSendsMasSatsCondition = Pc.principal(`${DEX_CONTRACT_ADDRESS}.${DEX_CONTRACT_NAME}`)
          .willSendGte(minExpectedMasSats)
          .ft(`${DEX_CONTRACT_ADDRESS}.dear-cyan`, 'dear-cyan');
        
        postConditions.push(
          postConditionToHex(userSendsSbtcCondition),
          postConditionToHex(contractSendsMasSatsCondition)
        );
        
        console.log('🛡️ BUY post conditions:');
        console.log('  1. User sends exactly', satsTraded, 'SBTC tokens');
        console.log('  2. Contract sends at least', minExpectedMasSats, 'mas sats (with', slippageProtection.tolerance + '% slippage protection)');
        console.log('  3. UI estimated:', estimatedOutput, 'tokens, protected minimum:', minExpectedMasSats, 'tokens');
        
      } else {
        // SELL: Use real estimated SBTC from UI (no more hardcoded prices!)
        const slippagePercent = slippageProtection.tolerance / 100;
        const minExpectedSbtc = Math.floor(estimatedOutput * (1 - slippagePercent));
        
        // 🛡️ CONDITION 1: User sends exact dear-cyan tokens
        const userSendsTokensCondition = Pc.principal(slippageProtection.userAddress)
          .willSendEq(satsTraded)
          .ft(`${DEX_CONTRACT_ADDRESS}.dear-cyan`, 'dear-cyan');
        
        // 🛡️ CONDITION 2: DEX contract sends at least minimum SBTC to user (slippage protection!)
        const contractSendsSbtcCondition = Pc.principal(`${DEX_CONTRACT_ADDRESS}.${DEX_CONTRACT_NAME}`)
          .willSendGte(minExpectedSbtc)
          .ft('ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token', 'sbtc-token');
        
        postConditions.push(
          postConditionToHex(userSendsTokensCondition),
          postConditionToHex(contractSendsSbtcCondition)
        );
        
        console.log('🛡️ SELL post conditions:');
        console.log('  1. User sends exactly', satsTraded, 'dear-cyan base units');
        console.log('  2. Contract sends at least', minExpectedSbtc, 'SBTC (with', slippageProtection.tolerance + '% slippage protection)');
        console.log('  3. UI estimated:', estimatedOutput, 'SBTC, protected minimum:', minExpectedSbtc, 'SBTC');
      }
    }

    console.log('🚀 About to send EXPERIMENTAL request with:', {
      contract: `${DEX_CONTRACT_ADDRESS}.${DEX_CONTRACT_NAME}`,
      functionName,
      functionArgs,
      postConditionMode,
      postConditions: postConditions.length,
      network: 'testnet'
    });

    const response = await request('stx_callContract', {
      contract: `${DEX_CONTRACT_ADDRESS}.${DEX_CONTRACT_NAME}`,
      functionName,
      functionArgs,
      postConditionMode,
      postConditions,
      network: 'testnet',
    });
    
    console.log('✅ EXPERIMENTAL Request completed, response:', response);

    const { txid: txId } = response;
    formattedTxId = `0x${txId}`;

    // ✅ Check if this txId is already in localStorage
    const lastTx = localStorage.getItem('lastTx');
    if (lastTx === formattedTxId) {
      console.warn('⚠️ Duplicate transaction detected.');
      if (setDuplicateCallback) {
        setDuplicateCallback();
      }
      return null;
    }
    localStorage.setItem('lastTx', formattedTxId);

    console.log('View transaction:', `https://explorer.hiro.so/txid/${formattedTxId}?chain=testnet`);

    setToast({
      message: `🔄 ${tab.toUpperCase()} transaction submitted (with post conditions)`,
      txId: formattedTxId,
      visible: true,
      status: 'pending',
    });

    const confirmedData = await waitForConfirmation(txId);

    if (confirmedData.tx_status !== 'success') {
      console.log('❌ EXPERIMENTAL Transaction failed:', txId);
      console.log('❌ Failed transaction data:', confirmedData);
      
      // 🔍 Log events even for failed transactions to debug post conditions
      if (confirmedData.events && confirmedData.events.length > 0) {
        console.log('🔍 Transaction events for post condition debugging:', confirmedData.events);
      }

      setToast({
        message: `❌ ${tab.toUpperCase()} transaction failed`,
        txId: formattedTxId,
        visible: true,
      });

      // Error handled via toast - no top banner needed
      return { success: false, txId: formattedTxId };
    }

    // ✅ SUCCESS: Transaction confirmed
    console.log('✅ EXPERIMENTAL Transaction confirmed:', confirmedData);
    
    // 🔍 FULL TX DATA for debugging - show me where to find tokens_traded!
    console.log('🔍 FULL TRANSACTION DATA FOR DEBUGGING:');
    console.log('📋 Complete Transaction Object:', JSON.stringify(confirmedData, null, 2));
    console.log('📋 Events Array:', confirmedData.events);
    if (confirmedData.events) {
      confirmedData.events.forEach((event, index) => {
        console.log(`📋 Event ${index}:`, JSON.stringify(event, null, 2));
      });
    }
    
    // 🔍 Log transaction events for post condition debugging
    if (confirmedData.events && confirmedData.events.length > 0) {
      console.log('🔍 Transaction events for post condition debugging:', confirmedData.events);
    }

    const currentPricePromise = getCurrentPrice();
    createdAtISO = new Date().toISOString();

    let tokensTraded = 0;
    let satsFromTrade = 0;

    // Parse transaction events to get actual amounts (FIXED: use .amount not .value)
    for (const event of confirmedData.events || []) {
      if (event.event_type === 'fungible_token_asset') {
        if (event.asset?.asset_id?.includes('dear-cyan')) {
          tokensTraded = parseInt(event.asset.amount);
          console.log(`📊 MAS Sats ${tab === 'buy' ? 'received' : 'sent'}:`, tokensTraded / 1e8);
        } else if (event.asset?.asset_id?.includes('sbtc-token')) {
          satsFromTrade = parseInt(event.asset.amount);
          console.log(`📊 SBTC ${tab === 'buy' ? 'sent' : 'received'}:`, satsFromTrade);
        }
      }
    }
    
    // 🛠️ Convert base units to actual tokens and handle sign
    if (tab === 'sell') {
      tokensTraded = -(tokensTraded / 1e8); // Convert to actual tokens and make negative
      console.log(`📊 SELL: tokens_traded converted to actual tokens:`, tokensTraded);
    } else {
      tokensTraded = tokensTraded / 1e8; // Convert to actual tokens  
      console.log(`📊 BUY: tokens_traded converted to actual tokens:`, tokensTraded);
    }

    // 🔍 DEBUG: Log calculation values
    console.log('🔍 EXPERIMENTAL Price calculation debug:');
    console.log('  satsFromTrade:', satsFromTrade);
    console.log('  satsTraded:', satsTraded);
    console.log('  tokensTraded:', tokensTraded);
    console.log('  tokensTraded / 1e8:', tokensTraded / 1e8);
    console.log('  Raw calculation (FIXED):', satsFromTrade / Math.abs(tokensTraded));
    
    // 🛠️ FIX: Calculate price correctly (tokensTraded is already converted to actual tokens)
    const rawPrice = satsFromTrade / Math.abs(tokensTraded);
    if (isNaN(rawPrice) || !isFinite(rawPrice)) {
      console.warn('⚠️ Price calculation resulted in NaN, using expected price as fallback');
      formattedSatsPerToken = expectedPrice ? expectedPrice.toFixed(8) : '0.25000000';
    } else {
      formattedSatsPerToken = rawPrice.toFixed(8);
    }
    
    console.log('  formattedSatsPerToken:', formattedSatsPerToken);
    console.log('  parseFloat result:', parseFloat(formattedSatsPerToken));

    // 🔍 DEBUG: Check what values we're sending
    console.log('🔍 EXPERIMENTAL Values before payload:');
    console.log('  tokensTraded:', tokensTraded, typeof tokensTraded);
    console.log('  satsFromTrade:', satsFromTrade);
    console.log('  satsTraded:', satsTraded);

    // 💾 SAVE TO SUPABASE DATABASE (same as standard flow)
    const tradePayload = {
      transaction_id: formattedTxId,
      price: parseFloat(formattedSatsPerToken), // Actual executed price
      current_price: currentPrice || parseFloat(formattedSatsPerToken), // Market price at time of trade
      expected_price: expectedPrice || null, // Slippage-adjusted expected price
      type: tradeType,
      created_at: createdAtISO,
      tokens_traded: tokensTraded,
      sats_traded: tab === 'buy' ? satsTraded : (satsFromTrade || null),
    };

    console.log('📤 EXPERIMENTAL Payload to Supabase:', tradePayload);

    try {
      const res = await fetch('/api/save-test-trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradePayload),
      });

      const data = await res.json();
      if (res.ok) {
        console.log('✅ EXPERIMENTAL Trade saved to Supabase.');
        console.log('📦 Saved data:', data);
      } else {
        console.warn('⚠️ EXPERIMENTAL Failed to save trade:', data.error);
      }
    } catch (err) {
      console.error('❌ EXPERIMENTAL Error calling save-test-trades API:', err.message);
    }

    setToast({
      message: `✅ ${tab.toUpperCase()} completed successfully (with post conditions)`,
      txId: formattedTxId,
      visible: true,
      status: 'success',
    });

    return {
      success: true,
      txId: formattedTxId,
      tokensTraded,
      satsTraded: satsFromTrade || satsTraded,
      createdAt: createdAtISO,
      type: tradeType,
      pricePerToken: formattedSatsPerToken,
    };

  } catch (err) {
    console.error(`❌ Error in EXPERIMENTAL ${tab} transaction:`, err);

    // 🔄 GRACEFUL FALLBACK: Try standard flow if post conditions fail
    if (err.message && err.message.includes('post')) {
      console.log('🔄 Post conditions failed, falling back to standard flow...');
      return await handleTransactionWithoutPostConditions(tab, amount, setErrorMessage, setToast, expectedPrice, setDuplicateCallback);
    }

    setToast({
      message: `❌ ${tab.toUpperCase()} transaction failed`,
      txId: formattedTxId || '',
      visible: true,
    });

    // Error handled via toast - no top banner needed
    return null;
  }
}

async function waitForConfirmation(txId, timeout = 60000, interval = 3000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`https://api.testnet.hiro.so/extended/v1/tx/${txId}`);
      const data = await res.json();

      if (
        data.tx_status === 'success' ||
        data.tx_status === 'abort' ||
        data.tx_status === 'failed'
      ) {
        return data;
      }
    } catch (err) {
      console.error('🚨 Error checking tx status:', err);
    }
    await new Promise((res) => setTimeout(res, interval));
  }

  throw new Error('⏰ Timed out waiting for transaction confirmation');
}
