'use client'; // Enables React client-side features like useState, fetch, etc.

// ----- Imports -----
import './trade-token.css'; // Import page styles
import Header from '../components/header'; // Header navigation bar
import TransactionToast from '../components/TransactionToast'; // Toast notification for transaction status
import TradeActions from '../components/TradeActions'; // Component that handles buy/sell button and wallet logic
import { useState } from 'react'; // React hook to manage state

// ----- Wait for transaction confirmation from the blockchain -----
async function waitForConfirmation(txId, timeout = 60000, interval = 3000) {
  const start = Date.now(); // Note when we started checking

  // Keep checking every few seconds until we hit timeout
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`https://api.testnet.hiro.so/extended/v1/tx/${txId}`);
      const data = await res.json();

      // Stop checking once the transaction is confirmed or failed
      if (data.tx_status === 'success') return data;
      if (data.tx_status === 'abort' || data.tx_status === 'failed') return data;
    } catch (err) {
      console.error('🚨 Error checking tx status:', err); // Log any API errors
    }

    // Wait for 3 seconds before checking again
    await new Promise(res => setTimeout(res, interval));
  }

  // If nothing is returned after 60 seconds, throw timeout error
  throw new Error('⏰ Timed out waiting for transaction confirmation');
}

// ----- Main Page Component -----
export default function TradeTokenPage() {
  // Toast message and transaction ID for feedback popup
  const [toast, setToast] = useState({ message: '', txId: null });

  // Contract info for the token and DEX
  const contractAddress = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';
  const dexContract = 'plum-aardvark-dex';
  const tokenContract = 'plum-aardvark';

  // This function is triggered by TradeActions after submitting a buy/sell
  const handleToastAndPoll = async ({ message, txId }) => {
    // Show initial toast: "Transaction submitted..."
    setToast({ message, txId });

    try {
      // Wait for the transaction to be confirmed on the blockchain
      const confirmed = await waitForConfirmation(txId);

      // ✅ Log the full confirmed transaction data BEFORE saving to the backend
      console.log('📦 Confirmed Transaction Details:', confirmed);

      // Show final toast message based on transaction result
      setToast({
        message: confirmed.tx_status === 'success'
          ? '✅ Transaction confirmed!'
          : '❌ Transaction failed',
        txId,
      });

      // ⏳ Wait 2 seconds to make sure smart contract logs are fully available
      await new Promise(res => setTimeout(res, 2000));

      // ✅ Now that it's confirmed, call your backend route to fetch & store trades
const saveResponse = await fetch('/api/save-trade', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(confirmed),
});

const saveResult = await saveResponse.json();
console.log('💾 Backend save result:', saveResult.message || saveResult.error);


    } catch (err) {
      // If confirmation fails (timeout or error), show error toast
      console.error('❌ Confirmation error:', err);
      setToast({ message: '❌ Transaction confirmation failed', txId });
    }
  };

  // ----- What gets shown on screen -----
  return (
    <>
      <Header /> {/* Navigation bar at the top */}

      {/* Show the toast if there's a transaction message */}
      {toast.message && (
        <TransactionToast
          message={toast.message}
          txId={toast.txId}
          onClose={() => setToast({ message: '', txId: null })} // Reset toast when closed
        />
      )}

      <main className="trade-container">
        <h1>Trade Token</h1>

        {/* Render buy/sell component and pass in contract info + toast handler */}
        <TradeActions
          contractAddress={contractAddress}
          dexContract={dexContract}
          tokenContract={tokenContract}
          setToast={handleToastAndPoll} // This tells TradeActions how to update the toast and poll
        />
      </main>
    </>
  );
}
