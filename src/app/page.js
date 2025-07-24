'use client';

import Link from 'next/link';
import Header from './components/header';
import './globals.css';
import { useEffect, useState } from 'react';
import {
  getRevenueBalance,
  getLiquidityBalance,
  getTokenSymbol,
} from './utils/fetchTokenData';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('featured');
  const [tokenSymbol, setTokenSymbol] = useState('--');
  const [revenue, setRevenue] = useState('--');
  const [liquidity, setLiquidity] = useState('--');

  useEffect(() => {
    const fetchAll = async () => {
      const symbol = await getTokenSymbol();
      const rev = await getRevenueBalance();
      const liq = await getLiquidityBalance();

      setTokenSymbol(symbol ? symbol.toUpperCase() : '--');
      setRevenue(rev !== null ? rev.toLocaleString() : '--');
      setLiquidity(liq !== null ? liq.toLocaleString() : '--');
    };

    fetchAll();
  }, []);

  const realToken = {
    revenue,
    holders: 500000,
    liquidity,
  };

  const featuredTokens = [realToken, { comingSoon: true }, { comingSoon: true }];
  const allTokens = Array(9).fill({ comingSoon: true });
  const practiceTokens = [realToken];

  let displayedCards = [];
  if (activeTab === 'featured') {
    displayedCards = featuredTokens;
  } else if (activeTab === 'all') {
    displayedCards = allTokens;
  } else if (activeTab === 'practice') {
    displayedCards = practiceTokens;
  }

  return (
    <>
      <Header />
      <main className="home-page">
        <div className="page-header-centered">
          <h1>Live Bitcoin Token Market</h1>
        </div>

        <div className="top-controls">
          <div className="tab-toggle">
            <button className={activeTab === 'featured' ? 'active' : ''} onClick={() => setActiveTab('featured')}>
              Featured
            </button>
            <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>
              All Tokens
            </button>
            <button className={activeTab === 'practice' ? 'active' : ''} onClick={() => setActiveTab('practice')}>
              Practice Trading
            </button>
          </div>
        </div>

        <div className="token-grid">
          {displayedCards.map((token, idx) => {
            if (token.comingSoon) {
              return (
                <div key={`coming-soon-${idx}`} className="token-card coming-soon">
                  <div className="token-card-box">
                    <span className="token-symbol">🚧 Coming Soon</span>
                  </div>
                </div>
              );
            }

            return (
              <Link
                href="/test-page"
                key={`token-${idx}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="token-card">
                  <div className="token-card-box">
                    <span className="token-symbol">
                      <span className="btc-symbol">₿</span> {tokenSymbol}
                    </span>
                  </div>

                  <div className="token-card-meta">
                    <p>
                      <span className="label">Revenue Locked:</span>{' '}
                      <span className="value sats">⚡ {token.revenue} sats</span>
                    </p>
                    <p>
                      <span className="label">Liquidity Held:</span>{' '}
                      <span className="value sats">⚡ {token.liquidity} sats</span>
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
