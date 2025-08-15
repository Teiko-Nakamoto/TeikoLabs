'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import './LearnAboutHowTo.css';

const LearnAboutHowTo = ({ onClose }) => {
  const { t } = useTranslation();

  const [accessSettings, setAccessSettings] = useState({});

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
                The revolutionary system that turns <span style={{ color: '#EF4444' }}>dumps</span> into <span style={{ color: '#60A5FA' }}>opportunities</span> - every trade generates fees for holders. Buy the dip with <span style={{ color: '#60A5FA' }}>zero fear</span> and grow your revenue streams as the largest holder.
              </p>
            </div>
          </div>
          
          {/* Trading Section */}
          <div className="step-container">
            
            {/* Choice Split */}
            <div className="choice-section">
              <div className="step">
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


          
          <div className="learn-more-section">
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link 
                href="/mas/swap" 
                className="create-project-btn"
                style={{ 
                  backgroundColor: '#3b82f6', 
                  borderColor: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🚀 Trade
                <img 
                  src="/icons/The Mas Network.svg" 
                  alt="MAS Sats" 
                  style={{ 
                    width: '20px', 
                    height: '20px',
                    verticalAlign: 'middle'
                  }} 
                />
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


    </div>
  );
};

export default LearnAboutHowTo;
