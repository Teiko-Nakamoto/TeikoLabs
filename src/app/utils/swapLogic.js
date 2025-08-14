import { request } from '@stacks/connect';
import { Cl } from '@stacks/transactions';

// 🔧 Transaction queue to prevent broadcast conflicts
let transactionQueue = [];
let isProcessingQueue = false;

// 🔧 Queue transaction for processing
async function queueTransaction(transactionParams, useSmartRetry = true) {
  return new Promise((resolve, reject) => {
    transactionQueue.push({
      params: transactionParams,
      useSmartRetry,
      resolve,
      reject
    });
    
    if (!isProcessingQueue) {
      processTransactionQueue();
    }
  });
}

// 🔧 Process transaction queue sequentially
async function processTransactionQueue() {
  if (isProcessingQueue || transactionQueue.length === 0) {
    return;
  }
  
  isProcessingQueue = true;
  
  while (transactionQueue.length > 0) {
    const { params, useSmartRetry, resolve, reject } = transactionQueue.shift();
    
    try {
      console.log('📋 Processing queued transaction...');
      const result = await submitTransactionWithRetry(params, 2, useSmartRetry);
      resolve(result);
    } catch (error) {
      reject(error);
    }
    
    // Small delay between transactions to prevent broadcast conflicts
    if (transactionQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  isProcessingQueue = false;
}
import {
  DEX_CONTRACT_ADDRESS,
  DEX_CONTRACT_NAME,
  SATS_CONTRACT_ADDRESS,
  SATS_CONTRACT_NAME,
  TOKEN_CONTRACT_NAME,
} from './fetchTokenData';

// 🔧 Enhanced wallet readiness check for transactions
async function ensureWalletReady() {
  try {
    // Check if Stacks Connect is available
    if (typeof window === 'undefined' || !window.StacksProvider) {
      throw new Error('Stacks Connect not available');
    }

    // Check if user is connected
    const { isConnected, getLocalStorage } = await import('@stacks/connect');
    const connected = await isConnected();
    
    if (!connected) {
      throw new Error('Wallet not connected');
    }

    // Verify we have a valid address
    const data = getLocalStorage();
    const stxAddr = data?.addresses?.stx?.[0]?.address;
    
    if (!stxAddr) {
      throw new Error('No wallet address found');
    }

    // Check if connection is recent (within last 5 minutes)
    const lastConnectionTime = localStorage.getItem('lastConnectionTime');
    if (lastConnectionTime) {
      const timeSinceConnection = Date.now() - parseInt(lastConnectionTime);
      if (timeSinceConnection > 5 * 60 * 1000) { // 5 minutes
        console.log('⚠️ Connection may be stale, reconnecting...');
        throw new Error('Connection stale, please reconnect');
      }
    }

    return stxAddr;
  } catch (error) {
    console.error('❌ Wallet readiness check failed:', error.message);
    throw error;
  }
}

// 🔧 Network health and broadcast optimization
async function checkNetworkHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://api.testnet.hiro.so/v2/info', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('🚨 Network check failed:', error.message);
    return false;
  }
}

// 🔧 Get optimal broadcast endpoint
async function getOptimalBroadcastEndpoint() {
  const endpoints = [
    'https://api.testnet.hiro.so',
    'https://stacks-node-api.testnet.stacks.co',
    'https://api.testnet.hiro.so/v2'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${endpoint}/v2/info`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Optimal broadcast endpoint found: ${endpoint}`);
        return endpoint;
      }
    } catch (error) {
      console.log(`❌ Endpoint ${endpoint} failed:`, error.message);
    }
  }
  
  console.log('⚠️ Using default endpoint');
  return 'https://api.testnet.hiro.so';
}

