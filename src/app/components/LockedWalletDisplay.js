'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function LockedWalletDisplay() {
  const { t } = useTranslation();
  const [userAddress, setUserAddress] = useState('');

  useEffect(() => {
    // Get the connected wallet address
    const connectedAddress = localStorage.getItem('connectedAddress');
    if (connectedAddress) {
      setUserAddress(connectedAddress);
    }

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'connectedAddress') {
        const newAddress = e.newValue;
        setUserAddress(newAddress || '');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!userAddress) {
    return null; // Don't show anything if not connected
  }

  return (
    <div 
      className="locked-wallet-display"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: '#1a202c',
        border: '1px solid #22c55e',
        borderRadius: '8px',
        color: '#22c55e',
        fontSize: '14px',
        fontWeight: '600'
      }}
    >
      <span style={{ color: '#22c55e' }}>🔒</span>
      <span style={{ color: '#ffffff' }}>Connected:</span>
      <span style={{ 
        fontFamily: 'monospace',
        color: '#22c55e'
      }}>
        {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
      </span>
    </div>
  );
}
