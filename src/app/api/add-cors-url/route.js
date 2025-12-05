// Stub route to prevent build errors when Supabase env vars are not set
export async function GET() {
  return new Response(
    JSON.stringify({ error: "API not configured. Supabase environment variables required." }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
}

export async function POST() {
  return new Response(
    JSON.stringify({ error: "API not configured. Supabase environment variables required." }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
}

