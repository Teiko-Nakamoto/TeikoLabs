'use client';

import { useEffect, useState } from 'react';
import Header from '../components/header';
import './token-chart.css';
import { supabase } from '../utils/supabaseClient';

export default function ChartPage() {
  const [prices, setPrices] = useState([]);

  useEffect(() => {
    async function fetchPrices() {
      const { data, error } = await supabase
        .from('trades')
        .select('current_price, view_index')
        .not('current_price', 'is', null)
        .order('view_index', { ascending: true });

      if (error) {
        console.error('❌ Error fetching prices:', error);
        return;
      }

      const cleanedPrices = data
        .map(row => parseFloat(row.current_price))
        .filter(price => !isNaN(price));

      setPrices(cleanedPrices);
    }

    fetchPrices();
  }, []);

  // Compute Y-axis bounds
  const minY = Math.min(...prices);
  const maxY = Math.max(...prices);

  // Map price to Y-pixel position
  const scaleY = (value) => {
    const chartHeight = 300;
    return ((value - minY) / (maxY - minY)) * chartHeight;
  };

  return (
    <>
      <Header />
      <main className="chart-page">
        <h1 className="chart-heading">Token Chart (Line)</h1>

        <div className="chart-container" style={{ position: 'relative', display: 'flex' }}>
          {/* Y-Axis Labels */}
          <div className="y-axis">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const value = maxY - (maxY - minY) * ratio;
              return (
                <div className="y-tick" key={index}>
                  {value.toFixed(7)}
                </div>
              );
            })}
            
          </div>

          {/* Line Chart */}
          <svg width="100%" height="300" style={{ flex: 1 }}>
            {prices.map((price, index) => {
              const x = index * 20;
              const y = 300 - scaleY(price);
              const next = prices[index + 1];
              const nextX = (index + 1) * 20;
              const nextY = 300 - scaleY(next);

              return next !== undefined ? (
                <line
                  key={index}
                  x1={x}
                  y1={y}
                  x2={nextX}
                  y2={nextY}
                  stroke="#00ffff"
                  strokeWidth={2}
                />
              ) : null;
            })}
          </svg>
        </div>
      </main>
    </>
  );
}
