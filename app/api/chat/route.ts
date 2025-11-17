import { NextResponse } from 'next/server';
import { getBotResponse } from '../../actions';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { message, chatHistory, mode } = await req.json();
    // message can be empty when mode is provided (mode-based requests)
    if (!message && !mode) return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create Supabase client with the user's session token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error in chat API:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
  const result = await getBotResponse(message ?? '', chatHistory ?? [], user.id, mode ?? undefined);
    return NextResponse.json(result);
  } catch (err) {
    console.error('API error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
