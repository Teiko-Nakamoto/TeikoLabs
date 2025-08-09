'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import Header from '../../components/header';
import TokenBuySellBox from '../../components/TokenBuySellBox';
import TradeHistory from '../../components/tradehistory';
import Chart from '../../components/chart';
import LockUnlockButton from '../../components/LockUnlockButton';
import UnlockProgressBar from '../../components/UnlockProgressBar';
import { getTokenStatsData } from '../../utils/fetchTokenData';
import './token-page.css';

export default function SwapPage() {
  const { t } = useTranslation();
  const params = useParams();
  const tokenSymbol = params.tokenSymbol;
  
  // Token-specific data
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Smart Contract Addresses popup state
  const [showContracts, setShowContracts] = useState(false);
  const [contractCopied, setContractCopied] = useState('');

  // BuySellBox state variables
  const [tab, setTab] = useState('buy');
  const [amount, setAmount] = useState('');
  const [estimatedResult, setEstimatedResult] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [trades, setTrades] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [isSuccessfulTransaction, setIsSuccessfulTransaction] = useState(false);
  const [revenue, setRevenue] = useState('--');
  const [liquidity, setLiquidity] = useState('--');
  const [remainingSupply, setRemainingSupply] = useState('--');
  const [currentPrice, setCurrentPrice] = useState(0);

  // Restore tab and active section from localStorage on component mount
  useEffect(() => {
    const savedTab = localStorage.getItem('selectedTab');
    if (savedTab && (savedTab === 'buy' || savedTab === 'sell')) {
      setTab(savedTab);
    }
    
    const savedActiveSection = localStorage.getItem('activeSection');
    if (savedActiveSection && ['buysell', 'profit', 'stats'].includes(savedActiveSection)) {
      setActiveSection(savedActiveSection);
    }
  }, []);

  // Save tab selection to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectedTab', tab);
  }, [tab]);

  // Save active section to localStorage whenever it changes
  useEffect(() => {
    if (activeSection) {
      localStorage.setItem('activeSection', activeSection);
    } else {
      localStorage.removeItem('activeSection');
    }
  }, [activeSection]);
  
  // Chart options state (same as test page)
  const [tradesPerCandle, setTradesPerCandle] = useState(1);
  const [tradeLimit, setTradeLimit] = useState(20);

  // Check if wallet is connected
  const connectedAddress = typeof window !== 'undefined' ? localStorage.getItem('connectedAddress') : null;

  // Redirect to home if no wallet connected (must be before any conditional returns)
  useEffect(() => {
    if (!connectedAddress) {
      window.location.href = '/';
    }
  }, [connectedAddress]);

  // Handle contract address copying
  const handleContractCopy = async (address, type) => {
    try {
      await navigator.clipboard.writeText(address);
      setContractCopied(type);
      setTimeout(() => setContractCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy contract address: ', err);
    }
  };

  // Handle revenue claiming
  const handleClaimRevenue = async () => {
    try {
      console.log('💰 Starting handleClaimRevenue for token:', tokenData?.id);
      console.log('💰 TokenData available:', !!tokenData);
      
      // Check if wallet is connected
      const connectedAddress = typeof window !== 'undefined' ? localStorage.getItem('connectedAddress') : null;
      if (!connectedAddress) {
        alert('Please connect your wallet to claim revenue.');
        return;
      }
      
      if (!tokenData) {
        console.error('❌ No tokenData available');
        alert('Token data not available. Please refresh the page.');
        return;
      }
      
      // Get the raw revenue number (not the formatted string) with timeout
      console.log('🔍 Calling getTokenStatsData with tokenData:', tokenData);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const statsPromise = getTokenStatsData(tokenData);
      const rawRevenue = await Promise.race([statsPromise, timeoutPromise]);
      console.log('🔍 Raw revenue result:', rawRevenue);
      
      // Pass ALL data from trade page to avoid duplicate API calls
      const revenueData = {
        // Revenue data (use raw number, not formatted string)
        totalRevenue: rawRevenue.revenue,
        availableToClaim: rawRevenue.revenue,
        tradingFees: rawRevenue.revenue,
        
        // Token data (already fetched on trade page)
        tokenData: tokenData,
        
        // Locked token data (already fetched on trade page)
        totalLockedTokens: rawRevenue.liquidity,
        userLockedTokens: 0, // Will be updated when wallet is connected
        majorityThreshold: Math.floor(rawRevenue.liquidity / 2) + 1,
        
        // Other data already available
        remainingSupply: rawRevenue.remainingSupply,
        
        // Timestamp for data freshness
        timestamp: Date.now()
      };
      
      console.log('💰 Passing raw revenue data:', revenueData);
      
      // Encode the data and navigate - use tokenData.id for the revenue page
      const encodedData = encodeURIComponent(JSON.stringify(revenueData));
      window.location.href = `/revenue/${tokenData.id}?data=${encodedData}`;
      
    } catch (error) {
      if (error.message === 'Request timeout') {
        console.error('❌ Request timed out while fetching revenue data');
        alert('Request timed out. Please try again.');
      } else {
        console.error('❌ Error navigating to revenue page:', error);
        alert('Failed to navigate to revenue page. Please try again.');
      }
    }
  };

  // Fetch token-specific stats data
  const fetchTokenStats = async (tokenData) => {
    try {
      // Set a timeout for the blockchain call to prevent freezing
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const statsPromise = getTokenStatsData(tokenData);
      const statsData = await Promise.race([statsPromise, timeoutPromise]);
      
      setRevenue(statsData.revenue.toLocaleString());
      setLiquidity(statsData.liquidity.toLocaleString());
      setRemainingSupply(Math.floor(statsData.remainingSupply).toLocaleString());
      console.log('🔍 Token stats updated:', statsData);
    } catch (error) {
      console.error('Error fetching token stats:', error);
      // Set default values instead of failing
      setRevenue('--');
      setLiquidity('--');
      setRemainingSupply('--');
    }
  };

  // Fetch token data from database by symbol
  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        console.log('🔍 Fetching token data for symbol:', tokenSymbol);
        
        // Set a timeout for the entire token fetching process
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Token fetching timeout')), 15000)
        );
        
        const fetchPromise = (async () => {
        
        // First, try to find admin-configured token
        const adminResponse = await fetch('/api/get-token-cards');
        const adminResult = await adminResponse.json();
        
        if (adminResult.tokenCards) {
          // Find admin token by symbol (case-insensitive)
          const adminToken = adminResult.tokenCards.find(t => 
            t.symbol && t.symbol.toLowerCase() === tokenSymbol.toLowerCase()
          );
          
          if (adminToken) {
            console.log('🔍 Found admin token:', adminToken);
            setTokenData(adminToken);
            // Fetch token-specific stats after setting token data
            await fetchTokenStats(adminToken);
            return;
          }
        }
        
        // If admin token not found, try to find user token
        console.log('🔍 Admin token not found, checking user tokens...');
        const userResponse = await fetch('/api/user-tokens/list?limit=100');
        const userResult = await userResponse.json();
        
        if (userResult.success && userResult.tokens) {
          // Find user token by symbol (case-insensitive)
          const userToken = userResult.tokens.find(t => 
            t.tokenSymbol && t.tokenSymbol.toLowerCase() === tokenSymbol.toLowerCase()
          );
          
          if (userToken) {
            console.log('🔍 Found user token:', userToken);
            // Transform user token to match admin token format
            const transformedToken = {
              id: `user-${userToken.id}`,
              name: userToken.tokenName,
              symbol: userToken.tokenSymbol,
              description: userToken.tokenDescription,
              tabType: userToken.deploymentStatus === 'deployed' ? 'featured' : 'practice',
              isComingSoon: false,
              isHidden: false,
              // Contract information for real-time data fetching
              dexContractAddress: userToken.dexContractAddress,
              tokenContractAddress: userToken.tokenContractAddress,
              // Add other fields as needed
              creatorWalletAddress: userToken.creatorWalletAddress,
              deploymentStatus: userToken.deploymentStatus,
              network: userToken.network,
              isVerified: userToken.isVerified,
              createdAt: userToken.createdAt
            };
            
            setTokenData(transformedToken);
            // For user tokens, skip blockchain stats if not deployed
            if (userToken.deploymentStatus === 'deployed' && userToken.dexContractAddress) {
              await fetchTokenStats(transformedToken);
            } else {
              console.log('🔍 User token not deployed yet, skipping blockchain stats');
            }
            return;
          }
        }
        
        console.error('❌ Token not found with symbol:', tokenSymbol);
        })();
        
        await Promise.race([fetchPromise, timeoutPromise]);
      } catch (error) {
        console.error('❌ Error fetching token data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (tokenSymbol) {
      fetchTokenData();
    }
  }, [tokenSymbol]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="token-page">
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
            <p>Loading token data...</p>
          </div>
        </main>
      </>
    );
  }

  if (!tokenData) {
    return (
      <>
        <Header />
        <main className="token-page">
          <div style={{ textAlign: 'center', padding: '3rem', color: 'white' }}>
            <p>Token not found</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="token-page">
        {/* Wallet Connection Prompt */}
        {!connectedAddress && (
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            padding: '16px',
            margin: '16px',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px' }}>
              🔗 Connect Your Wallet
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              Connect your wallet to view live trading data and start trading
            </div>
          </div>
        )}

        <div className="main-layout">
        {/* Left side: Contract Info, Chart and Trade History */}
        <div className="chart-section">
          {/* Unlock Progress Bar Component */}
          <UnlockProgressBar
            tokenSymbol={tokenData?.symbol || 'TOKEN'}
            revenue={revenue}
            liquidity={liquidity}
            showButtons={true}
            onShowContracts={() => setShowContracts(true)}
            onClaimRevenue={handleClaimRevenue}
            tokenId={tokenData.id}
            LockUnlockButton={LockUnlockButton}
            dexInfo={tokenData?.dexInfo}
            tokenInfo={tokenData?.tokenInfo}
          />

          {/* Chart Component with Candlestick Options */}
          <Chart
            trades={trades}
            tradesPerCandle={tradesPerCandle}
            setTradesPerCandle={setTradesPerCandle}
            tradeLimit={tradeLimit}
            setTradeLimit={setTradeLimit}
            currentPrice={currentPrice}
          />

                                {/* Trade History with Blue and Pink Boxes */}
           <TradeHistory 
             trades={trades} 
             pendingTransaction={pendingTransaction} 
             isSuccessfulTransaction={isSuccessfulTransaction} 
             tokenData={tokenData}
             onTradesUpdate={setTrades}
           />
        </div>

        {/* Right side: Buy/Sell + Toggle Display */}
        <div className="trading-section">
          {/* Always show BuySellBox with navigation buttons inside */}
                     <TokenBuySellBox
             tab={tab}
             setTab={setTab}
             amount={amount}
             setAmount={setAmount}
             estimatedResult={estimatedResult}
             setEstimatedResult={setEstimatedResult}
             refreshTrades={async () => {
               if (tokenData) {
                 await fetchTokenStats(tokenData);
               }
             }} // Hook to stats update
             setPendingTransaction={setPendingTransaction}
             setIsSuccessfulTransaction={setIsSuccessfulTransaction}
             trades={trades}
             activeSection={activeSection}
             setActiveSection={setActiveSection}
             revenue={revenue}
             liquidity={liquidity}
             remainingSupply={remainingSupply}
             tokenData={tokenData} // Pass the current token data
             onCurrentPriceChange={setCurrentPrice} // Pass current price to parent
           />
        </div>
      </div>

      {/* Smart Contract Addresses popup */}
      {showContracts && (
        <div className="popup-overlay" onClick={() => setShowContracts(false)}>
          <div className="popup contracts-popup" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: '20px', 
              color: '#fff', 
              textAlign: 'center',
              fontSize: '18px'
            }}>
              📋 Smart Contract Addresses
            </h3>
            
            {/* Network Info */}
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              background: '#1a202c', 
              borderRadius: '8px',
              border: '2px solid #fca311',
              textAlign: 'center'
            }}>
              <div style={{ 
                color: '#fca311', 
                fontSize: '14px', 
                fontWeight: 'bold', 
                marginBottom: '4px' 
              }}>
                🌐 Network:
              </div>
              <div style={{ 
                color: '#fff', 
                fontSize: '16px', 
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {(() => {
                  // Determine network from tokenData
                  if (tokenData?.network) {
                    return tokenData.network;
                  }
                  if (tokenData?.tabType === 'practice' || tokenData?.tabType === 'user_created_testnet') {
                    return 'testnet';
                  }
                  if (tokenData?.tabType === 'featured' || tokenData?.tabType === 'user_created_mainnet') {
                    return 'mainnet';
                  }
                  return 'testnet'; // default fallback
                })()}
              </div>
            </div>
            
            {/* DEX Contract */}
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              background: '#2d3748', 
              borderRadius: '8px',
              border: '1px solid #4a5568'
            }}>
              <div style={{ 
                color: '#60a5fa', 
                fontSize: '14px', 
                fontWeight: 'bold', 
                marginBottom: '6px' 
              }}>
                DEX Contract:
              </div>
              <div style={{ 
                color: '#fff', 
                fontSize: '12px', 
                wordBreak: 'break-all', 
                marginBottom: '8px',
                fontFamily: 'monospace'
              }}>
                {tokenData.dexInfo || 'Not configured'}
              </div>
              {tokenData.dexInfo && (
                <button 
                  onClick={() => handleContractCopy(tokenData.dexInfo, 'dex')}
                  style={{ 
                    background: contractCopied === 'dex' ? '#22c55e' : '#3b82f6', 
                    border: 'none', 
                    color: '#ffffff', 
                    cursor: 'pointer', 
                    fontSize: '12px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  {contractCopied === 'dex' ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>

            {/* Token Contract */}
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              background: '#2d3748', 
              borderRadius: '8px',
              border: '1px solid #4a5568'
            }}>
              <div style={{ 
                color: '#60a5fa', 
                fontSize: '14px', 
                fontWeight: 'bold', 
                marginBottom: '6px' 
              }}>
                Token Contract:
              </div>
              <div style={{ 
                color: '#fff', 
                fontSize: '12px', 
                wordBreak: 'break-all', 
                marginBottom: '8px',
                fontFamily: 'monospace'
              }}>
                {tokenData.tokenInfo || 'Not configured'}
              </div>
              {tokenData.tokenInfo && (
                <button 
                  onClick={() => handleContractCopy(tokenData.tokenInfo, 'token')}
                  style={{ 
                    background: contractCopied === 'token' ? '#22c55e' : '#3b82f6', 
                    border: 'none', 
                    color: '#ffffff', 
                    cursor: 'pointer', 
                    fontSize: '12px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  {contractCopied === 'token' ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>

            {/* SBTC Contract */}
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              background: '#2d3748', 
              borderRadius: '8px',
              border: '1px solid #4a5568'
            }}>
              <div style={{ 
                color: '#60a5fa', 
                fontSize: '14px', 
                fontWeight: 'bold', 
                marginBottom: '6px' 
              }}>
                SBTC Contract:
              </div>
              <div style={{ 
                color: '#fff', 
                fontSize: '12px', 
                wordBreak: 'break-all', 
                marginBottom: '8px',
                fontFamily: 'monospace'
              }}>
                ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token
              </div>
              <button 
                onClick={() => handleContractCopy('ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token', 'sbtc')}
                style={{ 
                  background: contractCopied === 'sbtc' ? '#22c55e' : '#3b82f6', 
                  border: 'none', 
                  color: '#ffffff', 
                  cursor: 'pointer', 
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}
              >
                {contractCopied === 'sbtc' ? 'Copied!' : 'Copy'}
              </button>
            </div>



            <button 
              onClick={() => setShowContracts(false)}
              style={{
                background: '#4a5568',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '10px 20px',
                borderRadius: '8px',
                width: '100%'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      </main>
    </>
  );
}
