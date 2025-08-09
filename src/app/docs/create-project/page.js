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

  // Simplified navigation structure
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
              Learn how to launch your project and raise capital through the community using Bitcoin.
            </p>
          </div>

          <div className="docs-body">

          </div>
        </div>
      </main>
    </div>
  );
}
