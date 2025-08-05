'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import Header from './components/header';
import './globals.css';
import { useState, useEffect } from 'react';
import { getRevenueBalance, getLiquidityBalance, getTokenSymbol } from './utils/fetchTokenData';

export default function HomePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('featured');
  const [defaultTab, setDefaultTab] = useState('featured');
  const [tokenCards, setTokenCards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for real-time token data
  const [tokenData, setTokenData] = useState({});

  // Function to fetch real-time data for a specific token
  const fetchTokenRealTimeData = async (tokenCard) => {
    if (!tokenCard.dexInfo || !tokenCard.tokenInfo) return;
    
    try {
      // Parse contract addresses
      const dexParts = tokenCard.dexInfo.split('.');
      const tokenParts = tokenCard.tokenInfo.split('.');
      
      if (dexParts.length !== 2 || tokenParts.length !== 2) return;
      
      const dexAddress = dexParts[0];
      const dexName = dexParts[1];
      const tokenAddress = tokenParts[0];
      const tokenName = tokenParts[1];
      
      // Import blockchain functions
      const { fetchCallReadOnlyFunction } = await import('@stacks/transactions');
      const { STACKS_TESTNET, STACKS_MAINNET } = await import('@stacks/network');
      
      // Determine network based on tab type
      const network = tokenCard.tabType === 'practice' ? STACKS_TESTNET : STACKS_MAINNET;
      
      // Fetch symbol (if not already cached)
      let symbol = tokenCard.symbol || '';
      if (!symbol) {
        try {
          const symbolResult = await fetchCallReadOnlyFunction({
            contractAddress: dexAddress,
            contractName: tokenName,
            functionName: 'get-symbol',
            functionArgs: [],
            network: network,
            senderAddress: dexAddress,
          });
          
          const symbolValue = symbolResult?.value?.value;
          symbol = typeof symbolValue === 'string' ? symbolValue.toLowerCase() : '';
        } catch (error) {
          console.log('Symbol fetch failed:', error.message);
        }
      }
      
      // Fetch revenue
      let revenue = 0;
      const revenueFunctions = ['get-sbtc-fee-pool', 'get-fee-pool', 'get-revenue', 'get-total-fees', 'get-sbtc-balance'];
      
      for (const funcName of revenueFunctions) {
        try {
          const revenueResult = await fetchCallReadOnlyFunction({
            contractAddress: dexAddress,
            contractName: dexName,
            functionName: funcName,
            functionArgs: [],
            network: network,
            senderAddress: dexAddress,
          });
          
          const rawValue = revenueResult?.value?.value || revenueResult?.value || null;
          if (rawValue) {
            const satsValue = typeof rawValue === 'string' ? parseInt(rawValue) : Number(rawValue);
            if (satsValue > 0) {
              revenue = satsValue;
              break;
            }
          }
        } catch (error) {
          console.log(`Revenue function ${funcName} failed:`, error.message);
        }
      }
      
      // Fetch liquidity
      let liquidity = 0;
      const liquidityFunctions = ['get-sbtc-balance', 'get-liquidity', 'get-total-liquidity', 'get-sats-liquidity'];
      
      for (const funcName of liquidityFunctions) {
        try {
          const liquidityResult = await fetchCallReadOnlyFunction({
            contractAddress: dexAddress,
            contractName: dexName,
            functionName: funcName,
            functionArgs: [],
            network: network,
            senderAddress: dexAddress,
          });
          
          const rawValue = liquidityResult?.value?.value || liquidityResult?.value || null;
          if (rawValue) {
            const satsValue = typeof rawValue === 'string' ? parseInt(rawValue) : Number(rawValue);
            if (satsValue > 0) {
              liquidity = satsValue;
              break;
            }
          }
        } catch (error) {
          console.log(`Liquidity function ${funcName} failed:`, error.message);
        }
      }
      
      // Update token data
      setTokenData(prev => ({
        ...prev,
        [tokenCard.id]: { symbol, revenue, liquidity }
      }));
      
    } catch (error) {
      console.error('Error fetching real-time data for token:', tokenCard.id, error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      console.log('🔄 Loading admin-configured token data...');
      
      // Load token cards and default tab from database (admin-configured)
      try {
        const response = await fetch('/api/get-token-cards');
        const result = await response.json();
        
        if (result.tokenCards && result.tokenCards.length > 0) {
          console.log('📋 Loaded admin-configured token cards:', result.tokenCards);
          setTokenCards(result.tokenCards);
          
          // Fetch real-time data for each token
          result.tokenCards.forEach(tokenCard => {
            if (!tokenCard.isComingSoon) {
              fetchTokenRealTimeData(tokenCard);
            }
          });
        } else {
          console.log('📋 No admin-configured token cards found, using empty array');
          setTokenCards([]);
        }

        // Load default tab setting
        if (result.defaultTab) {
          console.log('📋 Loaded default tab from admin settings:', result.defaultTab);
          setDefaultTab(result.defaultTab);
          setActiveTab(result.defaultTab);
        }
      } catch (error) {
        console.error('❌ Error loading admin-configured token cards:', error);
        setTokenCards([]);
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <main className="home-page">
          <div style={{ textAlign: 'center', padding: '3rem', color: 'white' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #374151', 
              borderTop: '4px solid #fbbf24', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite', 
              margin: '0 auto 1rem' 
            }}></div>
            <p>Loading...</p>
          </div>
        </main>
      </>
    );
  }

  // Filter token cards based on active tab
  let displayedCards = [];
  if (activeTab === 'featured') {
    // Featured tab: Show cards assigned to featured tab
    displayedCards = tokenCards.filter(card => card.tabType === 'featured');
    console.log('📋 Featured tab - Admin-configured cards:', displayedCards.length);
  } else if (activeTab === 'practice') {
    // Practice trading tab: Show cards assigned to practice tab
    displayedCards = tokenCards.filter(card => card.tabType === 'practice');
    console.log('📋 Practice tab - Admin-configured cards:', displayedCards.length);
  }
  
  console.log('📋 Current active tab:', activeTab);
  console.log('📋 All admin-configured token cards:', tokenCards.map(card => ({ 
    id: card.id, 
    tabType: card.tabType,
    symbol: card.symbol,
    revenue: card.revenue,
    isComingSoon: card.isComingSoon 
  })));
  console.log('📋 Displayed cards:', displayedCards.map(card => ({ 
    id: card.id, 
    symbol: card.symbol,
    revenue: card.revenue,
    isComingSoon: card.isComingSoon 
  })));

  return (
    <>
      <Header />
      <main className="home-page">
        <div className="page-header-centered">
          <h1 style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '12px',
            color: '#fbbf24',
            fontWeight: 'bold',
            fontSize: '2rem',
            fontFamily: 'Arial, sans-serif'
          }}>
            <img 
              src="/icons/The Mas Network.svg" 
              alt="MAS Sats" 
              style={{ 
                width: '60px', 
                height: '60px'
              }} 
            />
            <span style={{ color: '#fbbf24' }}>Trade on Bitcoin Layer 3</span>
          </h1>
        </div>

        <div className="top-controls">
          <div className="tab-toggle">
            <button className={activeTab === 'featured' ? 'active' : ''} onClick={() => setActiveTab('featured')}>
              {t('featured')}
            </button>
            <button className={activeTab === 'practice' ? 'active' : ''} onClick={() => setActiveTab('practice')}>
              {t('practice_trading')}
            </button>
          </div>
        </div>

        <div className="token-grid">
          {displayedCards.map((card) => {
            if (card.isComingSoon) {
              return (
                <div key={`coming-soon-${card.id}`} className="token-card coming-soon">
                  <div className="token-card-box">
                    <span className="token-symbol">🚧 {t('coming_soon')}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={`token-${card.id}`} className="token-card-wrapper">
                <Link
                  href={card.id === 1 ? "/test-page" : `/trade/${card.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="token-card">
                    <div className="token-card-box">
                      <span className="token-symbol">
                        <span className="btc-symbol">₿</span> {tokenData[card.id]?.symbol || card.symbol || '--'}
                      </span>
                    </div>

                    <div className="token-card-meta">
                      <p>
                        <span className="label">{t('revenue_locked')}:</span>{' '}
                        <span className="value sats">
                          <img src="/icons/sats1.svg" alt="sats" style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '2px' }} />
                          <img src="/icons/Vector.svg" alt="lightning" style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '4px' }} />
                          {tokenData[card.id]?.revenue ? `${tokenData[card.id].revenue.toLocaleString()} sats` : '--'}
                        </span>
                      </p>
                      <p>
                        <span className="label">{t('liquidity_held')}:</span>{' '}
                        <span className="value sats">
                          <img src="/icons/sats1.svg" alt="sats" style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '2px' }} />
                          <img src="/icons/Vector.svg" alt="lightning" style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '4px' }} />
                          {tokenData[card.id]?.liquidity ? `${tokenData[card.id].liquidity.toLocaleString()} sats` : '--'}
                        </span>
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Button to Get Fake Bitcoin - Only for first card */}
                {card.id === 1 && (
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
                )}
              </div>
            );
          })}
          
          {/* Show message if no tokens are configured for this tab */}
          {displayedCards.length === 0 && (
            <div className="empty-state" style={{ 
              textAlign: 'center', 
              padding: '2rem', 
              color: '#9CA3AF',
              gridColumn: '1 / -1'
            }}>
              <p>No tokens configured for {activeTab === 'featured' ? 'Featured' : 'Practice Trading'} tab</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Admin can add tokens in the admin panel
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
