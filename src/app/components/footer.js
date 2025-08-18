'use client';

import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export default function Footer() {
  const { t } = useTranslation();
  const [showPopup, setShowPopup] = useState(false);

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('teikonakamoto@tutamail.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <>
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Teiko Labs</h3>
            <p>The Future of Bitcoin DeFi</p>
            <div className="footer-links">
              <a href="/terms" className="footer-link">
                Terms of Service & Risk Disclaimer
              </a>
            </div>
          </div>
          
          <div className="footer-section">
            <h4>Connect</h4>
            <div className="social-links">
              <a href="https://x.com/TeikoLabs" target="_blank" rel="noopener noreferrer" className="social-link">
                <img src="/icons/x.svg" alt="X (Twitter)" className="invert-icon" />
                <span>X (Twitter)</span>
              </a>
              <a href="https://discord.gg/peqX4FnW" target="_blank" rel="noopener noreferrer" className="social-link">
                <img src="/icons/discord.svg" alt="Discord" />
                <span>Discord</span>
              </a>
              <button onClick={() => setShowPopup(true)} className="social-link support-button">
                <img src="/icons/support.svg" alt="Support" />
                <span>Support</span>
              </button>
            </div>
          </div>
          
          <div className="footer-section">
            <h4>Developers</h4>
            <div className="footer-links">
              <a href="https://github.com/masbtc21/dexapp" target="_blank" rel="noopener noreferrer">
                <img src="/icons/github.svg" alt="GitHub" className="invert-icon" style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                GitHub
              </a>

            </div>
          </div>
          
          <div className="footer-section">
            <h4>Resources</h4>
            <div className="footer-links">
              <a href="/docs">
                Documentation
              </a>
              <a href="https://platform.hiro.so/faucet" target="_blank" rel="noopener noreferrer">
                Get Testnet SBTC
              </a>
              <a href="https://explorer.hiro.so" target="_blank" rel="noopener noreferrer">
                Stacks Explorer
              </a>
              <button 
                onClick={() => {
                  // Trigger the How It Works popup from the header
                  window.dispatchEvent(new CustomEvent('showHowItWorks'));
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: 0,
                  font: 'inherit',
                  textDecoration: 'underline'
                }}
              >
                How It Works
              </button>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 Teiko Labs. All rights reserved.</p>
        </div>
      </footer>

      {/* Support popup */}
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


    </>
  );
}
