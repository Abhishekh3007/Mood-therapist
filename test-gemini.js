// Quick test to verify Gemini API is working
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔑 Testing Gemini API...');
  console.log('🔑 API Key present:', apiKey ? 'YES' : 'NO');
  console.log('🔑 API Key length:', apiKey ? apiKey.length : 0);
  console.log('🔑 API Key starts with:', apiKey ? apiKey.substring(0, 15) + '...' : 'N/A');
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env.local');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "You are a caring therapist. A user says: 'I need some motivation'. Please respond with encouragement in 2-3 sentences.";

    console.log('📤 Sending request to Gemini...');
    const result = await model.generateContent(prompt);
    
    console.log('📥 Response received!');
    const response = result.response;
    const text = response.text();
    
    console.log('✅ SUCCESS! Gemini response:');
    console.log('---');
    console.log(text);
    console.log('---');
    console.log('📏 Response length:', text.length, 'characters');
    
  } catch (error) {
    console.error('❌ ERROR calling Gemini API:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  }
}

testGemini();
