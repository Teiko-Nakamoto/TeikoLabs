'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import './ProfitLoss.css';

export default function ProfitLoss() {
  const [wallet, setWallet] = useState(null);
  const [stats, setStats] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('7d'); // '7d' or '30d'

  useEffect(() => {
    const fetchStats = async () => {
      const address = localStorage.getItem('connectedAddress');
      if (!address) return;

      setWallet(address);

      const { data: statsData, error: statsError } = await supabase
        .from('wallet_token_stats_timed')
        .select('*')
        .eq('wallet_address', address)
        .single();

      const { data: priceData, error: priceError } = await supabase
        .from('TestTrades')
        .select('price')
        .order('created_at', { ascending: false })
        .limit(1);

      if (statsError || priceError) {
        console.error('Error fetching stats or price:', statsError || priceError);
        setLoading(false);
        return;
      }

      setStats(statsData);
      setCurrentPrice(Number(priceData[0]?.price));
      setLoading(false);
    };

    fetchStats();
  }, []);

  const formatPNL = (pnl) => {
    if (pnl === null) return '--';
    const rounded = Math.round(pnl);
    if (rounded > 0) return <span className="pnl-profit">+{rounded} sats</span>;
    if (rounded < 0) return <span className="pnl-loss">{rounded} sats</span>;
    return <span>{rounded} sats</span>;
  };

  const formatCost = (cost) =>
    cost !== null && !isNaN(cost) ? `${Number(cost).toFixed(2)} sats` : '--';

  const getPNL = (avgCost) => {
    if (
      !stats ||
      !stats.cumulative_tokens ||
      avgCost === null ||
      currentPrice === null
    )
      return null;
    return (
      (currentPrice - avgCost) * Number(stats.cumulative_tokens)
    );
  };

  const avgCost =
    view === '7d' ? stats?.avg_cost_7d : stats?.avg_cost_30d;
  const pnl = getPNL(avgCost);

  if (loading) return <div className="profit-loss-container">Loading P&L...</div>;
  if (!wallet || !stats) return <div className="profit-loss-container">No data available</div>;

  return (
    <div className="profit-loss-container">
      <div className="profit-loss-header">
        Your {view === '7d' ? '7-Day' : '30-Day'} Profit & Loss
      </div>

      <div className="toggle-buttons">
        <div
          className={`toggle-button ${view === '7d' ? 'active' : ''}`}
          onClick={() => setView('7d')}
        >
          7-Day
        </div>
        <div
          className={`toggle-button ${view === '30d' ? 'active' : ''}`}
          onClick={() => setView('30d')}
        >
          30-Day
        </div>
      </div>

      <p><strong>Wallet:</strong> {wallet}</p>
     <p><strong>Holdings:</strong> {Math.round(stats.cumulative_tokens).toLocaleString()} MAS Sats</p>
      <p><strong>Average Cost:</strong> {formatCost(avgCost)}</p>
      <p><strong>P&L:</strong> {formatPNL(pnl)}</p>
    </div>
  );
}
