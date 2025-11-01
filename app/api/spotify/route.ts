import { NextRequest, NextResponse } from 'next/server';

// Spotify API configuration
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Get Spotify access token
async function getSpotifyToken(): Promise<string> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

// Get music recommendations based on mood
async function getMusicRecommendations(mood: string, token: string) {
  // Map mood to Spotify seed parameters
  const moodSeeds: Record<string, { genres: string[]; valence: number; energy: number }> = {
    happy: { genres: ['pop', 'dance', 'party'], valence: 0.8, energy: 0.8 },
    sad: { genres: ['acoustic', 'piano', 'ambient'], valence: 0.2, energy: 0.3 },
    anxious: { genres: ['ambient', 'chill', 'study'], valence: 0.4, energy: 0.4 },
    angry: { genres: ['rock', 'metal', 'punk'], valence: 0.3, energy: 0.9 },
    calm: { genres: ['ambient', 'classical', 'meditation'], valence: 0.6, energy: 0.3 },
    energetic: { genres: ['edm', 'workout', 'electronic'], valence: 0.7, energy: 0.9 },
  };

  const seeds = moodSeeds[mood.toLowerCase()] || moodSeeds.calm;
  
  const params = new URLSearchParams({
    seed_genres: seeds.genres.join(','),
    target_valence: seeds.valence.toString(),
    target_energy: seeds.energy.toString(),
    limit: '10',
  });

  const response = await fetch(`https://api.spotify.com/v1/recommendations?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const { mood } = await request.json();

    if (!mood) {
      return NextResponse.json(
        { error: 'Mood parameter is required' },
        { status: 400 }
      );
    }

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Spotify credentials not configured' },
        { status: 500 }
      );
    }

    // Get Spotify access token
    const token = await getSpotifyToken();

    // Get music recommendations
    const recommendations = await getMusicRecommendations(mood, token);

    interface SpotifyTrack {
      name: string;
      artists: Array<{ name: string }>;
      album: { name: string; images: Array<{ url: string }> };
      preview_url: string;
      external_urls: { spotify: string };
    }

    return NextResponse.json({
      success: true,
      tracks: recommendations.tracks?.map((track: SpotifyTrack) => ({
        name: track.name,
        artist: track.artists[0]?.name,
        album: track.album?.name,
        preview_url: track.preview_url,
        external_url: track.external_urls?.spotify,
        image: track.album?.images[0]?.url,
      })) || [],
    });
  } catch (error) {
    console.error('Spotify API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch music recommendations' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Spotify API endpoint - use POST with mood parameter',
    example: { mood: 'happy' },
  });
}
