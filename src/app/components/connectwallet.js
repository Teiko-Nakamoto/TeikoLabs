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
  const { onConnect } = props; // Get the onConnect callback from props

  // Connect to wallet when button is clicked
  const handleConnect = async () => {
    try {
      await connect(); // This opens the wallet popup so the user can approve the connection
      const data = getLocalStorage(); // This grabs the address info from local storage
      const stxAddr = data?.addresses?.stx?.[0]?.address; // This gets the STX (Stacks) wallet address

      if (stxAddr) {
        setUserAddress(stxAddr); // Save it in React state so we can show it on the screen
        localStorage.setItem('connectedAddress', stxAddr); // Save it in the browser for future use
        localStorage.setItem('walletProvider', 'stacks-connect'); // Also save which wallet was used
        console.log('✅ Connected:', stxAddr); // Print success to the browser console
        
        // Call the onConnect callback if provided
        if (onConnect) {
          onConnect(stxAddr);
        }
      }
    } catch (error) {
      console.error('❌ Wallet connection failed:', error); // If something breaks, log it
    }
  };
  ConnectWallet.displayName = 'ConnectWallet';


  // 🚫 Disconnect from wallet
  const handleDisconnect = () => {
    disconnect(); // Logs out of the wallet session
    localStorage.removeItem('connectedAddress'); // Clears saved address from the browser
    localStorage.removeItem('walletProvider'); // Clears saved wallet type
    setUserAddress(null); // Clears wallet state from the screen
    console.log('🔌 Disconnected');
  };

  // 🔁 Check if user was already connected (runs once when page loads)
  useEffect(() => {
    const init = async () => {
      if (await isConnected()) { // Checks if user was already logged in
        const data = getLocalStorage(); // Gets stored data from browser
        const stxAddr = data?.addresses?.stx?.[0]?.address;
        if (stxAddr) {
          setUserAddress(stxAddr); // If yes, restore their wallet address
          // Call the onConnect callback if provided
          if (onConnect) {
            onConnect(stxAddr);
          }
        }
      }
    };
    init(); // Run the code
  }, []);

  // 📦 Lets Header.js trigger `connect()` from outside using a ref
  useImperativeHandle(ref, () => ({
    openConnectModal: handleConnect, // When Header says "openConnectModal", we call handleConnect()
  }));

  // 🎨 This is what shows up on the screen — the button
  return (
    <>
      {userAddress ? (
        // If someone is connected, show "Disconnect" with the first 6 characters of their wallet address
        <button onClick={handleDisconnect} className="connect-button hover-underline">
          {t('disconnect')} ({userAddress.slice(0, 6)}…)
        </button>
      ) : (
        // If no one is connected, show a "Connect Wallet" button
        <button onClick={handleConnect} className="connect-button hover-underline">
          {t('connect_wallet')}
        </button>
      )}
    </>
  );
});

export default ConnectWallet; // Lets you use <ConnectWallet /> in Header.js
