'use client';

import { useState, useEffect } from 'react';
import { handleTransaction } from '../utils/swapLogic';
import TransactionToast from './TransactionToast';
import { getUserTokenBalance, getUserSatsBalance } from '../utils/fetchTokenData';
import './BuySellBox.css';

export default function BuySellBox({ tab, setTab, amount, setAmount, refreshTrades, setErrorMessage }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [toast, setToast] = useState({ message: '', txId: '', visible: false });

  // Auto-close toast after 10 seconds
  useEffect(() => {
    if (toast.visible) {
      const timeout = setTimeout(() => {
        setToast({ message: '', txId: '', visible: false });
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [toast]);

  // Fetch SATS or MAS Sats depending on the active tab
  useEffect(() => {
    const fetchBalance = async () => {
      if (tab === 'sell') {
        const tokenBalance = await getUserTokenBalance(); // base units
        setUserBalance(tokenBalance / 1e8); // Convert to MAS Sats
      } else {
        const satsBalance = await getUserSatsBalance(); // base units
        setUserBalance(Math.floor(satsBalance)); // Whole SATS only
      }
    };
    fetchBalance();
  }, [tab]);

  const handleCloseToast = () => {
    setToast({ message: '', txId: '', visible: false });
  };

  const setAmountPercent = (percent) => {
    if (userBalance && !isNaN(userBalance)) {
      const newAmount = tab === 'sell'
        ? ((userBalance * percent) / 100).toFixed(6)
        : Math.floor((userBalance * percent) / 100).toString();
      setAmount(newAmount);
      setError(null);
    }
  };

  const handleClick = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setError(null);
    setLoading(true);

    const result = await handleTransaction(tab, amount, setErrorMessage, setToast);

    setLoading(false);

    if (result) {
      if (refreshTrades) await refreshTrades();
    } else {
      setError('Transaction failed. Please try again.');
      setErrorMessage('Transaction failed. Please try again.');
    }
  };

  return (
    <div className="buy-sell-box">
      {toast.visible && (
        <TransactionToast message={toast.message} txId={toast.txId} onClose={handleCloseToast} />
      )}

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
        Holdings:{" "}
        {tab === 'sell'
          ? userBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
          : userBalance.toLocaleString()}{" "}
        {tab === 'buy' ? 'SATS' : 'MAS Sats'}
      </div>

      <label htmlFor="amount-input" className="input-label">
        {tab === 'buy' ? 'Buy in ⚡ SATS' : 'Sell in 🪙MAS Sats'}
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

      <div className="quick-buttons">
        {[20, 50, 75, 100].map((percent) => (
          <button
            key={percent}
            onClick={() => setAmountPercent(percent)}
            className={`quick-button ${tab === 'sell' ? 'sell' : ''}`}
          >
            {percent}%
          </button>
        ))}
      </div>

      <button
        onClick={handleClick}
        disabled={loading}
        className={`buy-button ${tab === 'buy' ? 'buy' : 'sell'}`}
      >
        {loading ? 'Processing...' : tab === 'buy' ? '⚡ Buy (SATS)' : '🪙 Sell (MAS Sats)'}
      </button>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
