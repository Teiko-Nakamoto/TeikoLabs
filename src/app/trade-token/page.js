'use client';

// =============================
// Imports
// =============================
import './trade-token.css';
import Header from '../components/header';
import TransactionToast from '../components/TransactionToast';
import TradeActions from '../components/TradeActions';
import { useState } from 'react';
import { supabase } from '../utils/supabaseClient'; // ✅ Import Supabase client

// =============================
// Utility: Polling transaction status
// =============================

async function waitForConfirmation(txId, timeout = 60000, interval = 3000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`https://api.testnet.hiro.so/extended/v1/tx/${txId}`);
      const data = await res.json();

      if (data.tx_status === 'success') {
        console.log('✅ Transaction confirmed on-chain!');
        return data;
      } else if (data.tx_status === 'abort' || data.tx_status === 'failed') {
        console.error('❌ Transaction failed on-chain:', data.tx_status);
        return data;
      } else {
        console.log('⏳ Waiting for confirmation...');
      }
    } catch (err) {
      console.error('🚨 Error checking transaction status:', err);
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error('⏰ Timed out waiting for transaction confirmation');
}

// =============================
// Main Trade Token Page Component
// =============================

export default function TradeTokenPage() {
  const [toast, setToast] = useState({ message: '', txId: null });

  const contractAddress = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';
  const dexContract = 'plum-aardvark-dex';
  const tokenContract = 'plum-aardvark';

  // ✅ Save transaction to Supabase after confirmation
  const saveTransaction = async (txId, type, tokenAmount, stxAmount, outcome) => {
    const { error } = await supabase.from('trades')
      .upsert([
        {
          tx_id: txId,
          type,
          token_amount: tokenAmount,
          stx_amount: stxAmount,
          created_at: new Date().toISOString()
        }
      ], {
        onConflict: 'tx_id' // ✅ tx_id is the primary key (or unique)
      });

    if (error) {
      console.error('❌ Error saving transaction:', error.message);
    } else {
      console.log('✅ Transaction saved to Supabase.');
    }
  };

  // ✅ Handles toast and Supabase insert after confirmation
  const handleToastAndPoll = async ({ message, txId, type, tokenAmount, stxAmount }) => {
    setToast({ message, txId });

    try {
      const data = await waitForConfirmation(txId);
      const outcome = data.tx_status;

      setToast({
        message: outcome === 'success' ? '✅ Transaction confirmed!' : '❌ Transaction failed',
        txId
      });

      await saveTransaction(txId, type, tokenAmount, stxAmount, outcome);
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
