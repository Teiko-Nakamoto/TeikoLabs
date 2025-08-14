'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { useTranslation } from 'react-i18next';
import './token-chart.css';

export default function Chart({ trades, tradesPerCandle, setTradesPerCandle, tradeLimit, setTradeLimit, currentPrice, isHeaderVisible, setIsHeaderVisible }) {
  const { t } = useTranslation();
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const priceLineRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize tradesPerCandle to 1 for resting state
  const [localTradesPerCandle, setLocalTradesPerCandle] = useState(1);  // Default to 1 trade per candle
  const [localTradeLimit, setLocalTradeLimit] = useState(20); // Default to 20 trades
  
  // State to track current market sentiment for background color
  const [isCurrentlyGreen, setIsCurrentlyGreen] = useState(true); // Default to green/blue
  
  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState(1); // 1 for up, -1 for down
  


  // Function to create bouncing animation
  const startBouncingAnimation = (currentPrice, lastExecutedPrice) => {
    if (!priceLineRef.current || !chartInstanceRef.current) return;
    
    setIsAnimating(true);
    let startTime = Date.now();
    const stepDuration = 1500; // 1.5 seconds per step
    const totalDuration = 6000; // 6 seconds total cycle
    const stepsPerDirection = 4; // 4 steps to go from one price to the other (6 seconds / 1.5 seconds = 4 steps)
    
    // Calculate price difference and step size
    const priceDifference = lastExecutedPrice - currentPrice;
    const stepSize = priceDifference / (stepsPerDirection - 1); // Divide by (steps-1) to hit exact endpoints
    
    let currentStep = 0;
    let direction = 1; // 1 for going up, -1 for going down
    let basePrice = currentPrice;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const currentStepTime = elapsed % stepDuration;
      
      // Check if it's time to move to the next step
      if (currentStepTime < 50) { // Small buffer to ensure step change
        // Calculate which step we should be on
        const totalSteps = Math.floor(elapsed / stepDuration);
        const newStep = totalSteps % (stepsPerDirection * 2);
        
        if (newStep !== currentStep) {
          currentStep = newStep;
          
          // Determine direction and base price
          if (currentStep < stepsPerDirection) {
            // Going from current price to last executed price
            direction = 1;
            basePrice = currentPrice;
          } else {
            // Going from last executed price back to current price
            direction = -1;
            basePrice = lastExecutedPrice;
          }
        }
      }
      
      // Calculate the current price based on step
      let stepProgress;
      if (currentStep < stepsPerDirection) {
        // Going up: 0, 1, 2, 3
        stepProgress = currentStep;
      } else {
        // Going down: 0, 1, 2, 3 (but from last executed price)
        stepProgress = currentStep - stepsPerDirection;
      }
      
      const animatedPrice = basePrice + (direction * stepSize * stepProgress);
      
      // Update the price line with the discrete price
      if (priceLineRef.current) {
        priceLineRef.current.applyOptions({
          price: animatedPrice,
          axisLabelText: `Current Price: ${animatedPrice.toFixed(8)} sats/token`,
        });
      }
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  // Function to stop animation
  const stopBouncingAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsAnimating(false);
  };

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
        open: previousClose !== null ? previousClose : open,  // Use previous close for continuity, or first price for first candle
        high,
        low,
        close,
      });

      previousClose = close;  // Set this candle's close as the next candle's open
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

    // Store chart instance for animation
    chartInstanceRef.current = chart;

    const series = chart.addSeries(CandlestickSeries);
    series.setData(candles);
    series.applyOptions({ lastValueVisible: false, priceLineVisible: false });

    // Simple approach: Always use the last executed price from the chart
    const lastExecutedPrice = candles.length > 0 ? candles[candles.length - 1]?.close : null;
    
    if (lastExecutedPrice && typeof lastExecutedPrice === 'number') {
      // Determine color based on the last trade type (buy/sell)
      let isGreen = true; // Default to green/blue
      
      if (limitedTrades.length > 0) {
        // Get the last trade and check its type
        const lastTrade = limitedTrades[limitedTrades.length - 1];
        if (lastTrade && lastTrade.type) {
          // Blue for buy (bullish), red for sell (bearish)
          isGreen = lastTrade.type.toLowerCase() === 'buy';
        }
      }
      
      const lineColor = isGreen ? '#26a69a' : '#ef5350';
      const lineStyle = 2;

      // Update the background sentiment state
      setIsCurrentlyGreen(isGreen);

      // Create price line and store reference
      priceLineRef.current = series.createPriceLine({
        price: lastExecutedPrice,
        color: lineColor,
        lineWidth: 2,
        lineStyle,
        axisLabelVisible: true,
        axisLabelColor: lineColor,
        axisLabelBackgroundColor: '#111',
        axisLabelFontSize: 13,
        axisLabelFontWeight: 'bold',
        axisLabelText: `Execution Price: ${lastExecutedPrice.toFixed(8)} sats/token`,
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
      stopBouncingAnimation();
      chart.remove();
    };
  }, [trades, tradesPerCandle, localTradesPerCandle, tradeLimit, localTradeLimit, currentPrice]);

  return (
    <div className="chart-box-outer">
      <div 
        className="chart-box-inner"
        style={{
          background: isCurrentlyGreen ? '#3776c6' : '#ec4899', // Blue for green candles, pink for red candles
          transition: 'background 0.3s ease', // Smooth transition between colors
        }}
      >
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
              <option value={1}>1 Trade</option>
              <option value={2}>2 Trades</option>
              <option value={3}>3 Trades</option>
              <option value={4}>4 Trades</option>
              <option value={5}>5 Trades</option>
            </select>
          </div>

          {/* Hide Header Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{
              fontSize: 'clamp(10px, 2vw, 12px)',
              color: '#ccc',
              fontWeight: '500'
            }}>
              Header
            </label>
            <button
              onClick={() => setIsHeaderVisible(!isHeaderVisible)}
              style={{ 
                background: '#222', 
                color: '#fff', 
                border: '1px solid #444', 
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                minWidth: '80px',
                cursor: 'pointer',
                flex: '0 0 auto'
              }}
            >
              {isHeaderVisible ? 'Hide' : 'Show'}
            </button>
          </div>

        </div>
        </div>

        <div 
          ref={chartRef} 
          className="chart-container" 
        />
      </div>
    </div>
  );
}
