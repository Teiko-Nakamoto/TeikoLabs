'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LockUnlockButton({ tokenId, className = '', children }) {
  const router = useRouter();
  const [showComingSoonPopup, setShowComingSoonPopup] = useState(false);
  const [accessSettings, setAccessSettings] = useState({ lockUnlock: true });

  // Load access settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessSettings');
    if (savedSettings) {
      setAccessSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleClick = () => {
    if (accessSettings.lockUnlock) {
      setShowComingSoonPopup(true);
    } else {
      router.push(`/lock-unlock/${tokenId}`);
    }
  };

  return (
    <>
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
    
    {/* Coming Soon Popup */}
    {showComingSoonPopup && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: '#1a1a2e',
          border: '2px solid #fbbf24',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '400px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{
            fontSize: '60px',
            marginBottom: '20px'
          }}>
            🚧
          </div>
          <h2 style={{
            color: '#fbbf24',
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '16px',
            fontFamily: 'Arial, sans-serif'
          }}>
            Coming Soon!
          </h2>
          <p style={{
            color: '#ccc',
            fontSize: '16px',
            lineHeight: '1.5',
            marginBottom: '24px',
            fontFamily: 'Arial, sans-serif'
          }}>
            Lock/Unlock feature is currently under development. Stay tuned for updates!
          </p>
          <button
            onClick={() => setShowComingSoonPopup(false)}
            style={{
              backgroundColor: '#fbbf24',
              color: '#1a1a2e',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f59e0b';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#fbbf24';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Got it!
          </button>
        </div>
      </div>
    )}
  </>
  );
} 