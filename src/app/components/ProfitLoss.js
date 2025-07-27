'use client';

import React, { useState, useEffect } from 'react';

export default function ProfitLoss() {
  const [timeframe, setTimeframe] = useState('7-day');
  const [walletAddress, setWalletAddress] = useState('ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '320px',
      margin: '0 auto',
      padding: '16px',
      backgroundColor: '#1c2d4e',
      borderRadius: '12px',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Timeframe Toggle */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => setTimeframe('7-day')}
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: timeframe === '7-day' ? '#2563eb' : '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          7-Day
        </button>
        <button
          onClick={() => setTimeframe('30-day')}
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: timeframe === '30-day' ? '#2563eb' : '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          30-Day
        </button>
      </div>

      {/* Wallet Section */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '14px', color: '#e5e7eb' }}>Wallet:</span>
          <button
            onClick={copyToClipboard}
            style={{
              padding: '4px 8px',
              backgroundColor: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            Copy 📋
          </button>
        </div>
        <div style={{
          fontSize: '12px',
          color: '#ffffff',
          wordBreak: 'break-all',
          backgroundColor: '#374151',
          padding: '8px',
          borderRadius: '4px',
          fontFamily: 'monospace'
        }}>
          {walletAddress.slice(0, 20)}<br />
          {walletAddress.slice(20)}
        </div>
      </div>

      {/* Holdings */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <span style={{ fontSize: '14px', color: '#e5e7eb' }}>Holdings:</span>
        <span style={{ fontSize: '14px', color: '#ffffff' }}>
          261,877{' '}
          <span style={{ color: '#fbbf24' }}>SATS</span>
        </span>
      </div>

      {/* Average Cost */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <span style={{ fontSize: '14px', color: '#e5e7eb' }}>Average Cost:</span>
        <span style={{ fontSize: '14px', color: '#ffffff' }}>
          0.114557{' '}
          <span style={{ color: '#fbbf24' }}>SATS</span>
        </span>
      </div>

      {/* P&L */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '14px', color: '#e5e7eb' }}>P&L:</span>
        <span style={{ fontSize: '14px', color: '#22c55e', fontWeight: 'bold' }}>
          +422{' '}
          <span style={{ color: '#fbbf24' }}>SATS</span>
        </span>
      </div>
    </div>
  );
}
