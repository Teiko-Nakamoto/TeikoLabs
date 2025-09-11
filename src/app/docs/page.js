'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './docs.css';

export default function DocsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start closed on mobile
  const [activeSection, setActiveSection] = useState('welcome'); // Start with welcome section
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

  // Navigation functions
  const navigateToSection = (sectionId) => {
    setActiveSection(sectionId);
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const navigateToNext = () => {
    const sections = ['welcome', 'the-problem', 'our-solution', 'who-we-are', 'tokenomics', 'protocol-revenue', 'roadmap'];
    const currentIndex = sections.indexOf(activeSection);
    const nextIndex = (currentIndex + 1) % sections.length;
    setActiveSection(sections[nextIndex]);
  };

  const navigateToPrevious = () => {
    const sections = ['welcome', 'the-problem', 'our-solution', 'who-we-are', 'tokenomics', 'protocol-revenue', 'roadmap'];
    const currentIndex = sections.indexOf(activeSection);
    const prevIndex = currentIndex === 0 ? sections.length - 1 : currentIndex - 1;
    setActiveSection(sections[prevIndex]);
  };

  // Navigation component
  const NavigationButtons = () => {
    const sections = ['welcome', 'the-problem', 'our-solution', 'who-we-are', 'tokenomics', 'protocol-revenue', 'roadmap'];
    const sectionNames = ['Welcome', 'The Problem', 'Our Solution', 'Who We Are', 'Tokenomics', 'Protocol Revenue', 'Roadmap'];
    const currentIndex = sections.indexOf(activeSection);
    const prevIndex = currentIndex === 0 ? sections.length - 1 : currentIndex - 1;
    const nextIndex = (currentIndex + 1) % sections.length;
    const isFirstSection = activeSection === 'welcome';

    return (
      <div className="docs-navigation">
        <div className="nav-left">
          {!isFirstSection && (
            <button 
              className="nav-button"
              onClick={navigateToPrevious}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"></polyline>
              </svg>
              <span>Previous</span>
            </button>
          )}
        </div>
        <div className="nav-center">
          <div className="nav-links">
            {!isFirstSection && (
              <div className="nav-link">
                <span className="nav-label">Previous</span>
                <span className="nav-title">{sectionNames[prevIndex]}</span>
              </div>
            )}
            <div className="nav-link">
              <span className="nav-label">Next</span>
              <span className="nav-title">{sectionNames[nextIndex]}</span>
            </div>
          </div>
        </div>
        <div className="nav-right">
          <button 
            className="nav-button"
            onClick={navigateToNext}
          >
            <span>Next</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  // Simplified navigation structure
  const navigation = [
    {
      title: 'Documentation',
      items: [
        { 
          title: 'Welcome', 
          id: 'welcome', 
          href: '/docs',
          isActive: pathname === '/docs',
          subItems: []
        },
        { 
          title: 'The Problem', 
          id: 'the-problem', 
          href: '/docs',
          isActive: pathname === '/docs',
          subItems: []
        },
        { 
          title: 'Our Solution', 
          id: 'our-solution', 
          href: '/docs',
          isActive: pathname === '/docs',
          subItems: []
        },
        { 
          title: 'Who We Are', 
          id: 'who-we-are', 
          href: '/docs',
          isActive: pathname === '/docs',
          subItems: []
        },
        { 
          title: 'Tokenomics', 
          id: 'tokenomics', 
          href: '/docs',
          isActive: pathname === '/docs',
          subItems: []
        },
        { 
          title: 'Protocol Revenue', 
          id: 'protocol-revenue', 
          href: '/docs',
          isActive: pathname === '/docs',
          subItems: []
        },
        { 
          title: 'Roadmap', 
          id: 'roadmap', 
          href: '/docs',
          isActive: pathname === '/docs',
          subItems: []
        },


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
                    <button 
                      className={`docs-nav-link ${activeSection === item.id ? 'active' : ''}`}
                      onClick={() => navigateToSection(item.id)}
                    >
                      {item.title}
                    </button>
                    {item.subItems && item.subItems.length > 0 && (
                      <ul className="docs-nav-sublist">
                        {item.subItems.map((subItem, subIndex) => (
                          <li key={subIndex} className="docs-nav-subitem">
                            <button 
                              className="docs-nav-sublink"
                              onClick={() => {
                                navigateToSection(activeSection);
                                // Scroll to specific subsection
                                setTimeout(() => {
                                  const element = document.getElementById(subItem.id);
                                  if (element) {
                                    element.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }, 100);
                              }}
                            >
                              {subItem.title}
                            </button>
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
              The Forever Pump Protocol - revolutionizing play-to-earn games with sustainable Bitcoin rewards and verifiable revenue streams.
            </p>
          </div>

          <div className="docs-body">
            {/* Welcome Section */}
            <section id="welcome" className={`docs-section ${activeSection === 'welcome' ? 'active' : ''}`}>
              <div className="welcome-subsection">
                <h2>Welcome to Teiko Labs</h2>
                <p>
                  The Forever Pump Protocol - revolutionizing play-to-earn games with sustainable Bitcoin rewards and verifiable revenue streams.
                </p>
                <p>
                  We've created a sustainable play-to-earn platform that rewards players with Bitcoin instead of inflating tokens, 
                  solving the fundamental problems that plague traditional P2E games.
                </p>
              </div>

              <div className="welcome-subsection">
                <div className="social-links">
                  <a href="https://twitter.com/teikolabs" target="_blank" rel="noopener noreferrer" className="social-link">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    Twitter
                  </a>
                  <a href="https://discord.gg/teikolabs" target="_blank" rel="noopener noreferrer" className="social-link">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                    </svg>
                    Discord
                  </a>
                  <a href="https://github.com/teikolabs" target="_blank" rel="noopener noreferrer" className="social-link">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                  <a href="https://t.me/teikolabs" target="_blank" rel="noopener noreferrer" className="social-link">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Telegram
                  </a>
                </div>
              </div>
              
              <NavigationButtons />
            </section>

            {/* Protocol Revenue Section */}
            <section id="protocol-revenue" className={`docs-section ${activeSection === 'protocol-revenue' ? 'active' : ''}`}>
              <h2>Protocol Revenue</h2>
              <div className="tokenomics-intro">
                <h3>How the MAS Sats DEX Generates and Distributes Fees</h3>
                <p>
                  MAS Sats trades on a bonding curve AMM. Each buy/sell auto-adjusts price along the curve and continues until the
                  entire supply is sold. Every trade contributes protocol revenue that can be claimed by the Majority‑Locked Holder
                  and optionally redirected to stimulate growth when challenges occur.
                </p>
              </div>

              {/* At a Glance */}
              <div className="docs-feature-list">
                <div className="docs-feature-item">
                  <h4>At a Glance</h4>
                  <ul>
                    <li><strong>1.5% Trading Fee</strong> → saved on‑chain in the Trading Fee Pool</li>
                    <li><strong>0.6% Treasury Fee</strong> → available for jackpots and growth</li>
                    <li><strong>Majority‑Locked Holder</strong> → can claim the Trading Fee Pool</li>
                    <li><strong>Challenge</strong> → new locker must wait until ≤ 1,000,000 sats are repaid by natural volume</li>
                    <li><strong>Price Floor Effect</strong> → predictable region while a challenger is locked</li>
                  </ul>
                </div>
              </div>

              <div className="docs-feature-list">
                <div className="docs-feature-item">
                  <h4>DEX Utility: Bonding Curve AMM</h4>
                  <p>
                    Price moves programmatically along a curve as traders buy and sell. There is no terminal state until supply is exhausted,
                    creating continuous market making and transparent pricing.
                  </p>
                </div>

                <div className="docs-feature-item">
                  <h4>Revenue Tap (1.5%)</h4>
                  <p>
                    On every buy and sell, <strong>1.5%</strong> of trade value is routed to the Trading Fee Pool. The current Majority‑Locked Holder can
                    claim these accumulated fees on‑chain at any time.
                  </p>
                </div>

                <div className="docs-feature-item">
                  <h4>Challenge & Lock</h4>
                  <p>
                    If a new participant locks more tokens to claim Majority status, those tokens remain <strong>locked</strong> until the last highest claimed
                    fee amount is naturally repaid to the DEX via trading volume (cap: <strong>1,000,000 sats</strong> obligation).
                  </p>
                </div>

                <div className="docs-feature-item">
                  <h4>Price Floor from Repayment</h4>
                  <p>
                    The combination of lock + repayment creates a predictable floor region for traders. While the challenger is locked and repayment is
                    outstanding, opportunistic buyers can trade above a known floor.
                  </p>
                </div>

                <div className="docs-feature-item">
                  <h4>Treasury Safety Valve (0.6%)</h4>
                  <p>
                    A separate <strong>0.6%</strong> treasury fee accrues per trade. During a challenge, the treasury can deploy jackpot rewards to stimulate
                    volume and help clear the challenger’s repayment obligation faster.
                  </p>
                </div>

                <div className="docs-feature-item">
                  <h4>Decentralized Buyout Path</h4>
                  <p>
                    Anyone can assume Majority‑Locked status by locking more tokens and satisfying the repayment obligation — acquiring control over
                    fee claims and DEX usage <strong>without centralized approval</strong>.
                  </p>
                </div>
              </div>

              {/* Mini Flow Diagram */}
              <div className="profit-flow">
                <h3>Revenue Flow</h3>
                <div className="flow-diagram">
                  <div className="flow-step">
                    <div className="flow-icon">🔁</div>
                    <div className="flow-text"><h4>Trade</h4><p>Buy or Sell</p></div>
                  </div>
                  <div className="flow-arrow">→</div>
                  <div className="flow-step">
                    <div className="flow-icon">💧</div>
                    <div className="flow-text"><h4>1.5% Fee Pool</h4><p>Saved on‑chain</p></div>
                  </div>
                  <div className="flow-arrow">+</div>
                  <div className="flow-step">
                    <div className="flow-icon">🏦</div>
                    <div className="flow-text"><h4>0.6% Treasury</h4><p>Growth budget</p></div>
                  </div>
                  <div className="flow-arrow">→</div>
                  <div className="flow-step">
                    <div className="flow-icon">🏆</div>
                    <div className="flow-text"><h4>Majority Claims</h4><p>Claim at any time</p></div>
                  </div>
                </div>

                <div className="flow-diagram" style={{ marginTop: 12 }}>
                  <div className="flow-step">
                    <div className="flow-icon">⚔️</div>
                    <div className="flow-text"><h4>Challenge</h4><p>New majority locks</p></div>
                  </div>
                  <div className="flow-arrow">→</div>
                  <div className="flow-step">
                    <div className="flow-icon">🔒</div>
                    <div className="flow-text"><h4>Locked</h4><p>Until ≤ 1,000,000 sats repaid</p></div>
                  </div>
                  <div className="flow-arrow">→</div>
                  <div className="flow-step">
                    <div className="flow-icon">📉</div>
                    <div className="flow-text"><h4>Price Floor</h4><p>Predictable buy region</p></div>
                  </div>
                  <div className="flow-arrow">→</div>
                  <div className="flow-step">
                    <div className="flow-icon">🎁</div>
                    <div className="flow-text"><h4>Jackpots (Optional)</h4><p>Treasury boosts volume</p></div>
                  </div>
                </div>
              </div>

              <div className="info-box">
                <strong>Flow:</strong> Trade → <strong>1.5%</strong> to Trading Fee Pool; <strong>0.6%</strong> to Treasury → Majority‑Locked Holder claims.
                If challenged: challenger remains locked until ≤ <strong>1,000,000 sats</strong> repaid via natural volume → price floor; optional
                treasury jackpots to accelerate volume.
              </div>

              <NavigationButtons />
            </section>

            {/* The Problem Section */}
            <section id="the-problem" className={`docs-section ${activeSection === 'the-problem' ? 'active' : ''}`}>
              <h2>The Problem</h2>
              
              <div className="problem-intro">
                <h3>🎮 Play-to-Earn games are broken.</h3>
              </div>

              <div id="token-inflation" className="problem-subsection">
                <h3>1. Token Inflation</h3>
                <p>
                  Most P2E games inflate their tokens to pay rewards. Without yield, your game tokens lose value every day due to unlimited printing.
                </p>
              </div>

              <div id="selling-pressure" className="problem-subsection">
                <h3>2. Selling Pressure</h3>
                <p>
                  Players immediately sell their earnings, creating constant downward pressure on token price. This means these game tokens are dependent on new players to remain:
                </p>
                <ul className="problem-list">
                  <li>Valuable and tradeable</li>
                  <li>Worth playing for</li>
                </ul>
                <p>
                  These dependencies have been challenged repeatedly, evidenced by the collapse of major P2E games like Axie Infinity, which saw their token lose 99% of its value.
                </p>
              </div>

              <div id="no-buying-incentive" className="problem-subsection">
                <h3>3. No Buying Incentive</h3>
                <p>
                  Why buy tokens when you can just earn and sell them? Traditional P2E creates no sustainable reason to hold the token, leading to inevitable collapse.
                </p>
              </div>

              <div id="no-verifiable-revenue" className="problem-subsection">
                <h3>4. No Verifiable Revenue Source</h3>
                <p>
                  Even P2E games that pay in Bitcoin often lack transparent, verifiable revenue sources. Without clear proof of sustainable income streams, 
                  communities have no incentive to help grow the platform, and payouts remain low and unsustainable.
                </p>
              </div>

              <div className="problem-conclusion">
                <p>
                  There is no sustainable play-to-earn game that rewards players with the hardest asset in the world (BTC) and is backed by the most secure blockchain (Bitcoin).
                </p>
              </div>

              <NavigationButtons />
            </section>

            {/* Our Solution Section */}
            <section id="our-solution" className={`docs-section ${activeSection === 'our-solution' ? 'active' : ''}`}>
              <h2>Our Solution</h2>
              


              <div className="solution-points">
                <div className="solution-point">
                  <h3>1. DEX Saves Trading Fees On-Chain</h3>
                  <p>
                    Our DEX transparently records and saves all trading fees in smart contracts. A trading fee is taken on every buy and sell. Anyone can verify the trading fees on-chain.
                  </p>
                  <p>
                    <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" className="guide-link">
                      📖 Guide on how to verify DEX trading fees
                    </a>
                  </p>
                </div>

                <div className="solution-point">
                  <h3>2. Sustainable Prize Pools</h3>
                  <p>
                    Trading fees fund game prize pools and marketing, ensuring protocol profitability while providing real Bitcoin rewards.
                  </p>
                </div>

                <div className="solution-point">
                  <h3>3. Points Based on Trading Fees</h3>
                  <p>
                    Users earn points from completed games towards a point goal. The points earned are based on the current trading fees available on the DEX, 
                    incentivizing players to trade more and create volatility in order to finish game campaigns faster.
                  </p>
                </div>

                <div className="solution-point">
                  <h3>4. Prize Pool Distribution</h3>
                  <p>
                    When a game campaign ends, the prize pool is split based on points earned, emulating proof of work to top players.
                  </p>
                </div>

                <div className="solution-point">
                  <h3>5. Token Requirements</h3>
                  <p>
                    Users need to hold both a key token and $MAS SATs to play. By default, the key token is $TEIKO Token, but can be swapped for any other token 
                    that has programmable non-custodial Bitcoin backing. This ensures protocol growth while users help support prize pool growth.
                  </p>
                </div>
              </div>

              <div className="solution-conclusion">
                <p>
                  MAS is a play-to-earn protocol that does not rely on token inflation or unsustainable rewards - just transparent trading fees and Bitcoin.
                </p>
              </div>
              
              <NavigationButtons />
            </section>

            {/* Who We Are Section */}
            <section id="who-we-are" className={`docs-section ${activeSection === 'who-we-are' ? 'active' : ''}`}>
              <h2>Who We Are</h2>
              
              <div className="who-we-are-content">
                <div className="mas-network-logo">
                  <img src="/logo.png" alt="MAS Network Logo" className="network-logo" />
                </div>
                
                <div className="mas-network-description">
                  <h3>Powered by The MAS Network</h3>
                  <p>
                    The MAS Network is a network of businesses and individuals who own MAS SATs as a way of providing liquidity 
                    to the protocol, ensuring its success and the end of financial inequality around the world forever.
                  </p>
                  <a href="https://themasnetwork.com/" target="_blank" rel="noopener noreferrer" className="mas-network-link">
                    Visit The MAS Network
                  </a>
                </div>
              </div>
              
              <NavigationButtons />
            </section>

            {/* Tokenomics Section */}
            <section id="tokenomics" className={`docs-section ${activeSection === 'tokenomics' ? 'active' : ''}`}>
              <h2>Tokenomics</h2>
              
              <div className="tokenomics-intro">
                <h3>Two-Token System</h3>
                <p>
                  The platform uses two tokens for access verification as a basis to partake in trading. You need $TEIKO to trade $MAS SATs from the UI level (not the smart contract level). Both tokens are programmable and tradable for sBTC (layer two Bitcoin) on the Stacks blockchain.
                </p>
              </div>

              <div className="token-details">
                <div className="token-card">
                  <h3>$TEIKO Token</h3>
                  <ul className="token-specs">
                    <li><strong>Max Supply:</strong> 21 million</li>
                    <li><strong>Launch:</strong> Fair launch on STX.CITY</li>
                    <li><strong>Purpose:</strong> Platform token needed to trade $MAS SATs</li>
                    <li><strong>Staking:</strong> Stake $TEIKO on <a href="https://app.velar.com/farm/SP20X3DC5R091J8B6YPQT638J8NR1W83KN6TN5BJY.univ2-lp-token-v1_0_0-0152" target="_blank" rel="noopener noreferrer">Velar</a> to earn $MAS SATs</li>
                  </ul>
                </div>

                <div className="token-card">
                  <h3>$MAS SATs</h3>
                  <ul className="token-specs">
                    <li><strong>Max Supply:</strong> 21 million</li>
                    <li><strong>Launch:</strong> Fair launch on our infinite bonding curve DEX</li>
                    <li><strong>Purpose:</strong> Required for games and activities</li>
                    <li><strong>Trading Fees:</strong> All trading fees per swap are saved on-chain</li>
                    <li><strong>Majority Holder:</strong> Locked majority holder claims all trading fees. Unlock requires fee replenishment.</li>
                  </ul>
                </div>
              </div>
              
              <NavigationButtons />
            </section>

            {/* Roadmap Section */}
            <section id="roadmap" className={`docs-section ${activeSection === 'roadmap' ? 'active' : ''}`}>
              <h2>Roadmap</h2>
              
              <div className="roadmap-intro">
                <h3>Development Timeline</h3>
                <p>
                  Our roadmap outlines the key milestones and development phases for The Forever Pump Protocol, 
                  focusing on building a sustainable play-to-earn ecosystem powered by Bitcoin.
                </p>
              </div>

              <div className="roadmap-phases">
                <div className="phase-card">
                  <div className="phase-header">
                    <h3>Jan 2025 - Sep 2025: Development</h3>
                    <span className="phase-status current">Current</span>
                  </div>
                  <ul className="phase-items">
                    <li>DEX smart contract development</li>
                    <li>Quiz game development</li>
                    <li>Infinite bonding curve implementation</li>
                    <li>Trading fee collection system</li>
                  </ul>
                </div>

                <div className="phase-card">
                  <div className="phase-header">
                    <h3>First Quiz Sponsorship</h3>
                    <span className="phase-status">Upcoming</span>
                  </div>
                  <ul className="phase-items">
                    <li>Company or individual sponsorship</li>
                    <li>Minimum 250k sats worth of liquidity in MAS SATs pool</li>
                    <li>Must have produced 21k sats in trading fees</li>
                    <li>Quiz platform launch with sponsored content</li>
                  </ul>
                </div>

                <div className="phase-card">
                  <div className="phase-header">
                    <h3>Phase 3: Expansion</h3>
                    <span className="phase-status">Future</span>
                  </div>
                  <ul className="phase-items">
                    <li>Building our cross-chain bridge platform</li>
                    <li>Additional game types and activities</li>
                    <li>Partnership integrations with other tokens</li>
                    <li>Advanced trading features</li>
                    <li>Community governance implementation</li>
                  </ul>
                </div>

                <div className="phase-card">
                  <div className="phase-header">
                    <h3>Phase 4: Ecosystem Growth</h3>
                    <span className="phase-status">Future</span>
                  </div>
                  <ul className="phase-items">
                    <li>Cross-chain integrations</li>
                    <li>Mobile application development</li>
                    <li>Institutional partnerships</li>
                    <li>Global expansion and localization</li>
                  </ul>
                </div>
              </div>
              
              <NavigationButtons />
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