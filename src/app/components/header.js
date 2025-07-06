'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  connectWallet,
  getUserSession,
  disconnectWallet,
} from '@/wallet-connect/wallet-connect';
import './Header.css';

export default function Header({ onAddressChange }) {
  const [showPopup, setShowPopup] = useState(false);
  const [userAddress, setUserAddress] = useState(null);

  useEffect(() => {
    const session = getUserSession();
    if (session.isUserSignedIn()) {
      const data = session.loadUserData();
      setUserAddress(data.profile.stxAddress.testnet);
      if (onAddressChange) onAddressChange(data.profile.stxAddress.testnet);
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText('teikonakamoto@tutamail.com');
    alert('Email address copied to clipboard!');
  };

  const handleConnect = () => {
    connectWallet(() => {
      const session = getUserSession();
      const data = session.loadUserData();
      setUserAddress(data.profile.stxAddress.testnet);
      if (onAddressChange) onAddressChange(data.profile.stxAddress.testnet);
    });
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setUserAddress(null);
    if (onAddressChange) onAddressChange(null);
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
            <Link href="/how-it-works" className="nav-link">How It Works</Link>
          </div>
          <div className="language-profile">
            <span className="nav-link nav-link-inline">
              <img src="/icons/globe.svg" alt="Language" className="icon" />
              English
            </span>
            <span
              onClick={() => {
                if (userAddress) {
                  window.location.href = '/profile';
                } else {
                  handleConnect();
                }
              }}
              className="nav-link"
            >
              View Profile
            </span>
          </div>

          <button
            onClick={() => {
              if (userAddress) {
                handleDisconnect();
              } else {
                handleConnect();
              }
            }}
            className="connect-button hover-underline"
          >
            {userAddress ? `Disconnect (${userAddress.slice(0, 6)}...)` : 'Connect Wallet'}
          </button>
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
    </>
  );
}
