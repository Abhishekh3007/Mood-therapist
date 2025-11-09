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
export async function getBotResponse(message: string, chatHistory: Record<string, unknown>[] = [], userId?: string, mode?: 'mood_check' | 'affirmations' | string): Promise<{ 
  botResponse: string;
  detectedMood: string;
  external?: ExternalContent;
}> {
  const analyzer = new Sentiment();
  // analyze recent context for more accurate mood detection
  const extractContent = (m: unknown) => {
    if (typeof m === 'object' && m !== null) {
      const mm = m as Record<string, unknown>;
      return String(mm.content ?? mm.user_message ?? '');
    }
    return '';
  };

  const recentText = (chatHistory ?? []).slice(-5).map(extractContent).join(' ') + ' ' + (message || '');
  const result = analyzer.analyze(recentText);
  const score = result.score;
  let detectedMood = 'neutral';
  if (score > 1) detectedMood = 'positive';
  if (score < -1) detectedMood = 'negative';

  // Basic keyword detection for external data (still check the single message too)
  const lower = (message || '').toLowerCase();
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

    // Build recent conversation context
    const recentConversation = (chatHistory ?? []).slice(-5).map((msg: Record<string, unknown>) => `${msg.role || 'user'}: ${msg.content || msg.user_message || msg.bot_response || ''}`).join('\n');

    // Mode-specific prompt tailoring
    let prompt = '';
    if (mode === 'mood_check') {
      prompt = `You are MoodTherapist, a compassionate AI therapist. The user has requested a mood check-in.\n\nInstructions:\n- Start by acknowledging the user and validating their feelings.\n- Ask 3 gentle, open-ended questions to help identify and name emotions (e.g., What are you feeling right now? Where in your body do you notice it? What might have triggered this feeling?).\n- Offer 2 short, practical coping strategies (breathing, grounding, brief journaling prompt).\n- Keep the tone warm and non-judgmental, concise (100-150 words).\n\nContext:\n- Detected mood: ${detectedMood}\n- Recent conversation:\n${recentConversation}\n\nPlease respond with empathy and the suggested questions and coping steps.`;
    } else if (mode === 'affirmations') {
      prompt = `You are MoodTherapist, a compassionate AI therapist. The user requested personalized affirmations.\n\nInstructions:\n- Create 3 to 5 short, specific affirmations tailored to the user's recent concerns and detected mood (${detectedMood}).\n- Each affirmation should be 6-12 words and empowering.\n- After each affirmation, include a one-sentence explanation of why it helps.\n- Keep the overall response encouraging and concise (100-150 words).\n\nContext:\n${recentConversation}\n\nGenerate personalized affirmations with brief explanations.`;
    } else {
      prompt = `You are a compassionate and empathetic mood therapist AI assistant named MoodTherapist. Your role is to:\n1. Listen actively and validate emotions without judgment\n2. Provide emotional support tailored to the user's current mood\n3. Offer evidence-based coping strategies and mindfulness techniques\n4. Be warm, encouraging, and use a conversational tone\n5. Help users build emotional resilience and self-awareness\n6. Never provide medical advice, diagnose conditions, or replace professional therapy\n\nSpecial Instructions:\n- Use emojis sparingly (1-2 max)\n- Keep responses concise (100-150 words)\n\nCurrent Context:\n- Detected mood: ${detectedMood}\n- Recent conversation:\n${recentConversation}\n\nUser's message: "${message}"\n\nRespond as a caring therapist would - acknowledge feelings, provide support, and help them move forward.`;
    }

    console.log('📤 Calling Gemini API via REST...');
    console.log('📝 Prompt length:', prompt.length, 'characters');
    console.log('🎯 Mode:', mode || 'default');

    // Use gemini-1.5-flash (stable model name)
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // Add timeout to prevent hanging (25 seconds max)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

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

    // Mode-specific fallback responses
    let fallbackResponse = '';
    
    if (mode === 'mood_check') {
      fallbackResponse = `I'm here to help you check in with your emotions. Let's take a moment together:\n\n💭 How are you feeling right now? What emotions are you experiencing?\n\n🫂 Where do you notice these feelings in your body?\n\n🌟 What might have triggered these feelings today?\n\nTake a deep breath. Remember: acknowledging your feelings is the first step to understanding them better.`;
    } else if (mode === 'affirmations') {
      const moodAffirmations = {
        positive: [
          '✨ "I am worthy of happiness and joy" - Your positive energy is a gift to yourself and others.',
          '🌟 "I celebrate my progress, no matter how small" - Every step forward matters.',
          '💪 "I have the strength to overcome challenges" - You\'ve made it this far, and you can keep going.'
        ],
        negative: [
          '🌱 "This feeling is temporary, and I will get through it" - Difficult emotions pass, and better days are ahead.',
          '💙 "I am allowed to feel what I feel without judgment" - Your emotions are valid and deserve compassion.',
          '🌈 "I have survived hard times before, and I will again" - You are resilient and capable.'
        ],
        neutral: [
          '🌸 "I am enough, exactly as I am" - You don\'t need to be perfect to be valuable.',
          '🎯 "I trust myself to make good decisions" - You have wisdom and insight within you.',
          '💫 "I am growing and learning every day" - Progress isn\'t always visible, but it\'s happening.'
        ]
      };
      
      const selectedAffirmations = moodAffirmations[detectedMood as keyof typeof moodAffirmations] || moodAffirmations.neutral;
      fallbackResponse = `Here are some personalized affirmations for you:\n\n${selectedAffirmations.join('\n\n')}\n\nRepeat these throughout your day. You deserve kindness, especially from yourself. 💚`;
    } else if (external) {
      fallbackResponse = `I found some top news for you based on your message. I'm here to listen and support you.`;
    } else {
      fallbackResponse = `I hear that you're feeling ${detectedMood}. Thank you for sharing "${message}" with me. I'm here to listen and help you work through whatever you're experiencing.`;
    }

    console.log('⚠️ Using fallback response for mode:', mode || 'default');

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
