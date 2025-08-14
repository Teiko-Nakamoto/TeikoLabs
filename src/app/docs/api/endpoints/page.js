'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '../../docs.css';

export default function ApiEndpointsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
    { title: 'Authentication', id: 'authentication' },
    { title: 'Public Endpoints', id: 'public-endpoints' },
    { title: 'Protected Endpoints', id: 'protected-endpoints' },
    { title: 'Admin Endpoints', id: 'admin-endpoints' },
    { title: 'Error Handling', id: 'error-handling' },
    { title: 'Rate Limits', id: 'rate-limits' }
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
            <img src="/logo.png" alt="Teiko Labs Logo" className="docs-logo" />
            <div className="docs-title-section">
              <Link href="/" className="docs-site-name-link">
                <div className="docs-site-name">Teikolabs.com</div>
              </Link>
              <h2 className="docs-sidebar-title">Documentation</h2>
            </div>
          </div>
          
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
            <h1 className="docs-title">API Endpoints</h1>
            <p className="docs-description">
              Complete reference for all API endpoints in the MAS Sats Token Trading Platform. Learn how to authenticate, make requests, and handle responses.
            </p>
          </div>

          <div className="docs-body">
            <section id="introduction" className="docs-section">
              <h2>Introduction</h2>
              <p>
                The MAS Sats API provides programmatic access to all platform features including trading, 
                price data, user management, and administrative functions. All endpoints are RESTful and 
                return JSON responses.
              </p>
              <p>
                <strong>Base URL:</strong> <code>https://your-domain.com/api</code>
              </p>
            </section>

            <section id="authentication" className="docs-section">
              <h2>Authentication</h2>
              <p>
                Most endpoints require authentication using Stacks wallet signatures. Include the following 
                headers in your requests:
              </p>
              
              <pre><code>{`Authorization: Bearer {
  "signature": "wallet_signature_here",
  "publicKey": "public_key_here", 
  "message": "signed_message_here",
  "timestamp": "2024-01-01T00:00:00Z",
  "walletAddress": "ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4"
}`}</code></pre>

              <div className="docs-features-grid">
                <div className="docs-feature-card">
                  <div className="docs-feature-icon">🔐</div>
                  <h3>Wallet Signature</h3>
                  <p>Sign messages with your Stacks wallet for secure authentication.</p>
                </div>
                <div className="docs-feature-card">
                  <div className="docs-feature-icon">⏰</div>
                  <h3>Timestamp Validation</h3>
                  <p>Signatures expire after 24 hours for security.</p>
                </div>
                <div className="docs-feature-card">
                  <div className="docs-feature-icon">👤</div>
                  <h3>Admin Verification</h3>
                  <p>Admin endpoints verify wallet addresses against whitelist.</p>
                </div>
              </div>
            </section>

            <section id="public-endpoints" className="docs-section">
              <h2>Public Endpoints</h2>
              <p>These endpoints are publicly accessible and don&apos;t require authentication:</p>

              <h3>Get Current Price</h3>
              <p>Retrieve the current token price and market data.</p>
              
              <pre><code>{`GET /api/current-price

Response:
{
  "price": 17.08,
  "sbtcBalance": 1000000,
  "tokenBalance": 58500,
  "totalLocked": 5000,
  "lastUpdated": "2024-01-01T12:00:00Z"
}`}</code></pre>

              <h3>Get Token Balance</h3>
              <p>Get the total token balance in the DEX contract.</p>
              
              <pre><code>{`GET /api/total-token-balance

Response:
{
  "balance": 58500,
  "cached": true
}`}</code></pre>

              <h3>Get Liquidity Balance</h3>
              <p>Get the current SBTC liquidity in the DEX contract.</p>
              
              <pre><code>{`GET /api/liquidity-balance

Response:
{
  "balance": 1000000,
  "cached": true
}`}</code></pre>
            </section>

            <section id="protected-endpoints" className="docs-section">
              <h2>Protected Endpoints</h2>
              <p>These endpoints require wallet authentication:</p>

              <h3>Get User Token Balance</h3>
              <p>Get the token balance for a specific wallet address.</p>
              
              <pre><code>{`GET /api/get-user-token-balance?address=ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4

Headers:
Authorization: Bearer {wallet_signature_data}

Response:
{
  "balance": 1000,
  "address": "ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4"
}`}</code></pre>

              <h3>Get Trade History</h3>
              <p>Retrieve trading history for a specific wallet.</p>
              
              <pre><code>{`GET /api/get-trades?address=ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4&limit=50

Headers:
Authorization: Bearer {wallet_signature_data}

Response:
{
  "trades": [
    {
      "id": 1,
      "type": "buy",
      "amount": 100,
      "price": 17.08,
      "timestamp": "2024-01-01T12:00:00Z",
      "tx_id": "0x123..."
    }
  ],
  "total": 150
}`}</code></pre>
            </section>

            <section id="admin-endpoints" className="docs-section">
              <h2>Admin Endpoints</h2>
              <p>These endpoints require admin wallet authentication:</p>

              <h3>CORS Management</h3>
              <p>Manage CORS whitelist for the API.</p>
              
              <pre><code>{`# Get CORS Whitelist
GET /api/get-cors-whitelist

# Add CORS URL
POST /api/add-cors-url
{
  "url": "https://example.com",
  "signature": "wallet_signature",
  "message": "signed_message"
}

# Remove CORS URL
POST /api/remove-cors-url
{
  "id": 1,
  "signature": "wallet_signature", 
  "message": "signed_message"
}`}</code></pre>

              <h3>Rate Limit Management</h3>
              <p>Configure rate limiting rules.</p>
              
              <pre><code>{`# Get Rate Limits
GET /api/get-rate-limits

# Save Rate Limits
POST /api/save-rate-limits
{
  "endpoint": "blockchain",
  "requestsPerMinute": 60,
  "requestsPerHour": 1000,
  "signature": "wallet_signature",
  "message": "signed_message"
}`}</code></pre>
            </section>

            <section id="error-handling" className="docs-section">
              <h2>Error Handling</h2>
              <p>All endpoints return consistent error responses:</p>

              <h3>Error Response Format</h3>
              <pre><code>{`{
  "error": "Error type",
  "message": "Human readable error message",
  "details": "Additional error details (optional)"
}`}</code></pre>

              <h3>Common Error Codes</h3>
              <table>
                <thead>
                  <tr>
                    <th>Status Code</th>
                    <th>Error Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>400</td>
                    <td>Bad Request</td>
                    <td>Invalid request parameters or body</td>
                  </tr>
                  <tr>
                    <td>401</td>
                    <td>Unauthorized</td>
                    <td>Missing or invalid authentication</td>
                  </tr>
                  <tr>
                    <td>403</td>
                    <td>Forbidden</td>
                    <td>Insufficient permissions or CORS blocked</td>
                  </tr>
                  <tr>
                    <td>429</td>
                    <td>Rate Limited</td>
                    <td>Too many requests, try again later</td>
                  </tr>
                  <tr>
                    <td>500</td>
                    <td>Internal Server Error</td>
                    <td>Server error, contact support</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section id="rate-limits" className="docs-section">
              <h2>Rate Limits</h2>
              <p>
                API endpoints are rate limited to prevent abuse and ensure fair usage. 
                Rate limits are applied per IP address and endpoint.
              </p>

              <div className="docs-security-list">
                <div className="docs-security-item">
                  <h4>📊 Public Endpoints</h4>
                  <p>60 requests per minute, 1000 requests per hour</p>
                </div>
                <div className="docs-security-item">
                  <h4>🔒 Protected Endpoints</h4>
                  <p>30 requests per minute, 500 requests per hour</p>
                </div>
                <div className="docs-security-item">
                  <h4>⚡ Admin Endpoints</h4>
                  <p>10 requests per minute, 100 requests per hour</p>
                </div>
              </div>

              <h3>Rate Limit Headers</h3>
              <p>Rate limit information is included in response headers:</p>
              
              <pre><code>{`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
Retry-After: 60`}</code></pre>
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
