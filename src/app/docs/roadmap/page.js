'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '../docs.css';

export default function RoadmapPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleBackdropClick = () => {
    setIsSidebarOpen(false);
  };

  const navigation = [
    {
      title: 'Documentation',
      items: [
        { title: 'Overview', id: 'overview', href: '/docs' },
        { title: 'The Forever Pump Protocol Roadmap', id: 'roadmap', href: '/docs/roadmap', isActive: pathname === '/docs/roadmap' },
        { title: 'How It Works', id: 'how-it-works', href: '/docs/how-it-works' },
        { title: 'Trading', id: 'trading', href: '/docs/trading' },
        { title: 'Claim Profit', id: 'claim-profit', href: '/docs/claim-profit' },
        { title: 'Fees', id: 'fees', href: '/docs/fees' },
      ]
    }
  ];

  return (
    <div className="docs-layout">
      {/* Mobile backdrop */}
      <div 
        className={`docs-sidebar-backdrop ${isSidebarOpen ? 'open' : ''}`}
        onClick={handleBackdropClick}
      />

      {/* Mobile sidebar toggle */}
      <button 
        className="docs-sidebar-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle navigation menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Sidebar */}
      <aside className={`docs-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="docs-sidebar-header">
          <div className="docs-logo-section">
            <Link href="/" className="docs-logo-link">
              <img src="/logo.png" alt="Teiko Labs Logo" className="docs-logo" />
            </Link>
            <div className="docs-title-section">
              <Link href="/" className="docs-site-name-link">
                <div className="docs-site-name">Teikolabs.com</div>
              </Link>
              <h2 className="docs-sidebar-title">Documentation</h2>
            </div>
          </div>
        </div>

        <nav className="docs-nav">
          {navigation.map((section, sectionIndex) => (
            <div key={sectionIndex} className="docs-nav-section">
              <h3 className="docs-nav-section-title">{section.title}</h3>
              <ul className="docs-nav-list">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="docs-nav-item">
                    <Link 
                      href={item.href}
                      className={`docs-nav-link ${item.isActive ? 'active' : ''}`}
                      onClick={handleNavClick}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="docs-main">
        <div className="docs-content">
          <div className="docs-header">
            <h1 className="docs-title">The Forever Pump Protocol Roadmap</h1>
            <p className="docs-description">
              Strategic roadmap for building sustainable value through perpetual trading fee generation.
            </p>
          </div>

          <div className="docs-body">
            <section className="docs-section">
              <div className="roadmap-intro">
                <p>
                  The Forever Pump Protocol follows a strategic roadmap designed to build sustainable value through perpetual trading fee generation 
                  and expand liquidity across multiple exchanges for maximum exposure and accessibility.
                </p>
              </div>

              <div className="roadmap-phases">
                <div className="roadmap-phase">
                  <div className="phase-header">
                    <div className="phase-number">1</div>
                    <h3>First Milestone: 1,500 Sats Threshold</h3>
                  </div>
                  <div className="phase-content">
                    <p>
                      <strong>Goal:</strong> Generate 1,500 sats in trading fees to unlock the first threshold.
                    </p>
                    <div className="phase-details">
                      <div className="detail-item">
                        <span className="detail-icon">🎯</span>
                        <span>Initial trading activity builds the foundation</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">🔓</span>
                        <span>Unlocks first token withdrawal threshold</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">📈</span>
                        <span>Proves sustainable trading fee model</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="roadmap-phase">
                  <div className="phase-header">
                    <div className="phase-number">2</div>
                    <h3>Major Milestone: 1 Million Sats</h3>
                  </div>
                  <div className="phase-content">
                    <p>
                      <strong>Goal:</strong> Generate 1 million sats in trading fees and use profits to open the first liquidity pool on Vellar.
                    </p>
                    <div className="phase-details">
                      <div className="detail-item">
                        <span className="detail-icon">💰</span>
                        <span>Accumulate significant trading fee profits</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">🏊</span>
                        <span>Deploy first liquidity pool on Vellar exchange</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">🌊</span>
                        <span>Increase token liquidity and trading volume</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="roadmap-phase">
                  <div className="phase-header">
                    <div className="phase-number">3</div>
                    <h3>Expansion Strategy: Every 1M Sats</h3>
                  </div>
                  <div className="phase-content">
                    <p>
                      <strong>Goal:</strong> For every additional 1 million sats in trading fees generated, open another liquidity pool for increased exposure.
                    </p>
                    <div className="phase-details">
                      <div className="detail-item">
                        <span className="detail-icon">🔄</span>
                        <span>Continuous expansion of liquidity pools</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">📊</span>
                        <span>Multiple exchange listings for maximum exposure</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">🚀</span>
                        <span>Sustainable growth through trading fee reinvestment</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="roadmap-benefits">
                <h3>🎯 Strategic Benefits</h3>
                <div className="benefits-grid">
                  <div className="benefit-card">
                    <div className="benefit-icon">💎</div>
                    <h4>Sustainable Growth</h4>
                    <p>Profits from trading fees fund expansion, creating a self-sustaining growth cycle</p>
                  </div>
                  <div className="benefit-card">
                    <div className="benefit-icon">🌐</div>
                    <h4>Maximum Exposure</h4>
                    <p>Multiple liquidity pools across exchanges increase token accessibility and trading volume</p>
                  </div>
                  <div className="benefit-card">
                    <div className="benefit-icon">🛡️</div>
                    <h4>Risk Management</h4>
                    <p>Diversified liquidity reduces dependency on single exchange and improves price stability</p>
                  </div>
                  <div className="benefit-card">
                    <div className="benefit-icon">📈</div>
                    <h4>Value Appreciation</h4>
                    <p>Increased liquidity and exposure drive token value appreciation for all holders</p>
                  </div>
                </div>
              </div>

              <div className="info-box">
                <strong>Key Insight:</strong> The Forever Pump Protocol ensures that every trading fee generated contributes to perpetual growth, 
                creating a virtuous cycle where increased trading activity leads to more liquidity pools, which in turn drives more trading activity - 
                ensuring the pump never stops.
              </div>

              <div className="upcoming-features">
                <h3>🚀 Upcoming Platform Features</h3>
                <p>
                  We're working hard to bring advanced trading and management features directly to the platform interface. 
                  While these features are already available via smart contract on Stacks Explorer, we're building user-friendly 
                  interfaces to make them accessible to everyone.
                </p>

                <div className="features-grid">
                  <div className="feature-card">
                    <div className="feature-icon">🔒</div>
                    <h4>Lock & Unlock Features</h4>
                    <p>Direct token locking and unlocking functionality through the whale access interface. Manage your locked tokens with ease.</p>
                    <div className="feature-status">Coming Soon</div>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">📊</div>
                    <h4>Profit/Loss Tracking</h4>
                    <p>Real-time profit and loss tracking via the whale access panel. Monitor your trading performance and revenue generation.</p>
                    <div className="feature-status">Coming Soon</div>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">⚙️</div>
                    <h4>Slippage Protection</h4>
                    <p>Advanced slippage controls and protection mechanisms to ensure optimal trade execution and minimize price impact.</p>
                    <div className="feature-status">Coming Soon</div>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">👑</div>
                    <h4>Claim Majority Status</h4>
                    <p>One-click majority holder status claiming. Become the majority holder and start earning trading fee profits immediately.</p>
                    <div className="feature-status">Coming Soon</div>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">💰</div>
                    <h4>Withdraw Trading Profits</h4>
                    <p>Direct withdrawal of accumulated trading profits. Access your earnings through the platform interface.</p>
                    <div className="feature-status">Coming Soon</div>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">🔗</div>
                    <h4>Smart Contract Access</h4>
                    <p>All features are already available via smart contract on Stacks Explorer. Advanced users can interact directly with contracts.</p>
                    <div className="feature-status">Available Now</div>
                  </div>
                </div>

                <div className="info-box">
                  <strong>Note:</strong> While we build these user-friendly interfaces, all functionality is already available through direct 
                  smart contract interaction on Stacks Explorer. Advanced users can access lock/unlock, claim majority status, and withdraw 
                  trading profits directly through the blockchain.
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
