'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import Header from './header';
import Footer from './footer';
import BackgroundImage from './BackgroundImage';
import '../globals.css';
import './footer.css';
import { useState, useEffect } from 'react';
import { getRevenueBalance, getLiquidityBalance, getTokenSymbol } from '../utils/fetchTokenData';

export default function ClientHomePage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('all'); // Changed from 'featured' to 'all'
  const [defaultTab, setDefaultTab] = useState('all'); // Changed from 'featured' to 'all'
  const [tokenCards, setTokenCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProjects, setShowProjects] = useState(false);
  
  // State for real-time token data
  const [tokenData, setTokenData] = useState({});
  
  // State for wallet connection
  const [connectedAddress, setConnectedAddress] = useState('');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  // State for All Projects tab
  const [searchTerm, setSearchTerm] = useState('');
  const [networkFilter, setNetworkFilter] = useState('all'); // 'all', 'testnet', 'mainnet'
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showComingSoonPopup, setShowComingSoonPopup] = useState(false);
  const [accessSettings, setAccessSettings] = useState({
    createProject: true,
    lockUnlock: true,
    claimRevenue: true
  });

  // Load access settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessSettings');
    if (savedSettings) {
      setAccessSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Handle tab parameter from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['featured', 'practice', 'all'].includes(tabParam)) {
      setActiveTab(tabParam);
      if (tabParam === 'all') {
        setShowProjects(true);
      }
    }
  }, [searchParams]);

  // Reset search and filter when switching away from All Projects tab
  useEffect(() => {
    if (activeTab !== 'all') {
      setSearchTerm('');
      setNetworkFilter('all');
      setShowSearchBar(false);
    }
  }, [activeTab]);

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
      const isTestnet = tokenCard.tabType === 'practice' || tokenCard.tabType === 'user_created_testnet';
      const network = isTestnet ? STACKS_TESTNET : STACKS_MAINNET;
      
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

  // Filter tokens based on search term and network filter - ONLY for user-created projects in "All Projects" tab
  const filteredTokens = tokenCards.filter(card => {
    // Only show user-created projects in "All Projects" tab
    const isUserCreatedMainnet = card.tabType === 'user_created_mainnet';
    const isUserCreatedTestnet = card.tabType === 'user_created_testnet';
    const isUserCreatedProject = isUserCreatedMainnet || isUserCreatedTestnet;
    
    // First filter: must be a user-created project
    if (!isUserCreatedProject) {
      return false;
    }
    
    // Filter by network within user-created projects
    let networkMatch = true;
    if (networkFilter === 'testnet') {
      networkMatch = isUserCreatedTestnet;
    } else if (networkFilter === 'mainnet') {
      networkMatch = isUserCreatedMainnet;
    } else if (networkFilter === 'user_created_mainnet') {
      networkMatch = isUserCreatedMainnet;
    } else if (networkFilter === 'user_created_testnet') {
      networkMatch = isUserCreatedTestnet;
    }
    // For 'all' network filter, show all user-created projects
    
    // Filter by search term
    const searchMatch = !searchTerm || 
      card.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return networkMatch && searchMatch;
  });

  // Get displayed cards based on active tab
  const displayedCards = (() => {
    if (activeTab === 'featured') {
      return tokenCards.filter(card => card.tabType === 'featured');
    } else if (activeTab === 'practice') {
      return tokenCards.filter(card => card.tabType === 'practice');
    } else if (activeTab === 'all') {
      return filteredTokens;
    }
    return tokenCards.filter(card => card.tabType === 'featured');
  })();

  const handleWalletConnect = (address) => {
    setConnectedAddress(address);
    setIsConnectingWallet(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <BackgroundImage />
        <Header 
          connectedAddress={connectedAddress}
          onWalletConnect={handleWalletConnect}
          isConnectingWallet={isConnectingWallet}
          setIsConnectingWallet={setIsConnectingWallet}
        />
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
      <Header 
        connectedAddress={connectedAddress}
        onWalletConnect={handleWalletConnect}
        isConnectingWallet={isConnectingWallet}
        setIsConnectingWallet={setIsConnectingWallet}
      />
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
              Bitcoin Powered Crowdfunding, Where Every Project Generates Profit on Every Trade.
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
              <a 
                href="https://themasnetwork.com" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'inline-block' }}
              >
                <img 
                  src="/icons/mas-network-logo.png" 
                  alt="MAS Network" 
                  style={{ 
                    height: '40px',
                    width: 'auto',
                    cursor: 'pointer',
                    transition: 'filter 0.3s ease, transform 0.2s ease',
                    filter: 'brightness(1)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.filter = 'brightness(1.2) drop-shadow(0 0 8px #fca311)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.filter = 'brightness(1)';
                    e.target.style.transform = 'scale(1)';
                  }}
                  onMouseDown={(e) => {
                    e.target.style.filter = 'brightness(1.3) drop-shadow(0 0 12px #ffb347)';
                    e.target.style.transform = 'scale(0.98)';
                  }}
                  onMouseUp={(e) => {
                    e.target.style.filter = 'brightness(1.2) drop-shadow(0 0 8px #fca311)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                />
              </a>
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
              if (accessSettings.createProject) {
                setShowComingSoonPopup(true);
              } else {
                window.location.href = '/create-project';
              }
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
                <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>
                  🔍 All Projects
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
                ) : activeTab === 'practice' ? (
                  <span>🧪 <strong>Testnet:</strong> Practice With Fake Money</span>
                ) : (
                  <span>🔍 <strong>All Projects:</strong> Search and Filter All Available Projects</span>
                )}
              </div>

              {/* Search and Filter Controls for All Projects tab */}
              {activeTab === 'all' && (
                <div className="all-tokens-controls">
                  {/* Search Bar */}
                  <div className="search-container">
                    <input
                      type="text"
                      placeholder="Search projects by name, symbol, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                    <span className="search-icon">🔍</span>
                  </div>

                  {/* Network Filter */}
                  <div className="network-filter-container">
                    <span className="network-filter-label">Network:</span>
                    <select
                      value={networkFilter}
                      onChange={(e) => setNetworkFilter(e.target.value)}
                      className="network-filter-select"
                    >
                      <option value="all">All Networks</option>
                      <option value="user_created_mainnet">Mainnet</option>
                      <option value="user_created_testnet">Testnet</option>
                    </select>
                  </div>

                  {/* Results Count */}
                  <div className="results-count">
                    Showing {filteredTokens.length} of {tokenCards.filter(card => 
                      card.tabType === 'user_created_mainnet' || card.tabType === 'user_created_testnet'
                    ).length} projects
                  </div>
                </div>
              )}
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
                    ) : activeTab === 'practice' ? (
                      <>🧪 <strong>Testnet tokens coming soon!</strong><br />
                      Practice tokens will be available here.</>
                    ) : (
                      <>🔍 <strong>No user-created projects yet!</strong><br />
                      Projects created by users will appear here after minting is completed.</>
                    )}
                  </p>
                  {activeTab !== 'all' && (
                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      Admin can configure tokens in the admin panel
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />

      {/* Coming Soon Popup */}
      {showComingSoonPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1a1a2e',
            border: '2px solid #fbbf24',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '400px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              fontSize: '60px',
              marginBottom: '20px'
            }}>
              🚧
            </div>
            <h2 style={{
              color: '#fbbf24',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px',
              fontFamily: 'Arial, sans-serif'
            }}>
              Coming Soon!
            </h2>
            <p style={{
              color: '#ccc',
              fontSize: '16px',
              lineHeight: '1.5',
              marginBottom: '24px',
              fontFamily: 'Arial, sans-serif'
            }}>
              Project creation feature is currently under development. Stay tuned for updates!
            </p>
            <button
              onClick={() => setShowComingSoonPopup(false)}
              style={{
                backgroundColor: '#fbbf24',
                color: '#1a1a2e',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f59e0b';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#fbbf24';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}