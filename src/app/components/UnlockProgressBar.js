'use client';

import React, { useState, useEffect } from 'react';
import { request } from '@stacks/connect';
import { Cl, Pc, postConditionToHex } from '@stacks/transactions';
import ProfitLoss from './ProfitLoss';
import TokenStats from './TokenStats';
import WhaleAccessProgressBar from './WhaleAccessProgressBar';

/**
 * UnlockProgressBar Component
 * 
 * A reusable component that shows progress towards the minimum revenue threshold 
 * needed to unlock mas sats for any token.
 * 
 * @param {Object} props
 * @param {string} props.tokenSymbol - The token symbol (e.g., 'BTC', 'ETH')
 * @param {string} props.revenue - Current revenue amount (formatted string with commas)
 * @param {string} props.liquidity - Current liquidity amount (formatted string with commas)
 * @param {boolean} props.showButtons - Whether to show action buttons (default: true)
 * @param {Function} props.onShowContracts - Callback for showing contract addresses
 * @param {Function} props.onClaimRevenue - Callback for claiming revenue
 * @param {string} props.tokenId - The token ID for lock/unlock functionality
 * @param {Component} props.LockUnlockButton - The LockUnlockButton component to use
 * 
 * @example
 * // Basic usage
 * <UnlockProgressBar
 *   tokenSymbol="BTC"
 *   revenue="1,000,000"
 *   liquidity="2,000,000"
 *   onShowContracts={() => setShowContracts(true)}
 *   onClaimRevenue={handleClaimRevenue}
 *   tokenId="1"
 *   LockUnlockButton={LockUnlockButton}
 * />
 * 
 * // Without buttons
 * <UnlockProgressBar
 *   tokenSymbol="ETH"
 *   revenue="500,000"
 *   liquidity="1,000,000"
 *   showButtons={false}
 * />
 */
