import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

// GET: return { blocked: boolean }
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('app_settings')
      .select('value')
      .eq('key', 'quiz_blocked')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const blocked = data ? data.value === true || data.value === 'true' : false;
    return NextResponse.json({ success: true, blocked });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// POST: body { blocked: boolean }
export async function POST(req) {
  try {
    const { blocked } = await req.json();
    const { error } = await supabaseServer
      .from('app_settings')
      .upsert([{ key: 'quiz_blocked', value: !!blocked, updated_at: new Date().toISOString() }], { onConflict: 'key' });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, blocked: !!blocked });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}




