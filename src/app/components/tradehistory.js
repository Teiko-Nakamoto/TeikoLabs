'use client';

import { useState, useRef, useEffect } from 'react';
import './tradeHistory.css';

export default function TradeHistory({ trades }) {
  const [index, setIndex] = useState(0); // sliding index
  const [copiedTxId, setCopiedTxId] = useState(null);
  const sliderRef = useRef(null);

  const reversedTrades = [...(trades || [])].reverse();
  const visibleCount = 3;
  const maxIndex = Math.max(0, reversedTrades.length - visibleCount);

  useEffect(() => {
    if (sliderRef.current) {
      const blockWidth = 210; // Block width + margin
      sliderRef.current.style.transition = 'transform 0.4s ease-in-out';
      sliderRef.current.style.transform = `translateX(-${index * blockWidth}px)`;
    }
  }, [index]);

  const copyToClipboard = (txId) => {
    navigator.clipboard.writeText(txId).then(() => {
      setCopiedTxId(txId);
      setTimeout(() => setCopiedTxId(null), 2000);
    });
  };

  if (!trades || trades.length === 0) {
    return <p className="no-trades-msg">No trades to display.</p>;
  }

  return (
   <div className="block-history-wrapper">
  <h3 className="block-history-title">Market History</h3> {/* 🔁 Title updated */}

  <div className="block-container">
    {/* Awaiting block */}
    <div className="trade-block awaiting-block">
      <div className="face">
        <div className="block-line"><strong>Awaiting next trade…</strong></div>
        <div className="block-line">Sats/Mass Sats: —</div> {/* 🔁 Label updated */}
        <div className="block-line">Mass Sats: —</div>       {/* 🔁 Label updated */}
        <div className="block-line">--:--</div>
        <div className="block-line txid-line">
          <span style={{ opacity: 0.5 }}>—</span>
          <button style={{ opacity: 0.5, cursor: 'default' }}>📋</button>
        </div>
      </div>
    </div>

    {/* Divider */}
    <div className="vertical-divider" />

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
                <div className="block-line"><strong>{trade.type.toUpperCase()}</strong></div>
                <div className="block-line">Sats/Mass Sats: {Number(trade.price).toFixed(8)}</div> {/* 🔁 Label updated */}
                <div className="block-line">Mass Sats: {trade.tokens_traded?.toLocaleString() ?? '—'}</div> {/* 🔁 Label updated */}
                <div className="block-line">
                  {new Date(trade.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="block-line txid-line">
                  <a href={txUrl} target="_blank" rel="noopener noreferrer">
                    {trade.transaction_id.slice(0, 10)}...
                  </a>
                  <button onClick={() => copyToClipboard(trade.transaction_id)} title="Copy TxID">
                    {isCopied ? '✓' : '📋'}
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
          ← Prev
        </button>
        <span>Trade {index + 1} of {reversedTrades.length}</span>
        <button onClick={() => setIndex(i => Math.min(maxIndex, i + 1))} disabled={index >= maxIndex}>
          Next →
        </button>
      </div>
    </div>
  );
}
