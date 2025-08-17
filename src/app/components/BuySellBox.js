'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { handleTransaction } from '../utils/swapLogic';
import TransactionToast from './TransactionToast';
import { getUserTokenBalance, getUserSatsBalance, calculateEstimatedTokensForSats, calculateEstimatedSatsForTokens, getSbtcBalance, getTotalTokenBalance, getTotalLockedTokens, parseContractInfo } from '../utils/fetchTokenData';
import ProfitLoss from './ProfitLoss';
import TokenStats from './TokenStats';
import './BuySellBox.css';

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

export default function BuySellBox({ 
  tab, 
  setTab, 
  amount, 
  setAmount, 
  refreshTrades, 
  setPendingTransaction, 
  setIsSuccessfulTransaction, 
  trades, 
  activeSection, 
  setActiveSection, 
  revenue, 
  liquidity, 
  remainingSupply,
  tokenData // Add tokenData for contract info
}) {
  // Restore tab selection from localStorage on component mount
  useEffect(() => {
    const savedTab = localStorage.getItem('selectedTab');
    if (savedTab && (savedTab === 'buy' || savedTab === 'sell')) {
      setTab(savedTab);
    }
  }, [setTab]);

  // Save tab selection to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectedTab', tab);
  }, [tab]);
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
  
  // Slippage protection state
  const [slippageEnabled, setSlippageEnabled] = useState(false);
  const [slippage, setSlippage] = useState(5); // Default 5%
  const [showCustomSlippage, setShowCustomSlippage] = useState(false);
  const [customSlippage, setCustomSlippage] = useState('');

  const [toast, setToast] = useState({ message: '', txId: '', visible: false, status: 'pending' });
  const [useNetworkPrecheck, setUseNetworkPrecheck] = useState(() => {
    // Get saved preference or default to true
    const saved = localStorage.getItem('useNetworkPrecheck');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Liquidity warning state
  const [liquidityWarning, setLiquidityWarning] = useState({ show: false, message: '', type: '' });

  // Save network precheck preference whenever it changes
  useEffect(() => {
    localStorage.setItem('useNetworkPrecheck', JSON.stringify(useNetworkPrecheck));
  }, [useNetworkPrecheck]);

  // Check liquidity warning when tab changes
  useEffect(() => {
    const cleanAmount = amount.replace(/,/g, '');
    const amountValue = parseInt(cleanAmount);
    checkLiquidityWarning(amountValue, tab);
  }, [tab, amount]);

  // Function to fetch and store price calculation snapshot
  const fetchPriceSnapshot = async () => {
    try {
      // Parse contract info from tokenData (source of truth)
      const contractInfo = parseContractInfo(tokenData);
      console.log('🔍 fetchPriceSnapshot using contract info:', contractInfo);
      
      const [sbtcBalance, totalTokens, lockedTokens] = await Promise.all([
        getSbtcBalance(contractInfo),
        getTotalTokenBalance(contractInfo),
        getTotalLockedTokens(contractInfo)
      ]);
      
      // Calculate derived values
      const virtualSbtc = 1500000; // 1.5M sats virtual liquidity
      const availableTokens = totalTokens - lockedTokens;
      const calculatedPrice = (sbtcBalance + virtualSbtc) / availableTokens;
      
      setPriceSnapshot({
        sbtcBalance,
        totalTokens,
        lockedTokens,
        virtualSbtc,
        availableTokensFormatted: availableTokens,
        totalTokensFormatted: totalTokens,
        lockedTokensFormatted: lockedTokens,
        calculatedPrice,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to fetch price snapshot:', error);
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
      try {
        if (tab === 'sell') {
          const tokenBalance = await getUserTokenBalance(); // Already in whole tokens
          setUserBalance(tokenBalance); // No conversion needed
        } else {
          const satsBalance = await getUserSatsBalance(); // base units
          setUserBalance(Math.floor(satsBalance)); // Whole SATS only
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
        setUserBalance(0);
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
        try {
          const price = await getCurrentPrice();
          setCurrentPrice(price);
        } catch (error) {
          console.error('Error fetching current price:', error);
          setCurrentPrice(0);
        }
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
      
      // Check for liquidity warning after setting amount
      checkLiquidityWarning(newAmount, tab);
    }
  };

  // Function to check liquidity warnings
  const checkLiquidityWarning = (amountValue, transactionType) => {
    if (!amountValue || amountValue <= 0) {
      setLiquidityWarning({ show: false, message: '', type: '' });
      return;
    }

    if (transactionType === 'buy' && amountValue <= 999) {
      setLiquidityWarning({
        show: true,
        message: `Buying: Transactions with ${amountValue} sats or less may fail due to low liquidity.`,
        type: 'buy'
      });
    } else if (transactionType === 'sell' && amountValue <= 7000) {
      setLiquidityWarning({
        show: true,
        message: `Selling: Transactions with ${amountValue} tokens or less may fail due to low liquidity.`,
        type: 'sell'
      });
    } else {
      setLiquidityWarning({ show: false, message: '', type: '' });
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
      
      // Check for liquidity warning
      const amountValue = parseInt(parts[0]);
      checkLiquidityWarning(amountValue, tab);
    } else {
      setAmount(cleanValue);
      setLiquidityWarning({ show: false, message: '', type: '' });
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

    // Calculate both current price and slippage-adjusted expected price
    const currentPriceAtTrade = currentPrice;
    let expectedPriceAtTrade = currentPrice; // Default to current price
    
    // If slippage protection is enabled, calculate the slippage-adjusted expected price
    if (slippageEnabled && slippage > 0) {
      const slippagePercent = slippage / 100;
      if (tab === 'sell') {
        // For sells: expect at least (current price - slippage)
        expectedPriceAtTrade = currentPrice * (1 - slippagePercent);
      } else {
        // For buys: expect at most (current price + slippage)  
        expectedPriceAtTrade = currentPrice * (1 + slippagePercent);
      }
    }
    
    console.log('📊 Price data at trade initiation:');
    console.log('  Current market price:', currentPriceAtTrade);
    console.log('  Expected price (with slippage):', expectedPriceAtTrade);
    console.log('  Slippage tolerance:', slippage + '%');
    
    // Note: Slippage protection is now handled via blockchain post conditions in swapLogic.js
    
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

    // Get connected wallet address for post conditions
    const connectedAddress = localStorage.getItem('connectedAddress');

    // Create slippage protection parameters
    const slippageProtectionParams = slippageEnabled ? {
      enabled: true,
      tolerance: slippage,
      userAddress: connectedAddress
    } : null;
    
    console.log('🛡️ Slippage protection params:', slippageProtectionParams);

    // Pass the appropriate estimated output based on trade type
    const estimatedOutput = tab === 'buy' ? estimatedTokens : estimatedSats;
    
    console.log('🔍 BuySellBox Debug:');
    console.log('  Original amount:', amount);
    console.log('  Clean amount:', cleanAmount);
    console.log('  Tab:', tab);
    console.log('  Slippage enabled:', slippageEnabled);
    console.log('  Estimated output:', estimatedOutput);
    console.log('  Token specific:', false); // No longer token specific
    console.log('  Token data:', null); // No longer token data
    
    // Determine network based on token data or connected wallet
    let network = 'testnet'; // default
    const connectedAddress = localStorage.getItem('connectedAddress');
    
    // If we have tokenData with tabType, use that to determine network
    if (tokenData?.tabType) {
      if (tokenData.tabType === 'featured') {
        network = 'mainnet';
      } else if (tokenData.tabType === 'practice') {
        network = 'testnet';
      }
    }
    // Otherwise, determine network from connected wallet address
    else if (connectedAddress) {
      if (connectedAddress.startsWith('SP')) {
        network = 'mainnet';
      } else if (connectedAddress.startsWith('ST')) {
        network = 'testnet';
      }
    }
    
    console.log('🌐 Using network for transaction:', network);
    
    let result;
    result = await handleTransaction(tab, cleanAmount, null, setToast, expectedPriceAtTrade, handleDuplicate, slippageProtectionParams, estimatedOutput, currentPriceAtTrade, null, true, network);

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
        // Error handled via local state - no top banner needed
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
              {slippageEnabled ? (
                <>
                  <div>
                    Max to receive:{" "}
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
              )}
            </>
          ) : (
            <>
              <div style={{ marginBottom: '8px' }}>
                {t('holdings')}:{" "}
                {(userBalance || 0).toLocaleString()}{" "}
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
              {slippageEnabled ? (
                <>
                  <div>
                    Max to receive:{" "}
                    {Math.floor(estimatedTokens).toLocaleString()}{" "}
                    <img 
                      src="/icons/The Mas Network.svg" 
                      alt="MAS Sats" 
                      style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
                    />
                  </div>


                </>
              ) : (
                <div>
                  {t('estimated_receive')}:{" "}
                  {Math.floor(estimatedTokens).toLocaleString()}{" "}
                  <img 
                    src="/icons/The Mas Network.svg" 
                    alt="MAS Sats" 
                    style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
                  />
                </div>
              )}
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

        {/* Liquidity Warning */}
        {liquidityWarning.show && (
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            padding: '16px',
            margin: '16px 0',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '20px',
              marginBottom: '8px'
            }}>
              ⚠️
            </div>
            <p style={{
              color: '#92400e',
              fontSize: '14px',
              lineHeight: '1.4',
              margin: '0',
              fontWeight: '500',
              fontFamily: 'Arial, sans-serif'
            }}>
              {liquidityWarning.message}
            </p>
          </div>
        )}

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

        {/* Slippage Protection Settings */}
        <div style={{ marginTop: '16px', marginBottom: '16px' }}>
          {/* Slippage Toggle */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '12px',
            padding: '8px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <input
              type="checkbox"
              id="slippage-toggle"
              checked={slippageEnabled}
              onChange={(e) => setSlippageEnabled(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <label htmlFor="slippage-toggle" style={{ 
              fontSize: '14px', 
              color: '#374151',
              cursor: 'pointer',
              flex: 1
            }}>
              🛡️ Swap Price Protection
            </label>
            {slippageEnabled && (
              <span style={{ 
                fontSize: '12px', 
                color: '#10b981',
                fontWeight: 'bold'
              }}>
                {slippage}%
              </span>
            )}
          </div>

          {/* Slippage Preset Buttons */}
          {slippageEnabled && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ 
                fontSize: '12px', 
                color: 'white', 
                marginBottom: '6px' 
              }}>
                Slippage Tolerance:
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[5, 10, 20, 50].map(percent => (
                  <button
                    key={percent}
                    onClick={() => {
                      setSlippage(percent);
                      setShowCustomSlippage(false);
                      setCustomSlippage('');
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: slippage === percent ? '2px solid #eab308' : '1px solid #6b7280',
                      backgroundColor: '#374151',
                      color: '#eab308',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    {percent}%
                  </button>
                ))}
                <button
                  onClick={() => {
                    setShowCustomSlippage(true);
                    setCustomSlippage(slippage.toString());
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: showCustomSlippage ? '2px solid #eab308' : '1px solid #6b7280',
                    backgroundColor: '#374151',
                    color: '#eab308',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}
                >
                  Custom
                </button>
              </div>
            </div>
          )}

          {/* Custom Slippage Input */}
          {slippageEnabled && showCustomSlippage && (
            <div style={{ marginTop: '8px' }}>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                placeholder="Enter custom %"
                value={customSlippage}
                onChange={(e) => {
                  setCustomSlippage(e.target.value);
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    setSlippage(value);
                  }
                }}
                style={{
                  width: '100px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px'
                }}
              />
              <span style={{ 
                marginLeft: '4px', 
                fontSize: '12px', 
                color: '#6b7280' 
              }}>
                %
              </span>
            </div>
          )}
        </div>

        {/* Slippage Price Information */}
        {slippageEnabled && slippage > 0 && (
          <div style={{ 
            marginBottom: '12px',
            padding: '8px 12px',
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '12px', color: 'black', marginBottom: '4px', fontWeight: '600' }}>
              {tab === 'sell' ? 'Minimum Sell Price:' : 'Maximum Buy Price:'}
            </div>
            <div style={{ fontSize: '12px', color: 'black', fontWeight: '600' }}>
              {tab === 'sell' 
                ? (currentPrice * (1 - slippage / 100)).toFixed(8)
                : (currentPrice * (1 + slippage / 100)).toFixed(8)
              }{" "}
              <img 
                src="/icons/sats1.svg" 
                alt="sats" 
                style={{ width: '12px', height: '12px', verticalAlign: 'middle', marginRight: '1px' }}
              />
              <img 
                src="/icons/Vector.svg" 
                alt="lightning" 
                style={{ width: '12px', height: '12px', verticalAlign: 'middle' }}
              />
              {" "}/ {" "}
              <img 
                src="/icons/The Mas Network.svg" 
                alt="MAS Sats" 
                style={{ width: '12px', height: '12px', verticalAlign: 'middle' }}
              />
            </div>
          </div>
        )}

        {/* Min Guaranteed Amount */}
        {slippageEnabled && slippage > 0 && (
          <div style={{ 
            marginBottom: '16px',
            padding: '8px 12px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '12px', color: '#374151', fontWeight: '600' }}>
              Minimum to Receive:{" "}
              {tab === 'sell' ? (
                <>
                  {Math.floor(estimatedSats * (1 - slippage / 100)).toLocaleString()}{" "}
                  <img 
                    src="/icons/sats1.svg" 
                    alt="sats" 
                    style={{ width: '14px', height: '14px', verticalAlign: 'middle', marginRight: '2px' }}
                  />
                  <img 
                    src="/icons/Vector.svg" 
                    alt="lightning" 
                    style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
                  />
                </>
              ) : (
                <>
                  {Math.floor(estimatedTokens * (1 - slippage / 100)).toLocaleString()}{" "}
                  <img 
                    src="/icons/The Mas Network.svg" 
                    alt="MAS Sats" 
                    style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
                  />
                </>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleClick}
          disabled={loading}
          className={`buy-button ${tab === 'buy' ? 'buy' : 'sell'}`}
        >
          {loading ? t('processing') : tab === 'buy' ? t('buy') : t('sell')}
        </button>

        {/* Slippage Protection Indicator */}
        {slippageEnabled && slippage > 0 && (
          <div style={{ 
            marginTop: '8px', 
            padding: '6px 8px', 
            background: tab === 'buy' ? '#1e3a8a' : '#92400e', 
            borderRadius: '6px',
            border: tab === 'buy' ? '1px solid #3b82f6' : '1px solid #d97706',
            fontSize: '12px',
            color: '#dbeafe',
            textAlign: 'center'
          }}>
            {tab === 'buy' ? (
              <>
                🛡️ {slippage}% Price Swap Protection
              </>
            ) : (
              <>
                🛡️ {slippage}% Price Swap Protection
                {currentPrice > 0 && amount && (
                  <div style={{ marginTop: '2px', fontSize: '10px', color: '#fbbf24' }}>
                    Max send limit: {(parseFloat(amount.replace(/,/g, '') || 0) * 1.5).toFixed(1)} DCY tokens
                  </div>
                )}
              </>
            )}
          </div>
        )}

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
        {activeSection === 'stats' && <TokenStats revenue={revenue} liquidity={liquidity} remainingSupply={remainingSupply} dexInfo={tokenData?.dexInfo} tokenInfo={tokenData?.tokenInfo} />}
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
