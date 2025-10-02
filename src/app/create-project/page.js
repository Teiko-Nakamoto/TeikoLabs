'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { request } from '@stacks/connect';

export default function CreateTokenPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [connectedAddress, setConnectedAddress] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [contractName, setContractName] = useState('');
  const [contractCode, setContractCode] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('testnet');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState('');
  const [deploymentSuccess, setDeploymentSuccess] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  
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

  // Handle mainnet selection - now enabled
  const handleMainnetSelection = () => {
    setSelectedNetwork('mainnet');
  };

  const handleContractDeploy = async () => {
    if (!contractName.trim() || !contractCode.trim() || isDeploying) {
      return;
    }
    
    // Check if wallet is connected before proceeding
    if (!connectedAddress) {
      setDeploymentStatus('❌ Please connect your wallet to deploy your contract');
      return;
    }
    
    setIsDeploying(true);
    setDeploymentStatus('Preparing deployment...');

    try {
      setDeploymentStatus('Deploying to Stacks blockchain...');
      
      const response = await request('stx_deployContract', {
        name: contractName.trim(),
        clarityCode: contractCode.trim(),
        clarityVersion: 3,
      });
      
      console.log('Deployment response:', response);
      
      // Generate contract address
      const contractAddress = `${connectedAddress}.${contractName.trim()}`;
      
      const explorerUrl = selectedNetwork === 'mainnet' 
        ? `https://explorer.stacks.co/txid/${response.txId}`
        : `https://explorer.stacks.co/txid/${response.txId}?chain=testnet`;
      
      // Set success state with transaction details
      setTransactionDetails({
        txId: response.txId,
        contractAddress,
        explorerUrl,
        network: selectedNetwork,
        contractName: contractName.trim()
      });
      setDeploymentSuccess(true);
      setDeploymentStatus('✅ Deployment successful! Your contract has been deployed to the blockchain.');
      
    } catch (error) {
      console.error('Deployment error:', error);
      setDeploymentStatus(`❌ Error: ${error.message || 'Deployment failed'}`);
    } finally {
      setIsDeploying(false);
    }
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
    setContractName('');
    setContractCode('');
    setSelectedNetwork('testnet');
    setDeploymentStatus('');
    setDeploymentSuccess(false);
    setTransactionDetails(null);
  };

  const loadSampleContract = () => {
    setContractCode(`;; Simple Counter Contract
(define-data-var counter uint u0)

(define-read-only (get-counter)
  (ok (var-get counter))
)

(define-public (increment)
  (begin
    (var-set counter (+ (var-get counter) u1))
    (ok (var-get counter))
  )
)

(define-public (decrement)
  (begin
    (var-set counter (- (var-get counter) u1))
    (ok (var-get counter))
  )
)`);
  };

        return (
    <div className="create-contract-page">
            <div className="container">
        <div className="header">
          <h1>🚀 Deploy Smart Contract</h1>
          <p>Deploy your custom Clarity smart contract to the Stacks blockchain</p>
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
                {i === 0 && 'Contract Details'}
                {i === 1 && 'Network & Deploy'}
                {i === 2 && 'Success'}
              </div>
            </div>
          ))}
        </div>

        {/* Step 1: Contract Details */}
        {currentStep === 1 && (
          <div className="step-content">
            <h2>📝 Contract Details</h2>
            <div className="form-group">
              <label htmlFor="contractName">Contract Name</label>
              <input
                type="text"
                id="contractName"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                placeholder="e.g., my-contract"
                maxLength={50}
              />
              <small>Contract name must be lowercase, no spaces, and valid Clarity identifier</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="contractCode">Clarity Smart Contract Code</label>
              <div className="code-editor-container">
                <div className="code-editor-header">
                  <span>Clarity Code</span>
                <button 
                    type="button"
                    onClick={loadSampleContract}
                    className="sample-button"
                  >
                    Load Sample
                </button>
                </div>
                <textarea
                  id="contractCode"
                  value={contractCode}
                  onChange={(e) => setContractCode(e.target.value)}
                  placeholder="Enter your Clarity smart contract code here..."
                  className="code-editor"
                  rows={20}
                />
              </div>
              <small>Enter your complete Clarity smart contract code</small>
              </div>
              
            <div className="button-group">
              <button
                onClick={nextStep}
                disabled={!contractName.trim() || !contractCode.trim()}
                className="btn-primary"
              >
                Next Step →
              </button>
                    </div>
                  </div>
        )}

        {/* Step 2: Network Selection & Deploy */}
        {currentStep === 2 && (
          <div className="step-content">
            <h2>🌐 Network Selection & Deploy</h2>
            
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

            <div className="review-card">
              <h3>Deployment Summary</h3>
              <div className="review-item">
                <span className="label">Contract Name:</span>
                <span className="value">{contractName}</span>
              </div>
              <div className="review-item">
                <span className="label">Network:</span>
                <span className="value">{selectedNetwork}</span>
      </div>
              <div className="review-item">
                <span className="label">Contract Address:</span>
                <span className="value">{connectedAddress}.{contractName}</span>
              </div>
              <div className="review-item">
                <span className="label">Code Length:</span>
                <span className="value">{contractCode.length} characters</span>
                </div>
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
                onClick={handleContractDeploy}
                disabled={isDeploying || !connectedAddress}
                className="btn-primary"
              >
                {isDeploying ? '🚀 Deploying...' : '🚀 Deploy Contract'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {currentStep === 3 && deploymentSuccess && transactionDetails && (
          <div className="step-content">
            <div className="success-content">
              <div className="success-icon">🎉</div>
              <h2>Contract Deployed Successfully!</h2>
              <p>Your smart contract has been deployed to the {transactionDetails.network} blockchain.</p>
              
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
                  <span className="label">Contract Name:</span>
                  <span className="value">{transactionDetails.contractName}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Network:</span>
                  <span className="value">{transactionDetails.network}</span>
                </div>
              </div>
              
              <div className="button-group">
                <button onClick={resetForm} className="btn-secondary">
                  Deploy Another Contract
                </button>
                <Link href="/" className="btn-primary">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        )}
        </div>

             <style jsx>{`
        .create-contract-page {
           min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem 0;
         }

        .container {
          max-width: 1000px;
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

        .form-group small {
          display: block;
          margin-top: 0.25rem;
          color: #666;
          font-size: 0.85rem;
        }

        .code-editor-container {
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          overflow: hidden;
          transition: border-color 0.3s ease;
        }

        .code-editor-container:focus-within {
          border-color: #667eea;
        }

        .code-editor-header {
          background: #f8f9fa;
          padding: 0.5rem 1rem;
          border-bottom: 1px solid #e1e5e9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          color: #555;
        }

        .sample-button {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .sample-button:hover {
          background: #5a6fd8;
        }

        .code-editor {
          width: 100%;
          padding: 1rem;
          border: none;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.9rem;
          line-height: 1.5;
          resize: vertical;
          min-height: 400px;
          background: #f8f9fa;
        }

        .code-editor:focus {
          outline: none;
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

          .code-editor {
            min-height: 300px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}