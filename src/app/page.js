'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import Header from './components/header';
import './globals.css';
import { useEffect, useState } from 'react';
import {
  getRevenueBalance,
  getLiquidityBalance,
  getTokenSymbol,
} from './utils/fetchTokenData';

export default function HomePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('featured');
  const [tokenSymbol, setTokenSymbol] = useState('--');
  const [revenue, setRevenue] = useState('--');
  const [liquidity, setLiquidity] = useState('--');

  useEffect(() => {
    const fetchAll = async () => {
      console.log('🔄 Fetching fresh data...');
      const symbol = await getTokenSymbol();
      const rev = await getRevenueBalance();
      const liq = await getLiquidityBalance();

      console.log('📊 Final display values:', { 
        symbol, 
        revenue: rev, 
        liquidity: liq,
        revenueFormatted: rev !== null ? rev.toLocaleString() : '--',
        liquidityFormatted: liq !== null ? liq.toLocaleString() : '--'
      });

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

  // Only 1 "Coming Soon" token in the featured section
  const featuredTokens = [realToken, { comingSoon: true }];
  const practiceTokens = [realToken];

  let displayedCards = [];
  if (activeTab === 'featured') {
    displayedCards = featuredTokens;
  } else if (activeTab === 'practice') {
    displayedCards = practiceTokens;
  }

  return (
    <>
      <Header />
      <main className="home-page">
        <div className="page-header-centered">
          <h1>{t('live_bitcoin_token_market')}</h1>
        </div>

        <div className="top-controls">
          <div className="tab-toggle">
            <button className={activeTab === 'featured' ? 'active' : ''} onClick={() => setActiveTab('featured')}>
              {t('featured')}
            </button>
            {/* Removed the "All Tokens" button */}
            <button className={activeTab === 'practice' ? 'active' : ''} onClick={() => setActiveTab('practice')}>
              {t('practice_trading')}
            </button>
          </div>
        </div>

        <div className="token-grid">
          {displayedCards.map((token, idx) => {
            if (token.comingSoon) {
              return (
                <div key={`coming-soon-${idx}`} className="token-card coming-soon">
                  <div className="token-card-box">
                    <span className="token-symbol">🚧 {t('coming_soon')}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={`token-${idx}`} className="token-card-wrapper">
                <Link
                  href="/test-page"
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
                        <span className="label">{t('revenue_locked')}:</span>{' '}
                        <span className="value sats">
                          <img 
                            src="/icons/sats1.svg" 
                            alt="sats" 
                            style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '2px' }}
                          />
                          <img 
                            src="/icons/Vector.svg" 
                            alt="lightning" 
                            style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '4px' }}
                          />
                          {token.revenue}
                        </span>
                      </p>
                      <p>
                        <span className="label">{t('liquidity_held')}:</span>{' '}
                        <span className="value sats">
                          <img 
                            src="/icons/sats1.svg" 
                            alt="sats" 
                            style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '2px' }}
                          />
                          <img 
                            src="/icons/Vector.svg" 
                            alt="lightning" 
                            style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '4px' }}
                          />
                          {token.liquidity}
                        </span>
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Button to Get Fake Bitcoin */}
                <div style={{ marginTop: '20px' }}>
                  <a
                    href="https://platform.hiro.so/faucet"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      padding: '10px 20px',
                      borderRadius: '5px',
                      textDecoration: 'none',
                      fontSize: '16px',
                      textAlign: 'center',
                    }}
                  >
                    {t('get_free_fake_bitcoin')}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
