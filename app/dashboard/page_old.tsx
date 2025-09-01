'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import Link from 'next/link';

interface ChatLog {
  id: number;
  user_message: string;
  bot_response: string;
  detected_mood: string;
  created_at: string;
}

interface MoodData {
  mood: string;
  count: number;
  percentage: number;
}

interface DailyMoodData {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

const COLORS = {
  positive: '#10B981', // Green
  neutral: '#F59E0B',  // Yellow
  negative: '#EF4444', // Red
};

const DashboardPage = () => {
  const { user, loading } = useAuth();
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [moodData, setMoodData] = useState<MoodData[]>([]);
  const [dailyMoodData, setDailyMoodData] = useState<DailyMoodData[]>([]);
  const [stats, setStats] = useState({
    totalChats: 0,
    totalDays: 0,
    averageChatsPerDay: 0,
    mostFrequentMood: '',
  });
  const [dateRange, setDateRange] = useState(30); // Default to last 30 days

  const fetchChatLogs = useCallback(async () => {
    if (!user) return;

    const startDate = startOfDay(subDays(new Date(), dateRange));
    const endDate = endOfDay(new Date());

    const { data, error } = await supabase
      .from('ChatLog')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching chat logs:', error);
    } else {
      setChatLogs(data || []);
    }
  }, [user, dateRange]);

  const processMoodData = useCallback(() => {
    const moodCounts = chatLogs.reduce((acc, log) => {
      const mood = log.detected_mood || 'neutral';
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = chatLogs.length;
    const moodArray: MoodData[] = Object.entries(moodCounts).map(([mood, count]) => ({
      mood: mood.charAt(0).toUpperCase() + mood.slice(1),
      count,
      percentage: Math.round((count / total) * 100),
    }));

    setMoodData(moodArray);
  }, [chatLogs]);

  const processDailyMoodData = useCallback(() => {
    const dailyData: Record<string, { positive: number; neutral: number; negative: number }> = {};

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dailyData[date] = { positive: 0, neutral: 0, negative: 0 };
    }

    // Count moods by day
    chatLogs.forEach(log => {
      const date = format(new Date(log.created_at), 'yyyy-MM-dd');
      const mood = log.detected_mood || 'neutral';
      
      if (dailyData[date]) {
        dailyData[date][mood as keyof typeof dailyData[string]]++;
      }
    });

    const dailyArray: DailyMoodData[] = Object.entries(dailyData).map(([date, moods]) => ({
      date: format(new Date(date), 'MMM dd'),
      ...moods,
      total: moods.positive + moods.neutral + moods.negative,
    }));

    setDailyMoodData(dailyArray);
  }, [chatLogs]);

  const calculateStats = useCallback(() => {
    const totalChats = chatLogs.length;
    const uniqueDays = new Set(chatLogs.map(log => 
      format(new Date(log.created_at), 'yyyy-MM-dd')
    )).size;
    
    const moodCounts = chatLogs.reduce((acc, log) => {
      const mood = log.detected_mood || 'neutral';
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostFrequentMood = Object.entries(moodCounts).reduce((a, b) => 
      moodCounts[a[0]] > moodCounts[b[0]] ? a : b
    )?.[0] || 'neutral';

    setStats({
      totalChats,
      totalDays: uniqueDays,
      averageChatsPerDay: uniqueDays > 0 ? Math.round(totalChats / uniqueDays * 10) / 10 : 0,
      mostFrequentMood: mostFrequentMood.charAt(0).toUpperCase() + mostFrequentMood.slice(1),
    });
  }, [chatLogs]);

  useEffect(() => {
    if (user) {
      fetchChatLogs();
    }
  }, [user, dateRange, fetchChatLogs]);

  useEffect(() => {
    if (chatLogs.length > 0) {
      processMoodData();
      processDailyMoodData();
      calculateStats();
    }
  }, [chatLogs, processMoodData, processDailyMoodData, calculateStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
          <p className="text-gray-600 mb-6">You must be logged in to view your dashboard and personal analytics.</p>
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
                        {session.mood && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            session.mood === 'positive' 
                              ? 'bg-green-900 text-green-300'
                              : session.mood === 'negative'
                              ? 'bg-red-900 text-red-300'
                              : 'bg-yellow-900 text-yellow-300'
                          }`}>
                            {session.mood}
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
              <p className="text-3xl font-bold text-blue-600">{stats.totalChats}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Active Days</h3>
              <p className="text-3xl font-bold text-green-600">{stats.totalDays}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Avg. Chats/Day</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.averageChatsPerDay}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Dominant Mood</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.mostFrequentMood}</p>
            </div>
          </div>

        {/* Recent Chat History - ChatGPT Style */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Chat History Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
                <span className="text-sm text-gray-500">{chatLogs.length} chats</span>
              </div>
              
              {chatLogs.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {chatLogs.slice(0, 20).map((log) => (
                    <div 
                      key={log.id} 
                      className="group p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {log.user_message.length > 50 
                              ? log.user_message.substring(0, 50) + '...' 
                              : log.user_message
                            }
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <span 
                            className={`inline-block w-2 h-2 rounded-full ${
                              log.detected_mood === 'positive' 
                                ? 'bg-green-400'
                                : log.detected_mood === 'negative'
                                ? 'bg-red-400'
                                : 'bg-yellow-400'
                            }`}
                          />
                        </div>
                      </div>
                      
                      {/* Expanded view on hover */}
                      <div className="hidden group-hover:block mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-600 line-clamp-2">
                          <strong>AI:</strong> {log.bot_response.substring(0, 100)}
                          {log.bot_response.length > 100 ? '...' : ''}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span 
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              log.detected_mood === 'positive' 
                                ? 'bg-green-100 text-green-700'
                                : log.detected_mood === 'negative'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {log.detected_mood}
                          </span>
                          <button className="text-xs text-blue-600 hover:text-blue-800">
                            View Full
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {chatLogs.length > 20 && (
                    <div className="text-center py-3">
                      <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        View All {chatLogs.length} Conversations
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">No conversations yet</p>
                  <Link 
                    href="/chat" 
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Start Your First Chat
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Mood Distribution Pie Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Mood Distribution</h2>
                {moodData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={moodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ mood, percentage }) => `${mood}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {moodData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[entry.mood.toLowerCase() as keyof typeof COLORS] || '#8884d8'} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No data available for the selected period
                  </div>
                )}
              </div>

              {/* Daily Mood Trends */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Mood Trends (Last 7 Days)</h2>
                {dailyMoodData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyMoodData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="positive" stackId="a" fill={COLORS.positive} name="Positive" />
                      <Bar dataKey="neutral" stackId="a" fill={COLORS.neutral} name="Neutral" />
                      <Bar dataKey="negative" stackId="a" fill={COLORS.negative} name="Negative" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No data available for the selected period
                  </div>
                )}
              </div>
            </div>

            {/* Mood Trend Line Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Mood Trend Over Time</h2>
              {dailyMoodData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyMoodData}>
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
    </div>
  );
};

export default DashboardPage;
