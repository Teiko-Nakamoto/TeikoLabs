'use client';
import Link from 'next/link';
import { useState, useRef } from 'react';
import '../components/header.css';
import ConnectWallet from './connectwallet';
import HowItWorks from './HowItWorks'; // ✅ Import popup component
import Leaderboard from './Leaderboard';

export default function Header() {
  const [showPopup, setShowPopup] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false); // ✅ Control modal
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [copied, setCopied] = useState(false);
  const walletRef = useRef(null);

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
              <span>Discord</span>
            </a>
            <a href="https://github.com/masbtc21/dexapp" target="_blank" className="nav-link">
              <img src="/icons/github.svg" alt="GitHub" className="invert-icon" />
              <span>GitHub</span>
            </a>
            <button onClick={() => setShowPopup(true)} className="nav-link support-button">
              <img src="/icons/support.svg" alt="Support" />
              <span>Support</span>
            </button>
          </div>
        </div>

        <nav className="nav-links">
          <div className="center-link">
            {/* ✅ Show popup instead of navigating */}
            <span onClick={() => setShowHowItWorks(true)} className="nav-link">
              How It Works
            </span>
          </div>
          <div className="language-profile">
            <span className="nav-link nav-link-inline">
              <img src="/icons/globe.svg" alt="Language" className="icon" />
              English
            </span>
            <span 
              className="nav-link" 
              onClick={() => setShowLeaderboard(true)}
              style={{ cursor: 'pointer' }}
            >
              Leaderboard
            </span>
          </div>

          {/* ✅ Wallet button with ref */}
          <ConnectWallet ref={walletRef} />
        </nav>
      </header>

      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <p>Email <b>teikonakamoto@tutamail.com</b> for all support issues.</p>
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
              {copied ? 'Copied!' : 'Copy 📋'}
            </button>
            <button onClick={() => setShowPopup(false)}>Close</button>
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
            <button onClick={() => setShowLeaderboard(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
