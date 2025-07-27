'use client';
import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';
import '../components/header.css';
import ConnectWallet from './connectwallet';
import HowItWorks from './HowItWorks'; // ✅ Import popup component
import Leaderboard from './Leaderboard';
import '../../i18n';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const { t, i18n } = useTranslation();
  const [showPopup, setShowPopup] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false); // ✅ Control modal
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [copied, setCopied] = useState(false);
  const walletRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (open && dropdownRef.current) {
      dropdownRef.current.scrollTop = 0;
    }
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('teikonakamoto@tutamail.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleViewProfile = () => {
    const saved = localStorage.getItem('connectedAddress');
    if (saved) {
      window.location.href = '/profile';
    } else {
      walletRef.current?.openConnectModal();
    }
  };

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
          <div className="social-links">
            <a href="https://x.com/TeikoLabs" target="_blank" className="nav-link">
              <img src="/icons/x.svg" alt="X" className="invert-icon" />
            </a>
            <a href="https://discord.gg/peqX4FnW" target="_blank" className="nav-link">
              <img src="/icons/discord.svg" alt="Discord" />
              <span>{t('discord')}</span>
            </a>
            <a href="https://github.com/masbtc21/dexapp" target="_blank" className="nav-link">
              <img src="/icons/github.svg" alt="GitHub" className="invert-icon" />
              <span>{t('github')}</span>
            </a>
            <button onClick={() => setShowPopup(true)} className="nav-link support-button">
              <img src="/icons/support.svg" alt="Support" />
              <span>{t('support')}</span>
            </button>
          </div>
        </div>

        <nav className="nav-links">
          <div className="center-link">
            {/* ✅ Show popup instead of navigating */}
            <span onClick={() => setShowHowItWorks(true)} className="nav-link">
              {t('how_it_works')}
            </span>
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
            <span 
              className="nav-link" 
              onClick={() => setShowLeaderboard(true)}
              style={{ cursor: 'pointer' }}
            >
              {t('leaderboard')}
            </span>
          </div>

          {/* ✅ Wallet button with ref */}
          <ConnectWallet ref={walletRef} />
        </nav>
      </header>

      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <p>{t('support_email_msg')} <b>teikonakamoto@tutamail.com</b> {t('support_issues_msg')}</p>
            <button 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#ffffff', 
                cursor: 'pointer', 
                fontSize: '0.75rem',
                marginLeft: '4px',
                padding: '2px 4px',
                borderRadius: '3px',
                backgroundColor: '#4a5568'
              }}
              onClick={handleCopy}
            >
              {copied ? t('copied') : t('copy_clipboard')}
            </button>
            <button onClick={() => setShowPopup(false)}>{t('close')}</button>
          </div>
        </div>
      )}

      {/* ✅ Render How It Works popup */}
      {showHowItWorks && <HowItWorks onClose={() => setShowHowItWorks(false)} />}
      
      {/* Render Leaderboard popup */}
      {showLeaderboard && (
        <div className="popup-overlay" onClick={() => setShowLeaderboard(false)}>
          <div className="popup leaderboard-popup" onClick={(e) => e.stopPropagation()}>
            <Leaderboard />
            <button onClick={() => setShowLeaderboard(false)}>{t('close')}</button>
          </div>
        </div>
      )}
    </>
  );
}
