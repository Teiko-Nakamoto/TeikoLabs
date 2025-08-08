import { requireAdminAuth } from '../../utils/adminAuth';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function handler(request) {
  try {
    const { data: corsWhitelist, error } = await supabase
      .from('cors_whitelist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching CORS whitelist:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Database error', 
          message: error.message 
        }), 
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        corsWhitelist: corsWhitelist || [],
        success: true 
      }), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in get-cors-whitelist:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

export const GET = requireAdminAuth(handler);
