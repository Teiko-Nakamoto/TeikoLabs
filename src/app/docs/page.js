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
            { title: 'Platform Roadmap & Growth Strategy', id: 'roadmap', href: '#roadmap' },
            { title: 'Our Approach vs Competitors', id: 'comparison', href: '#comparison' }
          ] : []
        },
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
              The sustainable crypto project crowdfunding platform that revolutionizes how projects get funded and generate profit through blockchain technology.
            </p>
          </div>

          <div className="docs-body">
            <section className="docs-section">
              <div className="platform-intro">
                <h2>Overview</h2>
                <p>
                  Teiko Labs is a platform that allows you to create and trade sustainable crypto projects on the Stacks blockchain without any coding experience. 
                  We provide a user-friendly interface and streamlined processes to make project funding profitable and sustainable for everyone involved.
                </p>
              </div>
            </section>

            <section id="problem-solving" className="docs-section">
              <h2>What Problem Are We Solving?</h2>
              
              <div className="problem-section">
                <h3>Sustainable Crypto Project Crowdfunding</h3>
                <p>
                  Traditional crypto project funding faces critical sustainability issues. Most projects fail because they lack ongoing revenue streams 
                  and rely solely on initial hype rather than real economic value.
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

                <h3>Our Solution: Profit-Driven Sustainability</h3>
                <p>
                  We make crowdfunding sustainable by allowing users to create and trade projects on the blockchain that generate real profit 
                  for the majority project owner through trading fees. Everyone benefits from the price increase of project ownership 
                  as people compete for the trading fees.
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
              <h2>Trading Mechanics</h2>
              
              <div className="trading-explanation">
                <h3>How Trading Fees Work</h3>
                <p>
                  A trading fee is taken from each trade and saved for future claims by majority holders. 
                  Here's how the locking mechanism ensures sustainability:
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
                  <strong>Key Point:</strong> This mechanism creates powerful incentives for long-term project growth and prevents 
                  majority holders from extracting value without ensuring project sustainability.
                </div>
              </div>
            </section>

            <section id="roadmap" className="docs-section">
              <h2>Platform Roadmap & Growth Strategy</h2>
              
              <div className="roadmap-intro">
                <p>
                  Our platform follows a strategic roadmap designed to build sustainable value through trading fee generation 
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
                <strong>Key Insight:</strong> This roadmap ensures that every trading fee generated contributes to the platform's growth, 
                creating a virtuous cycle where increased trading activity leads to more liquidity pools, which in turn drives more trading activity.
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