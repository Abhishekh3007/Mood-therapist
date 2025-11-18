"use client";

import { useState, useRef, useEffect } from "react";
import IconButton from "../components/IconButton";
import TextInput from "../components/TextInput";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

interface NewsArticle {
  title: string;
  url: string;
  source: string;
  description: string;
}

interface ExternalContent {
  type: 'news';
  payload?: {
    articles?: NewsArticle[];
  };
}

interface ChatMessage {
  role: "user" | "bot";
  content: string;
  external?: ExternalContent;
  timestamp?: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        router.push('/login');
        return;
      }
      setIsAuthenticated(true);
      setAuthLoading(false);
    };
    
    checkAuth();
  }, [router]);

  // Welcome message effect
  useEffect(() => {
    if (messages.length > 0) {
      setShowWelcome(false);
    }
  }, [messages]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/login');
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending a message
  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('No valid session found:', sessionError);
      router.push('/login');
      return;
    }
    
    const userMsg = { 
      role: "user" as const, 
      content: input,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          message: input, 
          chatHistory: messages.slice(0, -1) // Exclude the current user message
        }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      const botMsg: ChatMessage = { 
        role: 'bot' as const, 
        content: data.botResponse,
        timestamp: new Date()
      };
      if (data.external) botMsg.external = data.external;
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error('Chat API error:', error);
      setMessages((prev) => [...prev, { 
        role: 'bot', 
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Send a special mode-based request (mood check or affirmations)
  const handleSendMode = async (mode: 'mood_check' | 'affirmations') => {
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('No valid session found:', sessionError);
      router.push('/login');
      return;
    }

    // Add a visible user message to the chat to indicate the action
    const actionLabel = mode === 'mood_check' ? "Mood check-in" : "Requesting affirmations";
    const userMsg = {
      role: 'user' as const,
      content: actionLabel,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ message: '', chatHistory: messages, mode }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const botMsg: ChatMessage = {
        role: 'bot',
        content: data.botResponse,
        timestamp: new Date(),
      };
      if (data.external) botMsg.external = data.external;
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error('Chat API error:', error);
      setMessages((prev) => [...prev, {
        role: 'bot',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) handleSend();
  };

  // Voice input functionality
  const handleSpeak = () => {
    if (typeof window === "undefined") {
      alert("Speech recognition is not available in this environment.");
      return;
    }

    // Check for speech recognition support
    const windowObj = window as unknown as Record<string, unknown>;
    const SpeechRecognition = 
      windowObj.SpeechRecognition || 
      windowObj.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    try {
      const recognition = new (SpeechRecognition as new () => unknown)();
      const rec = recognition as Record<string, unknown>;
      
      // Configure recognition
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false;

      // Event handlers
      rec.onstart = () => {
        setIsRecording(true);
        console.log("Speech recognition started");
      };

      rec.onend = () => {
        setIsRecording(false);
        console.log("Speech recognition ended");
      };

      rec.onresult = (event: unknown) => {
        const e = event as { results: { [key: number]: { [key: number]: { transcript: string } } } };
        if (e.results && e.results[0] && e.results[0][0]) {
          const transcript = e.results[0][0].transcript;
          console.log("Speech recognition result:", transcript);
          setInput(transcript);
        }
        setIsRecording(false);
      };

      rec.onerror = (event: unknown) => {
        const e = event as { error: string };
        setIsRecording(false);
        console.error("Speech recognition error:", e.error);
        
        let errorMessage = "Speech recognition error: ";
        switch (e.error) {
          case 'no-speech':
            errorMessage += "No speech was detected. Please try again.";
            break;
          case 'audio-capture':
            errorMessage += "No microphone was found. Please check your microphone.";
            break;
          case 'not-allowed':
            errorMessage += "Microphone permission denied. Please allow microphone access.";
            break;
          case 'network':
            errorMessage += "Network error. Please check your connection.";
            break;
          default:
            errorMessage += e.error || "Unknown error occurred.";
        }
        
        alert(errorMessage);
      };

      // Start recognition
      (rec.start as () => void)();
      
    } catch (error) {
      setIsRecording(false);
      console.error("Error starting speech recognition:", error);
      alert("Failed to start speech recognition. Please try again.");
    }
  };

  // Suggested starter messages
  const starterMessages = [
    "I'm feeling anxious and overwhelmed today",
    "I need motivation and encouragement to get through the day",
    "Can you help me relax and find inner peace?",
    "I'm stressed about work and need coping strategies",
    "I want to check in with my emotions and improve my mood",
    "Show me the latest news to distract my mind"
  ];

  const handleStarterMessage = (message: string) => {
    setInput(message);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Show loading while checking authentication
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-sky-100 via-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
        <div className="flex justify-between items-center p-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                MoodTherapist
              </h1>
              <p className="text-sm text-gray-500">Your AI Mental Health Companion</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          {showWelcome && (
            <div className="text-center mb-8 animate-fade-in">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Your Safe Space</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  I&apos;m here to listen, support, and help you navigate your emotions. 
                  Share what&apos;s on your mind, and I&apos;ll provide personalized guidance and wellness resources.
                </p>
              </div>

              {/* Starter Messages */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Try asking me about:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {starterMessages.map((message, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleStarterMessage(message)}
                      className="p-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/90 hover:shadow-md transition-all duration-200 text-left"
                    >
                      <span className="text-gray-700">{message}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-6 flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-in`}
            >
              <div className={`flex items-start gap-3 max-w-2xl ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user" 
                    ? "bg-gradient-to-r from-emerald-400 to-teal-500" 
                    : "bg-gradient-to-r from-green-500 to-teal-500"
                }`}>
                  {msg.role === "user" ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  )}
                </div>

                {/* Message Content */}
                <div className={`${msg.role === "user" ? "text-right" : "text-left"}`}>
                  <div className={`inline-block px-4 py-3 rounded-2xl shadow-md ${
                    msg.role === "user" 
                      ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-blue-200" 
                      : "bg-white text-gray-800 border border-gray-200 shadow-gray-200"
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                  {msg.timestamp && (
                    <p className={`text-xs text-gray-500 mt-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* External Content Cards */}
          {messages.map((msg, idx) => msg.external ? (
            <div key={`ext-${idx}`} className="mb-6 animate-slide-in">
              {msg.external.type === 'news' && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    Latest News
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {msg.external.payload?.articles?.map((a: NewsArticle, i: number) => (
                      <a 
                        key={i} 
                        href={a.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="block p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 hover:shadow-md transition-all duration-200"
                      >
                        <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">{a.title}</h4>
                        <p className="text-sm text-blue-600 mb-2">{a.source}</p>
                        <p className="text-sm text-gray-600 line-clamp-3">{a.description}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null)}

          {/* Loading Animation */}
          {loading && (
            <div className="mb-6 flex justify-start animate-slide-in">
              <div className="flex items-start gap-3 max-w-2xl">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl border border-gray-200 shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-gray-700 text-sm font-medium">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - fixed and above bottom nav */}
      <div
        className="fixed left-0 right-0 z-50"
        style={{ bottom: 'var(--bottom-nav-height)', backdropFilter: 'blur(8px)' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Voice Input FAB */}
            <div className="flex-shrink-0">
              <IconButton
                onClick={handleSpeak}
                ariaLabel={isRecording ? 'Recording' : 'Voice input'}
                disabled={loading}
                variant={isRecording ? 'solid' : 'ghost'}
                className={`w-14 h-14 ${isRecording ? 'bg-red-500 text-white animate-pulse' : ''}`}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                }
              />
            </div>

            {/* Text Input */}
            <div className="flex-1 relative">
              {/* Use shared TextInput component for consistent styling and accessibility */}
              <TextInput
                placeholder="Share what's on your mind..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                ariaLabel="Chat message"
                className=""
              />
              {input && (
                <button
                  onClick={() => setInput("")}
                  className="absolute right-16 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear input"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Prominent Send Button */}
            <div className="flex-shrink-0">
              <IconButton
                onClick={handleSend}
                ariaLabel="Send message"
                disabled={loading || !input.trim()}
                variant="solid"
                className="w-14 h-14"
                icon={
                  loading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2z" />
                    </svg>
                  )
                }
              />
            </div>
          </div>

          {/* Quick Actions - horizontal, scrollable on small screens */}
          {!loading && input.length === 0 && messages.length > 0 && (
            <div className="mt-3 overflow-x-auto py-2">
              <div className="flex gap-2 w-max">
                <button
                  onClick={() => handleSendMode('mood_check')}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                >
                  💭 Mood Check-in
                </button>
                <button
                  onClick={() => setInput('Show me the latest news')}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors"
                >
                  📰 News Updates
                </button>
                <button
                  onClick={() => handleSendMode('affirmations')}
                  className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors"
                >
                  ✨ Daily Affirmations
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-slide-in {
          animation: slide-in 0.4s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
