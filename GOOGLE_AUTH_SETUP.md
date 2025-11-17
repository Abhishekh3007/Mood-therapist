# Google OAuth Setup Guide

## Problem
"Site can't be reached" error when clicking Google login on production (Vercel).

## Root Cause
Google OAuth redirect URIs are not configured for your production domain.

---

## Solution Steps

### 1. Get Your Production URLs
- **Vercel URL**: `https://[your-app].vercel.app`
- **Supabase URL**: `https://imrpudnwzluwajcdhllw.supabase.co`

### 2. Configure Supabase (Dashboard)

#### A. Update Site URL
1. Go to: [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `imrpudnwzluwajcdhllw`
3. Navigate to: **Authentication** → **URL Configuration**
4. Set **Site URL** to:
   ```
   https://[your-vercel-app].vercel.app
   ```

#### B. Add Redirect URLs
In the same **URL Configuration** section:

Add these to **Redirect URLs**:
```
https://[your-vercel-app].vercel.app/**
https://[your-vercel-app].vercel.app/login
http://localhost:3000/**
http://localhost:3000/login
```

### 3. Configure Google Cloud Console

#### A. Go to Google Cloud Console
1. Visit: [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to: **APIs & Services** → **Credentials**

#### B. Edit OAuth 2.0 Client ID
1. Find your OAuth 2.0 Client ID (used for Supabase)
2. Click **Edit**

#### C. Add Authorized Redirect URIs
Add these URIs:
```
https://imrpudnwzluwajcdhllw.supabase.co/auth/v1/callback
http://localhost:54321/auth/v1/callback
```

#### D. Add Authorized JavaScript Origins
Add these origins:
```
https://[your-vercel-app].vercel.app
https://imrpudnwzluwajcdhllw.supabase.co
http://localhost:3000
```

### 4. Verify Environment Variables on Vercel

1. Go to: [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to: **Settings** → **Environment Variables**
4. Ensure these are set:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://imrpudnwzluwajcdhllw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   GEMINI_API_KEY=AIzaSyBGjZccIUuVAzm7Cn9YwaHo0Dmj9X5El6s
   NEWS_API_KEY=c4c54a522b7f435e9e2c70c11505521b
   NEWSAPI_KEY=c4c54a522b7f435e9e2c70c11505521b
   ```

### 5. Redeploy Your Application

After making all changes:
```bash
git add .
git commit -m "fix: update OAuth redirect URIs"
git push origin main
```

Or manually trigger a redeploy in Vercel.

---

## Testing

### Local Testing (http://localhost:3000)
1. Run: `npm run dev`
2. Visit: `http://localhost:3000/login`
3. Click "Sign in with Google"
4. Should redirect properly

### Production Testing
1. Visit: `https://[your-app].vercel.app/login`
2. Click "Sign in with Google"
3. Should redirect to Google login
4. After auth, should redirect back to `/chat`

---

## Common Issues

### Issue: "Redirect URI mismatch"
**Solution**: Make sure the Supabase callback URL is added to Google Cloud Console:
```
https://imrpudnwzluwajcdhllw.supabase.co/auth/v1/callback
```

### Issue: "Origin not allowed"
**Solution**: Add your Vercel domain to Authorized JavaScript Origins in Google Cloud Console.

### Issue: "Site can't be reached"
**Solution**: Check that your Vercel app is deployed and accessible. Test the base URL first.

---

## Checklist

- [ ] Supabase Site URL updated to production URL
- [ ] Supabase Redirect URLs include production domain
- [ ] Google Cloud Console: Supabase callback URL added
- [ ] Google Cloud Console: Vercel domain added to origins
- [ ] Environment variables set on Vercel
- [ ] Application redeployed
- [ ] Google login tested on production

---

## Support Links

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
