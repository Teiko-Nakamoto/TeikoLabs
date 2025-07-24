'use client';

import { useState } from 'react';
import { handleTransaction } from '../utils/swapLogic';
import './BuySellBox.css';

export default function BuySellBox({ tab, setTab, amount, setAmount, refreshTrades, setErrorMessage }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Example balance, replace with real balance if available
  const userBalance = 15000000; // Example balance for now, replace with actual balance if needed

  // Function to handle quick amount selection (e.g., 20%, 50%, etc.)
  const setAmountPercent = (percent) => {
    if (userBalance && !isNaN(userBalance)) {
      const newAmount = ((userBalance * percent) / 100).toFixed(0);
      setAmount(newAmount);
      setError(null);
    }
  };

  // Function to handle Buy/Sell transaction click
  const handleClick = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setError(null);
    setLoading(true);

    // Pass setErrorMessage to handleTransaction
    const result = await handleTransaction(tab, amount, setErrorMessage);

    setLoading(false);

    if (result) {
      if (refreshTrades) {
        await refreshTrades();
      }
    } else {
      setError('Transaction failed. Please try again.');
      setErrorMessage('Transaction failed. Please try again.');
      setTimeout(() => {
        window.location.reload();  // Auto-refresh the page
      }, 2000); // Refresh after 2 seconds
    }
  };

  return (
    <div className="buy-sell-box">
      <div className="tab-row">
        <button
          className={`tab-button active ${tab === 'buy' ? 'buy' : ''}`}
          onClick={() => {
            setTab('buy');
            setAmount('');
            setError(null);
          }}
        >
          ⚡ Buy
        </button>
        <button
          className={`tab-button active ${tab === 'sell' ? 'sell' : ''}`}
          onClick={() => {
            setTab('sell');
            setAmount('');
            setError(null);
          }}
        >
          🪙 Sell
        </button>
      </div>

      <div className="current-balance">
        Current Balance: {userBalance.toLocaleString()} {tab === 'buy' ? 'SATS' : 'TOKEN'}
      </div>

      <label htmlFor="amount-input" className="input-label">
        {tab === 'buy' ? 'Buy in ⚡ SATS' : 'Sell in 🪙 TOKENS'}
      </label>
      <input
        id="amount-input"
        type="number"
        placeholder="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="sats-input"
        disabled={loading}
      />

      {tab === 'buy' && (
        <div className="quick-buttons">
          {[20, 50, 75, 100].map((percent) => (
            <button
              key={percent}
              onClick={() => setAmountPercent(percent)}
              className="quick-button"
            >
              {percent}%
            </button>
          ))}
        </div>
      )}

      {tab === 'sell' && (
        <div className="quick-buttons">
          {[20, 50, 75, 100].map((percent) => (
            <button
              key={percent}
              onClick={() => setAmountPercent(percent)}
              className="quick-button sell"
            >
              {percent}%
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handleClick}
        disabled={loading}
        className={`buy-button ${tab === 'buy' ? 'buy' : 'sell'}`}
      >
        {loading ? 'Processing...' : tab === 'buy' ? '⚡ Buy (SATS)' : '🪙 Sell (TOKEN)'}
      </button>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
