'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/header';
import Footer from '../components/footer';
import './leaderboard.css';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [competitionActive, setCompetitionActive] = useState(true);
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectedAddress, setConnectedAddress] = useState('');
  const [endGoalPoints, setEndGoalPoints] = useState(21000000);
  const router = useRouter();

  useEffect(() => {
    // Get connected wallet address
    const address = localStorage.getItem('connectedAddress');
    setConnectedAddress(address || '');

    // Load leaderboard data and end goal
    loadLeaderboard();
    loadEndGoal();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.leaderboard);
        setCompetitionActive(data.competitionActive);
        setTotalPointsEarned(data.totalPointsEarned);
        setTotalParticipants(data.totalParticipants);
        if (data.endGoal) {
          setEndGoalPoints(data.endGoal);
        }
      } else {
        setError(data.error || 'Failed to load leaderboard');
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const loadEndGoal = async () => {
    try {
      const response = await fetch('/api/quiz/end-goal');
      const data = await response.json();
      if (data.success) {
        setEndGoalPoints(data.endGoal);
      }
    } catch (error) {
      console.error('Error loading end goal:', error);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const goToQuizzes = () => {
    router.push('/quiz');
  };

  if (loading) {
    return (
      <div className="leaderboard-page">
        <Header />
        <main className="leaderboard-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading leaderboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-page">
        <Header />
        <main className="leaderboard-main">
          <div className="error-container">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={loadLeaderboard} className="retry-button">
              Try Again
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <Header />
      
      <main className="leaderboard-main">
        <div className="leaderboard-header">
          <h1>🏆 Quiz Leaderboard</h1>
          
          <div className="competition-status">
            {competitionActive ? (
              <div className="status active">
                <span className="status-icon">🟢</span>
                <span>Competition Active</span>
              </div>
            ) : (
              <div className="status ended">
                <span className="status-icon">🔴</span>
                <span>Competition Ended</span>
              </div>
            )}
          </div>
        </div>

        <div className="competition-stats">
          <div className="stat-card">
            <div className="stat-value">{totalPointsEarned.toLocaleString()}</div>
            <div className="stat-label">Total Points Earned</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalParticipants}</div>
            <div className="stat-label">Total Participants</div>
          </div>
          <div className="stat-card">
                            <div className="stat-value">{endGoalPoints ? endGoalPoints.toLocaleString() : '21,000,000'}</div>
            <div className="stat-label">Target Points</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
                              {Math.round((totalPointsEarned / (endGoalPoints || 21000000)) * 100)}%
            </div>
            <div className="stat-label">Progress</div>
          </div>
        </div>

        <div className="leaderboard-actions">
          {competitionActive && (
            <button onClick={goToQuizzes} className="play-quiz-button">
              🎯 Play Quiz
            </button>
          )}
        </div>

        <div className="leaderboard-container">
          <h2>Top Players</h2>
          
          {leaderboard.length === 0 ? (
            <div className="no-players">
              <p>No players yet. Be the first to play!</p>
              {competitionActive && (
                <button onClick={goToQuizzes} className="play-quiz-button">
                  Start Playing
                </button>
              )}
            </div>
          ) : (
            <div className="leaderboard-table">
              <div className="table-header">
                <div className="header-rank">Rank</div>
                <div className="header-wallet">Wallet Address</div>
                <div className="header-points">Points</div>
                <div className="header-perfect">Perfect Scores</div>
                <div className="header-joined">Joined</div>
              </div>
              
              {leaderboard.map((player, index) => (
                <div 
                  key={player.walletAddress} 
                  className={`table-row ${player.walletAddress === connectedAddress ? 'current-user' : ''}`}
                >
                  <div className="cell-rank">
                    {index === 0 && <span className="rank-icon">🥇</span>}
                    {index === 1 && <span className="rank-icon">🥈</span>}
                    {index === 2 && <span className="rank-icon">🥉</span>}
                    {index > 2 && <span className="rank-number">{player.rank}</span>}
                  </div>
                  <div className="cell-wallet">
                    {formatAddress(player.walletAddress)}
                    {player.walletAddress === connectedAddress && (
                      <span className="you-badge">You</span>
                    )}
                  </div>
                  <div className="cell-points">{player.totalPoints.toLocaleString()}</div>
                  <div className="cell-perfect">{player.perfectScores}</div>
                  <div className="cell-joined">{formatDate(player.joinedAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!competitionActive && (
          <div className="competition-ended">
            <h3>🏁 Competition Ended</h3>
            <p>The quiz competition has ended. The leaderboard is now final.</p>
            <p>Total points earned: {totalPointsEarned.toLocaleString()} / {endGoalPoints ? endGoalPoints.toLocaleString() : '21,000,000'}</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
