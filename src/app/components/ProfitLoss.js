'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function ProfitLoss({ tokenData, trades = [], currentPrice = 0 }) {
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

  // Calculate P&L data when wallet connects or trade data changes
  useEffect(() => {
    if (isConnected && walletAddress && trades) {
      calculatePnlData();
    }
  }, [isConnected, walletAddress, lastResetDate, trades, currentPrice]);

  const calculatePnlData = () => {
    if (!walletAddress || !trades) return;

    setPnlData(prev => ({ ...prev, loading: true }));

    try {
      // Filter trades for this wallet and since reset date (if applicable)
      let filteredTrades = trades.filter(trade => {
        // Check if trade is from this wallet (using sender address)
        const isFromWallet = trade.sender === walletAddress;
        
        // If reset date is set, only include trades since that date
        if (lastResetDate) {
          const tradeDate = new Date(trade.created_at);
          return isFromWallet && tradeDate >= lastResetDate;
        }
        
        return isFromWallet;
      });

      console.log('📊 PnL calculation - filtered trades:', {
        totalTrades: trades.length,
        walletTrades: filteredTrades.length,
        walletAddress: walletAddress,
        resetDate: lastResetDate
      });

      // Calculate holdings and average cost from trades
      let totalBought = 0;
      let totalSold = 0;
      let totalSpent = 0;
      let avgCostSum = 0;
      let avgCostCount = 0;

      filteredTrades.forEach(trade => {
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
          
          console.log('💰 Buy trade:', { tokens, sats, price, totalBought, totalSpent });
        } else if (trade.type === 'sell') {
          const tokensRaw = Math.abs(trade.tokens_traded || 0);
          const tokens = tokensRaw / 1e8; // Convert from base units to actual tokens
          totalSold += tokens;
          
          console.log('💸 Sell trade:', { tokens, totalSold });
        }
      });

      // Debug logging to identify negative holdings issue
      console.log('🔍 Holdings Debug:', {
        totalBought: totalBought,
        totalSold: totalSold,
        difference: totalBought - totalSold,
        trades: filteredTrades.map(t => ({
          type: t.type,
          tokens: Math.abs(t.tokens_traded || 0) / 1e8,
          price: t.price,
          sender: t.sender
        }))
      });

      // Prevent negative holdings - holdings cannot be negative in reality
      const calculatedHoldings = totalBought - totalSold;
      const currentHoldings = Math.max(0, calculatedHoldings); // Ensure non-negative
      const averageCost = avgCostCount > 0 ? avgCostSum / avgCostCount : 0;
      
      // Use current price from props or fallback to latest trade price
      const effectiveCurrentPrice = currentPrice || (trades.length > 0 ? trades[0].price : 0);
      
      // Calculate unrealized P&L: current value - cost basis (only if holdings > 0)
      let unrealizedPnl = 0;
      if (currentHoldings > 0 && averageCost > 0 && effectiveCurrentPrice > 0) {
        const currentValue = currentHoldings * effectiveCurrentPrice;
        const costBasis = currentHoldings * averageCost;
        unrealizedPnl = currentValue - costBasis;
        
        // Debug P&L calculation
        console.log('💰 P&L Debug:', {
          holdings: currentHoldings,
          currentPrice: effectiveCurrentPrice,
          averageCost: averageCost,
          currentValue: currentValue,
          costBasis: costBasis,
          unrealizedPnl: unrealizedPnl,
          shouldBeProfit: effectiveCurrentPrice > averageCost
        });
      }

      setPnlData({
        holdings: currentHoldings,
        averageCost: averageCost,
        unrealizedPnl: unrealizedPnl,
        currentPrice: effectiveCurrentPrice,
        loading: false
      });

      // Store trade history for detailed view
      setTradeHistory(filteredTrades || []);

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
      calculatePnlData(); // Refresh data immediately
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
    // Convert to number and handle invalid values
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice === 0) {
      return '0.000000';
    }
    
    if (numPrice < 1) {
      return numPrice.toFixed(6);
    } else if (numPrice < 999.99) {
      return numPrice.toFixed(3);
    } else {
      return Math.round(numPrice).toString();
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
              <Link href="/profile" style={{ textDecoration: 'none' }}>
                <button
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
                    marginBottom: '0'
                  }}
                >
                  📊 View Detailed Trade History
                </button>
              </Link>
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
