import Sentiment from 'sentiment';
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
    console.log('🔑 Gemini API Key present:', apiKey ? 'YES (length: ' + apiKey.length + ')' : 'NO');
    console.log('🔑 API Key starts with:', apiKey.substring(0, 15) + '...');
    
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

    console.log('📤 Calling Gemini API via REST...');
    console.log('📝 Prompt length:', prompt.length, 'characters');
    
    // Use REST API directly to bypass SDK version issues
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Gemini API HTTP error:', response.status, response.statusText);
      console.error('❌ Error response:', errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();
    console.log('📥 Gemini API responded!');
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ Unexpected response structure:', JSON.stringify(data));
      throw new Error('Invalid response structure from Gemini API');
    }

    const botResponse = data.candidates[0].content.parts[0].text;
    console.log('✅ Bot response generated:', botResponse.substring(0, 100) + '...');
    console.log('📏 Response length:', botResponse.length, 'characters');

    // Persist chat to Supabase chatlog table
    if (userId) {
      try {
        console.log('Persisting chat to database for user:', userId);
        const { error: insertError } = await supabase.from('chatlog').insert([{ 
          user_id: userId, 
          user_message: message, 
          bot_response: botResponse, 
          detected_mood: detectedMood 
        }]);
        
        if (insertError) {
          console.error('Database insert error:', insertError);
        } else {
          console.log('Successfully persisted chat to database');
        }
      } catch (err) {
        console.error('Failed to persist chat log:', err);
      }
    }

    return { botResponse, detectedMood, external: external || undefined };

  } catch (error) {
    console.error('❌ Gemini AI error occurred!');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Fallback response if Gemini fails
    const fallbackResponse = external 
      ? `I found some top news for you based on your message. I'm here to listen and support you.`
      : `I hear that you're feeling ${detectedMood}. Thank you for sharing "${message}" with me. I'm here to listen and help you work through whatever you're experiencing.`;

    console.log('⚠️ Using fallback response:', fallbackResponse);

    // Still persist the chat even with fallback
    if (userId) {
      try {
        console.log('Persisting fallback chat to database for user:', userId);
        const { error: insertError } = await supabase.from('chatlog').insert([{ 
          user_id: userId, 
          user_message: message, 
          bot_response: fallbackResponse, 
          detected_mood: detectedMood 
        }]);
        
        if (insertError) {
          console.error('Database insert error for fallback:', insertError);
        } else {
          console.log('Successfully persisted fallback chat to database');
        }
      } catch (err) {
        console.error('Failed to persist fallback chat log:', err);
      }
    }

    return { botResponse: fallbackResponse, detectedMood, external: external || undefined };
  }
}
