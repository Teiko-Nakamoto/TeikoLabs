import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.HIRO_API_KEY;
  
  return NextResponse.json({
    hasApiKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyStart: apiKey?.substring(0, 8) || 'none',
    keyEnd: apiKey?.substring(-8) || 'none',
    fullKey: apiKey || 'not set',
    envVars: {
      NODE_ENV: process.env.NODE_ENV,
      HIRO_API_KEY: process.env.HIRO_API_KEY ? 'SET' : 'NOT SET',
      HIRO_API_URL: process.env.HIRO_API_URL || 'not set'
    }
  });
}
