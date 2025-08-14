'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../components/header';

import TradeHistory from '../../components/tradehistory';
import Chart from '../../components/chart';

import UnlockProgressBar from '../../components/UnlockProgressBar';
import ProfitLoss from '../../components/ProfitLoss';
import TokenStats from '../../components/TokenStats';
import { getTokenStatsData } from '../../utils/fetchTokenData';
import { Cl, standardPrincipalCV } from '@stacks/transactions';
import './token-page.css';

export default function SwapPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
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
  const [userSatsBalance, setUserSatsBalance] = useState(0);
  const [userTokenBalance, setUserTokenBalance] = useState(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

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



  // Add polling ref to track if component is still mounted
  const pollIntervalRef = useRef(null);

  // Load token data based on token symbol
  useEffect(() => {
    const loadTokenData = async () => {
      if (!tokenSymbol) {
        console.error('❌ No token symbol provided');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Loading token data for symbol:', tokenSymbol);
        
        // Fetch token cards to find the matching token
        const response = await fetch('/api/get-token-cards');
        const data = await response.json();
        
        if (data.tokenCards && Array.isArray(data.tokenCards)) {
          // Find the token that matches the symbol
          const matchingToken = data.tokenCards.find(token => 
            token.symbol && token.symbol.toLowerCase() === tokenSymbol.toLowerCase()
          );
          
          if (matchingToken) {
            console.log('✅ Found matching token:', matchingToken);
            setTokenData(matchingToken);
            setLoading(false);
          } else {
            console.error('❌ No token found for symbol:', tokenSymbol);
            setLoading(false);
          }
        } else {
          console.error('❌ Failed to fetch token cards:', data.error || 'No tokenCards array found');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error loading token data:', error);
        setLoading(false);
      }
    };

    loadTokenData();
  }, [tokenSymbol]);

  // Read token balance when wallet address or token data changes
  useEffect(() => {
    if (connectedAddress && tokenData?.tokenInfo) {
      readTokenBalanceFromContract();
    } else {
      setUserTokenBalance(0);
    }
  }, [connectedAddress, tokenData?.tokenInfo]);

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

  // Calculate user's token balance from trades
  const calculateUserTokenBalance = () => {
    if (!connectedAddress || !trades || trades.length === 0) {
      setUserTokenBalance(0);
      return;
    }

    try {
      // Filter trades for this wallet
      const userTrades = trades.filter(trade => trade.sender === connectedAddress);
      
      let totalBought = 0;
      let totalSold = 0;

      userTrades.forEach(trade => {
        const tokensTraded = Math.abs(trade.tokens_traded || 0) / 1e8; // Convert from satoshis to tokens
        
        if (trade.type === 'buy') {
          totalBought += tokensTraded;
        } else if (trade.type === 'sell') {
          totalSold += tokensTraded;
        }
      });

      const calculatedHoldings = totalBought - totalSold;
      const currentHoldings = Math.max(0, calculatedHoldings); // Ensure non-negative
      
      setUserTokenBalance(currentHoldings);
      
      console.log('📊 Token balance calculation:', {
        totalTrades: trades.length,
        userTrades: userTrades.length,
        totalBought,
        totalSold,
        calculatedHoldings,
        currentHoldings
      });
    } catch (error) {
      console.error('Error calculating token balance:', error);
      setUserTokenBalance(0);
    }
  };

  // Read token balance from smart contract
  const readTokenBalanceFromContract = async () => {
    if (!connectedAddress || !tokenData?.tokenInfo) {
      console.log('❌ Cannot read token balance: missing wallet or token info');
      return;
    }

    try {
      console.log('🔍 Reading token balance from contract for address:', connectedAddress);
      console.log('🔍 Token info:', tokenData.tokenInfo);

      // Parse token contract info (format: "address.contract-name")
      const [tokenContractAddress, tokenContractName] = tokenData.tokenInfo.split('.');
      
      if (!tokenContractAddress || !tokenContractName) {
        console.error('❌ Invalid token contract info format:', tokenData.tokenInfo);
        return;
      }

      console.log('🔍 Parsed contract info:', {
        tokenContractAddress,
        tokenContractName,
        fullTokenInfo: tokenData.tokenInfo
      });

      // Create the principal CV for the user's address
      const userPrincipal = standardPrincipalCV(connectedAddress);

      console.log('🚀 Making API call to /api/read-contract with:', {
        contractAddress: tokenContractAddress,
        contractName: tokenContractName,
        functionName: 'get-balance',
        functionArgs: [connectedAddress],
        userPrincipal: userPrincipal
      });

      // Call the get-balance function on the token contract
      const response = await fetch('/api/read-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress: tokenContractAddress,
          contractName: tokenContractName,
          functionName: 'get-balance',
          functionArgs: [connectedAddress] // Pass the address as string, not CV
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Contract read response - FULL:', JSON.stringify(data, null, 2));
      console.log('📊 Contract read response - result:', data.result);
      console.log('📊 Contract read response - result type:', typeof data.result);
      console.log('📊 Contract read response - success:', data.success);

      if (data.success && data.result !== undefined && data.result !== null) {
        console.log('🔍 Processing successful response...');
        
        // Check if result is already a number
        let balanceInSats;
        if (typeof data.result === 'number') {
          balanceInSats = data.result;
          console.log('🔍 Result is already a number:', balanceInSats);
        } else if (typeof data.result === 'string') {
          // Try to parse as integer
          balanceInSats = parseInt(data.result);
          console.log('🔍 Parsed string result to integer:', balanceInSats);
          
          // Check if parsing failed
          if (isNaN(balanceInSats)) {
            console.error('❌ Failed to parse result as integer:', data.result);
            // Try to extract number from string formats like "ok u123456"
            if (data.result.startsWith('ok u')) {
              const numberPart = data.result.substring(4);
              balanceInSats = parseInt(numberPart);
              console.log('🔍 Extracted from "ok u" format:', numberPart, '->', balanceInSats);
            } else if (data.result.startsWith('ok ')) {
              const numberPart = data.result.substring(3);
              balanceInSats = parseInt(numberPart);
              console.log('🔍 Extracted from "ok " format:', numberPart, '->', balanceInSats);
            }
          }
        } else if (typeof data.result === 'object' && data.result !== null) {
          // Handle Clarity value object format: {type: 'uint', value: '4662430196513'}
          console.log('🔍 Processing Clarity value object:', data.result);
          
          if (data.result.value !== undefined) {
            // Extract the value from the object
            const rawValue = data.result.value;
            console.log('🔍 Extracted raw value from object:', rawValue, 'Type:', typeof rawValue);
            
            if (typeof rawValue === 'string') {
              balanceInSats = parseInt(rawValue);
              console.log('🔍 Parsed string value to integer:', balanceInSats);
            } else if (typeof rawValue === 'number') {
              balanceInSats = rawValue;
              console.log('🔍 Used number value directly:', balanceInSats);
            } else {
              console.error('❌ Unexpected raw value type:', typeof rawValue, 'Value:', rawValue);
              balanceInSats = 0;
            }
          } else {
            console.error('❌ No value property in result object:', data.result);
            balanceInSats = 0;
          }
        } else {
          console.error('❌ Unexpected result type:', typeof data.result, 'Value:', data.result);
          balanceInSats = 0;
        }
        
        // Check if we have a valid number
        if (isNaN(balanceInSats)) {
          console.error('❌ Final balanceInSats is NaN, using 0 as fallback');
          balanceInSats = 0;
        }
        
        const balanceInTokens = balanceInSats / 100000000;
        const finalBalance = Math.floor(balanceInTokens); // Round down to nearest whole number
        
        console.log('✅ Token balance from contract:', {
          balanceInSats,
          balanceInTokens,
          finalBalance,
          userAddress: connectedAddress,
          isFinite: isFinite(finalBalance)
        });
        
        setUserTokenBalance(finalBalance);
      } else {
        console.error('❌ Failed to read token balance:', data.error || 'No result in response');
        console.log('🔍 Full response data:', data);
        // Fallback to trade-based calculation
        calculateUserTokenBalance();
      }

    } catch (error) {
      console.error('❌ Error reading token balance from contract:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      // Fallback to trade-based calculation
      calculateUserTokenBalance();
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

  // Fetch user sBTC balance for mainnet (using same logic as TradeHistory component)
  const fetchUserSatsBalance = async (retryCount = 0) => {
    try {
      console.log('🔍 fetchUserSatsBalance called', retryCount > 0 ? `(retry ${retryCount})` : '');
      const connectedAddress = localStorage.getItem('connectedAddress');
      console.log('🔍 connectedAddress:', connectedAddress);
      
      if (!connectedAddress) {
        console.log('🔍 No connected address, setting balance to 0');
        setUserSatsBalance(0);
        return;
      }

      // Only fetch for mainnet tokens (SP/SM addresses)
      const isMainnet = /^(SP|SM)/.test(connectedAddress);
      console.log('🔍 isMainnet check:', isMainnet, 'address:', connectedAddress);

      if (!isMainnet) {
        console.log('🔍 Not mainnet address, setting balance to 0');
        setUserSatsBalance(0);
        return;
      }

      // Use same API call as TradeHistory component with proper caching
      const url = `/api/mainnet-user-sats-balance?principal=${encodeURIComponent(connectedAddress)}&lastTx=baseline`;
      console.log('🔍 Making API call to:', url);
      
      const response = await fetch(url);
      console.log('🔍 API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 API response data:', data);
        
        if (data && typeof data.balance === 'number') {
          setUserSatsBalance(data.balance);
          console.log('✅ User sBTC balance updated:', data.balance);
        } else {
          console.log('❌ Invalid balance data, setting to 0. Data:', data);
          setUserSatsBalance(0);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API call failed with error:', errorText);
        console.error('❌ Response status:', response.status);
        
        // Retry logic for network errors
        if (retryCount < 2 && (response.status >= 500 || response.status === 0)) {
          console.log(`🔄 Retrying sBTC balance fetch (attempt ${retryCount + 1})...`);
          setTimeout(() => fetchUserSatsBalance(retryCount + 1), 2000 * (retryCount + 1));
          return;
        }
        
        setUserSatsBalance(0);
      }
    } catch (error) {
      console.error('❌ Error fetching user sBTC balance:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Retry logic for network errors
      if (retryCount < 2 && (error.message.includes('fetch') || error.message.includes('network'))) {
        console.log(`🔄 Retrying sBTC balance fetch due to network error (attempt ${retryCount + 1})...`);
        setTimeout(() => fetchUserSatsBalance(retryCount + 1), 2000 * (retryCount + 1));
        return;
      }
      
      setUserSatsBalance(0);
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

  // Listen for transaction events from UnlockProgressBar
  useEffect(() => {
    const handleTransactionPending = (event) => {
      console.log('🔄 Transaction pending:', event.detail);
      setPendingTransaction(true);
      setIsSuccessfulTransaction(false);
    };

    const handleTransactionSuccessful = (event) => {
      console.log('✅ Transaction successful:', event.detail);
      setPendingTransaction(false);
      setIsSuccessfulTransaction(true);
      
      // Refresh trades after successful transaction
      setTimeout(() => {
        refreshTrades();
      }, 2000); // Wait 2 seconds for blockchain to update
    };

    const handleTransactionFailed = (event) => {
      console.log('❌ Transaction failed:', event.detail);
      setPendingTransaction(false);
      setIsSuccessfulTransaction(false);
    };

    // Add event listeners
    window.addEventListener('transactionPending', handleTransactionPending);
    window.addEventListener('transactionSuccessful', handleTransactionSuccessful);
    window.addEventListener('transactionFailed', handleTransactionFailed);

    // Cleanup
    return () => {
      window.removeEventListener('transactionPending', handleTransactionPending);
      window.removeEventListener('transactionSuccessful', handleTransactionSuccessful);
      window.removeEventListener('transactionFailed', handleTransactionFailed);
    };
  }, []);

  // Poll access settings every 10 seconds to check if trading is disabled
  useEffect(() => {
    const checkTradingStatus = async () => {
      try {
        const response = await fetch('/api/access-settings');
        const data = await response.json();
        
        if (data.success && data.settings && tokenData) {
          // Determine which trading category this token belongs to
          let isTradingDisabled = false;
          
          if (tokenData.tabType === 'featured') {
            isTradingDisabled = data.settings.tokenTrading?.featured || false;
          } else if (tokenData.tabType === 'practice') {
            isTradingDisabled = data.settings.tokenTrading?.practice || false;
          } else {
            // Default to false for any other category
            isTradingDisabled = false;
          }
          
          // If trading is disabled, redirect to homepage
          if (isTradingDisabled) {
            console.log('🚫 Trading disabled for this token category, but not redirecting to prevent kick-out...');
            // router.push('/'); // Temporarily disabled to prevent kick-out
          }
        }
      } catch (error) {
        console.error('Error checking trading status:', error);
        // Don't redirect on error, just log it
      }
    };

    // Only start polling if we have token data and component is mounted
    if (tokenData && !loading) {
      // Check immediately
      checkTradingStatus();
      
      // Set up polling every 10 seconds
      pollIntervalRef.current = setInterval(checkTradingStatus, 10000);
    }

    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [tokenData, loading, router]);

  // Fetch user sBTC balance when tokenData changes
  useEffect(() => {
    console.log('🔍 useEffect triggered for fetchUserSatsBalance, tokenData:', tokenData);
    
    if (tokenData) {
      console.log('🔍 Calling fetchUserSatsBalance...');
      fetchUserSatsBalance();
    } else {
      console.log('🔍 No tokenData, skipping fetchUserSatsBalance');
    }
  }, [tokenData]);

  // Periodic refresh of sBTC balance (every 30 seconds)
  useEffect(() => {
    if (!tokenData) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Periodic sBTC balance refresh...');
      fetchUserSatsBalance();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [tokenData]);

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

  // Show loading state while token data is being fetched
  if (loading) {
    return (
      <>
        <Header />
        <main className="token-page">
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
            color: '#fff'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(255, 255, 255, 0.1)',
                borderTop: '3px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              Loading token data...
            </div>
          </div>
        </main>
      </>
    );
  }

  // Show error state if no token data found
  if (!tokenData) {
    return (
      <>
        <Header />
        <main className="token-page">
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
            color: '#fff'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '16px' }}>❌</div>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>Token Not Found</div>
              <div style={{ fontSize: '14px', opacity: 0.7 }}>
                Token "{tokenSymbol}" could not be found.
              </div>
            </div>
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

        <div className="main-layout" style={{ 
          display: 'flex', 
          justifyContent: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px'
        }}>
        {/* Centered content */}
        <div className="chart-section" style={{ width: '100%' }}>
          {/* Unlock Progress Bar Component */}
          {isHeaderVisible && (
            <UnlockProgressBar
              tokenSymbol={tokenData?.symbol || 'TOKEN'}
              revenue={revenue}
              liquidity={liquidity}
              showButtons={true}
              onShowContracts={() => setShowContracts(true)}
              onClaimRevenue={handleClaimRevenue}
              tokenId={tokenData.id}
      
              dexInfo={tokenData?.dexInfo}
              tokenInfo={tokenData?.tokenInfo}
              tokenBalance={userTokenBalance || '0'}
              holdingsSats={userSatsBalance || 0}
            />
          )}

          {/* Chart Component with Candlestick Options */}
          <Chart
            trades={trades}
            tradesPerCandle={tradesPerCandle}
            setTradesPerCandle={setTradesPerCandle}
            tradeLimit={tradeLimit}
            setTradeLimit={setTradeLimit}
            currentPrice={currentPrice}
            isHeaderVisible={isHeaderVisible}
            setIsHeaderVisible={setIsHeaderVisible}
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
                  // Determine network from contract address prefix
                  if (tokenData?.network) {
                    return tokenData.network;
                  }
                  
                  // Check DEX contract address first, then token contract address
                  const dexAddress = tokenData?.dexInfo?.split('.')?.[0];
                  const tokenAddress = tokenData?.tokenInfo?.split('.')?.[0];
                  const contractAddress = dexAddress || tokenAddress;
                  
                  if (contractAddress) {
                    if (contractAddress.startsWith('ST')) {
                      return 'testnet';
                    } else if (contractAddress.startsWith('SP')) {
                      return 'mainnet';
                    }
                  }
                  
                  // Fallback to tabType if no contract address available
                  if (tokenData?.tabType === 'practice') {
                    return 'testnet';
                  }
                  if (tokenData?.tabType === 'featured') {
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
                SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
              </div>
              <button 
                onClick={() => handleContractCopy('SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token', 'sbtc')}
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



