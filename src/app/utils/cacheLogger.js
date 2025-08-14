// Cache Logger - Enhanced blockchain call wrapper with 15-second caching
// Handles BigInt serialization for blockchain call results

// BigInt serializer for JSON.stringify
function serializeBigInt(obj) {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
}

// BigInt deserializer for JSON.parse
function deserializeBigInt(obj) {
  return JSON.parse(obj, (key, value) => {
    // Convert string numbers back to numbers (not BigInt to avoid precision issues)
    if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
      const num = Number(value);
      if (Number.isInteger(num) && num <= Number.MAX_SAFE_INTEGER) {
        return num;
      }
    }
    return value;
  });
}

// Get user identifier for tracking
function getUserIdentifier() {
  if (typeof window === 'undefined') return 'server-side';
  
  // Try to get wallet address
  const connectedAddress = localStorage.getItem('connectedAddress');
  if (connectedAddress) return connectedAddress;
  
  // Fallback to session ID
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
  }
  
  return sessionId;
}

// Log cache activity for monitoring
function logCacheActivity(functionName, action, details = {}) {
  if (typeof window === 'undefined') return;
  
  const activity = {
    functionName,
    action,
    timestamp: new Date().toISOString(),
    user: getUserIdentifier(),
    page: getCurrentPage(),
    details
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
  console.log(`👤 User: ${activity.user}`);
  console.log(`📄 Page: ${activity.page}`);
  if (details.network) {
    console.log(`🌐 Network: ${details.network}`);
  }
  
  if (action === 'HIT') {
    console.log(`⚡ Cache Hit - Data age: ${details.cacheAge}ms`);
    console.log(`🎯 No blockchain call needed`);
  } else if (action === 'MISS') {
    console.log(`🔄 Cache Miss - Data expired or not found`);
    console.log(`📞 Making fresh blockchain call...`);
  } else if (action === 'CALL') {
    console.log(`✅ Blockchain call completed`);
    console.log(`💾 Cached for ${details.cacheDuration}ms`);
  }
  
  if (details.result) {
    console.log(`📊 Result:`, details.result);
  }
  
  console.groupEnd();
  
  // Get existing activities
  const activities = JSON.parse(localStorage.getItem('cacheActivities') || '[]');
  
  // Add new activity
  activities.push(activity);
  
  // Keep only last 1000 activities to prevent localStorage bloat
  if (activities.length > 1000) {
    activities.splice(0, activities.length - 1000);
  }
  
  localStorage.setItem('cacheActivities', JSON.stringify(activities));
}

// Get current page name
function getCurrentPage() {
  if (typeof window === 'undefined') return 'server-side';
  
  const path = window.location.pathname;
  
  if (path === '/') return 'Home Page';
  if (path.includes('/swap') || path.includes('/trade')) return 'Token Swap Page';
  
  if (path.includes('/revenue')) return 'Revenue Page';
  if (path.includes('/admin')) return 'Admin Dashboard';
  if (path.includes('/create-project')) return 'Create Project Page';
  
  return `Custom Page (${path})`;
}

// Enhanced blockchain call wrapper with logging and BigInt support
export async function loggedBlockchainCall(functionName, callFunction, cacheDuration = 15000, network = null) {
  const cacheKey = `cache_${functionName}`;
  const now = Date.now();
  
  // Check cache first
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = deserializeBigInt(cached);
        const cacheAge = now - timestamp;
        
        if (cacheAge < cacheDuration) {
          logCacheActivity(functionName, 'HIT', { cacheAge, network });
          return data;
        }
      } catch (error) {
        console.warn(`⚠️ Cache deserialization failed for ${functionName}:`, error);
        // Continue with fresh call if cache is corrupted
      }
    }
  }
  
  // Cache miss - make fresh call
  logCacheActivity(functionName, 'MISS', { network });
  
  try {
    const result = await callFunction();
    
    // Cache the result with BigInt serialization
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(cacheKey, serializeBigInt({
          data: result,
          timestamp: now
        }));
      } catch (error) {
        console.warn(`⚠️ Cache serialization failed for ${functionName}:`, error);
        // Continue without caching if serialization fails
      }
    }
    
    logCacheActivity(functionName, 'CALL', { 
      cacheDuration,
      result: typeof result === 'object' ? 'Object' : result,
      network
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
  
  try {
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
  } catch (error) {
    console.error('❌ Failed to get cache statistics:', error);
    return [];
  }
}

// Clear cache statistics (admin function)
export function clearCacheStatistics() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cacheActivities');
    console.log('🗑️ Cache statistics cleared');
  }
}

// Clear all cache entries (admin function)
export function clearAllCache() {
  if (typeof window !== 'undefined') {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith('cache_'));
    cacheKeys.forEach(key => localStorage.removeItem(key));
    console.log(`🗑️ Cleared ${cacheKeys.length} cache entries`);
  }
}
