'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import './token-chart.css';

export default function Chart({ trades, tradesPerCandle, setTradesPerCandle }) {
  const chartRef = useRef(null);

  // Initialize tradesPerCandle to 1 for resting state
  const [localTradesPerCandle, setLocalTradesPerCandle] = useState(1);  // Default to 1 trade per candle

  useEffect(() => {
    if (!trades || trades.length === 0 || !chartRef.current) return;

    const candles = [];
    let previousClose = null;

    const groupSize = tradesPerCandle || localTradesPerCandle;

    for (let i = 0; i < trades.length; i += groupSize) {
      const group = trades.slice(i, i + groupSize);
      const prices = group
        .map(t => parseFloat(t.price))
        .filter(p => !isNaN(p) && p > 0);

      if (prices.length === 0) continue;

      const open = prices[0];
      const close = prices[prices.length - 1];
      const high = Math.max(...prices);
      const low = Math.min(...prices);

      candles.push({
        time: ((i / groupSize) + 1) * groupSize,  // Proper cumulative trade count on X-axis
        open: previousClose !== null ? previousClose : open,  // Continuity of candles
        high,
        low,
        close,
      });

      previousClose = close;
    }

    chartRef.current.innerHTML = '';

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 300,
      layout: {
        background: { color: '#111' },
        textColor: '#DDD',
      },
      grid: {
        vertLines: { color: '#444' },
        horzLines: { color: '#444' },
      },
      priceScale: {
        borderColor: '#555',
        scaleMargins: { top: 0.1, bottom: 0.1 },
        mode: 0,
        autoScale: true,
        ticksVisible: true,
        precision: 8,
      },
      timeScale: {
        borderColor: '#555',
        timeVisible: true,
        secondsVisible: true,
        tickMarkFormatter: time => `#${time}`,  // Label x-axis as #3, #6, #9, etc.
      },
      localization: {
        priceFormatter: price => `${price.toFixed(8)} sats`,
      },
    });

    const series = chart.addSeries(CandlestickSeries);
    series.setData(candles);
    series.applyOptions({ lastValueVisible: false, priceLineVisible: false });

    // Add current price line with color based on last candle movement
    const lastCandle = candles[candles.length - 1];
    if (lastCandle && typeof lastCandle.close === 'number') {
      const isGreen = lastCandle.close >= lastCandle.open;
      const lineColor = isGreen ? '#26a69a' : '#ef5350';
      const lineStyle = 2;

      series.createPriceLine({
        price: lastCandle.close,
        color: lineColor,
        lineWidth: 2,
        lineStyle,
        axisLabelVisible: true,
        axisLabelColor: lineColor,
        axisLabelBackgroundColor: '#111',
        axisLabelFontSize: 13,
        axisLabelFontWeight: 'bold',
        axisLabelText: `Current Price: ${lastCandle.close.toFixed(7)} sats/token`,
      });
    }

    // Center and zoom out a bit
    requestAnimationFrame(() => {
      chart.timeScale().fitContent();
      chart.timeScale().applyOptions({ rightOffset: 20 });
    });

    const handleResize = () => {
      chart.applyOptions({ width: chartRef.current.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [trades, tradesPerCandle, localTradesPerCandle]);

  return (
    <div className="chart-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', flex: '1 1 auto', minWidth: '0' }}>
          <img 
            src="/icons/sats1.svg" 
            alt="SATs" 
            style={{ width: '28px', height: '28px', minWidth: '28px' }}
          />
          <img 
            src="/icons/Vector.svg" 
            alt="Lightning" 
            style={{ width: '28px', height: '28px', minWidth: '28px' }}
          />
          <span style={{ color: '#ccc', fontSize: '20px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>/</span>
          <img 
            src="/icons/The Mas Network.svg" 
            alt="Mas Network" 
            style={{ width: '28px', height: '28px', minWidth: '28px' }}
          />
        </div>
        <select
          value={tradesPerCandle || localTradesPerCandle}
          onChange={e => {
            setTradesPerCandle(Number(e.target.value));
            setLocalTradesPerCandle(Number(e.target.value));
          }}
          style={{ background: '#222', color: '#fff', border: '1px solid #444', minWidth: '100px', flex: '0 0 auto' }}
        >
          <option value={1}>1 Trade</option>
          <option value={2}>2 Trades</option>
          <option value={3}>3 Trades</option>
          <option value={5}>5 Trades</option>
          <option value={8}>8 Trades</option>
        </select>
      </div>

      <div ref={chartRef} className="chart-container" />
    </div>
  );
}
