import { request } from '@stacks/connect';
import { uintCV } from '@stacks/transactions';

export async function handleLockUnlockTransaction(action, amount, dexInfo, setErrorMessage, setToast, setDuplicateCallback = null) {
  let formattedTxId = '';
  let createdAtISO = null;

  // Parse the dexInfo to get contract address and name
  const [dexAddress, dexName] = dexInfo.split('.');
  
  // Convert amount to micro units (8 decimal places)
  const amountInMicroUnits = Math.round(parseFloat(amount) * 1e8);
  const functionArgs = [uintCV(amountInMicroUnits)];

  // Map action to correct function name
  const functionName = action === 'lock' ? 'lock-tokens' : 'unlock-tokens';

  try {
    console.log(`⏳ ${action.charAt(0).toUpperCase() + action.slice(1)} Transaction Pending...`);

    // No post conditions - standard flow
    const postConditions = [];
    const postConditionMode = 'allow';

    console.log('🚀 About to send request with:', {
      contract: `${dexAddress}.${dexName}`,
      functionName,
      functionArgs,
      postConditionMode,
      postConditions: postConditions.length,
      network: 'testnet'
    });

    const response = await request('stx_callContract', {
      contract: `${dexAddress}.${dexName}`,
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
    const lastTx = localStorage.getItem('lastLockUnlockTx');
    if (lastTx === formattedTxId) {
      console.warn('⚠️ Duplicate transaction detected.');
      if (setDuplicateCallback) {
        setDuplicateCallback();
      }
      return null;
    }
    localStorage.setItem('lastLockUnlockTx', formattedTxId);

    console.log('View transaction:', `https://explorer.hiro.so/txid/${formattedTxId}?chain=testnet`);

    setToast({
      message: `🔄 ${action.charAt(0).toUpperCase() + action.slice(1)} transaction submitted`,
      txId: formattedTxId,
      visible: true,
      status: 'pending',
    });

    // Wait for confirmation
    const confirmedData = await waitForConfirmation(txId);

    if (confirmedData.tx_status !== 'success') {
      console.log('❌ Transaction failed:', txId);
      setToast({
        message: `❌ ${action.charAt(0).toUpperCase() + action.slice(1)} transaction failed`,
        txId: formattedTxId,
        visible: true,
        status: 'error',
      });
      return null;
    }

    console.log('✅ Transaction confirmed:', confirmedData);
    setToast({
      message: `✅ ${action.charAt(0).toUpperCase() + action.slice(1)} transaction successful!`,
      txId: formattedTxId,
      visible: true,
      status: 'success',
    });

    return true;
  } catch (err) {
    if (err.message && err.message.includes('Failed to fetch')) {
      console.log('🚨 Error checking tx status: Failed to fetch.');
      setToast({
        message: `❌ ${action.charAt(0).toUpperCase() + action.slice(1)} transaction failed`,
        txId: formattedTxId || '',
        visible: true,
        status: 'error',
      });
    }

    console.error(`❌ Error in ${action} transaction:`, err);

    setToast({
      message: `❌ ${action.charAt(0).toUpperCase() + action.slice(1)} transaction failed`,
      txId: formattedTxId || '',
      visible: true,
      status: 'error',
    });

    return null;
  }
}

async function waitForConfirmation(txId, timeout = 60000, interval = 3000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(`https://api.testnet.hiro.so/extended/v1/tx/${txId}`);
      const data = await response.json();
      
      if (data.tx_status === 'success' || data.tx_status === 'abort_by_response') {
        return data;
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (error) {
      console.log('Error checking transaction status:', error);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  throw new Error('Transaction confirmation timeout');
} 