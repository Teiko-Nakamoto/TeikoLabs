'use client';
import Link from 'next/link';
import { useState, useRef } from 'react';
import '../components/header.css';
import ConnectWallet from './connectwallet';
import HowItWorks from './HowItWorks'; // ✅ Import popup component

export default function Header() {
  const [showPopup, setShowPopup] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false); // ✅ Control modal
  const walletRef = useRef(null);

  const handleCopy = () => {
    navigator.clipboard.writeText('teikonakamoto@tutamail.com');
    alert('Email address copied to clipboard!');
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
            <span onClick={handleViewProfile} className="nav-link">
              View Profile
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
            <button onClick={handleCopy}>Copy Email</button>
            <button onClick={() => setShowPopup(false)}>Close</button>
          </div>
        </div>
      )}

      {/* ✅ Render How It Works popup */}
      {showHowItWorks && <HowItWorks onClose={() => setShowHowItWorks(false)} />}
    </>
  );
}
