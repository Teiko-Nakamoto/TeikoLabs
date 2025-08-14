'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '../docs.css';

export default function FeesPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('fees');
  const pathname = usePathname();

  // Trading simulator state
  const [simulatorInputs, setSimulatorInputs] = useState({
    numberOfUsers: 100,
    avgAmountPerTrade: 100,
    tradesPerDay: 2,
    tradingDays: 30
  });

  const [simulatorResults, setSimulatorResults] = useState({
    totalVolume: 0,
    totalFees: 0,
    majorityHolderReward: 0,
    platformFee: 0
  });

  // Calculate simulator results
  useEffect(() => {
    const { numberOfUsers, avgAmountPerTrade, tradesPerDay, tradingDays } = simulatorInputs;
    
    // Total volume = users × avg amount × trades per day × days × 2 (buy + sell)
    const totalVolume = numberOfUsers * avgAmountPerTrade * tradesPerDay * tradingDays * 2;
    const totalFees = totalVolume * 0.021; // 2.1% fee
    const majorityHolderReward = totalVolume * 0.015; // 1.5%
    const platformFee = totalVolume * 0.006; // 0.6%

    setSimulatorResults({
      totalVolume,
      totalFees,
      majorityHolderReward,
      platformFee
    });
  }, [simulatorInputs]);

  const handleInputChange = (field, value) => {
    setSimulatorInputs(prev => ({
      ...prev,
      [field]: Math.max(0, Number(value))
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number);
  };

  // Simplified navigation structure
  const navigation = [
    {
      title: 'Documentation',
      items: [
        { title: 'Overview', id: 'overview', href: '/docs' },
        { title: 'Roadmap', id: 'roadmap', href: '/docs#roadmap' },
        { title: 'How It Works', id: 'how-it-works', href: '/docs/how-it-works' },

        { title: 'Trading', id: 'trading', href: '/docs/trading' },
        { title: 'Claim Profit', id: 'claim-profit', href: '/docs/claim-profit' },
        { 
          title: 'Fees', 
          id: 'fees', 
          href: '/docs/fees',
          isActive: pathname === '/docs/fees',
          subItems: pathname === '/docs/fees' ? [
            { title: 'Fee Structure', id: 'fee-structure', href: '#fee-structure' },
            { title: 'Trading Profit Simulator', id: 'trading-simulator', href: '#trading-simulator' },
            { title: 'Majority Holder Reward', id: 'majority-holder-reward', href: '#majority-holder-reward' },
            { title: 'Platform Fee', id: 'platform-fee', href: '#platform-fee' },
            { title: 'The MAS Network Protocol', id: 'mas-network-protocol', href: '#mas-network-protocol' },
            { title: 'Fee Examples', id: 'fee-examples', href: '#fee-examples' }
          ] : []
        },
      ]
    }
  ];

  // Use navigation as-is without filtering
  const filteredNavigation = navigation;

  // Table of contents for current page
  const tableOfContents = [
    { title: 'Fee Structure', id: 'fee-structure' },
    { title: 'Trading Profit Simulator', id: 'trading-simulator' },
    { title: 'Majority Holder Reward', id: 'majority-holder-reward' },
    { title: 'Platform Fee', id: 'platform-fee' },
    { title: 'The MAS Network Protocol', id: 'mas-network-protocol' },
    { title: 'Fee Examples', id: 'fee-examples' }
  ];

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
            <h1 className="docs-title">Fees</h1>
            <p className="docs-description">
              Learn about the fee structure for trading on our platform and how fees support both token holders and platform development.
            </p>
          </div>

          <div className="docs-body">
            <section id="fee-structure" className="docs-section">
              <h2>Fee Structure</h2>
              <p>
                Every project on our platform charges a <strong>2.1% fee</strong> for every buy and sell transaction. 
                This fee is automatically divided into two parts to support both the token community and platform development.
              </p>
              
              <div className="docs-fee-breakdown">
                <div className="docs-fee-card">
                  <div className="docs-fee-percentage">1.5%</div>
                  <h3>Majority Holder Reward</h3>
                  <p>Goes directly to the majority holder of the token</p>
                </div>
                <div className="docs-fee-card">
                  <div className="docs-fee-percentage">0.6%</div>
                  <h3>Platform Fee</h3>
                  <p>Maintains platform and powers The MAS Network Protocol</p>
                </div>
              </div>
            </section>

            <section id="trading-simulator" className="docs-section">
              <h2>Trading Profit Simulator</h2>
              <p>
                Use this interactive calculator to estimate potential trading profits based on your token's activity. 
                Adjust the parameters below to see how different trading volumes affect majority holder rewards and platform fees.
              </p>

              <div className="simulator-container">
                <div className="simulator-inputs">
                  <h3>Input Parameters</h3>
                  
                  <div className="input-group">
                    <label htmlFor="numberOfUsers">Number of Users</label>
                    <input
                      type="number"
                      id="numberOfUsers"
                      value={simulatorInputs.numberOfUsers}
                      onChange={(e) => handleInputChange('numberOfUsers', e.target.value)}
                      min="1"
                      className="simulator-input"
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="avgAmountPerTrade">Average Amount per Trade ($)</label>
                    <input
                      type="number"
                      id="avgAmountPerTrade"
                      value={simulatorInputs.avgAmountPerTrade}
                      onChange={(e) => handleInputChange('avgAmountPerTrade', e.target.value)}
                      min="1"
                      className="simulator-input"
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="tradesPerDay">Trades per User per Day</label>
                    <input
                      type="number"
                      id="tradesPerDay"
                      value={simulatorInputs.tradesPerDay}
                      onChange={(e) => handleInputChange('tradesPerDay', e.target.value)}
                      min="1"
                      className="simulator-input"
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="tradingDays">Number of Trading Days</label>
                    <input
                      type="number"
                      id="tradingDays"
                      value={simulatorInputs.tradingDays}
                      onChange={(e) => handleInputChange('tradingDays', e.target.value)}
                      min="1"
                      className="simulator-input"
                    />
                  </div>
                </div>

                <div className="simulator-results">
                  <h3>Projected Results</h3>
                  
                  <div className="result-cards">
                    <div className="result-card total-volume">
                      <div className="result-label">Total Trading Volume</div>
                      <div className="result-value">{formatCurrency(simulatorResults.totalVolume)}</div>
                      <div className="result-note">
                        {formatNumber(simulatorInputs.numberOfUsers)} users × {formatCurrency(simulatorInputs.avgAmountPerTrade)} × {simulatorInputs.tradesPerDay} trades/day × {simulatorInputs.tradingDays} days × 2 (buy+sell)
                      </div>
                    </div>

                    <div className="result-card total-fees">
                      <div className="result-label">Total Fees Generated</div>
                      <div className="result-value">{formatCurrency(simulatorResults.totalFees)}</div>
                      <div className="result-note">2.1% of total volume</div>
                    </div>

                    <div className="result-card majority-reward">
                      <div className="result-label">Majority Holder Earnings</div>
                      <div className="result-value">{formatCurrency(simulatorResults.majorityHolderReward)}</div>
                      <div className="result-note">1.5% of total volume</div>
                    </div>

                    <div className="result-card platform-fee">
                      <div className="result-label">Platform Fee</div>
                      <div className="result-value">{formatCurrency(simulatorResults.platformFee)}</div>
                      <div className="result-note">0.6% of total volume</div>
                    </div>
                  </div>

                  <div className="simulator-summary">
                    <h4>Summary</h4>
                    <p>
                      With <strong>{formatNumber(simulatorInputs.numberOfUsers)} users</strong> trading an average of <strong>{formatCurrency(simulatorInputs.avgAmountPerTrade)}</strong> per transaction, 
                      <strong> {simulatorInputs.tradesPerDay} times per day</strong> for <strong>{simulatorInputs.tradingDays} days</strong>, 
                      the majority holder would earn <strong>{formatCurrency(simulatorResults.majorityHolderReward)}</strong> in trading fees.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section id="majority-holder-reward" className="docs-section">
              <h2>Majority Holder Reward (1.5%)</h2>
              <p>
                The majority holder of each token receives 1.5% of every transaction fee. This creates an incentive structure where:
              </p>
              <ul>
                <li>Token holders are rewarded for maintaining significant positions</li>
                <li>The majority holder has a vested interest in the token's success</li>
                <li>Trading activity directly benefits the largest stakeholder</li>
                <li>Community leaders are incentivized to promote their tokens</li>
              </ul>
              <div className="docs-info-box">
                <strong>Note:</strong> The majority holder is automatically determined by the largest token balance and receives rewards in real-time with each transaction.
              </div>
            </section>

            <section id="platform-fee" className="docs-section">
              <h2>Platform Fee (0.6%)</h2>
              <p>
                The 0.6% platform fee serves two critical purposes:
              </p>
              <div className="docs-feature-list">
                <div className="docs-feature-item">
                  <h4>🔧 Platform Maintenance</h4>
                  <p>Covers hosting, development, security updates, and technical infrastructure to keep the platform running smoothly.</p>
                </div>
                <div className="docs-feature-item">
                  <h4>⚡ MAS Network Protocol</h4>
                  <p>Powers The MAS Network Protocol, which rewards users for learning about <Link href="/" className="docs-content-link">teikolabs.com</Link> and engaging with the platform.</p>
                </div>
              </div>
            </section>

            <section id="mas-network-protocol" className="docs-section">
              <h2>The MAS Network Protocol</h2>
              <p>
                Part of the platform fee directly supports The MAS Network Protocol, an innovative system that:
              </p>
              <ul>
                <li>Rewards users for learning about <Link href="/" className="docs-content-link">teikolabs.com</Link></li>
                <li>Encourages platform engagement and education</li>
                <li>Creates additional value for the community beyond trading</li>
                <li>Promotes understanding of the platform's features and benefits</li>
              </ul>
              <p>
                This protocol ensures that every trade not only benefits individual traders and majority holders but also contributes to building a more educated and engaged community.
              </p>
            </section>

            <section id="fee-examples" className="docs-section">
              <h2>Fee Examples</h2>
              <p>Here are some examples of how fees work in practice:</p>
              
              <div className="docs-examples">
                <div className="docs-example-card">
                  <h4>Example 1: $100 Transaction</h4>
                  <div className="docs-calculation">
                    <div>Transaction Amount: <strong>$100</strong></div>
                    <div>Total Fee (2.1%): <strong>$2.10</strong></div>
                    <div>• Majority Holder (1.5%): <strong>$1.50</strong></div>
                    <div>• Platform Fee (0.6%): <strong>$0.60</strong></div>
                  </div>
                </div>

                <div className="docs-example-card">
                  <h4>Example 2: $1,000 Transaction</h4>
                  <div className="docs-calculation">
                    <div>Transaction Amount: <strong>$1,000</strong></div>
                    <div>Total Fee (2.1%): <strong>$21.00</strong></div>
                    <div>• Majority Holder (1.5%): <strong>$15.00</strong></div>
                    <div>• Platform Fee (0.6%): <strong>$6.00</strong></div>
                  </div>
                </div>
              </div>

              <div className="docs-info-box">
                <strong>Important:</strong> Fees are calculated on both buy and sell transactions and are automatically deducted at the time of trade execution.
              </div>
            </section>
          </div>
        </div>


      </main>
    </div>
  );
}
