import { NextResponse } from 'next/server';
import { getBotResponse } from '../../actions';

export async function POST(req: Request) {
  try {
    const { message, chatHistory } = await req.json();
    if (!message) return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    const result = await getBotResponse(message, chatHistory ?? []);
    return NextResponse.json(result);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('API error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
