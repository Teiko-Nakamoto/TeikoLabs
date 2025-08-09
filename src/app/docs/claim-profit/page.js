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
        { title: 'How It Works', id: 'how-it-works', href: '/docs/how-it-works' },
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
            <section className="docs-section">
              <div className="coming-soon-container">
                <div className="coming-soon-icon">🚧</div>
                <h2>Information Coming Soon</h2>
                <p>
                  We're currently working on comprehensive documentation for the profit claiming process. 
                  This section will include detailed instructions on how to withdraw your earnings, 
                  understand your profit calculations, and manage your rewards.
                </p>
                <p>
                  Check back soon for complete guidance on maximizing and claiming your trading profits!
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
