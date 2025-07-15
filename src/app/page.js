'use client';
import Link from 'next/link';
import Header from './components/header';
import './globals.css';
import { useState } from 'react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('featured');
  const [sortBy, setSortBy] = useState('revenue');
  const [order, setOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const tokens = [
    { name: 'SATS', revenue: '210000', holders: 420000, liquidity: '100000000' },
    { name: 'ORDI', revenue: '90000', holders: 180000, liquidity: '300000000' },
    { name: 'TEIKO', revenue: '0', holders: 500000, liquidity: '0' },
    { name: 'MAS', revenue: '0', holders: 1000000, liquidity: '0' },
    { name: 'EGOLD', revenue: '0', holders: 300000, liquidity: '0' },
  ];

  const filteredTokens = tokens
    .filter(token =>
      token.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let valA, valB;

      switch (sortBy) {
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'holders':
          valA = a.holders;
          valB = b.holders;
          break;
        case 'revenue':
          valA = parseFloat(a.revenue);
          valB = parseFloat(b.revenue);
          break;
        case 'liquidity':
          valA = parseFloat(a.liquidity);
          valB = parseFloat(b.liquidity);
          break;
        default:
          return 0;
      }

      return order === 'asc' ? valA - valB : valB - valA;
    });

  return (
    <>
      <Header />
      <main className="home-page">
        <div className="page-header-centered">
          <h1>Live Bitcoin Token Market</h1>
          {/* <Link href="/create-token">
            <button className="create-token-btn">Create Token</button>
          </Link> */}
        </div>

        <div className="top-controls">
          {/* Search bar, tabs, sort controls (unchanged) */}
        </div>

        <div className="token-grid">
          {filteredTokens.map((token, idx) => {
            const tokenCard = (
              <div key={idx} className="token-card">
                <div className="token-card-box">
                  <span className="token-symbol">
                    <span className="btc-symbol">₿</span> {token.name}
                  </span>
                </div>

                <div className="token-card-meta">
                  <div className="meta-row holders-row">
                    <div className="label-value-group">
                      <span className="label">Holders:</span>
                      <span className="value holders">{token.holders.toLocaleString()}</span>
                    </div>
                  </div>
                  <p>
                    <span className="label">Current Revenue Locked:</span>{' '}
                    <span className="value sats">{parseInt(token.revenue).toLocaleString()} SATs</span>
                  </p>
                  <p>
                    <span className="label">Current Liquidity Held:</span>{' '}
                    <span className="value sats">{parseInt(token.liquidity).toLocaleString()} SATs</span>
                  </p>
                </div>
              </div>
            );

            return token.name === 'TEIKO' ? (
              <Link href="/trade-token" key={idx} style={{ textDecoration: 'none', color: 'inherit' }}>
                {tokenCard}
              </Link>
            ) : (
              tokenCard
            );
          })}
        </div>
      </main>
    </>
  );
}
