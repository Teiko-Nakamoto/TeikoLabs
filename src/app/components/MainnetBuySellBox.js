'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { request } from '@stacks/connect';
import { uintCV, Pc, postConditionToHex } from '@stacks/transactions';
import './MainnetBuySellBox.css';

// Mainnet-specific buy/sell box for mainnet tokens
const MainnetBuySellBox = React.memo(function MainnetBuySellBox({ 
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
  totalSupply,
  symbol,
  tokenData, // Required for mainnet token-specific trading
  onCurrentPriceChange, // Callback to pass current price to parent
  userSats
}) {
  // Restore tab selection from localStorage on component mount
  useEffect(() => {
    const savedTab = localStorage.getItem('mainnetSelectedTab');
    if (savedTab && (savedTab === 'buy' || savedTab === 'sell')) {
      setTab(savedTab);
    }
  }, [setTab]);

  // Save tab selection to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mainnetSelectedTab', tab);
  }, [tab]);

  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [estimatedSats, setEstimatedSats] = useState(0);
  const [estimatedTokens, setEstimatedTokens] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceSnapshot, setPriceSnapshot] = useState(null);
  
  // Mainnet-specific state
  const [mainnetNetworkStatus, setMainnetNetworkStatus] = useState('checking');
  const [slippageEnabled, setSlippageEnabled] = useState(false);
  const [slippage, setSlippage] = useState(5); // Default 5%
  const [showCustomSlippage, setShowCustomSlippage] = useState(false);
  const [customSlippage, setCustomSlippage] = useState('');
  const [toast, setToast] = useState({ message: '', txId: '', visible: false, status: 'pending' });

  // Mock chart data state
  const [chartData, setChartData] = useState([]);

  // Check mainnet network health
  useEffect(() => {
    async function checkMainnetHealth() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('https://api.mainnet.hiro.so/v2/info', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        setMainnetNetworkStatus(response.ok ? 'healthy' : 'unhealthy');
      } catch (error) {
        console.log('🚨 Mainnet network check failed:', error.message);
        setMainnetNetworkStatus('unhealthy');
      }
    }
    
    checkMainnetHealth();
  }, []);

  // Calculate current price based on liquidity and revenue
  useEffect(() => {
    if (liquidity > 0 && revenue > 0) {
      const price = revenue / liquidity;
      setCurrentPrice(price);
      if (onCurrentPriceChange) {
        onCurrentPriceChange(price);
      }
    }
  }, [liquidity, revenue, onCurrentPriceChange]);

  // Calculate estimates when amount changes
  useEffect(() => {
    if (!amount || amount <= 0) {
      setEstimatedSats(0);
      setEstimatedTokens(0);
      return;
    }

      if (tab === 'buy') {
      // Calculate how many tokens user will get for their sats
      if (currentPrice > 0) {
        const tokens = amount / currentPrice;
        setEstimatedTokens(tokens);
        setEstimatedSats(amount);
      }
      } else {
      // Calculate how many sats user will get for their tokens
      if (currentPrice > 0) {
        const sats = amount * currentPrice;
        setEstimatedSats(sats);
        setEstimatedTokens(amount);
      }
    }
  }, [amount, tab, currentPrice]);

  // Get user's sBTC holdings (sats) from backend (24h server cache)
  // Keep local copy in sync if parent provides userSats
  useEffect(() => {
    if (typeof userSats === 'number' && userSats >= 0) {
      setUserBalance(userSats);
    }
  }, [userSats]);

  // Generate mock chart data
  useEffect(() => {
    const generateMockData = () => {
      const data = [];
      const basePrice = currentPrice > 0 ? currentPrice : 0.0468; // Default price if currentPrice is 0
      let currentValue = basePrice;
      
      for (let i = 0; i < 50; i++) {
        // Add some random variation to simulate price movement
        const change = (Math.random() - 0.5) * 0.01; // ±0.5% change
        currentValue = Math.max(0.001, currentValue + change);
        
        data.push({
          time: i,
          price: currentValue
        });
      }
      
      setChartData(data);
    };

    generateMockData();
  }, [currentPrice]);

  const handleTransaction = async () => {
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (mainnetNetworkStatus !== 'healthy') {
      setError('Mainnet network is currently unavailable. Please try again later.');
      return;
    }

    // Check if wallet is connected
    const connectedAddress = typeof window !== 'undefined' ? localStorage.getItem('connectedAddress') : null;
    if (!connectedAddress) {
      setError('Please connect your wallet first');
      return;
    }

    // Check if user has enough balance
    if (tab === 'buy' && userBalance < amount) {
      setError('Insufficient sBTC balance for this transaction');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the DEX contract address from tokenData
      const dexContract = tokenData.dexInfo || tokenData.dexContractAddress;
      if (!dexContract) {
        throw new Error('DEX contract address not found');
      }

      // Parse the contract address (format: "address.contract-name")
      const [contractAddress, contractName] = dexContract.split('.');
      if (!contractAddress || !contractName) {
        throw new Error('Invalid DEX contract format');
      }

      console.log('🚀 Initiating transaction:', {
        type: tab,
        amount: amount,
        contractAddress: contractAddress,
        contractName: contractName,
        userBalance: userBalance
      });

      // Convert amount to micro units (sats to micro-sats)
      const amountInMicroUnits = Math.floor(amount * 100000000);

      // Determine function name based on tab
      const functionName = tab === 'buy' ? 'buy-tokens' : 'sell-tokens';

      // Create post conditions for the transaction
      const postConditions = [];
      
      if (tab === 'buy') {
        // For buying: ensure user has enough sBTC
        postConditions.push(
          Pc.principal(contractAddress).willSendLte(amountInMicroUnits, 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token')
        );
      } else {
        // For selling: ensure user has enough MAS tokens
        // This would need the MAS token contract address
        const masTokenContract = tokenData.tokenInfo || tokenData.tokenContractAddress;
        if (masTokenContract) {
          const [masAddress, masName] = masTokenContract.split('.');
          postConditions.push(
            Pc.principal(masAddress).willSendLte(amountInMicroUnits, `${masAddress}.${masName}`)
          );
        }
      }

      // Create the transaction payload for Leather wallet
      const transactionPayload = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: functionName,
        functionArgs: [uintCV(amountInMicroUnits)],
        network: 'mainnet',
        postConditions: postConditions
      };

      console.log('📋 Transaction payload:', transactionPayload);

      // Request transaction from Leather wallet
      setPendingTransaction(true);
      
      try {
        const result = await request(transactionPayload);
        
        console.log('✅ Mainnet transaction completed:', result);
        setToast({
          message: `${tab === 'buy' ? 'Buy' : 'Sell'} transaction broadcasted!`,
          txId: result.txId || result.txid,
          visible: true,
          status: 'pending'
        });
        setPendingTransaction(false);
        setIsSuccessfulTransaction(true);
        setAmount('');
        
        // Refresh user balance and trades
        if (refreshTrades) {
          refreshTrades();
        }
        
        // Update user balance after successful transaction
        if (tab === 'buy') {
          setUserBalance(prev => Math.max(0, prev - amount));
        } else {
          // For sell transactions, sBTC balance would increase
          setUserBalance(prev => prev + estimatedSats);
        }
      } catch (walletError) {
        console.error('❌ Leather wallet error:', walletError);
        
        if (walletError.message && walletError.message.includes('cancelled')) {
          setToast({
            message: 'Transaction cancelled by user',
            txId: '',
            visible: true,
            status: 'cancelled'
          });
        } else {
          setError(`Wallet error: ${walletError.message || 'Transaction failed'}`);
        }
        setPendingTransaction(false);
      }

    } catch (error) {
      console.error('❌ Mainnet transaction error:', error);
      setError(`Transaction failed: ${error.message}`);
      setPendingTransaction(false);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === 0) return '0';
    if (num < 0.000001) return '< 0.000001';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8
    });
  };

  const formatPrice = (price) => {
    if (price === 0) return '0 sats';
    if (price < 0.000001) return '< 0.000001 sats';
    return `${price.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8
    })} sats`;
  };

  return (
    <div className="mainnet-buy-sell-container">
      {/* Network Status Indicator */}
      <div className={`mainnet-network-status ${mainnetNetworkStatus}`}>
        <span className="status-dot"></span>
        <span className="status-text">
          {mainnetNetworkStatus === 'healthy' ? 'Mainnet Connected' : 
           mainnetNetworkStatus === 'checking' ? 'Checking Mainnet...' : 
           'Mainnet Unavailable'}
        </span>
      </div>

      {/* Token Price Chart */}
      <div className="mainnet-token-chart">
        <div className="chart-header">
          <span className="chart-title">Price Chart (24h)</span>
          <span className="chart-price">{formatPrice(currentPrice)}</span>
        </div>
        <div className="chart-container">
          {chartData.length > 0 && (
            <svg className="price-chart" viewBox="0 0 300 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1"/>
                </linearGradient>
              </defs>
              <path
                d={chartData.map((point, index) => {
                  const x = (index / (chartData.length - 1)) * 300;
                  const y = 100 - ((point.price - Math.min(...chartData.map(p => p.price))) / 
                    (Math.max(...chartData.map(p => p.price)) - Math.min(...chartData.map(p => p.price)))) * 80;
                  return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
                className="chart-line"
              />
              <path
                d={chartData.map((point, index) => {
                  const x = (index / (chartData.length - 1)) * 300;
                  const y = 100 - ((point.price - Math.min(...chartData.map(p => p.price))) / 
                    (Math.max(...chartData.map(p => p.price)) - Math.min(...chartData.map(p => p.price)))) * 80;
                  return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ') + ` L 300 100 L 0 100 Z`}
                fill="url(#chartGradient)"
                className="chart-area"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Mainnet Token Info */}
      <div className="mainnet-token-info">
        <div className="token-symbol">{symbol || 'MAS'}</div>
        <div className="token-details">
          <div className="detail-item">
            <span className="label">Total Supply:</span>
            <span className="value">{formatNumber(totalSupply)}</span>
            <span className="data-tag dummy">DUMMY</span>
          </div>
          <div className="detail-item">
            <span className="label">Liquidity:</span>
            <span className="value">{formatNumber(liquidity)} sats</span>
            <span className="data-tag dummy">DUMMY</span>
          </div>
          <div className="detail-item">
            <span className="label">Revenue:</span>
            <span className="value">{formatNumber(revenue)} sats</span>
            <span className="data-tag dummy">DUMMY</span>
          </div>
          <div className="detail-item">
            <span className="label">Total Treasury Balance:</span>
            <span className="value">{formatNumber(revenue + liquidity)} sats</span>
            <span className="data-tag dummy">DUMMY</span>
          </div>
          <div className="detail-item">
            <span className="label">Total Locked Tokens:</span>
            <span className="value">{formatNumber(liquidity / currentPrice)} {symbol || 'MAS'}</span>
            <span className="data-tag dummy">DUMMY</span>
          </div>
        </div>
        </div>

      {/* Buy/Sell Tabs */}
      <div className="mainnet-tabs">
              <button
          className={`tab ${tab === 'buy' ? 'active' : ''}`}
          onClick={() => setTab('buy')}
        >
          Buy {symbol || 'MAS'}
              </button>
              <button
          className={`tab ${tab === 'sell' ? 'active' : ''}`}
          onClick={() => setTab('sell')}
        >
          Sell {symbol || 'MAS'}
              </button>
            </div>

      {/* User Balance Display */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'rgba(251, 191, 36, 0.1)',
        borderRadius: '8px',
        margin: '12px 0',
        border: '1px solid rgba(251, 191, 36, 0.2)'
      }}>
        <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>
          Your sBTC Balance:
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '16px', color: '#fbbf24' }}>
            {Number(userBalance || 0).toLocaleString()}
          </span>
          <img src="/icons/sats1.svg" alt="sats" style={{ width: 16, height: 16 }} />
          <img src="/icons/Vector.svg" alt="lightning" style={{ width: 16, height: 16 }} />
        </div>
      </div>

      {/* Amount Input */}
      <div className="mainnet-amount-input">
        <label htmlFor="amount">
          {tab === 'buy' ? 'Amount (sats)' : 'Amount (tokens)'}
        </label>
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          placeholder={tab === 'buy' ? 'Enter sats amount' : 'Enter token amount'}
          min="0"
          step="0.00000001"
        />
                  </div>

      {/* Estimates */}
      {amount > 0 && (
        <div className="mainnet-estimates">
          <div className="estimate-item">
            <span className="label">You will receive:</span>
            <span className="value">
              {tab === 'buy' 
                ? `${formatNumber(estimatedTokens)} ${symbol || 'MAS'}`
                : `${formatNumber(estimatedSats)} sats`
              }
            </span>
                </div>
          <div className="estimate-item">
            <span className="label">Current Price:</span>
            <span className="value">{formatPrice(currentPrice)}</span>
                </div>
              </div>
            )}

      {/* Slippage Protection */}
      <div className="mainnet-slippage">
        <label>
                <input
                  type="checkbox"
                  checked={slippageEnabled}
                  onChange={(e) => setSlippageEnabled(e.target.checked)}
          />
          Enable Slippage Protection
                </label>
                {slippageEnabled && (
          <div className="slippage-options">
            <button
              className={`slippage-btn ${slippage === 1 ? 'active' : ''}`}
              onClick={() => setSlippage(1)}
            >
              1%
            </button>
            <button
              className={`slippage-btn ${slippage === 5 ? 'active' : ''}`}
              onClick={() => setSlippage(5)}
            >
              5%
            </button>
                      <button
              className={`slippage-btn ${slippage === 10 ? 'active' : ''}`}
              onClick={() => setSlippage(10)}
            >
              10%
                      </button>
                    <button
              className={`slippage-btn custom ${showCustomSlippage ? 'active' : ''}`}
              onClick={() => setShowCustomSlippage(!showCustomSlippage)}
                    >
                      Custom
                    </button>
                </div>
              )}
        {showCustomSlippage && (
                  <input
                    type="number"
                    value={customSlippage}
            onChange={(e) => setCustomSlippage(e.target.value)}
            placeholder="Enter custom slippage %"
            min="0.1"
            max="50"
            step="0.1"
          />
              )}
            </div>

      {/* Error Display */}
            {error && (
        <div className="mainnet-error">
                {error}
              </div>
      )}

      {/* Transaction Button */}
            <button
        className={`mainnet-transaction-btn ${loading ? 'loading' : ''}`}
        onClick={handleTransaction}
        disabled={loading || mainnetNetworkStatus !== 'healthy' || !amount || amount <= 0}
      >
        {loading ? 'Processing...' : `${tab === 'buy' ? 'Buy' : 'Sell'} ${symbol || 'MAS'}`}
            </button>
            
      {/* Transaction Toast */}
      {toast.visible && (
        <div className="mainnet-toast">
          <div className={`toast-message ${toast.status}`}>
            {toast.message}
            {toast.txId && <div className="tx-id">TX: {toast.txId}</div>}
            <button onClick={() => setToast({ ...toast, visible: false })}>×</button>
          </div>
        </div>
      )}
    </div>
  );
});

export default MainnetBuySellBox;
