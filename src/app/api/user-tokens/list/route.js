import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const status = searchParams.get('status');
    const verified = searchParams.get('verified');
    const creator = searchParams.get('creator');
    const search = searchParams.get('search');

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('user_tokens')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('deployment_status', status);
    }

    if (verified !== null) {
      query = query.eq('is_verified', verified === 'true');
    }

    if (creator) {
      query = query.eq('creator_wallet_address', creator);
    }

    if (search) {
      query = query.or(`token_name.ilike.%${search}%,token_symbol.ilike.%${search}%,token_description.ilike.%${search}%`);
    }

    // Apply pagination and ordering
    const { data: tokens, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tokens' },
        { status: 500 }
      );
    }

    // Transform data for frontend
    const transformedTokens = tokens.map(token => ({
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
    }));

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    console.log(`📊 Fetched ${tokens.length} user tokens (page ${page}/${totalPages})`);

    return NextResponse.json({
      success: true,
      tokens: transformedTokens,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: count || 0,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user tokens:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
