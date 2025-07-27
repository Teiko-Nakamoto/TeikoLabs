'use client';

import { useState, useEffect } from 'react';
import { handleTransaction } from '../utils/swapLogic';
import TransactionToast from './TransactionToast';
import { getUserTokenBalance, getUserSatsBalance, calculateEstimatedTokensForSats, calculateEstimatedSatsForTokens, getCurrentPrice } from '../utils/fetchTokenData';
import ProfitLoss from './ProfitLoss';
import TokenStats from './TokenStats';
import './BuySellBox.css';

export default function BuySellBox({ tab, setTab, amount, setAmount, refreshTrades, setErrorMessage, setPendingTransaction, setIsSuccessfulTransaction, trades, activeSection, setActiveSection }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [estimatedSats, setEstimatedSats] = useState(0);
  const [estimatedTokens, setEstimatedTokens] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);

  const [toast, setToast] = useState({ message: '', txId: '', visible: false, status: 'pending' });
  const [autoRefreshOnFail, setAutoRefreshOnFail] = useState(() => {
    // Get saved preference or default to true
    const saved = localStorage.getItem('autoRefreshOnFail');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save auto-refresh preference whenever it changes
  useEffect(() => {
    localStorage.setItem('autoRefreshOnFail', JSON.stringify(autoRefreshOnFail));
  }, [autoRefreshOnFail]);

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

  // Get current price from last trade
  useEffect(() => {
    if (trades && trades.length > 0) {
      // Get the last trade price
      const lastTrade = trades[trades.length - 1];
      const chartPrice = lastTrade.price;
      console.log('🔍 Using chart price from last trade:', chartPrice);
      setCurrentPrice(chartPrice);
    } else {
      // Fallback to calculated price if no trades
      const fetchCurrentPrice = async () => {
        console.log('🔍 No trades found, fetching calculated price...');
        const price = await getCurrentPrice();
        console.log('🔍 Received calculated price:', price);
        setCurrentPrice(price);
      };
      fetchCurrentPrice();
    }
  }, [trades]);

  // Calculate estimated values when amount changes
  useEffect(() => {
    const calculateEstimates = async () => {
      // Remove commas from amount for calculation
      const cleanAmount = amount.replace(/,/g, '');
      
      console.log('🔍 Calculation inputs:', {
        cleanAmount,
        amountValue: Number(cleanAmount),
        tab,
        currentPrice,
        isNaN: isNaN(cleanAmount)
      });
      
      if (cleanAmount && !isNaN(cleanAmount) && Number(cleanAmount) > 0 && currentPrice > 0) {
        const amountValue = Number(cleanAmount);
        
        if (tab === 'sell') {
          // Calculate estimated sats for token sell
          const estimated = calculateEstimatedSatsForTokens(amountValue, currentPrice);
          console.log('🔍 Sell estimate result:', estimated);
          setEstimatedSats(estimated);
        } else {
          // Calculate estimated tokens for sats buy
          const estimated = calculateEstimatedTokensForSats(amountValue, currentPrice);
          console.log('🔍 Buy estimate result:', estimated);
          setEstimatedTokens(estimated);
        }
      } else {
        setEstimatedSats(0);
        setEstimatedTokens(0);
      }
    };
    
    calculateEstimates();
  }, [amount, tab, currentPrice]);


  const handleCloseToast = () => {
    setToast({ message: '', txId: '', visible: false, status: 'pending' });
  };

  const handleRetry = () => {
    // Clear the failed toast and retry the transaction
    setToast({ message: '', txId: '', visible: false, status: 'pending' });
    handleClick();
  };

  const setAmountPercent = (percent) => {
    if (userBalance && !isNaN(userBalance)) {
      let newAmount;
      if (tab === 'sell') {
        // For sell: use the actual token balance from read-only function, round down to nearest whole number minus 1
        const maxSellable = Math.floor(userBalance) - 1;
        newAmount = Math.floor((maxSellable * percent) / 100);
        // Ensure we don't go below 0
        newAmount = Math.max(0, newAmount);
      } else {
        // For buy: use sats balance, round down to nearest whole number minus 1
        const maxBuyable = Math.floor(userBalance) - 1;
        newAmount = Math.floor((maxBuyable * percent) / 100);
        // Ensure we don't go below 0
        newAmount = Math.max(0, newAmount);
      }
      // Format with commas for display
      const formattedAmount = newAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      setAmount(formattedAmount);
      setError(null);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Remove all non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return; // Don't update if multiple decimal points
    }
    
    // Format with commas for display
    if (parts[0]) {
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      const formattedValue = parts[1] ? `${integerPart}.${parts[1]}` : integerPart;
      setAmount(formattedValue);
    } else {
      setAmount(cleanValue);
    }
  };

  const handleClick = async () => {
    // Remove commas before processing
    const cleanAmount = amount.replace(/,/g, '');
    
    if (!cleanAmount || isNaN(cleanAmount) || Number(cleanAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setError(null);
    setLoading(true);

    // Scroll down slightly to show trade history better
    setTimeout(() => {
      window.scrollTo({
        top: window.scrollY + 200,
        behavior: 'smooth'
      });
    }, 100);

    // Set pending transaction data
    const transactionData = {
      type: tab,
      amount: cleanAmount,
      satsAmount: tab === 'buy' ? parseInt(cleanAmount) : null, // For buy, this is the sats amount
      estimatedSats: tab === 'sell' ? estimatedSats : null,
      timestamp: new Date().toISOString()
    };
    setPendingTransaction(transactionData);

    const result = await handleTransaction(tab, cleanAmount, setErrorMessage, setToast);

    setLoading(false);

    if (result) {
      // Only clear pending transaction on success to trigger animation
      setIsSuccessfulTransaction(true);
      setPendingTransaction(null);
      if (refreshTrades) await refreshTrades();
    } else {
      // Clear pending transaction on failure without animation
      setIsSuccessfulTransaction(false);
      setPendingTransaction(null);
      
      // Auto refresh on failure if enabled
      if (autoRefreshOnFail) {
        console.log('🔄 Auto-refreshing page due to transaction failure...');
        setTimeout(() => {
          window.location.reload();
        }, 2000); // 2 second delay
      } else {
        // Only show error message if auto-refresh is disabled
        setError('Transaction failed. Please try again.');
        setErrorMessage('Transaction failed. Please try again.');
      }
    }
  };

  return (
    <div className="buy-sell-box">
      {toast.visible && (
        <TransactionToast 
          message={toast.message} 
          txId={toast.txId} 
          onClose={handleCloseToast} 
          status={toast.status}
          onRetry={handleRetry}
        />
      )}

      <div className={`buy-sell-content ${tab === 'sell' ? 'sell-mode' : ''}`}>
        {/* Navigation buttons inside the card */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveSection(activeSection === 'buysell' ? null : 'buysell')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: activeSection === 'buysell' || !activeSection ? '#2563eb' : '#e5e7eb',
              color: activeSection === 'buysell' || !activeSection ? 'white' : '#111827',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Buy/Sell
          </button>
          <button
            onClick={() => setActiveSection(activeSection === 'profit' ? null : 'profit')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: activeSection === 'profit' ? '#2563eb' : '#e5e7eb',
              color: activeSection === 'profit' ? 'white' : '#111827',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Profit / Loss
          </button>
          <button
            onClick={() => setActiveSection(activeSection === 'stats' ? null : 'stats')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: activeSection === 'stats' ? '#2563eb' : '#e5e7eb',
              color: activeSection === 'stats' ? 'white' : '#111827',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Token Statistics
          </button>
        </div>

        {/* Show Buy/Sell interface when Buy/Sell is selected or no section is selected */}
        {(activeSection === 'buysell' || !activeSection) && (
          <>
            <div className="tab-row">
              <button
                className={`tab-button active ${tab === 'buy' ? 'buy' : ''}`}
                onClick={() => {
                  setTab('buy');
                  setAmount('');
                  setError(null);
                }}
              >
                Buy
              </button>
              <button
                className={`tab-button active ${tab === 'sell' ? 'sell' : ''}`}
                onClick={() => {
                  setTab('sell');
                  setAmount('');
                  setError(null);
                }}
              >
                Sell
              </button>
            </div>

            <div className="current-balance">
          {tab === 'sell' ? (
            <>
              <div style={{ marginBottom: '8px' }}>
                Holdings: {Math.floor(userBalance).toLocaleString()}{" "}
                <img 
                  src="/icons/The Mas Network.svg" 
                  alt="MAS Sats" 
                  style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
                />
              </div>
              <div>
                Estimated to receive:{" "}
                {Math.floor(estimatedSats).toLocaleString()}{" "}
                <img 
                  src="/icons/sats1.svg" 
                  alt="sats" 
                  style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '2px' }}
                />
                <img 
                  src="/icons/Vector.svg" 
                  alt="lightning" 
                  style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
                />
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '8px' }}>
                Holdings:{" "}
                {userBalance.toLocaleString()}{" "}
                <img 
                  src="/icons/sats1.svg" 
                  alt="SATS" 
                  style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '2px' }}
                />
                <img 
                  src="/icons/Vector.svg" 
                  alt="lightning" 
                  style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
                />
              </div>
              <div>
                Estimated to receive:{" "}
                {Math.floor(estimatedTokens).toLocaleString()}{" "}
                <img 
                  src="/icons/The Mas Network.svg" 
                  alt="MAS Sats" 
                  style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
                />
              </div>
            </>
          )}
        </div>

        <label htmlFor="amount-input" className="input-label">
          {tab === 'buy' ? (
            <>
              Buy in 
              <img 
                src="/icons/sats1.svg" 
                alt="SATS" 
                style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginLeft: '4px', marginRight: '2px' }}
              />
              <img 
                src="/icons/Vector.svg" 
                alt="lightning" 
                style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
              />
            </>
          ) : (
            'Amount to sell'
          )}
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="amount-input"
            type="text"
            placeholder="0"
            value={amount}
            onChange={handleAmountChange}
            className="sats-input"
            disabled={loading}
          />
          {tab === 'buy' ? (
            <>
              <img 
                src="/icons/sats1.svg" 
                alt="sats" 
                style={{ 
                  position: 'absolute', 
                  right: '20px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  width: '16px', 
                  height: '16px',
                  pointerEvents: 'none'
                }}
              />
              <img 
                src="/icons/Vector.svg" 
                alt="lightning" 
                style={{ 
                  position: 'absolute', 
                  right: '4px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  width: '16px', 
                  height: '16px',
                  pointerEvents: 'none'
                }}
              />
            </>
          ) : (
            <img 
              src="/icons/The Mas Network.svg" 
              alt="MAS Sats" 
              style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                width: '16px', 
                height: '16px',
                pointerEvents: 'none'
              }}
            />
          )}
        </div>

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
          {loading ? 'Processing...' : tab === 'buy' ? 'Buy' : 'Sell'}
        </button>

        <div style={{ 
          marginTop: '12px', 
          padding: '8px', 
          background: '#1a1a1a', 
          borderRadius: '6px',
          border: '1px solid #333'
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '14px',
            color: '#ccc',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={autoRefreshOnFail}
              onChange={(e) => setAutoRefreshOnFail(e.target.checked)}
              style={{ 
                width: '16px', 
                height: '16px',
                accentColor: '#4CAF50'
              }}
            />
            Auto-refresh page on failed transactions
          </label>
          <div style={{ 
            fontSize: '12px', 
            color: '#888', 
            marginTop: '4px',
            marginLeft: '24px'
          }}>
            Automatically reloads the page if a transaction fails
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
          </>
        )}

        {/* Show ProfitLoss when profit section is selected */}
        {activeSection === 'profit' && <ProfitLoss />}

        {/* Show TokenStats when stats section is selected */}
        {activeSection === 'stats' && <TokenStats />}
      </div>
    </div>
  );
}
