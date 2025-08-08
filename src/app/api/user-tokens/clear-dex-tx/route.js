import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('🗑️ API clearing DEX transaction:', JSON.stringify(body, null, 2));
    
    const { tokenContractAddress } = body;

    // Validate required field
    if (!tokenContractAddress) {
      return NextResponse.json(
        { error: 'Missing required field: tokenContractAddress' },
        { status: 400 }
      );
    }

    console.log('🗑️ Clearing DEX transaction for token:', tokenContractAddress);

    // Clear the DEX transaction hash from the token record
    const { data: updatedToken, error: updateError } = await supabaseServer
      .from('user_tokens')
      .update({
        dex_deployment_tx_hash: null,
        updated_at: new Date().toISOString()
      })
      .eq('token_contract_address', tokenContractAddress)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to clear DEX transaction' },
        { status: 500 }
      );
    }

    if (!updatedToken) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    console.log('✅ DEX transaction cleared successfully:', {
      id: updatedToken.id,
      symbol: updatedToken.token_symbol,
      dexTxHash: updatedToken.dex_deployment_tx_hash
    });

    return NextResponse.json({
      success: true,
      message: 'DEX transaction cleared successfully',
      token: {
        id: updatedToken.id,
        tokenName: updatedToken.token_name,
        tokenSymbol: updatedToken.token_symbol,
        tokenContractAddress: updatedToken.token_contract_address,
        dexContractAddress: updatedToken.dex_contract_address,
        dexDeploymentTxHash: updatedToken.dex_deployment_tx_hash
      }
    });

  } catch (error) {
    console.error('❌ Error clearing DEX transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
