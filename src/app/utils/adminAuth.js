import { verifyMessageSignatureRsv } from '@stacks/encryption';

// Admin wallet addresses (comma-separated)
const ADMIN_ADDRESSES = process.env.ADMIN_ADDRESSES?.split(',') || ['ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4'];

export async function verifyAdminAuth(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isValid: false, error: 'Missing or invalid authorization header' };
    }

    // Extract the token (should contain signature, publicKey, message, timestamp)
    const token = authHeader.replace('Bearer ', '');
    const authData = JSON.parse(token);

    const { signature, publicKey, message, timestamp, walletAddress } = authData;

    // Verify required fields
    if (!signature || !publicKey || !message || !timestamp || !walletAddress) {
      return { isValid: false, error: 'Missing required authentication data' };
    }

    // Verify wallet address is admin
    if (!ADMIN_ADDRESSES.includes(walletAddress)) {
      return { isValid: false, error: 'Unauthorized wallet address' };
    }

    // Check if authentication is not too old (24 hours)
    const authTime = new Date(timestamp).getTime();
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (now - authTime > maxAge) {
      return { isValid: false, error: 'Authentication expired' };
    }

    // Verify the signature
    const isValidSignature = verifyMessageSignatureRsv({
      message,
      signature,
      publicKey
    });

    if (!isValidSignature) {
      return { isValid: false, error: 'Invalid signature' };
    }

    return { isValid: true, adminAddress: walletAddress };
  } catch (error) {
    console.error('Admin auth verification error:', error);
    return { isValid: false, error: 'Authentication verification failed' };
  }
}

export function requireAdminAuth(handler) {
  return async (request) => {
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.isValid) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          message: authResult.error 
        }), 
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Add admin info to request for the handler to use
    request.adminInfo = authResult;
    return handler(request);
  };
}