// 🔧 Enhanced transaction submission with broadcast optimization
async function submitTransactionWithRetry(transactionParams, maxRetries = 2, useSmartRetry = true) {
  let lastError = null;
  
  // If smart retry is disabled, only try once
  const actualMaxRetries = useSmartRetry ? maxRetries : 0;
  
  // Get optimal broadcast endpoint
  const optimalEndpoint = await getOptimalBroadcastEndpoint();
  
  for (let attempt = 0; attempt <= actualMaxRetries; attempt++) {
    try {
      console.log(`🚀 Submitting transaction (attempt ${attempt + 1}/${actualMaxRetries + 1})...`);
      
      // Ensure wallet is ready before each attempt
      await ensureWalletReady();
      
      // Check network health before each attempt
      const isNetworkHealthy = await checkNetworkHealth();
      if (!isNetworkHealthy && attempt > 0) {
        console.log('⚠️ Network health check failed, waiting longer...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Add a small delay between retries (only if smart retry is enabled)
      if (attempt > 0 && useSmartRetry) {
        console.log('⏳ Smart retry enabled - waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Enhanced transaction request with better error handling
      const response = await request('stx_callContract', {
        ...transactionParams,
        // Use optimal endpoint if available
        ...(optimalEndpoint && { endpoint: optimalEndpoint })
      });
      
      console.log('✅ Transaction submitted successfully:', response);
      return response;
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Transaction attempt ${attempt + 1} failed:`, error.message);
      
      // Don't retry on certain errors
      if (error.message.includes('User rejected') || 
          error.message.includes('cancelled') ||
          error.message.includes('not connected')) {
        throw error;
      }
      
      // Enhanced error handling for broadcast failures
      if (error.message.includes('broadcast') || error.message.includes('network')) {
        console.log('🌐 Broadcast error detected, trying alternative endpoint...');
        // Try with different endpoint on next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Only retry if smart retry is enabled
      if (attempt < actualMaxRetries && useSmartRetry) {
        console.log('🔄 Smart retry enabled - retrying transaction...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else if (!useSmartRetry) {
        console.log('🚫 Smart retry disabled - not retrying automatically');
      }
    }
  }
  
  // Provide more specific error messages
  if (lastError) {
    if (lastError.message.includes('broadcast') || lastError.message.includes('network')) {
      throw new Error('Transaction failed to broadcast to network. Please check your connection and try again.');
    } else if (lastError.message.includes('User rejected')) {
      throw new Error('Transaction was cancelled by user.');
    } else if (lastError.message.includes('not connected')) {
      throw new Error('Wallet not connected. Please connect your wallet and try again.');
    } else {
      throw lastError;
    }
  }
  
  throw new Error('Transaction failed after all retries. Please try again.');
}



export async function handleTransaction(tab, amount, setErrorMessage, setToast, expectedPrice, setDuplicateCallback = null, slippageProtection = null, estimatedOutput = null, currentPrice = null, tokenId = null, useSmartRetry = true, network = 'testnet') {
  // 🧪 EXPERIMENTAL: Router function to choose between flows
  if (slippageProtection && slippageProtection.enabled && estimatedOutput) {
    console.log('🧪 Using EXPERIMENTAL post-conditions flow');
    if (!estimatedOutput) {
      console.error('❌ ERROR: estimatedOutput is required for slippage protection!');
      return null;
    }
    return await handleTransactionWithPostConditions(tab, amount, setErrorMessage, setToast, expectedPrice, setDuplicateCallback, slippageProtection, estimatedOutput, currentPrice, useSmartRetry, network);
  } else {
    console.log('✅ Using standard transaction flow');
    return await handleTransactionWithoutPostConditions(tab, amount, setErrorMessage, setToast, expectedPrice, setDuplicateCallback, currentPrice, useSmartRetry, network);
  }
}

// ✅ STANDARD FLOW: No post conditions (existing logic)
async function handleTransactionWithoutPostConditions(tab, amount, setErrorMessage, setToast, expectedPrice, setDuplicateCallback = null, currentPrice = null, useSmartRetry = true, network = 'testnet') {
  let formattedTxId = '';
  let createdAtISO = null;
  let formattedSatsPerToken = '';
  let tradeType = tab;

  const functionName = tab === 'buy' ? 'buy' : 'sell';
  const satsTraded = tab === 'buy' ? parseInt(amount) : Math.round(parseFloat(amount) * 1e8);
  const functionArgs = [Cl.uint(satsTraded)];

  try {
    console.log('⏳ Standard Transaction Pending...');

    // No post conditions - standard flow
    const postConditions = [];
    const postConditionMode = 'allow';

    const transactionParams = {
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName,
      functionArgs,
      network,
    };

    console.log('🚀 About to send request with:', {
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName,
      functionArgs,
      network
    });

    // 🔧 Use enhanced transaction submission with queue and retry logic
    const response = await queueTransaction(transactionParams, useSmartRetry);
    
    console.log('✅ Request completed, response:', response);

    const { txId } = response;
    formattedTxId = txId;

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

    const explorerUrl = network === 'mainnet' 
      ? `https://explorer.stacks.co/txid/${formattedTxId}`
      : `https://explorer.hiro.so/txid/${formattedTxId}?chain=${network}`;
    console.log('View transaction:', explorerUrl);

    setToast({
      message: `🔄 ${tab.toUpperCase()} transaction submitted`,
      txId: formattedTxId,
      visible: true,
      status: 'pending',
    });

    const confirmedData = await waitForConfirmation(formattedTxId);

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

    // ✅ No duplicate check needed - using blockchain APIs only

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
        const tokenTransferEvent = confirmedData.events.find(event => 
          event.event_type === 'ft_transfer_event' && 
          event.asset?.asset_id === `${DEX_CONTRACT_ADDRESS}.${DEX_CONTRACT_NAME}::dear-cyan`
        );
        
        if (tokenTransferEvent) {
          tokensTraded = parseInt(tokenTransferEvent.asset.amount);
          formattedSatsPerToken = (satsTraded / tokensTraded).toFixed(8);
        }
      }
    } else {
      if (Array.isArray(confirmedData.events)) {
        const sbtcTransferEvent = confirmedData.events.find(event => 
          event.event_type === 'ft_transfer_event' && 
          event.asset?.asset_id === 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token::sbtc-token'
        );
        
        if (sbtcTransferEvent) {
          satsReceived = parseInt(sbtcTransferEvent.asset.amount);
          formattedSatsPerToken = (satsReceived / parseInt(amount)).toFixed(8);
        }
      }
    }

    return {
      txId: formattedTxId,
      createdAt: createdAtISO,
      satsPerToken: formattedSatsPerToken,
      tradeType,
      tokensTraded,
      satsReceived,
      confirmedData
    };

  } catch (error) {
    console.error('❌ Transaction error:', error);
    
    // Enhanced error handling
    let errorMessage = 'Transaction failed';
    
    if (error.message.includes('not connected')) {
      errorMessage = 'Please connect your wallet first';
    } else if (error.message.includes('User rejected')) {
      errorMessage = 'Transaction was cancelled';
    } else if (error.message.includes('Connection stale')) {
      errorMessage = 'Please reconnect your wallet';
    } else if (error.message.includes('insufficient balance')) {
      errorMessage = 'Insufficient balance for transaction';
      } else {
      errorMessage = error.message || 'Transaction failed';
    }

    setErrorMessage(errorMessage);
    setToast({
      message: `❌ ${tab.toUpperCase()} transaction failed`,
      txId: formattedTxId || '',
      visible: true,
      status: 'failed',
    });

    // Error handled via toast - no top banner needed
    return null;
  }
}

// 🧪 EXPERIMENTAL FLOW: With post conditions for slippage protection
async function handleTransactionWithPostConditions(tab, amount, setErrorMessage, setToast, expectedPrice, setDuplicateCallback = null, slippageProtection, estimatedOutput, currentPrice = null, useSmartRetry = true, network = 'testnet') {
  let formattedTxId = '';
  let createdAtISO = null;
  let formattedSatsPerToken = '';
  let tradeType = tab;

  const functionName = tab === 'buy' ? 'buy' : 'sell';
  const satsTraded = tab === 'buy' ? parseInt(amount) : Math.round(parseFloat(amount) * 1e8);
  const functionArgs = [Cl.uint(satsTraded)];

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
          .ft('SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token', 'sbtc-token');
        
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
          .ft('SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token', 'sbtc-token');
        
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
      network
    });

    const transactionParams = {
      contract: `${DEX_CONTRACT_ADDRESS}.${DEX_CONTRACT_NAME}`,
      functionName,
      functionArgs,
      postConditionMode,
      postConditions,
      network,
    };

    // 🔧 Use enhanced transaction submission with retry logic
    const response = await submitTransactionWithRetry(transactionParams);
    
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

    const explorerUrl = network === 'mainnet' 
      ? `https://explorer.stacks.co/txid/${formattedTxId}`
      : `https://explorer.hiro.so/txid/${formattedTxId}?chain=${network}`;
    console.log('View transaction:', explorerUrl);

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

    // ✅ Transaction completed - no database save needed (using blockchain APIs)



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
