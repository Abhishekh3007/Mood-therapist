import Sentiment from 'sentiment';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../lib/supabaseClient';

type ChatHistory = Array<Recor    // Still persist the chat even with fallback
    try {
      await supabase.from('ChatLog').insert([{ 
        user_id: userId ?? null, 
        user_message: message, 
        bot_response: fallbackResponse, 
        detected_mood: detectedMood 
      }]);
    } catch (err) {
      console.error('Failed to persist fallback chat log:', err);
    }

    return { botResponse: fallbackResponse, detectedMood, external: external || undefined };own>>;

interface SpotifyPlaylist {
  id: string;
  name: string;
  external_urls?: {
    spotify?: string;
  };
  images?: Array<{
    url: string;
  }>;
}

interface NewsArticle {
  title: string;
  url: string;
  source?: {
    name: string;
  };
  description: string;
  urlToImage?: string;
}

interface ExternalContent {
  type: 'spotify_genres' | 'news';
  genres?: string[];
  payload?: {
    articles?: NewsArticle[];
  };
}

async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.access_token as string;
}

export async function getSpotifyPlaylists(genre: string) {
  const token = await getSpotifyToken();
  if (!token) return { error: 'Missing Spotify credentials' };
  const q = encodeURIComponent(genre);
  const res = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=playlist&limit=8`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { error: 'Spotify API error' };
  const data = await res.json();
  
  // Map to minimal playlist info, filtering out null/invalid items
  const playlists = (data.playlists?.items ?? [])
    .filter((p: SpotifyPlaylist | null): p is SpotifyPlaylist => {
      return p !== null && Boolean(p.id) && Boolean(p.name);
    })
    .map((p: SpotifyPlaylist) => ({
      id: p.id,
      name: p.name,
      url: p.external_urls?.spotify,
      image: p.images?.[0]?.url
    }));
  
  return { playlists };
}

export async function getTrendingNews() {
  const key = process.env.NEWSAPI_KEY;
  if (!key) return { error: 'Missing NewsAPI key' };
  const res = await fetch(`https://newsapi.org/v2/top-headlines?country=us&pageSize=6&apiKey=${key}`);
  if (!res.ok) return { error: 'NewsAPI error' };
  const data = await res.json();
  
  const articles = (data.articles ?? [])
    .filter((a: NewsArticle | null): a is NewsArticle => {
      return a !== null && Boolean(a.title) && Boolean(a.url);
    })
    .map((a: NewsArticle) => ({
      title: a.title,
      url: a.url,
      source: a.source?.name,
      description: a.description,
      image: a.urlToImage
    }));
  
  return { articles };
}

// Server-side helper to analyze sentiment and generate a bot response using Gemini AI.
export async function getBotResponse(message: string, chatHistory: Record<string, unknown>[] = [], userId?: string): Promise<{ 
  botResponse: string;
  detectedMood: string;
  external?: ExternalContent;
}> {
  const analyzer = new Sentiment();
  const result = analyzer.analyze(message);
  const score = result.score;
  let detectedMood = 'neutral';
  if (score > 1) detectedMood = 'positive';
  if (score < -1) detectedMood = 'negative';

  // Basic keyword detection for external data
  const lower = message.toLowerCase();
  let external: ExternalContent | null = null;
  if (lower.includes('music') || lower.includes('song')) {
    // Offer a few genre suggestions in the response and include external hint
    external = { type: 'spotify_genres', genres: ['pop', 'chill', 'rock', 'jazz', 'classical'] };
  } else if (lower.includes('news') || lower.includes('bored')) {
    const news = await getTrendingNews();
    external = { type: 'news', payload: news };
  }

  // Initialize Gemini AI
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found');
    return { 
      botResponse: "I'm sorry, I'm having trouble connecting to my AI service right now. Please try again later.", 
      detectedMood, 
      external 
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create a context-aware prompt for the mood therapist
    const prompt = `You are a compassionate and empathetic mood therapist AI assistant. Your role is to:
1. Listen actively and provide emotional support
2. Offer helpful suggestions for improving mental well-being
3. Be encouraging and understanding
4. Keep responses conversational and warm
5. Suggest coping strategies when appropriate
6. Never provide medical advice or diagnose conditions

Current user mood detected: ${detectedMood}
Previous conversation context: ${chatHistory.slice(-3).map((msg: Record<string, unknown>) => `${msg.role || 'user'}: ${msg.content || msg.user_message || msg.bot_response || ''}`).join('\n')}

User's current message: "${message}"

Please respond as a caring therapist would, acknowledging their feelings and providing helpful support. Keep your response under 150 words.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const botResponse = response.text();

    // Persist chat to Supabase ChatLog table
    try {
      await supabase.from('ChatLog').insert([{ 
        user_id: userId ?? null, 
        user_message: message, 
        bot_response: botResponse, 
        detected_mood: detectedMood 
      }]);
    } catch (err) {
      console.error('Failed to persist chat log:', err);
    }

    return { botResponse, detectedMood, external: external || undefined };

  } catch (error) {
    console.error('Gemini AI error:', error);
    
    // Fallback response if Gemini fails
    const fallbackResponse = external 
      ? `I found some ${external.type === 'news' ? 'top news' : 'music'} options for you based on your message. I'm here to listen and support you.`
      : `I hear that you're feeling ${detectedMood}. Thank you for sharing "${message}" with me. I'm here to listen and help you work through whatever you're experiencing.`;

    // Still persist the chat even with fallback
    try {
      await supabase.from('ChatLog').insert([{ 
        user_id: userId ?? null, 
        user_message: message, 
        bot_response: fallbackResponse, 
        detected_mood: detectedMood 
      }]);
    } catch (err) {
      console.error('Failed to persist fallback chat log:', err);
    }

    return { botResponse: fallbackResponse, detectedMood, external: external || undefined };
  }
}
