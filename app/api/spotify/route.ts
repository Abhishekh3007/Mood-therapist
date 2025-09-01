import { NextResponse } from 'next/server';
import { getSpotifyPlaylists } from '../../actions';

export async function POST(req: Request) {
  try {
    const { genre } = await req.json();
    if (!genre) return NextResponse.json({ error: 'Missing genre' }, { status: 400 });
    const data = await getSpotifyPlaylists(genre);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Spotify API route error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
