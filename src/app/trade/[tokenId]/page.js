'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TradeRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const tokenId = params.tokenId;
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    const redirectToProject = async () => {
      try {
        // Fetch token data to get the symbol
        const response = await fetch('/api/get-token-cards');
        const result = await response.json();
        
        if (result.tokenCards) {
          const token = result.tokenCards.find(t => t.id.toString() === tokenId);
          if (token && token.symbol && token.symbol.trim() !== '') {
            // Redirect to new swap route with symbol
            router.replace(`/${token.symbol.toLowerCase()}/swap`);
            return;
          }
        }
        
        // If no symbol found or token not found, show error
        setIsRedirecting(false);
      } catch (error) {
        console.error('Error during redirect:', error);
        setIsRedirecting(false);
      }
    };

    if (tokenId) {
      redirectToProject();
    }
  }, [tokenId, router]);

  if (isRedirecting) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem', 
        color: 'white',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #374151', 
          borderTop: '4px solid #fbbf24', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite', 
          margin: '0 auto 1rem' 
        }}></div>
                    <p>Redirecting to new URL format&hellip;</p>
      </div>
    );
  }

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '3rem', 
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h2>Token Not Found</h2>
      <p>The token you&apos;re looking for could not be found or doesn&apos;t have a symbol configured.</p>
      <button 
        onClick={() => router.push('/')}
        style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          marginTop: '1rem'
        }}
      >
        Go Home
      </button>
    </div>
  );
} 