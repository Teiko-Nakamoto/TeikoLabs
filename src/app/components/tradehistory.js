'use client';

import { useState } from 'react';
import './tradeHistory.css';

export default function TradeHistory({ trades }) {
  const [page, setPage] = useState(1);
  const [copiedTxId, setCopiedTxId] = useState(null);
  const TRADES_PER_PAGE = 15;

  if (!trades || trades.length === 0) {
    return <p className="no-trades-msg">No trades to display.</p>;
  }

  const paginatedTrades = trades
    .slice()
    .reverse()
    .slice((page - 1) * TRADES_PER_PAGE, page * TRADES_PER_PAGE);

  const copyToClipboard = (txId) => {
    navigator.clipboard.writeText(txId).then(() => {
      setCopiedTxId(txId);
      setTimeout(() => setCopiedTxId(null), 2000);
    });
  };

  const totalPages = Math.ceil(trades.length / TRADES_PER_PAGE);

  return (
    <div className="trade-history-container">
      <h3 className="trade-history-title">Recent Trades</h3>
      <table className="trade-history-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Sats/Token</th>
            <th>Tokens Traded</th>
            <th>Time</th>
            <th>TxID</th>
          </tr>
        </thead>
        <tbody>
          {paginatedTrades.map((trade, idx) => {
            const txUrl = `https://explorer.hiro.so/txid/${trade.transaction_id}?chain=testnet`;
            const isCopied = copiedTxId === trade.transaction_id;
            const typeClass = trade.type === 'buy' ? 'buy' : trade.type === 'sell' ? 'sell' : '';

            return (
              <tr key={idx} className="trade-row">
                {/* Apply typeClass to all data cells except TxID */}
                <td className={`type-cell ${typeClass}`}>
                  {trade.type.charAt(0).toUpperCase() + trade.type.slice(1)}
                </td>
                <td className={typeClass}>{Number(trade.price).toFixed(8)}</td>
                <td className={typeClass}>{trade.tokens_traded?.toLocaleString() ?? '—'}</td>
                <td className={typeClass}>
                  {new Date(trade.created_at).toLocaleString(undefined, {
                    hour12: true,
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="txid-cell">
                  <a
                    href={txUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="txid-link"
                    title="View transaction on Explorer"
                  >
                    {trade.transaction_id.slice(0, 10)}...
                  </a>
                  <button
                    className="copy-button"
                    onClick={() => copyToClipboard(trade.transaction_id)}
                    aria-label={`Copy full transaction ID ${trade.transaction_id}`}
                    title="Copy full TxID"
                  >
                    {isCopied ? '✓' : '📋'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="pagination-container">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="pagination-button"
          aria-label="Previous page"
        >
          ← Prev
        </button>
        <span className="pagination-info">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(p => (p < totalPages ? p + 1 : p))}
          disabled={page === totalPages}
          className="pagination-button"
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
