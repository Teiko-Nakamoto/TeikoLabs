'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ProfitGrowthChart.css';

export default function ProfitGrowthChart() {
  const { t } = useTranslation();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30'); // 7, 30, 90 days

  useEffect(() => {
    loadChartData();
  }, [timeRange]);

  const loadChartData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading chart data...');
      const response = await fetch('/api/quiz/track-fee-pool');
      console.log('📡 API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 API Response data:', data);
        
        if (data.success && data.history) {
          console.log('📈 Raw history data:', data.history);
          const processedData = processChartData(data.history, parseInt(timeRange));
          console.log('🎯 Processed chart data:', processedData);
          setChartData(processedData);
        } else {
          console.error('❌ API returned success: false or no history');
          setError('Failed to load revenue data');
          setChartData([]);
        }
      } else {
        console.error('❌ API request failed:', response.status);
        setError('Failed to load revenue data');
        setChartData([]);
      }
    } catch (error) {
      console.error('❌ Error loading chart data:', error);
      setError('Error loading revenue data');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (history, days) => {
    if (!history || history.length === 0) {
      console.log('⚠️ No history data available');
      return [];
    }

    // Sort by date (oldest first)
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.recorded_at) - new Date(b.recorded_at)
    );

    // Calculate the start date based on the time range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Filter data within the time range
    const filteredData = sortedHistory.filter(record => {
      const recordDate = new Date(record.recorded_at);
      return recordDate >= startDate && recordDate <= endDate;
    });

    console.log(`📅 Filtered data for ${days} days:`, filteredData.length, 'records');

    // If we have no real data, return empty array
    if (filteredData.length === 0) {
      console.log('⚠️ No real data in the selected time range');
      return [];
    }

    // Group by 6-hour intervals and get the maximum value for each interval
    const sixHourData = {};
    filteredData.forEach(record => {
      const date = new Date(record.recorded_at);
      
      // Create 6-hour interval key (4 intervals per day: 00-06, 06-12, 12-18, 18-24)
      const hour = date.getHours();
      const intervalIndex = Math.floor(hour / 6);
      const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const intervalKey = `${dayKey}-${intervalIndex}`; // e.g., "2024-01-15-2" for 12-18 hours
      
      // Keep the maximum value for each 6-hour interval
      if (!sixHourData[intervalKey] || record.fee_pool_amount > sixHourData[intervalKey].fee_pool_amount) {
        sixHourData[intervalKey] = record;
      }
    });

    // Convert to array and sort by date
    const processedData = Object.values(sixHourData)
      .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))
      .map((record, index) => ({
        date: new Date(record.recorded_at),
        revenue: record.fee_pool_amount,
        day: index + 1
      }));

    // Limit to maximum 7 data points
    const limitedData = processedData.slice(-7);

    console.log('📊 Final processed data (max 7 points):', limitedData);

    return limitedData;
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatRevenue = (revenue) => {
    if (revenue >= 1000000) {
      return `${(revenue / 1000000).toFixed(1)}M`;
    } else if (revenue >= 1000) {
      return `${(revenue / 1000).toFixed(1)}K`;
    }
    return revenue.toString();
  };

  const getMaxRevenue = () => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map(d => d.revenue));
  };

  const maxRevenue = getMaxRevenue();

  if (loading) {
    return (
      <div className="profit-growth-chart">
        <div className="chart-header">
          <h3>📈 Profit Growth Over Time</h3>
          <div className="chart-controls">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="time-range-select"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
        </div>
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>Loading revenue data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profit-growth-chart">
        <div className="chart-header">
          <h3>📈 Profit Growth Over Time</h3>
          <div className="chart-controls">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="time-range-select"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
        </div>
        <div className="chart-error">
          <p>❌ {error}</p>
          <button onClick={loadChartData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If no data available, don't render the chart at all
  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="profit-growth-chart">
      <div className="chart-header">
        <h3>📈 Profit Growth Over Time</h3>
        <div className="chart-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
          <button onClick={loadChartData} className="refresh-button">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-bars">
          {chartData.map((dataPoint, index) => {
            const height = maxRevenue > 0 ? (dataPoint.revenue / maxRevenue) * 100 : 0;
            const isLatest = index === chartData.length - 1;
            
            return (
              <div key={index} className="chart-bar-container">
                <div 
                  className={`chart-bar ${isLatest ? 'latest' : ''}`}
                  style={{ height: `${height}%` }}
                  title={`${formatDate(dataPoint.date)}: ${dataPoint.revenue.toLocaleString()} sats`}
                >
                  <span className="bar-value">{formatRevenue(dataPoint.revenue)}</span>
                </div>
                <span className="bar-label">{formatDate(dataPoint.date)}</span>
              </div>
            );
          })}
        </div>

        <div className="chart-stats">
          <div className="stat-item">
            <span className="stat-label">Current Revenue:</span>
            <span className="stat-value">
              {chartData.length > 0 ? chartData[chartData.length - 1].revenue.toLocaleString() : 0} sats
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Peak Revenue:</span>
            <span className="stat-value">
              {maxRevenue.toLocaleString()} sats
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Growth:</span>
            <span className={`stat-value ${chartData.length > 1 ? 
              (chartData[chartData.length - 1].revenue > chartData[0].revenue ? 'positive' : 'negative') : 'neutral'}`}>
              {chartData.length > 1 ? 
                `${((chartData[chartData.length - 1].revenue - chartData[0].revenue) / chartData[0].revenue * 100).toFixed(1)}%` : 
                'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}