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
        { 
          title: 'How It Works', 
          id: 'how-it-works', 
          href: '/docs/how-it-works',
          isActive: pathname === '/docs/how-it-works',
          subItems: pathname === '/docs/how-it-works' ? [
            { title: 'Get Project Funding', id: 'get-project-funding', href: '#get-project-funding' },
            { title: 'Generate Profit from Funding Projects', id: 'generate-profit', href: '#generate-profit' }
          ] : []
        },
        { title: 'Create Project', id: 'create-project', href: '/docs/create-project' },
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
            <div className="docs-site-name">Teikolabs.com</div>
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
            <h1 className="docs-title">How It Works</h1>
            <p className="docs-description">
              Learn how MAS Sats (Market Activated Satoshis) work and how you can profit from the innovative token mechanics.
            </p>
          </div>

          <div className="docs-body">
            <section id="get-project-funding" className="docs-section">
              <h2>💰 Get Project Funding</h2>
              <p className="section-subtitle-docs">Launch your Project and raise capital through the community using Bitcoin</p>
              
              <div className="step-container-docs">
                <div className="step-docs">
                  <div className="step-number-docs">1</div>
                  <div className="step-content-docs">
                    <h3>Create Your Project</h3>
                    <p>Use our platform to launch your project publicly on the blockchain.</p>
                  </div>
                </div>
                
                <div className="step-docs">
                  <div className="step-number-docs">2</div>
                  <div className="step-content-docs">
                    <h3>Grow Project Treasury Ownership</h3>
                    <p>Each project has 21 million units of ownership anyone can buy<br/>(Trades made using <a href="https://www.stacks.co/faq/what-is-sbtc" target="_blank" rel="noopener noreferrer" className="sbtc-link">sBTC</a> on Stacks blockchain)</p>
                  </div>
                </div>
                
                <div className="step-docs">
                  <div className="step-number-docs">3</div>
                  <div className="step-content-docs">
                    <h3>How To Profit</h3>
                    <h4 className="choice-title-docs">Choose Your Strategy:</h4>
                    
                    <div className="choice-container-docs">
                      <div className="choice-option-docs choice-a">
                        <div className="choice-number-docs">A</div>
                        <div className="choice-content-docs">
                          <h5>Earn From Trading Fees</h5>
                          <p>Whoever locks away the most ownership of the project can claim trading fee profit from every transaction.</p>
                        </div>
                      </div>
                      
                      <div className="choice-divider-docs">OR</div>
                      
                      <div className="choice-option-docs choice-b">
                        <div className="choice-number-docs">B</div>
                        <div className="choice-content-docs">
                          <h5>Sell Ownership For Profit</h5>
                          <p>Sell ownership of project treasury for profit, leaving trading fees for anyone else to claim.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="generate-profit" className="docs-section">
              <h2>📈 Generate Profit from Funding Projects</h2>
              <p className="section-subtitle-docs">Buy ownership in project treasuries and compete to earn trading fees</p>
              
              <div className="step-container-docs">
                <div className="step-docs">
                  <div className="step-number-docs">1</div>
                  <div className="step-content-docs">
                    <h3>How Projects Make Money</h3>
                    <p>Each project charges a 1.5% fee for every trade of its treasury<br/>(Max Treasury Supply: 21 Million)</p>
                  </div>
                </div>
                
                <div className="step-docs">
                  <div className="step-number-docs">2</div>
                  <div className="step-content-docs">
                    <h3>How To Profit</h3>
                    <h4 className="choice-title-docs">Choose Your Strategy:</h4>
                    
                    <div className="choice-container-docs">
                      <div className="choice-option-docs choice-a">
                        <div className="choice-number-docs">A</div>
                        <div className="choice-content-docs">
                          <h5>Earn From Trading Fees</h5>
                          <p>Whoever locks away the most ownership of the project can claim trading fee profit from every transaction.</p>
                        </div>
                      </div>
                      
                      <div className="choice-divider-docs">OR</div>
                      
                      <div className="choice-option-docs choice-b">
                        <div className="choice-number-docs">B</div>
                        <div className="choice-content-docs">
                          <h5>Sell Ownership For Profit</h5>
                          <p>Sell ownership of project treasury for profit, leaving trading fees for anyone else to claim.</p>
                        </div>
                      </div>
                    </div>
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
