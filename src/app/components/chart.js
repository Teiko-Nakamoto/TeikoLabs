'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { useTranslation } from 'react-i18next';
import './token-chart.css';

export default function Chart({ trades, tradesPerCandle, setTradesPerCandle, tradeLimit, setTradeLimit }) {
  const { t } = useTranslation();
  const chartRef = useRef(null);

  // Initialize tradesPerCandle to 1 for resting state
  const [localTradesPerCandle, setLocalTradesPerCandle] = useState(1);  // Default to 1 trade per candle
  const [localTradeLimit, setLocalTradeLimit] = useState(20); // Default to 20 trades
  
  // State to track current market sentiment for background color
  const [isCurrentlyGreen, setIsCurrentlyGreen] = useState(true); // Default to green/blue

  useEffect(() => {
    if (!trades || trades.length === 0 || !chartRef.current) return;

    // Limit the number of trades shown (use most recent trades)
    const currentTradeLimit = tradeLimit || localTradeLimit;
    const limitedTrades = trades.slice(-currentTradeLimit);

    const candles = [];
    let previousClose = null;

    const groupSize = tradesPerCandle || localTradesPerCandle;

    for (let i = 0; i < limitedTrades.length; i += groupSize) {
      const group = limitedTrades.slice(i, i + groupSize);
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

      // Update the background sentiment state
      setIsCurrentlyGreen(isGreen);

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
  }, [trades, tradesPerCandle, localTradesPerCandle, tradeLimit, localTradeLimit]);

  // Dynamic background style based on market sentiment
  const dynamicWrapperStyle = {
    background: isCurrentlyGreen 
      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)' // Blue gradient for green/bullish
      : 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%)', // Pink gradient for red/bearish
    border: isCurrentlyGreen 
      ? '1px solid rgba(59, 130, 246, 0.2)' // Blue border for green/bullish
      : '1px solid rgba(236, 72, 153, 0.2)', // Pink border for red/bearish
    transition: 'all 0.3s ease', // Smooth transition between colors
  };

  return (
    <div className="chart-wrapper" style={dynamicWrapperStyle}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
        padding: '8px 0'
      }}>
        {/* Mobile-first header layout */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row',
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {/* Icons container - centered on mobile */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            justifyContent: 'center',
            flex: '1 1 auto',
            minWidth: '200px'
          }}>
            <img 
              src="/icons/sats1.svg" 
              alt="SATs" 
              style={{ 
                width: 'clamp(24px, 5vw, 32px)', 
                height: 'clamp(24px, 5vw, 32px)', 
                verticalAlign: 'middle' 
              }} 
            />
            <img 
              src="/icons/Vector.svg" 
              alt="lightning" 
              style={{ 
                width: 'clamp(24px, 5vw, 32px)', 
                height: 'clamp(24px, 5vw, 32px)', 
                verticalAlign: 'middle' 
              }} 
            />
            <span style={{ 
              color: '#fff', 
              fontSize: 'clamp(20px, 4vw, 28px)', 
              fontWeight: '600', 
              whiteSpace: 'nowrap',
              margin: '0 4px'
            }}>
              /
            </span>
            <img 
              src="/icons/The Mas Network.svg" 
              alt="MAS Sats" 
              style={{ 
                width: 'clamp(24px, 5vw, 32px)', 
                height: 'clamp(24px, 5vw, 32px)', 
                verticalAlign: 'middle' 
              }} 
            />
          </div>

          {/* Dropdown controls container */}
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-end',
            flexWrap: 'wrap'
          }}>
            {/* Trade Limit Control */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{
                fontSize: 'clamp(10px, 2vw, 12px)',
                color: '#ccc',
                fontWeight: '500'
              }}>
                Trades to Show
              </label>
              <select
                value={tradeLimit || localTradeLimit}
                onChange={e => {
                  const value = parseInt(e.target.value);
                  setLocalTradeLimit(value);
                  if (setTradeLimit) setTradeLimit(value);
                }}
                style={{ 
                  background: '#222', 
                  color: '#fff', 
                  border: '1px solid #444', 
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  minWidth: '70px',
                  flex: '0 0 auto'
                }}
              >
                <option value={5}>5 Trades</option>
                <option value={10}>10 Trades</option>
                <option value={20}>20 Trades</option>
                <option value={40}>40 Trades</option>
                <option value={80}>80 Trades</option>
              </select>
            </div>

            {/* Candle Grouping Control */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{
                fontSize: 'clamp(10px, 2vw, 12px)',
                color: '#ccc',
                fontWeight: '500'
              }}>
                Trades per Candle
              </label>
              <select
                value={tradesPerCandle || localTradesPerCandle}
                onChange={e => {
                  const value = parseInt(e.target.value);
                  setLocalTradesPerCandle(value);
                  if (setTradesPerCandle) setTradesPerCandle(value);
                }}
                style={{ 
                  background: '#222', 
                  color: '#fff', 
                  border: '1px solid #444', 
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  minWidth: '80px',
                  flex: '0 0 auto'
                }}
              >
                <option value={1}>{t('one_trade')}</option>
                <option value={2}>{t('two_trades')}</option>
                <option value={3}>{t('three_trades')}</option>
                <option value={5}>{t('five_trades')}</option>
                <option value={8}>{t('eight_trades')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div ref={chartRef} className="chart-container" />
    </div>
  );
}
