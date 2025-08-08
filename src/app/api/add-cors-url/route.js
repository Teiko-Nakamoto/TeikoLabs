import { requireAdminAuth } from '../../utils/adminAuth';
import { supabaseServer } from '../../utils/supabaseServer';
import { verifyMessageSignatureRsv } from '@stacks/encryption';

async function handler(request) {
  try {
    const { url, signature, message } = await request.json();
    
    if (!url || !signature || !message) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          message: 'URL, signature, and message are required' 
        }), 
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate URL format
    try {
      const urlObj = new URL(url);
      if (!urlObj.protocol || !urlObj.hostname) {
        throw new Error('Invalid URL format');
      }
    } catch (urlError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid URL', 
          message: 'Please provide a valid URL (e.g., https://example.com)' 
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

    // Verify the signature for adding the CORS URL
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

    // Check if URL already exists
    const { data: existingUrl, error: checkError } = await supabaseServer
      .from('cors_whitelist')
      .select('id')
      .eq('url', url)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
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

    if (existingUrl) {
      return new Response(
        JSON.stringify({ 
          error: 'URL already exists', 
          message: 'This URL is already in the CORS whitelist' 
        }), 
        { 
          status: 409, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Add URL to whitelist
    const { data: newEntry, error: insertError } = await supabaseServer
      .from('cors_whitelist')
      .insert({
        url,
        admin_wallet: adminWallet,
        signature,
        message
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting CORS URL:', insertError);
      return new Response(
        JSON.stringify({ 
          error: 'Database error', 
          message: insertError.message 
        }), 
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`✅ CORS URL added: ${url} by ${adminWallet}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'CORS URL added successfully',
        corsEntry: newEntry
      }), 
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in add-cors-url:', error);
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