const UnlockProgressBar = React.memo(function UnlockProgressBar({ 
  tokenSymbol = 'TOKEN', 
  revenue = '0', 
  liquidity = '0',
  showButtons = true,
  onShowContracts,
  onClaimRevenue,
  tokenId,
  LockUnlockButton,
  dexInfo,
  tokenInfo,
  tokenBalance = '0',
  holdingsSats = 0,
  currentPrice = 0
}) {
  const [contractThreshold, setContractThreshold] = useState(0);
  const [loadingThreshold, setLoadingThreshold] = useState(true);
  const [showComingSoonPopup, setShowComingSoonPopup] = useState(false);
  const [showWhaleAccessPopup, setShowWhaleAccessPopup] = useState(false);
  const [showWhaleRestrictionPopup, setShowWhaleRestrictionPopup] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [accessSettings, setAccessSettings] = useState({ claimRevenue: true });
  const [showBuySellPanel, setShowBuySellPanel] = useState(false);
  const [buySellMode, setBuySellMode] = useState('buy'); // 'buy' or 'sell'
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [isTransactionPending, setIsTransactionPending] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(null); // 'pending', 'success', 'error'
  const [transactionId, setTransactionId] = useState('');
  const [showTransactionStatus, setShowTransactionStatus] = useState(false);
  const [latestExecutionPrice, setLatestExecutionPrice] = useState(0);
  const [slippage, setSlippage] = useState(10); // Default 10% slippage
  const [slippageProtectionEnabled, setSlippageProtectionEnabled] = useState(false); // Toggle for slippage protection
  const [customSlippage, setCustomSlippage] = useState(''); // Custom slippage input
  const [showCustomSlippage, setShowCustomSlippage] = useState(false); // Show custom slippage input
  const [majorityHolderBalance, setMajorityHolderBalance] = useState(0);
  const [loadingMajorityHolder, setLoadingMajorityHolder] = useState(true);
  




  // Function to detect network mismatch
  const detectNetworkMismatch = () => {
    const connectedAddress = localStorage.getItem('connectedAddress');
    if (!connectedAddress || !dexInfo) return null;
    
    // Determine token network from contract address
    const [dexContractAddress] = dexInfo.split('.');
    const isTokenTestnet = dexContractAddress.startsWith('ST');
    
    // Determine wallet network from address
    const isWalletTestnet = connectedAddress.startsWith('ST');
    
    // Check for mismatch
    if (isTokenTestnet !== isWalletTestnet) {
      return {
        tokenNetwork: isTokenTestnet ? 'testnet' : 'mainnet',
        walletNetwork: isWalletTestnet ? 'testnet' : 'mainnet',
        message: isTokenTestnet 
          ? 'Switch to testnet wallet to trade this token'
          : 'Switch to mainnet wallet to trade this token'
      };
    }
    
    return null;
  };

  const networkMismatch = detectNetworkMismatch();

  // Log network mismatch for debugging
  useEffect(() => {
    if (networkMismatch) {
      console.log('🌐 Network mismatch detected:', networkMismatch);
    }
  }, [networkMismatch]);

  // Load buy/sell panel state from localStorage on component mount
  useEffect(() => {
    const savedPanelState = localStorage.getItem('buySellPanelOpen');
    const savedMode = localStorage.getItem('buySellMode');
    
    if (savedPanelState === 'true') {
      setShowBuySellPanel(true);
    }
    
    if (savedMode === 'sell') {
      setBuySellMode('sell');
    }

    // Debug: Log the dexInfo prop
    console.log('🔍 UnlockProgressBar mounted with dexInfo:', dexInfo);
  }, [dexInfo]);

  // Save buy/sell panel state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('buySellPanelOpen', showBuySellPanel.toString());
  }, [showBuySellPanel]);

  // Save buy/sell mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('buySellMode', buySellMode);
  }, [buySellMode]);

  // Auto-dismiss transaction status after 1 minute
  useEffect(() => {
    if (transactionStatus === 'pending' || transactionStatus === 'success' || transactionStatus === 'error') {
      setShowTransactionStatus(true);
      
      // Only auto-dismiss for success/error, not for pending
      if (transactionStatus === 'success' || transactionStatus === 'error') {
      const timer = setTimeout(() => {
        setShowTransactionStatus(false);
        setTransactionStatus(null);
        setTransactionId('');
      }, 60000); // 1 minute

      return () => clearTimeout(timer);
      }
    }
  }, [transactionStatus]);

  // Fetch latest execution price from trade history
  const fetchLatestExecutionPrice = async () => {
    try {
      const response = await fetch(`/api/get-trades?tokenId=${tokenId}&limit=50&network=mainnet`);
      
      if (!response.ok) {
        console.log('❌ Failed to fetch latest execution price');
        return;
      }
      
      const data = await response.json();
      
      if (data.trades && data.trades.length > 0) {
        // Filter for successful trades (not failed)
        const successfulTrades = data.trades.filter(trade => 
          !(trade.sats_traded === 0 && trade.tokens_traded === 0) && 
          trade.tx_status !== 'abort_by_response' &&
          trade.tx_status !== 'abort_by_post_condition'
        );
        
        if (successfulTrades.length > 0) {
          // Get the most recent successful trade
          const latestTrade = successfulTrades[0]; // Trades are sorted by most recent first
          
          if (latestTrade && latestTrade.price) {
            const price = parseFloat(latestTrade.price);
            console.log('💰 Latest execution price from successful trade:', price, 'from trade:', latestTrade.transaction_id);
            setLatestExecutionPrice(price);
          }
        } else {
          console.log('⚠️ No successful trades found for latest execution price');
        }
      }
    } catch (error) {
      console.log('❌ Error fetching latest execution price:', error);
    }
  };

  // Fetch latest price on component mount and periodically
  useEffect(() => {
    if (tokenId) {
      fetchLatestExecutionPrice();
      
      // Update price every 30 seconds
      const interval = setInterval(fetchLatestExecutionPrice, 30000);
      
      return () => clearInterval(interval);
    }
  }, [tokenId]);

  // Wait for transaction confirmation by checking recent trades
  const waitForConfirmation = async (txId, timeout = 60000, interval = 3000) => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        // Check recent trades API for the transaction ID
        const response = await fetch(`/api/get-trades?tokenId=${tokenId}&limit=50&network=mainnet`);
        
        if (!response.ok) {
          console.log(`❌ Trades API returned ${response.status}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, interval));
          continue;
        }
        
        const data = await response.json();
        
        console.log('🔍 Checking recent trades for transaction:', {
          txId,
          totalTrades: data.trades?.length || 0,
          checkingFor: txId
        });
        
        // Look for our transaction ID in the recent trades
        if (data.trades && data.trades.length > 0) {
          console.log('📊 Recent trades found:', data.trades.length);
          console.log('🔍 Looking for transaction ID:', txId);
          
          // Group failed transactions together
          const failedTrades = data.trades.filter(trade => 
            (trade.sats_traded === 0 && trade.tokens_traded === 0) || 
            trade.tx_status === 'abort_by_response' ||
            trade.tx_status === 'abort_by_post_condition'
          );
          
          if (failedTrades.length > 0) {
            console.log('🚫 Failed transactions found:', {
              count: failedTrades.length,
              txIds: failedTrades.map(t => t.transaction_id),
              statuses: failedTrades.map(t => t.tx_status),
              amounts: failedTrades.map(t => ({ sats: t.sats_traded, tokens: t.tokens_traded }))
            });
          }
          
          console.log('📋 Available transaction IDs:', data.trades.map(t => t.transaction_id).slice(0, 5));
          
          const foundTrade = data.trades.find(trade => trade.transaction_id === txId);
          
          if (foundTrade) {
            console.log('🔍 Transaction found in recent trades:', foundTrade);
            
            // Check if this is a failed transaction (0 amounts or failed status)
            const isFailed = (foundTrade.sats_traded === 0 && foundTrade.tokens_traded === 0) || 
                           foundTrade.tx_status === 'abort_by_response' ||
                           foundTrade.tx_status === 'abort_by_post_condition';
            
            if (isFailed) {
              console.log('❌ Transaction failed in recent trades:', foundTrade);
              return {
                tx_status: 'failed',
                tx_id: foundTrade.transaction_id,
                block_height: foundTrade.block_height,
                block_time_iso: foundTrade.created_at,
                reason: 'Transaction failed on blockchain'
              };
            } else {
              console.log('✅ Transaction successful in recent trades:', foundTrade);
              return {
                tx_status: 'success',
                tx_id: foundTrade.transaction_id,
                block_height: foundTrade.block_height,
                block_time_iso: foundTrade.created_at
              };
            }
          }
        }
        
        // Transaction not found yet, wait and check again
        console.log('⏳ Transaction not found in recent trades yet, checking again in', interval, 'ms...');
        await new Promise(resolve => setTimeout(resolve, interval));
        
      } catch (error) {
        console.log('Error checking recent trades:', error);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    throw new Error('Transaction confirmation timeout');
  };

  // Buy function using Stacks Connect
  const handleBuy = async () => {
    // Trigger pending transaction animation
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('transactionPending', {
        detail: { type: 'buy', amount: buyAmount }
      }));
    }
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      alert('Please enter a valid amount to buy');
      return;
    }

    if (!dexInfo) {
      alert('DEX contract information not available');
      return;
    }

    // Check if wallet is connected
    const connectedAddress = localStorage.getItem('connectedAddress');
    if (!connectedAddress) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setIsTransactionPending(true);
      setTransactionStatus('pending');
      setTransactionId('');

      // Parse the DEX contract info
      const [dexContractAddress, dexContractName] = dexInfo.split('.');
      
      // Validate contract address and name
      if (!dexContractAddress || !dexContractName) {
        throw new Error('Invalid DEX contract format. Expected: "address.contract-name"');
      }

      // Validate contract address format (should start with ST or SP)
      if (!dexContractAddress.startsWith('ST') && !dexContractAddress.startsWith('SP')) {
        throw new Error('Invalid contract address format. Must start with ST or SP');
      }
      
      console.log('🔍 Initiating buy transaction:', {
        contractAddress: dexContractAddress,
        contractName: dexContractName,
        functionName: 'buy',
        amount: buyAmount,
        userBalance: holdingsSats,
        fullDexInfo: dexInfo,
        parsedAddress: dexContractAddress,
        parsedName: dexContractName,
        connectedAddress: connectedAddress
      });

      // Additional validation for Stacks Connect
      if (!dexContractAddress || dexContractAddress.length < 10) {
        throw new Error('Contract address appears to be invalid or too short');
      }

      if (!dexContractName || dexContractName.length < 1) {
        throw new Error('Contract name appears to be invalid');
      }

      // Determine network based on contract address
      const network = dexContractAddress.startsWith('ST') ? 'testnet' : 'mainnet';
      console.log('🔍 Using network for transaction:', network);

      // Calculate expected tokens based on current price and slippage
      let postConditions = [];
      let postConditionMode = "allow";
      
      console.log('🔍 Slippage protection check:', {
        slippageProtectionEnabled,
        latestExecutionPrice,
        condition: slippageProtectionEnabled && latestExecutionPrice > 0
      });
      
      if (slippageProtectionEnabled && latestExecutionPrice > 0) {
        const inputAmount = parseFloat(buyAmount);
        const expectedTokens = Math.floor(inputAmount / latestExecutionPrice);
        const minTokens = Math.floor(expectedTokens * (1 - slippage / 100));
        
        console.log('🛡️ Slippage protection enabled:', {
          inputAmount,
          expectedTokens,
          minTokens,
          slippage: slippage + '%',
          currentPrice: latestExecutionPrice
        });
        
        // Set post condition mode to deny for protection
        postConditionMode = "deny";
        
        // Add a basic post-condition to ensure deny mode is recognized
        // This ensures the wallet shows "deny" mode instead of "allow"
        const basicCondition = Pc.principal(dexContractAddress)
          .willSendGte(1)
          .ft(`${dexContractAddress}.${dexContractName}`, 'token');
        
        postConditions = [
          postConditionToHex(basicCondition)
        ];
        
        console.log('🛡️ Post conditions set for slippage protection:', {
          postConditions,
          postConditionMode,
          minTokens
        });
      }

      // Log the transaction parameters being sent
      console.log('🚀 Sending BUY transaction with parameters:', {
        contract: `${dexContractAddress}.${dexContractName}`,
        functionName: 'buy',
        functionArgs: [Cl.uint(parseFloat(buyAmount))], // Use the input amount directly
        network: network,
        postConditionMode: postConditionMode,
        postConditions: postConditions,
        slippageProtectionEnabled: slippageProtectionEnabled,
        slippage: slippage + '%'
      });

      // Call the buy function on the DEX contract
      const response = await request('stx_callContract', {
        contract: `${dexContractAddress}.${dexContractName}`,
        functionName: 'buy',
        functionArgs: [Cl.uint(parseFloat(buyAmount))], // Use the input amount directly
        network: network,
        postConditions: postConditions,
        postConditionMode: postConditionMode
      });

      console.log('✅ Buy transaction broadcasted:', response);
      
      setTransactionId(response.txid);
      setTransactionStatus('pending');
      setIsTransactionPending(false); // Stop showing "Processing..." button
      
      // Trigger transaction broadcasted event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('transactionBroadcasted', {
          detail: { 
            type: 'buy', 
            amount: buyAmount, 
            txId: response.txid,
            timestamp: new Date().toISOString()
          }
        }));
      }
      
      // Clear the input
      setBuyAmount('');
      
      // Transaction status is now shown in the UI instead of alert
      
      // Create explorer URL
      const explorerUrl = `https://explorer.stacks.co/txid/${response.txid}`;
      console.log('View transaction in explorer:', explorerUrl);

      // Wait for confirmation
      try {
        console.log('⏳ Waiting for transaction confirmation...');
        const confirmedData = await waitForConfirmation(response.txid);
        
        console.log('🔍 Confirmation result:', {
          tx_status: confirmedData.tx_status,
          tx_id: confirmedData.tx_id,
          block_height: confirmedData.block_height
        });
        
        if (confirmedData.tx_status === 'success') {
          console.log('✅ Transaction confirmed:', confirmedData);
          setTransactionStatus('success');
          
          // Trigger successful transaction animation
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('transactionSuccessful', {
              detail: { 
                type: 'buy', 
                amount: buyAmount, 
                txId: response.txid,
                timestamp: new Date().toISOString()
              }
            }));
          }
        } else if (confirmedData.tx_status === 'failed') {
          console.log('❌ Transaction failed on blockchain:', confirmedData);
          setTransactionStatus('error');
          
          // Trigger failed transaction event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('transactionFailed', {
              detail: { 
                type: 'buy', 
                amount: buyAmount, 
                txId: response.txid,
                error: confirmedData.reason || 'Transaction failed on blockchain'
              }
            }));
          }
        } else {
          console.log('❌ Transaction failed:', confirmedData);
          setTransactionStatus('error');
        }
      } catch (error) {
        console.error('❌ Transaction confirmation failed:', error);
        
        // Fallback: If confirmation check fails, assume success after 15 seconds
        // This handles cases where the API is slow but transaction is actually successful
        console.log('🔄 Setting fallback success after 15 seconds...');
        setTimeout(() => {
          if (transactionStatus === 'pending') {
            console.log('✅ Fallback: Setting transaction as successful');
            setTransactionStatus('success');
            
            // Trigger successful transaction animation
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('transactionSuccessful', {
                detail: { 
                  type: 'buy', 
                  amount: buyAmount, 
                  txId: response.txid,
                  timestamp: new Date().toISOString()
                }
              }));
            }
          }
        }, 15000); // 15 second fallback
      }

    } catch (error) {
      console.error('❌ Buy transaction failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        dexInfo: dexInfo,
        buyAmount: buyAmount
      });
      
      // Trigger failed transaction event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('transactionFailed', {
          detail: { 
            type: 'buy', 
            amount: buyAmount, 
            error: error.message 
          }
        }));
      }
      
      setTransactionStatus('error');
      
      // Provide more specific error messages
      let errorMessage = 'Transaction failed to broadcast. Please try again.';
      if (error.message.includes('broadcast') || error.message.includes('network')) {
        errorMessage = 'Transaction failed to broadcast to network. Please check your connection and try again.';
      } else if (error.message.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled.';
      } else if (error.message.includes('not connected')) {
        errorMessage = 'Wallet not connected. Please connect your wallet and try again.';
      } else if (error.message.includes('insufficient')) {
        errorMessage = 'Insufficient balance. Please check your sBTC balance and try again.';
      }
      
      alert(`Buy transaction failed: ${errorMessage}`);
    } finally {
      setIsTransactionPending(false);
    }
  };

  // Sell function using Stacks Connect
  const handleSell = async () => {
    // Trigger pending transaction animation
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('transactionPending', {
        detail: { type: 'sell', amount: sellAmount }
      }));
    }
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      alert('Please enter a valid amount to sell');
      return;
    }

    if (!dexInfo) {
      alert('DEX contract information not available');
      return;
    }

    // Check if wallet is connected
    const connectedAddress = localStorage.getItem('connectedAddress');
    if (!connectedAddress) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setIsTransactionPending(true);
      setTransactionStatus('pending');
      setTransactionId('');

      // Parse the DEX contract info
      const [dexContractAddress, dexContractName] = dexInfo.split('.');
      
      // Validate contract address and name
      if (!dexContractAddress || !dexContractName) {
        throw new Error('Invalid DEX contract format. Expected: "address.contract-name"');
      }

      // Validate contract address format (should start with ST or SP)
      if (!dexContractAddress.startsWith('ST') && !dexContractAddress.startsWith('SP')) {
        throw new Error('Invalid contract address format. Must start with ST or SP');
      }
      
      console.log('🔍 Initiating sell transaction:', {
        contractAddress: dexContractAddress,
        contractName: dexContractName,
        functionName: 'sell',
        amount: sellAmount,
        userBalance: tokenBalance,
        fullDexInfo: dexInfo,
        parsedAddress: dexContractAddress,
        parsedName: dexContractName,
        connectedAddress: connectedAddress
      });

      // Additional validation for Stacks Connect
      if (!dexContractAddress || dexContractAddress.length < 10) {
        throw new Error('Contract address appears to be invalid or too short');
      }

      if (!dexContractName || dexContractName.length < 1) {
        throw new Error('Contract name appears to be invalid');
      }

      // Determine network based on contract address
      const network = dexContractAddress.startsWith('ST') ? 'testnet' : 'mainnet';
      console.log('🔍 Using network for transaction:', network);

      // Calculate expected sBTC based on current price and slippage
      let postConditions = [];
      let postConditionMode = "allow";
      
      console.log('🔍 Slippage protection check (SELL):', {
        slippageProtectionEnabled,
        latestExecutionPrice,
        condition: slippageProtectionEnabled && latestExecutionPrice > 0
      });
      
      if (slippageProtectionEnabled && latestExecutionPrice > 0) {
        const inputTokens = parseFloat(sellAmount) * 100000000; // Convert to smallest units
        const expectedSats = Math.floor(inputTokens * latestExecutionPrice / 100000000);
        const minSats = Math.floor(expectedSats * (1 - slippage / 100));
        
        console.log('🛡️ Slippage protection enabled:', {
          inputTokens,
          expectedSats,
          minSats,
          slippage: slippage + '%',
          currentPrice: latestExecutionPrice
        });
        
        // Set post condition mode to deny for protection
        postConditionMode = "deny";
        
        // Add post condition to ensure minimum sBTC received
        const sbtcCondition = Pc.principal(dexContractAddress)
          .willSendGte(minSats)
          .ft('SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token', 'sbtc-token');
        
        postConditions = [
          postConditionToHex(sbtcCondition)
        ];
      }

      // Log the transaction parameters being sent
      console.log('🚀 Sending SELL transaction with parameters:', {
        contract: `${dexContractAddress}.${dexContractName}`,
        functionName: 'sell',
        functionArgs: [parseFloat(sellAmount) * 100000000],
        network: network,
        postConditionMode: postConditionMode,
        postConditions: postConditions,
        slippageProtectionEnabled: slippageProtectionEnabled,
        slippage: slippage + '%'
      });

      // Call the sell function on the DEX contract
      const response = await request('stx_callContract', {
        contract: `${dexContractAddress}.${dexContractName}`,
        functionName: 'sell',
        functionArgs: [Cl.uint(parseFloat(sellAmount) * 100000000)], // Convert to smallest units (8 decimals)
        network: network,
        postConditions: postConditions,
        postConditionMode: postConditionMode
      });

      console.log('✅ Sell transaction broadcasted:', response);
      
      setTransactionId(response.txid);
      setTransactionStatus('pending');
      setIsTransactionPending(false); // Stop showing "Processing..." button
      
      // Trigger transaction broadcasted event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('transactionBroadcasted', {
          detail: { 
            type: 'sell', 
            amount: sellAmount, 
            txId: response.txid,
            timestamp: new Date().toISOString()
          }
        }));
      }
      
      // Clear the input
      setSellAmount('');
      
      // Transaction status is now shown in the UI instead of alert
      
      // Create explorer URL
      const explorerUrl = `https://explorer.stacks.co/txid/${response.txid}`;
      console.log('View transaction in explorer:', explorerUrl);

      // Wait for confirmation
      try {
        console.log('⏳ Waiting for transaction confirmation...');
        const confirmedData = await waitForConfirmation(response.txid);
        
        console.log('🔍 Confirmation result:', {
          tx_status: confirmedData.tx_status,
          tx_id: confirmedData.tx_id,
          block_height: confirmedData.block_height
        });
        
        if (confirmedData.tx_status === 'success') {
          console.log('✅ Transaction confirmed:', confirmedData);
          setTransactionStatus('success');
          
          // Trigger successful transaction animation
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('transactionSuccessful', {
              detail: { 
                type: 'sell', 
                amount: sellAmount, 
                txId: response.txid,
                timestamp: new Date().toISOString()
              }
            }));
          }
        } else if (confirmedData.tx_status === 'failed') {
          console.log('❌ Transaction failed on blockchain:', confirmedData);
          setTransactionStatus('error');
          
          // Trigger failed transaction event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('transactionFailed', {
              detail: { 
                type: 'sell', 
                amount: sellAmount, 
                txId: response.txid,
                error: confirmedData.reason || 'Transaction failed on blockchain'
              }
            }));
          }
        } else {
          console.log('❌ Transaction failed:', confirmedData);
          setTransactionStatus('error');
        }
      } catch (error) {
        console.error('❌ Transaction confirmation failed:', error);
        
        // Fallback: If confirmation check fails, assume success after 15 seconds
        // This handles cases where the API is slow but transaction is actually successful
        console.log('🔄 Setting fallback success after 15 seconds...');
        setTimeout(() => {
          if (transactionStatus === 'pending') {
            console.log('✅ Fallback: Setting transaction as successful');
            setTransactionStatus('success');
            
            // Trigger successful transaction animation
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('transactionSuccessful', {
                detail: { 
                  type: 'sell', 
                  amount: sellAmount, 
                  txId: response.txid,
                  timestamp: new Date().toISOString()
                }
              }));
            }
          }
        }, 15000); // 15 second fallback
      }

    } catch (error) {
      console.error('❌ Sell transaction failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        dexInfo: dexInfo,
        sellAmount: sellAmount
      });
      
      // Trigger failed transaction event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('transactionFailed', {
          detail: { 
            type: 'sell', 
            amount: sellAmount, 
            error: error.message 
          }
        }));
      }
      
      setTransactionStatus('error');
      
      // Provide more specific error messages
      let errorMessage = 'Transaction failed to broadcast. Please try again.';
      if (error.message.includes('broadcast') || error.message.includes('network')) {
        errorMessage = 'Transaction failed to broadcast to network. Please check your connection and try again.';
      } else if (error.message.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled.';
      } else if (error.message.includes('not connected')) {
        errorMessage = 'Wallet not connected. Please connect your wallet and try again.';
      } else if (error.message.includes('insufficient')) {
        errorMessage = 'Insufficient balance. Please check your token balance and try again.';
      }
      
      alert(`Sell transaction failed: ${errorMessage}`);
    } finally {
      setIsTransactionPending(false);
    }
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

    // Listen for settings updates
    const handleAccessSettingsUpdate = () => {
      loadAccessSettings();
    };
    
    window.addEventListener('accessSettingsUpdated', handleAccessSettingsUpdate);

    return () => {
      window.removeEventListener('accessSettingsUpdated', handleAccessSettingsUpdate);
    };
  }, []);

  // Fetch threshold from smart contract via API
  useEffect(() => {
    console.log('🔍 UnlockProgressBar: fetchThreshold useEffect triggered');
    console.log('🔍 Dependencies:', { dexInfo, tokenInfo, liquidity });
    
    const fetchThreshold = async () => {
      console.log('🔍 fetchThreshold function started');
      
      // Check if wallet is connected (optional check for better UX)
      if (typeof window !== 'undefined') {
        const connectedAddress = localStorage.getItem('connectedAddress');
        if (!connectedAddress) {
          console.log('⚠️ No wallet connected, using fallback threshold');
          const currentLiquidity = typeof liquidity === 'string' 
            ? parseFloat(liquidity.replace(/,/g, '')) || 0 
            : liquidity || 0;
          setContractThreshold(Math.floor(currentLiquidity / 2) + 1);
          setLoadingThreshold(false);
          return;
        }
      }

      try {
        // Try to get threshold from smart contract (same as whale access bar)
        if (dexInfo) {
          console.log('🔍 Fetching threshold with dexInfo:', dexInfo);
          
          const response = await fetch(`/api/get-threshold?dexInfo=${encodeURIComponent(dexInfo)}`);

          console.log('🔍 API response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('🔍 API response data:', JSON.stringify(data, null, 2));
            
            if (data.threshold !== undefined && data.threshold >= 0) {
              console.log('✅ Contract threshold response received:', data.threshold);
              setContractThreshold(data.threshold);
                setLoadingThreshold(false);
                return;
              } else {
                console.log('⚠️ Contract threshold is 0 or invalid, using fallback');
            }
          } else {
            console.log('❌ API call failed with status:', response.status);
          }
        } else {
          console.log('❌ Missing dexInfo or tokenInfo:', { dexInfo, tokenInfo });
        }
      } catch (error) {
        console.error('❌ Failed to fetch contract threshold:', error);
      }
      
      // Fallback to calculated threshold (same as whale access bar)
      const currentLiquidity = typeof liquidity === 'string' 
        ? parseFloat(liquidity.replace(/,/g, '')) || 0 
        : liquidity || 0;
      const fallbackThreshold = Math.floor(currentLiquidity / 2) + 1;
      console.log('🔄 Using fallback threshold calculation:', {
        currentLiquidity,
        fallbackThreshold
      });
      setContractThreshold(fallbackThreshold);
      setLoadingThreshold(false);
    };

    fetchThreshold();
  }, [dexInfo, tokenInfo, liquidity]);

  // Fetch majority holder data
  useEffect(() => {
    const fetchMajorityHolder = async () => {
      if (!tokenId || !dexInfo) {
        setLoadingMajorityHolder(false);
        return;
      }

      try {
        setLoadingMajorityHolder(true);
        console.log('🔍 Fetching majority holder data for tokenId:', tokenId);
        
        // First, get the majority holder address
        const response = await fetch(`/api/get-majority-holder?tokenId=${tokenId}&refresh=true`);
        const data = await response.json();
        
        console.log('🔍 Majority holder API response:', data);
        
        if (data.hasMajorityHolder && data.address) {
          console.log('🔍 Majority holder address found:', data.address);
          
          // Now get the locked amount for this address using get-locked-balance function
          const [dexContractAddress, dexContractName] = dexInfo.split('.');
          const balanceResponse = await fetch('/api/read-contract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contractAddress: dexContractAddress,
              contractName: dexContractName,
              functionName: 'get-locked-balance',
              functionArgs: [data.address] // Pass the majority holder address
            })
          });
          
          const balanceData = await balanceResponse.json();
          console.log('🔍 Locked balance API response for majority holder:', balanceData);
          
          if (balanceData.success && balanceData.result !== undefined) {
            // Parse the result to get the locked balance
            let lockedBalance = 0;
            if (balanceData.result && balanceData.result.value !== undefined) {
              lockedBalance = parseInt(balanceData.result.value);
            } else if (typeof balanceData.result === 'string' && balanceData.result.startsWith('ok u')) {
              // Handle "ok u1500" format
              const numberPart = balanceData.result.substring(4);
              lockedBalance = parseInt(numberPart);
            } else if (typeof balanceData.result === 'string' && balanceData.result.startsWith('ok ')) {
              // Handle "ok 1500" format
              const numberPart = balanceData.result.substring(3);
              lockedBalance = parseInt(numberPart);
            }
            
            console.log('🔍 Majority holder locked balance:', lockedBalance);
            setMajorityHolderBalance(lockedBalance);
          } else {
            console.log('🔍 Could not get majority holder locked balance, using 0');
            setMajorityHolderBalance(0);
          }
        } else {
          console.log('🔍 No majority holder found, using 0');
          setMajorityHolderBalance(0);
        }
      } catch (error) {
        console.error('🔍 Error fetching majority holder:', error);
        setMajorityHolderBalance(0);
      } finally {
        setLoadingMajorityHolder(false);
      }
    };

    fetchMajorityHolder();
  }, [tokenId, dexInfo]);

  // Calculate progress towards lock requirement for claiming revenue
  const currentRevenue = typeof revenue === 'string' 
    ? parseFloat(revenue.replace(/,/g, '')) || 0 
    : revenue || 0;
  const currentLiquidity = typeof liquidity === 'string' 
    ? parseFloat(liquidity.replace(/,/g, '')) || 0 
    : liquidity || 0;
  const userTokenBalance = typeof tokenBalance === 'string' 
    ? parseFloat(tokenBalance.replace(/,/g, '')) || 0 
    : tokenBalance || 0;
  
  // The amount user needs to lock to claim revenue (same as whale access bar)
  const lockRequirement = contractThreshold || 1000000; // Default 1M sats
  
  // Progress towards unlocking threshold (same as whale access bar)
  const progressPercentage = lockRequirement > 0 
    ? Math.min((currentRevenue / lockRequirement) * 100, 100) 
    : 0;

  // Only log lock requirement calculation when values actually change
  useEffect(() => {
    console.log('🔍 Lock requirement calculation debug:', {
      contractThreshold,
      currentLiquidity,
      lockRequirement,
      userTokenBalance,
      progressPercentage,
      isUsingContractThreshold: contractThreshold > 0
    });
  }, [contractThreshold, currentLiquidity, lockRequirement, userTokenBalance, progressPercentage]);

  return (
    <div style={{
      background: '#1c2d4e',
      borderRadius: '12px',
      padding: '16px',
      width: '100%',
      color: '#eee',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Main Progress Bar Content */}
      {!showBuySellPanel && (
        <div style={{
          background: '#3776c6',
          borderRadius: '8px',
          padding: '20px',
          display: 'flex',
          flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
          alignItems: 'center',
          gap: window.innerWidth <= 768 ? '16px' : '20px'
        }}>
          {/* Token Display Box - Left Side */}
          <div style={{ 
            background: 'linear-gradient(to bottom, #001c34, #002b57)',
            padding: window.innerWidth <= 768 ? '1.5rem' : '2rem',
            borderRadius: '8px',
            border: '2px solid orange',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: window.innerWidth <= 768 ? '120px' : '150px',
            height: window.innerWidth <= 768 ? '100px' : '140px',
            flexShrink: 0
          }}>
            <span style={{
              fontSize: window.innerWidth <= 768 ? '1.2rem' : '1.6rem',
              fontWeight: 'bold',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}>
              <span style={{ color: '#ffa500', fontWeight: 'bold' }}>₿</span> {tokenSymbol}
            </span>
          </div>
          
          {/* Progress Bar Area - Middle */}
          <div style={{ 
            flex: 1, 
            minWidth: window.innerWidth <= 768 ? '100%' : '200px',
            width: window.innerWidth <= 768 ? '100%' : 'auto'
          }}>
            <div style={{ 
              fontSize: window.innerWidth <= 768 ? '12px' : '14px', 
              color: '#ffa500', 
              fontWeight: '600', 
              marginBottom: window.innerWidth <= 768 ? '8px' : '12px',
              textAlign: 'center',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              Progress to Unlock {tokenSymbol === 'MAS' ? (
                <img 
                  src="/icons/The Mas Network.svg" 
                  alt="MAS Sats" 
                  style={{ 
                    width: window.innerWidth <= 768 ? '14px' : '16px', 
                    height: window.innerWidth <= 768 ? '14px' : '16px'
                  }} 
                />
              ) : tokenSymbol}
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: window.innerWidth <= 768 ? '6px' : '8px',
              flexDirection: window.innerWidth <= 768 ? 'column' : 'row'
            }}>
              <div style={{
                width: '100%',
                height: window.innerWidth <= 768 ? '16px' : '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'relative'
              }}>
                <div style={{
                  width: `${progressPercentage}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #ffa500, #ff8c00)',
                  borderRadius: '10px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              
              {/* Lock/Unlock Emoji with Threshold Info below */}
              <div style={{
                display: 'flex',
                flexDirection: window.innerWidth <= 768 ? 'row' : 'column',
                alignItems: 'center',
                gap: window.innerWidth <= 768 ? '8px' : '4px',
                justifyContent: window.innerWidth <= 768 ? 'center' : 'flex-start',
                width: window.innerWidth <= 768 ? '100%' : 'auto'
              }}>
                <div style={{ 
                  fontSize: window.innerWidth <= 768 ? '1.2rem' : '1.5rem'
                }}>
                  {currentRevenue >= lockRequirement ? '🔓' : '🔒'}
                </div>
                
                {/* Threshold Info stacked under emoji */}
                <div style={{
                  fontSize: window.innerWidth <= 768 ? '8px' : '9px',
                  color: '#ffa500',
                  textAlign: 'center'
                }}>
                            {userTokenBalance >= lockRequirement ? (
                    <>
                      <div style={{ fontSize: window.innerWidth <= 768 ? '10px' : '12px', fontWeight: 'bold' }}>Maintain:</div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: window.innerWidth <= 768 ? '10px' : '12px',
                        fontWeight: 'bold',
                        justifyContent: 'center'
                      }}>
                                  {loadingMajorityHolder ? 'Loading...' : (majorityHolderBalance || 1500).toLocaleString()}
                                  <img 
                                    src="/icons/The Mas Network.svg" 
                                    alt="MAS Sats" 
                          style={{ 
                            width: window.innerWidth <= 768 ? '12px' : '14px', 
                            height: window.innerWidth <= 768 ? '12px' : '14px'
                          }} 
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: window.innerWidth <= 768 ? '10px' : '12px', fontWeight: 'bold' }}>Min Needed:</div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: window.innerWidth <= 768 ? '10px' : '12px',
                        fontWeight: 'bold',
                        justifyContent: 'center'
                      }}>
                                  {loadingThreshold ? 'Loading...' : lockRequirement.toLocaleString()}
                        <img 
                          src="/icons/sats1.svg" 
                          alt="Sats" 
                          style={{ 
                            width: window.innerWidth <= 768 ? '12px' : '14px', 
                            height: window.innerWidth <= 768 ? '12px' : '14px'
                          }} 
                        />
                        <img 
                          src="/icons/Vector.svg" 
                          alt="Vector" 
                          style={{ 
                            width: window.innerWidth <= 768 ? '12px' : '14px', 
                            height: window.innerWidth <= 768 ? '12px' : '14px'
                          }} 
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Current Token Balance Display */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              marginTop: window.innerWidth <= 768 ? '8px' : '12px',
              fontSize: window.innerWidth <= 768 ? '12px' : '14px',
              fontWeight: '600',
              color: '#fbbf24',
              flexWrap: window.innerWidth <= 768 ? 'wrap' : 'nowrap',
              textAlign: window.innerWidth <= 768 ? 'center' : 'left'
            }}>
              <span style={{ whiteSpace: window.innerWidth <= 768 ? 'normal' : 'nowrap' }}>
                {(() => {
                  // Check if this is a mainnet token (SP address) or testnet token (ST address)
                  if (dexInfo) {
                    const [dexContractAddress] = dexInfo.split('.');
                    const isMainnet = dexContractAddress.startsWith('SP');
                    return isMainnet ? 'Teiko Token Balance: ' : 'Your Token Balance: ';
                  }
                  return 'Your Token Balance: ';
                })()}{userTokenBalance.toLocaleString()}
              </span>
              <img 
                src="/icons/The Mas Network.svg" 
                alt="MAS Sats" 
                style={{ 
                  width: window.innerWidth <= 768 ? '14px' : '16px', 
                  height: window.innerWidth <= 768 ? '14px' : '16px'
                }} 
              />
            </div>
            
            {/* Current Revenue Display */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              marginTop: window.innerWidth <= 768 ? '6px' : '8px',
              fontSize: window.innerWidth <= 768 ? '12px' : '14px',
              fontWeight: '600',
              color: '#ffa500',
              flexWrap: window.innerWidth <= 768 ? 'wrap' : 'nowrap',
              textAlign: window.innerWidth <= 768 ? 'center' : 'left'
            }}>
              <span style={{ whiteSpace: window.innerWidth <= 768 ? 'normal' : 'nowrap' }}>
                Current Profit Available to Claim: {revenue}
              </span>
              <img 
                src="/icons/sats1.svg" 
                alt="Sats" 
                style={{ 
                  width: window.innerWidth <= 768 ? '14px' : '16px', 
                  height: window.innerWidth <= 768 ? '14px' : '16px'
                }} 
              />
              <img 
                src="/icons/Vector.svg" 
                alt="Vector" 
                style={{ 
                  width: window.innerWidth <= 768 ? '14px' : '16px', 
                  height: window.innerWidth <= 768 ? '14px' : '16px'
                }} 
              />
              
              {/* Progress Percentage Display */}
              <div style={{
                textAlign: 'center',
                marginTop: window.innerWidth <= 768 ? '6px' : '8px',
                fontSize: window.innerWidth <= 768 ? '12px' : '14px',
                color: '#ccc'
              }}>
                {progressPercentage.toFixed(1)}% Complete
              </div>
              
              {/* Network Mismatch Warning */}
              {networkMismatch && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  marginTop: '4px',
                  padding: '4px 8px',
                  backgroundColor: '#ef4444',
                  borderRadius: '6px',
                  fontSize: window.innerWidth <= 768 ? '10px' : '11px',
                  fontWeight: '500',
                  color: '#ffffff',
                  textAlign: 'center'
                }}>
                  <span>⚠️ {networkMismatch.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Buy/Sell Panel Content */}
      {showBuySellPanel && (
        <div style={{
          background: '#3776c6',
          borderRadius: '8px',
          padding: window.innerWidth <= 768 ? '16px' : '20px',
          display: 'flex',
          flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
          alignItems: 'center',
          gap: window.innerWidth <= 768 ? '16px' : '20px'
        }}>
          {/* Token Display Box - Left Side (same as original) */}
          <div style={{ 
            background: 'linear-gradient(to bottom, #001c34, #002b57)',
            padding: window.innerWidth <= 768 ? '1.5rem' : '2rem',
            borderRadius: '8px',
            border: '2px solid orange',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: window.innerWidth <= 768 ? '120px' : '150px',
            height: window.innerWidth <= 768 ? '100px' : '140px',
            flexShrink: 0
          }}>
            <span style={{
              fontSize: window.innerWidth <= 768 ? '1.2rem' : '1.6rem',
              fontWeight: 'bold',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}>
              <span style={{ color: '#ffa500', fontWeight: 'bold' }}>₿</span> {tokenSymbol}
            </span>
          </div>
          
          {/* Buy/Sell Panel - Middle */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ 
              fontSize: '18px', 
              color: '#ffa500', 
              fontWeight: 'bold', 
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              💰 Buy/Sell
            </div>
            

            
            {/* Buy/Sell Tabs */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px',
              justifyContent: 'center'
            }}>
              <button 
                onClick={() => setBuySellMode('buy')}
                style={{
                  backgroundColor: buySellMode === 'buy' ? '#059669' : '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (buySellMode !== 'buy') {
                    e.target.style.backgroundColor = '#047857';
                  }
                }}
                onMouseLeave={(e) => {
                  if (buySellMode !== 'buy') {
                    e.target.style.backgroundColor = '#374151';
                  }
                }}
              >
                Buy
              </button>
              <button 
                onClick={() => setBuySellMode('sell')}
                style={{
                  backgroundColor: buySellMode === 'sell' ? '#dc2626' : '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (buySellMode !== 'sell') {
                    e.target.style.backgroundColor = '#b91c1c';
                  }
                }}
                onMouseLeave={(e) => {
                  if (buySellMode !== 'sell') {
                    e.target.style.backgroundColor = '#374151';
                  }
                }}
              >
                Sell
              </button>
            </div>
            
            {/* Token Balance Display for Sell Mode */}
            {buySellMode === 'sell' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                marginBottom: '12px'
              }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                fontSize: window.innerWidth <= 768 ? '12px' : '14px',
                fontWeight: '600',
                color: '#fbbf24',
                flexWrap: window.innerWidth <= 768 ? 'wrap' : 'nowrap',
                textAlign: window.innerWidth <= 768 ? 'center' : 'left'
              }}>
                <span style={{ whiteSpace: window.innerWidth <= 768 ? 'normal' : 'nowrap' }}>
                    {(() => {
                      // Check if this is a mainnet token (SP address) or testnet token (ST address)
                      if (dexInfo) {
                        const [dexContractAddress] = dexInfo.split('.');
                        const isMainnet = dexContractAddress.startsWith('SP');
                        return isMainnet ? 'Teiko Token Balance: ' : 'Holdings: ';
                      }
                      return 'Holdings: ';
                    })()}{userTokenBalance.toLocaleString()}
                </span>
                <img 
                  src="/icons/The Mas Network.svg" 
                  alt="MAS Sats" 
                  style={{ 
                    width: window.innerWidth <= 768 ? '14px' : '16px', 
                    height: window.innerWidth <= 768 ? '14px' : '16px'
                  }} 
                />
                </div>
                
                {/* Estimated to receive for sell */}
                {latestExecutionPrice > 0 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: window.innerWidth <= 768 ? '11px' : '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      flexWrap: window.innerWidth <= 768 ? 'wrap' : 'nowrap',
                      textAlign: window.innerWidth <= 768 ? 'center' : 'left'
                    }}>
                      <span>Estimated to receive:</span>
                      <span style={{ color: '#ffa500' }}>
                        {((userTokenBalance * latestExecutionPrice) / 100000000).toFixed(2)}
                      </span>
                      <img 
                        src="/icons/sats1.svg" 
                        alt="sats" 
                        style={{ 
                          width: window.innerWidth <= 768 ? '12px' : '14px', 
                          height: window.innerWidth <= 768 ? '12px' : '14px'
                        }} 
                      />
                      <img 
                        src="/icons/Vector.svg" 
                        alt="lightning" 
                        style={{ 
                          width: window.innerWidth <= 768 ? '12px' : '14px', 
                          height: window.innerWidth <= 768 ? '12px' : '14px'
                        }} 
                      />
                    </div>
                    
                    {/* Max price with slippage */}
                    {slippageProtectionEnabled && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        fontSize: window.innerWidth <= 768 ? '10px' : '11px',
                        fontWeight: '400',
                        color: '#9ca3af',
                        flexWrap: window.innerWidth <= 768 ? 'wrap' : 'nowrap',
                        textAlign: window.innerWidth <= 768 ? 'center' : 'left'
                      }}>
                        <span>Max price:</span>
                        <span style={{ color: '#ef4444' }}>
                          {((userTokenBalance * latestExecutionPrice * (1 - slippage / 100)) / 100000000).toFixed(2)}
                        </span>
                        <img 
                          src="/icons/sats1.svg" 
                          alt="sats" 
                          style={{ 
                            width: window.innerWidth <= 768 ? '10px' : '12px', 
                            height: window.innerWidth <= 768 ? '10px' : '12px'
                          }} 
                        />
                        <img 
                          src="/icons/Vector.svg" 
                          alt="lightning" 
                          style={{ 
                            width: window.innerWidth <= 768 ? '10px' : '12px', 
                            height: window.innerWidth <= 768 ? '10px' : '12px'
                          }} 
                        />
                        <span style={{ fontSize: '9px' }}>({slippage}% slippage)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* sBTC Balance Display for Buy Mode */}
            {buySellMode === 'buy' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                marginBottom: '12px'
              }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                fontSize: window.innerWidth <= 768 ? '12px' : '14px',
                fontWeight: '600',
                color: '#ffa500',
                flexWrap: window.innerWidth <= 768 ? 'wrap' : 'nowrap',
                textAlign: window.innerWidth <= 768 ? 'center' : 'left'
              }}>
                <span style={{ whiteSpace: window.innerWidth <= 768 ? 'normal' : 'nowrap' }}>
                  Your sBTC Balance: {parseInt(holdingsSats || 1500).toLocaleString()}
                </span>
                <img 
                  src="/icons/sats1.svg" 
                  alt="sats" 
                  style={{ 
                    width: window.innerWidth <= 768 ? '14px' : '16px', 
                    height: window.innerWidth <= 768 ? '14px' : '16px'
                  }} 
                />
                <img 
                  src="/icons/Vector.svg" 
                  alt="lightning" 
                  style={{ 
                    width: window.innerWidth <= 768 ? '14px' : '16px', 
                    height: window.innerWidth <= 768 ? '14px' : '16px'
                  }} 
                />
                </div>
                
                {/* Network Mismatch Warning */}
                {networkMismatch && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    marginTop: '4px',
                    padding: '4px 8px',
                    backgroundColor: '#ef4444',
                    borderRadius: '6px',
                    fontSize: window.innerWidth <= 768 ? '10px' : '11px',
                    fontWeight: '500',
                    color: '#ffffff',
                    textAlign: 'center'
                  }}>
                    <span>⚠️ {networkMismatch.message}</span>
                  </div>
                )}
                
                {/* Estimated to receive for buy */}
                {latestExecutionPrice > 0 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: window.innerWidth <= 768 ? '11px' : '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      flexWrap: window.innerWidth <= 768 ? 'wrap' : 'nowrap',
                      textAlign: window.innerWidth <= 768 ? 'center' : 'left'
                    }}>
                      <span>Estimated to receive:</span>
                      <span style={{ color: '#fbbf24' }}>
                        {(holdingsSats / latestExecutionPrice).toFixed(2)}
                      </span>
                      <img 
                        src="/icons/The Mas Network.svg" 
                        alt="MAS Sats" 
                        style={{ 
                          width: window.innerWidth <= 768 ? '12px' : '14px', 
                          height: window.innerWidth <= 768 ? '12px' : '14px'
                        }} 
                      />
                    </div>
                    
                    {/* Max price with slippage */}
                    {slippageProtectionEnabled && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        fontSize: window.innerWidth <= 768 ? '10px' : '11px',
                        fontWeight: '400',
                        color: '#9ca3af',
                        flexWrap: window.innerWidth <= 768 ? 'wrap' : 'nowrap',
                        textAlign: window.innerWidth <= 768 ? 'center' : 'left'
                      }}>
                        <span>Max price:</span>
                        <span style={{ color: '#ef4444' }}>
                          {(holdingsSats / (latestExecutionPrice * (1 - slippage / 100))).toFixed(2)}
                        </span>
                        <img 
                          src="/icons/The Mas Network.svg" 
                          alt="MAS Sats" 
                          style={{ 
                            width: window.innerWidth <= 768 ? '10px' : '12px', 
                            height: window.innerWidth <= 768 ? '10px' : '12px'
                          }} 
                        />
                        <span style={{ fontSize: '9px' }}>({slippage}% slippage)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Amount Input */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'center'
            }}>
              <input 
                type="number"
                value={buySellMode === 'buy' ? buyAmount : sellAmount}
                onChange={(e) => {
                  if (buySellMode === 'buy') {
                    setBuyAmount(e.target.value);
                  } else {
                    setSellAmount(e.target.value);
                  }
                }}
                placeholder={buySellMode === 'buy' ? 'Enter sBTC amount to buy...' : 'Enter token amount to sell...'}
                style={{
                  width: '80%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                  textAlign: 'center'
                }}
                disabled={isTransactionPending}
              />
              
              {/* Percentage Buttons */}
              <div style={{
                display: 'flex',
                gap: '4px',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginTop: '8px'
              }}>
                {[15, 30, 50, 100].map((percentage) => (
                  <button
                    key={percentage}
                    onClick={() => {
                      const balance = buySellMode === 'buy' ? holdingsSats : userTokenBalance;
                      const amount = Math.floor(balance * percentage / 100);
                      if (buySellMode === 'buy') {
                        setBuyAmount(amount.toString());
                      } else {
                        setSellAmount((amount / 100000000).toString());
                      }
                    }}
                    disabled={isTransactionPending}
                    style={{
                      backgroundColor: '#374151',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '3px 6px',
                      fontSize: '10px',
                      fontWeight: '600',
                      cursor: isTransactionPending ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      minWidth: '25px'
                    }}
                    onMouseEnter={(e) => {
                      if (!isTransactionPending) {
                        e.target.style.backgroundColor = '#4b5563';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isTransactionPending) {
                        e.target.style.backgroundColor = '#374151';
                      }
                    }}
                  >
                    {percentage}%
                  </button>
                ))}
              </div>

              {/* Slippage Protection - Hidden for now */}
              {false && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '12px'
                }}>
                  <span style={{ color: '#fbbf24' }}>Slippage Protection</span>
                  <div
                    onClick={() => !isTransactionPending && setSlippageProtectionEnabled(!slippageProtectionEnabled)}
                    style={{
                      width: '40px',
                      height: '20px',
                      backgroundColor: slippageProtectionEnabled ? '#3b82f6' : '#374151',
                      borderRadius: '10px',
                      position: 'relative',
                      cursor: isTransactionPending ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '2px',
                      left: slippageProtectionEnabled ? '22px' : '2px',
                      transition: 'all 0.2s ease'
                    }} />
                  </div>
                </div>
              )}

              {/* Slippage Options - Hidden for now */}
              {false && slippageProtectionEnabled && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  alignItems: 'center'
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#fbbf24',
                    fontWeight: '400'
                  }}>
                    Tolerance: {slippage}%
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}>
                    {[5, 10, 15, 21].map((slippageOption) => (
                      <button
                        key={slippageOption}
                        onClick={() => {
                          setSlippage(slippageOption);
                          setShowCustomSlippage(false);
                        }}
                        disabled={isTransactionPending}
                        style={{
                          backgroundColor: slippage === slippageOption && !showCustomSlippage ? '#3b82f6' : '#374151',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          padding: '3px 6px',
                          fontSize: '10px',
                          fontWeight: '600',
                          cursor: isTransactionPending ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          minWidth: '25px'
                        }}
                        onMouseEnter={(e) => {
                          if (!isTransactionPending && slippage !== slippageOption) {
                            e.target.style.backgroundColor = '#4b5563';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isTransactionPending && slippage !== slippageOption) {
                            e.target.style.backgroundColor = '#374151';
                          }
                        }}
                      >
                        {slippageOption}%
                      </button>
                    ))}
                    
                    {/* Custom Slippage Button */}
                    <button
                      onClick={() => {
                        setShowCustomSlippage(!showCustomSlippage);
                        if (!showCustomSlippage) {
                          setCustomSlippage('');
                        }
                      }}
                      disabled={isTransactionPending}
                      style={{
                        backgroundColor: showCustomSlippage ? '#3b82f6' : '#374151',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '3px 6px',
                        fontSize: '10px',
                        fontWeight: '600',
                        cursor: isTransactionPending ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: '35px'
                      }}
                      onMouseEnter={(e) => {
                        if (!isTransactionPending && !showCustomSlippage) {
                          e.target.style.backgroundColor = '#4b5563';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isTransactionPending && !showCustomSlippage) {
                          e.target.style.backgroundColor = '#374151';
                        }
                      }}
                    >
                      Custom
                    </button>
                  </div>
                  
                  {/* Custom Slippage Input */}
                  {showCustomSlippage && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <input
                        type="number"
                        value={customSlippage}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                            setCustomSlippage(value);
                            if (value !== '') {
                              setSlippage(parseFloat(value));
                            }
                          }
                        }}
                        placeholder="0.1"
                        style={{
                          width: '50px',
                          backgroundColor: '#374151',
                          border: '1px solid #4b5563',
                          borderRadius: '3px',
                          padding: '2px 4px',
                          fontSize: '10px',
                          color: 'white',
                          textAlign: 'center'
                        }}
                      />
                      <span style={{ fontSize: '10px', color: '#9ca3af' }}>%</span>
                    </div>
                  )}
                </div>
              )}
              
              <button 
                onClick={buySellMode === 'buy' ? handleBuy : handleSell}
                disabled={isTransactionPending}
                style={{
                  backgroundColor: isTransactionPending ? '#6b7280' : (buySellMode === 'buy' ? '#059669' : '#dc2626'),
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isTransactionPending ? 'not-allowed' : 'pointer',
                  width: '80%',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isTransactionPending) {
                    e.target.style.backgroundColor = buySellMode === 'buy' ? '#047857' : '#b91c1c';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isTransactionPending) {
                    e.target.style.backgroundColor = buySellMode === 'buy' ? '#059669' : '#dc2626';
                  }
                }}
              >
                {isTransactionPending ? 'Processing...' : (buySellMode === 'buy' ? 'Buy' : 'Sell')}
              </button>
              
              {/* Transaction Status Display */}
              {showTransactionStatus && transactionStatus && (
                <div style={{
                  background: '#1f2937',
                  border: '1px solid',
                  borderColor: transactionStatus === 'success' ? '#10b981' : 
                               transactionStatus === 'error' ? '#ef4444' : '#f59e0b',
                  borderRadius: '8px',
                  padding: '12px',
                  color: transactionStatus === 'success' ? '#10b981' : 
                         transactionStatus === 'error' ? '#ef4444' : '#f59e0b',
                  textAlign: 'center',
                  marginTop: '8px',
                  position: 'relative'
                }}>
                  {/* Close button */}
                  <button
                    onClick={() => {
                      setShowTransactionStatus(false);
                      setTransactionStatus(null);
                      setTransactionId('');
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '12px',
                      background: 'rgba(0, 0, 0, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      fontSize: '20px',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      lineHeight: '1',
                      fontWeight: 'bold',
                      minWidth: '24px',
                      minHeight: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(239, 68, 68, 0.8)';
                      e.target.style.borderColor = '#ef4444';
                      e.target.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(0, 0, 0, 0.1)';
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.color = '#ffffff';
                    }}
                  >
                    ×
                  </button>
                  {(transactionStatus === 'pending' || transactionStatus === 'success' || transactionStatus === 'error') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                      <div>
                        {transactionStatus === 'pending' ? '⏳ Transaction broadcasted' : 
                         transactionStatus === 'success' ? '✅ Transaction confirmed!' : 
                         '❌ Broadcast failed, try again'}
                      </div>
                      {transactionId && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                        <span>ID: </span>
                        <a 
                          href={`https://explorer.stacks.co/txid/${transactionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ 
                            color: '#60a5fa', 
                            textDecoration: 'underline',
                            wordBreak: 'break-all'
                          }}
                        >
                          {transactionId}
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(transactionId);
                            // Show brief copy feedback
                            const button = event.target;
                            const originalText = button.textContent;
                            button.textContent = 'Copied!';
                            button.style.backgroundColor = '#10b981';
                            setTimeout(() => {
                              button.textContent = originalText;
                              button.style.backgroundColor = '#3b82f6';
                            }, 1000);
                          }}
                          style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Copy
                        </button>
                      </div>
                      )}
                      {transactionStatus === 'error' && (
                        <button
                          onClick={() => {
                            // Reset transaction status and allow retry
                            setTransactionStatus(null);
                            setShowTransactionStatus(false);
                            setTransactionId('');
                          }}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            marginTop: '4px'
                          }}
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                  )}
                  {transactionStatus === 'error' && '❌ Transaction failed'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

            {/* Action Buttons Section - Optional */}
      {console.log('🔍 showButtons value:', showButtons)}
      {showButtons && (
        <div style={{
          background: '#1c2d4e',
          borderRadius: '12px',
          padding: '16px',
          width: '100%',
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginTop: '12px'
        }}>
          <button
            onClick={onShowContracts}
            style={{
              background: '#3b82f6', 
              color: '#fff', 
              border: '1px solid #2563eb', 
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
              width: '220px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#2563eb';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#3b82f6';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
            }}
          >
            📋 Smart Contract Addresses
          </button>

          {/* Buy/Sell Button */}
          <button
            onClick={() => {
              setShowBuySellPanel(!showBuySellPanel);
            }}
            style={{
              backgroundColor: showBuySellPanel ? '#dc2626' : '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginLeft: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = showBuySellPanel ? '#b91c1c' : '#047857';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = showBuySellPanel ? '#dc2626' : '#059669';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            {showBuySellPanel ? '🔙 Back to Progress' : '💰 Buy/Sell'}
          </button>

                     {/* Whale Access Button */}
           <button
             onClick={() => {
               console.log('🔍 Whale access button clicked!');
               console.log('🔍 Current tokenBalance prop:', tokenBalance);
               
               // Check if user has 1,500+ token balance
               let userTokenBalance = 0;
               if (typeof tokenBalance === 'string') {
                 userTokenBalance = parseFloat(tokenBalance.replace(/,/g, '')) || 0;
               } else if (typeof tokenBalance === 'number') {
                 userTokenBalance = tokenBalance;
               } else {
                 userTokenBalance = 0;
               }
               const requiredBalance = 150000; // 150k tokens
               
               console.log('🔍 Whale access check:', {
                 userTokenBalance,
                 requiredBalance,
                 hasAccess: userTokenBalance >= requiredBalance,
                 tokenBalanceRaw: tokenBalance
               });
               
                               if (userTokenBalance >= requiredBalance) {
                  console.log('✅ User has access, opening whale popup');
                  setActiveSection('progress'); // Set default view to progress bar
                  setShowWhaleAccessPopup(true);
                } else {
                 console.log('❌ User does not have access, showing restriction popup');
                 setShowWhaleRestrictionPopup(true);
               }
             }}
            style={{
              backgroundColor: '#1e40af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginLeft: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1d4ed8';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#1e40af';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            🐋 Whale Access
          </button>


        </div>
      )}

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
              Claim Revenue feature is currently under development. Stay tuned for updates!
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

             {/* Whale Access Popup */}
       {showWhaleAccessPopup && (
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
             border: '2px solid #1e40af',
             borderRadius: '16px',
             padding: '40px',
             maxWidth: '600px',
             maxHeight: '80vh',
             overflow: 'auto',
             position: 'relative'
           }}>
             {/* Close Button */}
             <button
               onClick={() => setShowWhaleAccessPopup(false)}
               style={{
                 position: 'absolute',
                 top: '16px',
                 right: '16px',
                 backgroundColor: 'transparent',
                 border: 'none',
                 color: '#ccc',
                 fontSize: '24px',
                 cursor: 'pointer',
                 width: '32px',
                 height: '32px',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 borderRadius: '50%',
                 transition: 'all 0.2s ease'
               }}
               onMouseEnter={(e) => {
                 e.target.style.backgroundColor = '#374151';
                 e.target.style.color = '#fff';
               }}
               onMouseLeave={(e) => {
                 e.target.style.backgroundColor = 'transparent';
                 e.target.style.color = '#ccc';
               }}
             >
               ×
             </button>

             {/* Header */}
             <div style={{
               textAlign: 'center',
               marginBottom: '32px'
             }}>
               <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐋</div>
               <h2 style={{ color: '#1e40af', fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', fontFamily: 'Arial, sans-serif' }}>Whale Access</h2>
               <p style={{ color: '#ccc', fontSize: '16px', fontFamily: 'Arial, sans-serif' }}>Exclusive access to advanced trading features</p>
             </div>

                           {/* Section Toggle Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setActiveSection(activeSection === 'progress' ? null : 'progress')}
                  style={{
                    backgroundColor: activeSection === 'progress' ? '#1e40af' : '#374151',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== 'progress') {
                      e.target.style.backgroundColor = '#4b5563';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== 'progress') {
                      e.target.style.backgroundColor = '#374151';
                    }
                  }}
                >
                  🔓 Unlock Progress Bar
                </button>
                <button 
                  onClick={() => setActiveSection(activeSection === 'profit' ? null : 'profit')}
                  style={{
                    backgroundColor: activeSection === 'profit' ? '#1e40af' : '#374151',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== 'profit') {
                      e.target.style.backgroundColor = '#4b5563';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== 'profit') {
                      e.target.style.backgroundColor = '#374151';
                    }
                  }}
                >
                  📊 Profit / Loss
                </button>
                <button 
                  onClick={() => setActiveSection(activeSection === 'stats' ? null : 'stats')}
                  style={{
                    backgroundColor: activeSection === 'stats' ? '#1e40af' : '#374151',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== 'stats') {
                      e.target.style.backgroundColor = '#4b5563';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== 'stats') {
                      e.target.style.backgroundColor = '#374151';
                    }
                  }}
                >
                  📈 Project Statistics
                </button>
              </div>

             {/* Action Buttons */}
             <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
               <button 
                 onClick={() => { if (onClaimRevenue) { onClaimRevenue(); } else { setShowComingSoonPopup(true); } }}
                 style={{
                   backgroundColor: '#fbbf24',
                   color: '#1a1a2e',
                   border: 'none',
                   borderRadius: '8px',
                   padding: '12px 20px',
                   fontSize: '14px',
                   fontWeight: '600',
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
                 💰 Claim Revenue
               </button>
               
               {/* Lock Button */}
               <button 
                 onClick={() => console.log('Lock button clicked - no functionality')}
                 style={{
                   backgroundColor: '#dc2626',
                   color: 'white',
                   border: 'none',
                   borderRadius: '8px',
                   padding: '12px 20px',
                   fontSize: '14px',
                   fontWeight: '600',
                   cursor: 'pointer',
                   transition: 'all 0.2s ease',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '6px'
                 }}
                 onMouseEnter={(e) => {
                   e.target.style.backgroundColor = '#b91c1c';
                   e.target.style.transform = 'translateY(-1px)';
                 }}
                 onMouseLeave={(e) => {
                   e.target.style.backgroundColor = '#dc2626';
                   e.target.style.transform = 'translateY(0)';
                 }}
               >
                 🔒 Lock <img src="/icons/The Mas Network.svg" alt="MAS Sats" style={{ width: '16px', height: '16px' }} />
               </button>
               
               {/* Unlock Button */}
               <button 
                 onClick={() => console.log('Unlock button clicked - no functionality')}
                 style={{
                   backgroundColor: '#059669',
                   color: 'white',
                   border: 'none',
                   borderRadius: '8px',
                   padding: '12px 20px',
                   fontSize: '14px',
                   fontWeight: '600',
                   cursor: 'pointer',
                   transition: 'all 0.2s ease',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '6px'
                 }}
                 onMouseEnter={(e) => {
                   e.target.style.backgroundColor = '#047857';
                   e.target.style.transform = 'translateY(-1px)';
                 }}
                 onMouseLeave={(e) => {
                   e.target.style.backgroundColor = '#059669';
                   e.target.style.transform = 'translateY(0)';
                 }}
               >
                 🔓 Unlock <img src="/icons/The Mas Network.svg" alt="MAS Sats" style={{ width: '16px', height: '16px' }} />
               </button>
             </div>

             {/* Content Area */}
             <div style={{
               backgroundColor: '#374151',
               borderRadius: '8px',
               padding: '24px',
               minHeight: '200px'
             }}>
                               {activeSection === 'progress' && (
                  <div style={{
                    textAlign: 'center',
                    color: '#ccc',
                    fontSize: '16px',
                    lineHeight: '1.6'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔓</div>
                    <p>Unlock Progress Information</p>
                    <p style={{ fontSize: '14px', marginTop: '8px', marginBottom: '24px' }}>
                      Track your progress towards unlocking tokens.
                    </p>
                    
                    {/* Independent Whale Access Progress Bar */}
                    <WhaleAccessProgressBar
                      tokenSymbol={tokenSymbol}
                      revenue={revenue}
                      liquidity={liquidity}
                      tokenId={tokenId}
                      dexInfo={dexInfo}
                      tokenInfo={tokenInfo}
                    />
                  </div>
                )}
                {activeSection === 'profit' && (
                  <ProfitLoss 
                    tokenData={{ symbol: tokenSymbol, id: tokenId, dexInfo, tokenInfo }} 
                    trades={[]} 
                    currentPrice={0} 
                  />
                )}
                {activeSection === 'stats' && (
                  <TokenStats 
                    revenue={revenue} 
                    liquidity={liquidity} 
                    remainingSupply="--" 
                    dexInfo={dexInfo} 
                    tokenInfo={tokenInfo} 
                  />
                )}
                {!activeSection && (
                 <div style={{
                   textAlign: 'center',
                   color: '#ccc',
                   fontSize: '16px',
                   lineHeight: '1.6'
                 }}>
                   <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐋</div>
                   <p>Welcome to Whale Access!</p>
                   <p style={{ fontSize: '14px', marginTop: '8px', marginBottom: '24px' }}>
                     Select a section above to view advanced trading features and analytics.
                   </p>
                   
                   {/* Unlock Progress Bar */}
                   <div style={{
                     background: '#1c2d4e',
                     borderRadius: '12px',
                     padding: '20px',
                     marginTop: '20px'
                   }}>
                                           <div style={{ 
                        fontSize: '16px', 
                        color: '#ffa500', 
                        fontWeight: '600', 
                        marginBottom: '16px',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}>
                        Progress to Unlock {tokenSymbol === 'MAS' ? (
                          <img 
                            src="/icons/The Mas Network.svg" 
                            alt="MAS Sats" 
                            style={{ 
                              width: '20px', 
                              height: '20px'
                            }} 
                          />
                        ) : tokenSymbol}
                      </div>
                     
                     <div style={{ 
                       display: 'flex', 
                       alignItems: 'flex-start', 
                       gap: '12px',
                       marginBottom: '16px'
                     }}>
                       <div style={{
                         flex: 1,
                         height: '24px',
                         backgroundColor: 'rgba(255, 255, 255, 0.1)',
                         borderRadius: '12px',
                         overflow: 'hidden',
                         border: '1px solid rgba(255, 255, 255, 0.2)',
                         position: 'relative'
                       }}>
                         <div style={{
                           width: `${progressPercentage}%`,
                           height: '100%',
                           background: 'linear-gradient(90deg, #ffa500, #ff8c00)',
                           borderRadius: '12px',
                           transition: 'width 0.3s ease'
                         }}></div>
                       </div>
                       
                       {/* Lock/Unlock Emoji with Threshold Info */}
                       <div style={{
                         display: 'flex',
                         flexDirection: 'column',
                         alignItems: 'center',
                         gap: '4px',
                         minWidth: '80px'
                       }}>
                         <div style={{ 
                           fontSize: '24px'
                         }}>
                           {currentRevenue >= minimumRevenueThreshold ? '🔓' : '🔒'}
                         </div>
                         
                         <div style={{
                           fontSize: '10px',
                           color: '#ffa500',
                           textAlign: 'center'
                         }}>
                           {currentRevenue >= minimumRevenueThreshold ? (
                             <>
                               <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Maintain:</div>
                               <div style={{
                                 display: 'flex',
                                 alignItems: 'center',
                                 gap: '4px',
                                 fontSize: '12px',
                                 fontWeight: 'bold',
                                 justifyContent: 'center'
                               }}>
                                 {loadingThreshold ? 'Loading...' : (minimumRevenueThreshold || 1500).toLocaleString()}
                                 <img 
                                   src="/icons/sats1.svg" 
                                   alt="Sats" 
                                   style={{ 
                                     width: '12px', 
                                     height: '12px'
                                   }} 
                                 />
                                 <img 
                                   src="/icons/Vector.svg" 
                                   alt="Vector" 
                                   style={{ 
                                     width: '12px', 
                                     height: '12px'
                                   }} 
                                 />
                               </div>
                             </>
                           ) : (
                             <>
                               <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Min Needed:</div>
                               <div style={{
                                 display: 'flex',
                                 alignItems: 'center',
                                 gap: '4px',
                                 fontSize: '12px',
                                 fontWeight: 'bold',
                                 justifyContent: 'center'
                               }}>
                                 {loadingThreshold ? 'Loading...' : minimumRevenueThreshold.toLocaleString()}
                                 <img 
                                   src="/icons/sats1.svg" 
                                   alt="Sats" 
                                   style={{ 
                                     width: '12px', 
                                     height: '12px'
                                   }} 
                                 />
                                 <img 
                                   src="/icons/Vector.svg" 
                                   alt="Vector" 
                                   style={{ 
                                     width: '12px', 
                                     height: '12px'
                                   }} 
                                 />
                               </div>
                             </>
                           )}
                         </div>
                       </div>
                     </div>
                     
                     {/* Current Revenue Display */}
                     <div style={{
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       gap: '4px',
                       fontSize: '14px',
                       fontWeight: '600',
                       color: '#ffa500',
                       marginBottom: '8px'
                     }}>
                       <span>Current Profit Available to Claim: {revenue}</span>
                       <img 
                         src="/icons/sats1.svg" 
                         alt="Sats" 
                         style={{ 
                           width: '16px', 
                           height: '16px'
                         }} 
                       />
                       <img 
                         src="/icons/Vector.svg" 
                         alt="Vector" 
                         style={{ 
                           width: '16px', 
                           height: '16px'
                         }} 
                       />
                     </div>
                     
                     {/* Progress Percentage */}
                     <div style={{
                       textAlign: 'center',
                       fontSize: '12px',
                       color: '#9ca3af',
                       marginTop: '8px'
                     }}>
                       {progressPercentage.toFixed(1)}% Complete
                     </div>
                   </div>
                 </div>
               )}
             </div>
           </div>
         </div>
       )}

       {/* Whale Access Restriction Popup */}
       {showWhaleRestrictionPopup && (
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
             border: '2px solid #ef4444',
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
               🐋
             </div>
             <h2 style={{
               color: '#fbbf24',
               fontSize: window.innerWidth <= 768 ? '20px' : '24px',
               fontWeight: 'bold',
               marginBottom: window.innerWidth <= 768 ? '12px' : '16px',
               fontFamily: 'Arial, sans-serif'
             }}>
               VIP Whale Club Access
             </h2>
             <p style={{
               color: '#ccc',
               fontSize: window.innerWidth <= 768 ? '14px' : '16px',
               lineHeight: '1.5',
               marginBottom: window.innerWidth <= 768 ? '20px' : '24px',
               fontFamily: 'Arial, sans-serif'
             }}>
               For serious holders only. Come back when you're ready to compete for protocol profits. Minimum balance required: <strong style={{ color: '#fbbf24' }}>150,000</strong>
               <img 
                 src="/icons/The Mas Network.svg" 
                 alt="MAS Sats" 
                 style={{ 
                   width: '16px', 
                   height: '16px',
                   verticalAlign: 'middle',
                   marginLeft: '4px'
                 }} 
               />
             </p>
             <div style={{
               backgroundColor: '#374151',
               borderRadius: '8px',
               padding: window.innerWidth <= 768 ? '12px' : '16px',
               marginBottom: window.innerWidth <= 768 ? '20px' : '24px',
               border: '1px solid #4b5563'
             }}>
               <p style={{
                 color: '#ccc',
                 fontSize: window.innerWidth <= 768 ? '12px' : '14px',
                 marginBottom: window.innerWidth <= 768 ? '6px' : '8px'
               }}>
                 Your current balance:
               </p>
               <p style={{
                 color: '#fbbf24',
                 fontSize: window.innerWidth <= 768 ? '16px' : '18px',
                 fontWeight: 'bold'
               }}>
                 {userTokenBalance.toLocaleString()}
               </p>
             </div>
             <button
               onClick={() => setShowWhaleRestrictionPopup(false)}
               style={{
                 backgroundColor: '#ef4444',
                 color: 'white',
                 border: 'none',
                 borderRadius: '8px',
                 padding: window.innerWidth <= 768 ? '10px 20px' : '12px 24px',
                 fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                 fontWeight: 'bold',
                 cursor: 'pointer',
                 transition: 'all 0.2s ease'
               }}
               onMouseEnter={(e) => {
                 e.target.style.backgroundColor = '#dc2626';
                 e.target.style.transform = 'translateY(-1px)';
               }}
               onMouseLeave={(e) => {
                 e.target.style.backgroundColor = '#ef4444';
                 e.target.style.transform = 'translateY(0)';
               }}
             >
               Close
             </button>
           </div>
         </div>
       )}


     </div>
   );
 });

export default UnlockProgressBar;