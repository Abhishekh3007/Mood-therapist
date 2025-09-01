# Development Guide

## Getting Started

This guide will help you set up the development environment and understand the codebase structure.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- VS Code (recommended)

## Development Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd mood-therapist
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local` and fill in your API keys:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Service
GEMINI_API_KEY=your_gemini_api_key

# External APIs
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEWSAPI_KEY=your_news_api_key
```

### 3. Database Setup

Run the SQL migrations in your Supabase dashboard:

```sql
-- supabase/migrations/001_create_profiles_and_trigger.sql
-- supabase/migrations/002_create_chatlog.sql
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Project Architecture

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Google Gemini
- **External APIs**: Spotify Web API, News API

### Folder Structure

```
app/
├── actions.ts              # Server actions for API integrations
├── layout.tsx              # Root layout with auth provider
├── page.tsx                # Landing page
├── globals.css             # Global styles
├── api/
│   ├── chat/route.ts       # Chat API endpoint
│   └── spotify/route.ts    # Spotify API endpoint
├── chat/
│   └── page.tsx            # Main chat interface
└── login/
    └── page.tsx            # Authentication page

lib/
├── AuthContext.tsx         # Authentication context
├── SignOutButton.tsx       # Sign out component
└── supabaseClient.ts       # Supabase configuration

supabase/
└── migrations/             # Database schema migrations

types/
└── sentiment.d.ts          # TypeScript type definitions
```

## Key Components

### 1. Chat Interface (`app/chat/page.tsx`)

The main chat interface handles:
- Message rendering
- Voice input
- External content display (music/news)
- Real-time AI responses

Key features:
```typescript
// Voice recognition
const handleSpeak = () => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    setError('Speech recognition not supported');
    return;
  }
  // Implementation...
};

// Message sending
const handleSendMessage = async () => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: inputMessage, chatHistory: messages }),
  });
};
```

### 2. Server Actions (`app/actions.ts`)

Contains server-side logic for:
- Gemini AI integration
- Spotify playlist search
- News article fetching
- Sentiment analysis

```typescript
export async function getBotResponse(message: string, chatHistory: ChatHistory) {
  // Sentiment analysis
  const analyzer = new Sentiment();
  const result = analyzer.analyze(message);
  
  // Gemini AI integration
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  // Generate response...
}
```

### 3. Authentication (`lib/AuthContext.tsx`)

Handles user authentication state:
```typescript
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
};
```

## Development Workflow

### 1. Feature Development

1. Create a feature branch:
   ```bash
   git checkout -b feature/new-feature
   ```

2. Make changes and test locally:
   ```bash
   npm run dev
   ```

3. Run type checking:
   ```bash
   npm run build
   ```

4. Commit and push:
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature
   ```

### 2. Code Quality

#### TypeScript

- Use strict TypeScript settings
- Define proper interfaces for all data structures
- Avoid `any` types

#### ESLint Configuration

```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

#### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 3. Testing Strategy

#### Manual Testing Checklist

- [ ] User authentication flow
- [ ] Chat message sending/receiving
- [ ] Voice input functionality
- [ ] Music recommendation flow
- [ ] News article display
- [ ] Mobile responsiveness
- [ ] Error handling

#### Unit Testing (Future Enhancement)

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Test structure
__tests__/
├── components/
│   ├── ChatInterface.test.tsx
│   └── AuthProvider.test.tsx
├── api/
│   ├── chat.test.ts
│   └── spotify.test.ts
└── utils/
    └── sentiment.test.ts
```

## API Integration

### 1. Gemini AI

```typescript
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const prompt = `You are a compassionate therapist...`;
const result = await model.generateContent(prompt);
const response = await result.response;
const text = response.text();
```

### 2. Spotify Web API

```typescript
const getAccessToken = async () => {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  
  const data = await response.json();
  return data.access_token;
};
```

### 3. News API

```typescript
const fetchNews = async () => {
  const response = await fetch(
    `https://newsapi.org/v2/top-headlines?country=us&pageSize=6&apiKey=${apiKey}`
  );
  
  if (!response.ok) throw new Error('NewsAPI error');
  const data = await response.json();
  return data.articles;
};
```

## Database Operations

### 1. Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### 2. Chat Logging

```typescript
const logChat = async (userId: string, userMessage: string, botResponse: string) => {
  const { error } = await supabase
    .from('ChatLog')
    .insert({
      user_id: userId,
      user_message: userMessage,
      bot_response: botResponse,
      detected_mood: mood,
    });
    
  if (error) console.error('Failed to log chat:', error);
};
```

### 3. User Profiles

```typescript
const createProfile = async (user: User) => {
  const { error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
    });
    
  if (error) console.error('Failed to create profile:', error);
};
```

## Styling Guidelines

### 1. Tailwind CSS

Use utility-first approach:
```tsx
<div className="bg-white rounded-lg shadow-lg p-6 mb-4">
  <h2 className="text-xl font-semibold text-gray-800 mb-2">
    Card Title
  </h2>
  <p className="text-gray-600">
    Card content
  </p>
</div>
```

### 2. Responsive Design

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

### 3. Dark Mode Support (Future)

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  {/* Content */}
</div>
```

## Performance Optimization

### 1. Next.js Image Optimization

```tsx
import Image from 'next/image';

<Image
  src={playlist.image}
  alt={playlist.name}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### 2. Code Splitting

```tsx
import dynamic from 'next/dynamic';

const VoiceInput = dynamic(() => import('./VoiceInput'), {
  ssr: false,
  loading: () => <p>Loading voice input...</p>
});
```

### 3. Caching Strategies

```typescript
// Server action with caching
export const getCachedNews = cache(async () => {
  return await getTrendingNews();
});
```

## Error Handling

### 1. API Error Boundaries

```tsx
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return <div>Something went wrong. Please try again.</div>;
  }
  
  return children;
};
```

### 2. Graceful Degradation

```typescript
const handleVoiceInput = () => {
  try {
    if (!('webkitSpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported');
    }
    // Implementation...
  } catch (error) {
    setError('Voice input not available. Please type your message.');
  }
};
```

## Debugging

### 1. Browser DevTools

- Console for client-side errors
- Network tab for API calls
- Application tab for local storage/cookies

### 2. Server Logs

```typescript
console.log('Processing message:', message);
console.error('API error:', error);
```

### 3. Supabase Logs

Monitor in Supabase dashboard:
- Auth logs
- Database logs
- API logs

## Contributing Guidelines

### 1. Code Standards

- Use TypeScript for all new code
- Follow existing naming conventions
- Add comments for complex logic
- Update documentation for new features

### 2. Git Workflow

- Create feature branches
- Write descriptive commit messages
- Keep commits atomic and focused
- Squash commits before merging

### 3. Pull Request Process

1. Ensure all tests pass
2. Update documentation
3. Add screenshots for UI changes
4. Request review from team members

## Useful Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks

# Database
npx supabase gen types typescript --project-id <id>  # Generate types

# Deployment
vercel               # Deploy to Vercel
npm run analyze      # Analyze bundle size
```

---

**Happy coding! 🚀**
