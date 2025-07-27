'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/header';
import BuySellBox from '../components/BuySellBox';
import Chart from '../components/chart';
import TradeHistory from '../components/tradehistory';
import { supabase } from '../utils/supabaseClient';
import ProfitLoss from '../components/ProfitLoss';
import TokenStats from '../components/TokenStats';

export default function TestPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('buy');
  const [amount, setAmount] = useState('');
  const [estimatedResult, setEstimatedResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [trades, setTrades] = useState([]);
  const [tradesPerCandle, setTradesPerCandle] = useState(1);
  const [activeSection, setActiveSection] = useState('profit');
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [isSuccessfulTransaction, setIsSuccessfulTransaction] = useState(false);

  const triggerPageRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  async function fetchTrades() {
    const { data, error } = await supabase
      .from('TestTrades')
      .select('type, price, created_at, transaction_id, tokens_traded, sats_traded')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching trades:', error);
      return;
    }

    setTrades(data);
  }

  useEffect(() => {
    fetchTrades();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      const storedTab = localStorage.getItem('tab');
      const storedAmount = localStorage.getItem('amount');
      const storedSection = localStorage.getItem('activeSection');
      if (storedTab) setTab(storedTab);
      if (storedAmount) setAmount(storedAmount);
      if (storedSection) setActiveSection(storedSection);
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('tab', tab);
      localStorage.setItem('amount', amount);
      localStorage.setItem('activeSection', activeSection || 'buysell');
    }
  }, [tab, amount, activeSection, isClient]);

  if (!isClient) return <div>{t('loading')}</div>;

  return (
    <div className="test-page">
      <Header />

      {errorMessage && (
        <div className="error-message" style={{ color: 'red', marginBottom: '20px' }}>
          {errorMessage}
        </div>
      )}

      {isRefreshing && (
        <div className="refresh-popup">
          <p>{t('page_refreshing')}</p>
        </div>
      )}

      <div className="main-layout" style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        {/* Left side: Chart and Trade History */}
        <div className="chart-section" style={{ flex: 7, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Chart
            trades={trades}
            tradesPerCandle={tradesPerCandle}
            setTradesPerCandle={setTradesPerCandle}
          />
          <TradeHistory trades={trades} pendingTransaction={pendingTransaction} isSuccessfulTransaction={isSuccessfulTransaction} />
        </div>

        {/* Right side: Buy/Sell + Toggle Display */}
        <div className="trading-section" style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Always show BuySellBox with navigation buttons inside */}
          <BuySellBox
            tab={tab}
            setTab={setTab}
            amount={amount}
            setAmount={setAmount}
            estimatedResult={estimatedResult}
            setEstimatedResult={setEstimatedResult}
            refreshTrades={fetchTrades}
            setErrorMessage={setErrorMessage}
            triggerPageRefresh={triggerPageRefresh}
            setPendingTransaction={setPendingTransaction}
            setIsSuccessfulTransaction={setIsSuccessfulTransaction}
            trades={trades}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
        </div>
      </div>
    </div>
  );
}
