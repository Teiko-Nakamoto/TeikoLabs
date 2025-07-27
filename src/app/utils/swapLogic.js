import { request } from '@stacks/connect';
import { uintCV } from '@stacks/transactions';
import {
  DEX_CONTRACT_ADDRESS,
  DEX_CONTRACT_NAME,
  getCurrentPrice,
} from './fetchTokenData';

export async function handleTransaction(tab, amount, setErrorMessage, setToast) {
  let formattedTxId = '';
  let createdAtISO = null;
  let formattedSatsPerToken = '';
  let tradeType = tab;

  const functionName = tab === 'buy' ? 'buy' : 'sell';
  const satsTraded = tab === 'buy' ? parseInt(amount) : Math.round(parseFloat(amount) * 1e8);
  const functionArgs = [uintCV(satsTraded)];

  try {
    console.log('⏳ Transaction Pending...');

    const response = await request('stx_callContract', {
      contract: `${DEX_CONTRACT_ADDRESS}.${DEX_CONTRACT_NAME}`,
      functionName,
      functionArgs,
      postConditionMode: 'allow',
      postConditions: [],
      network: 'testnet',
    });

    const { txid: txId } = response;
    formattedTxId = `0x${txId}`;

    // ✅ Check if this txId is already in localStorage
    const lastTx = localStorage.getItem('lastTx');
    if (lastTx === formattedTxId) {
      console.warn('⚠️ Duplicate transaction detected.');
      setErrorMessage('Duplicate transaction detected. Please try again.');
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
      setErrorMessage('Transaction broadcast failed.');

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
      setErrorMessage('This transaction was already processed.');
      return null;
    }

    console.log('✅ Transaction confirmed:', txId);
    console.log('📄 Full transaction data:', confirmedData);

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
      price: parseFloat(formattedSatsPerToken),
      type: tradeType,
      created_at: createdAtISO,
      tokens_traded: tokensTraded,
      sats_traded: tab === 'buy' ? satsTraded : satsReceived || null,
    };

    console.log('📤 Payload to Supabase:', tradePayload);

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
      setErrorMessage('Transaction broadcast failed.');

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

    setErrorMessage('Transaction failed. Please try again.');
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
