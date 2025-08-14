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

// Animated counter component
const AnimatedCounter = ({ endValue, duration = 2000, prefix = '', suffix = '', onComplete }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return; // Only animate once
    
    let startTime = null;
    const startValue = 0;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
      
      setCount(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
        setHasAnimated(true);
        if (onComplete) onComplete();
      }
    };

    // Start animation after a small delay
    const timer = setTimeout(() => {
      requestAnimationFrame(animate);
    }, 500);

    return () => clearTimeout(timer);
  }, [endValue, duration, onComplete, hasAnimated]);

  return (
    <span>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

// Typewriter effect component
const TypewriterText = ({ text, speed = 100, onComplete }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return <span>{displayText}</span>;
};

export default function ClientHomePage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('featured'); // Changed back to 'featured'
  const [defaultTab, setDefaultTab] = useState('featured'); // Changed back to 'featured'
  const [tokenCards, setTokenCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProjects, setShowProjects] = useState(false);
  
  // State for real-time token data
  const [tokenData, setTokenData] = useState({});
  
  // State for wallet connection
  const [connectedAddress, setConnectedAddress] = useState('');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  const [showComingSoonPopup, setShowComingSoonPopup] = useState(false);
  const [showPracticeWalletPopup, setShowPracticeWalletPopup] = useState(false);
  const [showMainnetWalletPopup, setShowMainnetWalletPopup] = useState(false);
  const [accessSettings, setAccessSettings] = useState({

    claimRevenue: true,
    tokenTrading: {
      featured: false,
      practice: false
    }
  });
  const [showTradingUpdatePopup, setShowTradingUpdatePopup] = useState(false);

  // State for mainnet totals
  const [mainnetTotals, setMainnetTotals] = useState({
    totalProfitGenerated: 0,
    totalValueLocked: 0
  });

  // State for animation sequence
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [countersCompleted, setCountersCompleted] = useState(0);

  // Calculate mainnet totals from token data
  const calculateMainnetTotals = () => {
    const mainnetCards = tokenCards.filter(card => card.tabType === 'featured' && !card.isComingSoon);
    
    let totalProfitGenerated = 0;
    let totalValueLocked = 0;
    
    mainnetCards.forEach(card => {
      const cardData = tokenData[card.id];
      if (cardData) {
        totalProfitGenerated += cardData.revenue || 0;
        totalValueLocked += cardData.liquidity || 0;
      }
    });
    
    setMainnetTotals({
      totalProfitGenerated,
      totalValueLocked
    });
  };

  // Recalculate mainnet totals when token data changes
  useEffect(() => {
    calculateMainnetTotals();
  }, [tokenData, tokenCards]);

  // Handle counter completion
  const handleCounterComplete = () => {
    setCountersCompleted(prev => {
      const newCount = prev + 1;
      if (newCount >= 2) { // Both counters completed
        setTimeout(() => setShowTypewriter(true), 300); // Small delay before typewriter starts
      }
      return newCount;
    });
  };

  // Load access settings from server
  useEffect(() => {
    const loadAccessSettings = async () => {
      try {
        const response = await fetch('/api/access-settings');
        const data = await response.json();
        if (data.success) {
          setAccessSettings(data.settings);
        }
      } catch (error) {
        console.error('Failed to load access settings:', error);
        // Keep default settings if API fails
      }
    };
    loadAccessSettings();

    // Listen for storage events (when admin changes settings)
    const handleStorageChange = (e) => {
      if (e.key === 'accessSettingsChanged') {
        loadAccessSettings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events for same-window updates
    const handleAccessSettingsUpdate = () => {
      loadAccessSettings();
    };
    
    window.addEventListener('accessSettingsUpdated', handleAccessSettingsUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('accessSettingsUpdated', handleAccessSettingsUpdate);
    };
  }, []);

  // Handle tab parameter from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['featured', 'practice'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

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
    console.log('Token card clicked:', { activeTab, tokenCardTabType: tokenCard.tabType, connectedAddress });
    // Check if trading is disabled for this token category
    const isTokenTradingDisabled = () => {
      if (activeTab === 'featured' && !accessSettings.tokenTrading?.featured) {
        return true;
      }
      if (activeTab === 'practice' && !accessSettings.tokenTrading?.practice) {
        return true;
      }
      return false;
    };

    if (isTokenTradingDisabled()) {
      setShowTradingUpdatePopup(true);
      return;
    }

    // Check wallet connection and network based on active tab
    if (activeTab === 'practice') {
      console.log('Practice tab detected, checking wallet...');
      if (!connectedAddress) {
        console.log('No wallet connected for practice trading - showing practice popup');
        // No wallet connected for practice trading - show popup
        setShowPracticeWalletPopup(true);
        return;
      }
      
      // Check if mainnet wallet is connected (should be testnet for practice)
      if (connectedAddress.startsWith('SP')) {
        console.log('Mainnet wallet connected for practice trading - showing practice popup');
        // Mainnet wallet connected for practice trading - show popup
        setShowPracticeWalletPopup(true);
        return;
      }
    } else if (activeTab === 'featured') {
      console.log('Featured tab detected, checking wallet...');
      if (!connectedAddress) {
        console.log('No wallet connected for mainnet trading - showing mainnet popup');
        // No wallet connected for mainnet trading - show popup
        setShowMainnetWalletPopup(true);
        return;
      }
      
      // Check if testnet wallet is connected (should be mainnet for featured)
      if (connectedAddress.startsWith('ST')) {
        console.log('Testnet wallet connected for mainnet trading - showing mainnet popup');
        // Testnet wallet connected for mainnet trading - show popup
        setShowMainnetWalletPopup(true);
        return;
      }
    }

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
      const isTestnet = tokenCard.tabType === 'practice';
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

  // Get displayed cards based on active tab
  const displayedCards = (() => {
    if (activeTab === 'featured') {
      return tokenCards.filter(card => card.tabType === 'featured');
    } else if (activeTab === 'practice') {
      return tokenCards.filter(card => card.tabType === 'practice');
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
              background: 'linear-gradient(45deg, #FFD700, #FFA500, #FFD700)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '900',
              fontSize: '2.5rem',
              fontFamily: 'Arial, sans-serif',
              marginBottom: '30px',
              textShadow: '0 0 15px rgba(255,215,0,0.3)',
              letterSpacing: '1px',
              minHeight: '3rem'
            }}>
                              {showTypewriter ? (
                  <TypewriterText 
                    text="Join The Forever Pump Protocol" 
                    speed={80}
                  />
                ) : (
                  <span style={{ opacity: 0 }}>Join The Forever Pump Protocol</span>
                )}
            </h1>
            
            {/* Only show stats if there's actual data */}
            {(mainnetTotals.totalProfitGenerated > 0 || mainnetTotals.totalValueLocked > 0) && (
            <div style={{
              textAlign: 'center',
                marginBottom: '30px',
              fontFamily: 'Arial, sans-serif'
            }}>
                {mainnetTotals.totalProfitGenerated > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,165,0,0.1) 100%)',
                    borderRadius: '15px',
                    padding: '20px',
                    marginBottom: '15px',
                    border: '1px solid rgba(255,215,0,0.3)',
                    boxShadow: '0 8px 25px rgba(255,215,0,0.2)'
                  }}>
              <p style={{
                      background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: '1.8rem',
                marginBottom: '8px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                      gap: '15px',
                      textShadow: '0 0 10px rgba(255,215,0,0.2)'
                    }}>
                      <span style={{ fontSize: '1.3rem', color: '#FFD700', textShadow: 'none', WebkitTextFillColor: '#FFD700' }}>💰</span>
                      <span style={{ textShadow: '0 0 10px rgba(255,215,0,0.2)' }}>Total Profit Generated <AnimatedCounter endValue={mainnetTotals.totalProfitGenerated} duration={2500} onComplete={handleCounterComplete} /></span>
                      <img src="/icons/sats1.svg" alt="sats" style={{ width: '25px', height: '25px' }} />
                      <img src="/icons/Vector.svg" alt="lightning" style={{ width: '25px', height: '25px' }} />
              </p>
            </div>
                )}
            
                {mainnetTotals.totalValueLocked > 0 && (
            <div style={{
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,165,0,0.1) 100%)',
                    borderRadius: '15px',
                    padding: '20px',
                    border: '1px solid rgba(255,215,0,0.3)',
                    boxShadow: '0 8px 25px rgba(255,215,0,0.2)'
                  }}>
                    <p style={{
                      background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: '1.8rem',
                      marginBottom: '8px',
                      fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
                      gap: '15px',
                      textShadow: '0 0 10px rgba(255,215,0,0.2)'
                    }}>
                      <span style={{ fontSize: '1.3rem', color: '#FFD700', textShadow: 'none', WebkitTextFillColor: '#FFD700' }}>🔒</span>
                      <span style={{ textShadow: '0 0 10px rgba(255,215,0,0.2)' }}>Total Value Locked <AnimatedCounter endValue={mainnetTotals.totalValueLocked} duration={2500} onComplete={handleCounterComplete} /></span>
                      <img src="/icons/sats1.svg" alt="sats" style={{ width: '25px', height: '25px' }} />
                      <img src="/icons/Vector.svg" alt="lightning" style={{ width: '25px', height: '25px' }} />
                    </p>
            </div>
                )}
              </div>
            )}
            
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
              // Check if wallet is connected for mainnet trading
              const connectedAddress = localStorage.getItem('connectedAddress');
              
              if (!connectedAddress) {
                // No wallet connected for mainnet trading - show popup
                setShowMainnetWalletPopup(true);
                return;
              }
              
              // Check if testnet wallet is connected (should be mainnet for MAS trading)
              if (connectedAddress.startsWith('ST')) {
                // Testnet wallet connected for mainnet trading - show popup
                setShowMainnetWalletPopup(true);
                return;
              }
              
              // Wallet is connected and is mainnet (starts with "SP") - proceed normally
              window.location.href = '/mas/swap';
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              backgroundColor: '#1d4ed8',
              color: '#fbbf24',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 32px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 6px rgba(29, 78, 216, 0.3)',
              minWidth: '200px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1e40af';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 12px rgba(29, 78, 216, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#1d4ed8';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px rgba(29, 78, 216, 0.3)';
            }}
          >
            Get
                          <img 
                src="/icons/The Mas Network.svg" 
                alt="MAS Sats" 
                style={{ 
                  width: '28px', 
                  height: '28px', 
                  verticalAlign: 'middle',
                  marginLeft: '8px'
                }} 
              />
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
              backgroundColor: '#fbbf24',
              color: '#000000',
              border: '2px solid #fbbf24',
              borderRadius: '12px',
              padding: '16px 32px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '200px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f59e0b';
              e.target.style.color = '#000000';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#fbbf24';
              e.target.style.color = '#000000';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            {showProjects ? 'Hide Projects' : 'Practice Trading'}
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <span style={{
            background: 'linear-gradient(45deg, #FFD700, #FFA500)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '1.1rem',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(255,215,0,0.3)'
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
                height: '45px',
                width: 'auto',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                filter: 'brightness(1) drop-shadow(0 0 10px rgba(255,215,0,0.3))',
                borderRadius: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.filter = 'brightness(1.3) drop-shadow(0 0 20px rgba(255,215,0,0.6))';
                e.target.style.transform = 'scale(1.1) rotate(2deg)';
              }}
              onMouseLeave={(e) => {
                e.target.style.filter = 'brightness(1) drop-shadow(0 0 10px rgba(255,215,0,0.3))';
                e.target.style.transform = 'scale(1) rotate(0deg)';
              }}
              onMouseDown={(e) => {
                e.target.style.filter = 'brightness(1.4) drop-shadow(0 0 25px rgba(255,215,0,0.8))';
                e.target.style.transform = 'scale(0.95) rotate(-1deg)';
              }}
              onMouseUp={(e) => {
                e.target.style.filter = 'brightness(1.3) drop-shadow(0 0 20px rgba(255,215,0,0.6))';
                e.target.style.transform = 'scale(1.1) rotate(2deg)';
              }}
            />
          </a>
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

      {/* Mainnet Wallet Required Popup */}
      {showMainnetWalletPopup && (
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
            padding: window.innerWidth <= 768 ? '24px' : '40px',
            maxWidth: window.innerWidth <= 768 ? '90vw' : '450px',
            width: window.innerWidth <= 768 ? '90vw' : 'auto',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              fontSize: window.innerWidth <= 768 ? '48px' : '60px',
              marginBottom: window.innerWidth <= 768 ? '16px' : '20px'
            }}>
              🚀
            </div>
            <h2 style={{
              color: '#fbbf24',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px',
              fontFamily: 'Arial, sans-serif'
            }}>
              Mainnet Wallet Required
            </h2>
            <p style={{
              color: '#ccc',
              fontSize: '16px',
              lineHeight: '1.5',
              marginBottom: '24px',
              fontFamily: 'Arial, sans-serif'
            }}>
              To access real trading with actual Bitcoin, you need to connect your Bitcoin Stacks wallet 
              on <strong>mainnet</strong> at the top right of your screen.
            </p>
            
            <div style={{
              background: '#374151',
              borderRadius: '8px',
              padding: '20px',
              margin: '20px 0',
              textAlign: 'left'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px',
                color: '#d1d5db'
              }}>
                <span style={{
                  background: '#fbbf24',
                  color: '#1a1a2e',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  marginRight: '12px',
                  flexShrink: 0
                }}>
                  1
                </span>
                <span>Look for the "Connect Wallet" button in the top right corner</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px',
                color: '#d1d5db'
              }}>
                <span style={{
                  background: '#fbbf24',
                  color: '#1a1a2e',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  marginRight: '12px',
                  flexShrink: 0
                }}>
                  2
                </span>
                <span>Make sure your wallet is set to <strong>mainnet</strong> (address starts with "SP")</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: '#d1d5db'
              }}>
                <span style={{
                  background: '#fbbf24',
                  color: '#1a1a2e',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  marginRight: '12px',
                  flexShrink: 0
                }}>
                  3
                </span>
                <span>Connect your wallet and try again</span>
              </div>
            </div>
            
            <div style={{
              background: '#dc2626',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '16px',
              margin: '20px 0'
            }}>
              <p style={{
                color: '#fecaca',
                margin: 0,
                fontSize: '14px'
              }}>
                <strong>Warning:</strong> Mainnet trading uses real Bitcoin. Make sure you understand the risks 
                and only trade with funds you can afford to lose.
              </p>
            </div>
            
            <button
              onClick={() => setShowMainnetWalletPopup(false)}
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

      {/* Trading Update Popup */}
      {showTradingUpdatePopup && (
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
              🔄
            </div>
            <h2 style={{
              color: '#fbbf24',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px',
              fontFamily: 'Arial, sans-serif'
            }}>
              Feature Being Updated
            </h2>
            <p style={{
              color: '#ccc',
              fontSize: '16px',
              lineHeight: '1.5',
              marginBottom: '24px',
              fontFamily: 'Arial, sans-serif'
            }}>
              This feature is currently being updated. Please check back soon for the latest improvements!
            </p>
            <button
              onClick={() => setShowTradingUpdatePopup(false)}
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

      {/* Practice Wallet Popup */}
      {/* Mainnet Wallet Required Popup */}
      {showMainnetWalletPopup && (
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
            padding: window.innerWidth <= 768 ? '24px' : '40px',
            maxWidth: window.innerWidth <= 768 ? '90vw' : '450px',
            width: window.innerWidth <= 768 ? '90vw' : 'auto',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              fontSize: window.innerWidth <= 768 ? '48px' : '60px',
              marginBottom: window.innerWidth <= 768 ? '16px' : '20px'
            }}>
              🚀
            </div>
            <h2 style={{
              color: '#fbbf24',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px',
              fontFamily: 'Arial, sans-serif'
            }}>
              Mainnet Wallet Required
            </h2>
            <p style={{
              color: '#ccc',
              fontSize: '16px',
              lineHeight: '1.5',
              marginBottom: '24px',
              fontFamily: 'Arial, sans-serif'
            }}>
              To access real trading with actual Bitcoin, you need to connect your Bitcoin Stacks wallet 
              on <strong>mainnet</strong> at the top right of your screen.
            </p>
            
            <div style={{
              background: '#374151',
              borderRadius: '8px',
              padding: '20px',
              margin: '20px 0',
              textAlign: 'left'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px',
                color: '#d1d5db'
              }}>
                <span style={{
                  background: '#fbbf24',
                  color: '#1a1a2e',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  marginRight: '12px',
                  flexShrink: 0
                }}>
                  1
                </span>
                <span>Look for the "Connect Wallet" button in the top right corner</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px',
                color: '#d1d5db'
              }}>
                <span style={{
                  background: '#fbbf24',
                  color: '#1a1a2e',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  marginRight: '12px',
                  flexShrink: 0
                }}>
                  2
                </span>
                <span>Make sure your wallet is set to <strong>mainnet</strong> (address starts with "SP")</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: '#d1d5db'
              }}>
                <span style={{
                  background: '#fbbf24',
                  color: '#1a1a2e',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  marginRight: '12px',
                  flexShrink: 0
                }}>
                  3
                </span>
                <span>Connect your wallet and try again</span>
              </div>
            </div>
            
            <div style={{
              background: '#dc2626',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '16px',
              margin: '20px 0'
            }}>
              <p style={{
                color: '#fecaca',
                margin: 0,
                fontSize: '14px'
              }}>
                <strong>Warning:</strong> Mainnet trading uses real Bitcoin. Make sure you understand the risks 
                and only trade with funds you can afford to lose.
              </p>
            </div>
            
            <button
              onClick={() => setShowMainnetWalletPopup(false)}
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
      {showPracticeWalletPopup && (
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
            border: '2px solid #4CAF50',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '500px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              fontSize: '60px',
              marginBottom: '20px'
            }}>
              🧪
            </div>
            <h2 style={{
              color: '#4CAF50',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px',
              fontFamily: 'Arial, sans-serif'
            }}>
              Testnet Wallet Required
            </h2>
            <p style={{
              color: '#ccc',
              fontSize: '16px',
              lineHeight: '1.5',
              marginBottom: '24px',
              fontFamily: 'Arial, sans-serif'
            }}>
              To access practice trading, you need to connect your Bitcoin Stacks wallet 
              on <strong>testnet</strong> at the top right of your screen.
            </p>
            
            <div style={{
              background: '#374151',
              borderRadius: '8px',
              padding: '20px',
              margin: '20px 0',
              textAlign: 'left'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px',
                color: '#d1d5db'
              }}>
                <span style={{
                  background: '#4CAF50',
                  color: '#1a1a2e',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  marginRight: '12px',
                  flexShrink: 0
                }}>
                  1
                </span>
                <span>Look for the "Connect Wallet" button in the top right corner</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px',
                color: '#d1d5db'
              }}>
                <span style={{
                  background: '#4CAF50',
                  color: '#1a1a2e',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  marginRight: '12px',
                  flexShrink: 0
                }}>
                  2
                </span>
                <span>Make sure your wallet is set to <strong>testnet</strong> (address starts with "ST")</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: '#d1d5db'
              }}>
                <span style={{
                  background: '#4CAF50',
                  color: '#1a1a2e',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  marginRight: '12px',
                  flexShrink: 0
                }}>
                  3
                </span>
                <span>Connect your wallet and try again</span>
              </div>
            </div>
            
            <div style={{
              background: '#dc2626',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '16px',
              margin: '20px 0'
            }}>
              <p style={{
                color: '#fecaca',
                margin: 0,
                fontSize: '14px'
              }}>
                <strong>Note:</strong> Mainnet wallets (addresses starting with "SP") are not supported 
                for practice trading. Practice trading uses fake money on testnet only.
              </p>
            </div>
            
            <button
              onClick={() => setShowPracticeWalletPopup(false)}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#45a049';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#4CAF50';
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