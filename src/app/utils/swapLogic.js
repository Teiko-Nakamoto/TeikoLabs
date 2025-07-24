import { request } from '@stacks/connect';
import { uintCV } from '@stacks/transactions';
import { DEX_CONTRACT_ADDRESS, DEX_CONTRACT_NAME, getCurrentPrice, getUserTokensTraded } from './fetchTokenData';

export async function handleTransaction(tab, amount, setErrorMessage) {
  let formattedTxId = '';
  let createdAtISO = null;
  let formattedSatsPerToken = '';
  let tradeType = tab;

  return getUserTokensTraded(async () => {
    const functionName = tab === 'buy' ? 'buy' : 'sell';
    const unit = tab === 'buy' ? parseInt(amount) : Math.round(parseFloat(amount) * 1e8);
    const functionArgs = [uintCV(unit)];

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
      console.log('View transaction:', `https://explorer.hiro.so/txid/${formattedTxId}?chain=testnet`);

      const confirmedData = await waitForConfirmation(txId);

      if (confirmedData.tx_status !== 'success') {
        console.log('❌ Transaction failed:', txId);
        setErrorMessage('Transaction broadcast failed, refreshing page...');
        
        setTimeout(() => {
          window.location.reload();
        }, 2000); // Refresh after 2 seconds

        return null;
      }

      console.log('✅ Transaction confirmed:', txId);

      createdAtISO = confirmedData.block_time_iso || null;

      const currentPrice = await getCurrentPrice();
      const satsPerToken = currentPrice * 1e8;
      formattedSatsPerToken = satsPerToken.toFixed(7);
      console.log(`⚡ Satoshis per Token: ${formattedSatsPerToken}`);

      return; // Nothing to return here, tokensTradedRaw comes from getUserTokensTraded
    } catch (err) {
      if (err.message && err.message.includes('Failed to fetch')) {
        console.log('🚨 Error checking tx status: Failed to fetch. Automatically refreshing the page...');
        setErrorMessage('Transaction broadcast failed, refreshing page...');
        
        setTimeout(() => {
          window.location.reload();
        }, 2000); // Refresh after 2 seconds
      }

      console.error(`❌ Error in ${tab} transaction:`, err);
      setErrorMessage('Transaction failed. Please try again.');
      return null;
    }
  }).then(async (tokensTradedRaw) => {
    // Check for "No token change detected" in console log
    if (tokensTradedRaw === 0) {
      console.log('No token change detected.');
      setErrorMessage('No token change detected, refreshing page...');
      
      setTimeout(() => {
        window.location.reload();
      }, 2000); // Refresh after 2 seconds

      return 0;
    }

    const decimals = 8;
    const tokensTraded = Math.round(tokensTradedRaw / 10 ** decimals);

    if (tokensTradedRaw > 0) {
      console.log(`User bought approximately ${tokensTraded.toLocaleString()} tokens.`);
    } else {
      console.log(`User sold approximately ${tokensTraded.toLocaleString()} tokens.`);
    }

    try {
      const res = await fetch('/api/save-test-trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: formattedTxId,
          price: parseFloat(formattedSatsPerToken),
          type: tradeType,
          created_at: createdAtISO,
          tokens_traded: tokensTraded,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log('✅ Trade saved to Supabase.');
        console.log('📦 Saved data:', data);
        console.log(`💾 Tokens traded saved in backend: ${data.tokens_traded ?? 'not returned'}`);
      } else {
        console.warn('⚠️ Failed to save trade:', data.error);
      }
    } catch (err) {
      console.error('❌ Error calling save-test-trades API:', err.message);
    }

    return tokensTradedRaw;
  });
}

// Your waitForConfirmation helper remains unchanged
async function waitForConfirmation(txId, timeout = 60000, interval = 3000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`https://api.testnet.hiro.so/extended/v1/tx/${txId}`);
      const data = await res.json();

      if (data.tx_status === 'success' || data.tx_status === 'abort' || data.tx_status === 'failed') {
        return data;
      }
    } catch (err) {
      console.error('🚨 Error checking tx status:', err);
    }
    await new Promise(res => setTimeout(res, interval));
  }

  throw new Error('⏰ Timed out waiting for transaction confirmation');
}
