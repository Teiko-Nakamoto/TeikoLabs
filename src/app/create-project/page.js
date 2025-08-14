'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../components/header';

export default function CreateTokenPage() {
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showTradeChart, setShowTradeChart] = useState(false);

  // Show coming soon popup when page loads
  useEffect(() => {
    setShowComingSoon(true);
  }, []);

  const handleGetButtonClick = () => {
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
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
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
          backdrop-filter: blur(5px);
          }

        .modal {
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
            border-radius: 16px;
          max-width: 500px;
          width: 90%;
            max-height: 90vh;
            overflow-y: auto;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

        .modal-header h2 {
            margin: 0;
            font-size: 1.5rem;
          color: #fbbf24;
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
          transition: all 0.3s ease;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.1);
            color: white;
        }

        .modal-body {
          padding: 2rem;
            text-align: center;
          }

        .coming-soon-icon {
            font-size: 4rem;
          margin-bottom: 1rem;
          }

        .modal-body h3 {
            font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #fbbf24;
          }

        .modal-body p {
          color: #a0aec0;
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
          padding: 0.5rem 0;
          color: #e2e8f0;
            font-size: 1rem;
          }

        .stay-tuned {
          font-style: italic;
          color: #718096 !important;
        }

        .modal-footer {
          padding: 1.5rem 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
          gap: 1rem;
            justify-content: center;
        }

        .primary-button, .secondary-button {
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
          text-decoration: none;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1rem;
          }

        .primary-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .primary-button:hover {
            transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .secondary-button {
          background: rgba(255, 255, 255, 0.1);
          color: #a0aec0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .secondary-button:hover {
          background: rgba(255, 255, 255, 0.2);
            color: white;
        }

                .mas-icon {
          width: 20px;
          height: 20px;
          margin-left: 8px;
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
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .chart-header h1 {
          margin: 0;
          font-size: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .back-to-home-button {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.1);
          color: #a0aec0;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .back-to-home-button:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .chart-content {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
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
          font-size: 1.1rem;
        }

        .price-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #fbbf24;
        }

        .price-change {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .price-change.positive {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .price-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .stat {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
        }

        .stat-label {
          color: #a0aec0;
        }

        .stat-value {
          color: #e2e8f0;
          font-weight: 600;
        }

        .mock-chart {
          margin: 2rem 0;
          padding: 2rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          position: relative;
          height: 300px;
        }

        .chart-placeholder {
          display: flex;
          align-items: end;
          justify-content: space-between;
          height: 200px;
          margin-bottom: 1rem;
        }

        .chart-line {
          width: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 2px;
          animation: chartPulse 2s ease-in-out infinite;
        }

        .chart-line:nth-child(1) { height: 60%; animation-delay: 0s; }
        .chart-line:nth-child(2) { height: 80%; animation-delay: 0.2s; }
        .chart-line:nth-child(3) { height: 40%; animation-delay: 0.4s; }
        .chart-line:nth-child(4) { height: 90%; animation-delay: 0.6s; }
        .chart-line:nth-child(5) { height: 70%; animation-delay: 0.8s; }
        .chart-line:nth-child(6) { height: 85%; animation-delay: 1s; }
        .chart-line:nth-child(7) { height: 55%; animation-delay: 1.2s; }
        .chart-line:nth-child(8) { height: 75%; animation-delay: 1.4s; }
        .chart-line:nth-child(9) { height: 65%; animation-delay: 1.6s; }
        .chart-line:nth-child(10) { height: 95%; animation-delay: 1.8s; }

        @keyframes chartPulse {
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
          margin-top: 2rem;
        }

        .buy-button, .sell-button {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
        }

        .buy-button {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
        }

        .buy-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
        }

        .sell-button {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .sell-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
        }

        @media (max-width: 768px) {
          .modal {
              width: 95%;
            margin: 1rem;
          }
          
          .modal-header, .modal-body, .modal-footer {
                  padding: 1rem;
                }

          .coming-soon-content h1 {
            font-size: 2rem;
           }
         }
      `}</style>
    </>
  );
}
