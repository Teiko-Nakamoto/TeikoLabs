import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('🔍 API received DEX transaction update:', JSON.stringify(body, null, 2));
    
    const {
      tokenContractAddress,
      dexDeploymentTxHash
    } = body;

    // Validate required fields
    if (!tokenContractAddress || !dexDeploymentTxHash) {
      return NextResponse.json(
        { error: 'Missing required fields: tokenContractAddress and dexDeploymentTxHash' },
        { status: 400 }
      );
    }

    console.log('🔄 Updating token with DEX transaction hash:', {
      tokenContractAddress,
      dexDeploymentTxHash
    });

    // Update the token record with DEX transaction hash
    const { data: updatedToken, error: updateError } = await supabaseServer
      .from('user_tokens')
      .update({
        dex_deployment_tx_hash: dexDeploymentTxHash,
        updated_at: new Date().toISOString()
      })
      .eq('token_contract_address', tokenContractAddress)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update token with DEX transaction' },
        { status: 500 }
      );
    }

    if (!updatedToken) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    console.log('✅ DEX transaction hash updated successfully:', {
      id: updatedToken.id,
      symbol: updatedToken.token_symbol,
      dexTxHash: updatedToken.dex_deployment_tx_hash
    });

    return NextResponse.json({
      success: true,
      token: {
        id: updatedToken.id,
        tokenName: updatedToken.token_name,
        tokenSymbol: updatedToken.token_symbol,
        tokenContractAddress: updatedToken.token_contract_address,
        dexContractAddress: updatedToken.dex_contract_address,
        dexDeploymentTxHash: updatedToken.dex_deployment_tx_hash,
        updatedAt: updatedToken.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error updating DEX transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
