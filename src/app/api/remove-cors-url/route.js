import { requireAdminAuth } from '../../utils/adminAuth';
import { supabaseServer } from '../../utils/supabaseServer';
import { verifyMessageSignatureRsv } from '@stacks/encryption';

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

    // Remove URL from whitelist
    const { data: removedEntry, error: deleteError } = await supabaseServer
      .from('cors_whitelist')
      .delete()
      .eq('id', id)
      .eq('admin_wallet', adminWallet)
      .select()
      .single();

    if (deleteError) {
      console.error('Error removing CORS URL:', deleteError);
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

    if (!removedEntry) {
      return new Response(
        JSON.stringify({ 
          error: 'URL not found', 
          message: 'No CORS URL found with the specified ID for this admin' 
        }), 
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`✅ CORS URL removed: ${removedEntry.url} by ${adminWallet}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'CORS URL removed successfully',
        removedEntry
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
