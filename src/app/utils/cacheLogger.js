// Cache logging utility to track real-time user activity and cache behavior

// Generate user identifier (wallet address or guest ID)
export function getUserIdentifier() {
  if (typeof window === 'undefined') return 'server-side';
  
  // Try to get wallet address first
  const walletAddress = localStorage.getItem('connectedAddress');
  if (walletAddress) {
    return `wallet:${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}`;
  }
  
  // Generate or get guest ID
  let guestId = localStorage.getItem('guestId');
  if (!guestId) {
    guestId = 'guest-' + Math.random().toString(36).substr(2, 8);
    localStorage.setItem('guestId', guestId);
  }
  
  return guestId;
}

// Log cache activity with user tracking
export function logCacheActivity(functionName, action, data = {}) {
  const timestamp = new Date().toISOString();
  const userId = getUserIdentifier();
  const page = getCurrentPage();
  
  const logData = {
    timestamp,
    userId,
    page,
    functionName,
    action, // 'HIT', 'MISS', 'CALL'
    ...data
  };
  
  // Enhanced console logging with colors
  const colors = {
    'HIT': '🟢',
    'MISS': '🔴', 
    'CALL': '🔵'
  };
  
  const color = colors[action] || '⚪';
  const timeStr = new Date().toLocaleTimeString();
  
  console.group(`${color} CACHE ${action} - ${functionName} [${timeStr}]`);
  console.log(`👤 User: ${userId}`);
  console.log(`📄 Page: ${page}`);
  
  if (action === 'HIT') {
    console.log(`⚡ Cache Hit - Data age: ${data.cacheAge}ms`);
    console.log(`🎯 No blockchain call needed`);
  } else if (action === 'MISS') {
    console.log(`🔄 Cache Miss - Data expired or not found`);
    console.log(`📞 Making fresh blockchain call...`);
  } else if (action === 'CALL') {
    console.log(`✅ Blockchain call completed`);
    console.log(`💾 Cached for ${data.cacheDuration}ms`);
  }
  
  if (data.result) {
    console.log(`📊 Result:`, data.result);
  }
  
  console.groupEnd();
  
  // Store activity for admin monitoring (optional)
  if (typeof window !== 'undefined') {
    const activities = JSON.parse(localStorage.getItem('cacheActivities') || '[]');
    activities.push(logData);
    
    // Keep only last 100 activities to prevent storage overflow
    if (activities.length > 100) {
      activities.splice(0, activities.length - 100);
    }
    
    localStorage.setItem('cacheActivities', JSON.stringify(activities));
  }
}

// Get current page name
function getCurrentPage() {
  if (typeof window === 'undefined') return 'server-side';
  
  const path = window.location.pathname;
  
  if (path === '/') return 'Home Page';
  if (path.includes('/swap') || path.includes('/trade')) return 'Token Swap Page';
  if (path.includes('/lock-unlock')) return 'Lock/Unlock Page';
  if (path.includes('/revenue')) return 'Revenue Page';
  if (path.includes('/admin')) return 'Admin Dashboard';
  if (path.includes('/create-project')) return 'Create Project Page';
  
  return `Custom Page (${path})`;
}

// Enhanced blockchain call wrapper with logging
export async function loggedBlockchainCall(functionName, callFunction, cacheDuration = 30000) {
  const cacheKey = `cache_${functionName}`;
  const now = Date.now();
  
  // Check cache first
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const cacheAge = now - timestamp;
      
      if (cacheAge < cacheDuration) {
        logCacheActivity(functionName, 'HIT', { cacheAge });
        return data;
      }
    }
  }
  
  // Cache miss - make fresh call
  logCacheActivity(functionName, 'MISS');
  
  try {
    const result = await callFunction();
    
    // Cache the result
    if (typeof window !== 'undefined') {
      localStorage.setItem(cacheKey, JSON.stringify({
        data: result,
        timestamp: now
      }));
    }
    
    logCacheActivity(functionName, 'CALL', { 
      cacheDuration,
      result: typeof result === 'object' ? 'Object' : result
    });
    
    return result;
  } catch (error) {
    console.error(`❌ Blockchain call failed for ${functionName}:`, error);
    throw error;
  }
}

// Get cache statistics for admin monitoring
export function getCacheStatistics() {
  if (typeof window === 'undefined') return [];
  
  const activities = JSON.parse(localStorage.getItem('cacheActivities') || '[]');
  const last24Hours = activities.filter(activity => 
    Date.now() - new Date(activity.timestamp).getTime() < 24 * 60 * 60 * 1000
  );
  
  // Group by function name
  const stats = {};
  last24Hours.forEach(activity => {
    if (!stats[activity.functionName]) {
      stats[activity.functionName] = { hits: 0, misses: 0, calls: 0 };
    }
    stats[activity.functionName][activity.action.toLowerCase()]++;
  });
  
  return Object.entries(stats).map(([functionName, counts]) => ({
    functionName,
    ...counts,
    hitRate: counts.hits / (counts.hits + counts.misses) * 100 || 0
  }));
}

// Clear cache statistics (admin function)
export function clearCacheStatistics() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cacheActivities');
    console.log('🗑️ Cache statistics cleared');
  }
}
