'use client';
import { useState, useEffect } from 'react';

export default function TransactionToast({ message, txId, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (txId) {
      console.log('🔗 View on Explorer:', `https://explorer.stacks.co/txid/${txId}?chain=testnet`);
    }
  }, [txId]);

  const handleCopy = () => {
    if (txId) {
      navigator.clipboard.writeText(txId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Determine what extra status to show
  const showSubmitted = message.includes('transaction submitted');
  const showConfirmed = message.includes('confirmed');
  const showFailed = message.includes('failed');

  return (
    <div style={toastStyle}>
      <button onClick={onClose} style={closeButtonStyle}>✖</button>

      {/* 🟢 Top message (unchanged) */}
      <div style={{ fontWeight: 'bold' }}>{message}</div>

      {/* ⏳ Secondary status */}
      {showSubmitted && !showConfirmed && !showFailed && (
        <div style={secondaryLineStyle}>⏳ Pending confirmation</div>
      )}

      {showConfirmed && (
        <div style={{ ...secondaryLineStyle, color: 'green' }}>✅ Transaction confirmed</div>
      )}

      {showFailed && (
        <div style={{ ...secondaryLineStyle, color: 'red' }}>❌ Transaction failed</div>
      )}

      {txId && (
        <>
          <a
            href={`https://explorer.stacks.co/txid/${txId}?chain=testnet`}
            target="_blank"
            rel="noreferrer"
            style={linkStyle}
          >
            View on Explorer
          </a>
          <div style={txIdStyle}>
            {txId}
            <button onClick={handleCopy} style={copyButtonStyle}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// =============================
// Styles (preserving all originals)
// =============================

const toastStyle = {
  position: 'fixed',
  top: '5rem',
  right: '1rem',
  backgroundColor: '#fff',
  color: '#000',
  padding: '1rem',
  borderRadius: '10px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
  zIndex: 9999,
  width: '320px',
  fontSize: '0.9rem',
  lineHeight: 1.4,
};

const closeButtonStyle = {
  position: 'absolute',
  top: '8px',
  right: '10px',
  border: 'none',
  background: 'none',
  fontSize: '1.1rem',
  color: '#999',
  cursor: 'pointer',
};

const linkStyle = {
  color: '#2563eb',
  fontSize: '0.85rem',
  display: 'inline-block',
  marginTop: '0.5rem',
};

const txIdStyle = {
  marginTop: '0.5rem',
  wordBreak: 'break-all',
  fontSize: '0.75rem',
};

const copyButtonStyle = {
  marginLeft: '10px',
  fontSize: '0.7rem',
  padding: '2px 8px',
  borderRadius: '4px',
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
};

const secondaryLineStyle = {
  marginTop: '0.4rem',
  fontSize: '0.85rem',
};
