'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabaseClient';

export default function ProfitLoss() {
  const { t } = useTranslation();
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [pnlData, setPnlData] = useState({
    holdings: 0,
    averageCost: 0,
    unrealizedPnl: 0,
    currentPrice: 0,
    loading: true
  });
  const [lastResetDate, setLastResetDate] = useState(null);
  const [showTradeHistory, setShowTradeHistory] = useState(false);
  const [tradeHistory, setTradeHistory] = useState([]);

  // Check wallet connection status
  useEffect(() => {
    const checkConnection = () => {
      const connectedAddress = localStorage.getItem('connectedAddress');
      if (connectedAddress) {
        setWalletAddress(prev => prev !== connectedAddress ? connectedAddress : prev);
        setIsConnected(prev => prev ? prev : true);
        
        // Load last reset date for this wallet (only if user has manually reset)
        const resetKey = `pnl_reset_${connectedAddress}`;
        const savedReset = localStorage.getItem(resetKey);
        if (savedReset) {
          const existingDate = new Date(savedReset);
          setLastResetDate(prev => {
            if (!prev || existingDate.getTime() !== prev.getTime()) {
              return existingDate;
            }
            return prev;
          });
        } else {
          // No reset - use null to indicate all-time data
          setLastResetDate(null);
        }
      } else {
        setWalletAddress(prev => prev ? null : prev);
        setIsConnected(prev => prev ? false : prev);
        setLastResetDate(prev => prev ? null : prev);
        setPnlData(prev => prev.holdings !== 0 ? { holdings: 0, averageCost: 0, unrealizedPnl: 0, currentPrice: 0, loading: false } : prev);
        setShowTradeHistory(false);
        setTradeHistory([]);
      }
    };

    // Check on mount
    checkConnection();

    // Listen for storage changes (when wallet connects/disconnects)
    const handleStorageChange = (e) => {
      if (e.key === 'connectedAddress') {
        checkConnection();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Fetch P&L data when wallet connects (with debounce)
  useEffect(() => {
    if (isConnected && walletAddress) {
      const timeoutId = setTimeout(() => {
      fetchPnlData();
      }, 100); // Small debounce to prevent rapid successive calls
      
      return () => clearTimeout(timeoutId);
    }
  }, [isConnected, walletAddress, lastResetDate]);

  const fetchPnlData = async () => {
    if (!walletAddress) return;

    setPnlData(prev => ({ ...prev, loading: true }));

    try {
      // Fetch trades - either all-time or since reset date
      let query = supabase
        .from('TestTrades')
        .select('*')
        .eq('wallet_address', walletAddress);
      
      if (lastResetDate) {
        // User has manually reset - only get trades since reset date
        query = query.gte('created_at', lastResetDate.toISOString());
        console.log('📊 Fetching trades since manual reset:', lastResetDate.toISOString());
      } else {
        // No reset - get all-time trades
        console.log('📊 Fetching all-time trade data');
      }
      
      const { data: trades, error } = await query.order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching trades:', error);
        setPnlData({ holdings: 0, averageCost: 0, unrealizedPnl: 0, currentPrice: 0, loading: false });
        return;
      }

      // Get current price from latest trade (across all wallets)
      const { data: latestTrades, error: priceError } = await supabase
        .from('TestTrades')
        .select('price')
        .order('created_at', { ascending: false })
        .limit(1);

      const currentPrice = latestTrades?.length > 0 ? latestTrades[0].price : 0;

      // Calculate holdings and average cost from trades since reset
      let totalBought = 0;
      let totalSold = 0;
      let totalSpent = 0;
      let avgCostSum = 0;
      let avgCostCount = 0;

      trades.forEach(trade => {
        if (trade.type === 'buy') {
          const tokensRaw = Math.abs(trade.tokens_traded || 0);
          const tokens = tokensRaw / 1e8; // Convert from base units to actual tokens
          const sats = Math.abs(trade.sats_traded || 0);
          const price = trade.price || 0; // Use actual recorded price
          totalBought += tokens;
          totalSpent += sats;
          if (tokens > 0 && price > 0) {
            avgCostSum += price * tokens; // weighted by tokens using actual price
            avgCostCount += tokens;
          }
        } else if (trade.type === 'sell') {
          const tokensRaw = Math.abs(trade.tokens_traded || 0);
          totalSold += tokensRaw / 1e8; // Convert from base units to actual tokens
        }
      });

      // Debug logging to identify negative holdings issue
      console.log('🔍 Holdings Debug:', {
        totalBought: totalBought,
        totalSold: totalSold,
        difference: totalBought - totalSold,
        trades: trades.map(t => ({
          type: t.type,
          tokens: Math.abs(t.tokens_traded || 0) / 1e8,
          price: t.price
        }))
      });

      // Prevent negative holdings - holdings cannot be negative in reality
      const calculatedHoldings = totalBought - totalSold;
      const currentHoldings = Math.max(0, Math.floor(calculatedHoldings)); // Ensure non-negative
      const averageCost = avgCostCount > 0 ? avgCostSum / avgCostCount : 0;
      
      // Calculate unrealized P&L: current value - cost basis (only if holdings > 0)
      let unrealizedPnl = 0;
      if (currentHoldings > 0 && averageCost > 0) {
        const currentValue = currentHoldings * currentPrice;
        const costBasis = currentHoldings * averageCost;
        unrealizedPnl = currentValue - costBasis;
        
        // Debug P&L calculation
        console.log('💰 P&L Debug:', {
          holdings: currentHoldings,
          currentPrice: currentPrice,
          averageCost: averageCost,
          currentValue: currentValue,
          costBasis: costBasis,
          unrealizedPnl: unrealizedPnl,
          shouldBeProfit: currentPrice > averageCost
        });
      }

      setPnlData({
        holdings: currentHoldings,
        averageCost: averageCost,
        unrealizedPnl: unrealizedPnl,
        currentPrice: currentPrice,
        loading: false
      });

      // Store trade history for detailed view
      setTradeHistory(trades || []);

    } catch (error) {
      console.error('Error calculating P&L:', error);
      setPnlData({ holdings: 0, averageCost: 0, unrealizedPnl: 0, currentPrice: 0, loading: false });
      setTradeHistory([]);
    }
  };

  const copyToClipboard = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress);
        // You could add a toast notification here
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  const handleManualReset = () => {
    if (walletAddress) {
      const now = new Date();
      setLastResetDate(now);
      const resetKey = `pnl_reset_${walletAddress}`;
      localStorage.setItem(resetKey, now.toISOString());
      console.log('🔄 Manual reset: P&L tracking reset by user');
      setShowTradeHistory(false); // Hide trade history on reset
      fetchPnlData(); // Refresh data immediately
    }
  };

  const formatNumber = (num) => {
    if (num === 0) return '0';
    if (Math.abs(num) >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (Math.abs(num) >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  };

  const formatPrice = (price) => {
    if (price < 1) {
      return price.toFixed(6);
    } else if (price < 999.99) {
      return price.toFixed(3);
    } else {
      return Math.round(price).toString();
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: window.innerWidth <= 768 ? '100%' : '320px',
      margin: '0 auto',
      padding: window.innerWidth <= 768 ? '12px' : '16px',
      backgroundColor: '#1c2d4e',
      borderRadius: '12px',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {isConnected ? (
        // Show P&L data when wallet is connected
        <>
          {/* Title and Reset Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid #374151',
            paddingBottom: '12px'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#fbbf24'
            }}>
              📊 {lastResetDate ? 'Unrealized P&L (Since Reset)' : 'All-Time Unrealized P&L'}
            </h3>
            <button
              onClick={handleManualReset}
              style={{
                padding: '4px 8px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              Reset
            </button>
              </div>

          {/* Reset Info */}
          <div style={{
            fontSize: '11px',
            color: '#9ca3af',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            {lastResetDate 
              ? `Tracking since: ${lastResetDate.toLocaleDateString()} • Click Reset to restart tracking`
              : 'Showing all-time data • Click Reset to start fresh tracking'
            }
              </div>

          {/* Wallet Section */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '14px', color: '#e5e7eb' }}>{t('wallet')}:</span>
              <button
                onClick={copyToClipboard}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {t('copy_clipboard')}
              </button>
            </div>
            <div style={{
              fontSize: '12px',
              color: '#ffffff',
              wordBreak: 'break-all',
              backgroundColor: '#374151',
              padding: '8px',
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}>
              {walletAddress.slice(0, 20)}<br />
              {walletAddress.slice(20)}
              </div>
            </div>
            
          {pnlData.loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flex: 1,
              color: '#9ca3af'
            }}>
              {t('loading')}...
            </div>
          ) : (
            <>
              {/* Holdings */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '14px', color: '#e5e7eb' }}>Holdings:</span>
                <span style={{ fontSize: '14px', color: '#ffffff' }}>
                  {formatNumber(pnlData.holdings)}{' '}
                  <img 
                    src="/icons/The Mas Network.svg" 
                    alt="MAS Sats" 
                    style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
                  />
                </span>
              </div>

              {/* Average Cost */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '14px', color: '#e5e7eb' }}>Average Cost:</span>
                <span style={{ fontSize: '14px', color: '#ffffff' }}>
                  {formatPrice(pnlData.averageCost)}{' '}
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
                </span>
              </div>

              {/* Current Price */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '14px', color: '#e5e7eb' }}>Current Price:</span>
                <span style={{ fontSize: '14px', color: '#ffffff' }}>
                  {formatPrice(pnlData.currentPrice)}{' '}
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
              </span>
            </div>
            
              {/* Unrealized P&L */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                backgroundColor: pnlData.unrealizedPnl >= 0 ? '#064e3b' : '#7f1d1d',
                borderRadius: '6px',
                border: `1px solid ${pnlData.unrealizedPnl >= 0 ? '#059669' : '#dc2626'}`,
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '14px', color: '#e5e7eb', fontWeight: 'bold' }}>Unrealized P&L:</span>
                <span style={{ 
                  fontSize: '16px', 
                  color: pnlData.unrealizedPnl >= 0 ? '#22c55e' : '#ef4444', 
                  fontWeight: 'bold' 
                }}>
                  {pnlData.unrealizedPnl >= 0 ? '+' : ''}{formatNumber(pnlData.unrealizedPnl)}{' '}
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
              </span>
            </div>

              {/* View Detailed Trade History Button */}
              <button
                onClick={() => setShowTradeHistory(!showTradeHistory)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#374151',
                  color: '#e5e7eb',
                  border: '1px solid #4b5563',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  marginBottom: showTradeHistory ? '12px' : '0'
                }}
              >
                {showTradeHistory ? '📊 Hide' : '📊 View'} Detailed Trade History ({tradeHistory.length} trades)
              </button>

              {/* Trade History Display */}
              {showTradeHistory && (
                <div style={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  padding: '12px',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#fbbf24',
                    marginBottom: '8px',
                    borderBottom: '1px solid #374151',
                    paddingBottom: '4px'
                  }}>
                    Trade History {lastResetDate ? '(Since Reset)' : '(All-Time)'}
                  </div>
                  
                  {tradeHistory.length === 0 ? (
                    <div style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                      No trades found
                    </div>
                  ) : (
                    tradeHistory.map((trade, index) => {
                      const tradeDate = new Date(trade.created_at);
                      const tokensRaw = Math.abs(trade.tokens_traded || 0);
                      const tokens = Math.floor(tokensRaw / 1e8); // Convert from base units and round down
                      const sats = Math.abs(trade.sats_traded || 0);
                      // Use the actual recorded price from the database
                      const pricePerToken = trade.price || 0;
                      
                      // Calculate profit/loss for sell orders
                      let profitLoss = null;
                      let profitLossPerToken = null;
                      if (trade.type === 'sell' && pnlData.averageCost > 0) {
                        profitLossPerToken = pricePerToken - pnlData.averageCost;
                        profitLoss = profitLossPerToken * tokens;
                      }
                      
                      return (
                        <div key={trade.transaction_id || index} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 0',
                          borderBottom: index < tradeHistory.length - 1 ? '1px solid #374151' : 'none',
                          fontSize: '11px'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              color: trade.type === 'buy' ? '#22c55e' : '#ef4444',
                              fontWeight: 'bold'
                            }}>
                              {trade.type.toUpperCase()}
                            </div>
                            <div style={{ color: '#9ca3af', fontSize: '10px' }}>
                              {tradeDate.toLocaleDateString()} {tradeDate.toLocaleTimeString()}
                            </div>
                          </div>
                          
                          <div style={{ flex: 2, textAlign: 'right' }}>
                            <div style={{ color: '#e5e7eb' }}>
                              {formatNumber(tokens)}{' '}
                              <img 
                                src="/icons/The Mas Network.svg" 
                                alt="MAS Sats" 
                                style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
                              />
                            </div>
                            <div style={{ color: '#9ca3af', fontSize: '10px' }}>
                              @ {formatPrice(pricePerToken)}{' '}
                              <img 
                                src="/icons/sats1.svg" 
                                alt="sats" 
                                style={{ width: '12px', height: '12px', verticalAlign: 'middle', marginRight: '1px' }}
                              />
                              <img 
                                src="/icons/Vector.svg" 
                                alt="lightning" 
                                style={{ width: '12px', height: '12px', verticalAlign: 'middle' }}
                              /> each
                            </div>
                            {/* Show profit/loss for sell orders */}
                            {profitLoss !== null && (
                              <div style={{ 
                                fontSize: '9px', 
                                color: profitLoss >= 0 ? '#22c55e' : '#ef4444',
                                marginTop: '2px'
                              }}>
                                {profitLoss >= 0 ? '+' : ''}{formatNumber(Math.abs(profitLoss))}{' '}
                                <img 
                                  src="/icons/sats1.svg" 
                                  alt="sats" 
                                  style={{ width: '10px', height: '10px', verticalAlign: 'middle', marginRight: '1px' }}
                                />
                                <img 
                                  src="/icons/Vector.svg" 
                                  alt="lightning" 
                                  style={{ width: '10px', height: '10px', verticalAlign: 'middle' }}
                                /> {profitLoss >= 0 ? 'profit' : 'loss'}
                              </div>
                            )}
                          </div>
                          
                          <div style={{ flex: 1, textAlign: 'right', paddingLeft: '8px' }}>
                            <div style={{ color: '#fbbf24' }}>
                              {formatNumber(sats)}{' '}
                              <img 
                                src="/icons/sats1.svg" 
                                alt="sats" 
                                style={{ width: '14px', height: '14px', verticalAlign: 'middle', marginRight: '1px' }}
                              />
                              <img 
                                src="/icons/Vector.svg" 
                                alt="lightning" 
                                style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  {tradeHistory.length > 0 && (() => {
                    // Calculate holdings and weighted average cost from displayed trades
                    let totalCost = 0;
                    let totalBought = 0;
                    let totalSold = 0;
                    let buyTrades = 0;
                    let sellTrades = 0;
                    
                    tradeHistory.forEach(trade => {
                      const tokensRaw = Math.abs(trade.tokens_traded || 0);
                      const tokens = tokensRaw / 1e8; // Convert from base units to actual tokens
                      const price = trade.price || 0;
                      
                      if (trade.type === 'buy') {
                        totalCost += (price * tokens);
                        totalBought += tokens;
                        buyTrades++;
                      } else {
                        totalSold += tokens;
                        sellTrades++;
                      }
                    });
                    
                    // Round down to nearest whole number
                    const currentHoldings = Math.floor(totalBought - totalSold);
                    const calculatedAvgCost = totalBought > 0 ? totalCost / totalBought : 0;
                    
                    return (
                      <>
                        {/* Average Cost Calculation */}
                        <div style={{
                          marginTop: '8px',
                          paddingTop: '8px',
                          borderTop: '1px solid #374151',
                          backgroundColor: '#0f172a',
                          padding: '8px',
                          borderRadius: '4px'
                        }}>
                          <div style={{
                            fontSize: '11px',
                            fontWeight: 'bold',
                            color: '#fbbf24',
                            marginBottom: '6px'
                          }}>
                            📊 Average Cost Calculation {lastResetDate ? '(Since Reset)' : '(All-Time)'}
                          </div>
                          
                          <div style={{ fontSize: '10px', color: '#e5e7eb', lineHeight: '1.4' }}>
                            <div style={{ marginBottom: '4px' }}>
                              <strong>Buy Trades:</strong> {buyTrades} | <strong>Sell Trades:</strong> {sellTrades}
                            </div>
                            <div style={{ marginBottom: '4px' }}>
                              <strong>Total Tokens Bought:</strong> {formatNumber(Math.floor(totalBought))}{' '}
                              <img 
                                src="/icons/The Mas Network.svg" 
                                alt="MAS Sats" 
                                style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
                              />
                            </div>
                            <div style={{ marginBottom: '4px' }}>
                              <strong>Total Tokens Sold:</strong> {formatNumber(Math.floor(totalSold))}{' '}
                              <img 
                                src="/icons/The Mas Network.svg" 
                                alt="MAS Sats" 
                                style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
                              />
                            </div>
                            <div style={{ 
                              marginBottom: '4px',
                              padding: '3px',
                              backgroundColor: '#1e293b',
                              borderRadius: '3px',
                              border: '1px solid #334155'
                            }}>
                              <strong style={{ color: '#22c55e' }}>
                                Current Holdings: {formatNumber(currentHoldings)}{' '}
                                <img 
                                  src="/icons/The Mas Network.svg" 
                                  alt="MAS Sats" 
                                  style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
                                />
                              </strong>
                            </div>
                            <div style={{ marginBottom: '4px' }}>
                              <strong>Total Cost (Buys):</strong> {formatNumber(totalCost)}{' '}
                              <img 
                                src="/icons/sats1.svg" 
                                alt="sats" 
                                style={{ width: '14px', height: '14px', verticalAlign: 'middle', marginRight: '1px' }}
                              />
                              <img 
                                src="/icons/Vector.svg" 
                                alt="lightning" 
                                style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
                              />
                            </div>
                            <div style={{ 
                              padding: '4px',
                              backgroundColor: '#374151',
                              borderRadius: '3px',
                              border: '1px solid #4b5563'
                            }}>
                              <strong style={{ color: '#fbbf24' }}>
                                Weighted Avg Cost: {formatPrice(calculatedAvgCost)}{' '}
                                <img 
                                  src="/icons/sats1.svg" 
                                  alt="sats" 
                                  style={{ width: '14px', height: '14px', verticalAlign: 'middle', marginRight: '1px' }}
                                />
                                <img 
                                  src="/icons/Vector.svg" 
                                  alt="lightning" 
                                  style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
                                /> per token
                              </strong>
                              <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>
                                (From buy orders only - doesn't change with sells)
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Explanation */}
                        <div style={{
                          marginTop: '8px',
                          paddingTop: '8px',
                          borderTop: '1px solid #374151',
                          fontSize: '10px',
                          color: '#9ca3af'
                        }}>
                          💡 Current Holdings = Total Bought - Total Sold. Average cost is calculated only from BUY orders. For SELL orders, profit/loss = (sell price - avg cost) × tokens sold. This breakdown shows exactly how we calculated your holdings ({formatNumber(pnlData.holdings)}{' '}
                          <img 
                            src="/icons/The Mas Network.svg" 
                            alt="MAS Sats" 
                            style={{ width: '12px', height: '12px', verticalAlign: 'middle' }}
                          />) and average cost ({formatPrice(pnlData.averageCost)}{' '}
                          <img 
                            src="/icons/sats1.svg" 
                            alt="sats" 
                            style={{ width: '12px', height: '12px', verticalAlign: 'middle', marginRight: '1px' }}
                          />
                          <img 
                            src="/icons/Vector.svg" 
                            alt="lightning" 
                            style={{ width: '12px', height: '12px', verticalAlign: 'middle' }}
                          />) from the trades above.
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        // Show empty state when no wallet is connected
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          textAlign: 'center',
          color: '#9ca3af'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
            opacity: 0.5
          }}>
            👛
            </div>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#e5e7eb'
          }}>
            {t('connect_wallet')}
            </div>
          <div style={{
            fontSize: '14px',
            lineHeight: '1.4',
            maxWidth: '200px'
          }}>
            {t('connect_wallet_pnl_msg')}
          </div>
        </div>
      )}
    </div>
  );
}
