'use client'; // Tells Next.js this is a browser-side file (can use things like buttons and clicks)

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
// We import tools from React:
// - useState: lets us store things like the wallet address
// - useEffect: lets us run code when the page loads
// - forwardRef + useImperativeHandle: lets the parent open this wallet modal from outside

import { connect, disconnect, isConnected, getLocalStorage } from '@stacks/connect';
// These are functions from StacksConnect that let us:
// - connect(): open the wallet
// - disconnect(): log out
// - isConnected(): check if already logged in
// - getLocalStorage(): get the user's wallet address

// This makes your wallet button a component that can be triggered from outside (like in Header.js)
const ConnectWallet = forwardRef((props, ref) => {
  const { t } = useTranslation();
  const [userAddress, setUserAddress] = useState(null); // This keeps track of whether someone is connected
  const [isConnecting, setIsConnecting] = useState(false); // Track connection state
  const [connectionRetries, setConnectionRetries] = useState(0); // Track retry attempts
  const { onConnect } = props; // Get the onConnect callback from props

  // 🔧 Enhanced wallet readiness check
  const checkWalletReadiness = async () => {
    try {
      // Check if Stacks Connect is available
      if (typeof window !== 'undefined' && !window.StacksProvider) {
        console.log('⏳ Waiting for Stacks Connect to load...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return false;
      }
      
      // Check if user is already connected
      const connected = await isConnected();
      if (connected) {
        const data = getLocalStorage();
        const stxAddr = data?.addresses?.stx?.[0]?.address;
        return stxAddr ? true : false;
      }
      
      return false;
    } catch (error) {
      console.log('🔍 Wallet readiness check failed:', error.message);
      return false;
    }
  };

  // 🔧 Enhanced connection with retry logic and connection pooling
  const handleConnect = async (retryCount = 0) => {
    if (isConnecting) {
      console.log('⏳ Connection already in progress...');
      return;
    }

    setIsConnecting(true);
    setConnectionRetries(retryCount);

    try {
      console.log(`🔄 Attempting wallet connection (attempt ${retryCount + 1})...`);
      
      // Wait for wallet to be ready
      const isReady = await checkWalletReadiness();
      if (!isReady && retryCount < 3) {
        console.log('⏳ Wallet not ready, retrying...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsConnecting(false);
        return handleConnect(retryCount + 1);
      }

      // Check if we already have a recent connection
      const lastConnectionTime = localStorage.getItem('lastConnectionTime');
      const lastAddress = localStorage.getItem('connectedAddress');
      
      if (lastConnectionTime && lastAddress) {
        const timeSinceConnection = Date.now() - parseInt(lastConnectionTime);
        if (timeSinceConnection < 2 * 60 * 1000) { // 2 minutes
          console.log('✅ Using existing connection:', lastAddress);
          setUserAddress(lastAddress);
          if (onConnect) {
            onConnect(lastAddress);
          }
          return;
        }
      }

      // Attempt connection with connection pooling
      await connect();
      
      // Wait a moment for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify connection was successful
      const data = getLocalStorage();
      const stxAddr = data?.addresses?.stx?.[0]?.address;

      if (stxAddr) {
        setUserAddress(stxAddr);
        localStorage.setItem('connectedAddress', stxAddr);
        localStorage.setItem('walletProvider', 'stacks-connect');
        localStorage.setItem('lastConnectionTime', Date.now().toString());
        
        // Store connection in connection pool
        localStorage.setItem('connectionPool', JSON.stringify({
          address: stxAddr,
          timestamp: Date.now(),
          provider: 'stacks-connect'
        }));
        
        console.log('✅ Connected successfully:', stxAddr);
        
        // Call the onConnect callback if provided
        if (onConnect) {
          onConnect(stxAddr);
        }
      } else {
        throw new Error('Connection succeeded but no address found');
      }
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      
      // Retry logic for connection failures
      if (retryCount < 2) {
        console.log(`🔄 Retrying connection (${retryCount + 1}/2)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsConnecting(false);
        return handleConnect(retryCount + 1);
      } else {
        console.error('❌ Max retries reached, connection failed');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // 🔧 Enhanced disconnect with cleanup
  const handleDisconnect = () => {
    try {
      disconnect();
      localStorage.removeItem('connectedAddress');
      localStorage.removeItem('walletProvider');
      localStorage.removeItem('lastConnectionTime');
      setUserAddress(null);
      setConnectionRetries(0);
      console.log('🔌 Disconnected successfully');
    } catch (error) {
      console.error('❌ Disconnect error:', error);
    }
  };

  // 🔧 Enhanced initialization with better error handling
  useEffect(() => {
    const init = async () => {
      try {
        console.log('🚀 Initializing wallet connection...');
        
        // Check if user was already connected
        const connected = await isConnected();
        if (connected) {
          const data = getLocalStorage();
          const stxAddr = data?.addresses?.stx?.[0]?.address;
          
          if (stxAddr) {
            setUserAddress(stxAddr);
            console.log('✅ Restored previous connection:', stxAddr);
            
            // Call the onConnect callback if provided
            if (onConnect) {
              onConnect(stxAddr);
            }
          } else {
            console.log('⚠️ Previous connection found but no address, clearing...');
            handleDisconnect();
          }
        }
      } catch (error) {
        console.error('❌ Initialization failed:', error);
        // Don't throw here, just log the error
      }
    };
    
    // Add a small delay to ensure Stacks Connect is loaded
    const timer = setTimeout(init, 500);
    return () => clearTimeout(timer);
  }, []);

  // 📦 Enhanced ref interface
  useImperativeHandle(ref, () => ({
    openConnectModal: () => handleConnect(0),
    isConnected: () => !!userAddress,
    getAddress: () => userAddress,
  }));

  // 🎨 Enhanced UI with connection state
  return (
    <>
      {userAddress ? (
        // If someone is connected, show "Disconnect" with the first 6 characters of their wallet address
        <button 
          onClick={handleDisconnect} 
          className="connect-button hover-underline"
          disabled={isConnecting}
        >
          {t('disconnect')} ({userAddress.slice(0, 6)}…)
        </button>
      ) : (
        // If no one is connected, show a "Connect Wallet" button
        <button 
          onClick={() => handleConnect(0)} 
          className="connect-button hover-underline"
          disabled={isConnecting}
        >
          {isConnecting 
            ? `Connecting${connectionRetries > 0 ? ` (${connectionRetries})` : ''}...` 
            : t('connect_wallet')
          }
        </button>
      )}
    </>
  );
});

ConnectWallet.displayName = 'ConnectWallet';

export default ConnectWallet; // Lets you use <ConnectWallet /> in Header.js
