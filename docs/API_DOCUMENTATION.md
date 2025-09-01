# API Documentation

## Overview

The Mood Therapist application exposes several API endpoints for chat functionality, Spotify integration, and authentication. All endpoints are built using Next.js App Router API routes.

## Authentication

All API endpoints that require user data use Supabase authentication. Include the user's session token in requests where applicable.

## Endpoints

### Chat API

#### POST `/api/chat`

Sends a message to the AI therapist and receives a response.

**Request Body:**
```json
{
  "message": "I'm feeling anxious today",
  "chatHistory": [
    {
      "role": "user",
      "content": "Previous message",
      "user_id": "optional-user-id"
    }
  ]
}
```

**Response:**
```json
{
  "botResponse": "I understand you're feeling anxious. That's completely valid...",
  "detectedMood": "negative",
  "external": {
    "type": "spotify_genres",
    "genres": ["chill", "ambient", "classical"]
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Missing message
- `500` - Server error

### Spotify API

#### GET `/api/spotify`

Retrieves Spotify playlists based on mood and genre.

**Query Parameters:**
- `q` (required): Search query for playlists
- `type`: Search type (default: "playlist")
- `limit`: Number of results (default: 6)

**Example:**
```
GET /api/spotify?q=chill&limit=5
```

**Response:**
```json
{
  "playlists": [
    {
      "id": "37i9dQZF1DX0XUsuxWHRQd",
      "name": "Chill Hits",
      "url": "https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd",
      "image": "https://image-cdn-fa.spotifycdn.com/image/..."
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `400` - Missing query parameter
- `500` - Spotify API error

## Server Actions

### getBotResponse

Server action that processes user messages through Gemini AI.

**Parameters:**
- `message`: User's input message
- `chatHistory`: Array of previous conversation messages

**Returns:**
```typescript
{
  botResponse: string;
  detectedMood: 'positive' | 'negative' | 'neutral';
  external: ExternalContent | null;
}
```

### getSpotifyPlaylists

Server action for Spotify playlist search.

**Parameters:**
- `query`: Search query string

**Returns:**
```typescript
{
  playlists?: Array<{
    id: string;
    name: string;
    url?: string;
    image?: string;
  }>;
  error?: string;
}
```

### getTrendingNews

Server action for fetching news articles.

**Returns:**
```typescript
{
  articles?: Array<{
    title: string;
    url: string;
    source?: string;
    description: string;
    image?: string;
  }>;
  error?: string;
}
```

## Data Models

### ChatHistory
```typescript
type ChatHistory = Array<Record<string, unknown>>;
```

### ExternalContent
```typescript
interface ExternalContent {
  type: 'spotify_genres' | 'news';
  genres?: string[];
  payload?: {
    articles?: NewsArticle[];
  };
}
```

### SpotifyPlaylist
```typescript
interface SpotifyPlaylist {
  id: string;
  name: string;
  external_urls?: {
    spotify?: string;
  };
  images?: Array<{
    url: string;
  }>;
}
```

### NewsArticle
```typescript
interface NewsArticle {
  title: string;
  url: string;
  source?: {
    name: string;
  };
  description: string;
  urlToImage?: string;
}
```

## Error Handling

All API endpoints implement comprehensive error handling:

1. **Input Validation**: Check for required parameters
2. **External API Errors**: Handle third-party service failures
3. **Fallback Responses**: Provide default responses when services fail
4. **Logging**: All errors are logged to console for debugging

## Rate Limiting

- **Gemini API**: 60 requests per minute
- **Spotify API**: 100 requests per minute
- **News API**: 1000 requests per day (free tier)

## Authentication Flow

1. User authenticates via Supabase Auth
2. Session token stored in browser
3. API calls include user context when available
4. Database operations use Row Level Security (RLS)

## Database Schema

### ChatLog Table
```sql
CREATE TABLE ChatLog (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  detected_mood TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```
