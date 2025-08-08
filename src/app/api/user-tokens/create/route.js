import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';
import { verifyMessageSignature } from '@stacks/encryption';

export async function POST(request) {
  try {
    const { tokenSymbol, tokenName, adminWallet, signature, message } = await request.json();
    
    if (!tokenSymbol || !tokenName || !adminWallet || !signature || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Verify the signature
    try {
      const isValidSignature = verifyMessageSignature({
        message,
        signature,
        publicKey: adminWallet
      });

      if (!isValidSignature) {
        return NextResponse.json({ 
          error: 'Invalid signature' 
        }, { status: 401 });
      }
    } catch (sigError) {
      console.error('Signature verification error:', sigError);
      return NextResponse.json({ 
        error: 'Signature verification failed' 
      }, { status: 401 });
    }

    // Create user token entry
    const { data, error } = await supabaseServer
      .from('user_tokens')
      .insert({
        token_symbol: tokenSymbol,
        token_name: tokenName,
        admin_wallet: adminWallet,
        signature: signature,
        message: message,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user token:', error);
      return NextResponse.json({ 
        error: 'Database error' 
      }, { status: 500 });
    }

    console.log(`✅ User token created: ${tokenSymbol} by ${adminWallet}`);

    return NextResponse.json({ 
      success: true, 
      userToken: data 
    });
  } catch (error) {
    console.error('Error in create user token:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
