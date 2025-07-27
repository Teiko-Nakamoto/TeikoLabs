'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function TransactionToast({ message, txId, onClose, status = 'pending', onRetry }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (txId) {
      navigator.clipboard.writeText(txId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Auto-dismiss successful transactions after 3 seconds
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  // Show toast for pending, success, and failed states
  if (status === 'failed') {
  return (
    <div style={toastStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Yellow circle (not spinning) */}
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: '2px solid #fbbf24',
            borderTop: '2px solid transparent',
          }}></div>
          
          {/* Text and retry button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontWeight: 'bold', color: '#fbbf24' }}>
              {t('transaction_failed')}
            </div>
            <button 
              onClick={onRetry}
              style={{
                padding: '4px 8px',
                fontSize: '0.8rem',
                backgroundColor: '#fbbf24',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={toastStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Spinning circle */}
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          borderLeft: `2px solid ${status === 'success' ? '#10b981' : '#fbbf24'}`,
          borderRight: `2px solid ${status === 'success' ? '#10b981' : '#fbbf24'}`,
          borderBottom: `2px solid ${status === 'success' ? '#10b981' : '#fbbf24'}`,
          borderTop: '2px solid transparent',
          animation: status === 'pending' ? 'spin 1s linear infinite' : 'none',
        }}></div>
        
        {/* Text */}
        <div style={{ fontWeight: 'bold', color: status === 'success' ? '#10b981' : '#fbbf24' }}>
          {status === 'success' ? t('transaction_successful') : t('pending')}
        </div>
      </div>
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
  padding: '1rem',
  zIndex: 9999,
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

// Add CSS animation for spinning circle
const spinAnimation = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject the CSS animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinAnimation;
  document.head.appendChild(style);
}
