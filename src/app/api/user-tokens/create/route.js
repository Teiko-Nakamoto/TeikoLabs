import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyMessageSignature } from '@stacks/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('🔍 API received request body:', JSON.stringify(body, null, 2));
    
    const {
      tokenName,
      tokenSymbol,
      tokenDescription,
      tokenContractAddress,
      dexContractAddress,
      creatorWalletAddress,
      creatorSignature,
      deploymentMessage,
      initialSupply,
      initialPrice,
      tradingFeePercentage,
      deploymentTxHash,
      deploymentBlockNumber,
      tokenLogoUrl,
      websiteUrl,
      socialLinks
    } = body;
    
    console.log('🔐 Signature check - received:', creatorSignature);
    console.log('🔐 Checking if signature equals "dev_bypass_signature":', creatorSignature === 'dev_bypass_signature');

    // Validate required fields
    if (!tokenName || !tokenSymbol || !tokenContractAddress || !dexContractAddress || 
        !creatorWalletAddress || !creatorSignature || !deploymentMessage || !initialSupply) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the signature (allow development bypass)
    if (creatorSignature !== 'dev_bypass_signature') {
      try {
        const messageBytes = new TextEncoder().encode(deploymentMessage);
        const signatureBytes = new Uint8Array(Buffer.from(creatorSignature, 'hex'));
        const publicKeyBytes = new Uint8Array(Buffer.from(creatorWalletAddress, 'hex'));
        
        const isValid = await verifyMessageSignature({
          message: messageBytes,
          signature: signatureBytes,
          publicKey: publicKeyBytes
        });

        if (!isValid) {
          return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 401 }
          );
        }
      } catch (signatureError) {
        console.error('Signature verification error:', signatureError);
        return NextResponse.json(
          { error: 'Signature verification failed' },
          { status: 401 }
        );
      }
    } else {
      console.log('🔓 Development bypass signature detected - skipping verification');
    }

    // Check if token contract already exists
    const { data: existingToken } = await supabase
      .from('user_tokens')
      .select('id')
      .eq('token_contract_address', tokenContractAddress)
      .single();

    if (existingToken) {
      return NextResponse.json(
        { error: 'Token contract address already exists' },
        { status: 409 }
      );
    }

    // Check if DEX contract already exists
    const { data: existingDex } = await supabase
      .from('user_tokens')
      .select('id')
      .eq('dex_contract_address', dexContractAddress)
      .single();

    if (existingDex) {
      return NextResponse.json(
        { error: 'DEX contract address already exists' },
        { status: 409 }
      );
    }

    // Insert the new user token
    const { data: newToken, error: insertError } = await supabase
      .from('user_tokens')
      .insert({
        token_name: tokenName,
        token_symbol: tokenSymbol,
        token_description: tokenDescription || null,
        token_contract_address: tokenContractAddress,
        dex_contract_address: dexContractAddress,
        creator_wallet_address: creatorWalletAddress,
        creator_signature: creatorSignature,
        deployment_message: deploymentMessage,
        initial_supply: initialSupply,
        initial_price: initialPrice || 0.00000001,
        trading_fee_percentage: tradingFeePercentage || 2.00,
        deployment_status: 'deployed',
        deployment_tx_hash: deploymentTxHash || null,
        deployment_block_number: deploymentBlockNumber || null,
        deployed_at: new Date().toISOString(),
        token_logo_url: tokenLogoUrl || null,
        website_url: websiteUrl || null,
        social_links: socialLinks || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create token' },
        { status: 500 }
      );
    }

    console.log('✅ User token created successfully:', {
      id: newToken.id,
      symbol: newToken.token_symbol,
      contract: newToken.token_contract_address
    });

    return NextResponse.json({
      success: true,
      token: {
        id: newToken.id,
        tokenName: newToken.token_name,
        tokenSymbol: newToken.token_symbol,
        tokenContractAddress: newToken.token_contract_address,
        dexContractAddress: newToken.dex_contract_address,
        creatorWalletAddress: newToken.creator_wallet_address,
        deploymentStatus: newToken.deployment_status,
        createdAt: newToken.created_at
      }
    });

  } catch (error) {
    console.error('❌ Error creating user token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
