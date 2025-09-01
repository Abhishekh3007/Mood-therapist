# Mood Therapist AI

A compassionate AI-powered mood therapy application that provides emotional support, music recommendations, and news updates through an intelligent chat interface.

## 🌟 Features

- **AI-Powered Therapy**: Utilizes Google's Gemini AI to provide empathetic, context-aware therapeutic responses
- **Voice Recognition**: Multi-browser voice input support with real-time speech-to-text
- **Music Therapy**: Spotify integration for mood-based playlist recommendations
- **News Updates**: Curated news articles to help with boredom and engagement
- **User Dashboard**: Comprehensive analytics with mood tracking, progress charts, and account details
- **Mood Analytics**: Visual charts showing mood distribution, trends, and patterns over time
- **User Authentication**: Secure login system powered by Supabase
- **Chat History**: Persistent conversation logging with mood tracking
- **Responsive Design**: Modern, accessible UI with enhanced contrast and readability
- **Real-time Sentiment Analysis**: Automatic mood detection from user messages

## 🚀 Tech Stack

- **Frontend**: Next.js 15.5.2, React 19, TypeScript
- **AI**: Google Gemini 1.5 Flash
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **APIs**: Spotify Web API, News API
- **Styling**: Tailwind CSS
- **Voice**: Web Speech Recognition API
- **Deployment**: Vercel-ready

## 📋 Prerequisites

Before running this application, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- API keys for the following services:
  - Google Gemini API
  - Spotify Web API
  - News API
  - Supabase project

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mood-therapist
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # AI Service
   GEMINI_API_KEY=your_gemini_api_key

   # Music Service
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

   # News Service
   NEWSAPI_KEY=your_news_api_key
   ```

4. **Set up the database**
   
   Run the SQL migrations in your Supabase dashboard:
   ```sql
   -- Located in supabase/migrations/
   -- 001_create_profiles_and_trigger.sql
   -- 002_create_chatlog.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Configuration

### API Keys Setup

#### 1. Google Gemini API
- Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create a new API key
- Add to `.env.local` as `GEMINI_API_KEY`

#### 2. Spotify Web API
- Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- Create a new app
- Copy Client ID and Client Secret
- Add to `.env.local`

#### 3. News API
- Register at [NewsAPI.org](https://newsapi.org/)
- Get your free API key
- Add to `.env.local` as `NEWSAPI_KEY`

#### 4. Supabase
- Create a project at [supabase.com](https://supabase.com)
- Get your project URL and anon key from Settings > API
- Run the provided SQL migrations

### Image Domains Configuration

The app is configured to load images from these domains:
- `image-cdn-fa.spotifycdn.com`
- `i.scdn.co`
- `mosaic.scdn.co`
- `seed-mix-image.spotifycdn.com`

## 📁 Project Structure

```
mood-therapist/
├── app/
│   ├── actions.ts              # Server actions for AI, Spotify, News APIs
│   ├── layout.tsx              # Root layout with auth context
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Global styles
│   ├── api/
│   │   ├── chat/route.ts       # Chat API endpoint
│   │   └── spotify/route.ts    # Spotify API endpoint
│   ├── chat/
│   │   └── page.tsx            # Main chat interface
│   ├── dashboard/
│   │   └── page.tsx            # User dashboard with analytics
│   └── login/
│       └── page.tsx            # Authentication page
├── lib/
│   ├── AuthContext.tsx         # Authentication context provider
│   ├── SignOutButton.tsx       # Sign out component
│   └── supabaseClient.ts       # Supabase client configuration
├── supabase/
│   └── migrations/             # Database migration files
├── types/
│   └── sentiment.d.ts          # TypeScript type definitions
├── next.config.ts              # Next.js configuration
└── package.json                # Dependencies and scripts
```

## 🎯 Usage

### Basic Chat
1. Navigate to `/login` and authenticate with Supabase
2. Go to `/chat` to start a conversation
3. Type or speak your message
4. Receive AI-powered therapeutic responses

### Voice Input
- Click the microphone button
- Allow browser microphone permissions
- Speak your message clearly
- The speech will be converted to text automatically

### Music Recommendations
- Mention "music" or "song" in your message
- The AI will offer genre suggestions
- Click on genres to get Spotify playlist recommendations

### News Updates
- Mention "news" or "bored" in your message
- Get curated top news articles
- Click articles to read full stories

### Dashboard & Analytics
- Access `/dashboard` to view your mood analytics
- View account information and usage statistics
- Analyze mood distribution with interactive pie charts
- Track daily mood trends with bar and line charts
- Review recent conversation history
- Monitor progress over different time periods (7, 30, 90 days)

## 🔒 Security Features

- **Environment Variables**: All sensitive data stored in environment variables
- **Supabase Auth**: Secure authentication with row-level security
- **API Validation**: Input validation on all API endpoints
- **Error Handling**: Comprehensive error handling with fallbacks
- **Type Safety**: Full TypeScript implementation

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Set Environment Variables**
   - Add all `.env.local` variables in Vercel dashboard
   - Ensure all API keys are properly configured

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- AWS Amplify
- Docker containers

## 🧪 Testing

Run the development server and test:

```bash
# Type checking
npm run build

# Development server
npm run dev
```

Test the following features:
- [ ] User authentication
- [ ] Chat functionality
- [ ] Voice recognition
- [ ] Music recommendations
- [ ] News integration
- [ ] Mobile responsiveness

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Port 3000 already in use**
```bash
# Kill the process using port 3000
npx kill-port 3000
# Or use a different port
npm run dev -- --port 3001
```

**Image loading errors**
- Ensure image domains are configured in `next.config.ts`
- Check Spotify API responses for valid image URLs

**API key errors**
- Verify all environment variables are set correctly
- Check API key permissions and quotas

**Voice recognition not working**
- Ensure HTTPS connection (required for Web Speech API)
- Grant microphone permissions in browser
- Test with different browsers (Chrome recommended)

### Getting Help

- Check the browser console for detailed error messages
- Review the terminal output for server-side errors
- Ensure all API services are operational

## 📊 Performance

- **Lighthouse Score**: 90+ Performance
- **Bundle Size**: Optimized with Next.js automatic splitting
- **Image Optimization**: Next.js Image component with remote patterns
- **API Caching**: Efficient caching strategies for external APIs

## 🔮 Future Enhancements

- [ ] Multi-language support
- [ ] Advanced mood analytics dashboard
- [ ] Integration with wearable devices
- [ ] Group therapy sessions
- [ ] Customizable AI personality settings
- [ ] Voice cloning for personalized responses
- [ ] Mobile app development

---

**Built with ❤️ for mental health and well-being**
