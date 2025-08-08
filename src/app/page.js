'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import Header from './components/header';
import Footer from './components/footer';
import BackgroundImage from './components/BackgroundImage';
import './globals.css';
import './components/footer.css';
import { useState, useEffect } from 'react';
import { getRevenueBalance, getLiquidityBalance, getTokenSymbol } from './utils/fetchTokenData';

export default function HomePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('featured');
  const [defaultTab, setDefaultTab] = useState('featured');
  const [tokenCards, setTokenCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProjects, setShowProjects] = useState(false);
  
  // State for real-time token data
  const [tokenData, setTokenData] = useState({});
  
  // State for wallet connection
  const [connectedAddress, setConnectedAddress] = useState('');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  // Check wallet connection on component mount and when storage changes
  useEffect(() => {
    const checkWalletConnection = () => {
      const savedAddress = localStorage.getItem('connectedAddress');
      setConnectedAddress(savedAddress || '');
      
      // Hide loading state when wallet connects
      if (savedAddress && isConnectingWallet) {
        setIsConnectingWallet(false);
      }
    };

    checkWalletConnection();

    // Listen for storage changes (when wallet connects/disconnects)
    const handleStorageChange = (e) => {
      if (e.key === 'connectedAddress') {
        checkWalletConnection();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isConnectingWallet]);

  // Function to handle token card click
  const handleTokenCardClick = (tokenCard) => {
    if (!connectedAddress) {
      // Show loading state
      setIsConnectingWallet(true);
      // Trigger wallet connection directly (same as header button)
      const connectEvent = new CustomEvent('connectWallet');
      window.dispatchEvent(connectEvent);
      return;
    }
    
    // Navigate to swap page using token symbol if available, otherwise fall back to ID
    if (tokenCard.symbol && tokenCard.symbol.trim() !== '') {
      window.location.href = `/${tokenCard.symbol.toLowerCase()}/swap`;
    } else {
      // Fallback to old trade route with ID if no symbol
      window.location.href = `/trade/${tokenCard.id}`;
    }
  };

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
        [tokenCard.id]: {
          symbol,
          revenue,
          liquidity
        }
      }));
      
    } catch (error) {
      console.error('Error fetching token real-time data:', error);
    }
  };

  const fetchData = async () => {
    try {
      const response = await fetch('/api/get-token-cards');
      if (!response.ok) {
        throw new Error('Failed to fetch token cards');
      }
      const result = await response.json();
      
      // Handle the API response structure
      if (result.tokenCards && Array.isArray(result.tokenCards)) {
        setTokenCards(result.tokenCards);
        
        // Set default tab if provided
        if (result.defaultTab) {
          setDefaultTab(result.defaultTab);
          setActiveTab(result.defaultTab);
        }
        
        // Fetch real-time data for each token
        result.tokenCards.forEach(tokenCard => {
          if (!tokenCard.isComingSoon) {
            fetchTokenRealTimeData(tokenCard);
          }
        });
      } else {
        console.error('Invalid token cards data:', result);
        setTokenCards([]);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setTokenCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Filter token cards based on active tab (exclude hidden tokens)
  let displayedCards = [];
  
  // Ensure tokenCards is always an array
  const safeTokenCards = Array.isArray(tokenCards) ? tokenCards : [];
  
  if (activeTab === 'featured') {
    // Featured tab: Show cards assigned to featured tab (not hidden)
    displayedCards = safeTokenCards.filter(card => card.tabType === 'featured' && !card.isHidden);
    console.log('📋 Featured tab - Admin-configured cards:', displayedCards.length);
  } else if (activeTab === 'practice') {
    // Practice trading tab: Show cards assigned to practice tab (not hidden)
    displayedCards = safeTokenCards.filter(card => card.tabType === 'practice' && !card.isHidden);
    console.log('📋 Practice tab - Admin-configured cards:', displayedCards.length);
  }
  
  console.log('📋 Current active tab:', activeTab);
  console.log('📋 All admin-configured token cards:', safeTokenCards.map(card => ({ 
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
  
  // Debug info for user (temporary)
  console.log('🔍 DEBUG INFO:');
  console.log(`   Active Tab: ${activeTab}`);
  console.log(`   Total Cards: ${safeTokenCards.length}`);
  console.log(`   Featured Cards: ${safeTokenCards.filter(card => card.tabType === 'featured' && !card.isHidden).length}`);
  console.log(`   Practice Cards: ${safeTokenCards.filter(card => card.tabType === 'practice' && !card.isHidden).length}`);
  console.log(`   Displayed Cards: ${displayedCards.length}`);
  console.log(`   Coming Soon Cards: ${displayedCards.filter(card => card.isComingSoon).length}`);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <BackgroundImage />
        <Header />
        <main className="home-page" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
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
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <BackgroundImage />
      <Header />
      <main className="home-page" style={{ flex: 1 }}>
                {!showProjects && (
          <div className="page-header-centered">
            <h1 style={{ 
              textAlign: 'center',
              color: '#fbbf24',
              fontWeight: 'bold',
              fontSize: '2rem',
              fontFamily: 'Arial, sans-serif',
              marginBottom: '8px'
            }}>
              The Future of Bitcoin DeFi
            </h1>
            
            <p style={{
              textAlign: 'center',
              color: '#fbbf24',
              fontSize: '1.1rem',
              marginBottom: '8px',
              fontFamily: 'Arial, sans-serif'
            }}>
              Earn Trading Fees From Supporting Projects
            </p>
            
            <div style={{
              textAlign: 'center',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <span style={{
                color: '#fbbf24',
                fontSize: '0.9rem',
                fontFamily: 'Arial, sans-serif'
              }}>
                Powered By
              </span>
              <img 
                src="/icons/mas-network-logo.png" 
                alt="MAS Network" 
                style={{ 
                  height: '40px',
                  width: 'auto'
                }} 
              />
            </div>
          </div>
        )}
        
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => {
              window.location.href = '/create-project';
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              backgroundColor: '#3b82f6',
              color: '#fbbf24',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 28px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#2563eb';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 12px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#3b82f6';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.3)';
            }}
          >
            Create Project
          </button>
          
          <button
            onClick={() => {
              setShowProjects(!showProjects);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              backgroundColor: 'transparent',
              color: '#fbbf24',
              border: '2px solid #fbbf24',
              borderRadius: '12px',
              padding: '16px 28px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#fbbf24';
              e.target.style.color = '#1e3a8a';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#fbbf24';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            {showProjects ? 'Hide Projects' : 'View Projects'}
          </button>
        </div>

        {showProjects && (
          <>
            <div className="top-controls">
              <div className="tab-toggle">
                <button className={activeTab === 'featured' ? 'active' : ''} onClick={() => setActiveTab('featured')}>
                  🚀 {t('featured')} (Mainnet)
                </button>
                <button className={activeTab === 'practice' ? 'active' : ''} onClick={() => setActiveTab('practice')}>
                  🧪 {t('practice_trading')} (Testnet)
                </button>
              </div>
              
              {/* Tab description */}
              <div style={{ 
                textAlign: 'center', 
                marginTop: '10px', 
                color: '#9CA3AF',
                fontSize: '0.9rem'
              }}>
                {activeTab === 'featured' ? (
                  <span>🚀 <strong>Mainnet:</strong> Real Projects With Real Profit</span>
                ) : (
                  <span>🧪 <strong>Testnet:</strong> Practice With Fake Money</span>
                )}
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
                <div
                  onClick={() => handleTokenCardClick(card)}
                  style={{ 
                    textDecoration: 'none', 
                    color: 'inherit',
                    cursor: isConnectingWallet ? 'wait' : 'pointer',
                    transition: 'transform 0.2s ease',
                    opacity: isConnectingWallet ? 0.7 : 1,
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isConnectingWallet) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Loading overlay */}
                  {isConnectingWallet && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0, 0, 0, 0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '12px',
                      zIndex: 10
                    }}>
                      <div style={{
                        textAlign: 'center',
                        color: '#fbbf24'
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          border: '2px solid #fbbf24',
                          borderTop: '2px solid transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          margin: '0 auto 8px'
                        }}></div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                          Connecting Wallet...
                        </div>
                      </div>
                    </div>
                  )}
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
                </div>

                {/* Button to Get Fake Bitcoin - Only for practice trading cards */}
                {activeTab === 'practice' && (
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
              <p>
                {activeTab === 'featured' ? (
                  <>🚀 <strong>Mainnet tokens coming soon!</strong><br />
                  Real tokens with real value will be available here.</>
                ) : (
                  <>🧪 <strong>Testnet tokens coming soon!</strong><br />
                  Practice tokens will be available here.</>
                )}
              </p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Admin can configure tokens in the admin panel
              </p>
            </div>
          )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}