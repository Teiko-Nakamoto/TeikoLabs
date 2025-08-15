'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '../docs.css';

export default function HowItWorksPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  // Simplified navigation structure
  const navigation = [
    {
      title: 'Documentation',
      items: [
        { title: 'Overview', id: 'overview', href: '/docs' },
        { title: 'Roadmap', id: 'roadmap', href: '/docs#roadmap' },
        { 
          title: 'How It Works', 
          id: 'how-it-works', 
          href: '/docs/how-it-works',
          isActive: pathname === '/docs/how-it-works'
        },

        { title: 'Trading', id: 'trading', href: '/docs/trading' },
        { title: 'Claim Profit', id: 'claim-profit', href: '/docs/claim-profit' },
        { title: 'Fees', id: 'fees', href: '/docs/fees' },
      ]
    }
  ];

  // Use navigation as-is without filtering
  const filteredNavigation = navigation;

  return (
    <div className="docs-layout">
      {/* Mobile sidebar toggle */}
      <button 
        className="docs-sidebar-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
          {filteredNavigation.map((section, sectionIndex) => (
            <div key={sectionIndex} className="docs-nav-section">
              <h3 className="docs-nav-section-title">{section.title}</h3>
              <ul className="docs-nav-list">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="docs-nav-item">
                    <Link 
                      href={item.href}
                      className={`docs-nav-link ${pathname === item.href ? 'active' : ''}`}
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
            <h1 className="docs-title">How It Works</h1>
            <p className="docs-description">
              Learn how MAS Sats (Market Activated Satoshis) work and how you can profit from the innovative token mechanics.
            </p>
          </div>

          <div className="docs-body">
            {/* MAS Sats Introduction */}
            <section className="docs-section">
              <div className="intro-section-docs">
                <div className="intro-header-docs">
                  <img 
                    src="/icons/The Mas Network.svg" 
                    alt="MAS Sats" 
                    className="intro-image-docs"
                  />
                  <h2>🚀 Introducing MAS Sats</h2>
                </div>
                <p className="intro-subtitle-docs">Market Activated Satoshis</p>
                <p className="intro-description-docs">
                  The revolutionary system that turns <span style={{ color: '#EF4444' }}>dumps</span> into <span style={{ color: '#60A5FA' }}>opportunities</span> - every trade generates fees for holders. Buy the dip with <span style={{ color: '#60A5FA' }}>zero fear</span> and grow your revenue streams as the largest holder.
                </p>
              </div>
            </section>

            {/* Trading Section */}
            <section className="docs-section">
              <div className="step-container-docs">
                
                {/* Choice Split */}
                <div className="choice-section-docs">
                  <div className="step-docs">
                    <div className="step-content-docs">
                      <h3>Choose Your Strategy</h3>
                    </div>
                  </div>
                  
                  <h4 className="choice-title-docs">Two Paths to Profit:</h4>
                  
                  <div className="choice-container-docs">
                    <div className="choice-option-docs choice-a">
                      <div className="choice-number-docs">A</div>
                      <div className="choice-content-docs">
                        <h5>Accumulate & Lock Ownership</h5>
                        <p>Accumulate MAS Sats and lock away ownership of your holdings in order to withdraw trading profit from every transaction.</p>
                      </div>
                    </div>
                    
                    <div className="choice-divider-docs">OR</div>
                    
                    <div className="choice-option-docs choice-b">
                      <div className="choice-number-docs">B</div>
                      <div className="choice-content-docs">
                        <h5>Trade for Profit/Loss</h5>
                        <p>Trade MAS Sats on the infinite bonding curve for a profit or loss based on market movements.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* MAS Sats Deep Dive Section */}
            <section className="docs-section">
              <div className="intro-section-docs">
                <h2>🎯 MAS Sats: The First Mainnet Implementation</h2>
                <p className="intro-description-docs">
                  MAS Sats represents the first mainnet implementation of the Teiko token standard, demonstrating how sustainable tokenomics work in practice.
                </p>
              </div>
            </section>

            <section className="docs-section">
              <div className="step-container-docs">
                <div className="step-docs">
                  <div className="step-content-docs">
                    <h3>Why MAS Sats is Different</h3>
                    <p>
                      Unlike traditional cryptocurrencies where "buying the dip" offers no guarantees, MAS Sats creates a unique incentive structure. 
                      When everyone dumps, you actually get closer to claiming their trading fees, creating a system with constant growth incentives.
                    </p>
                  </div>
                </div>

                <div className="step-docs">
                  <div className="step-content-docs">
                    <h3>The Dump Paradox</h3>
                    <p>
                      In most crypto projects, when holders sell en masse, it creates a death spiral. With MAS Sats, the opposite happens. 
                      Each sale generates trading fees that accumulate for the remaining holders, making the token more valuable to those who stay.
                    </p>
                  </div>
                </div>

                <div className="step-docs">
                  <div className="step-content-docs">
                    <h3>Constant Growth Incentives</h3>
                    <p>
                      The system is designed so that every transaction, whether buying or selling, contributes to the growth of the trading fee pool. 
                      This creates a self-reinforcing cycle where increased activity benefits long-term holders.
                    </p>
                  </div>
                </div>

                <div className="step-docs">
                  <div className="step-content-docs">
                    <h3>Real Economic Value</h3>
                    <p>
                      MAS Sats doesn't rely on hype or promises. The value is backed by actual trading fee revenue locked in smart contracts. 
                      This creates a transparent and verifiable source of value that grows with every transaction.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
