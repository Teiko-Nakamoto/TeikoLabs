'use client';

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

  // Calculate visible projects based on search and filter
  const filteredProjects = tokenCards.filter(token => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (token.description && token.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Network filter
    const matchesNetwork = networkFilter === 'all' || 
      (networkFilter === 'testnet' && token.network === 'testnet') ||
      (networkFilter === 'mainnet' && token.network === 'mainnet');
    
    return matchesSearch && matchesNetwork;
  });

  // Group projects by network for display
  const groupedProjects = filteredProjects.reduce((acc, token) => {
    const network = token.network || 'mainnet';
    if (!acc[network]) {
      acc[network] = [];
    }
    acc[network].push(token);
    return acc;
  }, {});

  // Get project count for stats
  const projectCounts = {
    total: tokenCards.length,
    testnet: tokenCards.filter(token => token.network === 'testnet').length,
    mainnet: tokenCards.filter(token => token.network === 'mainnet').length
  };

  // Fetch token cards data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch token cards
      const cardsResponse = await fetch('/api/get-token-cards');
      const cardsData = await cardsResponse.json();
      
      if (cardsData.success && Array.isArray(cardsData.data)) {
        const cards = cardsData.data;
        setTokenCards(cards);

        // Fetch real-time data for each token
        const tokenDataPromises = cards.map(async (card) => {
          const tokenId = card.id;
          try {
            const [revenueBalance, liquidityBalance, tokenSymbol] = await Promise.all([
              getRevenueBalance(tokenId),
              getLiquidityBalance(tokenId),
              getTokenSymbol(tokenId)
            ]);

            return {
              tokenId,
              revenue: revenueBalance?.balance || 0,
              liquidity: liquidityBalance?.balance || 0,
              symbol: tokenSymbol || card.symbol
            };
          } catch (error) {
            console.error(`Error fetching data for token ${tokenId}:`, error);
            return {
              tokenId,
              revenue: 0,
              liquidity: 0,
              symbol: card.symbol
            };
          }
        });

        const resolvedTokenData = await Promise.all(tokenDataPromises);
        const tokenDataMap = resolvedTokenData.reduce((acc, data) => {
          acc[data.tokenId] = data;
          return acc;
        }, {});

        setTokenData(tokenDataMap);
      } else {
        console.error('Invalid token cards data structure:', cardsData);
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
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setDefaultTab(tab);
    if (tab === 'all') {
      setShowProjects(true);
    } else {
      setShowProjects(false);
    }
  };

  const handleWalletConnect = (address) => {
    setConnectedAddress(address);
    setIsConnectingWallet(false);
  };

  const filteredCards = tokenCards.filter(card => {
    if (activeTab === 'featured') {
      return card.featured;
    } else if (activeTab === 'practice') {
      return card.network === 'testnet';
    }
    return true; // For 'all' tab, show all cards
  });

  const renderTokenCard = (card) => {
    const cardTokenData = tokenData[card.id] || {};
    const formattedRevenue = (cardTokenData.revenue || 0).toFixed(8);
    const formattedLiquidity = (cardTokenData.liquidity || 0).toFixed(8);

    return (
      <div key={card.id} className="token-card" style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
        e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      }}
      onClick={() => window.location.href = `/trade/${card.id}`}
      >
        {/* Network Badge */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: card.network === 'testnet' ? 
            'linear-gradient(135deg, #ff6b6b, #ff8e8e)' : 
            'linear-gradient(135deg, #4facfe, #00f2fe)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {card.network === 'testnet' ? 'Practice' : 'Live'}
        </div>

        {/* Token Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          {card.logo_url && (
            <img 
              src={card.logo_url} 
              alt={`${card.name} logo`}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                marginRight: '16px',
                objectFit: 'cover',
                border: '2px solid rgba(255, 255, 255, 0.1)'
              }}
            />
          )}
          <div>
            <h3 style={{
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
              margin: '0 0 4px 0',
              lineHeight: '1.2'
            }}>
              {card.name}
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                color: '#888',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {cardTokenData.symbol || card.symbol}
              </span>
            </div>
          </div>
        </div>

        {/* Token Description */}
        {card.description && (
          <p style={{
            color: '#ccc',
            fontSize: '14px',
            lineHeight: '1.6',
            marginBottom: '20px',
            maxHeight: '60px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical'
          }}>
            {card.description}
          </p>
        )}

        {/* Token Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              color: '#888',
              fontSize: '12px',
              fontWeight: '500',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {t('revenue_locked')}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <img src="/icons/sats1.svg" alt="Sats" style={{ width: '16px', height: '16px' }} />
              <img src="/icons/Vector.svg" alt="Lightning" style={{ width: '16px', height: '16px' }} />
              <span style={{
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                {formattedRevenue}
              </span>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              color: '#888',
              fontSize: '12px',
              fontWeight: '500',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {t('liquidity')}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <img src="/icons/sats1.svg" alt="Sats" style={{ width: '16px', height: '16px' }} />
              <img src="/icons/Vector.svg" alt="Lightning" style={{ width: '16px', height: '16px' }} />
              <span style={{
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                {formattedLiquidity}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button style={{
          width: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)';
          e.target.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          e.target.style.transform = 'translateY(0)';
        }}
        >
          {t('trade_now')}
        </button>
      </div>
    );
  };

  const renderProjectsByNetwork = () => {
    const networks = ['mainnet', 'testnet'];
    
    return networks.map(network => {
      const networkProjects = groupedProjects[network] || [];
      
      if (networkProjects.length === 0) return null;
      
      return (
        <div key={network} style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '24px',
            padding: '0 4px'
          }}>
            <div style={{
              background: network === 'testnet' ? 
                'linear-gradient(135deg, #ff6b6b, #ff8e8e)' : 
                'linear-gradient(135deg, #4facfe, #00f2fe)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginRight: '12px'
            }}>
              {network === 'testnet' ? 'Practice Mode' : 'Live Trading'}
            </div>
            <span style={{
              color: '#888',
              fontSize: '14px'
            }}>
              {networkProjects.length} {networkProjects.length === 1 ? 'project' : 'projects'}
            </span>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {networkProjects.map(renderTokenCard)}
          </div>
        </div>
      );
    });
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%)',
      color: 'white'
    }}>
      <BackgroundImage />
      <Header 
        connectedAddress={connectedAddress}
        onWalletConnect={handleWalletConnect}
        isConnectingWallet={isConnectingWallet}
        setIsConnectingWallet={setIsConnectingWallet}
      />
      
      <main style={{ 
        paddingTop: '100px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Hero Section */}
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <img 
            src="/logo.png" 
            alt="Platform Logo" 
            style={{
              height: '80px',
              marginBottom: '32px',
              filter: 'drop-shadow(0 4px 20px rgba(255, 255, 255, 0.1))'
            }}
          />
          
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 64px)',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '24px',
            lineHeight: '1.2'
          }}>
            {t('platform_title')}
          </h1>
          
          <p style={{
            fontSize: '20px',
            color: '#ccc',
            maxWidth: '600px',
            margin: '0 auto 40px',
            lineHeight: '1.6'
          }}>
            {t('platform_subtitle')}
          </p>
          
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={() => window.location.href = '/create-project'}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {t('create_token')}
            </button>
            
            <button 
              onClick={() => handleTabClick('all')}
              style={{
                background: 'transparent',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                padding: '14px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {t('browse_tokens')}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px'
          }}>
            <div style={{
              display: 'flex',
              gap: '0'
            }}>
              {['featured', 'practice', 'all'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  style={{
                    background: activeTab === tab ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    color: activeTab === tab ? 'white' : '#ccc',
                    border: 'none',
                    padding: '20px 32px',
                    fontSize: '16px',
                    fontWeight: activeTab === tab ? 'bold' : 'normal',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textTransform: 'capitalize',
                    borderBottom: activeTab === tab ? '3px solid #667eea' : '3px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab) {
                      e.target.style.color = 'white';
                      e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab) {
                      e.target.style.color = '#ccc';
                      e.target.style.background = 'transparent';
                    }
                  }}
                >
                  {t(`tab_${tab}`)}
                </button>
              ))}
            </div>

            {/* Search and Filter Controls for All Projects */}
            {activeTab === 'all' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                {/* Project Stats */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  color: '#888',
                  fontSize: '14px'
                }}>
                  <span>{projectCounts.total} total</span>
                  <span>{projectCounts.mainnet} live</span>
                  <span>{projectCounts.testnet} practice</span>
                </div>
                
                {/* Search Toggle */}
                <button
                  onClick={() => setShowSearchBar(!showSearchBar)}
                  style={{
                    background: showSearchBar ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  🔍 Search
                </button>
                
                {/* Network Filter */}
                <select
                  value={networkFilter}
                  onChange={(e) => setNetworkFilter(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all" style={{ background: '#1a1a2e' }}>All Networks</option>
                  <option value="mainnet" style={{ background: '#1a1a2e' }}>Live Only</option>
                  <option value="testnet" style={{ background: '#1a1a2e' }}>Practice Only</option>
                </select>
              </div>
            )}
          </div>

          {/* Search Bar */}
          {activeTab === 'all' && showSearchBar && (
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '16px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <input
                type="text"
                placeholder="Search projects by name, symbol, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '40px 20px'
        }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#888'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(255, 255, 255, 0.1)',
                borderTop: '3px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              Loading projects...
            </div>
          ) : (
            <>
              {activeTab === 'all' ? (
                <div>
                  {filteredProjects.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '80px 20px',
                      color: '#888'
                    }}>
                      <h3 style={{ marginBottom: '16px' }}>No projects found</h3>
                      <p>Try adjusting your search or filter criteria</p>
                    </div>
                  ) : (
                    renderProjectsByNetwork()
                  )}
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '24px'
                }}>
                  {filteredCards.length === 0 ? (
                    <div style={{
                      gridColumn: '1 / -1',
                      textAlign: 'center',
                      padding: '80px 20px',
                      color: '#888'
                    }}>
                      <h3 style={{ marginBottom: '16px' }}>No tokens found</h3>
                      <p>No tokens available in this category yet</p>
                    </div>
                  ) : (
                    filteredCards.map(renderTokenCard)
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
