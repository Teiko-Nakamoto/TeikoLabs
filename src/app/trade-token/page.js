'use client';

import './trade-token.css';
import Header from '../components/header';
import TransactionToast from '../components/TransactionToast';
import TradeActions from '../components/TradeActions';
import { useState } from 'react';

// Poll Hiro until the transaction is confirmed
async function waitForConfirmation(txId, timeout = 60000, interval = 3000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`https://api.testnet.hiro.so/extended/v1/tx/${txId}`);
      const data = await res.json();

      if (data.tx_status === 'success') return data;
      if (data.tx_status === 'abort' || data.tx_status === 'failed') return data;
    } catch (err) {
      console.error('🚨 Error checking tx status:', err);
    }

    await new Promise(res => setTimeout(res, interval));
  }

  throw new Error('⏰ Timed out waiting for transaction confirmation');
}

// Main Page
export default function TradeTokenPage() {
  const [toast, setToast] = useState({ message: '', txId: null });

  const contractAddress = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';
  const dexContract = 'plum-aardvark-dex';
  const tokenContract = 'plum-aardvark';

  const handleToastAndPoll = async ({ message, txId }) => {
    setToast({ message, txId });

    try {
      const confirmed = await waitForConfirmation(txId);

      setToast({
        message: confirmed.tx_status === 'success'
          ? '✅ Transaction confirmed!'
          : '❌ Transaction failed',
        txId,
      });

      // ✅ Trigger backend sync after confirmation
      await fetch('/api/fetch-dex-transactions');
    } catch (err) {
      console.error('❌ Confirmation error:', err);
      setToast({ message: '❌ Transaction confirmation failed', txId });
    }
  };

  return (
    <>
      <Header />

      {toast.message && (
        <TransactionToast
          message={toast.message}
          txId={toast.txId}
          onClose={() => setToast({ message: '', txId: null })}
        />
      )}

      <main className="trade-container">
        <h1>Trade Token</h1>

        <TradeActions
          contractAddress={contractAddress}
          dexContract={dexContract}
          tokenContract={tokenContract}
          setToast={handleToastAndPoll}
        />
      </main>
    </>
  );
}
