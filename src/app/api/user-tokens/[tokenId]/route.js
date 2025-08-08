import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  try {
    const { tokenId } = await params;

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      );
    }

    // Fetch the specific token
    const { data: token, error } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('id', tokenId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Token not found' },
          { status: 404 }
        );
      }
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch token' },
        { status: 500 }
      );
    }

    // Transform data for frontend
    const transformedToken = {
      id: token.id,
      tokenName: token.token_name,
      tokenSymbol: token.token_symbol,
      tokenDescription: token.token_description,
      tokenContractAddress: token.token_contract_address,
      dexContractAddress: token.dex_contract_address,
      creatorWalletAddress: token.creator_wallet_address,
      initialSupply: token.initial_supply,
      initialPrice: token.initial_price,
      tradingFeePercentage: token.trading_fee_percentage,
      deploymentStatus: token.deployment_status,
      deploymentTxHash: token.deployment_tx_hash,
      deploymentBlockNumber: token.deployment_block_number,
      isVerified: token.is_verified,
      verificationDate: token.verification_date,
      verifiedByWallet: token.verified_by_wallet,
      tokenLogoUrl: token.token_logo_url,
      websiteUrl: token.website_url,
      socialLinks: token.social_links,
      createdAt: token.created_at,
      updatedAt: token.updated_at,
      deployedAt: token.deployed_at
    };

    console.log(`📋 Fetched user token: ${token.token_symbol} (ID: ${token.id})`);

    return NextResponse.json({
      success: true,
      token: transformedToken
    });

  } catch (error) {
    console.error('❌ Error fetching user token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { tokenId } = await params;
    const body = await request.json();

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      );
    }

    // Only allow updating certain fields
    const allowedUpdates = {
      deployment_status: body.deploymentStatus,
      deployment_tx_hash: body.deploymentTxHash,
      deployment_block_number: body.deploymentBlockNumber,
      is_verified: body.isVerified,
      verification_date: body.verificationDate,
      verified_by_wallet: body.verifiedByWallet,
      token_logo_url: body.tokenLogoUrl,
      website_url: body.websiteUrl,
      social_links: body.socialLinks
    };

    // Remove undefined values
    const updates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the token
    const { data: updatedToken, error } = await supabase
      .from('user_tokens')
      .update(updates)
      .eq('id', tokenId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Token not found' },
          { status: 404 }
        );
      }
      console.error('Database update error:', error);
      return NextResponse.json(
        { error: 'Failed to update token' },
        { status: 500 }
      );
    }

    console.log(`✅ Updated user token: ${updatedToken.token_symbol} (ID: ${updatedToken.id})`);

    return NextResponse.json({
      success: true,
      message: 'Token updated successfully',
      token: {
        id: updatedToken.id,
        tokenName: updatedToken.token_name,
        tokenSymbol: updatedToken.token_symbol,
        deploymentStatus: updatedToken.deployment_status,
        isVerified: updatedToken.is_verified,
        updatedAt: updatedToken.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error updating user token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
