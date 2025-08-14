'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '../docs.css';

export default function ClaimProfitPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  // Simplified navigation structure
  const navigation = [
    {
      title: 'Documentation',
      items: [
        { title: 'Overview', id: 'overview', href: '/docs' },
        { title: 'Roadmap', id: 'roadmap', href: '/docs#roadmap' },
        { title: 'How It Works', id: 'how-it-works', href: '/docs/how-it-works' },

        { title: 'Trading', id: 'trading', href: '/docs/trading' },
        { 
          title: 'Claim Profit', 
          id: 'claim-profit', 
          href: '/docs/claim-profit',
          subItems: pathname === '/docs/claim-profit' ? [
            { title: 'Profit Overview', id: 'overview', href: '#overview' },
            { title: 'Majority Holder System', id: 'majority-holder', href: '#majority-holder' },
            { title: 'Locking Tokens', id: 'locking-tokens', href: '#locking-tokens' },
            { title: 'Unlocking Tokens', id: 'unlocking-tokens', href: '#unlocking-tokens' },
            { title: 'Profit Mechanics', id: 'profit-mechanics', href: '#profit-mechanics' },
            { title: 'Strategies', id: 'strategies', href: '#strategies' }
          ] : undefined
        },
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
                    {item.subItems && (
                      <ul className="docs-nav-sublist">
                        {item.subItems.map((subItem, subIndex) => (
                          <li key={subIndex} className="docs-nav-subitem">
                            <a 
                              href={subItem.href}
                              className="docs-nav-sublink"
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
            <h1 className="docs-title">Claim Profit</h1>
            <p className="docs-description">
              Learn how to claim your trading profits and rewards from the platform.
            </p>
          </div>

          <div className="docs-body">
            <section id="overview" className="docs-section">
              <h2>Profit Claiming Overview</h2>
              <p>
                To claim trading fee profits, you must be the <strong>majority holder of locked tokens</strong>. 
                This system ensures that only committed, long-term supporters can benefit from the project's 
                trading activity while preventing short-term speculation.
              </p>
              
              <div className="profit-key-points">
                <div className="key-point">
                  <div className="key-point-icon">🔒</div>
                  <div className="key-point-content">
                    <h3>Lock Your Tokens</h3>
                    <p>Lock your ownership units to participate in profit sharing and show long-term commitment</p>
                  </div>
                </div>
                
                <div className="key-point">
                  <div className="key-point-icon">👑</div>
                  <div className="key-point-content">
                    <h3>Become Majority Holder</h3>
                    <p>Hold more than 50% of all locked tokens to become eligible for profit claims</p>
                  </div>
                </div>
                
                <div className="key-point">
                  <div className="key-point-icon">💰</div>
                  <div className="key-point-content">
                    <h3>Claim Trading Fees</h3>
                    <p>Collect 1.5% of all trading volume as your reward for being the majority holder</p>
                  </div>
                </div>
                
                <div className="key-point">
                  <div className="key-point-icon">⏳</div>
                  <div className="key-point-content">
                    <h3>Minimum Threshold</h3>
                    <p>Must meet minimum withdrawal threshold before unlocking any tokens</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="majority-holder" className="docs-section">
              <h2>Majority Holder System</h2>
              <p>
                The majority holder system is designed to reward the most committed supporter of each project. 
                Only the holder with more than 50% of all locked tokens can claim trading fee profits.
              </p>
              
              <div className="majority-explanation">
                <div className="explanation-card">
                  <h3>🏆 How It Works</h3>
                  <div className="explanation-steps">
                    <div className="explanation-step">
                      <span className="step-number">1</span>
                      <span className="step-text">Users lock their ownership units in the treasury contract</span>
                    </div>
                    <div className="explanation-step">
                      <span className="step-number">2</span>
                      <span className="step-text">System calculates who holds &gt;50% of all locked tokens</span>
                    </div>
                    <div className="explanation-step">
                      <span className="step-number">3</span>
                      <span className="step-text">Majority holder becomes eligible to claim 1.5% trading fees</span>
                    </div>
                    <div className="explanation-step">
                      <span className="step-number">4</span>
                      <span className="step-text">Trading fees accumulate in treasury for the majority holder</span>
                    </div>
                  </div>
                </div>
                
                <div className="majority-benefits">
                  <h3>💡 Why This System?</h3>
                  <ul>
                    <li><strong>Prevents Fragmentation:</strong> Ensures clear leadership and decision-making</li>
                    <li><strong>Rewards Commitment:</strong> Majority holder has the most skin in the game</li>
                    <li><strong>Encourages Growth:</strong> Majority holder is incentivized to grow project value</li>
                    <li><strong>Anti-Dumping:</strong> Large holders can't easily exit without losing majority status</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="locking-tokens" className="docs-section">
              <h2>Locking Tokens</h2>
              <p>
                Locking your tokens demonstrates commitment to the project and makes you eligible for 
                profit sharing. Locked tokens cannot be traded but entitle you to claim trading fees 
                if you become the majority holder.
              </p>
              
              <div className="locking-process">
                <div className="process-card">
                  <h3>🔐 Token Locking Process</h3>
                  <div className="process-steps">
                    <div className="process-step-item">
                      <div className="process-icon">1️⃣</div>
                      <div className="process-content">
                        <h4>Select Amount</h4>
                        <p>Choose how many ownership units you want to lock</p>
                      </div>
                    </div>
                    
                    <div className="process-step-item">
                      <div className="process-icon">2️⃣</div>
                      <div className="process-content">
                        <h4>Confirm Transaction</h4>
                        <p>Sign the blockchain transaction to lock your tokens</p>
                      </div>
                    </div>
                    
                    <div className="process-step-item">
                      <div className="process-icon">3️⃣</div>
                      <div className="process-content">
                        <h4>Tokens Locked</h4>
                        <p>Your tokens are now locked and count toward majority calculation</p>
                      </div>
                    </div>
                    
                    <div className="process-step-item">
                      <div className="process-icon">4️⃣</div>
                      <div className="process-content">
                        <h4>Monitor Status</h4>
                        <p>Track your locked balance and majority holder status</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="locking-considerations">
                  <h3>⚠️ Important Considerations</h3>
                  <div className="consideration-grid">
                    <div className="consideration-item">
                      <h4>💰 Cost</h4>
                      <p>Only network fees (STX gas) - no additional platform fees</p>
                    </div>
                    
                    <div className="consideration-item">
                      <h4>🚫 No Trading</h4>
                      <p>Locked tokens cannot be sold or transferred</p>
                    </div>
                    
                    <div className="consideration-item">
                      <h4>📊 Majority Competition</h4>
                      <p>Other users may lock more tokens to challenge your majority</p>
                    </div>
                    
                    <div className="consideration-item">
                      <h4>🔄 Reversible</h4>
                      <p>You can unlock tokens (with restrictions) if needed</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="unlocking-tokens" className="docs-section">
              <h2>Unlocking Tokens</h2>
              <p>
                Unlocking tokens is possible but comes with strict requirements to prevent abuse of the 
                profit-sharing system. You must meet minimum threshold requirements before any tokens can be unlocked.
              </p>
              
              <div className="unlocking-rules">
                <div className="rule-card critical">
                  <h3>🚨 Critical Unlocking Rule</h3>
                  <div className="rule-content">
                    <p>
                      <strong>You cannot unlock any tokens unless the minimum threshold is met.</strong>
                    </p>
                    <p>
                      The last greatest trading fee withdrawal amount must be paid back up to 
                      <strong>1 million sats</strong> before any tokens can be unlocked.
                    </p>
                  </div>
                </div>
                
                <div className="threshold-explanation">
                  <h3>📊 Minimum Threshold System</h3>
                  <div className="threshold-details">
                    <div className="threshold-scenario">
                      <h4>Example Scenario:</h4>
                      <div className="scenario-steps">
                        <div className="scenario-step">
                          <span className="scenario-label">1. You claim:</span>
                          <span className="scenario-value">500,000 sats in trading fees</span>
                        </div>
                        <div className="scenario-step">
                          <span className="scenario-label">2. To unlock tokens:</span>
                          <span className="scenario-value">Must repay 500,000 sats to treasury</span>
                        </div>
                        <div className="scenario-step">
                          <span className="scenario-label">3. If you claimed:</span>
                          <span className="scenario-value">1.5M sats, must repay 1M sats (max)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="unlocking-process">
                <h3>🔓 Unlocking Process</h3>
                <div className="unlock-steps">
                  <div className="unlock-step">
                    <div className="unlock-number">1</div>
                    <div className="unlock-content">
                      <h4>Check Threshold</h4>
                      <p>Verify you meet the minimum repayment requirement</p>
                    </div>
                  </div>
                  
                  <div className="unlock-step">
                    <div className="unlock-number">2</div>
                    <div className="unlock-content">
                      <h4>Repay Treasury</h4>
                      <p>Send required sBTC amount back to treasury contract</p>
                    </div>
                  </div>
                  
                  <div className="unlock-step">
                    <div className="unlock-number">3</div>
                    <div className="unlock-content">
                      <h4>Request Unlock</h4>
                      <p>Submit unlock transaction for desired token amount</p>
                    </div>
                  </div>
                  
                  <div className="unlock-step">
                    <div className="unlock-number">4</div>
                    <div className="unlock-content">
                      <h4>Tokens Released</h4>
                      <p>Unlocked tokens become tradeable again</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="profit-mechanics" className="docs-section">
              <h2>Profit Distribution Mechanics</h2>
              <p>
                Understanding how trading fees accumulate and can be claimed is crucial for maximizing 
                your returns as a majority holder.
              </p>
              
              <div className="profit-flow">
                <h3>💰 Trading Fee Flow</h3>
                <div className="flow-diagram">
                  <div className="flow-step">
                    <div className="flow-icon">🔄</div>
                    <div className="flow-text">
                      <h4>User Trades</h4>
                      <p>Every buy/sell generates 2.1% fee</p>
                    </div>
                  </div>
                  
                  <div className="flow-arrow">→</div>
                  
                  <div className="flow-step">
                    <div className="flow-icon">📈</div>
                    <div className="flow-text">
                      <h4>Fee Split</h4>
                      <p>1.5% → Majority Holder<br/>0.6% → Platform</p>
                    </div>
                  </div>
                  
                  <div className="flow-arrow">→</div>
                  
                  <div className="flow-step">
                    <div className="flow-icon">🏦</div>
                    <div className="flow-text">
                      <h4>Treasury Accumulation</h4>
                      <p>Fees stored in smart contract</p>
                    </div>
                  </div>
                  
                  <div className="flow-arrow">→</div>
                  
                  <div className="flow-step">
                    <div className="flow-icon">💎</div>
                    <div className="flow-text">
                      <h4>Majority Holder Claims</h4>
                      <p>Withdraw accumulated profits</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="claiming-details">
                <h3>🎯 Claiming Requirements</h3>
                <div className="requirements-list">
                  <div className="requirement-item">
                    <div className="requirement-icon">✅</div>
                    <div className="requirement-text">
                      <strong>Majority Status:</strong> Hold &gt;50% of all locked tokens
                    </div>
                  </div>
                  
                  <div className="requirement-item">
                    <div className="requirement-icon">✅</div>
                    <div className="requirement-text">
                      <strong>Active Trading:</strong> Trading fees must be available in treasury
                    </div>
                  </div>
                  
                  <div className="requirement-item">
                    <div className="requirement-icon">✅</div>
                    <div className="requirement-text">
                      <strong>Gas Fees:</strong> Have STX for transaction costs
                    </div>
                  </div>
                  
                  <div className="requirement-item">
                    <div className="requirement-icon">✅</div>
                    <div className="requirement-text">
                      <strong>Commitment:</strong> Accept unlock restrictions after claiming
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="strategies" className="docs-section">
              <h2>Majority Holder Strategies</h2>
              <p>
                Successful majority holders understand both the financial and strategic aspects of 
                their position. Here are key strategies for maximizing your profits.
              </p>
              
              <div className="strategy-grid">
                <div className="strategy-card">
                  <h3>📈 Growth Strategy</h3>
                  <ul>
                    <li>Promote project to increase trading volume</li>
                    <li>Engage with community to build trust</li>
                    <li>Share project progress and updates</li>
                    <li>Encourage long-term thinking among holders</li>
                  </ul>
                </div>
                
                <div className="strategy-card">
                  <h3>🛡️ Defense Strategy</h3>
                  <ul>
                    <li>Monitor other large holders who might challenge</li>
                    <li>Be prepared to lock more tokens if needed</li>
                    <li>Build alliances with smaller holders</li>
                    <li>Maintain sufficient sBTC for emergency purchases</li>
                  </ul>
                </div>
                
                <div className="strategy-card">
                  <h3>💰 Profit Strategy</h3>
                  <ul>
                    <li>Claim profits regularly to compound returns</li>
                    <li>Reinvest some profits back into the project</li>
                    <li>Balance claims vs. unlock restrictions</li>
                    <li>Track trading patterns to optimize timing</li>
                  </ul>
                </div>
                
                <div className="strategy-card">
                  <h3>⚖️ Risk Management</h3>
                  <ul>
                    <li>Understand unlock threshold implications</li>
                    <li>Don't over-commit if you need liquidity</li>
                    <li>Monitor project fundamentals regularly</li>
                    <li>Have exit strategy if project direction changes</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
