'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '../docs.css';

export default function TradingPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  // Simulator state for current price
  const [currentPriceInputs, setCurrentPriceInputs] = useState({
    sbtcBalance: 1500000,
    virtualSbtc: 1500000,
    availableTokens: 21000000
  });

  // Simulator state for execution price
  const [executionPriceInputs, setExecutionPriceInputs] = useState({
    satsSpentReceived: 100000,
    tokensReceivedSold: 100000,
    tradeType: 'buy'
  });

  // Current price calculation
  const currentPrice = (currentPriceInputs.sbtcBalance + currentPriceInputs.virtualSbtc) / currentPriceInputs.availableTokens;

  // Execution price calculation
  const executionPrice = executionPriceInputs.satsSpentReceived / executionPriceInputs.tokensReceivedSold;

  // Simplified navigation structure
  const navigation = [
    {
      title: 'Documentation',
      items: [
        { title: 'Overview', id: 'overview', href: '/docs' },
        { title: 'How It Works', id: 'how-it-works', href: '/docs/how-it-works' },
        { title: 'Roadmap', id: 'roadmap', href: '/docs#roadmap' },

        { 
          title: 'Trading', 
          id: 'trading', 
          href: '/docs/trading',
          subItems: pathname === '/docs/trading' ? [
            { title: 'Ownership Units', id: 'ownership-units', href: '#ownership-units' },
            { title: 'Price Types', id: 'price-types', href: '#price-types' },
            { title: 'Current Price Calculator', id: 'current-price', href: '#current-price' },
            { title: 'Execution Price Calculator', id: 'execution-price', href: '#execution-price' },
            { title: 'Bonding Curve Model', id: 'bonding-curve', href: '#bonding-curve' }
          ] : undefined
        },
        { title: 'Claim Profit', id: 'claim-profit', href: '/docs/claim-profit' },
        { title: 'Fees', id: 'fees', href: '/docs/fees' },
      ]
    }
  ];

  // Use navigation as-is without filtering
  const filteredNavigation = navigation;

  const handleCurrentPriceInputChange = (field, value) => {
    setCurrentPriceInputs(prev => ({
      ...prev,
      [field]: Math.max(0, Number(value))
    }));
  };

  const handleExecutionPriceInputChange = (field, value) => {
    setExecutionPriceInputs(prev => ({
      ...prev,
      [field]: field === 'tradeType' ? value : Math.max(0, Number(value))
    }));
  };

  const formatSats = (sats) => {
    return new Intl.NumberFormat('en-US').format(sats);
  };

  const formatPrice = (price) => {
    return price.toFixed(8);
  };

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
            <h1 className="docs-title">Trading</h1>
            <p className="docs-description">
              Learn how to trade project ownership units on our Bitcoin-backed platform and understand the pricing mechanisms.
            </p>
          </div>

          <div className="docs-body">
            <section id="ownership-units" className="docs-section">
              <h2>Project Ownership Units</h2>
              <p>
                Each project has a supply of <strong>21 million ownership units</strong> issued by the project smart contract. 
                You can visit the contract address on the <a href="https://explorer.stacks.co" target="_blank" rel="noopener noreferrer" className="sbtc-link">Stacks Explorer</a> and check the supply hardcoded yourself.
              </p>
              
              <div className="trading-key-points">
                <div className="key-point">
                  <div className="key-point-icon">🏦</div>
                  <div className="key-point-content">
                    <h3>Treasury Rights</h3>
                    <p>Each ownership unit gives you rights to the treasury contract's trading fee profits to claim if you are the majority holder.</p>
                  </div>
                </div>
                
                <div className="key-point">
                  <div className="key-point-icon">📈</div>
                  <div className="key-point-content">
                    <h3>Trading Strategy</h3>
                    <p>Buy to gain ownership units and sell for a profit if the units go up in price as demand increases.</p>
                  </div>
                </div>
                
                <div className="key-point">
                  <div className="key-point-icon">🔗</div>
                  <div className="key-point-content">
                    <h3>Smart Contract Verification</h3>
                    <p>All supply limits and trading mechanics are hardcoded in the smart contract and can be verified on-chain.</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="price-types" className="docs-section">
              <h2>Understanding Prices: Current vs Execution</h2>
              <p>
                There are two important prices to understand when trading: <strong>Current Price</strong> and <strong>Execution Price</strong>. 
                Both prices are based on an <strong>infinite bonding curve model</strong> that automatically adjusts pricing based on supply and demand.
              </p>

              <div className="price-comparison">
                <div className="price-type current-price">
                  <h3>📊 Current Price</h3>
                  <p>Real-time AMM calculation based on current pool balances</p>
                </div>
                <div className="price-type execution-price">
                  <h3>⚡ Execution Price</h3>
                  <p>Actual price achieved from your completed blockchain transaction</p>
                </div>
              </div>
            </section>

            <section id="current-price" className="docs-section">
              <h2>Current Price Calculator</h2>
              <p>
                The current price is calculated using an <strong>Automated Market Maker (AMM)</strong> formula based on the infinite bonding curve model. 
                The chart displays the <strong>last executed trade price</strong>, while the current price shows the <strong>real-time AMM calculation</strong>.
              </p>

              <div className="price-formula-section">
                <div className="formula-display">
                  <h3>Current Price Formula:</h3>
                  <div className="formula">
                    Price = (sBTC Balance + Virtual sBTC) ÷ Available Tokens
                  </div>
                </div>

                <div className="current-price-simulator">
                  <h4>Simulate Current Price</h4>
                  <div className="simulator-inputs-grid">
                    <div className="input-group">
                      <label>sBTC Balance (sats)</label>
                      <input
                        type="number"
                        value={currentPriceInputs.sbtcBalance}
                        onChange={(e) => handleCurrentPriceInputChange('sbtcBalance', e.target.value)}
                        className="simulator-input"
                      />
                    </div>
                    
                    <div className="input-group">
                      <label>Virtual sBTC (sats)</label>
                      <input
                        type="number"
                        value={currentPriceInputs.virtualSbtc}
                        onChange={(e) => handleCurrentPriceInputChange('virtualSbtc', e.target.value)}
                        className="simulator-input"
                      />
                    </div>
                    
                    <div className="input-group">
                      <label>Available Tokens</label>
                      <input
                        type="number"
                        value={currentPriceInputs.availableTokens}
                        onChange={(e) => handleCurrentPriceInputChange('availableTokens', e.target.value)}
                        className="simulator-input"
                      />
                    </div>
                  </div>

                  <div className="calculation-result">
                    <div className="calculation-breakdown">
                      <div>({formatSats(currentPriceInputs.sbtcBalance)} + {formatSats(currentPriceInputs.virtualSbtc)}) ÷ {formatSats(currentPriceInputs.availableTokens)}</div>
                      <div>= {formatSats(currentPriceInputs.sbtcBalance + currentPriceInputs.virtualSbtc)} ÷ {formatSats(currentPriceInputs.availableTokens)}</div>
                    </div>
                    <div className="final-price">
                      <strong>Current Price: {formatPrice(currentPrice)} sats/token</strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="execution-price" className="docs-section">
              <h2>Execution Price Calculator</h2>
              <p>
                The execution price is calculated from your actual transaction results on the blockchain. 
                This represents the real price you paid or received, which may differ from the current price due to the bonding curve mechanics.
              </p>

              <div className="price-formula-section">
                <div className="formula-display">
                  <h3>Execution Price Formula:</h3>
                  <div className="formula">
                    Execution Price = Sats {executionPriceInputs.tradeType === 'buy' ? 'Spent' : 'Received'} ÷ Tokens {executionPriceInputs.tradeType === 'buy' ? 'Received' : 'Sold'}
                  </div>
                </div>

                <div className="execution-price-simulator">
                  <h4>Simulate Execution Price</h4>
                  <div className="simulator-inputs-grid">
                    <div className="input-group">
                      <label>Trade Type</label>
                      <select
                        value={executionPriceInputs.tradeType}
                        onChange={(e) => handleExecutionPriceInputChange('tradeType', e.target.value)}
                        className="simulator-input"
                      >
                        <option value="buy">Buy</option>
                        <option value="sell">Sell</option>
                      </select>
                    </div>
                    
                    <div className="input-group">
                      <label>Sats {executionPriceInputs.tradeType === 'buy' ? 'Spent' : 'Received'}</label>
                      <input
                        type="number"
                        value={executionPriceInputs.satsSpentReceived}
                        onChange={(e) => handleExecutionPriceInputChange('satsSpentReceived', e.target.value)}
                        className="simulator-input"
                      />
                    </div>
                    
                    <div className="input-group">
                      <label>Tokens {executionPriceInputs.tradeType === 'buy' ? 'Received' : 'Sold'}</label>
                      <input
                        type="number"
                        value={executionPriceInputs.tokensReceivedSold}
                        onChange={(e) => handleExecutionPriceInputChange('tokensReceivedSold', e.target.value)}
                        className="simulator-input"
                      />
                    </div>
                  </div>

                  <div className="calculation-result">
                    <div className="calculation-breakdown">
                      <div>{formatSats(executionPriceInputs.satsSpentReceived)} sats ÷ {formatSats(executionPriceInputs.tokensReceivedSold)} tokens</div>
                    </div>
                    <div className="final-price">
                      <strong>Execution Price: {formatPrice(executionPrice)} sats/token</strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="bonding-curve" className="docs-section">
              <h2>Infinite Bonding Curve Model</h2>
              <p>
                Both pricing mechanisms operate on an <strong>infinite bonding curve model</strong> that provides several key benefits:
              </p>

              <div className="bonding-curve-benefits">
                <div className="benefit-item">
                  <h4>🔄 Continuous Liquidity</h4>
                  <p>Always able to buy or sell without waiting for counterparties</p>
                </div>
                
                <div className="benefit-item">
                  <h4>📈 Price Discovery</h4>
                  <p>Price automatically adjusts based on supply and demand</p>
                </div>
                
                <div className="benefit-item">
                  <h4>⚡ Instant Settlement</h4>
                  <p>Trades execute immediately at current market prices</p>
                </div>
                
                <div className="benefit-item">
                  <h4>🛡️ Slippage Protection</h4>
                  <p>Predictable pricing with optional slippage limits</p>
                </div>
              </div>

              <div className="info-box">
                <strong>Key Insight:</strong> The bonding curve ensures that early supporters benefit from price appreciation 
                as more users join the project, while maintaining continuous liquidity for all participants.
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
