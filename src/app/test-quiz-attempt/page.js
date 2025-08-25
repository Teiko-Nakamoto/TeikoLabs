'use client';

import { useState } from 'react';

export default function TestQuizAttempt() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-quiz-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      setResult(data);
      console.log('🧪 Test result:', data);
    } catch (error) {
      setResult({ error: error.message });
      console.error('❌ Test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🧪 Quiz Attempt Test</h1>
      <button 
        onClick={runTest} 
        disabled={loading}
        style={{ padding: '10px 20px', marginBottom: '20px' }}
      >
        {loading ? 'Running Test...' : 'Run Test'}
      </button>
      
      {result && (
        <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '5px' }}>
          <h3>Test Results:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
