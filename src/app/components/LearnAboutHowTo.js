'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import './LearnAboutHowTo.css';

const LearnAboutHowTo = ({ onClose }) => {
  const { t } = useTranslation();
  const [showComingSoonPopup, setShowComingSoonPopup] = useState(false);
  const [accessSettings, setAccessSettings] = useState({ createProject: true });

  // Load access settings from server
  useEffect(() => {
    const loadAccessSettings = async () => {
      try {
        const response = await fetch('/api/access-settings');
        const data = await response.json();
        if (data.success) {
          setAccessSettings(data.settings);
        }
      } catch (error) {
        console.error('Failed to load access settings:', error);
        // Keep default settings if API fails
      }
    };
    loadAccessSettings();

    // Listen for settings updates
    const handleAccessSettingsUpdate = () => {
      loadAccessSettings();
    };
    
    window.addEventListener('accessSettingsUpdated', handleAccessSettingsUpdate);

    return () => {
      window.removeEventListener('accessSettingsUpdated', handleAccessSettingsUpdate);
    };
  }, []);

  const handleCreateProjectClick = (e) => {
    if (accessSettings.createProject) {
      e.preventDefault();
      setShowComingSoonPopup(true);
    }
    // If createProject is false, let the normal Link navigation happen
  };
  
  return (
    <div className="learn-about-overlay" onClick={onClose}>
      <div className="learn-about-popup" onClick={(e) => e.stopPropagation()}>
        <div className="learn-about-header">
          <h2>How It Works</h2>
        </div>
        <button onClick={onClose} className="close-btn" style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'none',
          border: 'none',
          color: '#fbbf24',
          fontSize: '2rem',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          padding: '0',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          zIndex: 100
        }}>×</button>
        
        <div className="learn-about-content">
          {/* MAS Sats Introduction */}
          <div className="section-header">
            <h3>🚀 Introducing MAS Sats</h3>
            <div className="mas-sats-intro">
              <img 
                src="/icons/The Mas Network.svg" 
                alt="MAS Sats" 
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  marginBottom: '1rem',
                  filter: 'drop-shadow(0 4px 8px rgba(251, 191, 36, 0.3))'
                }} 
              />
              <h4 style={{ color: '#fbbf24', marginBottom: '0.5rem', fontSize: '1.3rem' }}>
                Market Activated Satoshis
              </h4>
              <p style={{ 
                color: '#9CA3AF', 
                fontSize: '0.9rem', 
                lineHeight: '1.5', 
                marginBottom: '1rem',
                fontFamily: 'Arial, sans-serif',
                textAlign: 'center',
                maxWidth: '500px',
                margin: '0 auto 1rem'
              }}>
                Discourages dumps by allowing anyone to claim the trading fee revenue generated and saved in smart contracts on-chain. Incentivising holders to <span style={{ color: '#60A5FA' }}>HODL</span> and not <span style={{ color: '#EF4444' }}>DUMP</span>.
              </p>
            </div>
          </div>
          
                     {/* MAS Sats Features */}
           <div className="step-container">
             <div className="step">
               <div className="step-content">
                 <h4>Key Features</h4>
                 <p>MAS Sats operates on an <strong>infinite bonding curve</strong> with a maximum supply of <strong>21 million units</strong>, trading against <strong>sBTC</strong> for continuous liquidity and price discovery.</p>
               </div>
             </div>
           </div>

                     {/* Trading Section */}
          
          <div className="step-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>How Trading Works</h4>
                <p>MAS Sats can be bought and sold on the infinite bonding curve. Whoever locks away the most MAS sats can withdraw revenue at any time, but cannot unlock tokens until the trading fee is paid back from trading.</p>
              </div>
            </div>
            
            {/* Choice Split */}
            <div className="choice-section">
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Choose Your Strategy</h4>
                </div>
              </div>
              
              <h4 className="choice-title">Two Paths to Profit:</h4>
              
              <div className="choice-container">
                <div className="choice-option">
                  <div className="choice-number">A</div>
                  <div className="choice-content">
                    <h5>Accumulate & Lock Ownership</h5>
                    <p>Accumulate MAS Sats and lock away ownership of your holdings in order to withdraw trading profit from every transaction.</p>
                  </div>
                </div>
                
                <div className="choice-divider">OR</div>
                
                <div className="choice-option">
                  <div className="choice-number">B</div>
                  <div className="choice-content">
                    <h5>Trade for Profit/Loss</h5>
                    <p>Trade MAS Sats on the infinite bonding curve for a profit or loss based on market movements.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Liquidity Warning Section */}
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            padding: '20px',
            margin: '24px 0',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '24px',
              marginBottom: '12px'
            }}>
              ⚠️
            </div>
            <h3 style={{
              color: '#92400e',
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 12px 0',
              fontFamily: 'Arial, sans-serif'
            }}>
              Low Liquidity Warning
            </h3>
            <p style={{
              color: '#78350f',
              fontSize: '14px',
              lineHeight: '1.5',
              margin: '0',
              fontFamily: 'Arial, sans-serif'
            }}>
              <strong>Buying:</strong> Transactions with 999 sats or less may fail due to low liquidity.<br/>
              <strong>Selling:</strong> Transactions with 7,000 tokens or less may fail due to low liquidity.
            </p>
          </div>
          
          <div className="learn-more-section">
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/mas/swap" className="create-project-btn">
                🚀 Trade MAS Sats
              </Link>
              <a 
                href="https://app.velar.com/swap" 
                target="_blank" 
                rel="noopener noreferrer"
                className="create-project-btn"
                style={{ backgroundColor: '#3b82f6', borderColor: '#2563eb' }}
              >
                ₿ Get sBTC
              </a>
            </div>
            
            <div className="terms-link-section">
              <Link href="/docs" className="terms-link" style={{ marginRight: '1rem' }}>
                📚 Documentation
              </Link>
              <Link href="/terms" className="terms-link">
                📋 Terms of Service & Risk Disclaimer
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Popup */}
      {showComingSoonPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: '#1a1a2e',
            border: '2px solid #fbbf24',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '400px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              fontSize: '60px',
              marginBottom: '20px'
            }}>
              🚧
            </div>
            <h2 style={{
              color: '#fbbf24',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px',
              fontFamily: 'Arial, sans-serif'
            }}>
              Coming Soon!
            </h2>
            <p style={{
              color: '#ccc',
              fontSize: '16px',
              lineHeight: '1.5',
              marginBottom: '24px',
              fontFamily: 'Arial, sans-serif'
            }}>
              This feature is currently under development. Stay tuned for updates!
            </p>
            <button
              onClick={() => setShowComingSoonPopup(false)}
              style={{
                backgroundColor: '#fbbf24',
                color: '#1a1a2e',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f59e0b';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#fbbf24';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnAboutHowTo;
