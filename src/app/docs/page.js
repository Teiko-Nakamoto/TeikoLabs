'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './docs.css';

export default function DocsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start closed on mobile
  const pathname = usePathname();

  // Close sidebar when clicking on a link (mobile)
  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  // Close sidebar when clicking backdrop
  const handleBackdropClick = () => {
    setIsSidebarOpen(false);
  };

  // Simplified navigation structure
  const navigation = [
    {
      title: 'Documentation',
      items: [
        { 
          title: 'Overview', 
          id: 'overview', 
          href: '/docs',
          isActive: pathname === '/docs',
          subItems: pathname === '/docs' ? [
            { title: 'What Problem Are We Solving', id: 'problem-solving', href: '#problem-solving' },
            { title: 'Immediate Benefits', id: 'immediate-benefits', href: '#immediate-benefits' },
            { title: 'Trading Mechanics', id: 'trading-mechanics', href: '#trading-mechanics' },
            { title: 'Our Approach vs Competitors', id: 'comparison', href: '#comparison' }
          ] : []
        },
        { title: 'The Forever Pump Protocol Roadmap', id: 'roadmap', href: '/docs/roadmap' },
        { title: 'How It Works', id: 'how-it-works', href: '/docs/how-it-works' },
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
          {filteredNavigation.map((section, sectionIndex) => (
            <div key={sectionIndex} className="docs-nav-section">
              <h3 className="docs-nav-section-title">{section.title}</h3>
              <ul className="docs-nav-list">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="docs-nav-item">
                    <Link 
                      href={item.href}
                      className={`docs-nav-link ${pathname === item.href ? 'active' : ''}`}
                      onClick={handleNavClick}
                    >
                      {item.title}
                    </Link>
                    {item.subItems && item.subItems.length > 0 && (
                      <ul className="docs-nav-sublist">
                        {item.subItems.map((subItem, subIndex) => (
                          <li key={subIndex} className="docs-nav-subitem">
                            <a 
                              href={subItem.href}
                              className="docs-nav-sublink"
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(subItem.id).scrollIntoView({ behavior: 'smooth' });
                                handleNavClick(); // Close sidebar on mobile
                              }}
                            >
                              {subItem.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
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
            <h1 className="docs-title">Welcome to Teiko Labs</h1>
            <p className="docs-description">
              The Forever Pump Protocol - revolutionizing how crypto projects generate sustainable profit through blockchain technology.
            </p>
          </div>

          <div className="docs-body">
            <section className="docs-section">
              <div className="platform-intro">
                <h2>Overview</h2>
                <p>
                  Teiko Labs has created The Forever Pump Protocol - a revolutionary system that enables crypto projects to generate continuous profit through trading fees. While we offer crowdfunding functionality, our core innovation is the protocol that makes projects sustainably profitable forever through smart contract mechanics.
                </p>
              </div>
            </section>

            <section id="problem-solving" className="docs-section">
              <h2>What Problem Are We Solving?</h2>
              
              <div className="problem-section">
                <h3>The Forever Pump Protocol Problem</h3>
                <p>
                  Traditional crypto projects face critical sustainability issues. Most projects fail because they lack ongoing revenue streams 
                  and rely solely on initial hype rather than real economic value. The Forever Pump Protocol solves this by creating perpetual profit generation.
                </p>

                <div className="problem-stats">
                  <div className="stat-item">
                    <div className="stat-icon">😔</div>
                    <div>Most crypto projects fail within the first year</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">💸</div>
                    <div>Investors lose money on unsustainable tokenomics</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">🎯</div>
                    <div>No real incentive for long-term project success</div>
                  </div>
                </div>

                <h3>Our Solution: The Forever Pump Protocol</h3>
                <p>
                  The Forever Pump Protocol creates perpetual profit generation through trading fees. Every trade generates revenue that flows back to majority holders, 
                  creating a self-sustaining economic model that never stops pumping. While we offer crowdfunding functionality, the core innovation is the protocol 
                  that makes projects sustainably profitable forever.
                </p>
              </div>
            </section>

            <section id="immediate-benefits" className="docs-section">
              <h2>Immediate Benefits</h2>
              
              <div className="benefits-grid">
                <div className="benefit-card">
                  <div className="benefit-icon">🚀</div>
                  <h3>No Coding Required</h3>
                  <p>Launch your project without learning complex programming languages or smart contract development.</p>
                </div>

                <div className="benefit-card">
                  <div className="benefit-icon">💰</div>
                  <h3>Trading Fee Profits</h3>
                  <p>All projects are backed by trading fee profits saved on smart contracts, regardless of how well the actual project is doing.</p>
                </div>

                <div className="benefit-card">
                  <div className="benefit-icon">🔍</div>
                  <h3>No Research Needed</h3>
                  <p>Project profit is the only real source of truth - removing any need for research about the project's fundamentals.</p>
                </div>

                <div className="benefit-card">
                  <div className="benefit-icon">📈</div>
                  <h3>Growth Incentives</h3>
                  <p>Majority holders are incentivized to grow the project's total value locked to gain more trading profit, which disincentivizes dumping.</p>
                </div>

                <div className="benefit-card">
                  <div className="benefit-icon">🛡️</div>
                  <h3>Built-in Risk Management</h3>
                  <p>Smart contract mechanics help spot risk in projects through transparent profit metrics and locked token requirements.</p>
                </div>

                <div className="benefit-card">
                  <div className="benefit-icon">🎯</div>
                  <h3>Sustainable Economics</h3>
                  <p>Every trade generates revenue that flows back to majority holders, creating a self-sustaining economic model.</p>
                </div>
              </div>
            </section>

            <section id="trading-mechanics" className="docs-section">
              <h2>The Forever Pump Protocol Mechanics</h2>
              
              <div className="trading-explanation">
                <h3>How The Forever Pump Protocol Works</h3>
                <p>
                  The Forever Pump Protocol ensures perpetual profit generation through trading fees. Every trade generates revenue that flows back to majority holders, 
                  creating a self-sustaining economic model. Here's how the locking mechanism ensures the pump never stops:
                </p>

                <div className="mechanism-steps">
                  <div className="mechanism-step">
                    <div className="step-number">1</div>
                    <div className="step-details">
                      <h4>Lock Tokens to Claim</h4>
                      <p>Users must lock their tokens away in order to gain access to trading fee profits.</p>
                    </div>
                  </div>

                  <div className="mechanism-step">
                    <div className="step-number">2</div>
                    <div className="step-details">
                      <h4>Withdrawal Restrictions</h4>
                      <p>Once locked, users cannot unlock tokens until the last greatest trading fee withdrawal amount is paid back.</p>
                    </div>
                  </div>

                  <div className="mechanism-step">
                    <div className="step-number">3</div>
                    <div className="step-details">
                      <h4>Recovery Threshold</h4>
                      <p>The maximum recovery requirement is capped at 1 million sats, ensuring fair and predictable unlock conditions.</p>
                </div>
                </div>
                </div>

                <div className="info-box">
                  <strong>Key Point:</strong> The Forever Pump Protocol creates powerful incentives for long-term project growth and ensures 
                  the pump never stops by preventing majority holders from extracting value without maintaining project sustainability.
                </div>
              </div>
            </section>



            <section id="comparison" className="docs-section">
              <h2>Our Approach vs Competitors</h2>
              
              <div className="comparison-table">
                <div className="comparison-header">
                  <h3>Why Choose Teiko Labs?</h3>
                  <p>See how we stack up against other platforms in the crypto funding space:</p>
                </div>

                <div className="table-container">
                  <table className="feature-comparison-table">
                    <thead>
                      <tr>
                        <th className="feature-header">Feature</th>
                        <th className="platform-header teiko-header">🏆 Teiko Labs</th>
                        <th className="platform-header">Geyser</th>
                        <th className="platform-header">STX.CITY</th>
                        <th className="platform-header">Pump.fun</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="feature-name">Blockchain Foundation</td>
                        <td className="teiko-cell">✅ Stacks anchored to Bitcoin</td>
                        <td className="competitor-cell">❌ Bitcoin Lightning (off-chain)</td>
                        <td className="competitor-cell">✅ Stacks anchored to Bitcoin</td>
                        <td className="competitor-cell">❌ Solana only</td>
                      </tr>
                      <tr>
                        <td className="feature-name">1 to 1 Bitcoin Trading Pair</td>
                        <td className="teiko-cell">✅ sBTC (Bitcoin Layer 2)</td>
                        <td className="competitor-cell">❌ No trading pairs</td>
                        <td className="competitor-cell">❌ STX token</td>
                        <td className="competitor-cell">❌ SOL token</td>
                      </tr>
                      <tr>
                        <td className="feature-name">Profit Sharing Model</td>
                        <td className="teiko-cell">✅ Sustainable trading fees</td>
                        <td className="competitor-cell">❌ No Profit Share</td>
                        <td className="competitor-cell">❌ 50% of trading fees to DEV</td>
                        <td className="competitor-cell">❌ 0% of trading fees to DEV</td>
                      </tr>
                      <tr>
                        <td className="feature-name">Growth Incentives</td>
                        <td className="teiko-cell">✅ Trading Fee claims</td>
                        <td className="competitor-cell">❌ Project dependent</td>
                        <td className="competitor-cell">❌ Pump & dump risk</td>
                        <td className="competitor-cell">❌ Pump & dump risk</td>
                      </tr>
                      <tr>
                        <td className="feature-name">Project Risk Assessment</td>
                        <td className="teiko-cell">✅ Claimable onchain trading fee profit is the single source of truth</td>
                        <td className="competitor-cell">❌ Manual research required</td>
                        <td className="competitor-cell">❌ Manual research required</td>
                        <td className="competitor-cell">❌ Manual research required</td>
                      </tr>


                    </tbody>
                  </table>
                </div>
              </div>

              <div className="blockchain-advantage">
                <h3>🔗 Built on Bitcoin's Security</h3>
                <p>
                  We leverage the Stacks blockchain, which is anchored to Bitcoin, providing unparalleled security and trust. 
                  By using sBTC as our trading pair, we ensure that all value is ultimately backed by the world's most secure cryptocurrency.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}