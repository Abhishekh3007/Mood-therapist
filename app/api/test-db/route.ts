import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('chatlog')
      .select('*')
      .limit(1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Database connection failed';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
