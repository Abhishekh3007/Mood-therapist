import Sentiment from 'sentiment';
import { supabase } from '../lib/supabaseClient';

interface NewsArticleRaw {
  title?: string;
  url?: string;
  source?: { name?: string };
  description?: string;
  urlToImage?: string;
}

interface NewsArticle {
  title: string;
  url: string;
  source?: string;
  description?: string;
  image?: string;
}

interface NewsPayload {
  articles?: NewsArticle[];
  error?: string;
}

interface ExternalContent {
  type: 'news';
  payload?: NewsPayload;
}

export async function getTrendingNews(): Promise<NewsPayload> {
  const key = process.env.NEWSAPI_KEY;
  if (!key) return { error: 'Missing NewsAPI key' };
  try {
    const res = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&pageSize=6&apiKey=${key}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return { error: 'NewsAPI error' };
    const data = await res.json();
    const articles: NewsArticle[] = (data.articles ?? [])
      .filter((a: NewsArticleRaw | null): a is NewsArticleRaw => !!a && !!a.title && !!a.url)
      .map((a: NewsArticleRaw) => ({
        title: a.title!,
        url: a.url!,
        source: a.source?.name,
        description: a.description,
        image: a.urlToImage
      }));
    return { articles };
  } catch (e) {
    console.error('News fetch error:', e);
    return { error: 'Failed to fetch news' };
  }
}

