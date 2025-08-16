// Script to update MAS token with metadata URI and image
const tokenCards = [
  {
    id: 1,
    isComingSoon: false,
    isHidden: false,
    tabType: "featured",
    dexInfo: "SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B.mas-sats-treasury",
    tokenInfo: "SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B.mas-sats",
    symbol: "MAS",
    revenue: 0,
    liquidity: 0,
    network: "mainnet",
    // Add the metadata URI here
    metadataUri: "https://your-supabase-project.supabase.co/storage/v1/object/public/uri/mas-token-metadata.json",
    // Add the image URL here
    imageUrl: "/icons/The Mas Network.svg"
  }
];

// To use this:
// 1. Replace "your-supabase-project" with your actual Supabase project
// 2. Upload the mas-token-metadata.json to your Supabase storage
// 3. Call the save-token-cards API with this data

console.log('Token cards to update:', JSON.stringify(tokenCards, null, 2));
console.log('\nTo update, call: POST /api/save-token-cards with this data');
