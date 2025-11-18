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
  // Sentiment analyzer
  const analyzer = new Sentiment();

  // Helper to extract text from chatHistory entries
  const extractContent = (m: unknown) => {
    if (typeof m === 'object' && m !== null) {
      const mm = m as Record<string, unknown>;
      return String(mm.content ?? mm.user_message ?? mm.bot_response ?? '');
    }
    return '';
  };

  const recentText = (chatHistory ?? []).slice(-5).map(extractContent).join(' ') + ' ' + (message || '');
  const result = analyzer.analyze(recentText);
  const score = result.score;

  // Keyword-based mood detection + sentiment score fallback
  const lowerMessage = (message || '').toLowerCase();
  const negativeKeywords = ['alone','lonely','sad','depressed','anxious','worried','scared','afraid','hurt','pain','cry','upset','angry','frustrated','hopeless','worthless','tired','exhausted','stressed','overwhelmed','lost','empty','broken','miserable','terrible','awful','bad','no one','nobody'];
  const positiveKeywords = ['happy','joy','excited','great','wonderful','amazing','fantastic','excellent','good','better','grateful','thankful','blessed','love','peace','calm','relaxed','confident','proud','hopeful','optimistic'];

  let detectedMood = 'neutral';
  const hasNegativeKeyword = negativeKeywords.some(k => lowerMessage.includes(k));
  const hasPositiveKeyword = positiveKeywords.some(k => lowerMessage.includes(k));

  if (hasNegativeKeyword && !hasPositiveKeyword) {
    detectedMood = 'negative';
  } else if (hasPositiveKeyword && !hasNegativeKeyword) {
    detectedMood = 'positive';
  } else if (score > 1) {
    detectedMood = 'positive';
  } else if (score < -1) {
    detectedMood = 'negative';
  }

  // Simple external content detection
  let external: ExternalContent | null = null;
  if (lowerMessage.includes('news') || lowerMessage.includes('bored')) {
    const news = await getTrendingNews();
    external = { type: 'news', payload: news };
  }

  // Check API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found');
    return {
      botResponse: "I'm sorry, I'm having trouble connecting to my AI service right now. Please try again later.",
      detectedMood,
      external: external || undefined
    };
  }

  // Prepare prompt/context
  const recentConversation = (chatHistory ?? []).slice(-5).map((msg: Record<string, unknown>) => `${msg.role || 'user'}: ${msg.content ?? msg.user_message ?? msg.bot_response ?? ''}`).join('\n');

  let prompt = '';
  if (mode === 'mood_check') {
    // Request structured JSON so the response is dynamic and machine-parseable
    prompt = `You are MoodTherapist, a compassionate AI therapist. The user has requested a mood check-in.\n\nInstructions (RESPONSE FORMAT MUST BE VALID JSON OBJECT):\nReturn a JSON object with the following keys:\n- "acknowledgement": a 1-2 sentence empathetic acknowledgement of the user's feelings\n- "questions": an array of 3 gentle, open-ended questions to help the user identify and name emotions\n- "coping": an array of 2 short, practical coping strategies (one-liners)\n- "summary": a one-sentence encouraging next step\n\nContext:\n- Detected mood: ${detectedMood}\n- Recent conversation:\n${recentConversation}\n- User message:\n${message}\n\nDo NOT include any extra commentary outside the JSON object. Ensure the JSON is valid and parsable.`;
  } else if (mode === 'affirmations') {
    // Request structured JSON array for affirmations to ensure tailored, non-stub output
    prompt = `You are MoodTherapist, a compassionate AI therapist. The user requested personalized affirmations.\n\nInstructions (RESPONSE FORMAT MUST BE A VALID JSON ARRAY):\nReturn a JSON array of objects where each object contains:\n- "affirmation": a 6-12 word affirmation tailored to the user's recent concerns\n- "explanation": a one-sentence explanation of why the affirmation helps\nReturn 3 to 5 items.\n\nContext:\n- Detected mood: ${detectedMood}\n- Recent conversation:\n${recentConversation}\n- User message:\n${message}\n\nDo NOT include any narrative outside the JSON array. Ensure the JSON is valid and parsable.`;
  } else {
    prompt = `You are a compassionate and empathetic mood therapist AI assistant named MoodTherapist. Your role is to:\n1. Listen actively and validate emotions without judgment\n2. Provide emotional support tailored to the user's current mood\n3. Offer evidence-based coping strategies and mindfulness techniques\n4. Be warm, encouraging, and use a conversational tone\n5. Help users build emotional resilience and self-awareness\n6. Never provide medical advice, diagnose conditions, or replace professional therapy\n\nSpecial Instructions:\n- Use emojis sparingly (1-2 max)\n- Keep responses concise (100-150 words)\n\nCurrent Context:\n- Detected mood: ${detectedMood}\n- Recent conversation:\n${recentConversation}\n\nUser's message: "${message}"\n\nRespond as a caring therapist would - acknowledge feelings, provide support, and help them move forward.`;
  }

  try {
    console.log('🔑 Gemini API Key present:', apiKey ? 'YES (length: ' + apiKey.length + ')' : 'NO');
    console.log('🎭 Detected mood:', detectedMood);
    console.log('💬 User message:', message);
    console.log('📤 Calling Gemini API via REST...');
    console.log('📝 Prompt length:', prompt.length, 'characters');

    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // Add timeout to prevent hanging (25 seconds max)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.9 }
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
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ Unexpected response structure:', JSON.stringify(data));
      throw new Error('Invalid response structure from Gemini API');
    }

    const botResponse = data.candidates[0].content.parts[0].text;
    console.log('✅ Bot response generated (raw):', botResponse.substring(0, 100) + '...');

    // If we requested structured output for certain modes, attempt to parse and format it
    let finalResponse = botResponse;
    try {
      if (mode === 'mood_check') {
        const parsed = JSON.parse(botResponse);
        if (parsed && typeof parsed === 'object') {
          const ack = parsed.acknowledgement || '';
          const questions = Array.isArray(parsed.questions) ? parsed.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n') : '';
          const coping = Array.isArray(parsed.coping) ? parsed.coping.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n') : '';
          const summary = parsed.summary || '';
          finalResponse = `${ack}\n\nQuestions:\n${questions}\n\nCoping strategies:\n${coping}\n\n${summary}`;
        }
      } else if (mode === 'affirmations') {
        const parsed = JSON.parse(botResponse) as unknown;
        if (Array.isArray(parsed)) {
          const items = parsed as Array<unknown>;
          finalResponse = items.map((it: unknown, idx: number) => {
            const obj = it as Record<string, unknown>;
            const affirmation = typeof obj.affirmation === 'string' ? obj.affirmation : '';
            const explanation = typeof obj.explanation === 'string' ? obj.explanation : '';
            return `${idx + 1}. ${affirmation} — ${explanation}`;
          }).join('\n\n');
        }
      }
    } catch {
      console.warn('Could not parse structured response; using raw text.');
    }

    // Persist chat to Supabase chatlog table (store the rendered final response)
    if (userId) {
      try {
        const { error: insertError } = await supabase.from('chatlog').insert([{ 
          user_id: userId, 
          user_message: message, 
          bot_response: finalResponse, 
          detected_mood: detectedMood 
        }]);
        if (insertError) console.error('Database insert error:', insertError);
      } catch (err) {
        console.error('Failed to persist chat log:', err);
      }
    }

    return { botResponse: finalResponse, detectedMood, external: external || undefined };

  } catch (error) {
    console.error('❌ Gemini AI error occurred!');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    // Enhanced fallback responses based on mood
    let fallbackResponse: string;
    if (external) {
      fallbackResponse = `I found some top news for you based on your message. I'm here to listen and support you.`;
    } else if (detectedMood === 'negative') {
      const negativeResponses = [
        `I'm truly sorry you're going through this. ${message.includes('alone') || message.includes('lonely') ? 'Feeling alone can be incredibly difficult, but please know you\'re not truly alone - I\'m here for you.' : 'What you\'re feeling is valid, and it takes courage to share it.'} Would you like to talk more about what's troubling you?`,
        `Thank you for trusting me with your feelings. It sounds like you're dealing with something really challenging right now. I want you to know that your feelings are completely valid, and I'm here to support you through this. What's weighing most heavily on your mind?`,
        `I hear the pain in your words, and I want you to know that I'm here to listen without judgment. ${message.includes('alone') || message.includes('lonely') ? 'Loneliness is a deeply human experience, and you\'re brave for acknowledging it.' : 'What you\'re experiencing matters, and you deserve support.'} How can I help you feel a little better today?`
      ];
      fallbackResponse = negativeResponses[Math.floor(Math.random() * negativeResponses.length)];
    } else if (detectedMood === 'positive') {
      const positiveResponses = [
        `That's wonderful to hear! Your positive energy is truly uplifting. What's bringing you joy today?`,
        `I'm so glad you're feeling good! It's great to share in your happiness. Tell me more about what's going well!`,
        `That's fantastic! Your positivity is contagious. What made today special for you?`
      ];
      fallbackResponse = positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
    } else {
      const neutralResponses = [
        `I appreciate you sharing that with me. Tell me more about what's on your mind - I'm here to listen and support you.`,
        `Thank you for opening up. I'd love to understand better what you're experiencing. What else would you like to talk about?`,
        `I'm here to support you. Would you like to explore those feelings further, or is there something specific I can help you with?`
      ];
      fallbackResponse = neutralResponses[Math.floor(Math.random() * neutralResponses.length)];
    }

    console.log('⚠️ Using fallback response for mode:', mode || 'default');

    // Persist fallback
    if (userId) {
      try {
        const { error: insertError } = await supabase.from('chatlog').insert([{ 
          user_id: userId, 
          user_message: message, 
          bot_response: fallbackResponse, 
          detected_mood: detectedMood 
        }]);
        if (insertError) console.error('Database insert error for fallback:', insertError);
      } catch (err) {
        console.error('Failed to persist fallback chat log:', err);
      }
    }

    return { botResponse: fallbackResponse, detectedMood, external: external || undefined };
  }
}
