'use client';

import { useState, useEffect } from 'react';
import { handleTransaction } from '../utils/swapLogic';
import TransactionToast from './TransactionToast';
import { getUserTokenBalance, getUserSatsBalance, calculateEstimatedTokensForSats, calculateEstimatedSatsForTokens, getCurrentPrice, getSbtcBalance, getTotalTokenBalance, getTotalLockedTokens } from '../utils/fetchTokenData';
import ProfitLoss from './ProfitLoss';
import TokenStats from './TokenStats';
import './BuySellBox.css';
import { useTranslation } from 'react-i18next';

// Network health check function
async function checkNetworkHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://api.testnet.hiro.so/v2/info', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('🚨 Network check failed:', error.message);
    return false;
  }
}

export default function BuySellBox({ tab, setTab, amount, setAmount, refreshTrades, setErrorMessage, setPendingTransaction, setIsSuccessfulTransaction, trades, activeSection, setActiveSection }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isNetworkRetry, setIsNetworkRetry] = useState(false);
  const [isDuplicateError, setIsDuplicateError] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [estimatedSats, setEstimatedSats] = useState(0);
  const [estimatedTokens, setEstimatedTokens] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceSnapshot, setPriceSnapshot] = useState(null);

  const [toast, setToast] = useState({ message: '', txId: '', visible: false, status: 'pending' });
  const [useNetworkPrecheck, setUseNetworkPrecheck] = useState(() => {
    // Get saved preference or default to true
    const saved = localStorage.getItem('useNetworkPrecheck');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save network precheck preference whenever it changes
  useEffect(() => {
    localStorage.setItem('useNetworkPrecheck', JSON.stringify(useNetworkPrecheck));
  }, [useNetworkPrecheck]);

  // Function to fetch and store price calculation snapshot
  const fetchPriceSnapshot = async () => {
    try {
      const [sbtcBalance, totalTokens, lockedTokens] = await Promise.all([
        getSbtcBalance(),
        getTotalTokenBalance(),
        getTotalLockedTokens()
      ]);
      
      const availableTokens = totalTokens - lockedTokens;
      const virtualSbtc = 1500000;
      // Calculate price per token (tokens are in base units, so divide by 1e8 to get actual tokens)
      const calculatedPrice = (sbtcBalance + virtualSbtc) / (availableTokens / 1e8);
      
      const snapshot = {
        sbtcBalance,
        totalTokens,
        lockedTokens,
        availableTokens,
        totalTokensFormatted: totalTokens / 1e8,
        lockedTokensFormatted: lockedTokens / 1e8,
        availableTokensFormatted: availableTokens / 1e8,
        virtualSbtc,
        calculatedPrice,
        timestamp: Date.now()
      };
      
      setPriceSnapshot(snapshot);
      return snapshot;
    } catch (error) {
      console.error('Failed to fetch price snapshot:', error);
      return null;
    }
  };

  // Handle modal open - fetch snapshot if needed
  const handleOpenPriceModal = async () => {
    setShowPriceModal(true);
    // Only fetch new snapshot if we don't have one or if modal was closed and reopened
    if (!priceSnapshot) {
      await fetchPriceSnapshot();
    }
  };

  // Handle modal close - clear snapshot so it refreshes next time
  const handleClosePriceModal = () => {
    setShowPriceModal(false);
    setPriceSnapshot(null); // Clear snapshot so it fetches fresh data next time
  };

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
      // Get the last trade price (this should be in SATS per token)
      const lastTrade = trades[trades.length - 1];
      const chartPrice = lastTrade.price;
      console.log('🔍 Using chart price from last trade:', {
        price: chartPrice,
        type: typeof chartPrice,
        trade: lastTrade
      });
      setCurrentPrice(chartPrice);
    } else {
      // Fallback to calculated price if no trades
      const fetchCurrentPrice = async () => {
        console.log('🔍 No trades found, fetching calculated price...');
        const price = await getCurrentPrice();
        console.log('🔍 Received calculated price:', {
          price,
          type: typeof price,
          needsConversion: price < 1
        });
        
        // If price is in SBTC units (very small), convert to SATS
        const adjustedPrice = price < 1 ? price * 100000000 : price;
        console.log('🔍 Adjusted price for SATS units:', adjustedPrice);
        setCurrentPrice(adjustedPrice);
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
          // Calculate estimated sats for token sell using price
          const estimated = calculateEstimatedSatsForTokens(amountValue, currentPrice);
          console.log('🔍 Sell estimate result:', estimated);
          setEstimatedSats(estimated);
        } else {
          // Calculate estimated tokens for sats buy using price
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
      setIsNetworkRetry(false);
      setError('Please enter a valid amount');
      return;
    }

    setError(null);
    setIsNetworkRetry(false);
    setIsDuplicateError(false);
    
    // Network precheck before attempting transaction
    if (useNetworkPrecheck) {
      console.log('🔍 Checking network health before transaction...');
      setIsNetworkRetry(true);
      setError('Checking network connectivity...');
      
      const isNetworkHealthy = await checkNetworkHealth();
      
      if (!isNetworkHealthy) {
        setError('Network connectivity issues detected. Refreshing in 5 seconds...');
        setTimeout(() => {
          setError(null);
          setIsNetworkRetry(false);
          handleClick(); // Retry the transaction
        }, 5000);
        return;
      }
      
      console.log('✅ Network healthy - proceeding with transaction');
      setError(null);
      setIsNetworkRetry(false);
    }
    
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

    // Capture the current price as the expected price at time of trade
    const expectedPriceAtTrade = currentPrice;
    console.log('🎯 Expected price at trade initiation:', expectedPriceAtTrade);
    
    // Handle duplicate detection callback
    const handleDuplicate = () => {
      setLoading(false);
      setIsSuccessfulTransaction(false);
      setPendingTransaction(null);
      setIsDuplicateError(true);
      setIsNetworkRetry(true);
      setError('Duplicate wallet popup detected. New wallet popup will come after page refresh.');
      
      // Auto refresh page after 5 seconds to get fresh transaction
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    };

    const result = await handleTransaction(tab, cleanAmount, setErrorMessage, setToast, expectedPriceAtTrade, handleDuplicate);

    setLoading(false);

    if (result) {
      // Only clear pending transaction on success to trigger animation
      setIsSuccessfulTransaction(true);
      setPendingTransaction(null);
      if (refreshTrades) await refreshTrades();
    } else if (!isDuplicateError) {
      // Clear pending transaction on failure without animation (only if not duplicate)
      setIsSuccessfulTransaction(false);
      setPendingTransaction(null);
      
                  // Smart retry with network precheck instead of page refresh
      if (useNetworkPrecheck) {
        console.log('🔄 Network connectivity issues - checking and retrying...');
        setIsNetworkRetry(true);
        setError('Network connectivity issues refreshing in 3 seconds...');
        setTimeout(async () => {
          const isHealthy = await checkNetworkHealth();
          if (isHealthy) {
            console.log('✅ Network recovered - retrying transaction...');
            setError('Network recovered. Retrying...');
            setTimeout(() => {
              setError(null);
              setIsNetworkRetry(false);
              handleClick(); // Retry the transaction
            }, 1000);
          } else {
            setError('Connectivity issues persist. Refreshing again in 5 seconds...');
        setTimeout(() => {
              setError(null);
              setIsNetworkRetry(false);
              handleClick(); // Keep retrying
            }, 5000);
          }
        }, 3000);
      } else {
        // Only show error message if network precheck is disabled
        setIsNetworkRetry(false);
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
            {t('buy_sell')}
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
            {t('profit_loss')}
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
            {t('token_stats')}
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
                {t('buy')}
              </button>
              <button
                className={`tab-button active ${tab === 'sell' ? 'sell' : ''}`}
                onClick={() => {
                  setTab('sell');
                  setAmount('');
                  setError(null);
                }}
              >
                {t('sell')}
              </button>
            </div>

            {/* Current Price Display */}
            {currentPrice > 0 && (
              <div className="price-display-section" style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Current Price
                  </div>
                  <button 
                    onClick={handleOpenPriceModal}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      color: '#2563eb',
                      fontSize: '10px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#e2e8f0';
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#f1f5f9';
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    Learn More ❓
                  </button>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                  {currentPrice.toFixed(8)}
                </div>
              </div>
            )}

            <div className="current-balance">
          {tab === 'sell' ? (
            <>
              <div style={{ marginBottom: '8px' }}>
                {t('holdings')}: {Math.floor(userBalance).toLocaleString()}{" "}
                <img 
                  src="/icons/The Mas Network.svg" 
                  alt="MAS Sats" 
                  style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
                />
              </div>
              <div>
                {t('estimated_receive')}:{" "}
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
                {t('holdings')}:{" "}
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
                {t('estimated_receive')}:{" "}
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
              {t('buy_in')}
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
            t('amount_to_sell')
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
          {loading ? t('processing') : tab === 'buy' ? t('buy') : t('sell')}
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
              checked={useNetworkPrecheck}
              onChange={(e) => setUseNetworkPrecheck(e.target.checked)}
              style={{ 
                width: '16px', 
                height: '16px',
                accentColor: '#4CAF50'
              }}
            />
            {t('auto_refresh')}
          </label>
          <div style={{ 
            fontSize: '12px', 
            color: '#888', 
            marginTop: '4px',
            marginLeft: '24px'
          }}>
            {t('auto_refresh_desc')}
          </div>
        </div>

        {error && (
          <div 
            className={isNetworkRetry ? "" : "error-message"}
            style={isNetworkRetry ? {
              padding: '12px',
              backgroundColor: '#e0f2fe',
              border: '1px solid #0288d1',
              borderRadius: '6px',
              color: '#01579b',
              fontSize: '14px',
              marginTop: '10px',
              textAlign: 'center'
            } : {}}
          >
            {error}
          </div>
        )}
          </>
        )}

        {/* Show ProfitLoss when profit section is selected */}
        {activeSection === 'profit' && <ProfitLoss />}

        {/* Show TokenStats when stats section is selected */}
        {activeSection === 'stats' && <TokenStats />}
      </div>

      {/* Price Information Modal */}
      {showPriceModal && (
        <div 
          onClick={handleClosePriceModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
            <button
              onClick={handleClosePriceModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: '#6b7280'
              }}
            >
              ×
            </button>
            
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#1f2937',
              paddingRight: '40px'
            }}>
              Current Price Explanation
            </h2>
            
            <div style={{ lineHeight: '1.6', color: '#374151' }}>
              <p style={{ marginBottom: '16px' }}>
                The current price is calculated using an <strong>Automated Market Maker (AMM)</strong> formula that determines the token price based on the liquidity pool balances.
              </p>
              
              <div style={{ 
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <p style={{ margin: '0', fontSize: '14px' }}>
                  <strong>📊 Chart Price vs Current Price:</strong> The chart displays the <strong>last executed trade price</strong>, while the current price shows the <strong>real-time AMM calculation</strong>. These may differ because:
                </p>
                <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px', fontSize: '14px' }}>
                  <li>Chart price = Price of the most recent completed transaction</li>
                  <li>Current price = Live calculation based on current pool balances</li>
                  <li>Pool balances change with each trade, updating the current price instantly</li>
                </ul>
              </div>
              
              {!priceSnapshot ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  color: '#6b7280'
                }}>
                  Loading current data...
                </div>
              ) : (
                <>
                  <div style={{ 
                    backgroundColor: '#f9fafb', 
                    padding: '16px', 
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
                      Current Calculation:
                    </h3>
                    <div style={{ 
                      backgroundColor: '#ffffff',
                      padding: '12px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      border: '1px solid #d1d5db',
                      fontFamily: 'monospace'
                    }}>
                      <div style={{ marginBottom: '8px', color: '#6b7280' }}>
                        Price = (SBTC Balance + Virtual SBTC) ÷ Available Tokens
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        Price = ({priceSnapshot.sbtcBalance.toLocaleString()} + {priceSnapshot.virtualSbtc.toLocaleString()}) ÷ {Math.round(priceSnapshot.availableTokensFormatted).toLocaleString()}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        Price = {(priceSnapshot.sbtcBalance + priceSnapshot.virtualSbtc).toLocaleString()} ÷ {Math.round(priceSnapshot.availableTokensFormatted).toLocaleString()}
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#059669' }}>
                        Price = {priceSnapshot.calculatedPrice.toFixed(8)} sats per token
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    backgroundColor: '#f0f9ff', 
                    padding: '16px', 
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid #0ea5e9'
                  }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
                      Current Pool Data:
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                      <div>
                        <strong>SBTC Balance:</strong><br/>
                        {priceSnapshot.sbtcBalance.toLocaleString()} sats
                      </div>
                      <div>
                        <strong>Virtual SBTC:</strong><br/>
                        {priceSnapshot.virtualSbtc.toLocaleString()} sats
                      </div>
                      <div>
                        <strong>Total Tokens:</strong><br/>
                        {Math.round(priceSnapshot.totalTokensFormatted).toLocaleString()}
                      </div>
                      <div>
                        <strong>Locked Tokens:</strong><br/>
                        {Math.round(priceSnapshot.lockedTokensFormatted).toLocaleString()}
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <strong>Available for Trading:</strong><br/>
                        {Math.round(priceSnapshot.availableTokensFormatted).toLocaleString()} tokens
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#6b7280',
                    backgroundColor: '#f9fafb',
                    padding: '12px',
                    borderRadius: '6px'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>How it works:</strong>
                    </div>
                    <ul style={{ margin: '0', paddingLeft: '16px' }}>
                      <li>Virtual SBTC (1.5M sats) provides initial liquidity and price stability</li>
                      <li>As trades occur, SBTC and token balances change</li>
                      <li>Price automatically adjusts based on the new ratio</li>
                      <li>More SBTC in pool = higher token price</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
