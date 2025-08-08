import { requireAdminAuth } from '../../utils/adminAuth';
import { createClient } from '@supabase/supabase-js';
import { verifyMessageSignatureRsv } from '@stacks/encryption';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function handler(request) {
  try {
    const { id, signature, message } = await request.json();
    
    if (!id || !signature || !message) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          message: 'ID, signature, and message are required' 
        }), 
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get admin info from request (set by requireAdminAuth)
    const adminInfo = request.adminInfo;
    const adminWallet = adminInfo.adminAddress;

    // Verify the signature for removing the CORS URL
    try {
      const isValidSignature = verifyMessageSignatureRsv({
        message,
        signature,
        publicKey: adminInfo.publicKey
      });

      if (!isValidSignature) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid signature', 
            message: 'Signature verification failed' 
          }), 
          { 
            status: 401, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
    } catch (sigError) {
      console.error('Signature verification error:', sigError);
      return new Response(
        JSON.stringify({ 
          error: 'Signature verification failed', 
          message: sigError.message 
        }), 
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if URL exists and get its details
    const { data: existingEntry, error: checkError } = await supabase
      .from('cors_whitelist')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ 
            error: 'URL not found', 
            message: 'The specified CORS URL does not exist' 
          }), 
          { 
            status: 404, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
      
      console.error('Error checking existing URL:', checkError);
      return new Response(
        JSON.stringify({ 
          error: 'Database error', 
          message: checkError.message 
        }), 
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Remove URL from whitelist
    const { error: deleteError } = await supabase
      .from('cors_whitelist')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting CORS URL:', deleteError);
      return new Response(
        JSON.stringify({ 
          error: 'Database error', 
          message: deleteError.message 
        }), 
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🗑️ CORS URL removed: ${existingEntry.url} by ${adminWallet}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'CORS URL removed successfully',
        removedUrl: existingEntry.url
      }), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in remove-cors-url:', error);
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

export const POST = requireAdminAuth(handler);
