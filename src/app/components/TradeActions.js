'use client';

import { useState } from 'react';
import { request } from '@stacks/connect';
import { uintCV, contractPrincipalCV } from '@stacks/transactions';
import { supabase } from '../utils/supabaseClient'; // ✅ Import Supabase client

// Helper: Waits for on-chain confirmation of a transaction
async function waitForConfirmation(txId, timeout = 60000, interval = 3000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`https://api.testnet.hiro.so/extended/v1/tx/${txId}`);
      const data = await res.json();

      if (data.tx_status === 'success') {
        console.log('✅ Transaction confirmed on-chain!');
        return data;  // Return the confirmed transaction data
      } else if (data.tx_status === 'abort' || data.tx_status === 'failed') {
        console.error('❌ Transaction failed on-chain:', data.tx_status);
        return data;
      } else {
        console.log('⏳ Waiting for confirmation...');
      }
    } catch (err) {
      console.error('🚨 Error checking transaction status:', err);
    }

    await new Promise((resolve) => setTimeout(resolve, interval));  // Wait before re-checking
  }

  throw new Error('⏰ Timed out waiting for transaction confirmation');
}

// Component: TradeActions UI + logic for Buy/Sell buttons
export default function TradeActions({ contractAddress, dexContract, tokenContract, setToast }) {
  const [amount, setAmount] = useState('');  // Amount entered by the user

  // Updates input field value
  const handleInputChange = (e) => setAmount(e.target.value);

  // Extracts transaction ID from wallet response
  const extractTxId = (response) => {
    console.log('🔍 Full transaction response:', response);
    return (
      response?.txId ||
      response?.txid ||
      response?.result?.txid ||
      response?.result?.txId ||
      null
    );
  };

  // Save transaction details to Supabase
  const saveTransaction = async (txId, type, tokenAmount, stxAmount, outcome, stxFee, fullData) => {
    const { error } = await supabase.from('trades')
      .upsert([{
        tx_id: txId,
        type,
        token_amount: tokenAmount,
        stx_amount: stxAmount,
        stx_fee: stxFee,  // Adding STX fee
        full_data: fullData,  // Adding full transaction data
        created_at: new Date().toISOString()
      }], {
        onConflict: 'tx_id' // Ensures no duplicate transaction entries
      });

    if (error) {
      console.error('❌ Error saving transaction:', error.message);
    } else {
      console.log('✅ Transaction saved to Supabase.');
    }
  };

  // Manages toast + polling confirmation + price update
  const handleTxFlow = async (txId, label, tokenAmount, stxAmount) => {
    setToast({ message: `✅ ${label} transaction submitted`, txId });

    try {
      const confirmed = await waitForConfirmation(txId);
      if (confirmed.tx_status === 'success') {
        setToast({ message: `✅ ${label} confirmed on-chain`, txId });

        // Fetch additional transaction data like STX fee and full data
        const stxFee = parseInt(confirmed.fee_rate || '0');  // Fee in microstacks
        const fullData = confirmed;  // Full transaction data

        // Save full transaction data in Supabase
        await saveTransaction(txId, label, tokenAmount, stxAmount, confirmed.tx_status, stxFee, fullData);
      } else {
        setToast({ message: `❌ ${label} failed`, txId });
      }
    } catch (err) {
      console.error('❌ Confirmation check failed:', err);
      setToast({ message: `❌ ${label} confirmation timeout`, txId });
    }
  };

  // Initiates Buy transaction
  const callBuyFunction = async () => {
    const microStx = parseInt(amount * 1e6); // Convert STX to microstacks

    try {
      const response = await request('stx_callContract', {
        contract: `${contractAddress}.${dexContract}`,
        functionName: 'buy',
        functionArgs: [
          contractPrincipalCV(contractAddress, tokenContract),
          uintCV(microStx),
        ],
        postConditionMode: 'allow',
        postConditions: [],
        network: 'testnet', // Fixed network to 'testnet'
      });

      const txId = extractTxId(response);
      console.log('✅ Buy Tx ID:', txId);
      handleTxFlow(txId, 'Buy', microStx, 0);  // Pass token amount (microStx) and stxAmount as 0 for now
    } catch (err) {
      console.error('❌ Buy failed:', err);
      setToast({ message: '❌ Buy transaction failed', txId: null });
    }
  };

  // Initiates Sell transaction
  const callSellFunction = async () => {
    const tokenAmount = parseInt(amount * 1e6); // Convert to microtokens

    try {
      const response = await request('stx_callContract', {
        contract: `${contractAddress}.${dexContract}`,
        functionName: 'sell',
        functionArgs: [
          contractPrincipalCV(contractAddress, tokenContract),
          uintCV(tokenAmount),
        ],
        postConditionMode: 'allow',
        postConditions: [],
        network: 'testnet', // Fixed network to 'testnet'
      });

      const txId = extractTxId(response);
      console.log('✅ Sell Tx ID:', txId);
      handleTxFlow(txId, 'Sell', tokenAmount, 0);  // Pass token amount (tokenAmount) and stxAmount as 0 for now
    } catch (err) {
      console.error('❌ Sell failed:', err);
      setToast({ message: '❌ Sell transaction failed', txId: null });
    }
  };

  // Render TradeActions UI
  return (
    <div className="trade-box">
      <label htmlFor="amount">Enter Amount</label>
      <input
        type="number"
        id="amount"
        value={amount}
        onChange={handleInputChange}
        placeholder="0.00"
      />

      <div className="button-row">
        <button className="buy-button" onClick={callBuyFunction}>Buy</button>
        <button className="sell-button" onClick={callSellFunction}>Sell</button>
      </div>
    </div>
  );
}
