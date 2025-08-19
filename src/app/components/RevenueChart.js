'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, BarSeries } from 'lightweight-charts';
import { useTranslation } from 'react-i18next';
import './revenue-chart.css';

export default function RevenueChart({ tokenId }) {
  const { t } = useTranslation();
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const [newRevenueAmount, setNewRevenueAmount] = useState('');
  const [addingRevenue, setAddingRevenue] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const connectedAddress = localStorage.getItem('connectedAddress');
    const adminAddresses = [
      'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4',
      'SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B'
    ];
    setIsAdmin(adminAddresses.includes(connectedAddress));
  }, []);

  // Fetch revenue data
  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/get-daily-revenue?days=30');
      const result = await response.json();
      
      if (result.success) {
        setRevenueData(result.chartData || []);
      } else {
        console.error('Failed to fetch revenue data:', result.error);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  // Initialize chart
  useEffect(() => {
    if (!revenueData.length || !chartRef.current) return;

    // Clean up previous chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
    }

    // Create chart
    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(75, 85, 99, 0.2)' },
        horzLines: { color: 'rgba(75, 85, 99, 0.2)' },
      },
      rightPriceScale: {
        visible: false, // Hide Y-axis
        borderColor: 'transparent',
      },
      leftPriceScale: {
        visible: false, // Hide Y-axis
        borderColor: 'transparent',
      },
      timeScale: {
        borderColor: 'rgba(75, 85, 99, 0.3)',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time) => {
          const date = new Date(time * 1000);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(59, 130, 246, 0.3)',
          width: 1,
          style: 0,
        },
        horzLine: {
          visible: false,
        },
      },
    });

    // Add bar series
    const barSeries = chart.addBarSeries({
      upColor: '#3b82f6',
      downColor: '#3b82f6',
      borderVisible: false,
      wickVisible: false,
    });

    // Format data for chart
    const chartData = revenueData.map(item => ({
      time: new Date(item.date).getTime() / 1000,
      value: item.revenue_sats,
    }));

    barSeries.setData(chartData);

    // Add revenue labels on top of bars
    setTimeout(() => {
      const bars = chartRef.current.querySelectorAll('[data-time]');
      bars.forEach((bar, index) => {
        if (chartData[index]) {
          const label = document.createElement('div');
          label.className = 'revenue-label';
          label.textContent = chartData[index].value.toLocaleString();
          label.style.cssText = `
            position: absolute;
            top: ${bar.offsetTop - 25}px;
            left: ${bar.offsetLeft + bar.offsetWidth / 2}px;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            z-index: 10;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            white-space: nowrap;
          `;
          chartRef.current.appendChild(label);
        }
      });
    }, 100);

    // Handle resize
    const handleResize = () => {
      chart.applyOptions({ width: chartRef.current.clientWidth });
    };

    window.addEventListener('resize', handleResize);
    chartInstanceRef.current = chart;

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [revenueData]);

  // Add new revenue (admin only)
  const handleAddRevenue = async () => {
    if (!newRevenueAmount || parseFloat(newRevenueAmount) <= 0) {
      alert('Please enter a valid revenue amount');
      return;
    }

    setAddingRevenue(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const revenueAmount = parseFloat(newRevenueAmount);
      
      const response = await fetch('/api/add-daily-revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          revenue_sats: revenueAmount,
          revenue_usd: revenueAmount * 0.0006, // Approximate USD conversion
          trading_fees_sats: Math.floor(revenueAmount * 0.7),
          platform_fees_sats: Math.floor(revenueAmount * 0.3),
          total_trades: Math.floor(revenueAmount / 300), // Estimate based on average trade size
          avg_trade_size_sats: 300,
          notes: 'Added by admin'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Revenue data added successfully!');
        setNewRevenueAmount('');
        setShowAddRevenue(false);
        fetchRevenueData(); // Refresh chart
      } else {
        alert('Failed to add revenue data: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding revenue:', error);
      alert('Error adding revenue data');
    } finally {
      setAddingRevenue(false);
    }
  };

  if (loading) {
    return (
      <div className="revenue-chart-container">
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>Loading revenue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="revenue-chart-container">
      <div className="chart-header">
        <h3>Daily Revenue Chart</h3>
        {isAdmin && (
          <button
            onClick={() => setShowAddRevenue(!showAddRevenue)}
            className="add-revenue-btn"
          >
            {showAddRevenue ? 'Cancel' : 'Add Revenue'}
          </button>
        )}
      </div>

      {showAddRevenue && isAdmin && (
        <div className="add-revenue-form">
          <div className="form-group">
            <label htmlFor="revenueAmount">Today's Revenue (sats)</label>
            <input
              type="number"
              id="revenueAmount"
              value={newRevenueAmount}
              onChange={(e) => setNewRevenueAmount(e.target.value)}
              placeholder="Enter revenue amount"
              min="0"
              step="1"
            />
          </div>
          <button
            onClick={handleAddRevenue}
            disabled={addingRevenue || !newRevenueAmount}
            className="submit-btn"
          >
            {addingRevenue ? 'Adding...' : 'Add Revenue'}
          </button>
        </div>
      )}

      <div className="chart-wrapper">
        <div ref={chartRef} className="chart-container" />
      </div>

      {revenueData.length === 0 && (
        <div className="no-data">
          <p>No revenue data available</p>
          {isAdmin && (
            <button
              onClick={() => setShowAddRevenue(true)}
              className="add-first-revenue-btn"
            >
              Add First Revenue Entry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
