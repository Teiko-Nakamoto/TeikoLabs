'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../components/header';

export default function CreateTokenPage() {
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showTradeChart, setShowTradeChart] = useState(false);
  const [showWalletPopup, setShowWalletPopup] = useState(false);

  // Show coming soon popup when page loads
  useEffect(() => {
    setShowComingSoon(true);
  }, []);

  const handleGetButtonClick = () => {
    // Check if wallet is connected
    const connectedAddress = localStorage.getItem('connectedAddress');
    
    if (!connectedAddress) {
      // No wallet connected - show popup
      setShowWalletPopup(true);
      return;
    }
    
    // Check if wallet address starts with "st" (testnet) instead of "sp" (mainnet)
    if (connectedAddress.startsWith('ST')) {
      // Testnet wallet connected - show popup
      setShowWalletPopup(true);
      return;
    }
    
    // Wallet is connected and is mainnet (starts with "SP") - proceed normally
    setShowComingSoon(false);
    setShowTradeChart(true);
  };

        return (
    <>
      <Header />
              <main className="create-project-page">
          {!showTradeChart ? (
            <div className="container">
              <div className="coming-soon-content">
                <h1>🚧 Create Token Project</h1>
                <p>This feature is coming soon!</p>
                <Link href="/" className="back-button">
                  ← Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <div className="trade-chart-container">
              <div className="chart-header">
                <h1>📈 MAS Sats Trading Chart</h1>
                <button 
                  className="back-to-home-button"
                  onClick={() => {
                    setShowTradeChart(false);
                    setShowComingSoon(true);
                  }}
                >
                  ← Back to Create Project
                </button>
              </div>
              
              <div className="chart-content">
                <div className="price-info">
                  <div className="current-price">
                    <span className="price-label">Current Price:</span>
                    <span className="price-value">$0.00000123</span>
                    <span className="price-change positive">+2.45%</span>
                  </div>
                  <div className="price-stats">
                    <div className="stat">
                      <span className="stat-label">24h High:</span>
                      <span className="stat-value">$0.00000128</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">24h Low:</span>
                      <span className="stat-value">$0.00000119</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">24h Volume:</span>
                      <span className="stat-value">$1,234,567</span>
                    </div>
                  </div>
                </div>
                
                <div className="mock-chart">
                  <div className="chart-placeholder">
                    <div className="chart-line"></div>
                    <div className="chart-line"></div>
                    <div className="chart-line"></div>
                    <div className="chart-line"></div>
                    <div className="chart-line"></div>
                    <div className="chart-line"></div>
                    <div className="chart-line"></div>
                    <div className="chart-line"></div>
                    <div className="chart-line"></div>
                    <div className="chart-line"></div>
                  </div>
                  <div className="chart-labels">
                    <span>9:00</span>
                    <span>12:00</span>
                    <span>15:00</span>
                    <span>18:00</span>
                    <span>21:00</span>
                  </div>
                </div>
                
                <div className="trading-actions">
                  <button className="buy-button">Buy MAS Sats</button>
                  <button className="sell-button">Sell MAS Sats</button>
                </div>
              </div>
            </div>
          )}

        {/* Coming Soon Modal */}
        {showComingSoon && (
          <div className="modal-overlay" onClick={() => setShowComingSoon(false)}>
            <div className="modal coming-soon-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🚧 Coming Soon</h2>
            <button 
                  className="close-button"
                  onClick={() => setShowComingSoon(false)}
                >
                  ×
            </button>
      </div>

            <div className="modal-body">
                <div className="coming-soon-icon">🚀</div>
                <h3>Token Creation Feature</h3>
                <p>
                  We're working hard to bring you the ability to create your own tokens 
                  with our easy-to-use interface. This feature will include:
                </p>
                
                <ul className="feature-list">
                  <li>✨ Custom token creation</li>
                  <li>🔧 Automated deployment</li>
                  <li>📊 Built-in DEX integration</li>
                  <li>🎯 User-friendly interface</li>
                </ul>
                
                <p className="stay-tuned">
                  Stay tuned for updates! In the meantime, you can explore our existing 
                  tokens and trading features.
                </p>
              </div>
              
                              <div className="modal-footer">
                  <button 
                    className="primary-button"
                    onClick={handleGetButtonClick}
                  >
                    Get <img src="/mas-sats-icon.png" alt="MAS Sats" className="mas-icon" />
                  </button>
                  <Link href="/" className="secondary-button">
                    Back to Home
                  </Link>
                </div>
          </div>
        </div>
      )}

      {/* Wallet Connection Popup */}
      {showWalletPopup && (
        <div className="modal-overlay" onClick={() => setShowWalletPopup(false)}>
          <div className="modal wallet-popup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔗 Connect Your Wallet</h2>
              <button 
                className="close-button"
                onClick={() => setShowWalletPopup(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="wallet-popup-icon">💼</div>
              <h3>Bitcoin Stacks Wallet Required</h3>
              <p>
                To access MAS Sats trading, you need to connect your Bitcoin Stacks wallet 
                on <strong>mainnet</strong> at the top right of your screen.
              </p>
              
              <div className="wallet-instructions">
                <div className="instruction-step">
                  <span className="step-number">1</span>
                  <span>Look for the "Connect Wallet" button in the top right corner</span>
                </div>
                <div className="instruction-step">
                  <span className="step-number">2</span>
                  <span>Make sure your wallet is set to <strong>mainnet</strong> (address starts with "SP")</span>
                </div>
                <div className="instruction-step">
                  <span className="step-number">3</span>
                  <span>Connect your wallet and try again</span>
                </div>
              </div>
              
              <div className="wallet-warning">
                <p>
                  <strong>Note:</strong> Testnet wallets (addresses starting with "ST") are not supported 
                  for mainnet trading.
                </p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="primary-button"
                onClick={() => setShowWalletPopup(false)}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
      </main>

             <style jsx>{`
         .create-project-page {
           min-height: 100vh;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
           color: white;
          padding: 2rem 0;
         }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .coming-soon-content {
           text-align: center;
          padding: 4rem 2rem;
        }

        .coming-soon-content h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .coming-soon-content p {
          font-size: 1.2rem;
          color: #a0aec0;
          margin-bottom: 2rem;
        }

        .back-button {
          display: inline-block;
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
               border-radius: 8px;
               font-weight: 600;
               transition: all 0.3s ease;
        }

        .back-button:hover {
              transform: translateY(-2px);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 2px solid #667eea;
          border-radius: 16px;
          padding: 2rem;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
        }

        .wallet-popup-modal {
          max-width: 600px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #374151;
        }

        .modal-header h2 {
          color: #fbbf24;
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          color: #a0aec0;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: #374151;
          color: white;
        }

        .modal-body {
          text-align: center;
        }

        .coming-soon-icon,
        .wallet-popup-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .modal-body h3 {
          color: #fbbf24;
          font-size: 1.3rem;
          margin-bottom: 1rem;
        }

        .modal-body p {
          color: #d1d5db;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .feature-list {
          list-style: none;
          padding: 0;
          margin: 1.5rem 0;
          text-align: left;
        }

        .feature-list li {
          color: #d1d5db;
          padding: 0.5rem 0;
          border-bottom: 1px solid #374151;
        }

        .feature-list li:last-child {
          border-bottom: none;
        }

        .stay-tuned {
          color: #a0aec0;
          font-style: italic;
        }

        .wallet-instructions {
          background: #374151;
          border-radius: 8px;
          padding: 1.5rem;
          margin: 1.5rem 0;
          text-align: left;
        }

        .instruction-step {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
          color: #d1d5db;
        }

        .instruction-step:last-child {
          margin-bottom: 0;
        }

        .step-number {
          background: #fbbf24;
          color: #1a1a2e;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.9rem;
          margin-right: 1rem;
          flex-shrink: 0;
        }

        .wallet-warning {
          background: #dc2626;
          border: 1px solid #ef4444;
          border-radius: 8px;
          padding: 1rem;
          margin: 1.5rem 0;
        }

        .wallet-warning p {
          color: #fecaca;
          margin: 0;
          font-size: 0.9rem;
        }

        .modal-footer {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #374151;
        }

        .primary-button {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: #1a1a2e;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
        }

        .secondary-button {
          background: #374151;
          color: #d1d5db;
          border: 1px solid #4b5563;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .secondary-button:hover {
          background: #4b5563;
          transform: translateY(-2px);
        }

        .mas-icon {
          width: 20px;
          height: 20px;
          vertical-align: middle;
        }

        /* Trade Chart Styles */
        .trade-chart-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .chart-header h1 {
          color: #fbbf24;
          font-size: 2rem;
          margin: 0;
        }

        .back-to-home-button {
          background: #374151;
          color: #d1d5db;
          border: 1px solid #4b5563;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .back-to-home-button:hover {
          background: #4b5563;
        }

        .chart-content {
          background: #1a1a2e;
          border-radius: 12px;
          padding: 2rem;
          border: 1px solid #374151;
        }

        .price-info {
          margin-bottom: 2rem;
        }

        .current-price {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .price-label {
          color: #a0aec0;
        }

        .price-value {
          color: #fbbf24;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .price-change.positive {
          color: #10b981;
        }

        .price-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .stat {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem;
          background: #374151;
          border-radius: 6px;
        }

        .stat-label {
          color: #a0aec0;
        }

        .stat-value {
          color: #d1d5db;
          font-weight: 600;
        }

        .mock-chart {
          background: #374151;
          border-radius: 8px;
          padding: 2rem;
          margin-bottom: 2rem;
          position: relative;
          height: 200px;
        }

        .chart-placeholder {
          display: flex;
          align-items: end;
          justify-content: space-between;
          height: 120px;
          margin-bottom: 1rem;
        }

        .chart-line {
          background: #fbbf24;
          width: 4px;
          border-radius: 2px;
          animation: pulse 2s infinite;
        }

        .chart-line:nth-child(1) { height: 60%; }
        .chart-line:nth-child(2) { height: 80%; }
        .chart-line:nth-child(3) { height: 40%; }
        .chart-line:nth-child(4) { height: 90%; }
        .chart-line:nth-child(5) { height: 70%; }
        .chart-line:nth-child(6) { height: 50%; }
        .chart-line:nth-child(7) { height: 85%; }
        .chart-line:nth-child(8) { height: 65%; }
        .chart-line:nth-child(9) { height: 75%; }
        .chart-line:nth-child(10) { height: 55%; }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .chart-labels {
          display: flex;
          justify-content: space-between;
          color: #a0aec0;
          font-size: 0.9rem;
        }

        .trading-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .buy-button,
        .sell-button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .buy-button {
          background: #10b981;
          color: white;
        }

        .buy-button:hover {
          background: #059669;
          transform: translateY(-2px);
        }

        .sell-button {
          background: #ef4444;
          color: white;
        }

        .sell-button:hover {
          background: #dc2626;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .chart-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .current-price {
            flex-direction: column;
            gap: 0.5rem;
          }

          .price-stats {
            grid-template-columns: 1fr;
          }

          .trading-actions {
            flex-direction: column;
          }

          .modal {
            margin: 1rem;
            padding: 1.5rem;
          }

          .wallet-instructions {
            padding: 1rem;
          }

          .instruction-step {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .step-number {
            margin-right: 0;
            margin-bottom: 0.5rem;
          }
        }
      `}</style>
    </>
  );
}
