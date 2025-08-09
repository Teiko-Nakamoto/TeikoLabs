'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { request } from '@stacks/connect';
import { fetchCallReadOnlyFunction, principalCV } from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';

export default function CreateTokenPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [connectedAddress, setConnectedAddress] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('testnet');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState('');
  const [showContractModal, setShowContractModal] = useState(false);
  const [deploymentSuccess, setDeploymentSuccess] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [showMainnetComingSoon, setShowMainnetComingSoon] = useState(false);
  const [pendingTokens, setPendingTokens] = useState([]);
  const [hasPendingToken, setHasPendingToken] = useState(false);
  const [showPendingTokenModal, setShowPendingTokenModal] = useState(false);
  const [isCheckingPendingTokens, setIsCheckingPendingTokens] = useState(false);
  const [isDexDeploying, setIsDexDeploying] = useState(false);
  const [dexDeploymentStatus, setDexDeploymentStatus] = useState('');
  const [dexDeploymentSuccess, setDexDeploymentSuccess] = useState(false);
  const [dexTransactionDetails, setDexTransactionDetails] = useState(null);
  const [showDexContractModal, setShowDexContractModal] = useState(false);
  const [deployedTokens, setDeployedTokens] = useState([]);
  const [hasDeployedToken, setHasDeployedToken] = useState(false);
  const [showDeployedTokenModal, setShowDeployedTokenModal] = useState(false);
  const [isCheckingDeployedTokens, setIsCheckingDeployedTokens] = useState(false);
  const [isSymbolAvailable, setIsSymbolAvailable] = useState(true);
  const [isCheckingSymbol, setIsCheckingSymbol] = useState(false);
  const [symbolCheckMessage, setSymbolCheckMessage] = useState('');
  const [isMintingTreasuryTokens, setIsMintingTreasuryTokens] = useState(false);
  const [treasuryTokenMintSuccess, setTreasuryTokenMintSuccess] = useState(false);
  const [treasuryTokenMintStatus, setTreasuryTokenMintStatus] = useState('');
  const [treasuryTokenDetails, setTreasuryTokenDetails] = useState(null);
  const [isMintingSupplyToDex, setIsMintingSupplyToDex] = useState(false);
  const [mintSupplyToDexSuccess, setMintSupplyToDexSuccess] = useState(false);
  const [mintSupplyToDexStatus, setMintSupplyToDexStatus] = useState('');
  const [mintSupplyToDexDetails, setMintSupplyToDexDetails] = useState(null);
  const [dexTokenBalance, setDexTokenBalance] = useState(null);
  const [isCheckingDexBalance, setIsCheckingDexBalance] = useState(false);
  const [mintingStatusUpdated, setMintingStatusUpdated] = useState(false);
  const [isUpdatingMintingStatus, setIsUpdatingMintingStatus] = useState(false);
  
  // Admin wallet address
  const ADMIN_ADDRESS = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';

  // Check wallet connection and admin status
  useEffect(() => {
    const checkWalletConnection = () => {
      const savedAddress = localStorage.getItem('connectedAddress');
      if (savedAddress) {
        setConnectedAddress(savedAddress);
        setIsAdmin(savedAddress === ADMIN_ADDRESS);
      } else {
        setConnectedAddress('');
        setIsAdmin(false);
      }
    };

    // Check on mount
    checkWalletConnection();

    // Listen for storage changes (when wallet connects/disconnects)
    const handleStorageChange = (e) => {
      if (e.key === 'connectedAddress') {
        checkWalletConnection();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Redirect to home if no wallet connected (except for step 1)
  useEffect(() => {
    if (!connectedAddress && currentStep > 1) {
      window.location.href = '/';
    }
  }, [connectedAddress, currentStep]);

  // Check for pending tokens when wallet connects
  useEffect(() => {
    if (connectedAddress) {
      checkPendingTokens();
    }
  }, [connectedAddress]);

  // Check for pending tokens when reaching Step 3
  useEffect(() => {
    if (currentStep === 3 && connectedAddress) {
      checkPendingTokens();
      checkDeployedTokens();
    }
  }, [currentStep, connectedAddress]);

  // Check for existing DEX transactions when reaching Step 4
  useEffect(() => {
    const txId = transactionDetails?.txId || transactionDetails?.transactionId;
    if (currentStep === 4 && transactionDetails && txId && !dexDeploymentSuccess) {
      console.log('🔍 Step 4: Automatically checking for existing DEX deployment...', txId);
      console.log('🔍 Step 4: Current transactionDetails:', transactionDetails);
      console.log('🔍 Step 4: Current dexDeploymentSuccess:', dexDeploymentSuccess);
      
      const autoCheckExistingDex = async () => {
        try {
          const existingDexCheck = await checkExistingDexTransaction(txId);
          console.log('🔍 Step 4: Full API response:', existingDexCheck);
          
          if (existingDexCheck.exists && existingDexCheck.verified && existingDexCheck.token) {
            console.log('🔍 Step 4: Found verified DEX deployment, auto-loading...');
          console.log('🔍 Step 4: Token data:', existingDexCheck.token);
          console.log('🔍 Step 4: DEX TX Hash:', existingDexCheck.token.dexDeploymentTxHash);
          console.log('🔍 Step 4: DEX Contract:', existingDexCheck.token.dexContractAddress);
            
            const existingToken = existingDexCheck.token;
            const dexExplorerUrl = selectedNetwork === 'mainnet' 
              ? `https://explorer.stacks.co/txid/${existingToken.dexDeploymentTxHash}`
              : `https://explorer.stacks.co/txid/${existingToken.dexDeploymentTxHash}?chain=testnet`;
            
            // Auto-load the existing DEX transaction details
            setDexTransactionDetails({
              txId: existingToken.dexDeploymentTxHash,
              contractAddress: existingToken.dexContractAddress,
              explorerUrl: dexExplorerUrl,
              network: selectedNetwork,
              tokenName: existingToken.tokenName,
              tokenSymbol: existingToken.tokenSymbol
            });
            
            setDexDeploymentSuccess(true);
            setDexDeploymentStatus('✅ Found verified DEX deployment! Your treasury is already available.');
          } else if (existingDexCheck.exists && !existingDexCheck.verified) {
            console.warn('⚠️ Step 4: Found fake/invalid DEX transaction in database:', existingDexCheck.invalidRecord);
            console.log('📦 Step 4: Resetting DEX state and allowing new deployment.');
            
            // Reset DEX deployment state since the transaction is invalid
            setDexDeploymentSuccess(false);
            setDexTransactionDetails(null);
            setDexDeploymentStatus('⚠️ Invalid DEX record detected. You can deploy a new treasury.');
          } else {
            console.log('📦 Step 4: No existing DEX found, user can deploy new treasury.');
            console.log('📦 Step 4: API response details:', existingDexCheck);
            
            // Ensure DEX state is reset
            setDexDeploymentSuccess(false);
            setDexTransactionDetails(null);
            setDexDeploymentStatus('');
          }
        } catch (error) {
          console.error('❌ Step 4: Error checking for existing DEX:', error);
        }
      };
      
      autoCheckExistingDex();
    }
  }, [currentStep, transactionDetails, dexDeploymentSuccess, selectedNetwork]);

  // Check DEX token balance when reaching Step 5
  useEffect(() => {
    if (currentStep === 5 && transactionDetails && dexTransactionDetails && !isCheckingDexBalance) {
      console.log('🔍 Step 5: Automatically checking DEX token balance...');
      checkDexTokenBalance();
    }
  }, [currentStep, transactionDetails, dexTransactionDetails]);

  // Check symbol uniqueness when network changes
  useEffect(() => {
    if (tokenSymbol && tokenSymbol.length > 0) {
      checkSymbolUniqueness(tokenSymbol);
    }
  }, [selectedNetwork]);

  // Handle mainnet selection (blocked for now)
  const handleMainnetSelection = () => {
    setShowMainnetComingSoon(true);
  };

  // Check for pending tokens (tokens without DEX contracts)
  const checkPendingTokens = async () => {
    if (!connectedAddress) return;
    
    setIsCheckingPendingTokens(true);
    try {
      console.log('🔍 Checking for pending tokens for wallet:', connectedAddress);
      const response = await fetch(`/api/user-tokens/list?creator=${connectedAddress}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 All tokens from backend:', data.tokens);
        
        const pending = data.tokens.filter(token => 
          token.deploymentStatus === 'deployed' && 
          (!token.dexContractAddress || token.dexContractAddress === '')
        );
        
        console.log('⏳ Pending tokens found:', pending);
        setPendingTokens(pending);
        setHasPendingToken(pending.length > 0);
        
        if (pending.length > 0) {
          console.log('⚠️ User has pending tokens - blocking new deployment');
        } else {
          console.log('✅ No pending tokens - user can deploy new token');
        }
      } else {
        console.error('❌ Failed to fetch tokens:', response.status);
      }
    } catch (error) {
      console.error('❌ Error checking pending tokens:', error);
    } finally {
      setIsCheckingPendingTokens(false);
    }
  };

  // Check for already deployed tokens (tokens that are already deployed)
  const checkDeployedTokens = async () => {
    if (!connectedAddress) return;
    
    setIsCheckingDeployedTokens(true);
    try {
      console.log('🔍 Checking for deployed tokens for wallet:', connectedAddress);
      const response = await fetch(`/api/user-tokens/list?creator=${connectedAddress}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 All tokens from backend:', data.tokens);
        
        const deployed = data.tokens.filter(token => 
          token.deploymentStatus === 'deployed' && 
          token.deploymentTxHash && 
          token.deploymentTxHash !== ''
        );
        
        console.log('🚀 Deployed tokens found:', deployed);
        setDeployedTokens(deployed);
        setHasDeployedToken(deployed.length > 0);
        
        if (deployed.length > 0) {
          console.log('⚠️ User already has deployed tokens - can proceed to Step 4');
          // Set the most recent deployed token as the transaction details
          const mostRecentToken = deployed[0];
          setTransactionDetails({
            contractAddress: mostRecentToken.tokenContractAddress,
            tokenName: mostRecentToken.tokenName,
            tokenSymbol: mostRecentToken.tokenSymbol,
            transactionId: mostRecentToken.deploymentTxHash,
            network: mostRecentToken.network || selectedNetwork,
            deployedBy: mostRecentToken.creatorWalletAddress,
            deploymentTime: mostRecentToken.createdAt
          });
          setDeploymentSuccess(true);
        } else {
          console.log('✅ No deployed tokens - user can deploy new token');
        }
      } else {
        console.error('❌ Failed to fetch tokens:', response.status);
      }
    } catch (error) {
      console.error('❌ Error checking deployed tokens:', error);
    } finally {
      setIsCheckingDeployedTokens(false);
    }
  };

  // Check if symbol is unique on the selected network
  const checkSymbolUniqueness = async (symbol) => {
    if (!symbol || symbol.length < 1) {
      setSymbolCheckMessage('');
      setIsSymbolAvailable(true);
      return;
    }

    // For testnet, validate the TP prefix format
    if (selectedNetwork === 'testnet') {
      if (!validateTestnetInitials(symbol)) {
        setIsSymbolAvailable(false);
        setSymbolCheckMessage(`⚠️ Testnet projects must start with "TP" followed by 2-4 characters (e.g., TPBTC, TPETH)`);
        return;
      }
      
      // For testnet, allow reuse of project initials
      setIsSymbolAvailable(true);
      setSymbolCheckMessage(`✅ "${symbol}" is valid for testnet (reusable)`);
      return;
    }

    // For mainnet, check uniqueness as before
    setIsCheckingSymbol(true);
    try {
      console.log(`🔍 Checking symbol uniqueness for "${symbol}" on ${selectedNetwork}`);
      const response = await fetch(`/api/user-tokens/list?status=deployed`);
      if (response.ok) {
        const data = await response.json();
        
        // Filter tokens by network and symbol
        const existingTokensWithSymbol = data.tokens.filter(token => 
          token.tokenSymbol === symbol && 
          (token.network === selectedNetwork || (!token.network && selectedNetwork === 'testnet')) // Default to testnet if no network specified
        );
        
        if (existingTokensWithSymbol.length > 0) {
          setIsSymbolAvailable(false);
          setSymbolCheckMessage(`⚠️ "${symbol}" is already taken on ${selectedNetwork}`);
          console.log(`❌ Symbol "${symbol}" already exists on ${selectedNetwork}:`, existingTokensWithSymbol);
        } else {
          setIsSymbolAvailable(true);
          setSymbolCheckMessage(`✅ "${symbol}" is available on ${selectedNetwork}`);
          console.log(`✅ Symbol "${symbol}" is available on ${selectedNetwork}`);
        }
      } else {
        console.error('❌ Failed to check symbol uniqueness:', response.status);
        setSymbolCheckMessage('Unable to check symbol availability');
        setIsSymbolAvailable(true); // Allow on error
      }
    } catch (error) {
      console.error('❌ Error checking symbol uniqueness:', error);
      setSymbolCheckMessage('Unable to check symbol availability');
      setIsSymbolAvailable(true); // Allow on error
    } finally {
      setIsCheckingSymbol(false);
    }
  };

  const handleTokenLaunch = async () => {
    if (!tokenName.trim() || !tokenSymbol.trim() || isDeploying) {
      return;
    }

    // Check if wallet is connected before proceeding
    if (!connectedAddress) {
      setDeploymentStatus('❌ Please connect your wallet to deploy your token');
      return;
    }

    // Check for pending tokens before allowing new deployment
    if (hasPendingToken) {
      setShowPendingTokenModal(true);
      return;
    }

    setIsDeploying(true);
    setDeploymentStatus('Preparing deployment...');

    try {
      // Generate smart contract code
      const contractCode = generateTokenContract(tokenName.trim(), tokenSymbol.trim());
      
      setDeploymentStatus('Generating smart contract...');
      
      // Deploy contract using Stacks Connect
      setDeploymentStatus('Deploying to Stacks blockchain...');
      
      const tokenContractName = tokenSymbol.toLowerCase();
      
      const response = await request('stx_deployContract', {
        name: tokenContractName,
        clarityCode: contractCode,
        clarityVersion: 3,
      });
      
      console.log('Deployment response:', response);
      
      // Generate contract address
      const contractAddress = `${connectedAddress}.${tokenContractName}`;
      
      // Get transaction ID from response (handle both txId and txid formats)
      const rawTransactionId = response.txId || response.txid;
      
      // Ensure transaction ID has 0x prefix for explorer URL
      const transactionId = rawTransactionId.startsWith('0x') ? rawTransactionId : `0x${rawTransactionId}`;
      
      const explorerUrl = selectedNetwork === 'mainnet' 
        ? `https://explorer.stacks.co/txid/${transactionId}`
        : `https://explorer.stacks.co/txid/${transactionId}?chain=testnet`;
      
      // Comprehensive console logging for successful transaction
      console.log('🎉 SUCCESSFUL TOKEN DEPLOYMENT!');
      console.log('📋 Transaction Details:');
      console.log(`   Transaction ID: ${transactionId}`);
      console.log(`   Contract Address: ${contractAddress}`);
      console.log(`   Token Name: ${tokenName.trim()}`);
      console.log(`   Token Symbol: ${tokenSymbol.trim()}`);
      console.log(`   Network: ${selectedNetwork}`);
      console.log(`   Deployed By: ${connectedAddress}`);
      console.log(`   Explorer URL: ${explorerUrl}`);
      console.log(`   Deployment Time: ${new Date().toISOString()}`);
      console.log('🔗 View Transaction:', explorerUrl);
      console.log('✅ Token deployment completed successfully!');
      
      // Save to database
      const tokenData = {
        name: tokenName.trim(),
        symbol: tokenSymbol.trim(),
        network: selectedNetwork,
        contractAddress,
        deployedBy: connectedAddress,
        deployedAt: new Date().toISOString(),
        txId: transactionId,
        explorerUrl
      };
      
      await saveTokenToDatabase(tokenData);
      
      // Set success state with transaction details
      setTransactionDetails({
        txId: transactionId,
        contractAddress,
        explorerUrl,
        network: selectedNetwork,
        tokenName: tokenName.trim(),
        tokenSymbol: tokenSymbol.trim()
      });
      setDeploymentSuccess(true);
      setDeploymentStatus('✅ Deployment successful! Your token has been deployed to the blockchain.');
      
      // Update pending tokens list after successful deployment
      await checkPendingTokens();
      
    } catch (error) {
      console.error('Deployment error:', error);
      setDeploymentStatus(`❌ Error: ${error.message || 'Deployment failed'}`);
    } finally {
      setIsDeploying(false);
    }
  };

  // Helper function to create contract name from project name
  const createContractName = (projectName) => {
    if (!projectName) return '';
    return projectName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
      .slice(0, 40); // Limit length
  };

  const generateDexContract = (tokenContractAddress, symbol, network = 'testnet') => {
    const dexContractName = `${symbol.toLowerCase()}-sats-treasury`;
    const feeWalletAddress = network === 'mainnet' ? 
      'SP1FD5DXTJW8V5E6ZVDBZS83B3T6YM82QCM18Y5BF' : 
      'STSRT3FWW891ZMM6FTPCDTXN006Q1549AVRB7V9Y';
    
    return `;; TRAITS
(use-trait sip-010-trait 'ST2SHP0RSX5ST9HTKJM4JF6SGQ686P4GJGF2XHHTX.sip-010-trait-ft-standard.sip-010-trait)

;; CONSTANTS
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_NOT_ENOUGH_SBTC_BALANCE (err u1003))
(define-constant ERR_NOT_ENOUGH_TOKEN_BALANCE (err u1004))
(define-constant BUY_INFO_ERROR (err u2001))
(define-constant SELL_INFO_ERROR (err u2002))
(define-constant ERR_SELL_AMOUNT (err u2004))
(define-constant ERR_INVALID_AMOUNT (err u3001))
(define-constant ERR_NOTHING_TO_UNLOCK (err u3002))
(define-constant ERR_NOT_MAJORITY (err u3003))
(define-constant ERR_FEE_POOL_TOO_LOW (err u3004))

(define-constant DEX_ADDRESS (as-contract tx-sender))
(define-constant MAX_SUPPLY u2100000000000000)
(define-constant INITIAL_VIRTUAL_SBTC u1500000)
(define-constant DEFAULT_UNLOCK_THRESHOLD u1500) ;; new default threshold
(define-constant MAX_WITHDRAW_CAP u1000000) ;; max withdrawal amount for threshold updates

;; DATA VARIABLES
(define-data-var token-balance uint MAX_SUPPLY)
(define-data-var sbtc-balance uint u0)
(define-data-var virtual-sbtc-amount uint INITIAL_VIRTUAL_SBTC)
(define-data-var sbtc-fee-pool uint u0)
(define-data-var total-swap-fees-sent uint u0)

;; Locking system
(define-map locked-balances { user: principal } { amount: uint })
(define-data-var total-locked uint u0)
(define-data-var majority-holder (optional principal) none)

;; Dynamic threshold system
(define-data-var last-withdraw-amount uint u0)

;; -----------------------------
;; PUBLIC FUNCTIONS
;; -----------------------------

(define-public (buy (sbtc-amount uint))
  (begin
    (asserts! (> sbtc-amount u0) ERR_NOT_ENOUGH_SBTC_BALANCE)
    (let (
      (buy-info (unwrap! (get-buyable-token-details sbtc-amount) BUY_INFO_ERROR))
      (sbtc-total-fee (get fee buy-info))
      (sbtc-swap-fee (get swap-fee buy-info))
      (sbtc-majority-fee (get majority-fee buy-info))
      (sbtc-after-fee (get sbtc-buy buy-info))
      (tokens-out (get buyable-token buy-info))
      (new-sbtc-balance (get new-sbtc-balance buy-info))
      (new-token-balance (get new-token-balance buy-info))
      (recipient tx-sender)
    )
      ;; Transfer 0.6% immediately to swap fee wallet
      (try! (contract-call? 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token 
        transfer sbtc-swap-fee tx-sender '${feeWalletAddress} (some 0x00)))

      ;; Transfer remaining SBTC to DEX
      (try! (contract-call? 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token 
        transfer sbtc-after-fee tx-sender DEX_ADDRESS (some 0x00)))

      ;; Transfer tokens to buyer
      (try! (as-contract (contract-call? '${tokenContractAddress}
        transfer tokens-out DEX_ADDRESS recipient (some 0x00))))

      ;; Update balances
      (var-set sbtc-balance (+ (var-get sbtc-balance) sbtc-after-fee))
      (var-set sbtc-fee-pool (+ (var-get sbtc-fee-pool) sbtc-majority-fee))
      (var-set token-balance new-token-balance)
      (var-set total-swap-fees-sent (+ (var-get total-swap-fees-sent) sbtc-swap-fee))

      (ok tokens-out)
    )
  )
)

(define-public (sell (tokens-in uint))
  (begin
    (asserts! (> tokens-in u0) ERR_NOT_ENOUGH_TOKEN_BALANCE)
    (let (
      (sell-info (unwrap! (get-sellable-sbtc tokens-in) SELL_INFO_ERROR))
      (sbtc-total-fee (get fee sell-info))
      (sbtc-swap-fee (get swap-fee sell-info))
      (sbtc-majority-fee (get majority-fee sell-info))
      (sbtc-receive (get sbtc-receive sell-info))
      (current-sbtc-balance (get current-sbtc-balance sell-info))
      (new-token-balance (get new-token-balance sell-info))
      (new-sbtc-balance (get new-sbtc-balance sell-info))
      (recipient tx-sender)
    )
      (asserts! (>= current-sbtc-balance sbtc-receive) ERR_NOT_ENOUGH_SBTC_BALANCE)
      (asserts! (>= sbtc-receive u0) ERR_SELL_AMOUNT)

      ;; User sends tokens to DEX
      (try! (contract-call? '${tokenContractAddress}
        transfer tokens-in tx-sender DEX_ADDRESS (some 0x00)))

      ;; Send SBTC to seller
      (try! (as-contract (contract-call? 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token 
        transfer sbtc-receive DEX_ADDRESS recipient (some 0x00))))

      ;; Transfer 0.6% immediately to swap fee wallet
      (try! (as-contract (contract-call? 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token 
        transfer sbtc-swap-fee DEX_ADDRESS '${feeWalletAddress} (some 0x00))))

      ;; Update internal balances
      (var-set sbtc-balance (- (var-get sbtc-balance) (+ sbtc-receive sbtc-total-fee)))
      (var-set sbtc-fee-pool (+ (var-get sbtc-fee-pool) sbtc-majority-fee))
      (var-set token-balance new-token-balance)
      (var-set total-swap-fees-sent (+ (var-get total-swap-fees-sent) sbtc-swap-fee))

      (ok sbtc-receive)
    )
  )
)

(define-public (withdraw-fees (amount uint))
  (let (
    (recipient tx-sender)
    (maybe-majority (var-get majority-holder))
    (current-last-withdraw (var-get last-withdraw-amount))
  )
    (begin
      (asserts! (> amount u0) (err u400))
      (asserts! (<= amount (var-get sbtc-fee-pool)) (err u401))
      (asserts! (is-eq maybe-majority (some tx-sender)) ERR_UNAUTHORIZED)

      ;; Send SBTC fee from DEX to user
      (try! (as-contract (contract-call? 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token
        transfer amount DEX_ADDRESS recipient none)))

      ;; Subtract from internal pool
      (var-set sbtc-fee-pool (- (var-get sbtc-fee-pool) amount))

      ;; Update last-withdraw-amount if conditions are met
      (if (and (> amount current-last-withdraw) 
               (< amount MAX_WITHDRAW_CAP))
        (var-set last-withdraw-amount amount)
        false)

      (ok amount)
    )
  )
)

;; Token Locking Logic

(define-public (lock-tokens (amount uint))
  (begin
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (try! (contract-call? '${tokenContractAddress} transfer amount tx-sender DEX_ADDRESS (some 0x00)))
    (let ((currently-locked (default-to u0 (get amount (map-get? locked-balances { user: tx-sender })))))
      (map-set locked-balances { user: tx-sender } { amount: (+ currently-locked amount) })
      (var-set total-locked (+ (var-get total-locked) amount))
    )
    (ok true)
  )
)

(define-public (unlock-tokens (amount uint))
  (let (
    (locked (default-to u0 (get amount (map-get? locked-balances { user: tx-sender }))))
    (recipient tx-sender)  ;; Capture user address before as-contract
  )
    (begin
      (asserts! (> amount u0) ERR_INVALID_AMOUNT)
      (asserts! (>= locked amount) ERR_NOTHING_TO_UNLOCK)
      ;; Use can-unlock to check if fee pool meets threshold
      (asserts! (unwrap-panic (can-unlock)) ERR_FEE_POOL_TOO_LOW)
      ;; Use as-contract so DEX can transfer its own tokens to the recipient
      (try! (as-contract (contract-call? '${tokenContractAddress} transfer amount DEX_ADDRESS recipient (some 0x00))))
      (map-set locked-balances { user: recipient } { amount: (- locked amount) })
      (var-set total-locked (- (var-get total-locked) amount))
      (ok true)
    )
  )
)

(define-public (claim-majority-holder-status)
  (let (
    (user-locked (default-to u0 (get amount (map-get? locked-balances { user: tx-sender }))))
    (total (var-get total-locked))
  )
    (begin
      (asserts! (> total u0) ERR_NOTHING_TO_UNLOCK)
      (if (> (* user-locked u100) (/ (* total u100) u2))
        (begin
          (var-set majority-holder (some tx-sender))
          (ok true)
        )
        ERR_NOT_MAJORITY
      )
    )
  )
)

;; -----------------------------
;; READ-ONLY FUNCTIONS
;; -----------------------------

(define-read-only (get-sbtc-balance) (ok (var-get sbtc-balance)))
(define-read-only (get-sbtc-fee-pool) (ok (var-get sbtc-fee-pool)))
(define-read-only (get-token-balance) (ok (var-get token-balance)))

(define-read-only (get-buyable-token-details (sbtc-amount uint))
  (let (
    (current-sbtc-balance (+ (var-get sbtc-balance) (var-get virtual-sbtc-amount)))
    (current-token-balance (var-get token-balance))
    (sbtc-total-fee (/ (* sbtc-amount u21) u1000))  ;; 2.1%
    (sbtc-swap-fee (/ (* sbtc-total-fee u6) u21))   ;; 0.6%
    (sbtc-majority-fee (/ (* sbtc-total-fee u15) u21))  ;; 1.5%
    (sbtc-after-fee (- sbtc-amount sbtc-total-fee))
    (k (* current-token-balance current-sbtc-balance))
    (new-sbtc-balance (+ current-sbtc-balance sbtc-after-fee))
    (new-token-balance (/ k new-sbtc-balance))
    (tokens-out (- current-token-balance new-token-balance))
  )
    (ok {
      fee: sbtc-total-fee,
      swap-fee: sbtc-swap-fee,
      majority-fee: sbtc-majority-fee,
      buyable-token: tokens-out,
      sbtc-buy: sbtc-after-fee,
      new-token-balance: new-token-balance,
      sbtc-balance: (var-get sbtc-balance),
      new-sbtc-balance: new-sbtc-balance,
      token-balance: (var-get token-balance)
    })
  )
)

(define-read-only (get-sellable-sbtc (token-amount uint))
  (let (
    (current-sbtc-balance (+ (var-get sbtc-balance) (var-get virtual-sbtc-amount)))
    (current-token-balance (var-get token-balance))
    (k (* current-token-balance current-sbtc-balance))
    (new-token-balance (+ current-token-balance token-amount))
    (new-sbtc-balance (/ k new-token-balance))
    (sbtc-out (- (- current-sbtc-balance new-sbtc-balance) u1))  ;; round protection
    (sbtc-total-fee (/ (* sbtc-out u21) u1000))  ;; 2.1%
    (sbtc-swap-fee (/ (* sbtc-total-fee u6) u21))   ;; 0.6%
    (sbtc-majority-fee (/ (* sbtc-total-fee u15) u21))  ;; 1.5%
    (sbtc-receive (- sbtc-out sbtc-total-fee))
  )
    (ok {
      fee: sbtc-total-fee,
      swap-fee: sbtc-swap-fee,
      majority-fee: sbtc-majority-fee,
      sbtc-out: sbtc-out,
      sbtc-receive: sbtc-receive,
      new-token-balance: new-token-balance,
      current-sbtc-balance: current-sbtc-balance,
      new-sbtc-balance: new-sbtc-balance,
      token-balance: (var-get token-balance)
    })
  )
)

(define-read-only (get-locked-balance (user principal))
  (ok (default-to u0 (get amount (map-get? locked-balances { user: user }))))
)

(define-read-only (get-total-locked)
  (ok (var-get total-locked))
)

(define-read-only (get-majority-holder)
  (ok (var-get majority-holder))
)

;; Dynamic threshold function for frontend display
(define-read-only (get-threshold)
  (ok (if (is-eq (var-get last-withdraw-amount) u0)
    DEFAULT_UNLOCK_THRESHOLD  ;; use 1500 if no withdrawals yet
    (var-get last-withdraw-amount) ;; use last withdrawal amount
  ))
)

;; Can unlock check using dynamic threshold
(define-read-only (can-unlock)
  (ok (>= (var-get sbtc-fee-pool) (unwrap-panic (get-threshold))))
)

;; Get last withdraw amount for debugging/display
(define-read-only (get-last-withdraw-amount)
  (ok (var-get last-withdraw-amount))
)

;; Get total swap fees sent to track 0.6% fees
(define-read-only (get-total-swap-fees-sent)
  (ok (var-get total-swap-fees-sent))
)`;
  };

  const generateTokenContract = (name, symbol) => {
    const tokenContractName = symbol.toLowerCase();
    const dexName = `${symbol.toLowerCase()}-sats-treasury`;
    
    // Generate a comprehensive MAS SATS token contract using SIP-010 standard
    return `(impl-trait 'ST2SHP0RSX5ST9HTKJM4JF6SGQ686P4GJGF2XHHTX.sip-010-trait-ft-standard.sip-010-trait)

;; ---- Constants ----
(define-constant CONTRACT_OWNER '${connectedAddress})
(define-constant TOKEN_NAME "${name}")
(define-constant TOKEN_SYMBOL "${symbol}")
(define-constant TOKEN_DECIMALS u8)
(define-constant MAX_SUPPLY u2100000000000000) ;; 21 million * 10^8
(define-constant DEX_CONTRACT '${connectedAddress}.${dexName})

;; ---- Errors ----
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_ALREADY_MINTED (err u101))
(define-constant ERR_INVALID_AMOUNT (err u102))
(define-constant ERR_NOTHING_TO_UNLOCK (err u103))
(define-constant ERR_NOT_MAJORITY (err u104))
(define-constant ERR_NO_MAJORITY_HOLDER (err u105))

;; ---- Token Definition ----
(define-fungible-token ${tokenContractName} MAX_SUPPLY)

;; ---- Metadata + Mint State ----
(define-data-var token-uri (optional (string-utf8 256)) none)
(define-data-var minted bool false)

;; ---- Token Locking System ----
(define-map locked-balances { user: principal } { amount: uint })
(define-data-var total-locked uint u0)
(define-data-var majority-holder (optional principal) none)

;; ---- SIP-010 Read-Only Functions ----
(define-read-only (get-balance (who principal))
  (ok (ft-get-balance ${tokenContractName} who))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply ${tokenContractName}))
)

(define-read-only (get-name)
  (ok TOKEN_NAME)
)

(define-read-only (get-symbol)
  (ok TOKEN_SYMBOL)
)

(define-read-only (get-decimals)
  (ok TOKEN_DECIMALS)
)

(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

;; ---- SIP-010 Transfer Function ----
(define-public (transfer (amount uint) (from principal) (to principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq from tx-sender) ERR_UNAUTHORIZED)
    (ft-transfer? ${tokenContractName} amount from to)
  )
)

;; ---- Send Many Function for Airdrops ----
(define-public (send-many (recipients (list 200 { to: principal, amount: uint, memo: (optional (buff 34)) })))
  (fold check-err (map send-token recipients) (ok true))
)

(define-private (check-err (result (response bool uint)) (prior (response bool uint)))
  (match prior ok-value result err-value (err err-value))
)

(define-private (send-token (recipient { to: principal, amount: uint, memo: (optional (buff 34)) }))
  (send-token-with-memo (get amount recipient) (get to recipient) (get memo recipient))
)

(define-private (send-token-with-memo (amount uint) (to principal) (memo (optional (buff 34))))
  (let ((transferOk (try! (transfer amount tx-sender to memo))))
    (ok transferOk)
  )
)

;; ---- Optional Metadata Setter (Majority Holder Only) ----
(define-public (set-token-uri (value (string-utf8 256)))
  (begin
    (asserts! (is-eq (var-get majority-holder) (some tx-sender)) ERR_UNAUTHORIZED)
    (var-set token-uri (some value))
    (ok true)
  )
)

;; ---- One-Time Mint to DEX Contract ----
(define-public (mint-entire-supply-to-dex)
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (asserts! (is-eq (var-get minted) false) ERR_ALREADY_MINTED)
    (try! (ft-mint? ${tokenContractName} MAX_SUPPLY DEX_CONTRACT))
    (var-set minted true)
    (ok true)
  )
)

;; ---- Token Locking System ----

(define-public (lock-tokens (amount uint))
  (begin
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (try! (ft-transfer? ${tokenContractName} amount tx-sender (as-contract tx-sender)))
    (let ((currently-locked (default-to u0 (get amount (map-get? locked-balances { user: tx-sender })))))
      (map-set locked-balances { user: tx-sender } { amount: (+ currently-locked amount) })
      (var-set total-locked (+ (var-get total-locked) amount))
    )
    (ok true)
  )
)

(define-public (unlock-tokens (amount uint))
  (let ((locked (default-to u0 (get amount (map-get? locked-balances { user: tx-sender })))))
    (begin
      (asserts! (> amount u0) ERR_INVALID_AMOUNT)
      (asserts! (>= locked amount) ERR_NOTHING_TO_UNLOCK)
      (try! (ft-transfer? ${tokenContractName} amount (as-contract tx-sender) tx-sender))
      (map-set locked-balances { user: tx-sender } { amount: (- locked amount) })
      (var-set total-locked (- (var-get total-locked) amount))
      (ok true)
    )
  )
)

(define-public (claim-majority-holder-status)
  (let (
    (user-locked (default-to u0 (get amount (map-get? locked-balances { user: tx-sender }))))
    (total (var-get total-locked))
  )
    (begin
      (asserts! (> total u0) ERR_NOTHING_TO_UNLOCK)
      (if (> (* user-locked u100) (/ (* total u100) u2))
        (begin
          (var-set majority-holder (some tx-sender))
          (ok true)
        )
        ERR_NOT_MAJORITY
      )
    )
  )
)

;; ---- Read-Only Functions for Locking System ----

(define-read-only (get-locked-balance (user principal))
  (ok (default-to u0 (get amount (map-get? locked-balances { user: user }))))
)

(define-read-only (get-total-locked)
  (ok (var-get total-locked))
)

(define-read-only (get-majority-holder)
  (ok (var-get majority-holder))
)`;
  };

  const generateCommentedContract = (name, symbol) => {
    const contract = generateTokenContract(name, symbol);
    const tokenContractName = symbol.toLowerCase();
    const dexName = `${symbol.toLowerCase()}-sats-treasury`;
    
    // Highlight user inputs in the actual contract code
    let highlighted = contract
      // Highlight user's wallet address
      .replace(new RegExp(`(CONTRACT_OWNER ')${connectedAddress}(')`, 'g'), '$1<span class="user-input">' + connectedAddress + '</span>$2')
      .replace(new RegExp(`('${connectedAddress})(\.${dexName}')`, 'g'), '<span class="user-input">$1</span><span class="user-input">.$2</span>')
      // Highlight user's token name and symbol
      .replace(new RegExp(`(TOKEN_NAME "${name}")`, 'g'), 'TOKEN_NAME "<span class="user-input">' + name + '</span>"')
      .replace(new RegExp(`(TOKEN_SYMBOL "${symbol}")`, 'g'), 'TOKEN_SYMBOL "<span class="user-input">' + symbol + '</span>"')
      // Highlight fixed supply
      .replace(/(MAX_SUPPLY u2100000000000000)/g, 'MAX_SUPPLY <span class="fixed-value">u2100000000000000</span>')
      // Highlight token contract name references (now using symbol)
      .replace(new RegExp(`(define-fungible-token )(${tokenContractName})`, 'g'), '$1<span class="user-input">$2</span>')
      .replace(new RegExp(`(ft-get-balance )(${tokenContractName})`, 'g'), '$1<span class="user-input">$2</span>')
      .replace(new RegExp(`(ft-get-supply )(${tokenContractName})`, 'g'), '$1<span class="user-input">$2</span>')
      .replace(new RegExp(`(ft-transfer\\? )(${tokenContractName})`, 'g'), '$1<span class="user-input">$2</span>')
      .replace(new RegExp(`(ft-mint\\? )(${tokenContractName})`, 'g'), '$1<span class="user-input">$2</span>');
    
    // Add explanatory comments at key lines
    highlighted = highlighted
      .replace(/(\(define-constant CONTRACT_OWNER[^)]+\))/g, '$1 <span class="comment">;; ← Your connected wallet</span>')
      .replace(/(\(define-constant TOKEN_NAME[^)]+\))/g, '$1 <span class="comment">;; ← Your project name</span>')
      .replace(/(\(define-constant TOKEN_SYMBOL[^)]+\))/g, '$1 <span class="comment">;; ← Your project initials</span>')
      .replace(/(\(define-constant MAX_SUPPLY[^)]+\))/g, '$1 <span class="comment">;; ← Fixed at 21M tokens</span>')
      .replace(/(\(define-constant DEX_CONTRACT[^)]+\))/g, '$1 <span class="comment">;; ← Your initials treasury contract</span>')
      .replace(/(\(define-fungible-token [^)]+\))/g, '$1 <span class="comment">;; ← Your initials token contract</span>');
    
    return highlighted;
  };

  const generateCommentedDexContract = (tokenContractAddress, symbol, network = 'testnet') => {
    const contract = generateDexContract(tokenContractAddress, symbol, network);
    const dexContractName = `${symbol.toLowerCase()}-sats-treasury`;
    
    // Highlight user inputs in the actual contract code
    let highlighted = contract
      // Highlight user's token contract address
      .replace(new RegExp(`('${tokenContractAddress})`, 'g'), '<span class="user-input">$1</span>')
      // Highlight token symbol references
      .replace(new RegExp(`${symbol}`, 'g'), `<span class="user-input">${symbol}</span>`)
      // Highlight fixed values
      .replace(/(MAX_SUPPLY u2100000000000000)/g, 'MAX_SUPPLY <span class="fixed-value">u2100000000000000</span>')
      .replace(/(INITIAL_VIRTUAL_SBTC u1500000)/g, 'INITIAL_VIRTUAL_SBTC <span class="fixed-value">u1500000</span>')
      .replace(/(DEFAULT_UNLOCK_THRESHOLD u1500)/g, 'DEFAULT_UNLOCK_THRESHOLD <span class="fixed-value">u1500</span>')
      // Highlight fee percentages
      .replace(/(u21\) u1000)/g, '<span class="fixed-value">u21) u1000</span> ;; 2.1% total fee')
      .replace(/(u6\) u21)/g, '<span class="fixed-value">u6) u21</span> ;; 0.6% swap fee')
      .replace(/(u15\) u21)/g, '<span class="fixed-value">u15) u21</span> ;; 1.5% majority fee');
    
    // Add explanatory comments at key lines
    highlighted = highlighted
      .replace(/(\(define-constant MAX_SUPPLY[^)]+\))/g, '$1 <span class="comment">;; ← Fixed at 21M tokens</span>')
      .replace(/(\(define-constant INITIAL_VIRTUAL_SBTC[^)]+\))/g, '$1 <span class="comment">;; ← Initial virtual liquidity</span>')
      .replace(/(\(define-constant DEFAULT_UNLOCK_THRESHOLD[^)]+\))/g, '$1 <span class="comment">;; ← Unlock threshold</span>')
      .replace(/(\(define-public \(buy [^)]+\)\))/g, '$1 <span class="comment">;; ← Buy tokens with SBTC</span>')
      .replace(/(\(define-public \(sell [^)]+\)\))/g, '$1 <span class="comment">;; ← Sell tokens for SBTC</span>')
      .replace(/(\(define-public \(lock-tokens [^)]+\)\))/g, '$1 <span class="comment">;; ← Lock tokens for governance</span>')
      .replace(/(\(define-public \(unlock-tokens [^)]+\)\))/g, '$1 <span class="comment">;; ← Unlock tokens</span>')
      .replace(/(\(define-public \(withdraw-fees [^)]+\)\))/g, '$1 <span class="comment">;; ← Withdraw fees (majority holder)</span>');
    
    return highlighted;
  };

  const generateTreasuryTokenContract = (tokenContractAddress, symbol, network = 'testnet') => {
    const treasuryTokenName = `${symbol.toLowerCase()}-treasury-ownership`;
    const treasuryTokenSymbol = `${symbol}-TRSRY`;
    
    return `;; Treasury Ownership Token for ${symbol}
;; This token represents ownership shares in the ${symbol} treasury

;; CONSTANTS
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_INSUFFICIENT_BALANCE (err u402))
(define-constant ERR_INVALID_AMOUNT (err u403))
(define-constant ERR_TRANSFER_FAILED (err u404))

(define-constant TOKEN_NAME "${treasuryTokenName}")
(define-constant TOKEN_SYMBOL "${treasuryTokenSymbol}")
(define-constant TOKEN_DECIMALS u6)
(define-constant MAX_SUPPLY u1000000000000) ;; 1M treasury tokens max
(define-constant CONTRACT_OWNER tx-sender)

;; STORAGE
(define-fungible-token treasury-ownership-token MAX_SUPPLY)
(define-data-var total-supply uint u0)
(define-data-var token-uri (optional (string-utf8 256)) none)

;; SIP-010 FUNCTIONS

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (or (is-eq tx-sender sender) (is-eq contract-caller sender)) ERR_UNAUTHORIZED)
    (ft-transfer? treasury-ownership-token amount sender recipient)
  )
)

(define-read-only (get-name)
  (ok TOKEN_NAME)
)

(define-read-only (get-symbol)
  (ok TOKEN_SYMBOL)
)

(define-read-only (get-decimals)
  (ok TOKEN_DECIMALS)
)

(define-read-only (get-balance (who principal))
  (ok (ft-get-balance treasury-ownership-token who))
)

(define-read-only (get-total-supply)
  (ok (var-get total-supply))
)

(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

;; MINTING FUNCTIONS

(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (asserts! (<= (+ (var-get total-supply) amount) MAX_SUPPLY) ERR_INVALID_AMOUNT)
    
    (try! (ft-mint? treasury-ownership-token amount recipient))
    (var-set total-supply (+ (var-get total-supply) amount))
    (ok true)
  )
)

(define-public (mint-initial-supply)
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (asserts! (is-eq (var-get total-supply) u0) ERR_UNAUTHORIZED)
    
    ;; Mint initial 100,000 treasury tokens to contract owner
    (try! (ft-mint? treasury-ownership-token u100000000000 tx-sender))
    (var-set total-supply u100000000000)
    (ok true)
  )
)

;; UTILITY FUNCTIONS

(define-public (set-token-uri (uri (string-utf8 256)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (var-set token-uri (some uri))
    (ok true)
  )
)

(define-read-only (get-contract-owner)
  (ok CONTRACT_OWNER)
)

;; Get associated token contract
(define-read-only (get-associated-token-contract)
  (ok "${tokenContractAddress}")
)

;; Get treasury voting power (returns balance as voting weight)
(define-read-only (get-voting-power (who principal))
  (ok (ft-get-balance treasury-ownership-token who))
)`;
  };

  const handleDexDeployment = async () => {
    if (!transactionDetails || isDexDeploying) {
      return;
    }

    setIsDexDeploying(true);
    setDexDeploymentStatus('Checking for existing DEX deployment...');

    try {
      // First, check if a DEX transaction already exists for this successful deployment
      const txId = transactionDetails.txId || transactionDetails.transactionId;
      console.log('🔍 Manual DEX deployment - transaction ID:', txId);
      console.log('🔍 Manual DEX deployment - transactionDetails:', transactionDetails);
      
      if (!txId) {
        console.log('⚠️ No transaction ID found, skipping existing DEX check');
        console.log('📦 Proceeding directly with new DEX deployment...');
      } else {
        const existingDexCheck = await checkExistingDexTransaction(txId);
      
      if (existingDexCheck.exists && existingDexCheck.verified && existingDexCheck.token) {
        console.log('🔍 Found verified DEX deployment:', existingDexCheck.token);
        
        // Use the existing DEX transaction data
        const existingToken = existingDexCheck.token;
        const dexExplorerUrl = selectedNetwork === 'mainnet' 
          ? `https://explorer.stacks.co/txid/${existingToken.dexDeploymentTxHash}`
          : `https://explorer.stacks.co/txid/${existingToken.dexDeploymentTxHash}?chain=testnet`;
        
        // Set the existing DEX transaction details
        setDexTransactionDetails({
          txId: existingToken.dexDeploymentTxHash,
          contractAddress: existingToken.dexContractAddress,
          explorerUrl: dexExplorerUrl,
          network: selectedNetwork,
          tokenName: existingToken.tokenName,
          tokenSymbol: existingToken.tokenSymbol
        });
        
        setDexDeploymentSuccess(true);
        setDexDeploymentStatus('✅ Found verified DEX deployment! Your treasury is already available.');
        setIsDexDeploying(false);
        return;
      } else if (existingDexCheck.exists && !existingDexCheck.verified) {
        console.warn('⚠️ Found fake/invalid DEX transaction in database:', existingDexCheck.invalidRecord);
        console.log('📦 Resetting DEX state and proceeding with new deployment...');
        
        // Reset DEX deployment state since the transaction is invalid
        setDexDeploymentSuccess(false);
        setDexTransactionDetails(null);
        setDexDeploymentStatus('⚠️ Detected invalid DEX record, deploying new treasury...');
      }
      }

      // No existing verified DEX found, proceed with new deployment
      console.log('📦 No verified DEX found, proceeding with new deployment...');
      setDexDeploymentStatus('Preparing DEX deployment...');

      // Generate DEX contract code
      const dexContractCode = generateDexContract(
        transactionDetails.contractAddress,
        transactionDetails.tokenSymbol,
        selectedNetwork
      );
      
      setDexDeploymentStatus('Generating DEX smart contract...');
      
      // Deploy DEX contract using Stacks Connect
      setDexDeploymentStatus('Deploying DEX to Stacks blockchain...');
      
      const dexContractName = `${transactionDetails.tokenSymbol.toLowerCase()}-sats-treasury`;
      
      console.log('📋 DEX Contract Details:');
      console.log('   Contract Name:', dexContractName);
      console.log('   Contract Size:', dexContractCode.length, 'characters');
      console.log('   Network:', selectedNetwork);
      
      const response = await request('stx_deployContract', {
        name: dexContractName,
        clarityCode: dexContractCode,
        clarityVersion: 3,
        network: selectedNetwork
      });
      
      console.log('DEX deployment response:', response);
      
      // Get transaction ID from response
      const rawDexTransactionId = response.txId || response.txid;
      const dexTransactionId = rawDexTransactionId.startsWith('0x') ? rawDexTransactionId : `0x${rawDexTransactionId}`;
      
      // Generate DEX contract address
      const dexContractAddress = `${connectedAddress}.${dexContractName}`;
      
      const dexExplorerUrl = selectedNetwork === 'mainnet' 
        ? `https://explorer.stacks.co/txid/${dexTransactionId}`
        : `https://explorer.stacks.co/txid/${dexTransactionId}?chain=testnet`;
      
      // Comprehensive console logging for successful DEX deployment
      console.log('🎉 SUCCESSFUL DEX DEPLOYMENT!');
      console.log('📋 DEX Transaction Details:');
      console.log(`   DEX Transaction ID: ${dexTransactionId}`);
      console.log(`   DEX Contract Address: ${dexContractAddress}`);
      console.log(`   Token Name: ${transactionDetails.tokenName}`);
      console.log(`   Token Symbol: ${transactionDetails.tokenSymbol}`);
      console.log(`   Network: ${selectedNetwork}`);
      console.log(`   Deployed By: ${connectedAddress}`);
      console.log(`   DEX Explorer URL: ${dexExplorerUrl}`);
      console.log(`   Deployment Time: ${new Date().toISOString()}`);
      console.log('🔗 View DEX Transaction:', dexExplorerUrl);
      console.log('✅ DEX deployment completed successfully!');
      
      // Verify the transaction was actually broadcast before saving to database
      console.log('🔍 Verifying DEX transaction was broadcast...');
      const txVerification = await verifyTransactionOnBlockchain(dexTransactionId);
      
      if (txVerification.exists) {
        console.log('✅ DEX transaction verified on blockchain, saving to database...');
      // Update database with DEX transaction hash
      await updateTokenWithDexTransaction(transactionDetails.contractAddress, dexTransactionId);
      } else {
        console.error('❌ DEX transaction NOT found on blockchain! Transaction failed to broadcast.');
        console.log('⚠️ This transaction ID is fake/invalid:', dexTransactionId);
        
        // Clear the fake transaction from database
        try {
          await clearDexTransaction(transactionDetails.contractAddress);
          console.log('🗑️ Fake DEX transaction cleared from database');
        } catch (clearError) {
          console.error('❌ Failed to clear fake transaction:', clearError);
        }
        
        setDexDeploymentStatus('❌ Transaction failed to broadcast. Please try again.');
        setIsDexDeploying(false);
        return;
      }
      
      // Set success state with DEX transaction details
      setDexTransactionDetails({
        txId: dexTransactionId,
        contractAddress: dexContractAddress,
        explorerUrl: dexExplorerUrl,
        network: selectedNetwork,
        tokenName: transactionDetails.tokenName,
        tokenSymbol: transactionDetails.tokenSymbol
      });
      setDexDeploymentSuccess(true);
      setDexDeploymentStatus('✅ DEX deployment successful! Your DEX has been deployed to the blockchain.');
      
    } catch (error) {
      console.error('DEX deployment error:', error);
      setDexDeploymentStatus(`❌ Error: ${error.message || 'DEX deployment failed'}`);
    } finally {
      setIsDexDeploying(false);
    }
  };

  const checkExistingDexTransaction = async (transactionId) => {
    try {
      console.log('🔍 Checking for existing DEX transaction for:', transactionId);
      
      const response = await fetch('/api/user-tokens/check-dex-tx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId
        }),
      });

      console.log('🔍 API Response status:', response.status, response.statusText);

      if (!response.ok) {
        console.error('❌ API Response not OK:', response.status, response.statusText);
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError);
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('❌ Failed to check DEX transaction:', errorData);
        throw new Error(errorData.error || 'Failed to check DEX transaction');
      }

      const result = await response.json();
      console.log('✅ DEX transaction check result:', result);
      return result;
    } catch (error) {
      console.error('❌ DEX transaction check error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return { exists: false, error: error.message };
    }
  };

  const resetDexDeploymentState = () => {
    console.log('🔄 Manually resetting DEX deployment state...');
    setDexDeploymentSuccess(false);
    setDexTransactionDetails(null);
    setDexDeploymentStatus('');
    setIsDexDeploying(false);
  };

  const verifyTransactionOnBlockchain = async (txId) => {
    try {
      const baseUrl = selectedNetwork === 'mainnet' 
        ? 'https://api.hiro.so'
        : 'https://api.testnet.hiro.so';
      
      console.log(`🔍 Checking transaction on ${selectedNetwork}:`, txId);
      const response = await fetch(`${baseUrl}/extended/v1/tx/${txId}`);
      
      if (response.ok) {
        const txData = await response.json();
        console.log('✅ Transaction found on blockchain:', {
          txId,
          status: txData.tx_status,
          type: txData.tx_type
        });
        return {
          exists: true,
          status: txData.tx_status,
          type: txData.tx_type
        };
      } else {
        console.log('❌ Transaction not found on blockchain:', txId, 'Status:', response.status);
        return { exists: false };
      }
    } catch (error) {
      console.error('❌ Error verifying transaction:', error);
      return { exists: false, error: error.message };
    }
  };

  const clearDexTransaction = async (tokenContractAddress) => {
    try {
      console.log('🗑️ Clearing fake DEX transaction for:', tokenContractAddress);
      
      const response = await fetch('/api/user-tokens/clear-dex-tx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenContractAddress
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Failed to clear DEX transaction:', errorData);
        throw new Error(errorData.error || 'Failed to clear DEX transaction');
      }

      const result = await response.json();
      console.log('✅ DEX transaction cleared successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Clear DEX transaction error:', error);
      throw error;
    }
  };

  const updateTokenWithDexTransaction = async (tokenContractAddress, dexTxId) => {
    try {
      console.log('💾 Updating token with DEX transaction ID...');
      console.log(`   Token Contract: ${tokenContractAddress}`);
      console.log(`   DEX TX ID: ${dexTxId}`);
      
      const response = await fetch('/api/user-tokens/update-dex-tx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenContractAddress,
          dexDeploymentTxHash: dexTxId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Failed to update DEX transaction:', errorData);
        throw new Error(errorData.error || 'Failed to update DEX transaction');
      }

      const result = await response.json();
      console.log('✅ DEX transaction updated successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ DEX transaction update error:', error);
      console.log('⚠️ Continuing without DEX transaction update...');
    }
  };

  const checkDexTokenBalance = async () => {
    if (!transactionDetails || !dexTransactionDetails) {
      return;
    }

    setIsCheckingDexBalance(true);
    try {
      console.log('🔍 Checking DEX token balance...');
      console.log('   Token Contract:', transactionDetails.contractAddress);
      console.log('   DEX Contract:', dexTransactionDetails.contractAddress);

      // Use Stacks.js to call get-balance function
      const network = selectedNetwork === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
      const [tokenAddress, tokenName] = transactionDetails.contractAddress.split('.');
      const dexPrincipal = dexTransactionDetails.contractAddress;

      const result = await fetchCallReadOnlyFunction({
        contractAddress: tokenAddress,
        contractName: tokenName,
        functionName: 'get-balance',
        functionArgs: [principalCV(dexPrincipal)],
        network: network,
        senderAddress: tokenAddress,
      });

      console.log('🔍 Raw result from get-token-balance:', result);
      console.log('🔍 Result type:', typeof result);
      console.log('🔍 Result.value:', result?.value);
      console.log('🔍 Result.value type:', typeof result?.value);
      
      let balance = 0;
      if (result) {
        console.log('🔍 Result exists, checking value...');
        if (result.value !== undefined && result.value !== null) {
          console.log('🔍 Result.value exists:', result.value);
          
          // Handle the (ok u...) format
          if (typeof result.value === 'string' && result.value.startsWith('(ok u')) {
            // Extract the number from (ok u2100000000000000) format
            const match = result.value.match(/\(ok u(\d+)\)/);
            if (match) {
              balance = parseInt(match[1]);
              console.log('🔍 Parsed from (ok u...) format:', balance);
            } else {
              console.log('🔍 Failed to parse (ok u...) format:', result.value);
            }
          } else if (typeof result.value === 'object' && result.value.value !== undefined) {
            balance = parseInt(result.value.value);
            console.log('🔍 Parsed from result.value.value:', balance);
          } else if (typeof result.value === 'number') {
            balance = result.value;
            console.log('🔍 Used result.value as number:', balance);
          } else if (typeof result.value === 'string') {
            balance = parseInt(result.value);
            console.log('🔍 Parsed from result.value string:', balance);
          } else {
            console.log('🔍 Result.value format not recognized:', result.value);
          }
        } else {
          console.log('🔍 Result.value is undefined or null');
        }
      } else {
        console.log('🔍 Result is null or undefined');
      }
      
      console.log('💰 DEX Token Balance (parsed):', balance);
      setDexTokenBalance(balance);
      
      if (balance > 0) {
        setMintSupplyToDexSuccess(true);
        setMintSupplyToDexStatus('✅ Supply already minted to DEX!');
        
        // Update minting status in database since supply is confirmed
        setIsUpdatingMintingStatus(true);
        try {
          await updateMintingStatus(transactionDetails.contractAddress);
          setMintingStatusUpdated(true);
          console.log('✅ Minting status updated in database (supply already minted)');
        } catch (error) {
          console.error('❌ Failed to update minting status:', error);
        } finally {
          setIsUpdatingMintingStatus(false);
        }
      }
    } catch (error) {
      console.error('❌ Error checking DEX balance:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setDexTokenBalance(null);
    } finally {
      setIsCheckingDexBalance(false);
    }
  };

  const handleMintSupplyToDex = async () => {
    if (!transactionDetails || !dexTransactionDetails || isMintingSupplyToDex) {
      return;
    }

    setIsMintingSupplyToDex(true);
    setMintSupplyToDexStatus('Preparing to mint supply to DEX...');

    try {
      console.log('🏭 Starting mint-entire-supply-to-dex...');
      console.log('   Token Contract:', transactionDetails.contractAddress);
      console.log('   DEX Contract:', dexTransactionDetails.contractAddress);
      
      setMintSupplyToDexStatus('Calling mint-entire-supply-to-dex function...');

      const response = await request('stx_callContract', {
        contract: transactionDetails.contractAddress,
        functionName: 'mint-entire-supply-to-dex',
        functionArgs: []
      });

      console.log('🎉 Mint supply to DEX response:', response);

      // Extract transaction details
      const rawTransactionId = response.txId || response.txid;
      const transactionId = rawTransactionId?.startsWith('0x') ? rawTransactionId : `0x${rawTransactionId}`;

      // Log comprehensive details
      console.log('🎉 SUCCESSFUL SUPPLY MINT TO DEX!');
      console.log('📋 Mint Transaction Details:');
      console.log(`   Transaction ID: ${transactionId}`);
      console.log(`   Token Contract: ${transactionDetails.contractAddress}`);
      console.log(`   DEX Contract: ${dexTransactionDetails.contractAddress}`);
      console.log(`   Network: ${selectedNetwork}`);
      const explorerUrl = `https://explorer.stacks.co/txid/${transactionId}?chain=${selectedNetwork}`;
      console.log(`   Explorer URL: ${explorerUrl}`);

      // Set transaction details
      setMintSupplyToDexDetails({
        txId: transactionId,
        explorerUrl: explorerUrl,
        tokenContract: transactionDetails.contractAddress,
        dexContract: dexTransactionDetails.contractAddress,
        network: selectedNetwork
      });

      setMintSupplyToDexSuccess(true);
      setMintSupplyToDexStatus('✅ Supply successfully minted to DEX!');

      // Update minting status in database
      setIsUpdatingMintingStatus(true);
      try {
        await updateMintingStatus(transactionDetails.contractAddress);
        setMintingStatusUpdated(true);
        console.log('✅ Minting status updated in database');
      } catch (error) {
        console.error('❌ Failed to update minting status:', error);
      } finally {
        setIsUpdatingMintingStatus(false);
      }

    } catch (error) {
      console.error('❌ Mint supply to DEX error:', error);
      setMintSupplyToDexStatus(`❌ Error: ${error.message || 'Failed to mint supply to DEX'}`);
    } finally {
      setIsMintingSupplyToDex(false);
    }
  };

  const handleTreasuryTokenMinting = async () => {
    if (!dexTransactionDetails || isMintingTreasuryTokens) {
      return;
    }

    setIsMintingTreasuryTokens(true);
    setTreasuryTokenMintStatus('Preparing treasury token minting...');

    try {
      console.log('🏦 Starting Treasury Ownership Token minting...');
      setTreasuryTokenMintStatus('Generating treasury token contract...');

      // Generate Treasury Ownership Token contract
      const treasuryTokenContract = generateTreasuryTokenContract(
        dexTransactionDetails.contractAddress,
        dexTransactionDetails.tokenSymbol,
        selectedNetwork
      );

      const treasuryTokenName = `${dexTransactionDetails.tokenSymbol.toLowerCase()}-treasury-ownership`;

      setTreasuryTokenMintStatus('Deploying Treasury Ownership Tokens to blockchain...');

      const response = await request('stx_deployContract', {
        name: treasuryTokenName,
        clarityCode: treasuryTokenContract,
        network: selectedNetwork
      });

      console.log('🎉 Treasury token deployment response:', response);

      // Extract transaction details
      const rawTransactionId = response.txId || response.txid;
      const transactionId = rawTransactionId?.startsWith('0x') ? rawTransactionId : `0x${rawTransactionId}`;
      const contractAddress = `${connectedAddress}.${treasuryTokenName}`;

      // Log comprehensive details
      console.log('🎉 SUCCESSFUL TREASURY TOKEN DEPLOYMENT!');
      console.log('📋 Treasury Token Details:');
      console.log(`   Transaction ID: ${transactionId}`);
      console.log(`   Contract Address: ${contractAddress}`);
      console.log(`   Token Name: ${treasuryTokenName}`);
      console.log(`   Token Symbol: ${dexTransactionDetails.tokenSymbol}-TRSRY`);
      console.log(`   Network: ${selectedNetwork}`);
      console.log(`   Deployed By: ${connectedAddress}`);
      console.log(`   Explorer URL: https://explorer.stacks.co/txid/${transactionId}?chain=${selectedNetwork}`);
      console.log(`   Deployment Time: ${new Date().toISOString()}`);
      console.log('🔗 View Transaction:', `https://explorer.stacks.co/txid/${transactionId}?chain=${selectedNetwork}`);
      console.log('✅ Treasury token deployment completed successfully!');

      // Set transaction details
      setTreasuryTokenDetails({
        contractAddress,
        transactionId,
        tokenName: treasuryTokenName,
        tokenSymbol: `${dexTransactionDetails.tokenSymbol}-TRSRY`,
        network: selectedNetwork,
        deployedBy: connectedAddress,
        deploymentTime: new Date().toISOString(),
        explorerUrl: `https://explorer.stacks.co/txid/${transactionId}?chain=${selectedNetwork}`
      });

      setTreasuryTokenMintSuccess(true);
      setTreasuryTokenMintStatus('Treasury Ownership Tokens deployed successfully!');

    } catch (error) {
      console.error('❌ Treasury token deployment failed:', error);
      setTreasuryTokenMintStatus(`Error: ${error.message || 'Treasury token deployment failed'}`);
    } finally {
      setIsMintingTreasuryTokens(false);
    }
  };

  const saveTokenToDatabase = async (tokenData) => {
    try {
      // Prepare data for the API
      const apiData = {
        tokenName: tokenData.name,
        tokenSymbol: tokenData.symbol,
        tokenDescription: `Project token: ${tokenData.name} (${tokenData.symbol})`,
        tokenContractAddress: tokenData.contractAddress,
        dexContractAddress: `${tokenData.contractAddress}-sats-treasury`,
        creatorWalletAddress: tokenData.deployedBy,
        creatorSignature: 'dev_bypass_signature', // Development bypass signature
        deploymentMessage: `Deploying ${tokenData.name} (${tokenData.symbol}) token`,
        initialSupply: 2100000000000000, // 21 million * 10^8
        initialPrice: 0.00000001,
        tradingFeePercentage: 2.00,
        deploymentTxHash: tokenData.txId,
        network: tokenData.network
      };

      console.log('💾 Saving token to database...');
      console.log('📋 Token data being saved:', {
        name: apiData.tokenName,
        symbol: apiData.tokenSymbol,
        contract: apiData.tokenContractAddress,
        txId: apiData.deploymentTxHash,
        network: apiData.network
      });
      console.log('🔍 Full API payload:', JSON.stringify(apiData, null, 2));

      const response = await fetch('/api/user-tokens/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Database save failed:', errorData);
        throw new Error(errorData.error || 'Failed to save token to database');
      }

      const result = await response.json();
      console.log('✅ Token saved to database successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Database save error:', error);
      console.log('⚠️ Continuing without database save...');
      // Don't throw error - just log it so deployment can continue
    }
  };

  // Function to update minting completion status in database
  const updateMintingStatus = async (tokenContractAddress) => {
    try {
      console.log('💾 Updating minting completion status...');
      console.log('📋 Minting data:', {
        tokenContractAddress
      });

      const response = await fetch('/api/user-tokens/update-minting-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenContractAddress,
          mintingCompleted: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Minting status update failed:', errorData);
        throw new Error(errorData.error || 'Failed to update minting status');
      }

      const result = await response.json();
      console.log('✅ Minting status updated successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Minting status update error:', error);
      console.log('⚠️ Continuing without minting status update...');
      return null;
    }
  };

  // Function to handle project completion
  const handleProjectCompletion = () => {
    console.log('🎉 Project completed! Redirecting to home page...');
    // Simple redirect to home page with all projects tab
    window.location.href = '/?tab=all';
  };



  const steps = [
    { id: 1, title: 'Start Here', description: 'Benefits & Requirements' },
    { id: 2, title: 'Network Selection', description: 'Choose your deployment network' },
    { id: 3, title: 'Enter Project Details', description: 'Enter info and launch project to blockchain' },
    { id: 4, title: 'Create Project Treasury', description: 'Create your project treasury on the blockchain' },
    { id: 5, title: 'Mint Treasury Tokens', description: 'Mint Treasury Ownership Tokens for your project' }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
             case 1:
        return (
          <div className="step-content">
            <div className="step1-grid">
            <div className="benefits-section">
              <h2>🎯 Benefits of Creating Your Own Token</h2>
              
              <div className="benefit-card">
                <div className="benefit-header">
                  <img src="/icons/The Mas Network.svg" alt="Token Economy" className="benefit-icon" />
                  <h3>Own Your Token Economy</h3>
                </div>
                <p>Create and control your own token with custom supply, pricing, and trading mechanics.</p>
              </div>

              <div className="benefit-card">
                <div className="benefit-header">
                  <img src="/icons/sats1.svg" alt="Revenue" className="benefit-icon" />
                  <h3>Earn Trading Revenue</h3>
                </div>
                <p>Collect fees from all trades on your token and build a sustainable revenue stream.</p>
              </div>

              <div className="benefit-card">
                <div className="benefit-header">
                  <img src="/icons/Vector.svg" alt="Community" className="benefit-icon" />
                  <h3>Build Your Community</h3>
                </div>
                <p>Attract traders and investors to your token, growing your project&apos;s audience.</p>
              </div>
            </div>

            <div className="requirements-section">
              <h2>🔒 Requirements to Create Your Token</h2>
              
              <div className="requirement-card">
                <div className="requirement-header">
                  <img src="/icons/The Mas Network.svg" alt="Locked Tokens" className="requirement-icon" />
                  <h3>Lock Platform Tokens</h3>
                </div>
                <p>You must lock a minimum amount of platform tokens to create your own token. This requirement:</p>
                <ul>
                  <li>Boosts platform liquidity and stability</li>
                  <li>Promotes the overall ecosystem</li>
                  <li>Helps bring your project a larger audience</li>
                  <li>Ensures commitment to the platform&apos;s success</li>
                </ul>
              </div>

              <div className="requirement-card">
                <div className="requirement-header">
                  <img src="/icons/sats1.svg" alt="Staking" className="requirement-icon" />
                  <h3>Staking Requirements</h3>
                </div>
                <p>Lock your tokens for a specified period to demonstrate long-term commitment to the platform.</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 2:
         return (
           <div className="step-panel">
             <div className="step-header">
               <h2>🌐 Network Selection</h2>
               <p>Choose Network To Launch Your Project</p>
             </div>
             
             <div className="info-content">
               <div className="info-section">
                 <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}>🌐 Network Selection</h3>
                 
                 {/* Compact side by side buttons */}
                 <div style={{ 
                   display: 'grid', 
                   gridTemplateColumns: '1fr 1fr', 
                   gap: '16px',
                   maxWidth: '500px',
                   margin: '0 auto'
                 }}>
                   {/* Testnet Button */}
                   <button 
                     className={`network-button ${selectedNetwork === 'testnet' ? 'selected' : ''}`}
                     onClick={() => setSelectedNetwork('testnet')}
                     style={{
                       background: selectedNetwork === 'testnet' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.05)',
                       border: selectedNetwork === 'testnet' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                       borderRadius: '12px',
                       padding: '16px',
                       cursor: 'pointer',
                       transition: 'all 0.3s ease',
                       display: 'flex',
                       flexDirection: 'column',
                       alignItems: 'center',
                       gap: '8px',
                       minHeight: '120px',
                       justifyContent: 'center'
                     }}
                   >
                     <div style={{ fontSize: '2rem', marginBottom: '4px' }}>🧪</div>
                     <div style={{ 
                       fontSize: '1.1rem', 
                       fontWeight: '600', 
                       color: selectedNetwork === 'testnet' ? 'white' : '#fbbf24',
                       marginBottom: '4px'
                     }}>
                       Testnet
                     </div>
                                           <div style={{ 
                        fontSize: '0.85rem', 
                        color: selectedNetwork === 'testnet' ? 'rgba(255, 255, 255, 0.8)' : '#94a3b8',
                        textAlign: 'center',
                        lineHeight: '1.4',
                        padding: '0 8px'
                      }}>
                        Launch your project with no risk using fake money to practice
                      </div>
                   </button>

                   {/* Mainnet Button */}
                   <button 
                     className={`network-button ${selectedNetwork === 'mainnet' ? 'selected' : ''}`}
                     onClick={handleMainnetSelection}
                     style={{
                       background: selectedNetwork === 'mainnet' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(255, 255, 255, 0.05)',
                       border: selectedNetwork === 'mainnet' ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                       borderRadius: '12px',
                       padding: '16px',
                       cursor: 'pointer',
                       transition: 'all 0.3s ease',
                       display: 'flex',
                       flexDirection: 'column',
                       alignItems: 'center',
                       gap: '8px',
                       minHeight: '120px',
                       justifyContent: 'center'
                     }}
                   >
                     <div style={{ fontSize: '2rem', marginBottom: '4px' }}>🌐</div>
                     <div style={{ 
                       fontSize: '1.1rem', 
                       fontWeight: '600', 
                       color: selectedNetwork === 'mainnet' ? 'white' : '#fbbf24',
                       marginBottom: '4px'
                     }}>
                       Mainnet
                     </div>
                                           <div style={{ 
                        fontSize: '0.85rem', 
                        color: selectedNetwork === 'mainnet' ? 'rgba(255, 255, 255, 0.8)' : '#94a3b8',
                        textAlign: 'center',
                        lineHeight: '1.4',
                        padding: '0 8px'
                      }}>
                        Launch your project live on the blockchain using real money
                      </div>
                   </button>
                 </div>
               </div>
               
               <div className="step-actions">
                 <button onClick={handleNext} className="next-button">
                  Continue to Step 3 →
                 </button>
               </div>
             </div>
           </div>
         );
      
      case 3:
        return (
          <div className="step-content">
            <div className="modern-step-container">
              {/* Hero Header */}
              <div className="hero-header">
                <div className="hero-content">
                  <h1>Create Your Project</h1>
                </div>
              </div>

              {/* Loading Check */}
              {(isCheckingPendingTokens || isCheckingDeployedTokens) && (
                <div className="checking-pending-tokens">
                  <div className="checking-content">
                    <span className="checking-icon">🔍</span>
                    <div className="checking-text">
                      Checking for existing projects...
                    </div>
                  </div>
                </div>
              )}

              {/* Pending Token Warning */}
              {hasPendingToken && (
                <div className="pending-token-warning">
                  <div className="warning-content">
                    <span className="warning-icon">⚠️</span>
                    <div className="warning-text">
                      <strong>You have a pending project!</strong> Complete your Project Treasury before creating a new project.
                    </div>
                    <button 
                      className="warning-action-btn"
                      onClick={() => setCurrentStep(4)}
                    >
                      Complete Treasury
                    </button>
                  </div>
                  
                  {/* Pending Token Details */}
                  <div className="pending-token-details">
                    <h4>Your Deployed Token:</h4>
                    {pendingTokens.map((token, index) => (
                      <div key={index} className="pending-token-item">
                        <div className="token-info">
                          <span className="token-name">{token.tokenName}</span>
                          <span className="token-symbol">({token.tokenSymbol})</span>
                        </div>
                        <div className="token-status">
                          <span className="status-badge deployed">✅ Token Deployed</span>
                          <span className="status-badge pending">⏳ Treasury Pending</span>
                        </div>
                        <div className="token-contract">
                          <span className="contract-label">Contract:</span>
                          <span className="contract-address">{token.tokenContractAddress}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Already Deployed Token Section */}
              {hasDeployedToken && !hasPendingToken && (
                <div className="deployed-token-notice">
                  <div className="notice-content">
                    <span className="notice-icon">✅</span>
                    <div className="notice-text">
                      <strong>You already have a deployed token!</strong> You can proceed to Step 4 to deploy your treasury, or create a new token below.
                    </div>
                    <button 
                      className="notice-action-btn"
                      onClick={() => setCurrentStep(4)}
                    >
                      Go to Step 4
                    </button>
                  </div>
                  
                  {/* Deployed Token Details */}
                  <div className="deployed-token-details">
                    <h4>Your Deployed Token:</h4>
                    {deployedTokens.map((token, index) => (
                      <div key={index} className="deployed-token-item">
                        <div className="token-info">
                          <span className="token-name">{token.tokenName}</span>
                          <span className="token-symbol">({token.tokenSymbol})</span>
                        </div>
                        <div className="token-status">
                          <span className="status-badge deployed">✅ Token Deployed</span>
                          {token.dexContractAddress && token.dexDeploymentTxHash ? 
                            <span className="status-badge deployed">✅ Treasury Ready</span> :
                            <span className="status-badge pending">⏳ Treasury Needed</span>
                          }
                        </div>
                        <div className="token-contract">
                          <span className="contract-label">Contract:</span>
                          <span className="contract-address">{token.tokenContractAddress}</span>
                        </div>
                        {token.deploymentTxHash && (
                          <div className="token-tx">
                            <span className="tx-label">TX:</span>
                            <span className="tx-hash">{token.deploymentTxHash}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Content Grid */}
              <div className="content-grid">
                {/* Left Column - Form */}
                <div className="form-column">
                  <div className="form-card">
                    <div className="card-header">
                      <h3>Project Configuration</h3>
                    </div>
                    
                    <div className="form-fields">
                      <div className="input-group">
                        <label htmlFor="projectName">Project Name</label>
                  <input
                    type="text"
                    id="projectName"
                          placeholder={isCheckingDeployedTokens ? "Checking for existing projects..." : hasDeployedToken ? "You already have a deployed project" : "Enter your project name"}
                          className="modern-input"
                          maxLength="15"
                    value={tokenName}
                          disabled={isCheckingDeployedTokens || hasDeployedToken}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^A-Za-z0-9\s]/g, '');
                            setTokenName(value);
                          }}
                  />
                        <span className="input-hint">Max 15 characters, letters & numbers only</span>
                </div>

                      <div className="input-group">
                        <label htmlFor="tokenSymbol">Project Initials</label>
                  <input
                    type="text"
                    id="tokenSymbol"
                          placeholder={isCheckingDeployedTokens ? "Checking for existing projects..." : hasDeployedToken ? "You already have a deployed project" : selectedNetwork === 'testnet' ? "Enter 2-4 characters (e.g., BTC, ETH)" : "Enter project initials"}
                          className="modern-input"
                          maxLength="6"
                    value={tokenSymbol}
                          disabled={isCheckingDeployedTokens || hasDeployedToken}
                          onChange={(e) => {
                            const formattedValue = formatTestnetInitials(e.target.value);
                            setTokenSymbol(formattedValue);
                            checkSymbolUniqueness(formattedValue);
                          }}
                  />
                        <span className="input-hint">
                          {selectedNetwork === 'testnet' 
                            ? "2-4 characters, will be prefixed with 'TP' (e.g., BTC → TPBTC)" 
                            : "1-6 characters, letters & numbers only"}
                        </span>
                        {isCheckingSymbol && (
                          <div className="symbol-check-status checking">
                            🔍 Checking availability...
                          </div>
                        )}
                        {!isCheckingSymbol && symbolCheckMessage && (
                          <div className={`symbol-check-status ${isSymbolAvailable ? 'available' : 'taken'}`}>
                            {symbolCheckMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Preview */}
                <div className="preview-column">
                  <div className="preview-card">
                    <div className="card-header">
                      <h3>Contract Preview</h3>
                    </div>
                    
                    <div className="preview-content">
                      <div className="preview-row">
                        <div className="preview-label">Project Contract</div>
                        <div className="preview-value">
                          {connectedAddress && tokenSymbol ? 
                            <span className="contract-address">{connectedAddress}.{tokenSymbol.toLowerCase()}</span> : 
                            <span className="placeholder">Connect wallet and enter initials</span>}
                        </div>
                      </div>
                      
                      <div className="preview-row">
                        <div className="preview-label">Treasury Contract</div>
                        <div className="preview-value">
                          {connectedAddress && tokenSymbol ? 
                            <span className="contract-address">{connectedAddress}.{tokenSymbol.toLowerCase()}-sats-treasury</span> : 
                            <span className="placeholder">Connect wallet and enter initials</span>}
                        </div>
                      </div>
                      
                      <div className="preview-row highlight">
                        <div className="preview-label">Token Supply</div>
                        <div className="preview-value">
                          <span className="supply-badge">21 Million Units</span>
                          <span className="max-supply">MAX SUPPLY</span>
                        </div>
                      </div>
                      
                      <div className="preview-row">
                        <div className="preview-label">Network</div>
                        <div className="preview-value">
                          <span className={`network-badge ${selectedNetwork} centered`}>
                            {selectedNetwork === 'mainnet' ? '🌐 Mainnet' : '🧪 Testnet'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-section">
                <div className="action-buttons">
                    <button
                    className={`preview-btn ${tokenName.trim() && tokenSymbol.trim() ? 'active' : 'disabled'}`}
                      disabled={!tokenName.trim() || !tokenSymbol.trim()}
                      onClick={() => setShowContractModal(true)}
                    >
                    <span className="btn-icon">📄</span>
                    <span className="btn-text">View Smart Contract</span>
                    </button>
                    
                                     <button
                    className={`launch-btn ${tokenName.trim() && tokenSymbol.trim() && connectedAddress && !isDeploying && isSymbolAvailable && !isCheckingSymbol ? 'active' : 'disabled'}`}
                     disabled={!tokenName.trim() || !tokenSymbol.trim() || !connectedAddress || isDeploying || !isSymbolAvailable || isCheckingSymbol}
                     onClick={handleTokenLaunch}
                   >
                    <span className="btn-icon">
                      {isDeploying ? '🚀' : !connectedAddress ? '🔗' : '⚡'}
                    </span>
                    <span className="btn-text">
                      {isDeploying ? 'Deploying...' : 
                        isCheckingSymbol ? 'Checking Symbol...' :
                        !isSymbolAvailable ? 'Symbol Not Available' :
                        !connectedAddress ? 'Connect Wallet to Deploy' : 'Launch Project'}
                    </span>
                   </button>
                  </div>
                  
                                 {deploymentSuccess && transactionDetails && (
                   <div className="success-section">
                     <div className="success-card">
                       <div className="success-header">
                         <span className="success-icon">✅</span>
                         <h3>Token Deployed Successfully!</h3>
                       </div>
                       <div className="transaction-details">
                         <div className="detail-row">
                           <span className="detail-label">Transaction ID:</span>
                           <div className="detail-value-with-copy">
                             <span className="detail-value">{transactionDetails.txId}</span>
                             <button 
                               onClick={() => {
                                 navigator.clipboard.writeText(transactionDetails.txId);
                                 // Show a brief visual feedback
                                 const button = event.target;
                                 const originalText = button.textContent;
                                 button.textContent = '✅';
                                 button.style.background = 'rgba(34, 197, 94, 0.3)';
                                 button.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                                 setTimeout(() => {
                                   button.textContent = originalText;
                                   button.style.background = 'rgba(59, 130, 246, 0.2)';
                                   button.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                                 }, 1000);
                               }}
                               className="copy-button"
                               title="Copy Transaction ID"
                             >
                               📋
                             </button>
                           </div>
                         </div>
                         <div className="detail-row">
                           <span className="detail-label">Contract Address:</span>
                           <span className="detail-value">{transactionDetails.contractAddress}</span>
                         </div>
                         <div className="detail-row">
                           <span className="detail-label">Network:</span>
                           <span className="detail-value">{transactionDetails.network}</span>
                         </div>
                         <div className="detail-row">
                           <span className="detail-label">Token Name:</span>
                           <span className="detail-value">{transactionDetails.tokenName}</span>
                         </div>
                         <div className="detail-row">
                           <span className="detail-label">Token Symbol:</span>
                           <span className="detail-value">{transactionDetails.tokenSymbol}</span>
                         </div>
                         <div className="detail-row">
                           <span className="detail-label">Explorer:</span>
                           <a href={transactionDetails.explorerUrl} target="_blank" rel="noopener noreferrer" className="explorer-link">
                             View Transaction
                           </a>
                         </div>
                       </div>
                       <div className="next-step-prompt">
                         <p>🎉 Your token has been deployed! Ready to create the Project Treasury?</p>
                       </div>
                     </div>
                   </div>
                 )}
                 
                 {deploymentStatus && !deploymentSuccess && (
                    <div className={`deployment-status ${deploymentStatus.includes('Success') ? 'success' : deploymentStatus.includes('Error') ? 'error' : 'info'}`}>
                      {deploymentStatus}
                    </div>
                  )}
                </div>
            </div>
          </div>
        );
      
             case 4:
         return (
           <div className="step-content">
            <div className="treasury-step-container">
              {/* Hero Header */}
              <div className="treasury-hero-header">
                <div className="treasury-hero-content">
                  <h1>🚀 Create Project Treasury</h1>
                  <p>Deploy your project treasury to enable trading and liquidity for your token</p>
                </div>
              </div>

              {/* Treasury Info Card */}
              <div className="treasury-info-card">
                <div className="treasury-info-header">
                  <span className="treasury-icon">💰</span>
                  <h3>What is a Project Treasury?</h3>
                </div>
                <div className="treasury-info-content">
                  <p>The Project Treasury is a smart contract that:</p>
                  <ul>
                    <li>Holds your token supply for trading</li>
                    <li>Manages liquidity pools for your token</li>
                    <li>Collects trading fees for your project</li>
                    <li>Enables users to buy and sell your token</li>
                  </ul>
                </div>
              </div>

              {/* Deployment Status */}
              {transactionDetails && (
                <div className="deployed-token-info">
                  <h4>Your Deployed Token:</h4>
                  <div className="token-summary">
                    <div className="token-detail">
                      <span className="label">Name:</span>
                      <span className="value">{transactionDetails.tokenName}</span>
                    </div>
                    <div className="token-detail">
                      <span className="label">Symbol:</span>
                      <span className="value">{transactionDetails.tokenSymbol}</span>
                    </div>
                    <div className="token-detail">
                      <span className="label">Contract:</span>
                      <span className="value contract-address">{transactionDetails.contractAddress}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Treasury Action Buttons */}
              <div className="treasury-deployment-section">
                <div className="treasury-action-buttons">
                  <button
                    className={`view-dex-contract-btn ${transactionDetails ? 'active' : 'disabled'}`}
                    disabled={!transactionDetails}
                    onClick={() => setShowDexContractModal(true)}
                  >
                    <span className="btn-icon">📄</span>
                    <span className="btn-text">View DEX Contract</span>
                  </button>
                  
                  <button 
                    className={`deploy-treasury-btn ${transactionDetails && !isDexDeploying && !dexDeploymentSuccess ? 'active' : 'disabled'}`}
                    disabled={!transactionDetails || isDexDeploying || dexDeploymentSuccess}
                    onClick={handleDexDeployment}
                  >
                    <span className="btn-icon">
                      {isDexDeploying ? '🚀' : dexDeploymentSuccess ? '✅' : '💰'}
                    </span>
                    <span className="btn-text">
                      {isDexDeploying ? 'Checking Treasury...' : 
                       dexDeploymentSuccess ? 
                         (dexDeploymentStatus?.includes('Found existing') ? 'Treasury Found' : 'Treasury Deployed') : 
                       'Deploy Project Treasury'}
                    </span>
                  </button>
                </div>
                
                <p className="deployment-note">
                  {dexDeploymentSuccess ? 
                    'Your treasury has been deployed and is ready for trading!' :
                    'This will deploy the treasury contract and enable trading for your token'
                  }
                </p>
                
                {/* DEX Deployment Status */}
                {dexDeploymentStatus && !dexDeploymentSuccess && (
                  <div className={`deployment-status ${dexDeploymentStatus.includes('Success') ? 'success' : dexDeploymentStatus.includes('Error') ? 'error' : 'info'}`}>
                    {dexDeploymentStatus}
                  </div>
                )}
                
                {/* DEX Success Details */}
                {dexDeploymentSuccess && dexTransactionDetails && (
                  <div className="success-section">
                    <div className="success-card">
                      <div className="success-header">
                        <span className="success-icon">✅</span>
                        <h3>Treasury Deployed Successfully!</h3>
                      </div>
                      <div className="transaction-details">
                        <div className="detail-row">
                          <span className="detail-label">DEX Transaction ID:</span>
                          <div className="detail-value-with-copy">
                            <span className="detail-value">{dexTransactionDetails.txId}</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(dexTransactionDetails.txId);
                                const button = event.target;
                                const originalText = button.textContent;
                                button.textContent = '✅';
                                button.style.background = 'rgba(34, 197, 94, 0.3)';
                                button.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                                setTimeout(() => {
                                  button.textContent = originalText;
                                  button.style.background = 'rgba(59, 130, 246, 0.2)';
                                  button.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                                }, 1000);
                              }}
                              className="copy-button"
                              title="Copy DEX Transaction ID"
                            >
                              📋
                            </button>
                          </div>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">DEX Contract Address:</span>
                          <span className="detail-value">{dexTransactionDetails.contractAddress}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Explorer:</span>
                          <a href={dexTransactionDetails.explorerUrl} target="_blank" rel="noopener noreferrer" className="explorer-link">
                            View DEX Transaction
                          </a>
                        </div>
                      </div>
                      <div className="next-step-prompt">
                        <p>🎉 Your project is now complete! Users can trade your token on the DEX.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
             </div>
           </div>
         );

      case 5:
        return (
          <div className="step-content">
            <div className="treasury-token-step-container">
              {/* Hero Header */}
              <div className="treasury-token-hero-header">
                <div className="treasury-token-hero-content">
                  <h1>🏦 Mint Treasury Ownership Tokens</h1>
                  <p>Create ownership tokens that represent shares in your project treasury</p>
                </div>
              </div>

              {/* Treasury Token Info Card */}
              <div className="treasury-token-info-card">
                <div className="treasury-token-info-header">
                  <span className="treasury-token-icon">🎫</span>
                  <h3>What are Treasury Ownership Tokens?</h3>
                </div>
                <div className="treasury-token-info-content">
                  <p>Treasury Ownership Tokens represent:</p>
                  <ul>
                    <li>📊 Voting rights in treasury decisions</li>
                    <li>💰 Profit sharing from trading fees</li>
                    <li>🎯 Governance control over your project</li>
                    <li>🔗 Transferable ownership stakes</li>
                  </ul>
                </div>
              </div>

              {/* DEX Status Check */}
              {!dexTransactionDetails ? (
                <div className="dex-required-notice">
                  <div className="notice-content">
                    <span className="notice-icon">⚠️</span>
                    <div className="notice-text">
                      <strong>Treasury Required!</strong> You need to deploy your project treasury first before minting ownership tokens.
                    </div>
                    <button 
                      className="notice-action-btn"
                      onClick={() => setCurrentStep(4)}
                    >
                      Go to Step 4
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Mint Supply to DEX Section */}
                  <div className="mint-supply-section">
                    <div className="mint-supply-header">
                      <span className="mint-supply-icon">🏭</span>
                      <h3>Step 1: Mint Token Supply to DEX</h3>
                    </div>
                    <div className="mint-supply-content">
                      <p>First, you need to mint your entire token supply to the DEX contract so it can be traded.</p>
                      
                      <div className="mint-supply-actions">
                        <button
                          className={`mint-supply-btn ${transactionDetails && dexTransactionDetails && !isMintingSupplyToDex && !mintSupplyToDexSuccess && dexTokenBalance === 0 ? 'active' : 'disabled'}`}
                          disabled={!transactionDetails || !dexTransactionDetails || isMintingSupplyToDex || mintSupplyToDexSuccess || dexTokenBalance > 0}
                          onClick={handleMintSupplyToDex}
                        >
                          <span className="btn-icon">
                            {isMintingSupplyToDex ? '🏭' : mintSupplyToDexSuccess ? '✅' : '💰'}
                          </span>
                          <span className="btn-text">
                            {isMintingSupplyToDex ? 'Minting Supply...' : 
                             mintSupplyToDexSuccess ? 'Supply Minted' : 
                             'Mint Supply to DEX'}
                          </span>
                        </button>
                      </div>
                      
                      <p className="mint-supply-note">
                        {isCheckingDexBalance ? 
                          'Checking DEX token balance...' :
                          mintSupplyToDexSuccess ? 
                          'Your token supply has been minted to the DEX and is ready for trading!' :
                          dexTokenBalance > 0 ?
                          `DEX already has ${dexTokenBalance.toLocaleString()} tokens - minting not needed` :
                          dexTokenBalance === 0 ?
                          'DEX has 0 tokens - ready to mint supply' :
                          'This will call the mint-entire-supply-to-dex function on your token contract'
                        }
                      </p>
                      
                      {/* Mint Supply Status */}
                      {mintSupplyToDexStatus && !mintSupplyToDexSuccess && (
                        <div className={`mint-supply-status ${mintSupplyToDexStatus.includes('Success') ? 'success' : mintSupplyToDexStatus.includes('Error') ? 'error' : 'info'}`}>
                          {mintSupplyToDexStatus}
                        </div>
                      )}
                      
                      {/* Mint Supply Success Details */}
                      {mintSupplyToDexSuccess && mintSupplyToDexDetails && (
                        <div className="success-section">
                          <div className="success-card">
                            <div className="success-header">
                              <span className="success-icon">✅</span>
                              <h3>Supply Minted Successfully!</h3>
                            </div>
                            <div className="transaction-details">
                              <div className="detail-row">
                                <span className="detail-label">Mint Transaction ID:</span>
                                <div className="detail-value-with-copy">
                                  <span className="detail-value">{mintSupplyToDexDetails.txId}</span>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(mintSupplyToDexDetails.txId);
                                      const button = event.target;
                                      const originalText = button.textContent;
                                      button.textContent = '✅';
                                      button.style.background = 'rgba(34, 197, 94, 0.3)';
                                      button.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                                      setTimeout(() => {
                                        button.textContent = originalText;
                                        button.style.background = 'rgba(59, 130, 246, 0.2)';
                                        button.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                                      }, 1000);
                                    }}
                                    className="copy-button"
                                  >
                                    📋
                                  </button>
                                </div>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Token Contract:</span>
                                <span className="detail-value">{mintSupplyToDexDetails.tokenContract}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">DEX Contract:</span>
                                <span className="detail-value">{mintSupplyToDexDetails.dexContract}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Explorer:</span>
                                <div className="detail-value-with-link">
                                  <a 
                                    href={mintSupplyToDexDetails.explorerUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="explorer-link"
                                  >
                                    View Mint Transaction
                                  </a>
                                </div>
                              </div>
                            </div>
                            <p>Your token supply is now available in the DEX for trading.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* DEX Details */}
                  <div className="dex-status-info">
                    <h4>Your Project Treasury:</h4>
                    <div className="dex-summary">
                      <div className="dex-detail">
                        <span className="label">Treasury Contract:</span>
                        <span className="value">{dexTransactionDetails.contractAddress}</span>
                      </div>
                      <div className="dex-detail">
                        <span className="label">Token Symbol:</span>
                        <span className="value">{dexTransactionDetails.tokenSymbol}</span>
                      </div>
                      <div className="dex-detail">
                        <span className="label">Treasury TX:</span>
                        <span className="value">{dexTransactionDetails.transactionId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Project Completion Message */}
                  <div className="project-completion-section">
                    <div className="completion-card">
                      <div className="completion-header">
                        <span className="completion-icon">🎉</span>
                        <h3>Project Setup Complete!</h3>
                      </div>
                      <div className="completion-content">
                        <p><strong>Congratulations!</strong> Your project has been successfully set up:</p>
                        <ul>
                          <li>✅ Token deployed and ready</li>
                          <li>✅ DEX treasury deployed</li>
                          <li>✅ Token supply minted to DEX</li>
                          {mintingStatusUpdated && <li>✅ Project status updated in database</li>}
                          {mintingStatusUpdated && <li>✅ Project added to home page display</li>}
                        </ul>
                        <p>Your token is now ready for trading on the DEX and will appear on the home page!</p>
                        
                        {/* Complete Button */}
                        <div className="complete-button-section">
                          <button
                            className="complete-project-btn active"
                            onClick={handleProjectCompletion}
                            style={{ cursor: 'pointer' }}
                          >
                            <span className="btn-icon">🏠</span>
                            <span className="btn-text">Complete & Go to Home Page</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      // Only allow going to Step 4 if there's a successful deployment
      if (currentStep === 3 && !deploymentSuccess) {
        return; // Don't allow going to Step 4 without successful deployment
      }
      // Only allow going to Step 5 if there's a successful DEX deployment
      if (currentStep === 4 && !dexDeploymentSuccess) {
        return; // Don't allow going to Step 5 without successful DEX deployment
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Function to format testnet project initials with TP prefix
  const formatTestnetInitials = (input) => {
    if (!input) return '';
    
    // Remove any non-alphanumeric characters and convert to uppercase
    const cleanInput = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // If it's testnet, ensure it starts with TP
    if (selectedNetwork === 'testnet') {
      if (cleanInput.startsWith('TP')) {
        // Already has TP prefix, return as is (max 6 chars total)
        return cleanInput.slice(0, 6);
      } else {
        // Add TP prefix and limit to 6 chars total
        return `TP${cleanInput}`.slice(0, 6);
      }
    }
    
    // For mainnet, return as is (max 6 chars)
    return cleanInput.slice(0, 6);
  };

  // Function to validate testnet project initials
  const validateTestnetInitials = (symbol) => {
    if (selectedNetwork === 'testnet') {
      // Must start with TP and have 2-4 additional characters
      const pattern = /^TP[A-Z0-9]{2,4}$/;
      return pattern.test(symbol);
    }
    return true; // No special validation for mainnet
  };

  // Update symbol formatting when network changes
  useEffect(() => {
    if (tokenSymbol) {
      const formattedValue = formatTestnetInitials(tokenSymbol);
      if (formattedValue !== tokenSymbol) {
        setTokenSymbol(formattedValue);
        checkSymbolUniqueness(formattedValue);
      }
    }
  }, [selectedNetwork]);

  return (
    <div className="create-project-page">
      {/* Simplified Header */}
      <div className="simplified-header">
        <div className="header-left">
          <Link href="/" className="back-button">
            ← Back to Home
          </Link>
        </div>
        <div className="header-center">
          <h1>Create a Project and Get Funding</h1>
        </div>
                 <div className="header-right">
           {connectedAddress ? (
             <div className="wallet-status">
               <span className="wallet-address">
                 {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
               </span>
             </div>
           ) : (
             <div className="wallet-status">
               <span className="not-connected">Not Connected</span>
             </div>
           )}
         </div>
      </div>

      <div className="create-project-container">

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            {steps.map((step, index) => (
              <div key={step.id} className={`progress-step ${currentStep >= step.id ? 'active' : ''}`}>
                <div className="step-number">{step.id}</div>
                <div className="step-info">
                  <div className="step-title">{step.title}</div>
                  <div className="step-description">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`step-connector ${currentStep > step.id ? 'active' : ''}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="step-container">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="step-navigation">
          {currentStep > 1 && (
            <button onClick={handleBack} className="nav-button back">
              ← Back
            </button>
          )}
          
          {currentStep < totalSteps ? (
            <button 
              onClick={handleNext} 
              className={`nav-button next ${
                (currentStep === 3 && !deploymentSuccess) || 
                (currentStep === 4 && !dexDeploymentSuccess) ? 'disabled' : ''
              }`}
              disabled={
                (currentStep === 3 && !deploymentSuccess) || 
                (currentStep === 4 && !dexDeploymentSuccess)
              }
            >
              Next →
            </button>
          ) : (
            <button className="nav-button complete">
              Project Complete
            </button>
          )}
        </div>
      </div>

      {/* Contract Modal */}
      {showContractModal && (
        <div className="modal-overlay" onClick={() => setShowContractModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📄 Smart Contract Preview</h3>
              <button className="modal-close" onClick={() => setShowContractModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="contract-info">
                <div className="info-item">
                  <strong>Project Name:</strong> <span className="highlight">{tokenName || 'Your Project Name'}</span>
                </div>
                <div className="info-item">
                  <strong>Project Initials:</strong> <span className="highlight">{tokenSymbol || 'INITIALS'}</span>
                </div>
                <div className="info-item">
                  <strong>Network:</strong> <span className="highlight">{selectedNetwork === 'mainnet' ? '🌐 Mainnet' : '🧪 Testnet'}</span>
                </div>
                <div className="info-item">
                  <strong>Contract Owner:</strong> <span className="highlight">{connectedAddress || 'Your Wallet Address'}</span>
                </div>
              </div>
              <div className="contract-preview">
                <h4>Contract Code (Your inputs shown in comments):</h4>
                <pre className="contract-code">
                  <code 
                    dangerouslySetInnerHTML={{
                    __html: tokenName.trim() && tokenSymbol.trim() ? 
                        generateCommentedContract(tokenName.trim(), tokenSymbol.trim()) :
                      'Please enter token name and symbol to view contract'
                    }}
                  />
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEX Contract Modal */}
      {showDexContractModal && (
        <div className="modal-overlay" onClick={() => setShowDexContractModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💰 DEX/Treasury Contract Preview</h3>
              <button className="modal-close" onClick={() => setShowDexContractModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="contract-info">
                <div className="info-item">
                  <strong>Project Name:</strong> <span className="highlight">{transactionDetails?.tokenName || 'Your Project Name'}</span>
                </div>
                <div className="info-item">
                  <strong>Project Symbol:</strong> <span className="highlight">{transactionDetails?.tokenSymbol || 'SYMBOL'}</span>
                </div>
                <div className="info-item">
                  <strong>Network:</strong> <span className="highlight">{selectedNetwork === 'mainnet' ? '🌐 Mainnet' : '🧪 Testnet'}</span>
                </div>
                <div className="info-item">
                  <strong>Token Contract:</strong> <span className="highlight">{transactionDetails?.contractAddress || 'Token Contract Address'}</span>
                </div>
                <div className="info-item">
                  <strong>DEX Contract:</strong> <span className="highlight">{transactionDetails?.contractAddress ? `${transactionDetails.contractAddress}-sats-treasury` : 'DEX Contract Address'}</span>
                </div>
              </div>
              <div className="contract-preview">
                <h4>DEX Contract Code (Your token highlighted in comments):</h4>
                <pre className="contract-code">
                  <code 
                    dangerouslySetInnerHTML={{
                    __html: transactionDetails?.contractAddress && transactionDetails?.tokenSymbol ? 
                        generateCommentedDexContract(transactionDetails.contractAddress, transactionDetails.tokenSymbol, selectedNetwork) :
                      'Please deploy your token first to view the DEX contract'
                    }}
                  />
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mainnet Coming Soon Modal */}
      {showMainnetComingSoon && (
        <div className="modal-overlay" onClick={() => setShowMainnetComingSoon(false)}>
          <div className="modal-content coming-soon-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚧 Coming Soon!</h3>
              <button className="modal-close" onClick={() => setShowMainnetComingSoon(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="coming-soon-content">
                <div className="coming-soon-icon">🌐</div>
                <h4>Mainnet Deployment</h4>
                <p>Mainnet deployment is currently in development and will be available soon!</p>
                <div className="coming-soon-features">
                  <div className="feature-item">
                    <span className="feature-icon">✅</span>
                    <span>Real money transactions</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">✅</span>
                    <span>Live blockchain deployment</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">✅</span>
                    <span>Production-ready contracts</span>
                  </div>
                </div>
                <p className="coming-soon-note">
                  For now, please use <strong>Testnet</strong> to test your project with fake money.
                </p>
                <button 
                  className="coming-soon-button"
                  onClick={() => setShowMainnetComingSoon(false)}
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Token Modal */}
      {showPendingTokenModal && (
        <div className="modal-overlay" onClick={() => setShowPendingTokenModal(false)}>
          <div className="modal-content pending-token-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Complete Your Previous Project</h3>
              <button className="modal-close" onClick={() => setShowPendingTokenModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="pending-token-content">
                <div className="pending-token-icon">🚧</div>
                <h4>Project Treasury Required</h4>
                <p>You have a deployed token that still needs its Project Treasury. Please complete the full process before creating a new project.</p>
                
                <div className="pending-tokens-list">
                  <h5>Your Pending Projects:</h5>
                  {pendingTokens.map((token, index) => (
                    <div key={index} className="pending-token-item">
                      <div className="token-info">
                        <span className="token-name">{token.token_name}</span>
                        <span className="token-symbol">({token.token_symbol})</span>
                      </div>
                      <div className="token-status">
                        <span className="status-badge deployed">✅ Token Deployed</span>
                        <span className="status-badge pending">⏳ Treasury Pending</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="action-buttons">
                  <button 
                    className="complete-project-btn"
                    onClick={() => {
                      setShowPendingTokenModal(false);
                      // Navigate to step 4 to complete the treasury
                      setCurrentStep(4);
                    }}
                  >
                    Complete Project Treasury
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => setShowPendingTokenModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

             <style jsx>{`
         .create-project-page {
           min-height: 100vh;
           color: white;
           padding: 20px;
         }

        .create-project-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

                 .simplified-header {
           display: flex;
           justify-content: space-between;
           align-items: center;
           padding: 20px;
           margin-bottom: 40px;
           background: rgba(30, 41, 59, 0.8);
           border-radius: 16px;
           border: 1px solid #4b5563;
         }

         .header-left {
           flex: 1;
         }

         .header-center {
           flex: 2;
           text-align: center;
         }

         .header-right {
           flex: 1;
           display: flex;
           justify-content: flex-end;
         }

         .back-button {
           color: #fbbf24;
           text-decoration: none;
           font-weight: bold;
           transition: color 0.2s;
           font-size: 1rem;
         }

         .back-button:hover {
           color: #f59e0b;
         }

         .simplified-header h1 {
           font-size: 2rem;
           color: #fbbf24;
           margin: 0;
           font-weight: bold;
         }

         .wallet-status {
           display: flex;
           align-items: center;
           gap: 12px;
         }

         .wallet-address {
           color: #e5e7eb;
           font-size: 0.9rem;
           font-family: monospace;
           background: rgba(59, 130, 246, 0.2);
           padding: 6px 12px;
           border-radius: 8px;
           border: 1px solid #3b82f6;
         }

         .not-connected {
           color: #9ca3af;
           font-size: 0.9rem;
           font-style: italic;
         }

         

        .progress-container {
          margin-bottom: 40px;
        }

        .progress-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          position: relative;
        }

        .step-number {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #374151;
          color: #9ca3af;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.2rem;
          margin-bottom: 10px;
          transition: all 0.3s;
        }

        .progress-step.active .step-number {
          background: #3b82f6;
          color: white;
        }

        .step-info {
          text-align: center;
        }

        .step-title {
          font-weight: bold;
          color: #fbbf24;
          margin-bottom: 5px;
        }

        .step-description {
          font-size: 0.9rem;
          color: #9ca3af;
        }

        .step-connector {
          position: absolute;
          top: 25px;
          right: -50%;
          width: 100%;
          height: 2px;
          background: #374151;
          z-index: -1;
        }

        .step-connector.active {
          background: #3b82f6;
        }

        .step-container {
          background: rgba(30, 41, 59, 0.8);
          border-radius: 16px;
          padding: 40px;
          margin-bottom: 40px;
          border: 1px solid #374151;
        }

        .step-content h2 {
          color: #fbbf24;
          font-size: 2rem;
          margin-bottom: 20px;
          text-align: center;
        }

        .step-header {
          text-align: center;
          margin-bottom: 40px;
          padding: 30px;
          background: rgba(30, 41, 59, 0.6);
          border-radius: 16px;
          border: 1px solid #4b5563;
        }

        .step-header h2 {
          color: #fbbf24;
          font-size: 2rem;
          margin-bottom: 16px;
          font-weight: bold;
        }

        .network-badge-large {
          display: inline-block;
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: bold;
          font-size: 1.1rem;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        /* Modern Step Container */
        .modern-step-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* Hero Header */
        .hero-header {
          text-align: center;
          margin-bottom: 60px;
          padding: 60px 0;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
          border-radius: 24px;
          border: 1px solid rgba(75, 85, 99, 0.3);
          position: relative;
          overflow: hidden;
        }

        .hero-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(251, 191, 36, 0.1) 50%, transparent 70%);
          animation: shimmer 3s ease-in-out infinite;
        }

        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }

        .hero-content {
          position: relative;
          z-index: 1;
        }

        .hero-content h1 {
          color: #fbbf24;
          font-size: 3.5rem;
          font-weight: 800;
          margin-bottom: 16px;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .hero-content p {
          color: #e5e7eb;
          font-size: 1.3rem;
          margin-bottom: 32px;
          opacity: 0.9;
        }

        .network-status {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: rgba(15, 23, 42, 0.8);
          padding: 12px 24px;
          border-radius: 50px;
          border: 1px solid rgba(75, 85, 99, 0.5);
        }

        .status-dot {
          width: 12px;
          height: 12px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-text {
          color: #e5e7eb;
          font-weight: 600;
          font-size: 1.1rem;
        }

        /* Content Grid */
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 60px;
        }

        /* Form Column */
        .form-column {
          display: flex;
          flex-direction: column;
        }

        .form-card {
          background: rgba(30, 41, 59, 0.8);
          border-radius: 20px;
          border: 1px solid rgba(75, 85, 99, 0.3);
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .card-header {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05));
          padding: 24px 32px;
          border-bottom: 1px solid rgba(75, 85, 99, 0.3);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-header h3 {
          color: #fbbf24;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .step-indicator {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .form-fields {
          padding: 32px;
        }

        .input-group {
          margin-bottom: 32px;
        }

        .input-group:last-child {
          margin-bottom: 0;
        }

        .input-group label {
          display: block;
          color: #e5e7eb;
          font-weight: 600;
          margin-bottom: 12px;
          font-size: 1.1rem;
        }

        .modern-input {
          width: 100%;
          padding: 16px 20px;
          background: rgba(15, 23, 42, 0.8);
          border: 2px solid rgba(75, 85, 99, 0.5);
          border-radius: 12px;
          color: #e5e7eb;
          font-size: 1rem;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .modern-input:focus {
          outline: none;
          border-color: #fbbf24;
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
        }

        .modern-input::placeholder {
          color: #9ca3af;
        }

        .input-hint {
          display: block;
          color: #9ca3af;
          font-size: 0.9rem;
          margin-top: 8px;
        }

        /* Symbol Check Status */
        .symbol-check-status {
          font-size: 0.85rem;
          margin-top: 8px;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 500;
        }

        .symbol-check-status.checking {
          background: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.3);
        }

        .symbol-check-status.available {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .symbol-check-status.taken {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        /* Preview Column */
        .preview-column {
          display: flex;
          flex-direction: column;
        }

        .preview-card {
          background: rgba(30, 41, 59, 0.8);
          border-radius: 20px;
          border: 1px solid rgba(75, 85, 99, 0.3);
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .preview-badge {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .preview-content {
          padding: 32px;
        }

        .preview-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 0;
          border-bottom: 1px solid rgba(75, 85, 99, 0.2);
        }

        .preview-row:last-child {
          border-bottom: none;
        }

        .preview-row.highlight {
          background: rgba(251, 191, 36, 0.05);
          margin: 0 -32px;
          padding: 20px 32px;
          border-radius: 12px;
        }

        .preview-label {
          color: #9ca3af;
          font-weight: 600;
          font-size: 1rem;
          min-width: 140px;
        }

        .preview-value {
          flex: 1;
          text-align: right;
        }

        .contract-address {
          color: #22c55e;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 0.9rem;
          word-break: break-all;
        }

        .placeholder {
          color: #6b7280;
          font-style: italic;
        }

        .supply-badge {
          background: linear-gradient(135deg, #a855f7, #9333ea);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 1rem;
          margin-right: 12px;
        }

        .max-supply {
          color: #fbbf24;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .network-badge {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .network-badge.testnet {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
        }

        .network-badge.mainnet {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }

        .network-badge.centered {
          display: block;
          margin: 0 auto;
          text-align: center;
        }

        /* Action Section */
        .action-section {
          text-align: center;
          padding: 40px 0;
        }

        .action-buttons {
          display: flex;
          gap: 100px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .preview-btn, .launch-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 40px;
          border: none;
          border-radius: 20px;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 240px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .preview-btn {
          background: rgba(75, 85, 99, 0.8);
          color: #9ca3af;
          border: 2px solid rgba(75, 85, 99, 0.5);
        }

        .preview-btn.active {
          background: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
          border-color: #fbbf24;
        }

        .preview-btn.active:hover {
          background: rgba(251, 191, 36, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
        }

        .launch-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: 2px solid #3b82f6;
        }

        .launch-btn.active {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-color: #22c55e;
        }

        .launch-btn.active:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4);
        }

        .preview-btn.disabled, .launch-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .btn-icon {
          font-size: 1.2rem;
        }

        .btn-text {
          font-weight: 600;
        }

        /* Success Section */
        .success-section {
          margin-top: 40px;
          animation: fadeInUp 0.5s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .success-card {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 163, 74, 0.05));
          border: 2px solid rgba(34, 197, 94, 0.3);
          border-radius: 20px;
          padding: 32px;
          text-align: center;
        }

        .success-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .success-icon {
          font-size: 2rem;
        }

        .success-header h3 {
          color: #22c55e;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .transaction-details {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(75, 85, 99, 0.2);
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-label {
          color: #9ca3af;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .detail-value {
          color: #e5e7eb;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 0.9rem;
          word-break: break-all;
          text-align: right;
          max-width: 60%;
        }

        .detail-value-with-copy {
          display: flex;
          align-items: center;
          gap: 8px;
          max-width: 60%;
        }

        .copy-button {
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 4px;
          padding: 4px 6px;
          color: #3b82f6;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .copy-button:hover {
          background: rgba(59, 130, 246, 0.3);
          border-color: rgba(59, 130, 246, 0.5);
        }

        .explorer-link {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        .explorer-link:hover {
          color: #60a5fa;
          text-decoration: underline;
        }

        .next-step-prompt {
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 12px;
          padding: 16px;
        }

        .next-step-prompt p {
          color: #fbbf24;
          font-weight: 600;
          margin: 0;
          font-size: 1.1rem;
        }

        .benefits-section, .requirements-section {
          margin-bottom: 40px;
        }

                 .benefit-card, .requirement-card {
           background: rgba(55, 65, 81, 0.5);
           border-radius: 16px;
           padding: 24px;
           margin-bottom: 24px;
           border: 1px solid #4b5563;
           transition: all 0.3s ease;
         }

         .benefit-card:hover, .requirement-card:hover {
           background: rgba(55, 65, 81, 0.7);
           border-color: #fbbf24;
           transform: translateY(-2px);
           box-shadow: 0 8px 25px rgba(251, 191, 36, 0.15);
         }

         .benefit-header, .requirement-header {
           display: flex;
           align-items: center;
           margin-bottom: 16px;
           gap: 16px;
         }

         .benefit-icon, .requirement-icon {
           width: 48px;
           height: 48px;
           flex-shrink: 0;
           filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
         }

         .benefit-header h3, .requirement-header h3 {
           color: #fbbf24;
           font-size: 1.4rem;
           font-weight: bold;
           margin: 0;
           text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
         }

         .benefit-card p, .requirement-card p {
           color: #e5e7eb;
           line-height: 1.7;
           font-size: 1.05rem;
           margin: 0;
           text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
         }

         .requirement-card ul {
           color: #e5e7eb;
           margin: 16px 0 0 20px;
           padding: 0;
         }

         .requirement-card li {
           margin-bottom: 8px;
           line-height: 1.6;
           font-size: 1.05rem;
           text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
         }

                  .requirement-card li::marker {
           color: #fbbf24;
         }

                                       .token-form {
             max-width: 800px;
             margin: 0 auto;
           }

           .form-section {
             background: rgba(30, 41, 59, 0.6);
             border-radius: 16px;
             padding: 40px;
             border: 1px solid #4b5563;
             margin-bottom: 30px;
           }

           .form-section h3 {
             color: #fbbf24;
             font-size: 1.4rem;
             margin-bottom: 24px;
             font-weight: bold;
             text-align: center;
           }

           .contract-preview-section {
             background: rgba(30, 41, 59, 0.6);
             border-radius: 16px;
             padding: 32px;
             margin: 40px 0;
             border: 1px solid #4b5563;
           }

           .contract-preview-section h3 {
             color: #fbbf24;
             font-size: 1.2rem;
             margin-bottom: 20px;
             text-align: center;
           }

           .preview-grid {
             display: grid;
             grid-template-columns: 1fr;
             gap: 20px;
           }

           .preview-item {
             display: flex;
             flex-direction: column;
             background: rgba(15, 23, 42, 0.8);
             padding: 16px;
             border-radius: 12px;
             border: 1px solid #374151;
           }

           .preview-item label {
             color: #9ca3af;
             font-size: 0.9rem;
             margin-bottom: 4px;
             font-weight: 500;
           }

           .preview-value {
             color: #e5e7eb;
             font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
             font-size: 0.95rem;
             word-break: break-all;
           }

           .preview-value.fixed {
             color: #a855f7;
             font-weight: bold;
           }

           .preview-value.network {
             color: #22c55e;
             font-weight: bold;
           }

           .form-group {
             margin-bottom: 40px;
           }

           .form-group:last-child {
             margin-bottom: 0;
           }

           .form-group:last-child {
             margin-bottom: 0;
           }

           .form-group label {
             display: block;
             color: #e5e7eb;
             font-weight: 600;
             margin-bottom: 12px;
             font-size: 1rem;
             letter-spacing: 0.5px;
           }

           .form-input {
             width: 100%;
             padding: 16px 20px;
             border: 2px solid #4b5563;
             border-radius: 12px;
             background: rgba(15, 23, 42, 0.8);
             color: #e5e7eb;
             font-size: 1rem;
             transition: all 0.3s ease;
             box-sizing: border-box;
             font-family: inherit;
           }

           .form-input:focus {
             outline: none;
             border-color: #3b82f6;
             background: rgba(15, 23, 42, 0.9);
             box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
             transform: translateY(-1px);
           }

           .form-input::placeholder {
             color: #6b7280;
             font-style: italic;
           }

                       .form-group small {
              display: block;
              color: #9ca3af;
              font-size: 0.85rem;
              margin-top: 8px;
              font-style: italic;
            }

                         .network-selector {
               display: flex;
               gap: 12px;
               margin-top: 8px;
             }

             .network-option {
               flex: 1;
               padding: 12px 16px;
               border: 2px solid #4b5563;
               border-radius: 8px;
               background: rgba(15, 23, 42, 0.8);
               color: #9ca3af;
               font-weight: 600;
               cursor: pointer;
               transition: all 0.3s ease;
               font-size: 0.9rem;
               display: flex;
               align-items: center;
               gap: 12px;
               position: relative;
             }

             .network-option:hover {
               border-color: #3b82f6;
               background: rgba(15, 23, 42, 0.9);
             }

             .network-option input[type="radio"] {
               position: absolute;
               opacity: 0;
               cursor: pointer;
             }

             .checkbox-custom {
               width: 20px;
               height: 20px;
               border: 2px solid #4b5563;
               border-radius: 50%;
               background: rgba(15, 23, 42, 0.8);
               display: inline-block;
               position: relative;
               transition: all 0.3s ease;
               flex-shrink: 0;
             }

             .network-option input[type="radio"]:checked + .checkbox-custom {
               border-color: #fbbf24;
               background: rgba(251, 191, 36, 0.2);
             }

             .network-option input[type="radio"]:checked + .checkbox-custom::after {
               content: '';
               position: absolute;
               top: 50%;
               left: 50%;
               transform: translate(-50%, -50%);
               width: 8px;
               height: 8px;
               border-radius: 50%;
               background: #fbbf24;
             }

             .network-option input[type="radio"]:checked ~ .network-label {
               color: #fbbf24;
             }

             .network-label {
               color: #9ca3af;
               transition: color 0.3s ease;
             }

            .deployment-status {
              margin-top: 16px;
              padding: 12px 16px;
              border-radius: 8px;
              font-size: 0.9rem;
              font-weight: 500;
              text-align: center;
            }

            .deployment-status.success {
              background: rgba(34, 197, 94, 0.1);
              border: 1px solid #22c55e;
              color: #22c55e;
            }

            .deployment-status.error {
              background: rgba(239, 68, 68, 0.1);
              border: 1px solid #ef4444;
              color: #ef4444;
            }

            .deployment-status.info {
              background: rgba(59, 130, 246, 0.1);
              border: 1px solid #3b82f6;
              color: #3b82f6;
            }

           .form-info {
             display: flex;
             flex-direction: column;
             gap: 20px;
           }

           .info-card {
             background: rgba(30, 41, 59, 0.6);
             border-radius: 16px;
             padding: 24px;
             border: 1px solid #4b5563;
           }

           .info-card h4 {
             color: #fbbf24;
             font-size: 1.2rem;
             margin-bottom: 16px;
             font-weight: bold;
           }

           .info-card ul {
             list-style: none;
             padding: 0;
             margin: 0;
           }

           .info-card li {
             color: #e5e7eb;
             margin-bottom: 12px;
             padding: 8px 0;
             border-bottom: 1px solid rgba(75, 85, 99, 0.3);
             font-size: 0.95rem;
             line-height: 1.5;
           }

           .info-card li:last-child {
             border-bottom: none;
             margin-bottom: 0;
           }

                       .info-card strong {
              color: #fbbf24;
              font-weight: 600;
            }

            .form-actions {
              margin-top: 32px;
              text-align: center;
            }

            .launch-button {
              padding: 16px 32px;
              border: none;
              border-radius: 12px;
              font-weight: bold;
              font-size: 1.1rem;
              cursor: pointer;
              transition: all 0.3s ease;
              width: 100%;
              max-width: 300px;
            }

            .launch-button.active {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: #fbbf24;
              box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
            }

            .launch-button.active:hover {
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
            }

            .launch-button.disabled {
              background: #374151;
              color: #6b7280;
              cursor: not-allowed;
              box-shadow: none;
            }

                                      .launch-button.disabled:hover {
               transform: none;
               box-shadow: none;
             }

                           .step-panel {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 2rem;
              }

              .step-header {
                text-align: center;
                margin-bottom: 2rem;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 120px;
              }

              .step-header h2 {
                margin: 0 0 0.5rem 0;
                font-size: 1.5rem;
                color: #ffffff;
              }

              .step-header p {
                margin: 0;
                color: #94a3b8;
                font-size: 1rem;
              }

              .info-content {
                max-width: 800px;
                margin: 0 auto;
              }

              .info-section {
                margin-bottom: 2.5rem;
              }

              .info-section h3 {
                margin: 0 0 1.5rem 0;
                font-size: 1.5rem;
                color: #fbbf24;
                text-align: center;
              }

              .network-button {
                outline: none;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }

              .network-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
              }

              .network-button.selected {
                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
              }

              .step-actions {
                text-align: center;
                margin-top: 2rem;
              }

              .next-button {
                background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                border: none;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 1rem;
              }

              .next-button:hover:not(:disabled) {
                background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%);
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(249, 115, 22, 0.3);
              }

              .next-button:disabled {
                background: #6b7280;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
              }

           .placeholder-content {
             text-align: center;
             color: #9ca3af;
             font-style: italic;
           }

          /* Network Indicator */
          .network-indicator {
            text-align: center;
            margin-bottom: 2rem;
            padding: 1rem;
            background: rgba(30, 41, 59, 0.6);
            border-radius: 12px;
            border: 1px solid #4b5563;
          }

          .network-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
          }

          .network-badge.testnet {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
          }

          .network-badge.mainnet {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
          }

          .network-description {
            color: #e5e7eb;
            font-size: 0.9rem;
            margin: 0;
          }

          /* Button Group */
          .button-group {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 40px;
          }

          .view-contract-button {
            padding: 14px 24px;
            border: 2px solid #6b7280;
            border-radius: 10px;
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.3s ease;
            background: rgba(30, 41, 59, 0.8);
            color: #9ca3af;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            min-width: 180px;
          }

          .view-contract-button.active {
            border-color: #fbbf24;
            background: rgba(251, 191, 36, 0.1);
            color: #fbbf24;
            box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
          }

          .view-contract-button.active:hover {
            background: rgba(251, 191, 36, 0.2);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(251, 191, 36, 0.3);
          }

          .view-contract-button.disabled {
            background: #374151;
            color: #6b7280;
            cursor: not-allowed;
            border-color: #374151;
            box-shadow: none;
          }

          .launch-button {
            min-width: 220px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          }

          .launch-button.active:hover {
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
          }

          /* Modal Styles */
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
          }

          .modal-content {
            background: #1e293b;
            border-radius: 16px;
            max-width: 800px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            border: 1px solid #4b5563;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #4b5563;
          }

          .modal-header h3 {
            color: #fbbf24;
            margin: 0;
            font-size: 1.5rem;
          }

          .modal-close {
            background: none;
            border: none;
            color: #9ca3af;
            font-size: 24px;
            cursor: pointer;
            padding: 4px;
          }

          .modal-close:hover {
            color: #e5e7eb;
          }

          .modal-body {
            padding: 20px;
          }

          .contract-info {
            background: rgba(30, 41, 59, 0.6);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 20px;
            border: 1px solid #4b5563;
          }

          .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            color: #e5e7eb;
          }

          .info-item:last-child {
            margin-bottom: 0;
          }

          .highlight {
            color: #fbbf24;
            font-weight: bold;
          }

          .contract-preview h4 {
            color: #fbbf24;
            margin-bottom: 12px;
          }

          .contract-code {
            background: #0f172a;
            border: 1px solid #4b5563;
            border-radius: 8px;
            padding: 16px;
            overflow-x: auto;
            font-size: 12px;
            line-height: 1.4;
            max-height: 400px;
            overflow-y: auto;
          }

          .contract-code code {
            color: #e5e7eb;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          }

          /* Contract code highlighting */
          .contract-code :global(.user-input) {
            background: rgba(34, 197, 94, 0.3);
          }

          /* Coming Soon Modal Styles */
          .coming-soon-modal {
            max-width: 500px !important;
          }

          .coming-soon-content {
            text-align: center;
            padding: 20px 0;
          }

          .coming-soon-icon {
            font-size: 4rem;
            margin-bottom: 16px;
          }

          .coming-soon-content h4 {
            color: #fbbf24;
            font-size: 1.5rem;
            margin-bottom: 12px;
          }

          .coming-soon-content p {
            color: #e5e7eb;
            margin-bottom: 20px;
            line-height: 1.6;
          }

          .coming-soon-features {
            background: rgba(30, 41, 59, 0.6);
            border-radius: 12px;
            padding: 16px;
            margin: 20px 0;
            border: 1px solid #4b5563;
          }

          .feature-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            color: #e5e7eb;
            font-size: 0.9rem;
          }

          .feature-item:last-child {
            margin-bottom: 0;
          }

          .feature-icon {
            margin-right: 8px;
            font-size: 1rem;
          }

          .coming-soon-note {
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 8px;
            padding: 12px;
            margin: 16px 0;
            color: #93c5fd;
            font-size: 0.9rem;
          }

          .coming-soon-button {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 24px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 16px;
          }

          .coming-soon-button:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            transform: translateY(-1px);
          }

          /* Pending Token Modal Styles */
          .pending-token-modal {
            max-width: 600px !important;
          }

          .pending-token-content {
            text-align: center;
            padding: 20px 0;
          }

          .pending-token-icon {
            font-size: 4rem;
            margin-bottom: 16px;
          }

          .pending-token-content h4 {
            color: #fbbf24;
            font-size: 1.5rem;
            margin-bottom: 12px;
          }

          .pending-token-content p {
            color: #e5e7eb;
            margin-bottom: 20px;
            line-height: 1.6;
          }

          .pending-tokens-list {
            background: rgba(30, 41, 59, 0.6);
            border-radius: 12px;
            padding: 16px;
            margin: 20px 0;
            border: 1px solid #4b5563;
            text-align: left;
          }

          .pending-tokens-list h5 {
            color: #fbbf24;
            margin-bottom: 12px;
            font-size: 1rem;
          }

          .pending-token-item {
            background: rgba(15, 23, 42, 0.8);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 8px;
            border: 1px solid #4b5563;
          }

          .pending-token-item:last-child {
            margin-bottom: 0;
          }

          .token-info {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
          }

          .token-name {
            color: #e5e7eb;
            font-weight: 600;
          }

          .token-symbol {
            color: #9ca3af;
            font-size: 0.9rem;
          }

          .token-status {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 600;
          }

          .status-badge.deployed {
            background: rgba(34, 197, 94, 0.2);
            color: #22c55e;
            border: 1px solid rgba(34, 197, 94, 0.3);
          }

          .status-badge.pending {
            background: rgba(251, 191, 36, 0.2);
            color: #fbbf24;
            border: 1px solid rgba(251, 191, 36, 0.3);
          }

          .action-buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
            margin-top: 20px;
          }

          .complete-project-btn {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 24px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .complete-project-btn:hover {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            transform: translateY(-1px);
          }

          .complete-project-btn.disabled {
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
            cursor: not-allowed;
            opacity: 0.6;
          }

          .complete-project-btn.disabled:hover {
            transform: none;
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
          }

          .complete-button-section {
            margin-top: 24px;
            text-align: center;
          }

          .completion-note {
            margin-top: 12px;
            color: #9ca3af;
            font-size: 0.9rem;
            font-style: italic;
          }

          .cancel-btn {
            background: rgba(75, 85, 99, 0.2);
            color: #9ca3af;
            border: 1px solid #4b5563;
            border-radius: 8px;
            padding: 12px 24px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .cancel-btn:hover {
            background: rgba(75, 85, 99, 0.3);
            color: #e5e7eb;
          }

          /* Pending Token Warning Banner */
          .pending-token-warning {
            background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05));
            border: 2px solid rgba(251, 191, 36, 0.3);
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 24px;
            animation: fadeInUp 0.5s ease-out;
          }

          .warning-content {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .warning-icon {
            font-size: 1.5rem;
            flex-shrink: 0;
          }

          .warning-text {
            flex: 1;
            color: #fbbf24;
            font-size: 0.95rem;
            line-height: 1.4;
          }

          .warning-action-btn {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #1e293b;
            border: none;
            border-radius: 8px;
            padding: 8px 16px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            flex-shrink: 0;
          }

          .warning-action-btn:hover {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            transform: translateY(-1px);
          }

          /* Pending Token Details */
          .pending-token-details {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(251, 191, 36, 0.3);
          }

          .pending-token-details h4 {
            color: #fbbf24;
            margin-bottom: 16px;
            font-size: 1.1rem;
          }

          .pending-token-item {
            background: rgba(15, 23, 42, 0.8);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            border: 1px solid #4b5563;
          }

          .pending-token-item:last-child {
            margin-bottom: 0;
          }

          .token-info {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
          }

          .token-name {
            color: #e5e7eb;
            font-weight: 600;
            font-size: 1.1rem;
          }

          .token-symbol {
            color: #9ca3af;
            font-size: 0.9rem;
          }

          .token-status {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 8px;
          }

          .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 600;
          }

          .status-badge.deployed {
            background: rgba(34, 197, 94, 0.2);
            color: #22c55e;
            border: 1px solid rgba(34, 197, 94, 0.3);
          }

          .status-badge.pending {
            background: rgba(251, 191, 36, 0.2);
            color: #fbbf24;
            border: 1px solid rgba(251, 191, 36, 0.3);
          }

          .token-contract {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .contract-label {
            color: #9ca3af;
            font-size: 0.9rem;
            font-weight: 600;
          }

          .contract-address {
            color: #e5e7eb;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 0.85rem;
            word-break: break-all;
          }

          /* Checking Pending Tokens Loading */
          .checking-pending-tokens {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05));
            border: 2px solid rgba(59, 130, 246, 0.3);
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 24px;
            animation: fadeInUp 0.5s ease-out;
          }

          .checking-content {
            display: flex;
            align-items: center;
            gap: 16px;
            justify-content: center;
          }

          .checking-icon {
            font-size: 1.5rem;
            animation: pulse 1.5s ease-in-out infinite;
          }

          .checking-text {
            color: #3b82f6;
            font-size: 0.95rem;
            font-weight: 600;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          /* Disabled Navigation Button */
          .nav-button.next.disabled {
            background: rgba(75, 85, 99, 0.2) !important;
            color: #6b7280 !important;
            cursor: not-allowed !important;
            border-color: #4b5563 !important;
          }

          .nav-button.next.disabled:hover {
            background: rgba(75, 85, 99, 0.2) !important;
            transform: none !important;
          }

          /* Treasury Step Styles */
          .treasury-step-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }

          .treasury-hero-header {
            text-align: center;
            margin-bottom: 40px;
          }

          .treasury-hero-content h1 {
            color: #fbbf24;
            font-size: 2.5rem;
            margin-bottom: 12px;
            font-weight: bold;
           }

          .treasury-hero-content p {
            color: #9ca3af;
            font-size: 1.1rem;
            line-height: 1.6;
          }

          .treasury-info-card {
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid #4b5563;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 32px;
          }

          .treasury-info-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
          }

          .treasury-icon {
            font-size: 2rem;
          }

          .treasury-info-header h3 {
            color: #fbbf24;
            font-size: 1.5rem;
            margin: 0;
          }

          .treasury-info-content p {
            color: #e5e7eb;
            margin-bottom: 12px;
            font-size: 1rem;
          }

          .treasury-info-content ul {
            color: #e5e7eb;
            padding-left: 20px;
          }

          .treasury-info-content li {
            margin-bottom: 8px;
            line-height: 1.5;
          }

          .deployed-token-info {
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 32px;
          }

          .deployed-token-info h4 {
            color: #22c55e;
            margin-bottom: 16px;
            font-size: 1.2rem;
          }

          .token-summary {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .token-detail {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
          }

          .token-detail .label {
            color: #9ca3af;
            font-weight: 600;
          }

          .token-detail .value {
            color: #e5e7eb;
            font-weight: 500;
          }

          .token-detail .contract-address {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 0.9rem;
            word-break: break-all;
            text-align: right;
            max-width: 60%;
          }

          /* Deployed Token Notice */
          .deployed-token-notice {
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05));
            border: 2px solid rgba(34, 197, 94, 0.3);
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 24px;
            animation: fadeInUp 0.5s ease-out;
          }

          .notice-content {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .notice-icon {
            font-size: 1.5rem;
            flex-shrink: 0;
          }

          .notice-text {
            flex: 1;
            color: #22c55e;
            font-size: 0.95rem;
            line-height: 1.4;
          }

          .notice-action-btn {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: #1e293b;
            border: none;
            border-radius: 8px;
            padding: 8px 16px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            flex-shrink: 0;
          }

          .notice-action-btn:hover {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            transform: translateY(-1px);
          }

          /* Deployed Token Details */
          .deployed-token-details {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(34, 197, 94, 0.3);
          }

          .deployed-token-details h4 {
            color: #22c55e;
            margin-bottom: 16px;
            font-size: 1.1rem;
          }

          .deployed-token-item {
            background: rgba(15, 23, 42, 0.8);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            border: 1px solid #4b5563;
          }

          .deployed-token-item:last-child {
            margin-bottom: 0;
          }

          .token-tx {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
          }

          .tx-label {
            color: #9ca3af;
            font-size: 0.85rem;
            font-weight: 500;
          }

          .tx-hash {
            color: #22c55e;
            font-size: 0.85rem;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            word-break: break-all;
            text-align: right;
            max-width: 60%;
          }

          .treasury-deployment-section {
            text-align: center;
            padding: 32px;
            background: rgba(15, 23, 42, 0.8);
            border: 2px solid #4b5563;
            border-radius: 16px;
          }

          .treasury-action-buttons {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 20px;
          }

          .view-dex-contract-btn {
            background: rgba(251, 191, 36, 0.1);
            color: #fbbf24;
            border: 2px solid #fbbf24;
            border-radius: 12px;
            padding: 16px 32px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 200px;
          }

          .view-dex-contract-btn.active:hover {
            background: rgba(251, 191, 36, 0.2);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
          }

          .view-dex-contract-btn.disabled {
            background: rgba(75, 85, 99, 0.1);
            color: #6b7280;
            border-color: #4b5563;
            cursor: not-allowed;
          }

          .deploy-treasury-btn {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 16px 32px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 220px;
          }

          .deploy-treasury-btn:hover {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
          }

          .btn-icon {
            font-size: 1.5rem;
          }

          .btn-text {
            font-weight: 600;
          }

          .deployment-note {
            color: #9ca3af;
            font-size: 0.95rem;
            line-height: 1.5;
            margin: 0;
          }

          /* Step 5 - Treasury Token Styles */
          .treasury-token-step-container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
          }

          /* Mobile Responsive Styles */
          @media (max-width: 768px) {
            .create-project-page {
              padding: 10px;
            }

            .simplified-header {
              padding: 15px 10px;
              flex-direction: column;
              gap: 10px;
            }

            .header-left, .header-right {
              width: 100%;
              text-align: center;
            }

            .back-button {
              font-size: 14px;
              padding: 8px 16px;
            }

            .step-content {
              padding: 15px 10px;
            }

            .modern-step-container {
              padding: 20px 15px;
              margin: 10px 0;
            }

            .step-header h1 {
              font-size: 1.8rem;
              margin-bottom: 10px;
            }

            .step-header p {
              font-size: 1rem;
              line-height: 1.4;
            }

            .input-group {
              margin-bottom: 20px;
            }

            .modern-input {
              padding: 12px 16px;
              font-size: 16px;
            }

            .input-hint {
              font-size: 12px;
              margin-top: 5px;
            }

            .deploy-btn {
              width: 100%;
              padding: 16px 20px;
              font-size: 16px;
            }

            .btn-icon {
              font-size: 18px;
            }

            .btn-text {
              font-size: 16px;
            }

            .deployment-status {
              padding: 12px 16px;
              font-size: 14px;
              margin: 15px 0;
            }

            .success-section {
              margin: 20px 0;
            }

            .success-card {
              padding: 20px 15px;
            }

            .success-header h3 {
              font-size: 1.4rem;
            }

            .transaction-details {
              gap: 12px;
            }

            .detail-row {
              flex-direction: column;
              align-items: flex-start;
              gap: 5px;
            }

            .detail-label {
              font-size: 14px;
              font-weight: 600;
            }

            .detail-value {
              font-size: 12px;
              word-break: break-all;
            }

            .detail-value-with-copy {
              flex-direction: column;
              align-items: flex-start;
              gap: 8px;
            }

            .copy-button {
              padding: 6px 12px;
              font-size: 12px;
            }

            .explorer-link {
              font-size: 14px;
              padding: 8px 16px;
            }

            .dex-status-info {
              padding: 15px;
              margin: 15px 0;
            }

            .dex-summary {
              gap: 10px;
            }

            .dex-detail {
              flex-direction: column;
              align-items: flex-start;
              gap: 5px;
            }

            .dex-detail .label {
              font-size: 14px;
            }

            .dex-detail .value {
              font-size: 12px;
              word-break: break-all;
            }

            .mint-supply-section {
              padding: 20px 15px;
              margin: 15px 0;
            }

            .mint-supply-header h3 {
              font-size: 1.3rem;
            }

            .mint-supply-btn {
              width: 100%;
              padding: 16px 20px;
              font-size: 16px;
            }

            .mint-supply-note {
              font-size: 14px;
              line-height: 1.4;
            }

            .mint-supply-status {
              padding: 12px 16px;
              font-size: 14px;
              margin: 15px 0;
            }

            .project-completion-section {
              padding: 20px 15px;
              margin: 15px 0;
            }

            .completion-card {
              padding: 20px 15px;
            }

            .completion-header h3 {
              font-size: 1.4rem;
            }

            .completion-content ul {
              padding-left: 20px;
            }

            .completion-content li {
              font-size: 14px;
              margin-bottom: 8px;
            }

            .navigation-buttons {
              flex-direction: column;
              gap: 10px;
              padding: 20px 15px;
            }

            .nav-button {
              width: 100%;
              padding: 16px 20px;
              font-size: 16px;
            }

            .step-indicator {
              padding: 10px 15px;
              margin: 10px 0;
            }

            .step-indicator .step {
              font-size: 12px;
              padding: 8px 12px;
            }

            .modal-overlay {
              padding: 10px;
            }

            .modal-content {
              width: 95%;
              max-width: none;
              margin: 10px;
              padding: 20px 15px;
            }

            .modal-header h3 {
              font-size: 1.3rem;
            }

            .modal-close {
              font-size: 24px;
              padding: 8px;
            }

            .contract-preview {
              font-size: 12px;
              padding: 15px;
              max-height: 300px;
            }

            .deployed-token-notice {
              padding: 15px;
              margin: 15px 0;
            }

            .notice-content {
              flex-direction: column;
              gap: 10px;
            }

            .notice-action-btn {
              width: 100%;
              padding: 12px 20px;
              font-size: 14px;
            }

            .deployed-token-details {
              margin-top: 15px;
            }

            .deployed-token-item {
              padding: 15px;
              margin: 10px 0;
            }

            .token-info {
              flex-direction: column;
              gap: 8px;
            }

            .token-name {
              font-size: 16px;
            }

            .token-symbol {
              font-size: 14px;
            }

            .token-contract {
              font-size: 12px;
              word-break: break-all;
            }
          }

          /* Small mobile devices */
          @media (max-width: 480px) {
            .step-header h1 {
              font-size: 1.5rem;
            }

            .modern-step-container {
              padding: 15px 10px;
            }

            .success-card {
              padding: 15px 10px;
            }

            .transaction-details {
              gap: 10px;
            }

            .detail-value {
              font-size: 11px;
            }

            .copy-button {
              padding: 4px 8px;
              font-size: 11px;
            }

            .explorer-link {
              font-size: 12px;
              padding: 6px 12px;
            }

            .modal-content {
              width: 98%;
              margin: 5px;
              padding: 15px 10px;
            }

            .contract-preview {
              font-size: 11px;
              padding: 10px;
              max-height: 250px;
            }
          }

          .treasury-token-hero-header {
            text-align: center;
            margin-bottom: 40px;
            padding: 40px 20px;
            background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(139, 69, 193, 0.05));
            border-radius: 20px;
            border: 2px solid rgba(168, 85, 247, 0.2);
          }

          .treasury-token-hero-content h1 {
            color: #a855f7;
            font-size: 2.5rem;
            margin-bottom: 16px;
            font-weight: 700;
          }

          .treasury-token-hero-content p {
            color: #e5e7eb;
            font-size: 1.2rem;
            margin: 0;
          }

          .treasury-token-info-card {
            background: rgba(15, 23, 42, 0.8);
            border: 2px solid #4b5563;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 32px;
          }

          .treasury-token-info-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
          }

          .treasury-token-icon {
            font-size: 1.8rem;
          }

          .treasury-token-info-header h3 {
            color: #e5e7eb;
            margin: 0;
            font-size: 1.3rem;
          }

          .treasury-token-info-content ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .treasury-token-info-content li {
            color: #d1d5db;
            margin-bottom: 8px;
            padding: 8px 0;
            border-bottom: 1px solid rgba(75, 85, 99, 0.3);
          }

          .dex-required-notice {
            background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05));
            border: 2px solid rgba(251, 191, 36, 0.3);
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 24px;
          }

          .dex-status-info {
            background: rgba(15, 23, 42, 0.8);
            border: 2px solid #4b5563;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 32px;
          }

          .dex-status-info h4 {
            color: #22c55e;
            margin-bottom: 16px;
            font-size: 1.2rem;
          }

          .dex-summary {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .dex-detail {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid rgba(75, 85, 99, 0.3);
          }

          .dex-detail .label {
            color: #9ca3af;
            font-weight: 500;
          }

          .dex-detail .value {
            color: #e5e7eb;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 0.9rem;
          }

          .treasury-token-mint-section {
            text-align: center;
            padding: 32px;
            background: rgba(15, 23, 42, 0.8);
            border: 2px solid #4b5563;
            border-radius: 16px;
          }

          .mint-action-buttons {
            margin-bottom: 20px;
          }

          .mint-treasury-tokens-btn {
            background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 16px 32px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 0 auto;
            min-width: 280px;
          }

          .mint-treasury-tokens-btn.active:hover {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(168, 85, 247, 0.3);
          }

          .mint-treasury-tokens-btn.disabled {
            background: rgba(75, 85, 99, 0.5);
            color: #9ca3af;
            cursor: not-allowed;
          }

          .mint-note {
            color: #9ca3af;
            font-size: 0.95rem;
            line-height: 1.5;
            margin: 0;
          }

          .mint-status {
            margin-top: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 500;
          }

          .mint-status.info {
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
            border: 1px solid rgba(59, 130, 246, 0.3);
          }

          .mint-status.success {
            background: rgba(34, 197, 94, 0.1);
            color: #22c55e;
            border: 1px solid rgba(34, 197, 94, 0.3);
          }

          .mint-status.error {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.3);
          }

          .treasury-token-success-section {
            margin-top: 32px;
          }

          .treasury-token-success-card {
            background: rgba(15, 23, 42, 0.9);
            border: 2px solid #22c55e;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 20px;
          }

          .success-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
          }

          .success-icon {
            font-size: 1.8rem;
          }

          .success-header h4 {
            color: #22c55e;
            margin: 0;
            font-size: 1.3rem;
          }

          .treasury-token-details {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .treasury-token-detail {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid rgba(34, 197, 94, 0.2);
          }

          .treasury-token-detail .label {
            color: #9ca3af;
            font-weight: 500;
          }

          .treasury-token-detail .value {
            color: #e5e7eb;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 0.9rem;
          }

          .treasury-token-address, .treasury-token-tx {
            color: #a855f7 !important;
          }

          .explorer-link {
            color: #22c55e;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s ease;
          }

          .explorer-link:hover {
            color: #16a34a;
          }

          .completion-message {
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05));
            border: 2px solid rgba(34, 197, 94, 0.3);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
          }

          .completion-message p {
            color: #22c55e;
            font-size: 1.1rem;
            margin: 0;
          }

            color: #22c55e;
            padding: 2px 4px;
            border-radius: 3px;
            font-weight: bold;
          }

          .contract-code :global(.comment) {
            color: #fbbf24;
            font-style: italic;
            background: rgba(251, 191, 36, 0.1);
            padding: 1px 3px;
            border-radius: 2px;
          }

          .contract-code :global(.fixed-value) {
            background: rgba(168, 85, 247, 0.3);
            color: #a855f7;
            padding: 2px 4px;
            border-radius: 3px;
            font-weight: bold;
          }

          /* Contract code styling */
          .contract-code {
            white-space: pre-wrap;
            word-wrap: break-word;
          }

        .step-navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 1rem;
        }

        .nav-button.back {
          background: #374151;
          color: white;
        }

        .nav-button.back:hover {
          background: #4b5563;
        }

        .nav-button.next, .nav-button.deploy {
          background: #3b82f6;
          color: #fbbf24;
        }

        .nav-button.next:hover, .nav-button.deploy:hover {
          background: #2563eb;
          transform: translateY(-2px);
        }

                 @media (max-width: 768px) {
           .create-project-page {
             padding: 10px;
             min-height: 100vh;
             background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
           }

           .create-project-container {
             padding: 10px;
             max-width: 100%;
           }

                       .simplified-header {
              flex-direction: column;
              gap: 15px;
              padding: 15px;
              margin-bottom: 20px;
            }

            .header-left, .header-center, .header-right {
              flex: none;
              width: 100%;
            }

            .header-center {
              order: 1;
            }

            .header-left {
              order: 2;
            }

            .header-right {
              order: 3;
            }

            .simplified-header h1 {
              font-size: 1.6rem;
              line-height: 1.2;
            }

            .wallet-status {
              justify-content: center;
            }

           .progress-container {
             margin-bottom: 20px;
           }

           .progress-bar {
             flex-direction: column;
             gap: 15px;
             align-items: flex-start;
           }

           .progress-step {
             flex-direction: row;
             align-items: center;
             width: 100%;
             gap: 15px;
           }

           .step-number {
             width: 40px;
             height: 40px;
             font-size: 1rem;
             margin-bottom: 0;
             flex-shrink: 0;
           }

           .step-info {
             text-align: left;
             flex: 1;
           }

           .step-title {
             font-size: 1rem;
             margin-bottom: 2px;
           }

           .step-description {
             font-size: 0.8rem;
           }

           .step-connector {
             display: none;
           }

           .step-container {
             padding: 20px;
             margin-bottom: 20px;
             background: rgba(30, 41, 59, 0.9);
           }

           .step-content h2 {
             font-size: 1.5rem;
             margin-bottom: 15px;
           }

                     /* Step 1 Side-by-Side Layout */
          .step1-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            max-width: 1200px;
            margin: 0 auto;
           }

           .benefits-section, .requirements-section {
             margin-bottom: 30px;
            background: rgba(30, 41, 59, 0.6);
            border-radius: 16px;
            padding: 24px;
            border: 1px solid #4b5563;
          }

          .benefits-section h2, .requirements-section h2 {
            color: #fbbf24;
            font-size: 1.8rem;
            margin-bottom: 24px;
            text-align: center;
          }

          /* Responsive design for smaller screens */
          @media (max-width: 768px) {
            .step1-grid {
              grid-template-columns: 1fr;
              gap: 30px;
            }
           }

           .benefit-card, .requirement-card {
             padding: 20px;
             margin-bottom: 20px;
           }

           .benefit-header, .requirement-header {
             flex-direction: column;
             text-align: center;
             gap: 12px;
             margin-bottom: 12px;
           }

           .benefit-icon, .requirement-icon {
             width: 40px;
             height: 40px;
           }

           .benefit-header h3, .requirement-header h3 {
             font-size: 1.2rem;
           }

           .benefit-card p, .requirement-card p {
             font-size: 0.95rem;
             line-height: 1.6;
             text-align: center;
           }

           .requirement-card ul {
             margin: 12px 0 0 15px;
             font-size: 0.95rem;
           }

                                               .token-form {
               max-width: 100%;
               grid-template-columns: 1fr;
               gap: 24px;
               padding: 0;
               margin: 0;
             }

             .form-section {
               padding: 24px;
             }

             .form-section h3 {
               font-size: 1.2rem;
               margin-bottom: 20px;
             }

             .form-group {
               margin-bottom: 24px;
             }

             .form-group label {
               font-size: 0.95rem;
               margin-bottom: 10px;
             }

             .form-input {
               padding: 14px 16px;
               font-size: 0.95rem;
             }

                           .form-group small {
                font-size: 0.8rem;
                margin-top: 6px;
              }

                             .network-selector {
                 gap: 8px;
               }

               .network-option {
                 padding: 10px 12px;
                 font-size: 0.85rem;
                 gap: 8px;
               }

               .checkbox-custom {
                 width: 18px;
                 height: 18px;
               }

               .network-option input[type="radio"]:checked + .checkbox-custom::after {
                 width: 7px;
                 height: 7px;
               }

              .deployment-status {
                margin-top: 12px;
                padding: 10px 12px;
                font-size: 0.85rem;
              }

             .info-card {
               padding: 20px;
             }

             .info-card h4 {
               font-size: 1.1rem;
               margin-bottom: 12px;
             }

                           .info-card li {
                font-size: 0.9rem;
                margin-bottom: 10px;
                padding: 6px 0;
              }

              .form-actions {
                margin-top: 24px;
              }

                                            .launch-button {
                 padding: 14px 24px;
                 font-size: 1rem;
                 max-width: 250px;
               }

                               .step-panel {
                  padding: 1.5rem;
                }

                .step-header h2 {
                  font-size: 1.3rem;
                }

                .step-header p {
                  font-size: 0.9rem;
                }

                .info-section h3 {
                  font-size: 1.3rem;
                }

                /* Make the grid single column on mobile */
                .info-section > div > div {
                  grid-template-columns: 1fr !important;
                  gap: 12px !important;
                  max-width: 300px !important;
                }

                .network-button {
                  min-height: 100px !important;
                  padding: 12px !important;
                }

             .step-navigation {
               flex-direction: column;
               gap: 10px;
               align-items: stretch;
             }

           .nav-button {
             width: 100%;
             padding: 15px 20px;
             font-size: 1rem;
           }
         }

         @media (max-width: 480px) {
           .create-project-page {
             padding: 5px;
           }

           .create-project-container {
             padding: 5px;
           }

                       .simplified-header {
              padding: 12px;
              gap: 12px;
            }

            .simplified-header h1 {
              font-size: 1.4rem;
            }

           .step-container {
             padding: 15px;
           }

           .step-content h2 {
             font-size: 1.3rem;
           }

           .benefit-card, .requirement-card {
             padding: 16px;
           }

           .benefit-header h3, .requirement-header h3 {
             font-size: 1.1rem;
           }

           .benefit-card p, .requirement-card p {
             font-size: 0.9rem;
           }

                                               .token-form {
               gap: 20px;
             }

             .form-section {
               padding: 20px;
             }

             .form-section h3 {
               font-size: 1.1rem;
               margin-bottom: 16px;
             }

             .form-group {
               margin-bottom: 20px;
             }

             .form-group label {
               font-size: 0.9rem;
               margin-bottom: 8px;
             }

             .form-input {
               padding: 12px 14px;
               font-size: 0.9rem;
             }

                           .form-group small {
                font-size: 0.75rem;
                margin-top: 4px;
              }

                             .network-selector {
                 gap: 6px;
               }

               .network-option {
                 padding: 8px 10px;
                 font-size: 0.8rem;
                 gap: 6px;
               }

               .checkbox-custom {
                 width: 16px;
                 height: 16px;
               }

               .network-option input[type="radio"]:checked + .checkbox-custom::after {
                 width: 6px;
                 height: 6px;
               }

              .deployment-status {
                margin-top: 10px;
                padding: 8px 10px;
                font-size: 0.8rem;
              }

             .info-card {
               padding: 16px;
             }

             .info-card h4 {
               font-size: 1rem;
               margin-bottom: 10px;
             }

                           .info-card li {
                font-size: 0.85rem;
                margin-bottom: 8px;
                padding: 4px 0;
              }

              .form-actions {
                margin-top: 20px;
              }

                                            .launch-button {
                 padding: 12px 20px;
                 font-size: 0.95rem;
                 max-width: 200px;
               }

                               .step-panel {
                  padding: 1rem;
                }

                .step-header h2 {
                  font-size: 1.2rem;
                }

                .step-header p {
                  font-size: 0.85rem;
                }

                .info-section h3 {
                  font-size: 1.2rem;
                }

                .info-section > div > div {
                  max-width: 250px !important;
                }

                .network-button {
                  min-height: 90px !important;
                  padding: 10px !important;
                }
         }

         /* Ensure background fallback for all screen sizes */
         @media (max-width: 1024px) {
           .create-project-page {
             background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
           }
         }
      `}</style>
    </div>
  );
}
