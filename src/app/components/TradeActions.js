'use client';

import { useState } from 'react';
import { request } from '@stacks/connect';
import { uintCV, contractPrincipalCV } from '@stacks/transactions';

// ✅ New: call backend API route instead of frontend fetch
async function callBackendSync() {
  try {
    const res = await fetch('/api/fetch-dex-transactions');
    const data = await res.json();
    console.log('📥 API Sync result:', data);
  } catch (err) {
    console.error('❌ API Sync failed:', err);
  }
}

// ✅ Polls the Hiro API until tx is confirmed or timeout occurs
async function waitForConfirmation(txId, timeout = 60000, interval = 3000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`https://api.testnet.hiro.so/extended/v1/tx/${txId}`);
      const data = await res.json();

      if (data.tx_status === 'success') return data;
      if (data.tx_status === 'abort' || data.tx_status === 'failed') return data;
    } catch (err) {
      console.error('⛔ Error checking status:', err);
    }
    await new Promise(res => setTimeout(res, interval));
  }
  throw new Error('⏰ Confirmation timeout');
}

export default function TradeActions({ contractAddress, dexContract, tokenContract, setToast }) {
  const [amount, setAmount] = useState('');

  const extractTxId = (response) =>
    response?.txId || response?.txid || response?.result?.txid || response?.result?.txId || null;

  const handleInputChange = (e) => setAmount(e.target.value);

  const handleTxFlow = async (txId, label) => {
    setToast({ message: `✅ ${label} transaction submitted`, txId });

    try {
      const confirmed = await waitForConfirmation(txId);
      if (confirmed.tx_status === 'success') {
        setToast({ message: `✅ ${label} confirmed on-chain`, txId });

        // ✅ Replaced: call backend API to avoid CORS + rate limit issues
        await callBackendSync();
      } else {
        setToast({ message: `❌ ${label} failed`, txId });
      }
    } catch (err) {
      setToast({ message: `❌ ${label} confirmation timeout`, txId });
    }
  };

  const callBuyFunction = async () => {
    const microStx = parseInt(amount * 1e6);
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
        network: 'testnet',
      });
      const txId = extractTxId(response);
      handleTxFlow(txId, 'Buy');
    } catch (err) {
      setToast({ message: '❌ Buy transaction failed', txId: null });
    }
  };

  const callSellFunction = async () => {
    const tokenAmount = parseInt(amount * 1e6);
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
        network: 'testnet',
      });
      const txId = extractTxId(response);
      handleTxFlow(txId, 'Sell');
    } catch (err) {
      setToast({ message: '❌ Sell transaction failed', txId: null });
    }
  };

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
