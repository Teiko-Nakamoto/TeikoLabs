import { supabaseServer } from './supabaseServer';

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map();

// Get client IP address
function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIP || 'unknown';
}

// Get rate limit for endpoint group
async function getRateLimit(endpointGroup) {
  try {
    const { data } = await supabaseServer
      .from('rate_limits')
      .select('*')
      .eq('endpoint_group', endpointGroup)
      .eq('enabled', true)
      .single();
    
    return data?.requests_per_minute || 100; // fallback
  } catch (error) {
    console.warn(`⚠️ Rate limit not found for ${endpointGroup}, using default`);
    return 100; // default fallback
  }
}

// Check if request is within rate limit
function isWithinRateLimit(clientIP, endpointGroup, currentRequests) {
  const key = `${clientIP}:${endpointGroup}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const record = rateLimitStore.get(key);
  
  if (now > record.resetTime) {
    // Reset window
    record.count = 1;
    record.resetTime = now + windowMs;
    return true;
  }
  
  if (record.count >= currentRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

// Rate limiting middleware
export async function rateLimitMiddleware(request, endpointGroup) {
  const clientIP = getClientIP(request);
  const limit = await getRateLimit(endpointGroup);
  
  if (!isWithinRateLimit(clientIP, endpointGroup, limit)) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetTime: Date.now() + 60 * 1000
    };
  }
  
  const key = `${clientIP}:${endpointGroup}`;
  const record = rateLimitStore.get(key);
  
  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - record.count),
    resetTime: record.resetTime
  };
}

// Add rate limit headers to response
export function addRateLimitHeaders(response, rateLimitInfo) {
  response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimitInfo.resetTime.toString());
  
  if (!rateLimitInfo.allowed) {
    response.headers.set('Retry-After', '60');
  }
  
  return response;
}
