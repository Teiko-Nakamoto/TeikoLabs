'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './docs.css';

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const pathname = usePathname();

  // GitBook-style navigation structure
  const navigation = [
    {
      title: 'Getting Started',
      items: [
        { title: 'Overview', id: 'overview', href: '/docs' },
        { title: 'Quick Start', id: 'quick-start', href: '/docs/quick-start' },
        { title: 'Installation', id: 'installation', href: '/docs/installation' },
      ]
    },
    {
      title: 'API Reference',
      items: [
        { title: 'Authentication', id: 'authentication', href: '/docs/api/authentication' },
        { title: 'Endpoints', id: 'endpoints', href: '/docs/api/endpoints' },
        { title: 'Rate Limiting', id: 'rate-limiting', href: '/docs/api/rate-limiting' },
        { title: 'CORS Management', id: 'cors-management', href: '/docs/api/cors-management' },
      ]
    },
    {
      title: 'Security',
      items: [
        { title: 'Security Overview', id: 'security-overview', href: '/docs/security/overview' },
        { title: 'Wallet Authentication', id: 'wallet-auth', href: '/docs/security/wallet-auth' },
        { title: 'CORS Protection', id: 'cors-protection', href: '/docs/security/cors-protection' },
        { title: 'Rate Limiting', id: 'rate-limit-security', href: '/docs/security/rate-limiting' },
      ]
    },
    {
      title: 'User Guide',
      items: [
        { title: 'Trading Tokens', id: 'trading', href: '/docs/user-guide/trading' },
        { title: 'Managing Positions', id: 'positions', href: '/docs/user-guide/positions' },
        { title: 'Profit & Loss', id: 'pnl', href: '/docs/user-guide/pnl' },
        { title: 'Locking/Unlocking', id: 'locking', href: '/docs/user-guide/locking' },
      ]
    },
    {
      title: 'Admin Panel',
      items: [
        { title: 'API Management', id: 'api-management', href: '/docs/admin/api-management' },
        { title: 'CORS Management', id: 'admin-cors', href: '/docs/admin/cors-management' },
        { title: 'Rate Limit Settings', id: 'rate-settings', href: '/docs/admin/rate-settings' },
      ]
    }
  ];

  // Filter navigation based on search
  const filteredNavigation = navigation.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  // Table of contents for current page
  const tableOfContents = [
    { title: 'Introduction', id: 'introduction' },
    { title: 'Key Features', id: 'key-features' },
    { title: 'Architecture', id: 'architecture' },
    { title: 'Security Features', id: 'security-features' },
    { title: 'Getting Started', id: 'getting-started' },
    { title: 'Next Steps', id: 'next-steps' }
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
          <h2 className="docs-sidebar-title">Documentation</h2>
          
          {/* Search */}
          <div className="docs-search">
            <div className="docs-search-input-wrapper">
              <svg className="docs-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="docs-search-input"
              />
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
            <h1 className="docs-title">Overview</h1>
            <p className="docs-description">
              Welcome to the MAS Sats Token Trading Platform documentation. This comprehensive guide covers everything you need to know about our secure, decentralized trading system.
            </p>
          </div>

          <div className="docs-body">
            <section id="introduction" className="docs-section">
              <h2>Introduction</h2>
              <p>
                The MAS Sats Token Trading Platform is a secure, decentralized exchange built on the Stacks blockchain. 
                It provides users with a seamless way to trade MAS Sats tokens while maintaining the highest security standards.
              </p>
              <p>
                Our platform features advanced security measures including wallet-based authentication, 
                dynamic CORS management, rate limiting, and comprehensive audit trails.
              </p>
            </section>

            <section id="key-features" className="docs-section">
              <h2>Key Features</h2>
              <div className="docs-features-grid">
                <div className="docs-feature-card">
                  <div className="docs-feature-icon">🔒</div>
                  <h3>Wallet Authentication</h3>
                  <p>Secure authentication using Stacks wallet signatures for all admin operations.</p>
                </div>
                <div className="docs-feature-card">
                  <div className="docs-feature-icon">🌐</div>
                  <h3>Dynamic CORS Management</h3>
                  <p>Flexible CORS policy management with database-backed whitelist and signature verification.</p>
                </div>
                <div className="docs-feature-card">
                  <div className="docs-feature-icon">⚡</div>
                  <h3>Rate Limiting</h3>
                  <p>Advanced rate limiting with configurable rules and real-time monitoring.</p>
                </div>
                <div className="docs-feature-card">
                  <div className="docs-feature-icon">📊</div>
                  <h3>Real-time Trading</h3>
                  <p>Live price updates and instant trade execution with slippage protection.</p>
                </div>
              </div>
            </section>

            <section id="architecture" className="docs-section">
              <h2>Architecture</h2>
              <p>
                Our platform is built with a modern, scalable architecture:
              </p>
              <ul>
                <li><strong>Frontend:</strong> Next.js with React for a responsive, modern UI</li>
                <li><strong>Backend:</strong> Next.js API routes with server-side rendering</li>
                <li><strong>Database:</strong> Supabase for data persistence and real-time features</li>
                <li><strong>Blockchain:</strong> Stacks blockchain integration for secure transactions</li>
                <li><strong>Security:</strong> Multi-layered security with wallet signatures and CORS protection</li>
              </ul>
            </section>

            <section id="security-features" className="docs-section">
              <h2>Security Features</h2>
              <div className="docs-security-list">
                <div className="docs-security-item">
                  <h4>🔐 Wallet Signature Verification</h4>
                  <p>All admin operations require valid wallet signatures with timestamp validation.</p>
                </div>
                <div className="docs-security-item">
                  <h4>🛡️ Dynamic CORS Management</h4>
                  <p>Database-backed CORS whitelist with signature-verified URL additions.</p>
                </div>
                <div className="docs-security-item">
                  <h4>⚡ Rate Limiting</h4>
                  <p>Configurable rate limits with IP-based tracking and automatic blocking.</p>
                </div>
                <div className="docs-security-item">
                  <h4>📝 Audit Trails</h4>
                  <p>Comprehensive logging of all admin actions and security events.</p>
                </div>
              </div>
            </section>

            <section id="getting-started" className="docs-section">
              <h2>Getting Started</h2>
              <p>
                To get started with the platform:
              </p>
              <ol>
                <li>Connect your Stacks wallet to the platform</li>
                <li>Ensure you have sufficient SBTC for trading</li>
                <li>Review the current token price and market conditions</li>
                <li>Place your first trade using the buy/sell interface</li>
                <li>Monitor your positions and profit/loss in real-time</li>
              </ol>
            </section>

            <section id="next-steps" className="docs-section">
              <h2>Next Steps</h2>
              <p>
                Now that you understand the basics, explore these areas:
              </p>
              <div className="docs-next-steps">
                <Link href="/docs/user-guide/trading" className="docs-next-step-card">
                  <h3>📈 Trading Guide</h3>
                  <p>Learn how to buy and sell tokens effectively</p>
                </Link>
                <Link href="/docs/api/endpoints" className="docs-next-step-card">
                  <h3>🔌 API Reference</h3>
                  <p>Explore our comprehensive API documentation</p>
                </Link>
                <Link href="/docs/security/overview" className="docs-next-step-card">
                  <h3>🛡️ Security Guide</h3>
                  <p>Understand our security measures and best practices</p>
                </Link>
              </div>
            </section>
          </div>
        </div>

        {/* Table of Contents */}
        <aside className="docs-toc">
          <div className="docs-toc-header">
            <h3>On this page</h3>
          </div>
          <nav className="docs-toc-nav">
            <ul className="docs-toc-list">
              {tableOfContents.map((item, index) => (
                <li key={index} className="docs-toc-item">
                  <a 
                    href={`#${item.id}`}
                    className="docs-toc-link"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(item.id).scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </main>
    </div>
  );
}
