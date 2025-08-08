'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { request } from '@stacks/connect';
import { verifyMessageSignatureRsv } from '@stacks/encryption';
import Header from '../components/header';
import ConnectWallet from '../components/connectwallet';
import './admin-login.css';

export default function AdminLoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [connectedAddress, setConnectedAddress] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [walletRef, setWalletRef] = useState(null);
  
  // Admin wallet addresses (comma-separated)
  const ADMIN_ADDRESSES = process.env.NEXT_PUBLIC_ADMIN_ADDRESSES?.split(',') || ['ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4'];
  
  useEffect(() => {
    // Check if already authenticated
    const savedAddress = localStorage.getItem('connectedAddress');
    if (savedAddress && ADMIN_ADDRESSES.includes(savedAddress)) {
      setConnectedAddress(savedAddress);
      setIsAuthenticated(true);
    }
  }, []);

  const handleWalletConnect = (address) => {
    setConnectedAddress(address);
    if (ADMIN_ADDRESSES.includes(address)) {
      setIsAuthenticated(true);
      setErrorMessage('');
    } else {
      setErrorMessage('Access denied. Only admin wallet can access this page.');
    }
  };

  const handleSignMessage = async () => {
    if (!connectedAddress || !ADMIN_ADDRESSES.includes(connectedAddress)) {
      setErrorMessage('Please connect with the admin wallet first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // Generate a unique challenge for authentication
      const nonce = Math.random().toString(36).substring(7);
      const timestamp = Date.now();
      const message = `Admin Authentication Challenge\n\nNonce: ${nonce}\nTimestamp: ${timestamp}\nWallet: ${connectedAddress}\n\nSign this message to authenticate as admin.`;
      
      // Request signature from wallet
      const response = await request('stx_signMessage', {
        message,
      });
      
      if (response.signature && response.publicKey) {
        // Verify the signature
        const isValid = verifyMessageSignatureRsv({
          message,
          signature: response.signature,
          publicKey: response.publicKey
        });
        
        if (isValid) {
          // Store authentication in localStorage
          localStorage.setItem('adminAuthenticated', 'true');
          localStorage.setItem('adminSignature', response.signature);
          localStorage.setItem('adminPublicKey', response.publicKey);
          localStorage.setItem('adminAuthTime', new Date().toISOString());
          localStorage.setItem('adminChallenge', message);
          
          console.log('✅ Admin authentication successful');
          console.log('Signature:', response.signature);
          console.log('Public Key:', response.publicKey);
          
          // Redirect to admin dashboard
          router.push('/admin/dashboard');
        } else {
          setErrorMessage('Signature verification failed. Please try again.');
        }
      } else {
        setErrorMessage('No signature received from wallet.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      if (error.message?.includes('User rejected')) {
        setErrorMessage('Authentication cancelled by user.');
      } else {
        setErrorMessage('Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openConnectModal = () => {
    if (walletRef && walletRef.current) {
      walletRef.current.openConnectModal();
    }
  };

  return (
    <>
      <Header />
      <main className="admin-login-page">
        <div className="admin-login-container">
          <div className="admin-login-card">
            <div className="admin-login-header">
              <h1>🛠️ Admin Access</h1>
              <p>Authenticate with admin wallet to access the dashboard</p>
            </div>

            {!connectedAddress ? (
              <div className="connect-section">
                <div className="wallet-status">
                  <span className="status-indicator disconnected"></span>
                  <span>No wallet connected</span>
                </div>
                <button 
                  onClick={openConnectModal}
                  className="connect-button"
                >
                  Connect Wallet
                </button>
                <ConnectWallet 
                  ref={setWalletRef}
                  onConnect={handleWalletConnect}
                />
              </div>
                         ) : ADMIN_ADDRESSES.includes(connectedAddress) ? (
              <div className="authenticate-section">
                <div className="wallet-status">
                  <span className="status-indicator connected"></span>
                  <span>Admin wallet connected</span>
                </div>
                <div className="wallet-address">
                  <span>Address: {connectedAddress.slice(0, 20)}...</span>
                </div>
                <button 
                  onClick={handleSignMessage}
                  disabled={isLoading}
                  className="sign-button"
                >
                  {isLoading ? 'Signing...' : 'Sign to Authenticate'}
                </button>
              </div>
            ) : (
              <div className="access-denied">
                <div className="wallet-status">
                  <span className="status-indicator error"></span>
                  <span>Access Denied</span>
                </div>
                <div className="wallet-address">
                  <span>Connected: {connectedAddress.slice(0, 20)}...</span>
                </div>
                <p className="error-message">
                  Only the admin wallet can access this page.
                </p>
                <button 
                  onClick={() => setConnectedAddress('')}
                  className="disconnect-button"
                >
                  Disconnect
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="error-message">
                {errorMessage}
              </div>
            )}

            
          </div>
        </div>
      </main>
    </>
  );
} 