'use client';

import { useState, useEffect } from 'react';
import Header from '../components/header';
import BuySellBox from '../components/BuySellBox';
import Chart from '../components/chart';
import TradeHistory from '../components/tradehistory';
import { supabase } from '../utils/supabaseClient';

export default function TestPage() {
  const [tab, setTab] = useState('buy'); // Default tab value
  const [amount, setAmount] = useState(''); // Default amount value
  const [estimatedResult, setEstimatedResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');  // State to hold error message
  const [isRefreshing, setIsRefreshing] = useState(false);  // To control "Hold on, refreshing" popup
  const [isClient, setIsClient] = useState(false); // Flag to check if client-side

  const [trades, setTrades] = useState([]);
  const [tradesPerCandle, setTradesPerCandle] = useState(1);

  // Function to trigger the refresh with the "Hold on" message
  const triggerPageRefresh = () => {
    setIsRefreshing(true);  // Show the pop-up
    setTimeout(() => {
      window.location.reload();  // Refresh the page after the delay
    }, 2000);  // Delay of 2 seconds
  };

  async function fetchTrades() {
    const { data, error } = await supabase
      .from('TestTrades')
      .select('type, price, created_at, transaction_id, tokens_traded')
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

  // useEffect to check if we're on the client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true); // Set the client-side flag after mount
    }
  }, []);

  // UseEffect to access localStorage only on the client-side
  useEffect(() => {
    if (isClient) {
      const storedTab = localStorage.getItem('tab');
      const storedAmount = localStorage.getItem('amount');
      if (storedTab) setTab(storedTab);
      if (storedAmount) setAmount(storedAmount);
    }
  }, [isClient]);

  // useEffect to store values in localStorage whenever they change
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('tab', tab);
      localStorage.setItem('amount', amount);
    }
  }, [tab, amount, isClient]);

  // Show loading state until the page is rendered client-side
  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="test-page">
      <Header />

      {/* Display error message if exists */}
      {errorMessage && <div className="error-message" style={{ color: 'red', marginBottom: '20px' }}>{errorMessage}</div>}

      {/* Show the "Hold on, page refreshing" pop-up */}
      {isRefreshing && (
        <div className="refresh-popup">
          <p>Hold on, page refreshing...</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        {/* Left side: Chart and Trade History stacked vertically */}
        <div style={{ flex: 7, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Chart
            trades={trades}
            tradesPerCandle={tradesPerCandle}
            setTradesPerCandle={setTradesPerCandle}
          />
          <TradeHistory trades={trades} />
        </div>

        {/* Right side: Buy/Sell Box */}
        <div style={{ flex: 3 }}>
          <h1 className="test-title" style={{ marginBottom: '20px' }}></h1>
          <BuySellBox
            tab={tab}
            setTab={setTab}
            amount={amount}
            setAmount={setAmount}
            estimatedResult={estimatedResult}
            setEstimatedResult={setEstimatedResult}
            refreshTrades={fetchTrades}
            setErrorMessage={setErrorMessage}  // Passing setErrorMessage to BuySellBox
            triggerPageRefresh={triggerPageRefresh}  // Pass the refresh function down
          />
        </div>
      </div>
    </div>
  );
}
