'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SignOutButton from '@/lib/SignOutButton';

interface ChatLog {
  id: string;
  user_message: string;
  bot_response: string;
  detected_mood: 'positive' | 'negative' | 'neutral';
  created_at: string;
}

interface ChartData {
  name: string;
  value: number;
}

interface DailyData {
  date: string;
  conversations: number;
}

interface MoodTrendData {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
}

interface Stats {
  totalChats: number;
  totalDays: number;
  averageChatsPerDay: string;
  mostFrequentMood: string;
}

const COLORS = {
  positive: '#10b981',
  negative: '#ef4444', 
  neutral: '#f59e0b',
  primary: '#3b82f6'
};

export default function DashboardPageBackup() {
  const [user, setUser] = useState<User | null>(null);
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error fetching user:', error);
          router.push('/login');
          return;
        }

        if (!user) {
          router.push('/login');
          return;
        }

        setUser(user);
      } catch (error) {
        console.error('Unexpected error during user check:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    
    checkUser();
  }, [router]);

  useEffect(() => {
    async function fetchChatLogs() {
      if (!user) return;

      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - dateRange);

        const { data, error } = await supabase
          .from('chatlog')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching chat logs:', error);
          return;
        }

        setChatLogs(data || []);
        setChatSessions(data || []);
      } catch (error) {
        console.error('Error in fetchChatLogs:', error);
      }
    }

    if (user) {
      fetchChatLogs();
    }
  }, [user, dateRange]);

  const stats = useCallback((): Stats => {
    if (chatLogs.length === 0) {
      return {
        totalChats: 0,
        totalDays: 0,
        averageChatsPerDay: '0',
        mostFrequentMood: 'No data'
      };
    }

    const uniqueDays = new Set(
      chatLogs.map(log => format(new Date(log.created_at), 'yyyy-MM-dd'))
    ).size;

    const moodCounts = chatLogs.reduce((acc, log) => {
      acc[log.detected_mood] = (acc[log.detected_mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostFrequentMood = Object.entries(moodCounts).reduce((a, b) => 
      moodCounts[a[0]] > moodCounts[b[0]] ? a : b
    )[0];

    return {
      totalChats: chatLogs.length,
      totalDays: uniqueDays,
      averageChatsPerDay: uniqueDays > 0 ? (chatLogs.length / uniqueDays).toFixed(1) : '0',
      mostFrequentMood: mostFrequentMood || 'No data'
    };
  }, [chatLogs]);

  const moodChartData = useCallback((): ChartData[] => {
    const moodCounts = chatLogs.reduce((acc, log) => {
      acc[log.detected_mood] = (acc[log.detected_mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(moodCounts).map(([mood, count]) => ({
      name: mood,
      value: count
    }));
  }, [chatLogs]);

  const dailyChartData = useCallback((): DailyData[] => {
    const dailyData = chatLogs.reduce((acc, log) => {
      const date = format(new Date(log.created_at), 'MMM dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyData)
      .map(([date, count]) => ({ date, conversations: count }))
      .slice(-7);
  }, [chatLogs]);

  const moodTrendData = useCallback((): MoodTrendData[] => {
    const dailyMoods = chatLogs.reduce((acc, log) => {
      const date = format(new Date(log.created_at), 'MMM dd');
      if (!acc[date]) {
        acc[date] = { positive: 0, negative: 0, neutral: 0 };
      }
      acc[date][log.detected_mood]++;
      return acc;
    }, {} as Record<string, { positive: number; negative: number; neutral: number }>);

    return Object.entries(dailyMoods)
      .map(([date, moods]) => ({ date, ...moods }))
      .slice(-7);
  }, [chatLogs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You need to be signed in to access your dashboard and personal analytics.
            </p>
          </div>
          <div className="space-y-3">
            <Link 
              href="/login"
              className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sign In to Your Account
            </Link>
            <Link 
              href="/" 
              className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
