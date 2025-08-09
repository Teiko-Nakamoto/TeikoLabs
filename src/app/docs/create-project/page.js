'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '../docs.css';

export default function CreateProjectPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  // State for funding simulator
  const [fundingInputs, setFundingInputs] = useState({
    fundingGoal: 1000000,
    startingPrice: 0.00010000,
    virtualSbtc: 1500000
  });

  // State for project details
  const [projectDetails, setProjectDetails] = useState({
    name: '',
    initials: ''
  });

  // Calculate funding simulation results
  const calculateFunding = () => {
    const { fundingGoal, startingPrice, virtualSbtc } = fundingInputs;
    
    // Simplified AMM calculation for demonstration
    const totalSupply = 21000000;
    const unitsToSell = Math.min(fundingGoal / (startingPrice * 1000000), totalSupply * 0.8); // Max 80% of supply
    const finalPrice = (fundingGoal + virtualSbtc) / (totalSupply - unitsToSell);
    const remainingSupply = totalSupply - unitsToSell;
    const ownerCost = unitsToSell * startingPrice;
    
    return {
      unitsToSell: Math.round(unitsToSell),
      finalPrice: finalPrice,
      remainingSupply: Math.round(remainingSupply),
      ownerCost: Math.round(ownerCost)
    };
  };

  const results = calculateFunding();

  // Handle input changes
  const handleFundingInputChange = (field, value) => {
    setFundingInputs(prev => ({
      ...prev,
      [field]: Number(value)
    }));
  };

  const handleProjectInputChange = (field, value) => {
    setProjectDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Format numbers
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPrice = (price) => {
    return price.toFixed(8);
  };

  // Navigation structure with subsections
  const navigation = [
    {
      title: 'Documentation',
      items: [
        { title: 'Overview', id: 'overview', href: '/docs' },
        { title: 'How It Works', id: 'how-it-works', href: '/docs/how-it-works' },
        { 
          title: 'Create Project', 
          id: 'create-project', 
          href: '/docs/create-project',
          subItems: pathname === '/docs/create-project' ? [
            { title: 'Project Overview', id: 'overview', href: '#overview' },
            { title: 'Network Selection', id: 'network-selection', href: '#network-selection' },
            { title: 'Funding Calculator', id: 'funding-calculator', href: '#funding-calculator' },
            { title: 'Project Details', id: 'project-details', href: '#project-details' },
            { title: 'Deployment Process', id: 'deployment-process', href: '#deployment-process' }
          ] : undefined
        },
        { title: 'Trading', id: 'trading', href: '/docs/trading' },
        { title: 'Claim Profit', id: 'claim-profit', href: '/docs/claim-profit' },
        { title: 'Fees', id: 'fees', href: '/docs/fees' },
      ]
    }
  ];

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
            <h1 className="docs-title">Create Project</h1>
            <p className="docs-description">
              Launch your project and raise capital through the community using Bitcoin-backed ownership units.
            </p>
          </div>

          <div className="docs-body">
            <section id="overview" className="docs-section">
              <h2>Project Creation Overview</h2>
              <p>
                Creating a project on Teiko Labs involves several key steps to launch your funding campaign 
                on the blockchain. Each project gets <strong>21 million ownership units</strong> that can be 
                sold for funding, with prices determined by our AMM (Automated Market Maker) formula.
              </p>
              

            </section>

            <section id="network-selection" className="docs-section">
              <h2>Step 1: Network Selection</h2>
              <p>
                Choose your deployment network. Testnet is recommended for testing your project parameters 
                before launching on Mainnet with real funds.
              </p>
              
              <div className="network-options">
                <div className="network-card testnet">
                  <div className="network-header">
                    <h3>🧪 Testnet</h3>
                    <span className="network-badge recommended">Recommended for Testing</span>
                  </div>
                  <ul className="network-features">
                    <li>✅ Free to deploy and test</li>
                    <li>✅ Simulate funding scenarios</li>
                    <li>✅ Test all project features</li>
                    <li>✅ No real money at risk</li>
                  </ul>
                  <div className="network-note">
                    Perfect for validating your project parameters and funding strategy before going live.
                  </div>
                </div>
                
                <div className="network-card mainnet">
                  <div className="network-header">
                    <h3>🌐 Mainnet</h3>
                    <span className="network-badge live">Live Deployment</span>
                  </div>
                  <ul className="network-features">
                    <li>💰 Real sBTC transactions</li>
                    <li>📈 Actual project funding</li>
                    <li>🔒 Permanent blockchain deployment</li>
                    <li>👥 Real user participation</li>
                  </ul>
                  <div className="network-note">
                    Deploy here when you're ready to launch your project and raise real funding.
                  </div>
                </div>
              </div>
            </section>

            <section id="funding-calculator" className="docs-section">
              <h2>Step 2: Funding Requirements Calculator</h2>
              <p>
                Use our AMM formula simulator to determine how many ownership units you need to sell 
                at what prices to reach your funding goal. All 21 million units are available for sale, 
                but <strong>you as the project owner must buy them first before selling to raise funds</strong>.
              </p>
              
              <div className="funding-simulator">
                <h3>AMM Funding Simulator</h3>
                <div className="simulator-inputs-grid">
                  <div className="input-group">
                    <label>Funding Goal (sBTC sats)</label>
                    <input
                      type="number"
                      value={fundingInputs.fundingGoal}
                      onChange={(e) => handleFundingInputChange('fundingGoal', e.target.value)}
                      className="simulator-input"
                    />
                    <small>Target amount to raise for your project</small>
                  </div>
                  
                  <div className="input-group">
                    <label>Starting Price (sats/token)</label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={fundingInputs.startingPrice}
                      onChange={(e) => handleFundingInputChange('startingPrice', e.target.value)}
                      className="simulator-input"
                    />
                    <small>Initial price per ownership unit</small>
                  </div>
                  
                  <div className="input-group">
                    <label>Virtual sBTC (sats)</label>
                    <input
                      type="number"
                      value={fundingInputs.virtualSbtc}
                      onChange={(e) => handleFundingInputChange('virtualSbtc', e.target.value)}
                      className="simulator-input"
                    />
                    <small>Virtual liquidity for price stability</small>
                  </div>
                </div>
                
                <div className="calculation-result">
                  <div className="result-header">
                    <h4>📊 Funding Simulation Results</h4>
                  </div>
                  <div className="result-grid">
                    <div className="result-item">
                      <div className="result-label">Units to Sell</div>
                      <div className="result-value">{formatNumber(results.unitsToSell)} units</div>
                    </div>
                    <div className="result-item">
                      <div className="result-label">Final Price</div>
                      <div className="result-value">{formatPrice(results.finalPrice)} sats/token</div>
                    </div>
                    <div className="result-item">
                      <div className="result-label">Remaining Supply</div>
                      <div className="result-value">{formatNumber(results.remainingSupply)} units</div>
                    </div>
                    <div className="result-item">
                      <div className="result-label">Project Owner Cost</div>
                      <div className="result-value">{formatNumber(results.ownerCost)} sats</div>
                    </div>
                  </div>
                  
                  <div className="important-note">
                    <strong>💡 Important:</strong> As the project owner, you must buy the ownership units 
                    first before selling them to raise funds. This ensures you have skin in the game and 
                    demonstrates commitment to your project.
                  </div>
                </div>
              </div>
            </section>

            <section id="project-details" className="docs-section">
              <h2>Step 3: Project Details</h2>
              <p>
                Input your project information that will be permanently stored on the blockchain. 
                Choose your project name and initials carefully as they cannot be changed after deployment.
              </p>
              
              <div className="project-form">
                <div className="form-group">
                  <label>Project Name</label>
                  <input
                    type="text"
                    value={projectDetails.name}
                    onChange={(e) => handleProjectInputChange('name', e.target.value)}
                    placeholder="My Awesome Project"
                    className="form-input"
                    maxLength="50"
                  />
                  <small>Maximum 50 characters. This will be displayed to users.</small>
                </div>
                
                <div className="form-group">
                  <label>Project Initials</label>
                  <input
                    type="text"
                    value={projectDetails.initials}
                    onChange={(e) => handleProjectInputChange('initials', e.target.value.toUpperCase())}
                    placeholder="MAP"
                    className="form-input"
                    maxLength="5"
                    style={{textTransform: 'uppercase'}}
                  />
                  <small>Maximum 5 characters. Used for token identification (e.g., BTC, ETH).</small>
                </div>
                
                <div className="form-preview">
                  <h4>🔍 Preview</h4>
                  <div className="preview-card">
                    <div className="preview-name">
                      {projectDetails.name || 'My Awesome Project'} ({projectDetails.initials || 'MAP'})
                    </div>
                    <div className="preview-supply">
                      Total Supply: 21,000,000 {projectDetails.initials || 'MAP'} units
                    </div>
                    <div className="preview-contract">
                      Contract: Will be generated after deployment
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="deployment-process" className="docs-section">
              <h2>Step 4-6: Deployment Process</h2>
              <p>
                The final steps involve deploying your project contracts to the blockchain. 
                This process happens in sequence and requires blockchain transactions.
              </p>
              
              <div className="deployment-steps">
                <div className="deployment-step">
                  <div className="step-icon">🚀</div>
                  <div className="step-info">
                    <h3>Step 4: Launch Project Contract</h3>
                    <p>
                      Deploy your project permanently on the Stacks blockchain. This creates the 
                      foundational smart contract with your project details and 21M token supply.
                    </p>
                    <div className="step-details">
                      <div className="detail-item">
                        <span className="detail-label">Contract Type:</span>
                        <span className="detail-value">Project Token Contract</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Supply:</span>
                        <span className="detail-value">21,000,000 units (hardcoded)</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Network Cost:</span>
                        <span className="detail-value">STX gas fees only</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="deployment-step">
                  <div className="step-icon">🏦</div>
                  <div className="step-info">
                    <h3>Step 5: Deploy Treasury Contract</h3>
                    <p>
                      Launch the treasury contract that enables users to buy and sell ownership units. 
                      This implements the AMM formula for automatic price discovery and manages trading fees.
                    </p>
                    <div className="step-details">
                      <div className="detail-item">
                        <span className="detail-label">Contract Type:</span>
                        <span className="detail-value">Treasury & Trading Contract</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Features:</span>
                        <span className="detail-value">AMM pricing, fee collection, profit sharing</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Network Cost:</span>
                        <span className="detail-value">STX gas fees only</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="deployment-step">
                  <div className="step-icon">💎</div>
                  <div className="step-info">
                    <h3>Step 6: Mint to DEX</h3>
                    <p>
                      Mint the full supply of 21 million tokens to the decentralized exchange, 
                      making them available for users to purchase and trade using the AMM formula.
                    </p>
                    <div className="step-details">
                      <div className="detail-item">
                        <span className="detail-label">Action:</span>
                        <span className="detail-value">Mint 21M tokens to DEX contract</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Result:</span>
                        <span className="detail-value">Tokens available for public trading</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Network Cost:</span>
                        <span className="detail-value">STX gas fees only</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="important-reminder">
                <h4>🔑 Important Reminders</h4>
                <ul>
                  <li><strong>Network Fees:</strong> All deployments only require STX for gas fees - no platform fees</li>
                  <li><strong>Irreversible:</strong> Once deployed on Mainnet, contracts cannot be modified</li>
                  <li><strong>Owner Responsibilities:</strong> You must buy units before selling to users</li>
                  <li><strong>Treasury Management:</strong> Monitor trading fees and profit distribution</li>
                  <li><strong>Testing First:</strong> Use Testnet to validate all parameters before Mainnet launch</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
