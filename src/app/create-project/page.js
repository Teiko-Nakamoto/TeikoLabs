'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { request } from '@stacks/connect';

export default function CreateTokenPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
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

  // Handle mainnet selection - now enabled
  const handleMainnetSelection = () => {
    setSelectedNetwork('mainnet');
  };

  // Check for pending tokens (tokens without DEX contracts)
  const checkPendingTokens = async () => {
    if (!connectedAddress) return;
    
    try {
      const response = await fetch(`/api/user-tokens/list?creatorWalletAddress=${connectedAddress}`);
      if (response.ok) {
        const data = await response.json();
        const pending = data.tokens.filter(token => 
          token.deployment_status === 'deployed' && 
          (!token.dex_contract_address || token.dex_contract_address === '')
        );
        setPendingTokens(pending);
        setHasPendingToken(pending.length > 0);
      }
    } catch (error) {
      console.error('Error checking pending tokens:', error);
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
      
      const explorerUrl = selectedNetwork === 'mainnet' 
        ? `https://explorer.stacks.co/txid/${response.txId}`
        : `https://explorer.stacks.co/txid/${response.txId}?chain=testnet`;
      
      // Save to database
      const tokenData = {
        name: tokenName.trim(),
        symbol: tokenSymbol.trim(),
        network: selectedNetwork,
        contractAddress,
        deployedBy: connectedAddress,
        deployedAt: new Date().toISOString(),
        txId: response.txId,
        explorerUrl
      };
      
      await saveTokenToDatabase(tokenData);
      
      // Set success state with transaction details
      setTransactionDetails({
        txId: response.txId,
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
    (asserts! (not (var-get minted)) ERR_ALREADY_MINTED)
    (var-set minted true)
    (ft-mint? ${tokenContractName} MAX_SUPPLY DEX_CONTRACT)
  )
)

;; ---- Token Locking Functions ----
(define-public (lock-tokens (amount uint))
  (begin
    (asserts! (>= amount u1) ERR_INVALID_AMOUNT)
    (asserts! (>= (ft-get-balance ${tokenContractName} tx-sender) amount) ERR_INVALID_AMOUNT)
    (let ((current-locked (default-to u0 (get amount (map-get? locked-balances { user: tx-sender })))))
      (map-set locked-balances { user: tx-sender } { amount: (+ current-locked amount) })
      (var-set total-locked (+ (var-get total-locked) amount))
      (ok true)
    )
  )
)

(define-public (unlock-tokens (amount uint))
  (begin
    (asserts! (>= amount u1) ERR_INVALID_AMOUNT)
    (let ((current-locked (default-to u0 (get amount (map-get? locked-balances { user: tx-sender })))))
      (asserts! (>= current-locked amount) ERR_NOTHING_TO_UNLOCK)
      (map-set locked-balances { user: tx-sender } { amount: (- current-locked amount) })
      (var-set total-locked (- (var-get total-locked) amount))
      (ok true)
    )
  )
)

;; ---- Majority Holder Functions ----
(define-public (claim-majority-holder)
  (begin
    (let ((balance (ft-get-balance ${tokenContractName} tx-sender)))
      (let ((total-supply (ft-get-supply ${tokenContractName})))
        (if (>= balance (/ (* total-supply u51) u100))
          (begin
            (var-set majority-holder (some tx-sender))
            (ok true)
          )
          (err ERR_NOT_MAJORITY)
        )
      )
    )
  )
)

(define-read-only (get-majority-holder)
  (ok (var-get majority-holder))
)

(define-read-only (get-locked-balance (who principal))
  (ok (default-to u0 (get amount (map-get? locked-balances { user: who }))))
)

(define-read-only (get-total-locked)
  (ok (var-get total-locked))
)`;
  };

  const saveTokenToDatabase = async (tokenData) => {
    try {
      const response = await fetch('/api/user-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tokenData),
      });

      if (!response.ok) {
        throw new Error('Failed to save token to database');
      }

      const result = await response.json();
      console.log('Token saved to database:', result);
    } catch (error) {
      console.error('Error saving token to database:', error);
      throw error;
    }
  };

  const showContractCode = (name, symbol) => {
    const contract = generateTokenContract(name, symbol);
    setShowContractModal(true);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setTokenName('');
    setTokenSymbol('');
    setSelectedNetwork('testnet');
    setDeploymentStatus('');
    setDeploymentSuccess(false);
    setTransactionDetails(null);
    setShowContractModal(false);
  };

  return (
    <div className="create-token-page">
      <div className="container">
        <div className="header">
          <h1>🚀 Create Your Token</h1>
          <p>Deploy your own token on the Stacks blockchain</p>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`step ${i + 1 <= currentStep ? 'active' : ''} ${i + 1 < currentStep ? 'completed' : ''}`}
            >
              <div className="step-number">{i + 1}</div>
              <div className="step-label">
                {i === 0 && 'Project Details'}
                {i === 1 && 'Network Selection'}
                {i === 2 && 'Review & Deploy'}
                {i === 3 && 'Success'}
              </div>
            </div>
          ))}
        </div>

        {/* Step 1: Project Details */}
        {currentStep === 1 && (
          <div className="step-content">
            <h2>📝 Project Details</h2>
            <div className="form-group">
              <label htmlFor="tokenName">Token Name</label>
              <input
                type="text"
                id="tokenName"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="e.g., My Awesome Token"
                maxLength={50}
              />
            </div>
            <div className="form-group">
              <label htmlFor="tokenSymbol">Token Symbol</label>
              <input
                type="text"
                id="tokenSymbol"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., MAT"
                maxLength={10}
              />
            </div>
            <div className="button-group">
              <button
                onClick={nextStep}
                disabled={!tokenName.trim() || !tokenSymbol.trim()}
                className="btn-primary"
              >
                Next Step →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Network Selection */}
        {currentStep === 2 && (
          <div className="step-content">
            <h2>🌐 Network Selection</h2>
            <div className="network-options">
              <div 
                className={`network-option ${selectedNetwork === 'testnet' ? 'selected' : ''}`}
                onClick={() => setSelectedNetwork('testnet')}
              >
                <div className="network-icon">🧪</div>
                <div className="network-info">
                  <h3>Testnet</h3>
                  <p>Free testing environment</p>
                  <ul>
                    <li>No real costs</li>
                    <li>Perfect for testing</li>
                    <li>Fast deployment</li>
                  </ul>
                </div>
              </div>
              <div 
                className={`network-option ${selectedNetwork === 'mainnet' ? 'selected' : ''}`}
                onClick={handleMainnetSelection}
              >
                <div className="network-icon">🚀</div>
                <div className="network-info">
                  <h3>Mainnet</h3>
                  <p>Live blockchain deployment</p>
                  <ul>
                    <li>Real STX costs</li>
                    <li>Permanent deployment</li>
                    <li>Production ready</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="button-group">
              <button onClick={prevStep} className="btn-secondary">
                ← Previous
              </button>
              <button onClick={nextStep} className="btn-primary">
                Next Step →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Deploy */}
        {currentStep === 3 && (
          <div className="step-content">
            <h2>🔍 Review & Deploy</h2>
            <div className="review-card">
              <h3>Token Details</h3>
              <div className="review-item">
                <span className="label">Name:</span>
                <span className="value">{tokenName}</span>
              </div>
              <div className="review-item">
                <span className="label">Symbol:</span>
                <span className="value">{tokenSymbol}</span>
              </div>
              <div className="review-item">
                <span className="label">Network:</span>
                <span className="value">{selectedNetwork}</span>
              </div>
              <div className="review-item">
                <span className="label">Contract Address:</span>
                <span className="value">{connectedAddress}.{tokenSymbol.toLowerCase()}</span>
              </div>
            </div>

            <div className="deployment-section">
              <h3>Smart Contract Preview</h3>
              <button 
                onClick={() => showContractCode(tokenName, tokenSymbol)}
                className="btn-secondary"
              >
                📄 View Contract Code
              </button>
            </div>

            {deploymentStatus && (
              <div className={`deployment-status ${deploymentStatus.includes('✅') ? 'success' : deploymentStatus.includes('❌') ? 'error' : 'info'}`}>
                {deploymentStatus}
              </div>
            )}

            <div className="button-group">
              <button onClick={prevStep} className="btn-secondary">
                ← Previous
              </button>
              <button
                onClick={handleTokenLaunch}
                disabled={isDeploying || !connectedAddress}
                className="btn-primary"
              >
                {isDeploying ? '🚀 Deploying...' : '🚀 Deploy Token'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {currentStep === 4 && deploymentSuccess && transactionDetails && (
          <div className="step-content">
            <div className="success-content">
              <div className="success-icon">🎉</div>
              <h2>Token Deployed Successfully!</h2>
              <p>Your token has been deployed to the {transactionDetails.network} blockchain.</p>
              
              <div className="transaction-details">
                <h3>Transaction Details</h3>
                <div className="detail-item">
                  <span className="label">Transaction ID:</span>
                  <a href={transactionDetails.explorerUrl} target="_blank" rel="noopener noreferrer">
                    {transactionDetails.txId}
                  </a>
                </div>
                <div className="detail-item">
                  <span className="label">Contract Address:</span>
                  <span className="value">{transactionDetails.contractAddress}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Token Name:</span>
                  <span className="value">{transactionDetails.tokenName}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Token Symbol:</span>
                  <span className="value">{transactionDetails.tokenSymbol}</span>
                </div>
              </div>

              <div className="button-group">
                <button onClick={resetForm} className="btn-secondary">
                  Create Another Token
                </button>
                <Link href="/" className="btn-primary">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Contract Code Modal */}
        {showContractModal && (
          <div className="modal-overlay" onClick={() => setShowContractModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Smart Contract Code</h3>
                <button 
                  className="close-button"
                  onClick={() => setShowContractModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <pre className="contract-code">
                  <code>{generateTokenContract(tokenName, tokenSymbol)}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Pending Token Modal */}
        {showPendingTokenModal && (
          <div className="modal-overlay" onClick={() => setShowPendingTokenModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Pending Token Found</h3>
                <button 
                  className="close-button"
                  onClick={() => setShowPendingTokenModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>You have a deployed token that needs DEX setup. Please complete the DEX setup before creating a new token.</p>
                <div className="pending-tokens">
                  {pendingTokens.map((token, index) => (
                    <div key={index} className="pending-token">
                      <strong>{token.name} ({token.symbol})</strong>
                      <p>Contract: {token.contract_address}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  onClick={() => setShowPendingTokenModal(false)}
                  className="btn-primary"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .create-token-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem 0;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .header {
          text-align: center;
          margin-bottom: 3rem;
          color: white;
        }

        .header h1 {
          font-size: 3rem;
          margin-bottom: 0.5rem;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .header p {
          font-size: 1.2rem;
          opacity: 0.9;
        }

        .progress-bar {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3rem;
          position: relative;
        }

        .progress-bar::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 0;
          right: 0;
          height: 2px;
          background: rgba(255,255,255,0.3);
          z-index: 1;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-bottom: 0.5rem;
          transition: all 0.3s ease;
        }

        .step.active .step-number {
          background: #4CAF50;
          box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
        }

        .step.completed .step-number {
          background: #2196F3;
        }

        .step-label {
          color: white;
          font-size: 0.9rem;
          text-align: center;
          opacity: 0.8;
        }

        .step.active .step-label {
          opacity: 1;
          font-weight: bold;
        }

        .step-content {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          margin-bottom: 2rem;
        }

        .step-content h2 {
          color: #333;
          margin-bottom: 1.5rem;
          font-size: 1.8rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #555;
          font-weight: 600;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #667eea;
        }

        .network-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .network-option {
          border: 2px solid #e1e5e9;
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .network-option:hover {
          border-color: #667eea;
          transform: translateY(-2px);
        }

        .network-option.selected {
          border-color: #4CAF50;
          background: #f8fff8;
        }

        .network-icon {
          font-size: 2rem;
        }

        .network-info h3 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }

        .network-info p {
          margin: 0 0 1rem 0;
          color: #666;
        }

        .network-info ul {
          margin: 0;
          padding-left: 1.2rem;
          color: #666;
        }

        .network-info li {
          margin-bottom: 0.25rem;
        }

        .review-card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .review-card h3 {
          margin: 0 0 1rem 0;
          color: #333;
        }

        .review-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e1e5e9;
        }

        .review-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .review-item .label {
          font-weight: 600;
          color: #555;
        }

        .review-item .value {
          color: #333;
          font-family: monospace;
        }

        .deployment-section {
          margin-bottom: 2rem;
        }

        .deployment-section h3 {
          margin-bottom: 1rem;
          color: #333;
        }

        .deployment-status {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .deployment-status.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .deployment-status.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .deployment-status.info {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }

        .button-group {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .btn-primary, .btn-secondary {
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #5a6268;
          transform: translateY(-2px);
        }

        .success-content {
          text-align: center;
        }

        .success-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .success-content h2 {
          color: #4CAF50;
          margin-bottom: 1rem;
        }

        .transaction-details {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 1.5rem;
          margin: 2rem 0;
          text-align: left;
        }

        .transaction-details h3 {
          margin: 0 0 1rem 0;
          color: #333;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e1e5e9;
        }

        .detail-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .detail-item .label {
          font-weight: 600;
          color: #555;
        }

        .detail-item .value {
          color: #333;
          font-family: monospace;
        }

        .detail-item a {
          color: #667eea;
          text-decoration: none;
          font-family: monospace;
        }

        .detail-item a:hover {
          text-decoration: underline;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e1e5e9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          color: #333;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          color: #333;
        }

        .modal-body {
          padding: 1.5rem;
          overflow: auto;
          flex: 1;
        }

        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #e1e5e9;
          display: flex;
          justify-content: center;
        }

        .contract-code {
          background: #f8f9fa;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: 1rem;
          overflow: auto;
          max-height: 400px;
          font-size: 0.8rem;
          line-height: 1.4;
        }

        .contract-code code {
          color: #333;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .pending-tokens {
          margin-top: 1rem;
        }

        .pending-token {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 0.5rem;
        }

        .pending-token strong {
          color: #856404;
        }

        .pending-token p {
          margin: 0.5rem 0 0 0;
          color: #856404;
          font-family: monospace;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .container {
            padding: 0 0.5rem;
          }

          .header h1 {
            font-size: 2rem;
          }

          .network-options {
            grid-template-columns: 1fr;
          }

          .button-group {
            flex-direction: column;
          }

          .modal-content {
            max-width: 95vw;
            max-height: 95vh;
          }

          .contract-code {
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
}