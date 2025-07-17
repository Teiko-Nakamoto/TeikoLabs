'use client';

import { useState } from 'react';
import { request } from '@stacks/connect';
import { uintCV, contractPrincipalCV } from '@stacks/transactions';

// This component is responsible ONLY for sending the transaction to the blockchain.
// It should NOT wait for confirmation or call the backend.

export default function TradeActions({ contractAddress, dexContract, tokenContract, setToast }) {
  const [amount, setAmount] = useState(''); // Track user input amount

  // Extract txId from different response formats
  const extractTxId = (response) => {
    console.log('🧾 TX Response:', response); // Helpful for debugging
    return (
      response?.txId ||
      response?.txid ||
      response?.result?.txid ||
      response?.result?.txId ||
      null
    );
  };

  // Handle input field change
  const handleInputChange = (e) => setAmount(e.target.value);

  // Sends the Buy transaction to the user's wallet
  const callBuyFunction = async () => {
    const microStx = parseInt(amount * 1e6); // Convert STX to micro-STX
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

      // ✅ Tell the parent page the txId so it can handle confirmation and backend calls
      setToast({ message: '✅ Buy transaction submitted', txId });
    } catch (err) {
      console.error('❌ Buy transaction failed:', err);
      setToast({ message: '❌ Buy transaction failed', txId: null });
    }
  };

  // Sends the Sell transaction to the user's wallet
  const callSellFunction = async () => {
    const tokenAmount = parseInt(amount * 1e6); // Convert to micro-tokens
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

      // ✅ Tell the parent page the txId so it can handle confirmation and backend calls
      setToast({ message: '✅ Sell transaction submitted', txId });
    } catch (err) {
      console.error('❌ Sell transaction failed:', err);
      setToast({ message: '❌ Sell transaction failed', txId: null });
    }
  };

  // UI layout for trade actions
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
