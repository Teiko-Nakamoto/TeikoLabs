'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/header';
import Footer from '../components/footer';
import './quiz.css';

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectedAddress, setConnectedAddress] = useState('');
  const [competitionActive, setCompetitionActive] = useState(true);
  const [competitionStatus, setCompetitionStatus] = useState('active');
  const [currentPoints, setCurrentPoints] = useState(0);
  const [endGoalThreshold, setEndGoalThreshold] = useState(220000);
  const router = useRouter();

  useEffect(() => {
    // Get connected wallet address
    const address = localStorage.getItem('connectedAddress');
    setConnectedAddress(address || '');

    // Load available quizzes and competition status
    loadQuizzes();
    loadCompetitionStatus();
    loadCurrentPoints();
  }, []);



  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quiz/available?t=${Date.now()}`, { cache: 'no-store' });
      const data = await response.json();
      
      if (data.success) {
        console.log('📊 Quizzes loaded with question counts:', data.quizzes.map(q => ({
          title: q.title,
          max_questions: q.max_questions,
          actual_question_count: q.actual_question_count
        })));
        setQuizzes(data.quizzes);
      } else {
        setError(data.error || 'Failed to load quizzes');
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
      setError('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const loadCompetitionStatus = async () => {
    try {
      console.log('🔍 Loading competition status...');
      const response = await fetch('/api/quiz/status');
      const data = await response.json();
      
      console.log('📊 Competition status response:', data);
      
      if (data.success) {
        setCompetitionStatus(data.status);
        setCompetitionActive(data.status === 'active');
        console.log('✅ Competition status set to:', data.status, 'Active:', data.status === 'active');
      }
    } catch (error) {
      console.error('Error loading competition status:', error);
    }
  };

  const loadCurrentPoints = async () => {
    try {
      console.log('🔍 Loading current points...');
      const response = await fetch('/api/quiz/current-points');
      const data = await response.json();
      
      console.log('📊 Current points response:', data);
      
      if (data.success) {
        setCurrentPoints(data.highestPoints);
        setEndGoalThreshold(data.endGoalThreshold);
        console.log('✅ Current points loaded:', data.highestPoints, 'Threshold:', data.endGoalThreshold);
      }
    } catch (error) {
      console.error('Error loading current points:', error);
    }
  };





  const startQuiz = (quizId) => {
    if (!connectedAddress) {
      alert('Please connect your wallet to play quizzes!');
      return;
    }
    
    router.push(`/quiz/${quizId}/play`);
  };

  const viewLeaderboard = () => {
    router.push('/leaderboard');
  };

  const pauseCompetition = async () => {
    try {
      console.log('🔄 Pausing competition...');
      const response = await fetch('/api/quiz/pause-competition', {
        method: 'POST'
      });
      const data = await response.json();
      
      console.log('📊 Pause response:', data);
      
      if (data.success) {
        console.log('✅ Competition paused!');
        await loadCompetitionStatus();
        alert('Competition has been paused! Quiz section is now closed.');
      } else {
        alert('Error pausing competition: ' + data.error);
      }
    } catch (error) {
      console.error('Error pausing competition:', error);
      alert('Error pausing competition');
    }
  };

  const checkCurrentStatus = async () => {
    try {
      console.log('🔍 Checking current competition status...');
      const response = await fetch('/api/quiz/status');
      const data = await response.json();
      
      console.log('📊 Current status:', data);
      alert(`Current competition status: ${data.status}\nActive: ${data.status === 'active'}`);
    } catch (error) {
      console.error('Error checking status:', error);
      alert('Error checking status');
    }
  };

  if (loading) {
    return (
      <div className="quiz-page">
        <Header />
        <main className="quiz-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading quizzes...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-page">
        <Header />
        <main className="quiz-main">
          <div className="error-container">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={loadQuizzes} className="retry-button">
              Try Again
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="quiz-page">
      <Header />
      
      <main className="quiz-main">
        <div className="quiz-header">
          <h1>🎯 Quiz Competition</h1>
          <p>Test your knowledge and earn revenue! First person to reach the end goal points ends the competition.</p>
          
          {/* Competition Status Display */}
          {competitionStatus === 'paused' && (
            <div className="competition-paused" style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
              border: '2px solid #22c55e',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)'
            }}>
              <h3 style={{ color: '#22c55e', margin: '0 0 1rem 0', fontSize: '1.8rem', fontWeight: 'bold' }}>
                🏆 COMPETITION ENDED - WINNER DECLARED! 🏆
              </h3>
              <p style={{ margin: '0 0 1rem 0', color: '#1f2937', fontSize: '1.2rem', fontWeight: 'bold' }}>
                Final Score: <span style={{ color: '#22c55e' }}>{currentPoints.toLocaleString()}</span> / {endGoalThreshold.toLocaleString()} points
              </p>
              <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '1.1rem' }}>
                <strong>🎉 Congratulations!</strong> The competition goal has been reached!
              </p>
              <p style={{ margin: '0 0 1rem 0', color: '#ef4444', fontSize: '1rem', fontWeight: 'bold' }}>
                🚫 No more quiz attempts allowed - Competition is closed
              </p>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '1rem' }}>
                Rewards will be airdropped soon to the winners.
              </p>
            </div>
          )}
          
          {/* Airdrop Notice for Ended Competition */}
          {competitionStatus === 'paused' && (
            <div className="airdrop-notice" style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
              border: '2px solid #3B82F6',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>🚀</span>
                <div>
                  <strong style={{ display: 'block', color: '#1F2937', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                    Rewards will be airdropped soon!
                  </strong>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>
                    Winners will receive their sBTC rewards directly to their wallets.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {!connectedAddress && (
            <div className="wallet-warning">
              <p>⚠️ Please connect your wallet to participate in quizzes</p>
            </div>
          )}
        </div>

        <div className="quiz-actions">
          <button onClick={viewLeaderboard} className="leaderboard-button">
            🏆 View Leaderboard
          </button>
        </div>

        {competitionStatus !== 'paused' && (
          <div className="quizzes-container">
            <h2>Available Quizzes</h2>
            
            {quizzes.length === 0 ? (
              <div className="no-quizzes">
                <p>No quizzes available at the moment.</p>
              </div>
            ) : (
              <div className="quiz-grid">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="quiz-card">
                    <div className="quiz-card-header">
                      <h3>{quiz.title}</h3>
                      <div className="quiz-stats">
                        <span className="stat">
                          <span className="stat-label">Time:</span>
                          <span className="stat-value">{quiz.time_per_question}s</span>
                        </span>
                        <span className="stat">
                          <span className="stat-label">Points:</span>
                          <span className="stat-value">Dynamic</span>
                        </span>
                      </div>
                    </div>
                    
                    {quiz.description && (
                      <p className="quiz-description">{quiz.description}</p>
                    )}
                    
                    <button 
                      onClick={() => startQuiz(quiz.id)}
                      className="start-quiz-button"
                      disabled={!connectedAddress}
                    >
                      {!connectedAddress ? 'Connect Wallet to Play' : 'Start Quiz'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {competitionStatus === 'paused' && (
          <div className="competition-ended-section" style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
            border: '2px solid #22c55e',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#22c55e', marginBottom: '1rem', fontSize: '1.8rem' }}>
              🏆 Competition Ended - Quizzes No Longer Available
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1.1rem', marginBottom: '1rem' }}>
              The quiz competition has reached its goal and is now closed.
            </p>
            <p style={{ color: '#059669', fontSize: '1rem', fontWeight: 'bold' }}>
              All quiz attempts have been disabled. Winners will be announced soon!
            </p>
          </div>
        )}

        <div className="quiz-rules">
          <h3>📋 Quiz Rules</h3>
          <ul>
            <li>Each question has a 10-second time limit</li>
            <li>Questions are randomly selected from the available pool</li>
            <li>One wrong answer ends the quiz immediately</li>
            <li>Perfect score earns dynamic revenue</li>
            <li>Competition ends when any user reaches the end goal points</li>
            <li>No hints or explanations for wrong answers</li>
          </ul>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
