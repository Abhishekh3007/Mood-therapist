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

export default function DashboardPage() {
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
          .from('ChatLog')
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ChatGPT-style Sidebar */}
      <div className="w-80 bg-gray-900 text-white flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Chat History</h2>
            <Link 
              href="/chat"
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              + New Chat
            </Link>
          </div>
        </div>

        {/* Chat Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {chatSessions.length === 0 ? (
            <div className="text-center text-gray-400 mt-8 p-4">
              <p className="text-sm">No chat history yet</p>
              <p className="text-xs mt-1 opacity-75">Start a conversation to see it here</p>
            </div>
          ) : (
            chatSessions.map((session) => {
              const sessionDate = new Date(session.created_at);
              const isToday = format(sessionDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              const timeDisplay = isToday 
                ? format(sessionDate, 'h:mm a')
                : format(sessionDate, 'MMM d');

              return (
                <div
                  key={session.id}
                  className="group p-3 rounded-lg hover:bg-gray-800 transition-all cursor-pointer border border-transparent hover:border-gray-600"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {session.user_message?.slice(0, 45)}
                        {session.user_message && session.user_message.length > 45 ? '...' : ''}
                      </p>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className="text-xs text-gray-400">{timeDisplay}</span>
                        {session.detected_mood && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            session.detected_mood === 'positive' 
                              ? 'bg-green-900 text-green-300'
                              : session.detected_mood === 'negative'
                              ? 'bg-red-900 text-red-300'
                              : 'bg-yellow-900 text-yellow-300'
                          }`}>
                            {session.detected_mood}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement delete functionality
                        console.log('Delete session:', session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all p-1"
                      title="Delete conversation"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Preview of bot response */}
                  {session.bot_response && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2 opacity-75">
                      {session.bot_response.slice(0, 80)}
                      {session.bot_response.length > 80 ? '...' : ''}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400 text-center">
            <p>{chatSessions.length} conversation{chatSessions.length !== 1 ? 's' : ''}</p>
            <p className="mt-1 opacity-75">Analytics updated daily</p>
          </div>
          <div className="mt-3 flex space-x-2">
            <Link 
              href="/" 
              className="flex-1 text-center bg-gray-800 text-gray-300 px-3 py-2 rounded text-xs hover:bg-gray-700 transition-colors"
            >
              Home
            </Link>
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">Welcome back, {user.email}</span>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* User Account Details */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  {format(new Date(user.created_at), 'MMMM dd, yyyy')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <p className="text-gray-600 bg-gray-50 px-3 py-2 rounded-md font-mono text-sm">
                  {user.id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Sign In</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  {user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics Period</h2>
            <div className="flex space-x-4">
              {[7, 30, 90].map(days => (
                <button
                  key={days}
                  onClick={() => setDateRange(days)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    dateRange === days
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Last {days} days
                </button>
              ))}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Conversations</h3>
              <p className="text-3xl font-bold text-blue-600">{stats().totalChats}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Active Days</h3>
              <p className="text-3xl font-bold text-green-600">{stats().totalDays}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Avg. Chats/Day</h3>
              <p className="text-3xl font-bold text-purple-600">{stats().averageChatsPerDay}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Dominant Mood</h3>
              <p className="text-3xl font-bold text-orange-600">{stats().mostFrequentMood}</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Mood Distribution Pie Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Distribution</h3>
              {moodChartData().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={moodChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {moodChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No mood data available for the selected period
                </div>
              )}
            </div>

            {/* Daily Conversations Bar Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity</h3>
              {dailyChartData().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="conversations" fill={COLORS.primary} name="Conversations" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No activity data available for the selected period
                </div>
              )}
            </div>
          </div>

          {/* Mood Trends Line Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Trends Over Time</h3>
            {moodTrendData().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={moodTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="positive" 
                    stroke={COLORS.positive} 
                    strokeWidth={2}
                    name="Positive Moods"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="neutral" 
                    stroke={COLORS.neutral} 
                    strokeWidth={2}
                    name="Neutral Moods"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="negative" 
                    stroke={COLORS.negative} 
                    strokeWidth={2}
                    name="Negative Moods"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available for the selected period
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