export async function getBotResponse(
  message: string,
  chatHistory: Record<string, unknown>[] = [],
  userId?: string,
  mode?: 'mood_check' | 'affirmations' | string
): Promise<{ botResponse: string; detectedMood: string; external?: ExternalContent }> {
  const analyzer = new Sentiment();
  const extract = (m: unknown) => {
    if (typeof m === 'object' && m !== null) {
      const mm = m as Record<string, unknown>;
      return String(mm.content ?? mm.user_message ?? mm.bot_response ?? '');
    }
    return '';
  };
  // For mode-based requests with empty message, analyze chat history only
  const contextForMood = message.trim() ? (chatHistory.slice(-5).map(extract).join(' ') + ' ' + message) : chatHistory.slice(-5).map(extract).join(' ');
  const recentText = contextForMood.trim() || 'neutral conversation';
  const sentimentScore = analyzer.analyze(recentText).score;
  const lower = message.toLowerCase();
  const neg = ['alone','lonely','sad','depressed','anxious','worried','scared','afraid','hurt','pain','cry','upset','angry','frustrated','hopeless','worthless','tired','exhausted','stressed','overwhelmed','lost','empty','broken','miserable','terrible','awful','bad','no one','nobody'];
  const pos = ['happy','joy','excited','great','wonderful','amazing','fantastic','excellent','good','better','grateful','thankful','blessed','love','peace','calm','relaxed','confident','proud','hopeful','optimistic'];
  let detectedMood: string = 'neutral';
  const hasNeg = neg.some(k => lower.includes(k));
  const hasPos = pos.some(k => lower.includes(k));
  if (hasNeg && !hasPos) detectedMood = 'negative';
  else if (hasPos && !hasNeg) detectedMood = 'positive';
  else if (sentimentScore > 1) detectedMood = 'positive';
  else if (sentimentScore < -1) detectedMood = 'negative';

  let external: ExternalContent | undefined;
  if (lower.includes('news') || lower.includes('bored')) {
    external = { type: 'news', payload: await getTrendingNews() };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { botResponse: "I'm having trouble connecting to the AI service. Please try again later.", detectedMood, external };
  }

  const recentConversation = chatHistory.slice(-5).map(m => {
    const mm = m as Record<string, unknown>;
    return `${mm.role || 'user'}: ${mm.content ?? mm.user_message ?? mm.bot_response ?? ''}`;
  }).join('\n');

  let prompt: string;
  if (mode === 'mood_check') {
    const contextMsg = message.trim() ? `\nCurrent message: ${message}` : '';
    prompt = `You are MoodTherapist. The user requested a mood check-in. Based on their recent conversation and detected mood (${detectedMood}), provide a structured response.

Recent conversation:
${recentConversation}${contextMsg}

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "acknowledgement": "warm 1-2 sentence greeting acknowledging their feelings",
  "questions": ["question 1 about their emotions", "question 2 about physical sensations", "question 3 about triggers or context"],
  "coping": ["practical coping strategy 1", "practical coping strategy 2"],
  "summary": "encouraging closing sentence"
}

Return ONLY the JSON object, nothing else.`;
  } else if (mode === 'affirmations') {
    const contextMsg = message.trim() ? `\nCurrent message: ${message}` : '';
    prompt = `You are MoodTherapist. The user requested personalized affirmations. Based on their recent conversation and detected mood (${detectedMood}), create 4 empowering affirmations.

Recent conversation:
${recentConversation}${contextMsg}

Return ONLY valid JSON array (no markdown, no code blocks) with exactly this structure:
[
  {"affirmation": "I am worthy and deserving of love", "explanation": "This reminds you of your inherent value"},
  {"affirmation": "personalized 6-12 word affirmation", "explanation": "one sentence explaining why this helps"},
  {"affirmation": "personalized 6-12 word affirmation", "explanation": "one sentence explaining why this helps"},
  {"affirmation": "personalized 6-12 word affirmation", "explanation": "one sentence explaining why this helps"}
]

Make them personal based on their mood (${detectedMood}) and concerns. Return ONLY the JSON array, nothing else.`;
  } else {
    prompt = `You are MoodTherapist (empathetic). Validate feelings, gentle coping, resilience. Avoid medical advice. 100-150 words, max 2 emojis. Mood: ${detectedMood}. Conversation:\n${recentConversation}\nUser: ${message}`;
  }

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 900, temperature: 0.85 }
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!resp.ok) throw new Error(`Gemini HTTP ${resp.status}`);
    const data = await resp.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let botText = raw;

    if (mode === 'mood_check') {
      try {
        // Remove markdown code blocks if present
        let jsonText = raw.trim();
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }
        
        const parsed = JSON.parse(jsonText);
        const ack = parsed.acknowledgement || '';
        const questions = Array.isArray(parsed.questions)
          ? parsed.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')
          : '';
        const coping = Array.isArray(parsed.coping)
          ? parsed.coping.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')
          : '';
        const summary = parsed.summary || '';
        botText = `${ack}\n\n💭 Questions to explore:\n${questions}\n\n🛠️ Coping Strategies:\n${coping}\n\n${summary}`.trim();
      } catch (e) {
        console.error('Mood check JSON parse error:', e, 'Raw:', raw);
        botText = "Let's check in together.\n\n💭 Questions to explore:\n1. What feelings are you experiencing right now?\n2. Where in your body do you notice these emotions?\n3. What might have triggered these feelings today?\n\n🛠️ Coping Strategies:\n1. Try taking 3 deep breaths, inhaling for 4 counts and exhaling for 6\n2. Write down one thing you're grateful for today\n\nRemember, all feelings are valid and temporary. I'm here to support you.";
      }
    } else if (mode === 'affirmations') {
      try {
        // Remove markdown code blocks if present
        let jsonText = raw.trim();
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }
        
        const parsed = JSON.parse(jsonText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          botText = '✨ Your Personalized Affirmations:\n\n' + parsed
            .map((it, i) => {
              const o = it as Record<string, unknown>;
              return `${i + 1}. "${o.affirmation || ''}"\n   💫 ${o.explanation || ''}`;
            })
            .join('\n\n');
        } else {
          throw new Error('Invalid affirmations format');
        }
      } catch (e) {
        console.error('Affirmations JSON parse error:', e, 'Raw:', raw);
        botText = `✨ Your Personalized Affirmations:\n\n1. "I am capable of handling whatever comes my way"\n   💫 This reminds you of your inner strength and resilience\n\n2. "I choose to focus on progress, not perfection"\n   💫 This helps release pressure and embrace growth\n\n3. "I deserve compassion, especially from myself"\n   💫 This encourages self-kindness during difficult times\n\n4. "I am worthy of peace and happiness"\n   💫 This affirms your inherent right to well-being`;
      }
    }

    if (userId) {
      void supabase.from('chatlog').insert([{
        user_id: userId,
        user_message: message,
        bot_response: botText,
        detected_mood: detectedMood
      }]);
    }
    return { botResponse: botText, detectedMood, external };
  } catch (err) {
    console.error('Gemini error:', err);
    const fallback = detectedMood === 'negative'
      ? (lower.includes('alone') || lower.includes('lonely')
          ? "I'm really sorry you feel alone. I'm here with you - what feels heaviest right now?"
          : "I hear your pain. What small thing might ease it a little?")
      : detectedMood === 'positive'
        ? "I'm glad some positivity is present - what would you like to build on?"
        : "Thank you for sharing. Which emotion feels closest to your experience right now?";
    if (userId) {
      void supabase.from('chatlog').insert([{
        user_id: userId,
        user_message: message,
        bot_response: fallback,
        detected_mood: detectedMood
      }]);
    }
    return { botResponse: fallback, detectedMood, external };
  }
}
