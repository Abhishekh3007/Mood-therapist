import Sentiment from 'sentiment';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../lib/supabaseClient';

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
  type: 'news';
  payload?: {
    articles?: NewsArticle[];
  };
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
  if (lower.includes('news') || lower.includes('bored')) {
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
      external: external || undefined
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

    // Persist chat to Supabase chatlog table
    try {
      console.log('Persisting chat to database for user:', userId);
      await supabase.from('chatlog').insert([{ 
        user_id: userId || null, 
        user_message: message, 
        bot_response: botResponse, 
        detected_mood: detectedMood 
      }]);
      console.log('Successfully persisted chat to database');
    } catch (err) {
      console.error('Failed to persist chat log:', err);
    }

    return { botResponse, detectedMood, external: external || undefined };

  } catch (error) {
    console.error('Gemini AI error:', error);
    
    // Fallback response if Gemini fails
    const fallbackResponse = external 
      ? `I found some top news for you based on your message. I'm here to listen and support you.`
      : `I hear that you're feeling ${detectedMood}. Thank you for sharing "${message}" with me. I'm here to listen and help you work through whatever you're experiencing.`;

    // Still persist the chat even with fallback
    try {
      console.log('Persisting fallback chat to database for user:', userId);
      await supabase.from('chatlog').insert([{ 
        user_id: userId || null, 
        user_message: message, 
        bot_response: fallbackResponse, 
        detected_mood: detectedMood 
      }]);
      console.log('Successfully persisted fallback chat to database');
    } catch (err) {
      console.error('Failed to persist fallback chat log:', err);
    }

    return { botResponse: fallbackResponse, detectedMood, external: external || undefined };
  }
}
