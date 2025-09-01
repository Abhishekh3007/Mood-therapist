# Deployment Guide

## Overview

This guide covers deploying the Mood Therapist application to various platforms. The application is built with Next.js and can be deployed to any platform that supports Node.js applications.

## Prerequisites

- Git repository with your code
- All environment variables configured
- Database migrations applied
- API keys with proper permissions

## Vercel Deployment (Recommended)

Vercel is the recommended platform as it's created by the Next.js team and offers seamless integration.

### 1. Prepare for Deployment

```bash
# Ensure your code is committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Connect to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel
```

### 3. Configure Environment Variables

In the Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all variables from your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEWSAPI_KEY=your_news_api_key
```

### 4. Deploy to Production

```bash
vercel --prod
```

## Netlify Deployment

### 1. Build Configuration

Create `netlify.toml` in your project root:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2. Deploy via Git

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard

## Railway Deployment

### 1. Create railway.json

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. Deploy via CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

## Docker Deployment

### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### 2. Build and Run

```bash
# Build image
docker build -t mood-therapist .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e GEMINI_API_KEY=your_key \
  mood-therapist
```

## AWS Amplify Deployment

### 1. Connect Repository

1. Go to AWS Amplify Console
2. Connect your GitHub repository
3. Choose the main branch

### 2. Build Settings

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### 3. Environment Variables

Add in Amplify Console under "Environment variables":
- All your `.env.local` variables
- Ensure `NODE_VERSION` is set to `18`

## Database Migration

Ensure your Supabase database is properly set up:

### 1. Run Migrations

```sql
-- In Supabase SQL Editor, run:

-- Migration 001: Create profiles and trigger
-- (Content from supabase/migrations/001_create_profiles_and_trigger.sql)

-- Migration 002: Create chatlog
-- (Content from supabase/migrations/002_create_chatlog.sql)
```

### 2. Verify Tables

Check that these tables exist:
- `profiles`
- `ChatLog`
- Proper RLS policies are enabled

## Domain Configuration

### Custom Domain Setup

1. **Vercel**: Project Settings → Domains → Add Domain
2. **Netlify**: Domain Settings → Add Custom Domain
3. **Railway**: Project Settings → Domain → Add Custom Domain

### SSL/HTTPS

All major platforms provide automatic SSL certificates. Ensure:
- HTTPS is enforced
- Voice recognition requires HTTPS to work
- All external API calls use HTTPS

## Performance Optimization

### 1. Image Optimization

Ensure `next.config.ts` has proper image domains:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'image-cdn-fa.spotifycdn.com',
    },
    // ... other domains
  ],
}
```

### 2. Bundle Analysis

```bash
# Analyze bundle size
npm install -g @next/bundle-analyzer
npm run build
npm run analyze
```

### 3. Caching Strategy

- Static assets: Cached for 1 year
- API responses: Cache external API calls
- Database queries: Use Supabase edge caching

## Monitoring and Logging

### 1. Vercel Analytics

Enable in Vercel dashboard:
- Performance monitoring
- Error tracking
- User analytics

### 2. Application Monitoring

Add error tracking:

```bash
npm install @sentry/nextjs
```

Configure in `next.config.ts`:

```typescript
const { withSentry } = require('@sentry/nextjs');

module.exports = withSentry({
  // your existing config
});
```

### 3. Health Checks

Create `/api/health` endpoint:

```typescript
export async function GET() {
  return Response.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
}
```

## Backup Strategy

### 1. Database Backups

Supabase provides automatic backups:
- Point-in-time recovery
- Daily backups retained for 7 days
- Weekly backups retained for 4 weeks

### 2. Code Backups

- Git repository (primary backup)
- Multiple deployment platforms
- Environment variable documentation

## Troubleshooting Deployment

### Common Issues

**Build Failures**
```bash
# Check logs
vercel logs <deployment-url>

# Local testing
npm run build
```

**Environment Variables**
- Verify all variables are set
- Check for typos in variable names
- Ensure API keys have proper permissions

**Database Connection**
- Verify Supabase URL and keys
- Check network restrictions
- Test database connectivity

**API Rate Limits**
- Monitor API usage
- Implement request caching
- Add fallback responses

### Debug Commands

```bash
# Check build locally
npm run build
npm start

# Verify environment
node -e "console.log(process.env)"

# Test API endpoints
curl https://your-domain.com/api/health
```

## Security Checklist

- [ ] All API keys stored as environment variables
- [ ] No sensitive data in client-side code
- [ ] HTTPS enforced on production
- [ ] Supabase RLS policies enabled
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Error messages don't expose sensitive data

## Post-Deployment Testing

1. **Authentication Flow**
   - User registration
   - Login/logout
   - Session persistence

2. **Core Features**
   - Chat functionality
   - Voice recognition
   - Music recommendations
   - News integration

3. **Performance**
   - Page load times
   - API response times
   - Image loading

4. **Mobile Responsiveness**
   - Test on various devices
   - Voice input on mobile
   - Touch interactions

## Maintenance

### Regular Tasks

- Monitor API usage and costs
- Update dependencies monthly
- Review error logs weekly
- Test all features after updates
- Backup critical data

### Scaling Considerations

- Monitor response times
- Consider CDN for static assets
- Implement database connection pooling
- Use edge functions for global performance

---

**Successfully deployed applications should be secure, performant, and monitored.**
