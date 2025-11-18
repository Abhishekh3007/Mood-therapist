"use client";

import { useState, useRef, useEffect } from "react";
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

export default function ChatPageBackup() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
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
        body: JSON.stringify({ message: input, chatHistory: messages }),
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) handleSend();
  };

  const handleSpeak = () => {
    if (typeof window === "undefined") {
      alert("Speech recognition is not available in this environment.");
      return;
    }

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
      
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false;

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

      (rec.start as () => void)();
      
    } catch (error) {
      setIsRecording(false);
      console.error("Error starting speech recognition:", error);
      alert("Failed to start speech recognition. Please try again.");
    }
  };

  const starterMessages = [
    "I'm feeling anxious today",
    "I need some motivation",
    "Can you help me relax?",
    "I'm stressed about work",
    "I want to improve my mood",
    "Show me the latest news"
  ];

  const handleStarterMessage = (message: string) => {
    setInput(message);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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

  return null;
}
