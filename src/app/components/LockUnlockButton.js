'use client';

import { useRouter } from 'next/navigation';

export default function LockUnlockButton({ tokenId, className = '', children }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/lock-unlock/${tokenId}`);
  };

  return (
    <button
      onClick={handleClick}
      className={`lock-unlock-button ${className}`}
      style={{
        background: '#3b82f6', 
        color: '#fff', 
        border: '1px solid #2563eb', 
        padding: '12px 20px',
        borderRadius: '8px',
        fontSize: '12px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        fontWeight: '600',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
        width: '220px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = '#2563eb';
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = '#3b82f6';
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
      }}
    >
      {children || '🔒 Lock/Unlock Tokens'}
    </button>
  );
} 