'use client';

import React from 'react';
import Header from '../components/header';
import Footer from '../components/footer';

export default function TeikoBridgePage() {
  // Supported pairs only: sBTC <-> BTCs and USDh <-> USDC
  const PAIRS = { sBTC: 'BTCs', BTCs: 'sBTC', USDh: 'USDC', USDC: 'USDh' };
  const tokens = [
    { symbol: 'sBTC', label: 'sBTC' },
    { symbol: 'BTCs', label: 'BTCs' },
    { symbol: 'USDh', label: 'USDh' },
    { symbol: 'USDC', label: 'USDC' },
  ];

  const [fromToken, setFromToken] = React.useState('sBTC');
  const [toToken, setToToken] = React.useState(PAIRS['sBTC']);
  const [fromAmount, setFromAmount] = React.useState('');
  const [toAmount, setToAmount] = React.useState('');
  const [showSoon, setShowSoon] = React.useState(false);

  const triggerComingSoon = () => {
    try {
      const seen = sessionStorage.getItem('bridge_soon_seen');
      if (!seen) setShowSoon(true);
    } catch { setShowSoon(true); }
  };

  const flip = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
    triggerComingSoon();
  };

  const handleFromChange = (val) => {
    setFromToken(val);
    setToToken(PAIRS[val]);
  };

  const handleToChange = (val) => {
    // Enforce valid pair by setting counterpart automatically
    setToToken(val);
    setFromToken(PAIRS[val]);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12,
          padding: '1.5rem',
          maxWidth: 720,
          width: '100%',
          color: '#fff'
        }}>
          <h2 style={{ margin: 0, marginBottom: '0.75rem', textAlign: 'center' }}>Token Swap</h2>
          <p style={{ color: '#9CA3AF', marginTop: 0, marginBottom: '1rem', textAlign: 'center' }}>
            Supported routes only: sBTC ↔ BTCs, USDh ↔ USDC.
          </p>

          {/* From card */}
          <div style={{
            background: '#0f2b4c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '0.75rem 1rem',
            marginBottom: '0.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>From</span>
              <select
                value={fromToken}
                onChange={(e) => { handleFromChange(e.target.value); triggerComingSoon(); }}
                style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 10px' }}
              >
                {tokens.map(t => (
                  <option key={t.symbol} value={t.symbol} style={{ color: '#000' }}>{t.label}</option>
                ))}
              </select>
            </div>
            <input
              value={fromAmount}
              onChange={(e) => { setFromAmount(e.target.value); triggerComingSoon(); }}
              placeholder="0"
              inputMode="decimal"
              style={{
                width: '100%',
                background: '#123a64',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                padding: '18px 14px',
                fontSize: 20
              }}
            />
          </div>

          {/* Flip button */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '0.25rem 0 0.75rem' }}>
            <button
              onClick={flip}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: 9999,
                padding: '8px 14px',
                fontWeight: 700
              }}
              title="Flip"
            >
              ⇅ Swap
            </button>
          </div>

          {/* To card */}
          <div style={{
            background: '#0f2b4c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '0.75rem 1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>To</span>
              <select
                value={toToken}
                onChange={(e) => { handleToChange(e.target.value); triggerComingSoon(); }}
                style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 10px' }}
              >
                {/* Only allow the paired token as destination */}
                <option value={PAIRS[fromToken]} style={{ color: '#000' }}>{PAIRS[fromToken]}</option>
              </select>
            </div>
            <input
              value={toAmount}
              onChange={(e) => { setToAmount(e.target.value); triggerComingSoon(); }}
              placeholder="0"
              inputMode="decimal"
              style={{
                width: '100%',
                background: '#123a64',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                padding: '18px 14px',
                fontSize: 20
              }}
            />
          </div>

          <button
            style={{
              width: '100%',
              background: '#f43f5e',
              border: 'none',
              color: '#fff',
              padding: '14px 18px',
              borderRadius: 10,
              fontWeight: 700,
              letterSpacing: 0.5
            }}
            onClick={() => triggerComingSoon()}
          >
            Swap
          </button>
        </div>
      </main>
      {showSoon && (
        <div className="popup-overlay" onClick={() => { setShowSoon(false); try { sessionStorage.setItem('bridge_soon_seen','1'); } catch {} }}>
          <div className="popup" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: 420 }}>
            <h3 style={{ marginTop: 0 }}>Coming Soon</h3>
            <p style={{ color: '#9CA3AF' }}>The Teiko Bridge swap is under construction. Please check back shortly.</p>
            <button className="support-button" style={{ marginTop: 10 }} onClick={() => { setShowSoon(false); try { sessionStorage.setItem('bridge_soon_seen','1'); } catch {} }}>OK</button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}


