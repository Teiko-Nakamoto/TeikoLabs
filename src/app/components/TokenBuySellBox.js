'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { request } from '@stacks/connect';
import { uintCV, Pc, postConditionToHex } from '@stacks/transactions';
import TransactionToast from './TransactionToast';
import { getUserSatsBalance, getTokenUserBalance, calculateTokenEstimatedTokensForSats, calculateTokenEstimatedSatsForTokens, getTokenCurrentPrice, getTokenLiquidityBalance, getTokenTotalBalance, getTokenLockedBalance, getTokenStatsData, getTokenDexBalances } from '../utils/fetchTokenData';

import ProfitLoss from './ProfitLoss';
import TokenStats from './TokenStats';
import './BuySellBox.css';

// Network health check function
async function checkNetworkHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://api.testnet.hiro.so/v2/info', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('🚨 Network check failed:', error.message);
    return false;
  }
}

const TokenBuySellBox = React.memo(function TokenBuySellBox({ 
  tab, 
  setTab, 
  amount, 
  setAmount, 
  refreshTrades, 
  setPendingTransaction, 
  setIsSuccessfulTransaction, 
  trades, 
  activeSection, 
  setActiveSection, 
  revenue, 
  liquidity, 
  remainingSupply,
  tokenData, // Required for token-specific trading
  onCurrentPriceChange // Callback to pass current price to parent
}) {
  // Restore tab selection from localStorage on component mount
  useEffect(() => {
    const savedTab = localStorage.getItem('selectedTab');
    if (savedTab && (savedTab === 'buy' || savedTab === 'sell')) {
      setTab(savedTab);
    }
  }, [setTab]);

  // Save tab selection to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectedTab', tab);
  }, [tab]);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isNetworkRetry, setIsNetworkRetry] = useState(false);
  const [isDuplicateError, setIsDuplicateError] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [estimatedSats, setEstimatedSats] = useState(0);
  const [estimatedTokens, setEstimatedTokens] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceSnapshot, setPriceSnapshot] = useState(null);
  
  // Cache for price data to prevent unnecessary API calls
  const [priceCache, setPriceCache] = useState({
    lastFetch: 0,
    lastPrice: 0,
    lastTokenData: null
  });
  
  // Cache for balance data to prevent unnecessary API calls
  const [balanceCache, setBalanceCache] = useState({
    lastFetch: 0,
    lastBalance: 0,
    lastTab: null,
    lastTokenData: null
  });
  
  // Slippage protection state
  const [slippageEnabled, setSlippageEnabled] = useState(false);
  const [slippage, setSlippage] = useState(5); // Default 5%
  const [showCustomSlippage, setShowCustomSlippage] = useState(false);
  const [customSlippage, setCustomSlippage] = useState('');

  const [toast, setToast] = useState({ message: '', txId: '', visible: false, status: 'pending' });
  const [useNetworkPrecheck, setUseNetworkPrecheck] = useState(() => {
    // Get saved preference or default to true
    const saved = localStorage.getItem('useNetworkPrecheck');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save network precheck preference whenever it changes
  useEffect(() => {
    localStorage.setItem('useNetworkPrecheck', JSON.stringify(useNetworkPrecheck));
  }, [useNetworkPrecheck]);

  // Pass current price to parent component when it changes
  useEffect(() => {
    if (onCurrentPriceChange && typeof currentPrice === 'number') {
      onCurrentPriceChange(currentPrice);
    }
  }, [currentPrice, onCurrentPriceChange]);

  // Continuous price updates every 10 seconds with intelligent caching
  useEffect(() => {
    if (!tokenData) return;

    const updatePrice = async () => {
      try {
        const now = Date.now();
        const cacheAge = now - priceCache.lastFetch;
        const cacheValid = cacheAge < 5000; // Cache valid for 5 seconds
        
        // Check if we can use cached data
        if (cacheValid && priceCache.lastTokenData === tokenData.dexInfo && priceCache.lastPrice > 0) {
          console.log('✅ Using cached price data (age:', Math.round(cacheAge / 1000), 's):', priceCache.lastPrice);
          return;
        }
        
        console.log('🔄 Fetching fresh price data...');
        const price = await getTokenCurrentPrice(tokenData);
        
        // Only update state if price has actually changed (with small tolerance for floating point precision)
        const priceDifference = Math.abs(price - currentPrice);
        const tolerance = 0.00000001; // 8 decimal places tolerance
        
        if (priceDifference > tolerance) {
          console.log('🔄 Price updated:', { old: currentPrice, new: price, difference: priceDifference });
          setCurrentPrice(price);
          
          // Update cache
          setPriceCache({
            lastFetch: now,
            lastPrice: price,
            lastTokenData: tokenData.dexInfo
          });
        } else {
          console.log('✅ Price unchanged, updating cache only:', price);
          
          // Update cache even if price didn't change
          setPriceCache({
            lastFetch: now,
            lastPrice: price,
            lastTokenData: tokenData.dexInfo
          });
        }
      } catch (error) {
        console.error('Error updating current price:', error);
        // Don't reset to 0, keep the last known price
      }
    };

    // Initial price fetch
    updatePrice();

    // Set up interval for continuous updates
    const interval = setInterval(updatePrice, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [tokenData, currentPrice, priceCache]);

  // Function to fetch recent DEX transactions
  const fetchRecentDexTransactions = async () => {
    try {
      if (!tokenData || !tokenData.dexInfo) {
        console.error('❌ Token data or dexInfo not available for transaction fetch');
        return;
      }

      // Use the actual DEX contract address from token data
      const dexContractId = tokenData.dexInfo;
      const apiUrl = 'https://api.testnet.hiro.so'; // Change to mainnet for production
      
      console.log('🔍 Fetching recent transactions for DEX:', dexContractId);
      
      const response = await fetch(
        `${apiUrl}/extended/v1/tx/?contract_id=${dexContractId}&limit=21&sort_by=block_height&order=desc`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('📊 Recent DEX Transactions:', {
        total: data.total,
        limit: data.limit,
        offset: data.offset,
        contractId: dexContractId
      });
      
             console.log('🔄 Transaction Details:');
       data.results.forEach((tx, index) => {
         console.log(`\n--- Transaction ${index + 1} ---`);
         console.log('TX ID:', tx.tx_id);
         console.log('Status:', tx.tx_status);
         console.log('Block Height:', tx.block_height);
         console.log('Block Time:', tx.block_time_iso);
         console.log('Sender:', tx.sender_address);
         console.log('Function Name:', tx.contract_call?.function_name || 'N/A');
         console.log('Contract Called:', tx.contract_call?.contract_id || 'N/A');
         
         // Extract input amount from function arguments
         if (tx.contract_call?.function_args && tx.contract_call.function_args.length > 0) {
           const inputArg = tx.contract_call.function_args[0];
           if (inputArg && inputArg.repr) {
             const inputAmount = inputArg.repr.replace('u', ''); // Remove 'u' prefix
             console.log('Input Amount (sats):', parseInt(inputAmount).toLocaleString());
             
             // Calculate estimated output based on function type
             if (tx.contract_call.function_name === 'buy') {
               console.log('Transaction Type: BUY (sats → tokens)');
               console.log('Input:', parseInt(inputAmount).toLocaleString(), 'sats');
               // Output would be tokens, but we need to calculate this
             } else if (tx.contract_call.function_name === 'sell') {
               console.log('Transaction Type: SELL (tokens → sats)');
               console.log('Input:', parseInt(inputAmount).toLocaleString(), 'tokens (in micro units)');
               console.log('Input (actual tokens):', (parseInt(inputAmount) / 1e8).toLocaleString(), 'tokens');
             }
           }
         }
         
         console.log('Events Count:', tx.event_count);
         
         // Show events with more detail
         if (tx.events && tx.events.length > 0) {
           console.log('Events:');
           tx.events.forEach((event, eventIndex) => {
             console.log(`  Event ${eventIndex + 1}:`, {
               type: event.event_type,
               data: event.event_data
             });
           });
         }
         
         if (tx.tx_result) {
           console.log('Transaction Result:', tx.tx_result);
         }
       });
      
      console.log('\n✅ DEX transaction fetch completed');
      
    } catch (error) {
      console.error('❌ Error fetching DEX transactions:', error);
    }
  };

  // Function to fetch and store price calculation snapshot
  const fetchPriceSnapshot = async () => {
    try {
      const [dexBalances, lockedTokens] = await Promise.all([
        getTokenDexBalances(tokenData),
        getTokenLockedBalance(tokenData)
      ]);
      
      // Calculate derived values
      const virtualSbtc = 1500000; // 1.5M sats virtual liquidity
      const availableTokens = dexBalances.tokenBalance; // Use actual DEX token balance
      const calculatedPrice = (dexBalances.sbtcBalance + virtualSbtc) / availableTokens;
      
      setPriceSnapshot({
        sbtcBalance: dexBalances.sbtcBalance,
        totalTokens: dexBalances.tokenBalance, // Use DEX token balance as total
        lockedTokens,
        virtualSbtc,
        availableTokensFormatted: availableTokens,
        totalTokensFormatted: dexBalances.tokenBalance,
        lockedTokensFormatted: lockedTokens,
        calculatedPrice,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error fetching price snapshot:', error);
    }
  };

  const handleOpenPriceModal = async () => {
    await fetchPriceSnapshot();
    setShowPriceModal(true);
  };

  const handleClosePriceModal = () => {
    setShowPriceModal(false);
  };

  // Fetch user balance with intelligent caching
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const now = Date.now();
        const cacheAge = now - balanceCache.lastFetch;
        const cacheValid = cacheAge < 30000; // Cache valid for 30 seconds
        
        // Check if we can use cached balance data
        if (cacheValid && 
            balanceCache.lastTab === tab && 
            balanceCache.lastTokenData === tokenData?.dexInfo && 
            balanceCache.lastBalance > 0) {
          console.log('✅ Using cached balance data (age:', Math.round(cacheAge / 1000), 's):', balanceCache.lastBalance);
          setUserBalance(balanceCache.lastBalance);
          return;
        }
        
        console.log('🔄 Fetching fresh balance data...');
        let newBalance = 0;
        
        if (tab === 'sell') {
          newBalance = await getTokenUserBalance(tokenData);
        } else {
          newBalance = await getUserSatsBalance();
        }
        
        // Only update if balance has changed significantly
        const balanceDifference = Math.abs(newBalance - userBalance);
        const tolerance = 0.00000001; // Small tolerance for floating point precision
        
        if (balanceDifference > tolerance) {
          console.log('🔄 Balance updated:', { old: userBalance, new: newBalance, difference: balanceDifference });
          setUserBalance(newBalance);
        } else {
          console.log('✅ Balance unchanged:', newBalance);
        }
        
        // Update cache
        setBalanceCache({
          lastFetch: now,
          lastBalance: newBalance,
          lastTab: tab,
          lastTokenData: tokenData?.dexInfo
        });
        
      } catch (error) {
        console.error('Error fetching balance:', error);
        setUserBalance(0);
      }
    };

    fetchBalance();
  }, [tokenData, tab, balanceCache, userBalance]);

  // Fetch recent DEX transactions (separate from balance fetching)
  useEffect(() => {
    if (tokenData?.dexInfo) {
      fetchRecentDexTransactions();
    }
  }, [tokenData?.dexInfo]); // Only run when tokenData.dexInfo changes

  const calculateEstimates = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setEstimatedSats(0);
      setEstimatedTokens(0);
      return;
    }

    try {
      if (tab === 'buy') {
        const newEstimatedTokens = await calculateTokenEstimatedTokensForSats(parseInt(amount), tokenData);
        const newEstimatedSats = parseInt(amount);
        
        // Only update if values have changed
        if (Math.abs(newEstimatedTokens - estimatedTokens) > 0.00000001) {
          setEstimatedTokens(newEstimatedTokens);
        }
        if (Math.abs(newEstimatedSats - estimatedSats) > 0.00000001) {
          setEstimatedSats(newEstimatedSats);
        }
      } else {
        const newEstimatedSats = await calculateTokenEstimatedSatsForTokens(parseFloat(amount), tokenData);
        const newEstimatedTokens = parseFloat(amount);
        
        // Only update if values have changed
        if (Math.abs(newEstimatedSats - estimatedSats) > 0.00000001) {
          setEstimatedSats(newEstimatedSats);
        }
        if (Math.abs(newEstimatedTokens - estimatedTokens) > 0.00000001) {
          setEstimatedTokens(newEstimatedTokens);
        }
      }
    } catch (error) {
      console.error('Error calculating estimates:', error);
    }
  };

  useEffect(() => {
    calculateEstimates();
  }, [amount, tab, tokenData]);

  const handleCloseToast = () => {
    setToast({ message: '', txId: '', visible: false, status: 'pending' });
  };

  const handleRetry = () => {
    handleClick();
  };

  const setAmountPercent = (percent) => {
    if (tab === 'buy') {
      // For buy, use sats balance
      const maxSats = userBalance * currentPrice;
      const amount = (maxSats * percent) / 100;
      setAmount(Math.floor(amount).toString());
    } else {
      // For sell, use token balance
      const amount = (userBalance * percent) / 100;
      setAmount(amount.toString());
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit decimal places to 8
    if (parts.length === 2 && parts[1].length > 8) {
      return;
    }
    
    setAmount(cleanValue);
  };

  const handleClick = async () => {
    // Remove commas before processing
    const cleanAmount = amount.replace(/,/g, '');
    
    if (!cleanAmount || isNaN(cleanAmount) || Number(cleanAmount) <= 0) {
      setIsNetworkRetry(false);
      setError('Please enter a valid amount');
      return;
    }

    if (!tokenData || !tokenData.dexInfo) {
      setError('Token contract information not available');
      return;
    }

    setError(null);
    setIsNetworkRetry(false);
    setIsDuplicateError(false);
    
    // Network precheck before attempting transaction
    if (useNetworkPrecheck) {
      console.log('🔍 Checking network health before transaction...');
      setIsNetworkRetry(true);
      setError('Checking network connectivity...');
      
      const isNetworkHealthy = await checkNetworkHealth();
      
      if (!isNetworkHealthy) {
        setError('Network connectivity issues detected. Refreshing in 5 seconds...');
        setTimeout(() => {
          setError(null);
          setIsNetworkRetry(false);
          handleClick(); // Retry the transaction
        }, 5000);
        return;
      }
      
      console.log('✅ Network healthy - proceeding with transaction');
      setError(null);
      setIsNetworkRetry(false);
    }
    
    setLoading(true);

    // Scroll down slightly to show trade history better
    setTimeout(() => {
      window.scrollTo({
        top: window.scrollY + 200,
        behavior: 'smooth'
      });
    }, 100);

    // Set pending transaction data
    const transactionData = {
      type: tab,
      amount: cleanAmount,
      satsAmount: tab === 'buy' ? parseInt(cleanAmount) : null,
      estimatedSats: tab === 'sell' ? estimatedSats : null,
      timestamp: new Date().toISOString()
    };
    setPendingTransaction(transactionData);

    // Calculate both current price and slippage-adjusted expected price
    const currentPriceAtTrade = currentPrice;
    let expectedPriceAtTrade = currentPrice;
    
    if (slippageEnabled && slippage > 0) {
      const slippagePercent = slippage / 100;
      if (tab === 'sell') {
        expectedPriceAtTrade = currentPrice * (1 - slippagePercent);
      } else {
        expectedPriceAtTrade = currentPrice * (1 + slippagePercent);
      }
    }
    
    console.log('📊 Price data at trade initiation:');
    console.log('  Current market price:', currentPriceAtTrade);
    console.log('  Expected price (with slippage):', expectedPriceAtTrade);
    console.log('  Slippage tolerance:', slippage + '%');
    
    // Handle duplicate detection callback
    const handleDuplicate = () => {
      setLoading(false);
      setIsSuccessfulTransaction(false);
      setPendingTransaction(null);
      setIsDuplicateError(true);
      setIsNetworkRetry(true);
      setError('Duplicate wallet popup detected. New wallet popup will come after page refresh.');
      
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    };

    // Get connected wallet address for post conditions
    const connectedAddress = localStorage.getItem('connectedAddress');

    // Create slippage protection parameters
    const slippageProtectionParams = slippageEnabled ? {
      enabled: true,
      tolerance: slippage,
      userAddress: connectedAddress
    } : null;
    
    console.log('🛡️ Slippage protection params:', slippageProtectionParams);

    // Pass the appropriate estimated output based on trade type
    const estimatedOutput = tab === 'buy' ? estimatedTokens : estimatedSats;
    
    console.log('🔍 TokenBuySellBox Debug:');
    console.log('  Original amount:', amount);
    console.log('  Clean amount:', cleanAmount);
    console.log('  Tab:', tab);
    console.log('  Slippage enabled:', slippageEnabled);
    console.log('  Estimated output:', estimatedOutput);
    console.log('  Token specific:', true);
    console.log('  Token data:', tokenData);
    console.log('  DEX Contract:', tokenData.dexInfo);
    
    try {
      // 🔧 Enhanced wallet readiness check before transaction
      console.log('🔍 Checking wallet readiness before transaction...');
      
      // Check if Stacks Connect is available
      if (typeof window === 'undefined' || !window.StacksProvider) {
        throw new Error('Stacks Connect not available. Please refresh the page and try again.');
      }

      // Check if user is connected
      const { isConnected, getLocalStorage } = await import('@stacks/connect');
      const connected = await isConnected();
      
      if (!connected) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      // Verify we have a valid address
      const data = getLocalStorage();
      const stxAddr = data?.addresses?.stx?.[0]?.address;
      
      if (!stxAddr) {
        throw new Error('No wallet address found. Please reconnect your wallet.');
      }

      // Check if connection is recent (within last 5 minutes)
      const lastConnectionTime = localStorage.getItem('lastConnectionTime');
      if (lastConnectionTime) {
        const timeSinceConnection = Date.now() - parseInt(lastConnectionTime);
        if (timeSinceConnection > 5 * 60 * 1000) { // 5 minutes
          console.log('⚠️ Connection may be stale, requesting reconnection...');
          throw new Error('Connection stale. Please reconnect your wallet.');
        }
      }

      console.log('✅ Wallet ready for transaction:', stxAddr);

      // Use token-specific contract addresses
      const dexContractAddress = tokenData.dexInfo.split('.')[0];
      const dexContractName = tokenData.dexInfo.split('.')[1];
      
      const functionName = tab === 'buy' ? 'buy' : 'sell';
      const satsTraded = tab === 'buy' ? parseInt(cleanAmount) : Math.round(parseFloat(cleanAmount) * 1e8);
      const functionArgs = [uintCV(satsTraded)];

      // 🧪 CREATE POST CONDITIONS for slippage protection
      let postConditions = [];
      const postConditionMode = slippageEnabled && slippageProtectionParams ? 'deny' : 'allow';

      if (slippageEnabled && slippageProtectionParams && slippageProtectionParams.userAddress && slippageProtectionParams.tolerance > 0) {
        console.log('🛡️ Creating slippage protection post conditions...');
        
        if (tab === 'buy') {
          // For BUY: User sends exact sats, should receive minimum tokens (accounting for slippage)
          const slippagePercent = slippageProtectionParams.tolerance / 100;
          const minExpectedTokens = Math.floor(estimatedOutput * (1 - slippagePercent));
          
          // 🛡️ CONDITION 1: User sends exact SBTC amount
          const userSendsSbtcCondition = Pc.principal(slippageProtectionParams.userAddress)
            .willSendEq(satsTraded)
            .ft('ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token', 'sbtc-token');
          
          // 🛡️ CONDITION 2: DEX contract sends at least minimum tokens to user (slippage protection!)
          const contractSendsTokensCondition = Pc.principal(`${dexContractAddress}.${dexContractName}`)
            .willSendGte(minExpectedTokens)
            .ft(`${dexContractAddress}.${tokenData.symbol}`, tokenData.symbol);
          
          postConditions.push(
            postConditionToHex(userSendsSbtcCondition),
            postConditionToHex(contractSendsTokensCondition)
          );
          
          console.log('🛡️ BUY post conditions:');
          console.log('  1. User sends exactly', satsTraded, 'SBTC tokens');
          console.log('  2. Contract sends at least', minExpectedTokens, 'tokens (with', slippageProtectionParams.tolerance + '% slippage protection)');
          console.log('  3. UI estimated:', estimatedOutput, 'tokens, protected minimum:', minExpectedTokens, 'tokens');
          
        } else {
          // SELL: User sends exact tokens, should receive minimum sats (accounting for slippage)
          const slippagePercent = slippageProtectionParams.tolerance / 100;
          const minExpectedSbtc = Math.floor(estimatedOutput * (1 - slippagePercent));
          
          // 🛡️ CONDITION 1: User sends exact tokens
          const userSendsTokensCondition = Pc.principal(slippageProtectionParams.userAddress)
            .willSendEq(satsTraded)
            .ft(`${dexContractAddress}.${tokenData.symbol}`, tokenData.symbol);
          
          // 🛡️ CONDITION 2: DEX contract sends at least minimum SBTC to user (slippage protection!)
          const contractSendsSbtcCondition = Pc.principal(`${dexContractAddress}.${dexContractName}`)
            .willSendGte(minExpectedSbtc)
            .ft('ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token', 'sbtc-token');
          
          postConditions.push(
            postConditionToHex(userSendsTokensCondition),
            postConditionToHex(contractSendsSbtcCondition)
          );
          
          console.log('🛡️ SELL post conditions:');
          console.log('  1. User sends exactly', satsTraded, 'tokens (base units)');
          console.log('  2. Contract sends at least', minExpectedSbtc, 'SBTC (with', slippageProtectionParams.tolerance + '% slippage protection)');
          console.log('  3. UI estimated:', estimatedOutput, 'SBTC, protected minimum:', minExpectedSbtc, 'SBTC');
        }
      }

      console.log('🚀 About to send token-specific request with:', {
        contract: `${dexContractAddress}.${dexContractName}`,
        functionName,
        functionArgs,
        postConditionMode,
        postConditions: postConditions.length,
        network: 'testnet',
        tokenSpecific: true,
        slippageEnabled: slippageEnabled
      });

      // 🔧 Enhanced transaction submission with retry logic
      let response = null;
      let lastError = null;
      const maxRetries = 2;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🚀 Submitting transaction (attempt ${attempt + 1}/${maxRetries + 1})...`);
          
          // Add a small delay between retries
          if (attempt > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          response = await request('stx_callContract', {
            contract: `${dexContractAddress}.${dexContractName}`,
            functionName,
            functionArgs,
            postConditionMode,
            postConditions,
            network: 'testnet',
          });
          
          console.log('✅ Transaction submitted successfully:', response);
          break; // Success, exit retry loop
          
        } catch (error) {
          lastError = error;
          console.error(`❌ Transaction attempt ${attempt + 1} failed:`, error.message);
          
          // Don't retry on certain errors
          if (error.message.includes('User rejected') || 
              error.message.includes('cancelled') ||
              error.message.includes('not connected')) {
            throw error;
          }
          
          // Wait before retry
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      if (!response) {
        throw lastError || new Error('Transaction failed after all retries');
      }
      
      console.log('✅ Request completed, response:', response);

      const { txid: txId } = response;
      const formattedTxId = `0x${txId}`;

      // Check for duplicate transaction
      const lastTx = localStorage.getItem('lastTx');
      if (lastTx === formattedTxId) {
        console.warn('⚠️ Duplicate transaction detected.');
        handleDuplicate();
        return;
      }
      localStorage.setItem('lastTx', formattedTxId);

      console.log('View transaction:', `https://explorer.hiro.so/txid/${formattedTxId}?chain=testnet`);

      setToast({
        message: `🔄 ${tab.toUpperCase()} transaction submitted`,
        txId: formattedTxId,
        visible: true,
        status: 'pending',
      });

      // Wait for confirmation
      const confirmedData = await waitForConfirmation(txId);

      if (confirmedData.tx_status !== 'success') {
        console.log('❌ Transaction failed:', txId);
        setToast({
          message: `❌ ${tab.toUpperCase()} transaction failed`,
          txId: formattedTxId,
          visible: true,
          status: 'error',
        });
        setLoading(false);
        setIsSuccessfulTransaction(false);
        setPendingTransaction(null);
        return;
      }

      console.log('✅ Transaction confirmed:', txId);
      setToast({
        message: `✅ ${tab.toUpperCase()} transaction confirmed!`,
        txId: formattedTxId,
        visible: true,
        status: 'success',
      });

      setLoading(false);
      setIsSuccessfulTransaction(true);
      setPendingTransaction(null);
      
      if (refreshTrades) await refreshTrades();

    } catch (error) {
      console.error('❌ Transaction error:', error);
      setLoading(false);
      setIsSuccessfulTransaction(false);
      setPendingTransaction(null);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Transaction failed';
      
      if (error.message.includes('not connected')) {
        errorMessage = 'Please connect your wallet first';
      } else if (error.message.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled';
      } else if (error.message.includes('Connection stale')) {
        errorMessage = 'Please reconnect your wallet';
      } else if (error.message.includes('insufficient balance')) {
        errorMessage = 'Insufficient balance for transaction';
      } else if (error.message.includes('Stacks Connect not available')) {
        errorMessage = 'Wallet not ready. Please refresh the page and try again';
      } else if (error.message.includes('No wallet address found')) {
        errorMessage = 'Wallet connection issue. Please reconnect your wallet';
      } else {
        errorMessage = error.message || 'Transaction failed';
      }
      
      setError(errorMessage);
      
      // Show error toast
      setToast({
        message: `❌ ${tab.toUpperCase()} transaction failed`,
        txId: '',
        visible: true,
        status: 'failed',
      });
      
      if (useNetworkPrecheck) {
        console.log('🔄 Network connectivity issues - checking and retrying...');
        setIsNetworkRetry(true);
        setError('Network connectivity issues refreshing in 3 seconds...');
        setTimeout(async () => {
          const isHealthy = await checkNetworkHealth();
          if (isHealthy) {
            console.log('✅ Network recovered - retrying transaction...');
            setError('Network recovered. Retrying...');
            setTimeout(() => {
              setError(null);
              setIsNetworkRetry(false);
              handleClick();
            }, 1000);
          } else {
            setError('Connectivity issues persist. Refreshing again in 5 seconds...');
            setTimeout(() => {
              setError(null);
              setIsNetworkRetry(false);
              handleClick();
            }, 5000);
          }
        }, 3000);
      } else {
        setIsNetworkRetry(false);
        setError('Transaction failed. Please try again.');
      }
    }
  };

  // Wait for transaction confirmation
  const waitForConfirmation = async (txId, timeout = 60000, interval = 3000) => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`https://api.testnet.hiro.so/extended/v1/tx/${txId}`);
        const data = await response.json();
        
        if (data.tx_status === 'success' || data.tx_status === 'abort_by_response') {
          return data;
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        console.error('Error checking transaction status:', error);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    throw new Error('Transaction confirmation timeout');
  };

  return (
    <div className="buy-sell-box">
      {toast.visible && (
        <TransactionToast 
          message={toast.message} 
          txId={toast.txId} 
          onClose={handleCloseToast} 
          status={toast.status}
          onRetry={handleRetry}
        />
      )}

      <div className={`buy-sell-content ${tab === 'sell' ? 'sell-mode' : ''}`}>
        {/* Navigation buttons inside the card */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveSection(activeSection === 'buysell' ? null : 'buysell')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: activeSection === 'buysell' || !activeSection ? '#2563eb' : '#e5e7eb',
              color: activeSection === 'buysell' || !activeSection ? 'white' : '#111827',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t('buy_sell')}
          </button>
          <button
            onClick={() => setActiveSection(activeSection === 'profit' ? null : 'profit')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: activeSection === 'profit' ? '#2563eb' : '#e5e7eb',
              color: activeSection === 'profit' ? 'white' : '#111827',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t('profit_loss')}
          </button>
          <button
            onClick={() => setActiveSection(activeSection === 'stats' ? null : 'stats')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: activeSection === 'stats' ? '#2563eb' : '#e5e7eb',
              color: activeSection === 'stats' ? 'white' : '#111827',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t('token_stats')}
          </button>
        </div>

        {/* Show Buy/Sell interface when Buy/Sell is selected or no section is selected */}
        {(activeSection === 'buysell' || !activeSection) && (
          <>
            <div className="tab-row">
              <button
                className={`tab-button active ${tab === 'buy' ? 'buy' : ''}`}
                onClick={() => {
                  setTab('buy');
                  setAmount('');
                  setError(null);
                }}
              >
                {t('buy')}
              </button>
              <button
                className={`tab-button active ${tab === 'sell' ? 'sell' : ''}`}
                onClick={() => {
                  setTab('sell');
                  setAmount('');
                  setError(null);
                }}
              >
                {t('sell')}
              </button>
            </div>

            {/* Current Price Display */}
            {currentPrice > 0 && (
              <div className="price-display-section" style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Current Price
                  </div>
                  <button 
                    onClick={handleOpenPriceModal}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      color: '#2563eb',
                      fontSize: '10px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#e2e8f0';
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#f1f5f9';
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    Learn More ❓
                  </button>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                  {currentPrice.toFixed(8)}
                </div>
              </div>
            )}

            <div className="current-balance">
          {tab === 'sell' ? (
            <>
              <div style={{ marginBottom: '8px' }}>
                {t('holdings')}: {Math.floor(userBalance).toLocaleString()}{" "}
                <img 
                  src="/icons/The Mas Network.svg" 
                  alt="MAS Sats" 
                  style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
                />
              </div>
              {slippageEnabled ? (
                <>
                  <div>
                    Max to receive:{" "}
                    {Math.floor(estimatedSats).toLocaleString()}{" "}
                    <img 
                      src="/icons/sats1.svg" 
                      alt="sats" 
                      style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '2px' }}
                    />
                    <img 
                      src="/icons/Vector.svg" 
                      alt="lightning" 
                      style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
                    />
                  </div>


                </>
              ) : (
                <div>
                  {t('estimated_receive')}:{" "}
                  {Math.floor(estimatedSats).toLocaleString()}{" "}
                  <img 
                    src="/icons/sats1.svg" 
                    alt="sats" 
                    style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '2px' }}
                  />
                  <img 
                    src="/icons/Vector.svg" 
                    alt="lightning" 
                    style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ marginBottom: '8px' }}>
                {t('holdings')}:{" "}
                {userBalance.toLocaleString()}{" "}
                <img 
                  src="/icons/sats1.svg" 
                  alt="SATS" 
                  style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '2px' }}
                />
                <img 
                  src="/icons/Vector.svg" 
                  alt="lightning" 
                  style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
                />
              </div>
              {slippageEnabled ? (
                <>
                  <div>
                    Max to receive:{" "}
                    {Math.floor(estimatedTokens).toLocaleString()}{" "}
                    <img 
                      src="/icons/The Mas Network.svg" 
                      alt="MAS Sats" 
                      style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
                    />
                  </div>


                </>
              ) : (
                <div>
                  {t('estimated_receive')}:{" "}
                  {Math.floor(estimatedTokens).toLocaleString()}{" "}
                  <img 
                    src="/icons/The Mas Network.svg" 
                    alt="MAS Sats" 
                    style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <label htmlFor="amount-input" className="input-label">
          {tab === 'buy' ? (
            <>
              {t('buy_in')}
              <img 
                src="/icons/sats1.svg" 
                alt="SATS" 
                style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginLeft: '4px', marginRight: '2px' }}
              />
              <img 
                src="/icons/Vector.svg" 
                alt="lightning" 
                style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
              />
            </>
          ) : (
            t('amount_to_sell')
          )}
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="amount-input"
            type="text"
            placeholder="0"
            value={amount}
            onChange={handleAmountChange}
            className="sats-input"
            disabled={loading}
          />
          {tab === 'buy' ? (
            <>
              <img 
                src="/icons/sats1.svg" 
                alt="sats" 
                style={{ 
                  position: 'absolute', 
                  right: '20px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  width: '16px', 
                  height: '16px',
                  pointerEvents: 'none'
                }}
              />
              <img 
                src="/icons/Vector.svg" 
                alt="lightning" 
                style={{ 
                  position: 'absolute', 
                  right: '4px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  width: '16px', 
                  height: '16px',
                  pointerEvents: 'none'
                }}
              />
            </>
          ) : (
            <img 
              src="/icons/The Mas Network.svg" 
              alt="MAS Sats" 
              style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                width: '16px', 
                height: '16px',
                pointerEvents: 'none'
              }}
            />
          )}
        </div>

        <div className="quick-buttons">
          {[20, 50, 75, 100].map((percent) => (
            <button
              key={percent}
              onClick={() => setAmountPercent(percent)}
              className={`quick-button ${tab === 'sell' ? 'sell' : ''}`}
            >
              {percent}%
            </button>
          ))}
        </div>

        {/* Slippage Protection Settings */}
        <div style={{ marginTop: '16px', marginBottom: '16px' }}>
          {/* Slippage Toggle */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '12px',
            padding: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <input
              type="checkbox"
              id="slippage-toggle"
              checked={slippageEnabled}
              onChange={(e) => setSlippageEnabled(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <label htmlFor="slippage-toggle" style={{ 
              fontSize: '14px', 
              color: '#ffffff',
              cursor: 'pointer',
              flex: 1
            }}>
              🛡️ Swap Price Protection
            </label>
            {slippageEnabled && (
              <span style={{ 
                fontSize: '12px', 
                color: '#10b981',
                fontWeight: 'bold'
              }}>
                {slippage}%
              </span>
            )}
          </div>

          {/* Slippage Preset Buttons */}
          {slippageEnabled && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ 
                fontSize: '12px', 
                color: '#ffffff', 
                marginBottom: '6px' 
              }}>
                Slippage Tolerance:
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[5, 10, 20, 50].map(percent => (
                  <button
                    key={percent}
                    onClick={() => {
                      setSlippage(percent);
                      setShowCustomSlippage(false);
                      setCustomSlippage('');
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: slippage === percent ? '2px solid #eab308' : '1px solid #6b7280',
                      backgroundColor: '#374151',
                      color: '#eab308',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    {percent}%
                  </button>
                ))}
                <button
                  onClick={() => {
                    setShowCustomSlippage(true);
                    setCustomSlippage(slippage.toString());
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: showCustomSlippage ? '2px solid #eab308' : '1px solid #6b7280',
                    backgroundColor: '#374151',
                    color: '#eab308',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}
                >
                  Custom
                </button>
              </div>
            </div>
          )}

          {/* Custom Slippage Input */}
          {slippageEnabled && showCustomSlippage && (
            <div style={{ marginTop: '8px' }}>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                placeholder="Enter custom %"
                value={customSlippage}
                onChange={(e) => {
                  setCustomSlippage(e.target.value);
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    setSlippage(value);
                  }
                }}
                style={{
                  width: '100px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px'
                }}
              />
              <span style={{ 
                marginLeft: '4px', 
                fontSize: '12px', 
                color: '#6b7280' 
              }}>
                %
              </span>
            </div>
          )}
        </div>

        {/* Slippage Price Information */}
        {slippageEnabled && slippage > 0 && (
          <div style={{ 
            marginBottom: '12px',
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '12px', color: '#ffffff', marginBottom: '4px', fontWeight: '600' }}>
              {tab === 'sell' ? 'Minimum Sell Price:' : 'Maximum Buy Price:'}
            </div>
            <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: '600' }}>
              {tab === 'sell' 
                ? (currentPrice * (1 - slippage / 100)).toFixed(8)
                : (currentPrice * (1 + slippage / 100)).toFixed(8)
              }{" "}
              <img 
                src="/icons/sats1.svg" 
                alt="sats" 
                style={{ width: '12px', height: '12px', verticalAlign: 'middle', marginRight: '1px' }}
              />
              <img 
                src="/icons/Vector.svg" 
                alt="lightning" 
                style={{ width: '12px', height: '12px', verticalAlign: 'middle' }}
              />
              {" "}/ {" "}
              <img 
                src="/icons/The Mas Network.svg" 
                alt="MAS Sats" 
                style={{ width: '12px', height: '12px', verticalAlign: 'middle' }}
              />
            </div>
          </div>
        )}

        {/* Min Guaranteed Amount */}
        {slippageEnabled && slippage > 0 && (
          <div style={{ 
            marginBottom: '16px',
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: '600' }}>
              Minimum to Receive:{" "}
              {tab === 'sell' ? (
                <>
                  {Math.floor(estimatedSats * (1 - slippage / 100)).toLocaleString()}{" "}
                  <img 
                    src="/icons/sats1.svg" 
                    alt="sats" 
                    style={{ width: '14px', height: '14px', verticalAlign: 'middle', marginRight: '2px' }}
                  />
                  <img 
                    src="/icons/Vector.svg" 
                    alt="lightning" 
                    style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
                  />
                </>
              ) : (
                <>
                  {Math.floor(estimatedTokens * (1 - slippage / 100)).toLocaleString()}{" "}
                  <img 
                    src="/icons/The Mas Network.svg" 
                    alt="MAS Sats" 
                    style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
                  />
                </>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleClick}
          disabled={loading}
          className={`buy-button ${tab === 'buy' ? 'buy' : 'sell'}`}
        >
          {loading ? t('processing') : tab === 'buy' ? t('buy') : t('sell')}
        </button>

        {/* Slippage Protection Indicator */}
        {slippageEnabled && slippage > 0 && (
          <div style={{ 
            marginTop: '8px', 
            padding: '6px 8px', 
            background: tab === 'buy' ? '#1e3a8a' : '#92400e', 
            borderRadius: '6px',
            border: tab === 'buy' ? '1px solid #3b82f6' : '1px solid #d97706',
            fontSize: '12px',
            color: '#dbeafe',
            textAlign: 'center'
          }}>
            {tab === 'buy' ? (
              <>
                🛡️ {slippage}% Price Swap Protection
              </>
            ) : (
              <>
                🛡️ {slippage}% Price Swap Protection
                {currentPrice > 0 && amount && (
                  <div style={{ marginTop: '2px', fontSize: '10px', color: '#fbbf24' }}>
                    Max send limit: {(parseFloat(amount.replace(/,/g, '') || 0) * 1.5).toFixed(1)} DCY tokens
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div style={{ 
          marginTop: '12px', 
          padding: '8px', 
          background: '#1a1a1a', 
          borderRadius: '6px',
          border: '1px solid #333'
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '14px',
            color: '#ccc',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={useNetworkPrecheck}
              onChange={(e) => setUseNetworkPrecheck(e.target.checked)}
              style={{ 
                width: '16px', 
                height: '16px',
                accentColor: '#4CAF50'
              }}
            />
            {t('auto_refresh')}
          </label>
          <div style={{ 
            fontSize: '12px', 
            color: '#888', 
            marginTop: '4px',
            marginLeft: '24px'
          }}>
            {t('auto_refresh_desc')}
          </div>
        </div>

        {error && (
          <div 
            className={isNetworkRetry ? "" : "error-message"}
            style={isNetworkRetry ? {
              padding: '12px',
              backgroundColor: '#e0f2fe',
              border: '1px solid #0288d1',
              borderRadius: '6px',
              color: '#01579b',
              fontSize: '14px',
              marginTop: '10px',
              textAlign: 'center'
            } : {}}
          >
            {error}
          </div>
        )}
          </>
        )}

        {/* Show ProfitLoss when profit section is selected */}
        {activeSection === 'profit' && <ProfitLoss tokenData={tokenData} trades={trades} currentPrice={currentPrice} />}

        {/* Show TokenStats when stats section is selected */}
        {activeSection === 'stats' && <TokenStats revenue={revenue} liquidity={liquidity} remainingSupply={remainingSupply} />}
      </div>

      {/* Price Information Modal */}
      {showPriceModal && (
        <div 
          onClick={handleClosePriceModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
            <button
              onClick={handleClosePriceModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: '#6b7280'
              }}
            >
              ×
            </button>
            
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#1f2937',
              paddingRight: '40px'
            }}>
              Current Price Explanation
            </h2>
            
            <div style={{ lineHeight: '1.6', color: '#374151' }}>
              <p style={{ marginBottom: '16px' }}>
                The current price is calculated using an <strong>Automated Market Maker (AMM)</strong> formula that determines the token price based on the liquidity pool balances.
              </p>
              
              <div style={{ 
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <p style={{ margin: '0', fontSize: '14px' }}>
                  <strong>📊 Chart Price vs Current Price:</strong> The chart displays the <strong>last executed trade price</strong>, while the current price shows the <strong>real-time AMM calculation</strong>. These may differ because:
                </p>
                <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px', fontSize: '14px' }}>
                  <li>Chart price = Price of the most recent completed transaction</li>
                  <li>Current price = Live calculation based on current pool balances</li>
                  <li>Pool balances change with each trade, updating the current price instantly</li>
                </ul>
              </div>
              
              {!priceSnapshot ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  color: '#6b7280'
                }}>
                  Loading current data...
                </div>
              ) : (
                <>
                  <div style={{ 
                    backgroundColor: '#f9fafb', 
                    padding: '16px', 
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
                      Current Calculation:
                    </h3>
                    <div style={{ 
                      backgroundColor: '#ffffff',
                      padding: '12px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      border: '1px solid #d1d5db',
                      fontFamily: 'monospace'
                    }}>
                      <div style={{ marginBottom: '8px', color: '#6b7280' }}>
                        Price = (SBTC Balance + Virtual SBTC) ÷ Available Tokens
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        Price = ({priceSnapshot.sbtcBalance.toLocaleString()} + {priceSnapshot.virtualSbtc.toLocaleString()}) ÷ {Math.round(priceSnapshot.availableTokensFormatted).toLocaleString()}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        Price = {(priceSnapshot.sbtcBalance + priceSnapshot.virtualSbtc).toLocaleString()} ÷ {Math.round(priceSnapshot.availableTokensFormatted).toLocaleString()}
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#059669' }}>
                        Price = {priceSnapshot.calculatedPrice.toFixed(8)} sats per token
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    backgroundColor: '#f0f9ff', 
                    padding: '16px', 
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid #0ea5e9'
                  }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
                      Current Pool Data:
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                      <div>
                        <strong>SBTC Balance:</strong><br/>
                        {priceSnapshot.sbtcBalance.toLocaleString()} sats
                      </div>
                      <div>
                        <strong>Virtual SBTC:</strong><br/>
                        {priceSnapshot.virtualSbtc.toLocaleString()} sats
                      </div>
                      <div>
                        <strong>Total Tokens:</strong><br/>
                        {Math.round(priceSnapshot.totalTokensFormatted).toLocaleString()}
                      </div>
                      <div>
                        <strong>Locked Tokens:</strong><br/>
                        {Math.round(priceSnapshot.lockedTokensFormatted).toLocaleString()}
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <strong>Available for Trading:</strong><br/>
                        {Math.round(priceSnapshot.availableTokensFormatted).toLocaleString()} tokens
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#6b7280',
                    backgroundColor: '#f9fafb',
                    padding: '12px',
                    borderRadius: '6px'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>How it works:</strong>
                    </div>
                    <ul style={{ margin: '0', paddingLeft: '16px' }}>
                      <li>Virtual SBTC (1.5M sats) provides initial liquidity and price stability</li>
                      <li>As trades occur, SBTC and token balances change</li>
                      <li>Price automatically adjusts based on the new ratio</li>
                      <li>More SBTC in pool = higher token price</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
});

export default TokenBuySellBox;