'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './tradeHistory.css';

export default function TradeHistory({ trades, pendingTransaction, isSuccessfulTransaction }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0); // sliding index
  const [copiedTxId, setCopiedTxId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [transitioningTx, setTransitioningTx] = useState(null);
  const [transitionProgress, setTransitionProgress] = useState(0);

  const sliderRef = useRef(null);

  const reversedTrades = [...(trades || [])].reverse();
  const visibleCount = 3;
  const maxIndex = Math.max(0, reversedTrades.length - visibleCount);

  // Function to format large numbers with K and M
  const formatLargeNumber = (num, locale = (typeof navigator !== 'undefined' ? navigator.language : 'en-US')) => {
    if (!num && num !== 0) return '—';
    return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(num);
  };

  // Update the helper function:
  const formatMasSats = (amount) => formatLargeNumber(Math.round(Number(amount) / 1e8));

  useEffect(() => {
    if (sliderRef.current) {
      const blockWidth = 210; // Block width + margin
      sliderRef.current.style.transition = 'transform 0.4s ease-in-out';
      sliderRef.current.style.transform = `translateX(-${index * blockWidth}px)`;
    }
  }, [index]);

  // Handle transition when pendingTransaction becomes null (transaction confirmed)
  useEffect(() => {
    if (!pendingTransaction && transitioningTx && isSuccessfulTransaction) {
      // Start the transition animation only when transaction is confirmed successfully
      const startTime = Date.now();
      const duration = 3000; // 3 seconds
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        setTransitionProgress(progress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Animation complete, clear the transitioning transaction
          setTransitioningTx(null);
          setTransitionProgress(0);
        }
      };
      
      requestAnimationFrame(animate);
    } else if (pendingTransaction && !transitioningTx) {
      // Store the pending transaction for transition
      setTransitioningTx(pendingTransaction);
      setTransitionProgress(0);
    } else if (!pendingTransaction && transitioningTx && !isSuccessfulTransaction) {
      // Failed transaction - just clear without animation
      setTransitioningTx(null);
      setTransitionProgress(0);
    }
  }, [pendingTransaction, transitioningTx, isSuccessfulTransaction]);

  // Only show transitioning block when transaction is confirmed (pendingTransaction is null)
  const shouldShowTransitioningBlock = !pendingTransaction && transitioningTx;

  const copyToClipboard = async (txId) => {
    try {
      await navigator.clipboard.writeText(txId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  if (!trades || trades.length === 0) {
    return <p className="no-trades-msg">{t('no_trades_msg')}</p>;
  }

  return (
   <div className="block-history-wrapper">
  <h3 className="block-history-title">{t('market_history_title')}</h3> {/* 🔁 Title updated */}

  <div className="block-container" style={{ position: 'relative' }}>
    {/* Awaiting block */}
    <div className="trade-block awaiting-block">
      <div className="face">
        {pendingTransaction && !transitioningTx ? (
          <>
            <div className="block-line">
              <strong>
                {pendingTransaction.type === 'buy' ? (
                  <>
                    Swapped <img 
                      src="/icons/sats1.svg" 
                      alt="sats" 
                      style={{ width: '18px', height: '18px', verticalAlign: 'middle', marginLeft: '4px', marginRight: '2px' }}
                    />
                    <img 
                      src="/icons/Vector.svg" 
                      alt="lightning" 
                      style={{ width: '18px', height: '18px', verticalAlign: 'middle' }}
                    />
                  </>
                ) : (
                  <>
                    Swapped <img 
                      src="/icons/sats1.svg" 
                      alt="sats" 
                      style={{ width: '18px', height: '18px', verticalAlign: 'middle', marginLeft: '4px', marginRight: '2px' }}
                    />
                    <img 
                      src="/icons/Vector.svg" 
                      alt="lightning" 
                      style={{ width: '18px', height: '18px', verticalAlign: 'middle' }}
                    />
                  </>
                )}
                {t('pending_trade_msg')}
              </strong>
            </div>
            <div className="block-line">
              {t('amount_line', { amount: pendingTransaction.satsAmount ? formatLargeNumber(pendingTransaction.satsAmount) : formatLargeNumber(pendingTransaction.amount) })}
            </div>
            <div className="block-line">
              {new Date(pendingTransaction.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div className="block-line txid-line">
              <span style={{ opacity: 0.7 }}>{t('processing_tx_msg')}</span>
              <button style={{ opacity: 0.5, cursor: 'default' }}>{t('loading_icon')}</button>
            </div>
          </>
        ) : transitioningTx ? (
          <>
            <div className="block-line"><strong>{t('awaiting_next_trade_msg')}</strong></div>
            <div className="block-line">{t('price_line', { price: '—' })}</div>
            <div className="block-line">{t('amount_line', { amount: '—' })}</div>
            <div className="block-line">--:--</div>
            <div className="block-line txid-line">
              <span style={{ opacity: 0.5 }}>{t('txid_line', { txid: '—' })}</span>
              <button style={{ opacity: 0.5, cursor: 'default' }}>{t('copy_icon')}</button>
            </div>
          </>
        ) : (
          <>
        <div className="block-line"><strong>{t('awaiting_next_trade_msg')}</strong></div>
            <div className="block-line">{t('price_line', { price: '—' })}</div>
            <div className="block-line">{t('amount_line', { amount: '—' })}</div>
        <div className="block-line">--:--</div>
        <div className="block-line txid-line">
          <span style={{ opacity: 0.5 }}>{t('txid_line', { txid: '—' })}</span>
          <button style={{ opacity: 0.5, cursor: 'default' }}>{t('copy_icon')}</button>
        </div>
          </>
        )}
      </div>
    </div>

    {/* Divider */}
    <div className="vertical-divider" />

    {/* Transitioning block */}
    {shouldShowTransitioningBlock && (
      <div 
        className="trade-block transitioning-block"
        style={{
          position: 'absolute',
          left: `${transitionProgress * 210}px`, // Move from left to right
          backgroundColor: transitionProgress < 0.5 ? 
            'rgba(255, 192, 203, 0.9)' : // Pink until halfway
            `rgba(${255 - (transitionProgress - 0.5) * 200}, ${192 - (transitionProgress - 0.5) * 100}, ${203 + (transitionProgress - 0.5) * 52}, 0.9)`, // Blue after crossing divider
          border: `2px solid ${transitionProgress < 0.5 ? 
            'rgba(255, 192, 203, 0.9)' : // Pink until halfway
            `rgba(${255 - (transitionProgress - 0.5) * 200}, ${192 - (transitionProgress - 0.5) * 100}, ${203 + (transitionProgress - 0.5) * 52}, 0.9)`}`, // Blue after crossing divider
          transform: `scale(${0.8 + transitionProgress * 0.2})`,
          zIndex: 1000,
          transition: 'none'
        }}
      >
        <div className="face">
          <div className="block-line">
            <strong>
              {transitioningTx.type === 'buy' ? (
                <>
                  Swapped <img 
                    src="/icons/sats1.svg" 
                    alt="sats" 
                    style={{ width: '18px', height: '18px', verticalAlign: 'middle', marginLeft: '4px', marginRight: '2px' }}
                  />
                  <img 
                    src="/icons/Vector.svg" 
                    alt="lightning" 
                    style={{ width: '18px', height: '18px', verticalAlign: 'middle' }}
                  />
                </>
              ) : (
                <>
                  Swapped <img 
                    src="/icons/sats1.svg" 
                    alt="sats" 
                    style={{ width: '18px', height: '18px', verticalAlign: 'middle', marginLeft: '4px', marginRight: '2px' }}
                  />
                  <img 
                    src="/icons/Vector.svg" 
                    alt="lightning" 
                    style={{ width: '18px', height: '18px', verticalAlign: 'middle' }}
                  />
                </>
              )}
              {transitionProgress < 0.5 ? t('pending_trade_msg') : t('confirmed_trade_msg')}
            </strong>
          </div>
          <div className="block-line">
            {t('amount_line', { amount: transitioningTx.satsAmount ? formatLargeNumber(transitioningTx.satsAmount) : formatLargeNumber(transitioningTx.amount) })}
          </div>
          <div className="block-line">
            {new Date(transitioningTx.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div className="block-line txid-line">
            <span style={{ opacity: 0.7 }}>{transitionProgress < 0.5 ? t('processing_tx_msg') : t('confirmed_trade_msg')}</span>
            <button style={{ opacity: 0.5, cursor: 'default' }}>{t('loading_icon')}</button>
          </div>
        </div>
      </div>
    )}

    {/* Sliding container */}
    <div className="slide-window">
      <div className="slide-track" ref={sliderRef}>
        {reversedTrades.map((trade, i) => {
          const txUrl = `https://explorer.hiro.so/txid/${trade.transaction_id}?chain=testnet`;
          const isCopied = copiedTxId === trade.transaction_id;
          const typeClass = trade.type === 'buy' ? 'buy-block' : 'sell-block';
          


          return (
            <div key={i} className={`trade-block ${typeClass}`}>
              <div className="face">
                {/* Swapped line */}
                <div className="block-line">
                  <strong>
                    {t('swapped')}:{' '}
                    {trade.type === 'buy'
                      ? (trade.sats_traded ? (
                          <>
                            {formatLargeNumber(trade.sats_traded)}{' '}
                            <img src="/icons/sats1.svg" alt="sats" style={{ width: '14px', height: '14px', verticalAlign: 'middle', marginLeft: '2px', marginRight: '1px' }} />
                            <img src="/icons/Vector.svg" alt="lightning" style={{ width: '14px', height: '14px', verticalAlign: 'middle' }} />
                          </>
                        ) : '—')
                      : (trade.tokens_traded ? (
                          <>
                            {formatMasSats(Math.abs(trade.tokens_traded))}{' '}
                            <img src="/icons/The Mas Network.svg" alt="MAS Sats" style={{ width: '14px', height: '14px', verticalAlign: 'middle', marginLeft: '2px' }} />
                          </>
                        ) : '—')
                      }
                  </strong>
                </div>
                {/* Received line */}
                <div className="block-line">
                  <strong>
                    {t('received')}:{' '}
                    {trade.type === 'buy'
                      ? (trade.tokens_traded ? (
                          <>
                            {formatMasSats(Math.abs(trade.tokens_traded))}{' '}
                            <img src="/icons/The Mas Network.svg" alt="MAS Sats" style={{ width: '14px', height: '14px', verticalAlign: 'middle', marginLeft: '2px' }} />
                          </>
                        ) : '—')
                      : (trade.sats_traded ? (
                          <>
                            {formatLargeNumber(trade.sats_traded)}{' '}
                            <img src="/icons/sats1.svg" alt="sats" style={{ width: '14px', height: '14px', verticalAlign: 'middle', marginLeft: '2px', marginRight: '1px' }} />
                            <img src="/icons/Vector.svg" alt="lightning" style={{ width: '14px', height: '14px', verticalAlign: 'middle' }} />
                          </>
                        ) : '—')
                      }
                  </strong>
                </div>
                {/* Price, time, txid, etc. remain unchanged */}
                <div className="block-line">{t('price')}: {(() => {
                  const price = Number(trade.price);
                  if (price < 1) {
                    return price.toFixed(5);
                  } else if (price >= 1 && price < 999.99) {
                    return price.toFixed(2);
                  } else {
                    return Math.round(price).toString();
                  }
                })()}</div>
                <div className="block-line">
                  {new Date(trade.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="block-line txid-line">
                  <a href={txUrl} target="_blank" rel="noopener noreferrer">{t('txid_line', { txid: trade.transaction_id.slice(0, 10) + '...' })}</a>
                  <button 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#ffffff', 
                      cursor: 'pointer', 
                      fontSize: '0.75rem',
                      marginLeft: '4px',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      backgroundColor: '#4a5568'
                    }}
                    onClick={() => copyToClipboard(trade.transaction_id)}
                    title={t('copy_txid_title')}
                  >
                    {copied ? t('copied_msg') : t('copy_icon')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>


      {/* Pagination */}
      <div className="block-pagination">
        <button onClick={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0}>
          {t('prev_button')}
        </button>
        <span>{t('trade_count', { count: index + 1, total: reversedTrades.length })}</span>
        <button onClick={() => setIndex(i => Math.min(maxIndex, i + 1))} disabled={index >= maxIndex}>
          {t('next_button')}
        </button>
      </div>
    </div>
  );
}
