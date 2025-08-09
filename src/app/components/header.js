'use client';
import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';
import '../components/header.css';
import ConnectWallet from './connectwallet';
import LearnAboutHowTo from './LearnAboutHowTo'; // ✅ Import popup component
import '../../i18n';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const { t, i18n } = useTranslation();
  const [showLearnAboutHowTo, setShowLearnAboutHowTo] = useState(false); // ✅ Control modal
  const walletRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);
  const [connectedAddress, setConnectedAddress] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Admin wallet address
  const ADMIN_ADDRESS = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';

  useEffect(() => {
    if (open && dropdownRef.current) {
      dropdownRef.current.scrollTop = 0;
    }
  }, [open]);

  // Check wallet connection and admin status
  useEffect(() => {
    const checkWalletConnection = () => {
      const savedAddress = localStorage.getItem('connectedAddress');
      if (savedAddress) {
        setConnectedAddress(savedAddress);
        setIsAdmin(savedAddress === ADMIN_ADDRESS);
      } else {
        setConnectedAddress('');
        setIsAdmin(false);
      }
    };

    // Check on mount
    checkWalletConnection();

    // Listen for storage changes (when wallet connects/disconnects)
    const handleStorageChange = (e) => {
      if (e.key === 'connectedAddress') {
        checkWalletConnection();
      }
    };

    // Listen for custom connect wallet event from home page
    const handleConnectWallet = () => {
      if (walletRef.current) {
        walletRef.current.openConnectModal();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('connectWallet', handleConnectWallet);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('connectWallet', handleConnectWallet);
    };
  }, []);





  const languages = [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'pt', label: 'Português' },
    { code: 'fr', label: 'Français' },
    { code: 'it', label: 'Italiano' },
    { code: 'ru', label: 'Русский' },
    { code: 'ko', label: '한국어' },
    { code: 'ar', label: 'العربية' }
  ];

  const filteredLanguages = search
    ? languages.filter(lang => lang.label.toLowerCase().includes(search.toLowerCase()))
    : languages;

  return (
    <>
      <header className="header">
        <div className="left-section">
          <Link href="/" className="nav-link">
            <img src="/logo.png" alt="Teiko Labs Logo" className="logo" />
          </Link>
        </div>

        <nav className="nav-links">
          <div className="center-link desktop-only">
            {/* How It Works button - Desktop only */}
            <button 
              onClick={() => setShowLearnAboutHowTo(true)}
              className="nav-link"
              style={{ 
                textDecoration: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                font: 'inherit'
              }}
            >
              How It Works
            </button>
          </div>
          
          {/* Mobile menu button */}
          <div className="mobile-menu-button">
            <button 
              onClick={() => setShowLearnAboutHowTo(true)}
              className="mobile-menu-btn"
              title="How It Works"
            >
              <span>ℹ️</span>
            </button>
          </div>
          <div className="language-profile">
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <span
                onClick={() => setOpen(!open)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #374151',
                  background: '#1c2d4e',
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontWeight: 'bold',
                  color: '#fff',
                  minWidth: 90,
                  display: 'inline-block',
                  boxShadow: open ? '0 0 0 3px #60a5fa, 0 0 0 6px rgba(96, 165, 250, 0.3)' : undefined
                }}
              >
                {languages.find(l => l.code === i18n.language)?.label || t('language')}
            </span>
              {open && (
                <div
                  ref={dropdownRef}
                  style={{
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    background: '#1c2d4e',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    zIndex: 100,
                    minWidth: '160px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    color: '#fff',
                    padding: '8px 0',
                    maxHeight: '160px', // Show search + 3 options
                    overflowY: 'auto'
                  }}
                >
                  {languages.length > 10 && (
                    <div style={{ padding: '8px 12px', background: '#2d3748', borderRadius: '8px', margin: '0 8px 8px 8px' }}>
                      <input
                        type="text"
                        placeholder={t('language')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid #374151',
                          background: '#1c2d4e',
                          color: '#fff',
                          outline: 'none'
                        }}
                      />
                    </div>
                  )}
                  {filteredLanguages.map(lang => (
                    <div
                      key={lang.code}
                      onClick={() => {
                        i18n.changeLanguage(lang.code);
                        setOpen(false);
                        setSearch('');
                      }}
                      style={{
                        padding: '10px 18px',
                        cursor: 'pointer',
                        background: i18n.language === lang.code ? '#2563eb' : 'transparent',
                        fontWeight: i18n.language === lang.code ? 'bold' : 'normal',
                        color: i18n.language === lang.code ? '#fff' : '#fff',
                        borderRadius: '8px',
                        margin: '2px 8px'
                      }}
                    >
                      {lang.label}
                    </div>
                  ))}
                  {filteredLanguages.length === 0 && (
                    <div style={{ padding: '10px 18px', color: '#aaa', textAlign: 'center' }}>{t('language')}...</div>
                  )}
                </div>
              )}
            </div>

            
            {/* Admin Icon - Only visible to admin wallet */}
            {isAdmin && (
              <Link 
                href="/admin"
                className="nav-link" 
                style={{ 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#fbbf24',
                  fontWeight: 'bold'
                }}
                title="Admin Dashboard"
              >
                <span style={{ fontSize: '16px' }}>🛠️</span>
                <span>Admin</span>
              </Link>
            )}
          </div>

          {/* ✅ Wallet button with ref */}
          <ConnectWallet ref={walletRef} />
        </nav>
      </header>



      {/* ✅ Render Learn About How To popup */}
      {showLearnAboutHowTo && <LearnAboutHowTo onClose={() => setShowLearnAboutHowTo(false)} />}


    </>
  );
}
