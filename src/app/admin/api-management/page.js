'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Header from '../../components/header';
import './api-management.css';

export default function ApiManagementPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [rateLimits, setRateLimits] = useState([]);
  const [corsWhitelist, setCorsWhitelist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newCorsUrl, setNewCorsUrl] = useState('');
  const [addingCors, setAddingCors] = useState(false);

  // Admin wallet addresses (comma-separated)
  const ADMIN_ADDRESSES = process.env.NEXT_PUBLIC_ADMIN_ADDRESSES?.split(',') || ['ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4'];

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const isAuthenticated = localStorage.getItem('adminAuthenticated');
      const signature = localStorage.getItem('adminSignature');
      const connectedAddress = localStorage.getItem('connectedAddress');
      
      if (!isAuthenticated || !signature || !ADMIN_ADDRESSES.includes(connectedAddress)) {
        // Not authenticated or wrong wallet, redirect to login
        router.push('/admin');
        return;
      }
      
      // Check if authentication is still valid (24 hours)
      const authTime = localStorage.getItem('adminAuthTime');
      const authTimestamp = new Date(authTime).getTime();
      const now = Date.now();
      const authAge = now - authTimestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (authAge > maxAge) {
        // Authentication expired, clear and redirect
        localStorage.removeItem('adminAuthenticated');
        localStorage.removeItem('adminSignature');
        localStorage.removeItem('adminPublicKey');
        localStorage.removeItem('adminAuthTime');
        localStorage.removeItem('adminChallenge');
        router.push('/admin');
        return;
      }
      
      setLoading(false);
      loadRateLimits();
      loadCorsWhitelist();
    };
    
    checkAuth();
  }, [router]);

  const loadRateLimits = async () => {
    try {
      // Get admin authentication data from localStorage
      const adminSignature = localStorage.getItem('adminSignature');
      const adminPublicKey = localStorage.getItem('adminPublicKey');
      const adminChallenge = localStorage.getItem('adminChallenge');
      const adminAuthTime = localStorage.getItem('adminAuthTime');
      const connectedAddress = localStorage.getItem('connectedAddress');
      
      if (!adminSignature || !adminPublicKey || !adminChallenge || !connectedAddress) {
        throw new Error('Admin authentication required. Please log in again.');
      }
      
      const response = await fetch('/api/get-rate-limits', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.stringify({
            signature: adminSignature,
            publicKey: adminPublicKey,
            message: adminChallenge,
            timestamp: adminAuthTime,
            walletAddress: connectedAddress
          })}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load rate limits');
      }

      const result = await response.json();
      setRateLimits(result.rateLimits || []);
    } catch (error) {
      console.error('Error loading rate limits:', error);
      setMessage('Error loading rate limits: ' + error.message);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      // Get admin authentication data from localStorage
      const adminSignature = localStorage.getItem('adminSignature');
      const adminPublicKey = localStorage.getItem('adminPublicKey');
      const adminChallenge = localStorage.getItem('adminChallenge');
      const adminAuthTime = localStorage.getItem('adminAuthTime');
      const connectedAddress = localStorage.getItem('connectedAddress');
      
      if (!adminSignature || !adminPublicKey || !adminChallenge || !connectedAddress) {
        throw new Error('Admin authentication required. Please log in again.');
      }
      
      const response = await fetch('/api/save-rate-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.stringify({
            signature: adminSignature,
            publicKey: adminPublicKey,
            message: adminChallenge,
            timestamp: adminAuthTime,
            walletAddress: connectedAddress
          })}`
        },
        body: JSON.stringify({ rateLimits })
      });

      if (!response.ok) {
        throw new Error('Failed to save rate limits');
      }

      const result = await response.json();
      setMessage('✅ Rate limits saved successfully!');
    } catch (error) {
      console.error('Error saving rate limits:', error);
      setMessage('❌ Error saving rate limits: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateRateLimit = (id, field, value) => {
    setRateLimits(prev => prev.map(limit => 
      limit.id === id ? { ...limit, [field]: value } : limit
    ));
  };

  const loadCorsWhitelist = async () => {
    try {
      // Get admin authentication data from localStorage
      const adminSignature = localStorage.getItem('adminSignature');
      const adminPublicKey = localStorage.getItem('adminPublicKey');
      const adminChallenge = localStorage.getItem('adminChallenge');
      const adminAuthTime = localStorage.getItem('adminAuthTime');
      const connectedAddress = localStorage.getItem('connectedAddress');
      
      if (!adminSignature || !adminPublicKey || !adminChallenge || !connectedAddress) {
        throw new Error('Admin authentication required. Please log in again.');
      }
      
      const response = await fetch('/api/get-cors-whitelist', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.stringify({
            signature: adminSignature,
            publicKey: adminPublicKey,
            message: adminChallenge,
            timestamp: adminAuthTime,
            walletAddress: connectedAddress
          })}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load CORS whitelist');
      }

      const result = await response.json();
      setCorsWhitelist(result.corsWhitelist || []);
    } catch (error) {
      console.error('Error loading CORS whitelist:', error);
      setMessage('Error loading CORS whitelist: ' + error.message);
    }
  };

  const handleAddCorsUrl = async () => {
    if (!newCorsUrl.trim()) {
      setMessage('❌ Please enter a URL');
      return;
    }
    
    // Auto-add protocol if missing
    let urlToAdd = newCorsUrl.trim();
    if (!urlToAdd.startsWith('http://') && !urlToAdd.startsWith('https://')) {
      urlToAdd = 'https://' + urlToAdd;
    }

    setAddingCors(true);
    setMessage('');

    try {
      // Get admin authentication data from localStorage
      const adminSignature = localStorage.getItem('adminSignature');
      const adminPublicKey = localStorage.getItem('adminPublicKey');
      const adminChallenge = localStorage.getItem('adminChallenge');
      const adminAuthTime = localStorage.getItem('adminAuthTime');
      const connectedAddress = localStorage.getItem('connectedAddress');
      
      if (!adminSignature || !adminPublicKey || !adminChallenge || !connectedAddress) {
        throw new Error('Admin authentication required. Please log in again.');
      }

      // Generate a unique challenge for adding CORS URL
      const nonce = Math.random().toString(36).substring(7);
      const timestamp = Date.now();
             const message = `Add CORS URL Challenge\n\nURL: ${urlToAdd}\nNonce: ${nonce}\nTimestamp: ${timestamp}\nWallet: ${connectedAddress}\n\nSign this message to add this URL to the CORS whitelist.`;
      
      // Request signature from wallet
      const { request } = await import('@stacks/connect');
      const response = await request('stx_signMessage', {
        message,
      });
      
      if (!response.signature || !response.publicKey) {
        throw new Error('No signature received from wallet');
      }

      // Verify the signature
      const { verifyMessageSignatureRsv } = await import('@stacks/encryption');
      const isValid = verifyMessageSignatureRsv({
        message,
        signature: response.signature,
        publicKey: response.publicKey
      });
      
      if (!isValid) {
        throw new Error('Signature verification failed');
      }
      
             const requestBody = { 
         url: urlToAdd,
         signature: response.signature,
         message: message
       };
       
       console.log('Sending CORS request:', {
         url: urlToAdd,
         hasSignature: !!response.signature,
         messageLength: message.length
       });
       
       const apiResponse = await fetch('/api/add-cors-url', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${JSON.stringify({
             signature: adminSignature,
             publicKey: adminPublicKey,
             message: adminChallenge,
             timestamp: adminAuthTime,
             walletAddress: connectedAddress
           })}`
         },
         body: JSON.stringify(requestBody)
       });

             if (!apiResponse.ok) {
         const errorText = await apiResponse.text();
         console.error('API Response Error:', {
           status: apiResponse.status,
           statusText: apiResponse.statusText,
           body: errorText
         });
         throw new Error(`Failed to add CORS URL: ${apiResponse.status} ${apiResponse.statusText}`);
       }

      setMessage(`✅ CORS URL added successfully: ${urlToAdd}`);
      setNewCorsUrl('');
      loadCorsWhitelist(); // Reload the list
    } catch (error) {
      console.error('Error adding CORS URL:', error);
      setMessage('❌ Error adding CORS URL: ' + error.message);
    } finally {
      setAddingCors(false);
    }
  };

  const handleRemoveCorsUrl = async (id) => {
    if (!confirm('Are you sure you want to remove this URL from the CORS whitelist?')) {
      return;
    }

    try {
      // Get admin authentication data from localStorage
      const adminSignature = localStorage.getItem('adminSignature');
      const adminPublicKey = localStorage.getItem('adminPublicKey');
      const adminChallenge = localStorage.getItem('adminChallenge');
      const adminAuthTime = localStorage.getItem('adminAuthTime');
      const connectedAddress = localStorage.getItem('connectedAddress');
      
      if (!adminSignature || !adminPublicKey || !adminChallenge || !connectedAddress) {
        throw new Error('Admin authentication required. Please log in again.');
      }

      // Generate a unique challenge for removing CORS URL
      const nonce = Math.random().toString(36).substring(7);
      const timestamp = Date.now();
      const message = `Remove CORS URL Challenge\n\nID: ${id}\nNonce: ${nonce}\nTimestamp: ${timestamp}\nWallet: ${connectedAddress}\n\nSign this message to remove this URL from the CORS whitelist.`;
      
      // Request signature from wallet
      const { request } = await import('@stacks/connect');
      const response = await request('stx_signMessage', {
        message,
      });
      
      if (!response.signature || !response.publicKey) {
        throw new Error('No signature received from wallet');
      }

      // Verify the signature
      const { verifyMessageSignatureRsv } = await import('@stacks/encryption');
      const isValid = verifyMessageSignatureRsv({
        message,
        signature: response.signature,
        publicKey: response.publicKey
      });
      
      if (!isValid) {
        throw new Error('Signature verification failed');
      }
      
      const apiResponse = await fetch('/api/remove-cors-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.stringify({
            signature: adminSignature,
            publicKey: adminPublicKey,
            message: adminChallenge,
            timestamp: adminAuthTime,
            walletAddress: connectedAddress
          })}`
        },
        body: JSON.stringify({ 
          id: id,
          signature: response.signature,
          message: message
        })
      });

      if (!apiResponse.ok) {
        throw new Error('Failed to remove CORS URL');
      }

      setMessage('✅ CORS URL removed successfully!');
      loadCorsWhitelist(); // Reload the list
    } catch (error) {
      console.error('Error removing CORS URL:', error);
      setMessage('❌ Error removing CORS URL: ' + error.message);
    }
  };

  const getEndpointDescription = (endpointGroup) => {
    switch (endpointGroup) {
      case 'public':
        return 'General public endpoints (price, balance, etc.)';
      case 'admin':
        return 'Admin-only endpoints (token cards, settings)';
      case 'blockchain':
        return 'Blockchain API calls (Hiro API quota)';
      default:
        return endpointGroup;
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="api-management-page">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading API management...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="api-management-page">
        <div className="api-management-container">
          <div className="api-management-card">
            <div className="api-management-header">
              <h1>🔌 API Management</h1>
              <p>Configure rate limits for different API endpoint groups</p>
            </div>

            <div className="rate-limits-section">
              <h2>Rate Limiting Configuration</h2>
              <p className="section-description">
                Control how many requests per minute each endpoint group can handle. 
                This helps prevent abuse and protects your API quota.
              </p>

              {rateLimits.map((limit) => (
                <div key={limit.id} className="rate-limit-item">
                  <div className="rate-limit-header">
                    <h3>{limit.endpoint_group.toUpperCase()} Endpoints</h3>
                    <p className="endpoint-description">
                      {getEndpointDescription(limit.endpoint_group)}
                    </p>
                  </div>
                  
                  <div className="rate-limit-controls">
                    <div className="control-group">
                      <label>Requests per Minute:</label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={limit.requests_per_minute}
                        onChange={(e) => updateRateLimit(limit.id, 'requests_per_minute', parseInt(e.target.value))}
                        className="rate-input"
                      />
                    </div>
                    
                    <div className="control-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={limit.enabled}
                          onChange={(e) => updateRateLimit(limit.id, 'enabled', e.target.checked)}
                        />
                        Enable Rate Limiting
                      </label>
                    </div>
                  </div>
                </div>
              ))}
                         </div>

             <div className="cors-section">
               <h2>CORS Whitelist Management</h2>
               <p className="section-description">
                 Control which domains can access your APIs. Only whitelisted domains will be allowed to make requests.
               </p>

               <div className="cors-add-section">
                 <div className="cors-input-group">
                   <input
                     type="url"
                     placeholder="https://example.com"
                     value={newCorsUrl}
                     onChange={(e) => setNewCorsUrl(e.target.value)}
                     className="cors-url-input"
                   />
                   <button 
                     onClick={handleAddCorsUrl}
                     disabled={addingCors || !newCorsUrl.trim()}
                     className="add-cors-button"
                   >
                     {addingCors ? 'Adding...' : '➕ Add URL'}
                   </button>
                 </div>
               </div>

                               <div className="cors-whitelist">
                  <h3>Currently Allowed Domains</h3>
                  
                  {/* Show hardcoded domains */}
                  <div className="cors-section-group">
                    <h4>🔒 Hardcoded Domains (Always Allowed)</h4>
                    <div className="cors-url-item hardcoded">
                      <span className="cors-url">https://teikolabs.com</span>
                      <span className="cors-status">✅ Always Allowed</span>
                    </div>
                    <div className="cors-url-item hardcoded">
                      <span className="cors-url">https://www.teikolabs.com</span>
                      <span className="cors-status">✅ Always Allowed</span>
                    </div>
                    <div className="cors-url-item hardcoded">
                      <span className="cors-url">http://localhost:3000</span>
                      <span className="cors-status">✅ Development</span>
                    </div>
                    <div className="cors-url-item hardcoded">
                      <span className="cors-url">http://localhost:3001</span>
                      <span className="cors-status">✅ Development</span>
                    </div>
                    <div className="cors-url-item hardcoded">
                      <span className="cors-url">http://localhost:3002</span>
                      <span className="cors-status">✅ Development</span>
                    </div>
                  </div>

                  {/* Show database whitelist */}
                  <div className="cors-section-group">
                    <h4>🗄️ Database Whitelist (Dynamic)</h4>
                    {corsWhitelist.length > 0 ? (
                      corsWhitelist.map((item) => (
                        <div key={item.id} className="cors-url-item database">
                          <span className="cors-url">{item.url}</span>
                          <span className="cors-added-by">Added by: {item.admin_wallet?.slice(0, 20)}...</span>
                          <span className="cors-date">{new Date(item.created_at).toLocaleDateString()}</span>
                          <button 
                            onClick={() => handleRemoveCorsUrl(item.id)}
                            className="remove-cors-button"
                            title="Remove from whitelist"
                          >
                            🗑️
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="no-cors-urls">No additional domains in database whitelist. Add domains above to store them permanently.</p>
                    )}
                  </div>
                </div>
             </div>

             {message && (
               <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                 {message}
               </div>
             )}

             <div className="api-management-actions">
              <button 
                onClick={() => router.push('/admin/dashboard')}
                className="back-button"
              >
                ← Back to Dashboard
              </button>
              
              <button 
                onClick={handleSave}
                disabled={saving}
                className="save-button"
              >
                {saving ? 'Saving...' : '💾 Save Rate Limits'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
