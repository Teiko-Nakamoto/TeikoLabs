'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabaseClient';
import './Leaderboard.css';

export default function Leaderboard() {
  const { t } = useTranslation();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [topHolders, setTopHolders] = useState([]);
  const [view, setView] = useState('pnl'); // 'pnl' or 'holders'
  const [period, setPeriod] = useState('7d'); // '7d' or '30d'
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const openInExplorer = (address) => {
    // Since the app is configured for testnet (all API calls use STACKS_TESTNET),
    // we'll use testnet explorer for wallet addresses
    const explorerUrl = `https://explorer.stacks.co/address/${address}?chain=testnet`;
    window.open(explorerUrl, '_blank');
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, [period]);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    
    try {
      // Calculate date range
      const now = new Date();
      const daysBack = period === '7d' ? 7 : 30;
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
      
      // Fetch trades for the period
      const { data: trades, error } = await supabase
        .from('TestTrades')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trades:', error);
        return;
      }

      // Get current price from latest trade
      const currentPrice = trades.length > 0 ? trades[0].price : 0;

      // Calculate P&L for each wallet
      const walletStats = {};
      trades.forEach(trade => {
        if (!walletStats[trade.wallet_address]) {
          walletStats[trade.wallet_address] = {
            wallet: trade.wallet_address,
            totalBought: 0,
            totalSold: 0,
            totalSpent: 0,
            totalReceived: 0,
            trades: []
          };
        }
        
        const stats = walletStats[trade.wallet_address];
        stats.trades.push(trade);
        
        if (trade.type === 'buy') {
          stats.totalBought += Math.abs(trade.tokens_traded || 0);
          stats.totalSpent += Math.abs(trade.sats_traded || 0);
        } else {
          stats.totalSold += Math.abs(trade.tokens_traded || 0);
          stats.totalReceived += Math.abs(trade.sats_traded || 0);
        }
      });

      // Calculate realized P&L (only for completed trades)
      const pnlData = Object.values(walletStats)
        .map(stats => {
          const realizedPnl = stats.totalReceived - stats.totalSpent;
          return {
            ...stats,
            realizedPnl,
            avgBuyPrice: stats.totalSpent > 0 ? stats.totalSpent / stats.totalBought : 0,
            avgSellPrice: stats.totalSold > 0 ? stats.totalReceived / stats.totalSold : 0
          };
        })
        .filter(stats => stats.realizedPnl > 0) // Only show profitable traders
        .sort((a, b) => b.realizedPnl - a.realizedPnl)
        .slice(0, 10); // Top 10

      // Calculate top holders (current holdings)
      const holderStats = {};
      trades.forEach(trade => {
        if (!holderStats[trade.wallet_address]) {
          holderStats[trade.wallet_address] = {
            wallet: trade.wallet_address,
            netTokens: 0
          };
        }
        
        if (trade.type === 'buy') {
          holderStats[trade.wallet_address].netTokens += Math.abs(trade.tokens_traded || 0);
        } else {
          holderStats[trade.wallet_address].netTokens -= Math.abs(trade.tokens_traded || 0);
        }
      });

      const holdersData = Object.values(holderStats)
        .filter(stats => stats.netTokens > 0) // Only positive holdings
        .map(holder => ({
          ...holder,
          valueInSats: holder.netTokens * currentPrice // Calculate value in sats
        }))
        .sort((a, b) => b.netTokens - a.netTokens)
        .slice(0, 10); // Top 10

      setLeaderboardData(pnlData);
      setTopHolders(holdersData);
    } catch (error) {
      console.error('Error calculating leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return t('unknown');
    return address; // Show full address
  };

  const formatLargeNumber = (num) => {
    if (!num || isNaN(num)) return '0';
    return Math.floor(Math.abs(num)).toLocaleString();
  };

  if (loading) {
    return <div className="leaderboard-container">{t('loading_leaderboard')}</div>;
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2>{t('leaderboard')}</h2>
        
        <div className="period-toggle">
          <button
            className={`period-btn ${period === '7d' ? 'active' : ''}`}
            onClick={() => setPeriod('7d')}
          >
            {t('seven_day')}
          </button>
          <button
            className={`period-btn ${period === '30d' ? 'active' : ''}`}
            onClick={() => setPeriod('30d')}
          >
            {t('thirty_day')}
          </button>
        </div>
      </div>

      <div className="view-toggle">
        <button
          className={`view-btn ${view === 'pnl' ? 'active' : ''}`}
          onClick={() => setView('pnl')}
        >
          {t('top_performers')}
        </button>
        <button
          className={`view-btn ${view === 'holders' ? 'active' : ''}`}
          onClick={() => setView('holders')}
        >
          {t('top_holders')}
        </button>
      </div>

      {view === 'pnl' ? (
        <div className="leaderboard-table">
          <div className="table-header">
            <span>{t('rank')}</span>
            <span>{t('wallet')}</span>
            <span>{t('realized_pnl')}</span>
            <span>{t('trades')}</span>
          </div>
          {leaderboardData.length > 0 ? (
            leaderboardData.map((entry, index) => (
              <div key={entry.wallet} className="table-row">
                <span className="rank">#{index + 1}</span>
                <span className="wallet">
                  <span 
                    style={{ cursor: 'pointer', textDecoration: 'underline', color: '#fbbf24' }}
                    onClick={() => openInExplorer(entry.wallet)}
                    title={t('click_to_open_explorer')}
                  >
                    {formatAddress(entry.wallet)}
                  </span>
                  <button 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#fbbf24', 
                      cursor: 'pointer', 
                      fontSize: '0.75rem',
                      marginLeft: '4px',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      backgroundColor: '#4a5568'
                    }}
                    onClick={() => copyToClipboard(entry.wallet)}
                    title={t('copy_wallet_address')}
                  >
                    {copied ? t('copied') : t('copy_clipboard')}
                  </button>
                </span>
                <span className="pnl positive">+{formatLargeNumber(entry.realizedPnl)} ⚡</span>
                <span className="trades">{entry.trades.length}</span>
              </div>
            ))
          ) : (
            <div className="no-data">{t('no_profitable_traders')}</div>
          )}
        </div>
      ) : (
        <div className="leaderboard-table">
          <div className="table-header">
            <span>{t('rank')}</span>
            <span>{t('wallet')}</span>
            <span>
              <img 
                src="/icons/The Mas Network.svg" 
                alt="MAS Sats" 
                style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '4px' }}
              />
              {t('held')}
            </span>
            <span>
              <img 
                src="/icons/sats1.svg" 
                alt="sats" 
                style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '1px' }}
              />
              <img 
                src="/icons/Vector.svg" 
                alt="lightning" 
                style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '4px' }}
              />
              {t('value')}
            </span>
          </div>
          {topHolders.length > 0 ? (
            topHolders.map((holder, index) => (
              <div key={holder.wallet} className="table-row">
                <span className="rank">#{index + 1}</span>
                <span className="wallet">
                  <span 
                    style={{ cursor: 'pointer', textDecoration: 'underline', color: '#fbbf24' }}
                    onClick={() => openInExplorer(holder.wallet)}
                    title={t('click_to_open_explorer')}
                  >
                    {formatAddress(holder.wallet)}
                  </span>
                  <button 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#fbbf24', 
                      cursor: 'pointer', 
                      fontSize: '0.75rem',
                      marginLeft: '4px',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      backgroundColor: '#4a5568'
                    }}
                    onClick={() => copyToClipboard(holder.wallet)}
                    title={t('copy_wallet_address')}
                  >
                    {copied ? t('copied') : t('copy_clipboard')}
                  </button>
                </span>
                <span className="holdings">
                  {formatLargeNumber(holder.netTokens)}
                </span>
                <span className="value">
                  {formatLargeNumber(holder.valueInSats)}
                </span>
              </div>
            ))
          ) : (
            <div className="no-data">{t('no_holders_found')}</div>
          )}
        </div>
      )}
    </div>
  );
} 