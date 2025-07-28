'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabaseClient';

export default function ProfitLoss() {
  const { t } = useTranslation();
  const [timeframe, setTimeframe] = useState('7-day');
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [pnlData, setPnlData] = useState({
    holdings: 0,
    averageCost: 0,
    realizedPnl: 0,
    loading: true
  });

  // Check wallet connection status
  useEffect(() => {
    const checkConnection = () => {
      const connectedAddress = localStorage.getItem('connectedAddress');
      if (connectedAddress) {
        setWalletAddress(connectedAddress);
        setIsConnected(true);
      } else {
        setWalletAddress(null);
        setIsConnected(false);
        setPnlData({ holdings: 0, averageCost: 0, realizedPnl: 0, loading: false });
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
    
    // Also check periodically in case localStorage changes in same tab
    const interval = setInterval(checkConnection, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Fetch P&L data when wallet connects or timeframe changes
  useEffect(() => {
    if (isConnected && walletAddress) {
      fetchPnlData();
    }
  }, [isConnected, walletAddress, timeframe]);

  const fetchPnlData = async () => {
    if (!walletAddress) return;

    setPnlData(prev => ({ ...prev, loading: true }));

    try {
      // Calculate date range based on timeframe
      const now = new Date();
      const daysBack = timeframe === '7-day' ? 7 : 30;
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

      // Fetch trades for the connected wallet in the timeframe
      const { data: trades, error } = await supabase
        .from('TestTrades')
        .select('*')
        .eq('wallet_address', walletAddress)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trades:', error);
        setPnlData({ holdings: 0, averageCost: 0, realizedPnl: 0, loading: false });
        return;
      }

      // Also fetch all-time trades to calculate current holdings and average cost
      const { data: allTrades, error: allError } = await supabase
        .from('TestTrades')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: true });

      if (allError) {
        console.error('Error fetching all trades:', error);
        setPnlData({ holdings: 0, averageCost: 0, realizedPnl: 0, loading: false });
        return;
      }

      // Get current price from latest trade (across all wallets)
      const { data: latestTrades, error: priceError } = await supabase
        .from('TestTrades')
        .select('price')
        .order('created_at', { ascending: false })
        .limit(1);

      const currentPrice = latestTrades?.length > 0 ? latestTrades[0].price : 0;

      // Calculate P&L metrics
      let totalBought = 0;
      let totalSold = 0;
      let totalSpent = 0;
      let totalReceived = 0;
      let avgCostSum = 0;
      let avgCostCount = 0;

      // Process all trades for holdings and average cost
      allTrades.forEach(trade => {
        if (trade.type === 'buy') {
          const tokens = Math.abs(trade.tokens_traded || 0);
          const sats = Math.abs(trade.sats_traded || 0);
          totalBought += tokens;
          totalSpent += sats;
          if (tokens > 0) {
            avgCostSum += (sats / tokens) * tokens; // weighted by tokens
            avgCostCount += tokens;
          }
        } else if (trade.type === 'sell') {
          totalSold += Math.abs(trade.tokens_traded || 0);
          totalReceived += Math.abs(trade.sats_traded || 0);
        }
      });

      // Calculate metrics for the timeframe period only
      let periodRealizedPnl = 0;
      trades.forEach(trade => {
        if (trade.type === 'sell') {
          const tokensSold = Math.abs(trade.tokens_traded || 0);
          const satsReceived = Math.abs(trade.sats_traded || 0);
          const avgCost = avgCostCount > 0 ? avgCostSum / avgCostCount : 0;
          const costBasis = tokensSold * avgCost;
          periodRealizedPnl += (satsReceived - costBasis);
        }
      });

      const currentHoldings = totalBought - totalSold;
      const averageCost = avgCostCount > 0 ? avgCostSum / avgCostCount : 0;

      setPnlData({
        holdings: currentHoldings,
        averageCost: averageCost,
        realizedPnl: periodRealizedPnl,
        loading: false
      });

    } catch (error) {
      console.error('Error calculating P&L:', error);
      setPnlData({ holdings: 0, averageCost: 0, realizedPnl: 0, loading: false });
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
          {/* Timeframe Toggle */}
          <div style={{
            display: 'flex',
            gap: window.innerWidth <= 768 ? '6px' : '8px',
            marginBottom: window.innerWidth <= 768 ? '15px' : '20px'
          }}>
            <button
              onClick={() => setTimeframe('7-day')}
              style={{
                flex: 1,
                padding: window.innerWidth <= 768 ? '6px 8px' : '8px 12px',
                backgroundColor: timeframe === '7-day' ? '#2563eb' : '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: window.innerWidth <= 768 ? '12px' : '14px',
                fontWeight: 'bold'
              }}
            >
              {t('seven_day')}
            </button>
            <button
              onClick={() => setTimeframe('30-day')}
              style={{
                flex: 1,
                padding: window.innerWidth <= 768 ? '6px 8px' : '8px 12px',
                backgroundColor: timeframe === '30-day' ? '#2563eb' : '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: window.innerWidth <= 768 ? '12px' : '14px',
                fontWeight: 'bold'
              }}
            >
              {t('thirty_day')}
            </button>
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
                <span style={{ fontSize: '14px', color: '#e5e7eb' }}>{t('holdings')}:</span>
                <span style={{ fontSize: '14px', color: '#ffffff' }}>
                  {formatNumber(pnlData.holdings)}{' '}
                  <span style={{ color: '#fbbf24' }}>MAS Sats</span>
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
                  <span style={{ color: '#fbbf24' }}>SATS</span>
              </span>
            </div>
            
              {/* P&L */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '14px', color: '#e5e7eb' }}>{t('realized_pnl')}:</span>
                <span style={{ 
                  fontSize: '14px', 
                  color: pnlData.realizedPnl >= 0 ? '#22c55e' : '#ef4444', 
                  fontWeight: 'bold' 
                }}>
                  {pnlData.realizedPnl >= 0 ? '+' : ''}{formatNumber(pnlData.realizedPnl)}{' '}
                  <span style={{ color: '#fbbf24' }}>SATS</span>
              </span>
            </div>
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
