import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for CORS checks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration for CORS middleware');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * CORS Middleware with Dynamic Whitelist
 * Checks the database for allowed domains and applies appropriate CORS headers
 */
export async function corsMiddleware(request) {
  const origin = request.headers.get('origin');
  
  // If no origin (e.g., same-origin request), allow it
  if (!origin) {
    return { allowed: true, corsHeaders: {} };
  }

  // Default allowed origins (always allowed)
  const defaultAllowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://localhost:3000',
    'https://localhost:3001',
    'https://localhost:3002'
  ];

  // Add custom allowed origins from environment variables
  const customAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [];
  
  // Manually add your website domains for now
  const manualOrigins = [
    'https://teikolabs.com',
    'https://www.teikolabs.com'
  ];
  
  const allAllowedOrigins = [...defaultAllowedOrigins, ...customAllowedOrigins, ...manualOrigins];

  // Check if origin is in allowed origins
  if (allAllowedOrigins.includes(origin)) {
    return {
      allowed: true,
      corsHeaders: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400' // 24 hours
      }
    };
  }

  try {
    // Check if origin is in the database whitelist
    const { data: whitelistEntry, error } = await supabase
      .from('cors_whitelist')
      .select('url')
      .eq('url', origin)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('CORS database error:', error);
      return { allowed: false, corsHeaders: {} };
    }

    // If origin is whitelisted in database, allow the request
    if (whitelistEntry) {
      return {
        allowed: true,
        corsHeaders: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400' // 24 hours
        }
      };
    }

    // Origin not in whitelist
    return { allowed: false, corsHeaders: {} };
  } catch (error) {
    console.error('CORS middleware error:', error);
    return { allowed: false, corsHeaders: {} };
  }
}

/**
 * Apply CORS headers to a response
 */
export function applyCorsHeaders(response, corsHeaders) {
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      ...corsHeaders
    }
  });
  
  return newResponse;
}

/**
 * Handle preflight OPTIONS requests
 */
export async function handlePreflight(request) {
  const corsResult = await corsMiddleware(request);
  
  if (!corsResult.allowed) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 200,
    headers: corsResult.corsHeaders
  });
}

/**
 * Wrapper function to apply CORS to API routes
 */
export function withCors(handler) {
  return async (request) => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return handlePreflight(request);
    }

    // Check CORS for actual requests
    const corsResult = await corsMiddleware(request);
    
    if (!corsResult.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'CORS Error', 
          message: 'Origin not allowed' 
        }), 
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Call the original handler
    const response = await handler(request);
    
    // Apply CORS headers to the response
    return applyCorsHeaders(response, corsResult.corsHeaders);
  };
}
