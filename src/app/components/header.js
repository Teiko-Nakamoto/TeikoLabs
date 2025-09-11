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
  // Removed global holdings display
  
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
        try { localStorage.removeItem('globalHoldings'); } catch {}
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

    // Listen for custom show how it works event from footer
    const handleShowHowItWorks = () => {
      setShowLearnAboutHowTo(true);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('connectWallet', handleConnectWallet);
    window.addEventListener('showHowItWorks', handleShowHowItWorks);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('connectWallet', handleConnectWallet);
      window.removeEventListener('showHowItWorks', handleShowHowItWorks);
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
            {/* How It Works button - Desktop only, hidden when mainnet wallet is connected */}
            {(!connectedAddress || !connectedAddress.startsWith('SP')) && (
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
            )}
          </div>
          
          {/* Mobile menu button - hidden when mainnet wallet is connected */}
          {(!connectedAddress || !connectedAddress.startsWith('SP')) && (
            <div className="mobile-menu-button">
              <button 
                onClick={() => setShowLearnAboutHowTo(true)}
                className="mobile-menu-btn"
                title="How It Works"
              >
                <span>ℹ️</span>
              </button>
            </div>
          )}
          {/* Language Profile - Only visible to admin */}
          {isAdmin && (
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
              </div>
            </div>
          )}

          {/* Global holdings display removed */}

            
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

          {/* ✅ Wallet button with ref */}
          <ConnectWallet ref={walletRef} />
        </nav>
      </header>



      {/* Language Selection Popup */}
      {open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(8px)'
        }}>
          <div 
            ref={dropdownRef}
            style={{
              background: 'linear-gradient(135deg, #1c2d4e 0%, #2d4a7c 100%)',
              borderRadius: '20px',
              padding: '2rem',
              color: '#fff',
              width: '90%',
              maxWidth: '400px',
              maxHeight: '70vh',
              overflowY: 'auto',
              border: '2px solid #60a5fa',
              boxShadow: '0 20px 60px rgba(28, 45, 78, 0.5)',
              position: 'relative'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              borderBottom: '2px solid #60a5fa',
              paddingBottom: '1rem'
            }}>
              <h2 style={{
                color: '#fca311',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                margin: 0
              }}>
                🌐 {t('language')}
              </h2>
              <button
                onClick={() => {
                  setOpen(false);
                  setSearch('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(252, 163, 17, 0.2)';
                  e.target.style.color = '#fca311';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'none';
                  e.target.style.color = '#fff';
                }}
              >
                ×
              </button>
            </div>

            {languages.length > 10 && (
              <div style={{ 
                marginBottom: '1rem',
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <input
                  type="text"
                  placeholder={`Search ${t('language')}...`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #374151',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '1rem'
                  }}
                />
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.5rem',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {filteredLanguages.map(lang => (
                <div
                  key={lang.code}
                  onClick={() => {
                    i18n.changeLanguage(lang.code);
                    setOpen(false);
                    setSearch('');
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    background: i18n.language === lang.code ? '#fca311' : 'rgba(255, 255, 255, 0.1)',
                    fontWeight: i18n.language === lang.code ? 'bold' : 'normal',
                    color: i18n.language === lang.code ? '#000' : '#fff',
                    borderRadius: '8px',
                    border: `1px solid ${i18n.language === lang.code ? '#fca311' : 'rgba(255, 255, 255, 0.2)'}`,
                    transition: 'all 0.3s ease',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (i18n.language !== lang.code) {
                      e.target.style.background = 'rgba(252, 163, 17, 0.2)';
                      e.target.style.borderColor = '#fca311';
                      e.target.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (i18n.language !== lang.code) {
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {lang.label}
                </div>
              ))}
            </div>

            {filteredLanguages.length === 0 && (
              <div style={{ 
                padding: '2rem', 
                color: '#aaa', 
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                No {t('language')} found...
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ Render Learn About How To popup */}
      {showLearnAboutHowTo && <LearnAboutHowTo onClose={() => setShowLearnAboutHowTo(false)} />}


    </>
  );
}
