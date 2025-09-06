'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Header from '../components/header';
import Footer from '../components/footer';
import Link from 'next/link';

import './dashboard.css';
import '../quiz/quiz.css';

// Memoized loading component
const LoadingSpinner = () => (
  <div style={{ 
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <div style={{
      textAlign: 'center',
      color: '#888'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(255, 255, 255, 0.1)',
        borderTop: '3px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px'
      }}></div>
      Loading Dashboard...
    </div>
  </div>
);

export default function MajorityHolderDashboard() {
  const { t } = useTranslation();
  const [connectedAddress, setConnectedAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const searchParams = useSearchParams();
  const initialTab = typeof window !== 'undefined' && searchParams?.get('tab')
    ? searchParams.get('tab')
    : 'rewards';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [airdropType, setAirdropType] = useState('');
  const [airdropAmount, setAirdropAmount] = useState('');
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [competitionStatus, setCompetitionStatus] = useState('active');
  const [recipients, setRecipients] = useState([{ to: '' }]);
  const [allowMode, setAllowMode] = useState(true);
  const [isCallingFunction, setIsCallingFunction] = useState(false);
  const [globalAmount, setGlobalAmount] = useState('');
  const [bulkAddresses, setBulkAddresses] = useState('');
  const [aiPanelOpen, setAiPanelOpen] = useState({});
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const toggleAiPanel = (quizId, open) => {
    setAiPanelOpen(prev => ({ ...prev, [quizId]: open }));
  };
  
  // Quiz state variables
  const [quizzes, setQuizzes] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('loading'); // loading, playing, failed, completed
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [competitionActive, setCompetitionActive] = useState(true);
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [dynamicReward, setDynamicReward] = useState(0);
  const [sbtcFeePool, setSbtcFeePool] = useState(0);
  const [rewardLoading, setRewardLoading] = useState(true);
  const [feePoolHistory, setFeePoolHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [userQuizPoints, setUserQuizPoints] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [pointsToNextLevel, setPointsToNextLevel] = useState(0);
  const [levelProgress, setLevelProgress] = useState(0);
  const [progressMode, setProgressMode] = useState('competition'); // 'competition' or 'level'
  const [userRank, setUserRank] = useState(null);
  const [levelName, setLevelName] = useState('Novice');
  const [tiedUsers, setTiedUsers] = useState(0);
  
  // Quiz management state
  const [quizForm, setQuizForm] = useState({
    title: '',
    maxQuestions: 6
  });
  const [questionForm, setQuestionForm] = useState({
    quizId: '',
    questionText: '',
    correctAnswer: '',
    wrongAnswer1: '',
    wrongAnswer2: '',
    wrongAnswer3: ''
  });
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  
  // End goal configuration state
  const [endGoalPoints, setEndGoalPoints] = useState(0);
  const [showEndGoalForm, setShowEndGoalForm] = useState(false);
  const [endGoalLoading, setEndGoalLoading] = useState(false);
  const [updatingCompetitionStatus, setUpdatingCompetitionStatus] = useState(false);
  const [updatingVisibility, setUpdatingVisibility] = useState({});

  // Admin wallet addresses (comma-separated)
  const ADMIN_ADDRESSES = process.env.NEXT_PUBLIC_ADMIN_ADDRESSES?.split(',') || [
    'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4',
    'SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B' // Majority holder admin access
  ];

  const dashboardData = {
    currentMajorityHolder: {
      address: 'SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B',
      lockedHoldings: 210000,
      percentageOfSupply: 1.0
    },
    masBalance: {
      sats: 1250000000,
      usd: 750000,
      btc: 12.5
    }
  };

  // Memoized data loading functions
  const loadInitialData = useCallback(async (address) => {
    try {
      await Promise.all([
        loadUserQuizPoints(address),
        loadLeaderboard()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }, []);

  useEffect(() => {
    const address = localStorage.getItem('connectedAddress');
    if (address) {
      setConnectedAddress(address);
      loadInitialData(address);
    }

    const handleStorageChange = () => {
      const newAddress = localStorage.getItem('connectedAddress');
      setConnectedAddress(newAddress || '');
      if (newAddress) {
        loadUserQuizPoints(newAddress);
        loadLeaderboard(); // Load leaderboard when address changes
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Load end goal on component mount
  useEffect(() => {
    loadEndGoal(); // Load for all users, not just admins
  }, [connectedAddress]);

  const loadUserQuizPoints = async (address) => {
    if (!address) return;
    
    try {
      console.log('🔄 Loading user quiz points for:', address);
      const response = await fetch(`/api/user-tokens/quiz-points?address=${address}`);
      const data = await response.json();
      
      console.log('📊 User points response:', data);
      
      if (data.success) {
        const points = data.points || 0;
        setUserQuizPoints(points);
        
        console.log('✅ User has points:', points);
        
        // Calculate level information
        calculateLevelInfo(points);
      } else {
        console.error('❌ Failed to load user quiz points:', data.error);
        setUserQuizPoints(0);
        calculateLevelInfo(0);
      }
    } catch (error) {
      console.error('❌ Error loading user quiz points:', error);
      setUserQuizPoints(0);
      calculateLevelInfo(0);
    }
  };

  const calculateLevelInfo = (points) => {
    // Level system based on leaderboard ranking
    // Level 1: Rank 1 (Champion)
    // Level 2: Rank 2-3 (Elite)
    // Level 3: Rank 4-6 (Advanced)
    // Level 4: Rank 7-10 (Intermediate)
    // Level 5: Rank 11-20 (Beginner)
    // Level 6: Rank 21+ (Novice)
    
    // We need to get the user's rank from the leaderboard
    // This will be calculated when the leaderboard is loaded
    setUserLevel(1); // Default level
    setPointsToNextLevel(0);
    setLevelProgress(0);
  };

  const calculateUserRank = (leaderboardData, userAddress) => {
    if (!leaderboardData || !userAddress || leaderboardData.length === 0) {
      console.log('❌ Cannot calculate rank: missing data or empty leaderboard');
      return null;
    }
    
    console.log('🔍 Calculating rank for:', userAddress);
    console.log('📊 Leaderboard has', leaderboardData.length, 'users');
    
    // Find user's position in leaderboard
    const userIndex = leaderboardData.findIndex(user => 
      user.walletAddress === userAddress // Changed from wallet_address to walletAddress
    );
    
    console.log('🔍 User found at index:', userIndex);
    
    if (userIndex === -1) {
      console.log('❌ User not found in leaderboard');
      console.log('🔍 Available addresses:', leaderboardData.map(u => u.walletAddress));
      return null; // User not found in leaderboard
    }
    
    const userRank = userIndex + 1;
    const userPoints = leaderboardData[userIndex].totalPoints; // Changed from total_points to totalPoints
    
    console.log('✅ User rank calculated:', { rank: userRank, points: userPoints });
    
    // Count how many users have the same points (for ties)
    const tiedUsers = leaderboardData.filter(user => 
      user.totalPoints === userPoints // Changed from total_points to totalPoints
    ).length;
    
    // Calculate points needed to surpass the person above you
    let pointsToSurpass = 0;
    if (userRank > 1) {
      // Find the person above you (lower index = higher rank)
      const personAbove = leaderboardData[userIndex - 1];
      pointsToSurpass = personAbove.totalPoints - userPoints + 1; // Changed from total_points to totalPoints
    }
    
    // Determine level based on rank
    let level = 6; // Default: Novice
    let levelName = 'Novice';
    let nextLevelPoints = 0;
    let progress = 0;
    
    if (userRank === 1) {
      level = 1;
      levelName = 'Champion';
      progress = 100; // Max level reached
    } else if (userRank <= 3) {
      level = 2;
      levelName = 'Elite';
      // Progress toward rank 1
      const rank1Points = leaderboardData[0].totalPoints; // Changed from total_points to totalPoints
      nextLevelPoints = rank1Points - userPoints;
      progress = Math.max(0, Math.min(100, ((rank1Points - userPoints) / rank1Points) * 100));
    } else if (userRank <= 6) {
      level = 3;
      levelName = 'Advanced';
      // Progress toward top 3
      const top3Points = leaderboardData[2].totalPoints; // Changed from total_points to totalPoints
      nextLevelPoints = top3Points - userPoints;
      progress = Math.max(0, Math.min(100, ((top3Points - userPoints) / top3Points) * 100));
    } else if (userRank <= 10) {
      level = 4;
      levelName = 'Intermediate';
      // Progress toward top 6
      const top6Points = leaderboardData[5].totalPoints; // Changed from total_points to totalPoints
      nextLevelPoints = top6Points - userPoints;
      progress = Math.max(0, Math.min(100, ((top6Points - userPoints) / top6Points) * 100));
    } else if (userRank <= 20) {
      level = 5;
      levelName = 'Beginner';
      // Progress toward top 10
      const top10Points = leaderboardData[9].totalPoints; // Changed from total_points to totalPoints
      nextLevelPoints = top10Points - userPoints;
      progress = Math.max(0, Math.min(100, ((top10Points - userPoints) / top10Points) * 100));
    } else {
      level = 6;
      levelName = 'Novice';
      // Progress toward top 20
      const top20Points = leaderboardData[19]?.totalPoints || 0; // Changed from total_points to totalPoints
      nextLevelPoints = top20Points - userPoints;
      progress = Math.max(0, Math.min(100, ((top20Points - userPoints) / top20Points) * 100));
    }
    
    console.log('✅ Final rank info:', { rank: userRank, level: level, levelName: levelName, pointsToSurpass });
    
    setUserLevel(level);
    setPointsToNextLevel(pointsToSurpass); // Use points to surpass instead of next level points
    setLevelProgress(progress);
    setUserRank(userRank);
    setLevelName(levelName);
    setTiedUsers(tiedUsers);
    
    return {
      rank: userRank,
      level: level,
      levelName: levelName,
      points: userPoints,
      tiedUsers: tiedUsers,
      nextLevelPoints: pointsToSurpass,
      progress: progress
    };
  };

  // Load analytics data when analytics tab is active
  useEffect(() => {
    if (activeTab === 'analytics') {
      loadDynamicReward();
      loadFeePoolHistory();
    }
  }, [activeTab]);

  // Load quiz data when quiz tab is active
  useEffect(() => {
    if (activeTab === 'quiz') {
      loadQuizzes();
      loadDynamicReward();
      
      // Refresh user's quiz points when quiz tab is loaded
      if (connectedAddress) {
        loadUserQuizPoints(connectedAddress);
      }
    }
  }, [activeTab]);



  // Load rewards data when rewards tab is active
  useEffect(() => {
    if (activeTab === 'rewards') {
      loadDynamicReward();
      loadLeaderboard();
    }
  }, [activeTab]);

  // Load leaderboard data when leaderboard tab is active
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      loadLeaderboard(); // Always refresh when viewing leaderboard
    }
  }, [activeTab]);

  // Load quiz management data when quiz-management tab is active
  useEffect(() => {
    if (activeTab === 'quiz-management') {
      loadQuizzes();
      loadFeePoolHistory();
    }
  }, [activeTab]);

  // Load visible quizzes when quiz tab is active
  useEffect(() => {
    if (activeTab === 'quiz') {
      loadVisibleQuizzes();
    }
  }, [activeTab]);

  // Load leaderboard once on component mount and when address changes
  useEffect(() => {
    if (connectedAddress) {
      loadLeaderboard();
      loadCompetitionStatus();
    }
  }, [connectedAddress]); // Only depend on connectedAddress, not activeTab

  // Timer effect for quiz game
  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (gameState === 'playing' && timeLeft === 0) {
      // Time's up - quiz failed
      completeQuiz(false);
    }
    return () => clearTimeout(timer);
  }, [timeLeft, gameState]);



  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(connectedAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address');
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Quiz functions
  const loadQuizzes = async () => {
    try {
      const response = await fetch('/api/quizzes/list');
      const data = await response.json();
      
      if (data.success) {
        setQuizzes(data.quizzes);
      } else {
        console.error('Failed to load quizzes:', data.error);
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
    }
  };

  // Load only visible quizzes for quiz selection
  const loadVisibleQuizzes = async () => {
    try {
      const response = await fetch('/api/quiz/available');
      const data = await response.json();
      
      if (data.success) {
        setQuizzes(data.quizzes);
      } else {
        console.error('Failed to load visible quizzes:', data.error);
      }
    } catch (error) {
      console.error('Error loading visible quizzes:', error);
    }
  };

  const loadDynamicReward = async () => {
    setRewardLoading(true);
    try {
      // Clear blockchain cache to get fresh data
      if (typeof window !== 'undefined') {
        // Clear all possible cache keys for fee pool data
        localStorage.removeItem('cache_get-sbtc-fee-pool');
        localStorage.removeItem('cache_get-fee-pool');
        localStorage.removeItem('cache_get-revenue');
        localStorage.removeItem('cache_get-total-fees');
        localStorage.removeItem('cache_get-sbtc-balance');
        console.log('🗑️ Cleared all blockchain cache for fresh data');
      }
      
      const response = await fetch('/api/quiz/get-dynamic-reward');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDynamicReward(data.reward);
          setSbtcFeePool(data.sbtcFeePool);
          console.log('🎯 Loaded dynamic reward:', data.reward, 'based on sBTC fee pool:', data.sbtcFeePool);
        } else {
          console.error('Failed to load dynamic reward:', data.error);
          setDynamicReward(0);
          setSbtcFeePool(0);
        }
      } else {
        console.error('Failed to load dynamic reward');
        setDynamicReward(0);
        setSbtcFeePool(0);
      }
    } catch (error) {
      console.error('Error loading dynamic reward:', error);
      setDynamicReward(0);
      setSbtcFeePool(0);
    } finally {
      setRewardLoading(false);
    }
  };

  const loadCompetitionStatus = async () => {
    try {
      const response = await fetch('/api/quiz/status');
      const data = await response.json();
      if (data.success) {
        setCompetitionStatus(data.status);
        console.log('🏆 Competition status loaded:', data.status);
      }
    } catch (error) {
      console.error('Error loading competition status:', error);
    }
  };



  const loadFeePoolHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch('/api/quiz/track-fee-pool');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFeePoolHistory(data.history || []);
          console.log('📊 Loaded fee pool history:', data.history?.length || 0, 'records');
        } else {
          console.error('Failed to load fee pool history:', data.error);
          setFeePoolHistory([]);
        }
      } else {
        console.error('Failed to load fee pool history');
        setFeePoolHistory([]);
      }
    } catch (error) {
      console.error('Error loading fee pool history:', error);
      setFeePoolHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const saveCurrentFeePool = async () => {
    try {
      const response = await fetch('/api/quiz/save-current-fee-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(`✅ Saved current fee pool: ${data.feePool.toLocaleString()} sats`);
          loadFeePoolHistory(); // Refresh the history
        } else {
          alert('❌ Failed to save fee pool: ' + data.error);
        }
      } else {
        alert('❌ Failed to save fee pool data');
      }
    } catch (error) {
      console.error('Error saving current fee pool:', error);
      alert('❌ Error saving fee pool data');
    }
  };

  const loadLeaderboard = async () => {
    try {
      console.log('🔄 Loading leaderboard...');
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      
      console.log('📊 Full leaderboard response:', data);
      
      if (data.success && data.leaderboard && data.leaderboard.length > 0) {
        setLeaderboard(data.leaderboard);
        setCompetitionActive(data.competitionActive);
        setTotalPointsEarned(data.totalPointsEarned);
        setTotalParticipants(data.totalParticipants);
        
        console.log('📊 Leaderboard data:', data.leaderboard);
        console.log('👤 Current user address:', connectedAddress);
        console.log('🔍 Looking for user in leaderboard...');
        
        // Calculate user rank and level information
        if (connectedAddress && data.leaderboard) {
          // Log each user to see the structure
          data.leaderboard.forEach((user, index) => {
            console.log(`User ${index + 1}:`, {
              walletAddress: user.walletAddress,
              totalPoints: user.totalPoints,
              matches: user.walletAddress === connectedAddress
            });
          });
          
          const rankInfo = calculateUserRank(data.leaderboard, connectedAddress);
          if (rankInfo) {
            console.log('✅ User rank info:', rankInfo);
            setUserRank(rankInfo.rank);
            setLevelName(rankInfo.levelName);
            setTiedUsers(rankInfo.tiedUsers);
          } else {
            console.log('❌ User not found in leaderboard or rank calculation failed');
            console.log('🔍 Available addresses:', data.leaderboard.map(u => u.walletAddress));
            // Only reset if we don't already have a valid rank
            if (userRank === null) {
              setUserRank(null);
              setLevelName('Novice');
              setTiedUsers(0);
              setUserLevel(6);
              setPointsToNextLevel(0);
              setLevelProgress(0);
            }
          }
        }
        
        // Refresh user's quiz points when leaderboard is loaded
        if (connectedAddress) {
          loadUserQuizPoints(connectedAddress);
        }
      } else {
        console.error('Failed to load leaderboard:', data.error);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const startQuiz = async (quizId) => {
    try {
      setGameState('loading');
      // Add timestamp to prevent caching and ensure fresh randomization
      const timestamp = Date.now();
      const response = await fetch(`/api/quiz/questions/${quizId}?t=${timestamp}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('🎲 Quiz questions loaded and randomized:', data.questions.length, 'questions');
        console.log('🎲 First question:', data.questions[0]?.questionText?.substring(0, 50) + '...');
        setSelectedQuiz(data.quiz);
        setQuizQuestions(data.questions);
        setCurrentQuestion(0);
        setScore(0);
        setTimeLeft(data.quiz.timePerQuestion);
        setGameState('playing');
      } else {
        alert('Failed to load quiz: ' + data.error);
        setGameState('loading');
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      setGameState('loading');
    }
  };

  const handleAnswer = async (selectedAnswer) => {
    const currentQ = quizQuestions[currentQuestion];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    
    if (isCorrect) {
      setScore(score + 1);
      
      if (currentQuestion + 1 < quizQuestions.length) {
        setCurrentQuestion(currentQuestion + 1);
        setTimeLeft(selectedQuiz.timePerQuestion);
      } else {
        // Quiz completed successfully
        await completeQuiz(true);
      }
    } else {
      // Quiz failed
      await completeQuiz(false);
    }
  };

  const completeQuiz = async (success) => {
    try {
      const response = await fetch('/api/quiz/end-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: selectedQuiz.id,
          walletAddress: connectedAddress,
          questionsAnswered: currentQuestion + 1,
          correctAnswers: success ? currentQuestion + 1 : currentQuestion,
          failedAtQuestion: success ? null : currentQuestion + 1
        })
      });
      
      const data = await response.json();
      console.log('📊 Quiz completion response:', data);
      
      if (response.ok && data.success) {
        // Check if user got 100% correct (all questions answered correctly)
        const isPerfectScore = success && (currentQuestion + 1 === quizQuestions.length);
        setGameState(isPerfectScore ? 'perfect' : (success ? 'completed' : 'failed'));
        
        // Refresh user's quiz points and leaderboard after completion
        if (connectedAddress) {
          loadUserQuizPoints(connectedAddress);
          // Reload leaderboard to update rank immediately
          setTimeout(() => {
            loadLeaderboard();
          }, 1000); // Small delay to ensure points are saved
        }
      } else {
        console.error('❌ Quiz completion failed:', data);
        
        // Handle competition ended error specifically
        if (data.error && data.error.includes('Competition has ended')) {
          showCompetitionEndedModal();
          setGameState('competition-ended');
        } else {
          alert('Failed to record quiz attempt: ' + (data.error || 'Unknown error') + '\n\nDetails: ' + (data.message || 'No additional details'));
        setGameState('loading');
        }
      }
    } catch (error) {
      console.error('Error completing quiz:', error);
      setGameState('loading');
    }
  };

  const resetQuiz = () => {
    setGameState('loading');
    setCurrentQuestion(0);
    setScore(0);
    setTimeLeft(selectedQuiz ? selectedQuiz.timePerQuestion : 10);
    
    // Keep the same quiz and reload questions (they will be randomized again)
    if (selectedQuiz) {
      // Use the same endpoint as startQuiz to ensure randomization
      startQuiz(selectedQuiz.id);
    } else {
      setSelectedQuiz(null);
      setQuizQuestions([]);
    }
    
    // Refresh user's quiz points after reset
    if (connectedAddress) {
      loadUserQuizPoints(connectedAddress);
    }
  };

  const goToQuizSelection = () => {
    // Return to quiz selection page
    setGameState('loading');
    setCurrentQuestion(0);
    setScore(0);
    setTimeLeft(10);
    setSelectedQuiz(null);
    setQuizQuestions([]);
    
    // Load only visible quizzes for selection
    loadVisibleQuizzes();
    
    // Refresh user's quiz points
    if (connectedAddress) {
      loadUserQuizPoints(connectedAddress);
    }
  };

  // Quiz management functions
  const createQuiz = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/quizzes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Quiz created successfully!');
        setQuizForm({
          title: '',
          maxQuestions: 6
        });
        setShowQuizForm(false);
        loadQuizzes();
      } else {
        alert('Error creating quiz: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Failed to create quiz');
    }
  };

  const addQuestion = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/quizzes/add-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Question added successfully!');
        setQuestionForm({
          quizId: questionForm.quizId,
          questionText: '',
          correctAnswer: '',
          wrongAnswer1: '',
          wrongAnswer2: '',
          wrongAnswer3: ''
        });
        setShowQuestionForm(false);
      } else {
        alert('Error adding question: ' + data.error);
      }
    } catch (error) {
      console.error('Error adding question:', error);
      alert('Failed to add question');
    }
  };

  const loadQuizQuestions = async (quizId) => {
    try {
      console.log('🔍 Loading questions for quiz ID:', quizId);
      const response = await fetch(`/api/quiz/questions/${quizId}/manage`);
      const data = await response.json();
      
      console.log('🔍 API response:', data);
      
      if (data.success) {
        console.log('🔍 Setting quiz questions:', data.questions);
        setQuizQuestions(data.questions);
      } else {
        console.error('❌ API returned error:', data.error);
        setQuizQuestions([]);
      }
    } catch (error) {
      console.error('Error loading quiz questions:', error);
      setQuizQuestions([]);
    }
  };

  const selectQuiz = (quiz) => {
    console.log('🔍 Selecting quiz:', quiz);
    setSelectedQuiz(quiz);
    setQuestionForm(prev => ({ ...prev, quizId: quiz.id }));
    loadQuizQuestions(quiz.id);
  };

  const testDatabase = async () => {
    try {
      console.log('🧪 Testing database...');
      const response = await fetch('/api/test-database');
      const data = await response.json();
      
      if (data.success) {
        console.log('📊 Database test results:', data);
        alert(`Database has ${data.count} users. Check console for details.`);
      } else {
        console.error('❌ Database test failed:', data.error);
        alert('Database test failed: ' + data.error);
      }
    } catch (error) {
      console.error('❌ Error testing database:', error);
      alert('Error testing database: ' + error.message);
    }
  };



  const resetAllPoints = async () => {
    if (!confirm('⚠️ WARNING: This will permanently delete ALL user points and quiz history. This action cannot be undone. Are you absolutely sure?')) {
      return;
    }

    if (!confirm('⚠️ FINAL CONFIRMATION: This will reset ALL user points to 0 and clear all quiz history. Continue?')) {
      return;
    }

    try {
      // Try API first
      const response = await fetch('/api/quiz/reset-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ All user points and quiz history have been reset successfully!');
        loadLeaderboard(); // Refresh the leaderboard
        loadUserQuizPoints(connectedAddress); // Refresh user's own points
      } else {
        // If API fails, try frontend reset
        if (confirm('❌ API reset failed. Try frontend-only reset?')) {
          await frontendReset();
        }
      }
    } catch (error) {
      console.error('Error resetting points:', error);
      // If API fails, try frontend reset
      if (confirm('❌ API reset failed. Try frontend-only reset?')) {
        await frontendReset();
      }
    }
  };

  const backendReset = async () => {
    if (!confirm('⚠️ WARNING: This will reset ALL user points in the database. Continue?')) {
      return;
    }
    try {
      console.log('🔄 Backend reset: Resetting database...');
      
      const response = await fetch('/api/quiz/reset-points-backend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Backend reset successful! Reset ${data.updatedRecords || 0} user records.`);
        loadLeaderboard(); // Refresh the leaderboard
        loadUserQuizPoints(connectedAddress); // Refresh user's own points
      } else {
        alert('❌ Backend reset failed: ' + data.message);
      }
    } catch (error) {
      console.error('Error in backend reset:', error);
      alert('❌ Backend reset failed: ' + error.message);
    }
  };



  const cleanupFeePool = async () => {
    if (!confirm('⚠️ WARNING: This will remove suspicious fee pool data (like the 494.4K value). This action cannot be undone. Continue?')) {
      return;
    }
    try {
      const response = await fetch('/api/cleanup-fee-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ Cleaned up fee pool data! Removed ${data.deletedCount} suspicious records.`);
        loadFeePoolHistory(); // Refresh the chart
      } else {
        alert('❌ Failed to cleanup fee pool data: ' + data.error);
      }
    } catch (error) {
      console.error('Error cleaning up fee pool:', error);
      alert('❌ Error cleaning up fee pool data');
    }
  };



  const refreshLeaderboard = async () => {
    console.log('🔄 Manually refreshing leaderboard...');
    await loadLeaderboard();
  };

  // Load current end goal from database
  const loadEndGoal = async () => {
    try {
      console.log('🔄 Loading end goal from database...');
      const response = await fetch('/api/quiz/end-goal');
      const data = await response.json();
      console.log('📊 End goal API response:', data);
      
      if (data.success) {
        console.log('✅ Setting end goal to:', data.endGoal);
        setEndGoalPoints(data.endGoal);
      } else {
        console.error('❌ Failed to load end goal:', data.error);
      }
    } catch (error) {
      console.error('❌ Error loading end goal:', error);
    }
  };

  // Update end goal
  const updateEndGoal = async (e) => {
    e.preventDefault();
    setEndGoalLoading(true);
    
    try {
      console.log('🔄 Updating end goal to:', endGoalPoints);
      
      const response = await fetch('/api/quiz/end-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endGoal: endGoalPoints })
      });
      
      const data = await response.json();
      console.log('📊 Update response:', data);
      
      if (data.success) {
        alert('✅ End goal updated successfully!');
        setShowEndGoalForm(false);
        loadEndGoal(); // Refresh the current end goal
      } else {
        alert('❌ Failed to update end goal: ' + data.error);
      }
    } catch (error) {
      console.error('❌ Error updating end goal:', error);
      alert('❌ Error updating end goal');
    } finally {
      setEndGoalLoading(false);
    }
  };

  // Debug end goal setting
  const debugEndGoal = async () => {
    try {
      console.log('🔍 Debugging end goal setting...');
      const response = await fetch('/api/quiz/debug-end-goal');
      const data = await response.json();
      
      console.log('🔍 Debug response:', data);
      
      if (data.success) {
        alert(`✅ Debug successful!\n\nCurrent end goal: ${data.endGoal.toLocaleString()}\n\nCheck console for full details.`);
        if (data.created) {
          loadEndGoal(); // Refresh if setting was created
        }
      } else {
        alert('❌ Debug failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error debugging end goal:', error);
      alert('❌ Error debugging end goal');
    }
  };

  const updateCompetitionStatus = async () => {
    try {
      console.log('🔄 Updating competition status...');
      const response = await fetch('/api/quiz/auto-update-status', {
        method: 'POST'
      });
      const data = await response.json();
      
      console.log('📊 Update response:', data);
      
      if (data.success) {
        console.log('✅ Competition status updated!');
        await loadCompetitionStatus();
        alert(`Competition status updated!\n\n${data.message}\n\nPrevious: ${data.previousStatus}\nNew: ${data.newStatus}\n\nStatus changed: ${data.statusChanged ? 'Yes' : 'No'}`);
      } else {
        alert('Error updating competition status: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating competition status:', error);
      alert('Error updating competition status');
    }
  };

  const toggleCompetitionStatus = async () => {
    const newStatus = competitionStatus === 'active' ? 'ended' : 'active';
    const confirmMessage = newStatus === 'ended' 
      ? 'Are you sure you want to end the quiz competition? Users will not be able to play quizzes.'
      : 'Are you sure you want to activate the quiz competition? Users will be able to play quizzes again.';
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      setUpdatingCompetitionStatus(true);
      
      const response = await fetch('/api/quiz/toggle-competition-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCompetitionStatus(newStatus);
        alert(`Quiz competition ${newStatus === 'active' ? 'activated' : 'ended'} successfully!`);
      } else {
        alert('Error updating competition status: ' + data.error);
      }
    } catch (error) {
      console.error('Error toggling competition status:', error);
      alert('Failed to update competition status');
    } finally {
      setUpdatingCompetitionStatus(false);
    }
  };

  const toggleQuizVisibility = async (quizId, currentVisibility) => {
    try {
      setUpdatingVisibility(prev => ({ ...prev, [quizId]: true }));
      
      const response = await fetch('/api/quizzes/toggle-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quizId,
          isVisible: !currentVisibility
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the quiz in the local state
        setQuizzes(prevQuizzes => 
          prevQuizzes.map(quiz => 
            quiz.id === quizId 
              ? { ...quiz, is_visible: !currentVisibility }
              : quiz
          )
        );
        alert(`Quiz ${!currentVisibility ? 'shown' : 'hidden'} successfully!`);
      } else {
        alert('Error updating quiz visibility: ' + data.error);
      }
    } catch (error) {
      console.error('Error toggling quiz visibility:', error);
      alert('Failed to update quiz visibility');
    } finally {
      setUpdatingVisibility(prev => ({ ...prev, [quizId]: false }));
    }
  };

  const checkSettings = async () => {
    try {
      console.log('🔍 Checking quiz settings...');
      const response = await fetch('/api/quiz/check-settings');
      const data = await response.json();
      
      console.log('📊 Settings response:', data);
      
      if (data.success) {
        const settings = data.settings;
        const message = `Quiz Settings:\n\nCompetition Active: ${settings.competitionActive}\nEnd Goal Threshold: ${settings.endGoalThreshold}\nCompetition Status: ${settings.competitionStatus}\n\nLast Updated: ${settings.statusUpdatedAt || 'Never'}\n\nCurrent Points: 221,230\nThreshold: 220,000\nStatus: ${settings.competitionActive === 'true' ? 'ACTIVE' : 'PAUSED'}`;
        alert(message);
      } else {
        alert('Error checking settings: ' + data.error);
      }
    } catch (error) {
      console.error('Error checking settings:', error);
      alert('Error checking settings');
    }
  };

  const initCompetitionStatus = async () => {
    try {
      console.log('🔧 Initializing competition status...');
      const response = await fetch('/api/quiz/init-competition-status', {
        method: 'POST'
      });
      const data = await response.json();
      
      console.log('📊 Init response:', data);
      
      if (data.success) {
        console.log('✅ Competition status initialized!');
        alert(`Competition status initialized!\n\n${data.message}`);
      } else {
        alert('Error initializing competition status: ' + data.error);
      }
    } catch (error) {
      console.error('Error initializing competition status:', error);
      alert('Error initializing competition status');
    }
  };

  const fixCompetitionActive = async () => {
    try {
      console.log('🔧 Fixing competition active setting...');
      const response = await fetch('/api/quiz/fix-competition-active', {
        method: 'POST'
      });
      const data = await response.json();
      
      console.log('📊 Fix response:', data);
      
      if (data.success) {
        console.log('✅ Competition active setting fixed!');
        alert(`Competition active setting fixed!\n\n${data.message}\n\nPrevious: ${data.previousActive}\nNew: ${data.newActive}\n\nStatus changed: ${data.statusChanged ? 'Yes' : 'No'}`);
      } else {
        alert('Error fixing competition active setting: ' + data.error);
      }
    } catch (error) {
      console.error('Error fixing competition active setting:', error);
      alert('Error fixing competition active setting');
    }
  };

  const fixSchema = async () => {
    try {
      console.log('🔧 Fixing database schema...');
      const response = await fetch('/api/quiz/fix-schema', {
        method: 'POST'
      });
      const data = await response.json();
      
      console.log('📊 Schema fix response:', data);
      
      if (data.success) {
        console.log('✅ Database schema fixed!');
        alert(`Database schema fixed!\n\n${data.message}`);
      } else {
        alert('Error fixing database schema: ' + data.error);
      }
    } catch (error) {
      console.error('Error fixing database schema:', error);
      alert('Error fixing database schema');
    }
  };

  const setStatusActive = async () => {
    try {
      console.log('🔧 Setting competition status to active...');
      const response = await fetch('/api/quiz/set-status-active', {
        method: 'POST'
      });
      const data = await response.json();
      
      console.log('📊 Set status response:', data);
      
      if (data.success) {
        console.log('✅ Competition status set to active!');
        alert(`Competition status set to active!\n\n${data.message}`);
      } else {
        alert('Error setting competition status: ' + data.error);
      }
    } catch (error) {
      console.error('Error setting competition status:', error);
      alert('Error setting competition status');
    }
  };

  const debugDatabase = async () => {
    try {
      console.log('🔍 Debugging database...');
      const response = await fetch('/api/quiz/debug-database');
      const data = await response.json();
      
      console.log('📊 Debug response:', data);
      
      if (data.success) {
        console.log('✅ Database debugged!');
        const results = data.results;
        let message = 'Database Debug Results:\n\n';
        
        Object.keys(results).forEach(table => {
          const result = results[table];
          message += `${table}:\n`;
          message += `  Exists: ${result.exists}\n`;
          if (result.exists) {
            message += `  Count: ${result.count}\n`;
            if (result.data && result.data.length > 0) {
              message += `  Sample: ${JSON.stringify(result.data[0])}\n`;
            }
          } else {
            message += `  Error: ${result.error}\n`;
          }
          message += '\n';
        });
        
        // Create a custom popup with copy button
        const popup = document.createElement('div');
        popup.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #1a1a1a;
          color: white;
          padding: 20px;
          border-radius: 10px;
          border: 1px solid #333;
          z-index: 10000;
          max-width: 80vw;
          max-height: 80vh;
          overflow-y: auto;
          font-family: monospace;
          white-space: pre-wrap;
        `;
        
        const text = document.createElement('div');
        text.textContent = message;
        text.style.marginBottom = '15px';
        
        const copyButton = document.createElement('button');
        copyButton.textContent = '📋 Copy to Clipboard';
        copyButton.style.cssText = `
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin-right: 10px;
        `;
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '❌ Close';
        closeButton.style.cssText = `
          background: #dc3545;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
        `;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.appendChild(copyButton);
        buttonContainer.appendChild(closeButton);
        
        popup.appendChild(text);
        popup.appendChild(buttonContainer);
        
        // Add overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 9999;
        `;
        
        document.body.appendChild(overlay);
        document.body.appendChild(popup);
        
        copyButton.onclick = () => {
          navigator.clipboard.writeText(message);
          copyButton.textContent = '✅ Copied!';
          setTimeout(() => {
            copyButton.textContent = '📋 Copy to Clipboard';
          }, 2000);
        };
        
        closeButton.onclick = () => {
          document.body.removeChild(overlay);
          document.body.removeChild(popup);
        };
        
        overlay.onclick = () => {
          document.body.removeChild(overlay);
          document.body.removeChild(popup);
        };
      } else {
        alert('Error debugging database: ' + data.error);
      }
    } catch (error) {
      console.error('Error debugging database:', error);
      alert('Error debugging database');
    }
  };

  const cleanupSettings = async () => {
    try {
      console.log('🧹 Cleaning up redundant settings...');
      const response = await fetch('/api/quiz/cleanup-settings', {
        method: 'POST'
      });
      const data = await response.json();
      
      console.log('📊 Cleanup response:', data);
      
      if (data.success) {
        console.log('✅ Settings cleanup successful!');
        alert(`Settings Cleanup Results:\n\n${data.message}\n\nRemaining settings:\n${JSON.stringify(data.remainingSettings, null, 2)}`);
      } else {
        alert('Error cleaning up settings: ' + data.error);
      }
    } catch (error) {
      console.error('Error cleaning up settings:', error);
      alert('Error cleaning up settings');
    }
  };

  const showCompetitionEndedModal = () => {
    // Create a beautiful competition ended modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: white;
      padding: 0;
      border-radius: 20px;
      border: 2px solid #22c55e;
      z-index: 10000;
      max-width: 500px;
      width: 90vw;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Header with trophy icon
    const header = document.createElement('div');
    header.style.cssText = `
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      padding: 30px 20px 20px;
      text-align: center;
      position: relative;
    `;
    
    const trophyIcon = document.createElement('div');
    trophyIcon.style.cssText = `
      font-size: 4rem;
      margin-bottom: 15px;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
    `;
    trophyIcon.textContent = '🏆';
    
    const title = document.createElement('h2');
    title.style.cssText = `
      margin: 0;
      font-size: 1.8rem;
      font-weight: bold;
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    `;
    title.textContent = 'Competition Ended!';
    
    header.appendChild(trophyIcon);
    header.appendChild(title);
    
    // Content
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 30px 25px;
      text-align: center;
    `;
    
    const message = document.createElement('p');
    message.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 1.1rem;
      color: #e5e7eb;
      line-height: 1.6;
    `;
    message.textContent = 'The quiz competition has reached its goal and is now closed. No more quiz attempts are allowed.';
    
    const rewardMessage = document.createElement('p');
    rewardMessage.style.cssText = `
      margin: 0 0 25px 0;
      font-size: 1rem;
      color: #22c55e;
      font-weight: bold;
      padding: 15px;
      background: rgba(34, 197, 94, 0.1);
      border-radius: 10px;
      border: 1px solid rgba(34, 197, 94, 0.3);
    `;
    rewardMessage.textContent = '🎉 Rewards will be airdropped soon to the winners!';
    
    const rocketIcon = document.createElement('div');
    rocketIcon.style.cssText = `
      font-size: 2rem;
      margin-bottom: 20px;
      animation: bounce 2s infinite;
    `;
    rocketIcon.textContent = '🚀';
    
    // Add bounce animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
      }
    `;
    document.head.appendChild(style);
    
    content.appendChild(message);
    content.appendChild(rewardMessage);
    content.appendChild(rocketIcon);
    
    // Button
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      padding: 0 25px 25px;
      text-align: center;
    `;
    
    const okButton = document.createElement('button');
    okButton.style.cssText = `
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      border: none;
      padding: 15px 40px;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    `;
    okButton.textContent = '🎯 View Leaderboard';
    
    // Button hover effects
    okButton.onmouseenter = () => {
      okButton.style.transform = 'translateY(-2px)';
      okButton.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
    };
    
    okButton.onmouseleave = () => {
      okButton.style.transform = 'translateY(0)';
      okButton.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
    };
    
    okButton.onclick = () => {
      closeModal();
      setActiveTab('leaderboard');
    };
    
    buttonContainer.appendChild(okButton);
    
    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(content);
    modal.appendChild(buttonContainer);
    
    // Add overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9999;
      backdrop-filter: blur(5px);
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    // Close functionality
    const closeModal = () => {
      document.body.removeChild(overlay);
      document.body.removeChild(modal);
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
    
    overlay.onclick = closeModal;
    
    // Auto-close after 10 seconds
    setTimeout(() => {
      if (document.body.contains(modal)) {
        closeModal();
      }
    }, 10000);
  };



  return (
    <div className="dashboard-container">
      <Header />
      
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-right">
              <div className="wallet-info">
                <div className="wallet-address">
                  <span className="address-label">Connected:</span>
                  <span className="address-value">{formatAddress(connectedAddress)}</span>
                  <button 
                    className="copy-button"
                    onClick={copyToClipboard}
                    title="Copy address"
                  >
                    {copied ? '✓' : '📋'}
                  </button>
                </div>
                
                {/* Admin Functions - Only visible to admin users */}
                {ADMIN_ADDRESSES.includes(connectedAddress) && (
                  <div className="admin-buttons">
                    <button
                      onClick={() => setActiveTab('airdrop')}
                      className={`admin-button ${activeTab === 'airdrop' ? 'active' : ''}`}
                    >
                      🎁 Airdrop
                    </button>
                    <button
                      onClick={() => setActiveTab('quiz-management')}
                      className={`admin-button ${activeTab === 'quiz-management' ? 'active' : ''}`}
                    >
                      ⚙️ Quiz Management
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Progress Bar */}
          <div className="progress-bar-container">
            {/* Progress Mode Toggle */}
            <div className="progress-toggle" style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1rem',
              gap: '0.5rem'
            }}>
              <button
                onClick={() => setProgressMode('competition')}
                style={{
                  background: progressMode === 'competition' ? '#10b981' : '#374151',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                🏆 Competition Progress
              </button>
              <button
                onClick={() => setProgressMode('level')}
                style={{
                  background: progressMode === 'level' ? '#10b981' : '#374151',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                🥇 Rank Progress
              </button>
            </div>

            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: progressMode === 'competition' 
                    ? `${Math.min((userQuizPoints || 0) / endGoalPoints * 100, 100)}%`
                    : userRank === 1 
                      ? '100%'
                      : userRank === 2
                        ? '95%'
                        : userRank === 3
                          ? '90%'
                          : userRank <= 10
                            ? `${Math.max(10, 100 - (userRank * 5))}%`
                            : `${Math.max(5, 100 - (userRank * 2))}%`
                }}
              ></div>
            </div>
            
            <div className="progress-label">
              {progressMode === 'competition' ? (
                <>
                  <span>🏆 Competition Progress: {((userQuizPoints || 0) / endGoalPoints * 100).toFixed(2)}%</span>
                  <span>{(userQuizPoints || 0).toLocaleString()} / {endGoalPoints.toLocaleString()} points</span>
                </>
              ) : (
                <>
                  <span>⭐ Rank #{userRank || '?'} | {levelName}</span>
                  <span>
                    {userRank === 1 
                      ? '🥇 First Place!'
                      : userRank === 2
                        ? '🥈 Second Place!'
                        : userRank === 3
                          ? '🥉 Third Place!'
                          : pointsToNextLevel > 0 
                            ? `${pointsToNextLevel.toLocaleString()} points to surpass rank #${userRank - 1}`
                            : 'Ranking up! 🎉'
                    }
                  </span>
                </>
              )}
            </div>
            
            {/* Level Info Display */}
            <div className="level-info" style={{
              textAlign: 'center',
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <span style={{ 
                color: '#10b981', 
                fontWeight: '600',
                fontSize: '0.875rem'
              }}>
                {progressMode === 'competition' 
                  ? `Rank #${userRank || '?'} | ${levelName} | ${(userQuizPoints || 0).toLocaleString()} points`
                  : userRank === 1 
                    ? '🥇 First Place - Champion!'
                    : tiedUsers > 1 
                      ? `Rank #${userRank} (tied with ${tiedUsers} users) | ${levelName}`
                      : `Rank #${userRank} | ${levelName} | ${(userQuizPoints || 0).toLocaleString()} points`
                }
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            {/* Main Functions - Available to all users */}
            <button
              onClick={() => setActiveTab('analytics')}
              className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
            >
              Current Majority Holder
            </button>
            
            <Link href="/mas/swap" className="tab-link">
              <button className="tab-button">
                Swap
              </button>
            </Link>
            
            <button
              onClick={() => setActiveTab('quiz')}
              className={`tab-button ${activeTab === 'quiz' ? 'active' : ''}`}
            >
              🎯 Play Quiz
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`tab-button ${activeTab === 'leaderboard' ? 'active' : ''}`}
            >
              🏆 Leaderboard
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className={`tab-button ${activeTab === 'rewards' ? 'active' : ''}`}
            >
              💰 Rewards
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'analytics' && (
            <div className="analytics-content">
              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon">👑</div>
                    <span className="stat-title">Current CEO</span>
                    <span className="stat-info">ⓘ</span>
                  </div>
                  <p className="stat-value address-value">
                    {dashboardData.currentMajorityHolder.address}
                  </p>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon">🔒</div>
                    <span className="stat-title">Total Tokens Locked</span>
                    <span className="stat-info">ⓘ</span>
                  </div>
                  <p className="stat-value">
                    {dashboardData.currentMajorityHolder.lockedHoldings.toLocaleString()}
                  </p>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon">📊</div>
                    <span className="stat-title">Total Supply Locked</span>
                    <span className="stat-info">ⓘ</span>
                  </div>
                  <p className="stat-value">
                    {dashboardData.currentMajorityHolder.percentageOfSupply}%
                  </p>
                </div>
              </div>

              {/* New Vertical Bar Chart Revenue Display */}
              <div className="fee-dashboard">
                <div className="dashboard-header">
                  <div className="title-section">
                    <span className="chart-icon">📊</span>
                    <h2>Protocol Profit Over Time</h2>
                  </div>
                  
                  <div className="controls">
                    <button 
                      onClick={loadFeePoolHistory}
                      className="refresh-button"
                      disabled={historyLoading}
                    >
                      <span className="refresh-icon">🔄</span>
                      {historyLoading ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                </div>

                <div className="chart-container">
                  {feePoolHistory.length > 0 ? (
                    <div className="line-chart">
                      <svg className="chart-svg" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
                        {/* Grid lines */}
                        {[0, 1, 2, 3, 4].map((i) => (
                          <line
                            key={`grid-${i}`}
                            x1="0"
                            y1={60 + i * 60}
                            x2="800"
                            y2={60 + i * 60}
                            stroke="rgba(255, 255, 255, 0.15)"
                            strokeWidth="1"
                          />
                        ))}
                        
                        {/* Data points and line */}
                        {(() => {
                          const data = feePoolHistory.slice(0, 7).reverse();
                          const maxValue = Math.max(...data.map(h => h.fee_pool_amount));
                          const minValue = Math.min(...data.map(h => h.fee_pool_amount));
                          const valueRange = maxValue - minValue;
                          
                          const points = data.map((item, index) => {
                            const x = 50 + (index * 125);
                            const y = 300 - 60 - ((item.fee_pool_amount - minValue) / valueRange * 180);
                            return { x, y, item };
                          });
                          
                          // Create path for the line
                          const pathData = points.map((point, index) => 
                            `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                          ).join(' ');
                          
                          return (
                            <>
                              {/* Line */}
                              <path
                                d={pathData}
                                stroke="#3b82f6"
                                strokeWidth="3"
                                fill="none"
                                className="chart-line"
                              />
                              
                              {/* Data points */}
                              {points.map((point, index) => (
                                <g key={index}>
                                  <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r="6"
                                    fill="#3b82f6"
                                    stroke="#1d4ed8"
                                    strokeWidth="2"
                                    className="data-point"
                                  />
                                  
                                  {/* Value labels */}
                                  <text
                                    x={point.x}
                                    y={point.y - 15}
                                    textAnchor="middle"
                                    fill="#e2e8f0"
                                    fontSize="12"
                                    fontWeight="bold"
                                    className="value-label"
                                  >
                                    {point.item.fee_pool_amount >= 1000 
                                      ? `${(point.item.fee_pool_amount / 1000).toFixed(1)}K` 
                                      : point.item.fee_pool_amount.toString()}
                                  </text>
                                  
                                  {/* Date labels */}
                                  <text
                                    x={point.x}
                                    y="290"
                                    textAnchor="middle"
                                    fill="#94a3b8"
                                    fontSize="11"
                                    className="date-label"
                                  >
                                    {new Date(point.item.recorded_at).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </text>
                                </g>
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '2rem',
                      color: '#9ca3af'
                    }}>
                      {historyLoading ? 'Loading chart data...' : 'No chart data available'}
            </div>
          )}
                </div>

                <div className="summary-section">
                  <div className="summary-item">
                    <span className="summary-label">Current Revenue:</span>
                    <span className="summary-value current">
                      {rewardLoading ? 'Updating...' : `${sbtcFeePool.toLocaleString()} sats`}
                    </span>
                  </div>
                  
                  <div className="summary-item">
                    <span className="summary-label">Peak Revenue:</span>
                    <span className="summary-value peak">
                      {feePoolHistory.length > 0 
                        ? `${Math.max(...feePoolHistory.map(h => h.fee_pool_amount)).toLocaleString()} sats`
                        : 'N/A'
                      }
                    </span>
                  </div>
                  
                  <div className="summary-item">
                    <span className="summary-label">Growth (7-day period):</span>
                    <span className="summary-value growth">
                      {feePoolHistory.length >= 2 
                        ? (() => {
                            const first = feePoolHistory[feePoolHistory.length - 1]?.fee_pool_amount || 0;
                            const last = feePoolHistory[0]?.fee_pool_amount || 0;
                            const growth = first > 0 ? ((last - first) / first * 100) : 0;
                            return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
                          })()
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}



          {activeTab === 'airdrop' && (
            <>
              {/* Admin access check */}
              {ADMIN_ADDRESSES.includes(connectedAddress) ? (
                <div className="airdrop-content">
                  <div className="airdrop-header">
                    <h2>🎁 Airdrop</h2>
                    <p>Select your airdrop option below</p>
                  </div>

                  <div className="airdrop-selection">
                      <div className="airdrop-dropdown-container">
                        <label className="airdrop-label">Select Airdrop Type:</label>
                        <div className="airdrop-options">
                          <div 
                            className={`airdrop-option ${airdropType === 'mas-sats' ? 'selected' : ''}`}
                            onClick={() => setAirdropType('mas-sats')}
                          >
                            <img src="/icons/mas_sats.png" alt="MAS Sats" className="mas-sats-logo" />
                            <span>MAS Sats</span>
                          </div>
                          <div 
                            className={`airdrop-option ${airdropType === 'request' ? 'selected' : ''}`}
                            onClick={() => setAirdropType('request')}
                          >
                            <span>Add Your Coin</span>
                          </div>
                        </div>
                      </div>

                    {airdropType === 'mas-sats' && (
                      <div className="mas-sats-section">
                        <h3>send-many (public function)</h3>

                        <div className="global-amount-section">
                          <h4>Amount (for all recipients)</h4>
                          <div className="field-group">
                            <input
                              type="number"
                              placeholder="Enter amount in sats"
                              value={globalAmount}
                              onChange={(e) => setGlobalAmount(e.target.value)}
                              className="global-amount-input"
                            />
                          </div>
                        </div>

                        <div className="bulk-addresses-section">
                          <h4>Bulk Address Import</h4>
                          <div className="field-group">
                            <label>Paste wallet addresses (one per line or comma-separated)</label>
                            <textarea
                              placeholder="SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B&#10;SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQYH0ADK&#10;SP3K1BC1PHC9JEG074KVR5VP9ZT6B2HB9A9RE5GVP"
                              value={bulkAddresses}
                              onChange={(e) => setBulkAddresses(e.target.value)}
                              className="bulk-addresses-input"
                              rows="4"
                            />
                            <button
                              className="process-addresses-button"
                              onClick={() => {
                                if (bulkAddresses.trim()) {
                                  // Split by newlines and commas, then clean up
                                  const addresses = bulkAddresses
                                    .split(/[\n,]/)
                                    .map(addr => addr.trim())
                                    .filter(addr => addr.length > 0);
                                  
                                  // Create recipient entries for each address
                                  const newRecipients = addresses.map(addr => ({
                                    to: addr
                                  }));
                                  
                                  setRecipients(newRecipients);
                                  setBulkAddresses('');
                                }
                              }}
                            >
                              Process Addresses
                            </button>
                          </div>
                        </div>

                        <div className="recipients-section">
                          <h4>Recipients ({recipients.length})</h4>
                          {recipients.map((recipient, index) => (
                            <div key={index} className="recipient-entry">
                              <div className="recipient-header">
                                <span>recipients.{index}</span>
                                {recipients.length > 1 && (
                                  <button
                                    className="remove-recipient"
                                    onClick={() => {
                                      const newRecipients = recipients.filter((_, i) => i !== index);
                                      setRecipients(newRecipients);
                                    }}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                              
                              <div className="recipient-fields">
                                <div className="field-group">
                                  <label>recipients.{index}: to</label>
                                  <input
                                    type="text"
                                    placeholder="principal"
                                    value={recipient.to}
                                    onChange={(e) => {
                                      const newRecipients = [...recipients];
                                      newRecipients[index].to = e.target.value;
                                      setRecipients(newRecipients);
                                    }}
                                    className="recipient-input"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <button
                            className="add-recipient-button"
                            onClick={() => setRecipients([...recipients, { to: '' }])}
                          >
                            + Add individual recipient
                          </button>
                        </div>

                        <button 
                          className="call-function-button"
                          onClick={() => {
                            setIsCallingFunction(true);
                            // Here you would integrate with the actual contract call
                            const recipientsWithAmount = recipients.map(recipient => ({
                              ...recipient,
                              amount: globalAmount
                            }));
                            
                            console.log('Calling send-many function with:', {
                              contractAddress: 'SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B.mas-sats',
                              recipients: recipientsWithAmount,
                              allowMode: true,
                              globalAmount
                            });
                            setTimeout(() => setIsCallingFunction(false), 2000);
                          }}
                          disabled={isCallingFunction}
                        >
                          {isCallingFunction ? 'Calling function...' : 'Call function'}
                        </button>
                      </div>
                    )}

                    {airdropType === 'request' && (
                      <div className="request-section">
                        <h3>Add Your Coin</h3>
                        <p className="request-description">
                          Free of charge for 21+ MAS sats holders. Please email us with your token ID and project socials.
                        </p>
                        <button 
                          className="contact-support-button"
                          onClick={() => setShowSupportModal(true)}
                        >
                          Contact Support
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Support Modal */}
                  {showSupportModal && (
                    <div className="modal-overlay" onClick={() => setShowSupportModal(false)}>
                      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                          <h3>Token Listing Request</h3>
                          <button 
                            className="modal-close"
                            onClick={() => setShowSupportModal(false)}
                          >
                            ×
                          </button>
                        </div>
                        <div className="modal-body">
                          <p>To submit your token for listing consideration, please provide the following information:</p>
                          
                          <div className="requirements-section">
                            <h4>Required Information:</h4>
                            <ul>
                              <li><strong>Token ID:</strong> Your project's unique token identifier</li>
                              <li><strong>Project Documentation:</strong> Whitepaper, roadmap, or project overview</li>
                              <li><strong>Social Media Presence:</strong> Official Twitter, Telegram, Discord, or website links</li>
                            </ul>
                          </div>
                          
                          <div className="email-info">
                            <h4>Submit Your Request</h4>
                            <p>Please send all required information to:</p>
                            <div className="email-address">
                              <strong>teikonakamoto@tutamail.com</strong>
                            </div>
                          </div>
                          
                          <div className="eligibility-note">
                            <p><strong>Eligibility:</strong> This service is complimentary for verified holders of 21,000+ MAS sats.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="access-denied">
                  <h2>🔒 Access Denied</h2>
                  <p>You need admin privileges to access the airdrop functionality.</p>
                </div>
              )}
            </>
          )}

          {/* Quiz Tab Content */}
          {activeTab === 'quiz' && (
            <div className="quiz-content">
              <div className="quiz-header">
              </div>



              {!connectedAddress ? (
                <div className="wallet-warning">
                  <h3>🔗 Connect Your Wallet</h3>
                  <p>Please connect your wallet to participate in the quiz competition.</p>
                </div>
              ) : gameState === 'loading' ? (
                <div className="quiz-selection">
                  <h3>Available Quizzes</h3>
                    <div className="quizzes-grid">
                      {quizzes.map((quiz) => (
                        <div key={quiz.id} className="quiz-card">
                        <div className="quiz-card-inner">
                          <div className="quiz-card-header">
                          <h4>{quiz.title}</h4>
                          <div className="quiz-stats">
                              <span className="stat"><span className="stat-label">Time:</span><span className="stat-value">{quiz.time_per_question}s</span></span>
                              <span className="stat"><span className="stat-label">Points:</span><span className="stat-value">{rewardLoading ? 'Updating...' : sbtcFeePool.toLocaleString()}</span></span>
                              <span className="stat"><span className="stat-label">Status:</span><span className="stat-value">Visible</span></span>
                          </div>
                          </div>
                          {quiz.description && <p className="quiz-description">{quiz.description}</p>}
                          <button 
                            onClick={() => startQuiz(quiz.id)}
                            className="start-quiz-button"
                          >
                            Start Quiz
                          </button>
                        </div>
                        </div>
                      ))}
                    </div>
                </div>
              ) : gameState === 'playing' ? (
                <div className="quiz-game">
                  <div className="game-header">
                    <h3>{selectedQuiz.title}</h3>
                    <div className="game-stats">
                      <span>Question {currentQuestion + 1} of {quizQuestions.length}</span>
                      <span>Score: {score}</span>
                      <span className="timer">Time: {timeLeft}s</span>
                    </div>
                  </div>
                  
                  <div className="question-container">
                    <h4>{quizQuestions[currentQuestion].questionText}</h4>
                    <div className="answers-grid">
                      {quizQuestions[currentQuestion].answers.map((answer, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswer(answer)}
                          className="answer-button"
                        >
                          {answer}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : gameState === 'failed' ? (
                <div className="quiz-result failed">
                  <h3>❌ Quiz Failed</h3>
                  <p>You missed the last question. Return to quiz selection to try another quiz!</p>
                  <div className="result-actions">
                    <button onClick={goToQuizSelection} className="return-to-quiz-button">
                      Return to Quiz Page
                    </button>
                    <button onClick={() => setActiveTab('leaderboard')} className="view-leaderboard-button">
                      View Leaderboard
                    </button>
                  </div>
                </div>
              ) : gameState === 'perfect' ? (
                <div className="quiz-result perfect">
                  <h3>🎉 Perfect Score!</h3>
                  <p>Congratulations! You got 100% correct and earned {sbtcFeePool.toLocaleString()} points!</p>
                  <div className="result-actions">
                    <button onClick={goToQuizSelection} className="return-to-quiz-button">
                      Return to Quiz Page
                    </button>
                    <button onClick={() => setActiveTab('leaderboard')} className="view-leaderboard-button">
                      View Leaderboard
                    </button>
                  </div>
                </div>
              ) : gameState === 'completed' ? (
                <div className="quiz-result completed">
                  <h3>✅ Quiz Completed!</h3>
                  <p>Good job! You earned {sbtcFeePool.toLocaleString()} points!</p>
                  <div className="result-actions">
                    <button onClick={goToQuizSelection} className="return-to-quiz-button">
                      Return to Quiz Page
                    </button>
                    <button onClick={() => setActiveTab('leaderboard')} className="view-leaderboard-button">
                      View Leaderboard
                    </button>
                  </div>
                </div>
              ) : gameState === 'competition-ended' ? (
                <div className="quiz-result competition-ended" style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                  border: '2px solid #22c55e',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center'
                }}>
                  <h3 style={{ color: '#22c55e', fontSize: '1.8rem', marginBottom: '1rem' }}>
                    🏆 Competition Ended!
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: '1.1rem', marginBottom: '1rem' }}>
                    The quiz competition has reached its goal and is now closed.
                  </p>
                  <p style={{ color: '#059669', fontSize: '1rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                    No more quiz attempts are allowed. Winners will be announced soon!
                  </p>
                  <div className="result-actions">
                    <button onClick={() => setActiveTab('leaderboard')} className="view-leaderboard-button">
                      🏆 View Final Leaderboard
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Leaderboard Tab Content */}
          {activeTab === 'leaderboard' && (
            <div className="leaderboard-content">
              <div className="leaderboard-header">
                <h2>🏆 Quiz Leaderboard</h2>
                <div className="competition-status">
                  <span className={`status ${competitionActive ? 'active' : 'ended'}`}>
                    {competitionActive ? 'Competition Active' : 'Competition Ended'}
                  </span>
                  <span>Total Points: {totalPointsEarned.toLocaleString()}</span>
                  <span>Participants: {totalParticipants}</span>
                </div>
              </div>

              <div className="leaderboard-table">
                <div className="table-header">
                  <span>Rank</span>
                  <span>Wallet Address</span>
                  <span>Points</span>
                  <span>Quizzes</span>
                  <span>Perfect Scores</span>
                </div>
                {leaderboard.length === 0 ? (
                  <div className="no-leaderboard">
                    <p>No participants yet. Be the first to play!</p>
                  </div>
                ) : (
                  leaderboard.map((user, index) => (
                    <div key={index} className="leaderboard-row">
                      <span className="rank">#{user.rank}</span>
                      <span className="address">{formatAddress(user.walletAddress)}</span>
                      <span className="points">{user.totalPoints}</span>
                      <span className="quizzes">{user.totalQuizzesCompleted}</span>
                      <span className="perfect">{user.perfectScores}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Rewards Tab Content */}
          {activeTab === 'rewards' && (
            <div className="rewards-content">
              <div className="rewards-header">
                <h2>💰 Expected Rewards</h2>
                <p>Current reward: {rewardLoading ? 'Updating...' : `${Math.floor((sbtcFeePool || 0)).toLocaleString()} points`} (1:1 of {rewardLoading ? '...' : `${(sbtcFeePool || 0).toLocaleString()} fee pool`})</p>
                <p style={{ color: '#9CA3AF', marginTop: '6px' }}>
                  Rewards will only be given to users who own at least 21,000 MAS SATS.
                </p>
                
                {/* Airdrop Notice */}
                <div className="airdrop-notice">
                  <div className="airdrop-notice-content">
                    <span className="airdrop-icon">🚀</span>
                    <div className="airdrop-text">
                      <strong>Rewards will be airdropped soon!</strong>
                      <p>Winners will receive their sBTC rewards directly to their wallets once the competition ends.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rewards-table-wrapper">
                <div className="rewards-table">
                <div className="table-header">
                  <span>Rank</span>
                  <span>Wallet Address</span>
                  <span>Share of Rewards</span>
                  <span>Expected Reward</span>
                </div>
                {leaderboard.length === 0 ? (
                  <div className="no-rewards">
                    <p>No participants yet. Be the first to play!</p>
                  </div>
                ) : (
                  // Always show 10 rows to indicate 10 winners, even if empty
                  Array.from({ length: 10 }, (_, index) => {
                    const user = leaderboard[index];
                    const top10Players = leaderboard.slice(0, 10);
                    const top10TotalPoints = top10Players.reduce((sum, u) => sum + u.totalPoints, 0);
                    
                    // Calculate user's share of top 10 points (capped at 10th place)
                    const userShare = user && top10TotalPoints > 0 ? (user.totalPoints / top10TotalPoints * 100) : 0;
                    
                    // Calculate expected reward based on their share of the prize pot (1:1 of fee pool)
                    const prizePot = Math.floor((sbtcFeePool || 0)); // 1:1 of fee pool
                    const expectedReward = Math.floor(prizePot * (userShare / 100));
                    
                    return (
                      <div key={index} className={`rewards-row ${!user ? 'empty-row' : ''}`}>
                        <span className="rank">#{index + 1}</span>
                        <span className="address">
                          {user ? (
                            <>
                              {formatAddress(user.walletAddress)}
                              <button 
                                className="copy-address-button"
                                onClick={() => {
                                  navigator.clipboard.writeText(user.walletAddress);
                                  // You could add a toast notification here
                                }}
                                title="Copy address"
                              >
                                📋
                              </button>
                              <a 
                                href={`https://explorer.stacks.co/address/${user.walletAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="explorer-link"
                                title="View on Stacks Explorer"
                              >
                                🔗
                              </a>
                            </>
                          ) : (
                            <span className="empty-placeholder">No player yet</span>
                          )}
                        </span>
                        <span className="reward-share">
                          {user ? `${userShare.toFixed(1)}%` : '0%'}
                        </span>
                        <span className="expected-reward">
                          {rewardLoading ? 'Calculating...' : user ? `${expectedReward.toLocaleString()} sats` : '0 sats'}
                        </span>
                      </div>
                    );
                  })
                )}
                </div>
              </div>

              <div className="rewards-footer">
                <button 
                  onClick={loadDynamicReward}
                  disabled={rewardLoading}
                  className="refresh-rewards-button"
                >
                  {rewardLoading ? '🔄 Updating...' : '🔄 Refresh Rewards'}
                </button>
              </div>
            </div>
          )}

          {/* Quiz Management Tab Content */}
          {activeTab === 'quiz-management' && (
            <>
              {/* Admin access check */}
              {ADMIN_ADDRESSES.includes(connectedAddress) ? (
                <div className="quiz-management-content">
                  <div className="management-header">
                    <h2>⚙️ Quiz Management</h2>
                    <p>Create and manage quizzes for the competition</p>
                  </div>

                  <div className="management-actions">
                    <button 
                      onClick={() => setShowQuizForm(true)} 
                      className="create-quiz-button"
                    >
                      ➕ Create New Quiz
                    </button>
                    
                    <button 
                      onClick={toggleCompetitionStatus}
                      disabled={updatingCompetitionStatus}
                      className="toggle-competition-button"
                      style={{
                        background: competitionStatus === 'active' 
                          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                          : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        cursor: updatingCompetitionStatus ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        marginLeft: '1rem',
                        opacity: updatingCompetitionStatus ? 0.6 : 1
                      }}
                    >
                      {updatingCompetitionStatus ? '⏳' : (competitionStatus === 'active' ? '⏹️ End Competition' : '▶️ Activate Competition')}
                    </button>
                    
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to reactivate the leaderboard? This will reset the competition status to active.')) {
                          toggleCompetitionStatus();
                        }
                      }}
                      className="reactivate-leaderboard-button"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        marginLeft: '1rem'
                      }}
                    >
                      🏆 Reactivate Leaderboard
                    </button>
                    
                    <button 
                      onClick={() => setShowEndGoalForm(true)} 
                      className="end-goal-button"
                    >
                      🎯 Set End Goal
                    </button>
                    
                    <button 
                      onClick={debugEndGoal} 
                      className="debug-button"
                    >
                      🔍 Debug End Goal
                    </button>
                    
                    <button 
                      onClick={updateCompetitionStatus} 
                      className="update-status-button"
                    >
                      🔄 Update Competition Status
                    </button>
                    
                    <button 
                      onClick={checkSettings} 
                      className="check-settings-button"
                    >
                      🔍 Check Settings
                    </button>
                    
                    <button 
                      onClick={initCompetitionStatus} 
                      className="init-status-button"
                    >
                      🔧 Init Status
                    </button>
                    
                    <button 
                      onClick={fixCompetitionActive} 
                      className="fix-active-button"
                    >
                      🔧 Fix Active
                    </button>
                    
                    <button 
                      onClick={fixSchema} 
                      className="fix-schema-button"
                    >
                      🔧 Fix Schema
                    </button>
                    
                    <button 
                      onClick={setStatusActive} 
                      className="set-status-button"
                    >
                      ✅ Set Active
                    </button>
                    
                    <button 
                      onClick={debugDatabase} 
                      className="debug-database-button"
                    >
                      🔍 Debug DB
                    </button>
                    
                    <button 
                      onClick={cleanupSettings} 
                      className="cleanup-settings-button"
                      style={{
                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        marginLeft: '1rem'
                      }}
                    >
                      🧹 Cleanup Settings
                    </button>
                  </div>

                  {/* End Goal Configuration */}
                  {showEndGoalForm && (
                    <div className="form-modal">
                      <div className="form-content">
                        <div className="form-header">
                          <h3>Set Competition End Goal</h3>
                          <button 
                            onClick={() => setShowEndGoalForm(false)}
                            className="close-button"
                          >
                            ×
                          </button>
                        </div>
                        
                        <form onSubmit={updateEndGoal} className="end-goal-form">
                          <div className="form-group">
                            <label>End Goal Points *</label>
                            <div style={{ 
                              background: '#f3f4f6', 
                              padding: '0.5rem', 
                              borderRadius: '4px', 
                              marginBottom: '0.5rem',
                              fontSize: '0.9rem',
                              color: '#6b7280'
                            }}>
                              Current value: {endGoalPoints.toLocaleString()} points
                            </div>
                            <input
                              type="number"
                              value={endGoalPoints}
                              onChange={(e) => setEndGoalPoints(parseInt(e.target.value))}
                              required
                              min="1000"
                              max="100000000"
                              placeholder="Enter end goal points"
                            />
                            <small>When any user reaches this many points, the competition will end.</small>
                          </div>
                          
                          <div className="form-actions">
                            <button 
                              type="submit" 
                              className="submit-button"
                              disabled={endGoalLoading}
                            >
                              {endGoalLoading ? '🔄 Updating...' : 'Update End Goal'}
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setShowEndGoalForm(false)}
                              className="cancel-button"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Quiz Creation Form */}
                  {showQuizForm && (
                    <div className="form-modal">
                      <div className="form-content">
                        <div className="form-header">
                          <h3>Create New Quiz</h3>
                          <button 
                            onClick={() => setShowQuizForm(false)}
                            className="close-button"
                          >
                            ×
                          </button>
                        </div>
                        
                        <form onSubmit={createQuiz} className="quiz-form">
                          <div className="form-group">
                            <label>Quiz Title *</label>
                            <input
                              type="text"
                              value={quizForm.title}
                              onChange={(e) => setQuizForm({...quizForm, title: e.target.value})}
                              required
                              placeholder="Enter quiz title"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Max Questions</label>
                            <input
                              type="number"
                              value={quizForm.maxQuestions}
                              onChange={(e) => setQuizForm({...quizForm, maxQuestions: parseInt(e.target.value)})}
                              min="1"
                              max="10"
                            />
                          </div>
                          
                          <div className="form-actions">
                            <button type="submit" className="submit-button">
                              Create Quiz
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setShowQuizForm(false)}
                              className="cancel-button"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Question Addition Form */}
                  {showQuestionForm && selectedQuiz && (
                    <div className="form-modal">
                      <div className="form-content">
                        <div className="form-header">
                          <h3>Add Question to: {selectedQuiz.title}</h3>
                          <button 
                            onClick={() => setShowQuestionForm(false)}
                            className="close-button"
                          >
                            ×
                          </button>
                        </div>
                        
                        <form onSubmit={addQuestion} className="question-form">
                          <div className="form-group">
                            <label>Question Text *</label>
                            <textarea
                              value={questionForm.questionText}
                              onChange={(e) => setQuestionForm({...questionForm, questionText: e.target.value})}
                              required
                              placeholder="Enter the question"
                              rows="3"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Correct Answer *</label>
                            <input
                              type="text"
                              value={questionForm.correctAnswer}
                              onChange={(e) => setQuestionForm({...questionForm, correctAnswer: e.target.value})}
                              required
                              placeholder="Enter correct answer"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Wrong Answer 1 *</label>
                            <input
                              type="text"
                              value={questionForm.wrongAnswer1}
                              onChange={(e) => setQuestionForm({...questionForm, wrongAnswer1: e.target.value})}
                              required
                              placeholder="Enter wrong answer 1"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Wrong Answer 2 *</label>
                            <input
                              type="text"
                              value={questionForm.wrongAnswer2}
                              onChange={(e) => setQuestionForm({...questionForm, wrongAnswer2: e.target.value})}
                              required
                              placeholder="Enter wrong answer 2"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Wrong Answer 3 *</label>
                            <input
                              type="text"
                              value={questionForm.wrongAnswer3}
                              onChange={(e) => setQuestionForm({...questionForm, wrongAnswer3: e.target.value})}
                              required
                              placeholder="Enter wrong answer 3"
                            />
                          </div>
                          

                          
                          <div className="form-actions">
                            <button type="submit" className="submit-button">
                              Add Question
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setShowQuestionForm(false)}
                              className="cancel-button"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Quizzes List */}
                  <div className="quizzes-section">
                    <h3>Existing Quizzes</h3>
                    
                    {quizzes.length === 0 ? (
                      <div className="no-quizzes">
                        <p>No quizzes created yet. Create your first quiz!</p>
                      </div>
                    ) : (
                      <div className="quizzes-grid">
                        {quizzes.map((quiz) => (
                          <div key={quiz.id} className="quiz-card">
                            <div className="quiz-header">
                              <h4>{quiz.title}</h4>
                              <div className="quiz-status-badges">
                                <span className={`status ${quiz.is_active ? 'active' : 'inactive'}`}>
                                  {quiz.is_active ? 'Active' : 'Inactive'}
                                </span>
                                <span className={`visibility-status ${quiz.is_visible ? 'visible' : 'hidden'}`}>
                                  {quiz.is_visible ? '👁️ Visible' : '🙈 Hidden'}
                                </span>
                              </div>
                            </div>
                            {quiz.description && (
                              <p className="quiz-description">{quiz.description}</p>
                            )}
                            
                            {/* Tabs: Details | AI Questions */}
                            <div className="quiz-tabs">
                              <button
                                className={`quiz-tab ${!aiPanelOpen[quiz.id] ? 'active' : ''}`}
                                onClick={() => toggleAiPanel(quiz.id, false)}
                              >
                                Details
                              </button>
                              <button
                                className={`quiz-tab ${aiPanelOpen[quiz.id] ? 'active' : ''}`}
                                onClick={() => toggleAiPanel(quiz.id, true)}
                              >
                                🤖 AI Questions
                              </button>
                            </div>
                            {!aiPanelOpen[quiz.id] && (
                            <div className="quiz-stats">
                              <span>Questions: {quiz.max_questions}</span>
                              <span>Time: {quiz.time_per_question}s</span>
                                <span>Reward: Dynamic (1:1 of sBTC fee pool)</span>
                            </div>
                            )}

                            {aiPanelOpen[quiz.id] && (
                              <div className="ai-chat-panel">
                                <div className="ai-chat-header">AI Question Assistant</div>
                                {aiResult && (
                                  <div className="ai-chat-messages"><div className="ai-message">{aiResult}</div></div>
                                )}
                                <div className="ai-chat-input">
                                  <textarea 
                                    placeholder="Describe the topic or paste content to generate questions..." 
                                    rows={3}
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                  ></textarea>
                                  <div className="ai-chat-actions">
                                    <button 
                                      className="generate-questions-button"
                                      disabled={aiLoading || !aiPrompt.trim()}
                                      onClick={async () => {
                                        try {
                                          setAiLoading(true);
                                          setAiResult('');
                                          const res = await fetch('/api/quiz/generate-questions', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ prompt: aiPrompt }),
                                          });
                                          const data = await res.json();
                                          if (data.success) {
                                            setAiResult(data.text || '');
                                          } else {
                                            setAiResult(`Error: ${data.error || 'Unknown error'}`);
                                          }
                                        } catch (err) {
                                          setAiResult(`Error: ${err.message}`);
                                        } finally {
                                          setAiLoading(false);
                                        }
                                      }}
                                    >
                                      {aiLoading ? 'Generating…' : 'Generate Questions'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="quiz-actions">
                              <button 
                                onClick={() => selectQuiz(quiz)}
                                className="manage-button"
                              >
                                Manage Questions
                              </button>
                              <button 
                                onClick={() => toggleQuizVisibility(quiz.id, quiz.is_visible)}
                                disabled={updatingVisibility[quiz.id]}
                                className={`visibility-toggle ${quiz.is_visible ? 'hide' : 'show'}`}
                                title={quiz.is_visible ? 'Hide from users' : 'Show to users'}
                                style={{
                                  background: quiz.is_visible 
                                    ? 'linear-gradient(135deg, #dc3545, #c82333)' 
                                    : 'linear-gradient(135deg, #28a745, #20c997)',
                                  color: 'white',
                                  border: 'none',
                                  padding: '8px 16px',
                                  borderRadius: '8px',
                                  fontSize: '0.85rem',
                                  fontWeight: '600',
                                  cursor: updatingVisibility[quiz.id] ? 'not-allowed' : 'pointer',
                                  marginTop: '8px',
                                  width: '100%',
                                  opacity: updatingVisibility[quiz.id] ? 0.6 : 1
                                }}
                              >
                                {updatingVisibility[quiz.id] ? '⏳' : (quiz.is_visible ? '🙈 Hide' : '👁️ Show')}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>



                  {/* Selected Quiz Questions */}
                  {selectedQuiz && (
                    <div className="questions-section">
                      <div className="section-header">
                        <h3>Questions for: {selectedQuiz.title}</h3>
                        <button 
                          onClick={() => setShowQuestionForm(true)}
                          className="add-question-button"
                        >
                          ➕ Add Question
                        </button>
                      </div>
                      
                      {quizQuestions.length === 0 ? (
                        <div className="no-questions">
                          <p>No questions added yet. Add your first question!</p>
                        </div>
                      ) : (
                        <div className="questions-list">
                          {quizQuestions.map((question, index) => (
                            <div key={index} className="question-item">
                              <div className="question-header">
                                <span className="question-number">Q{index + 1}</span>
                                <span className="question-text">{question.questionText}</span>
                              </div>
                              <div className="answers-list">
                                <div className="answer correct">
                                  <span className="answer-label">✓</span>
                                  {question.correctAnswer}
                                </div>
                                {question.answers.filter(a => a !== question.correctAnswer).map((answer, i) => (
                                  <div key={i} className="answer wrong">
                                    <span className="answer-label">✗</span>
                                    {answer}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="access-denied">
                  <h2>🔒 Access Denied</h2>
                  <p>You need admin privileges to access the quiz management functionality.</p>
                </div>
              )}
            </>
          )}


        </div>
      </main>
      <Footer />
    </div>
  );
}
