"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function LoginPage() {
  const [origin, setOrigin] = useState<string | null>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      if (typeof window !== 'undefined') setOrigin(window.location.origin);

      try {
        const { data } = await supabase.auth.getSession();
        console.debug('Supabase initial session:', data.session);
        if (data?.session) {
          router.replace('/chat');
          return;
        }
      } catch (e) {
        console.error('getSession error', e);
      }

      // Handle OAuth callback hash (access_token/refresh_token)
      try {
        if (typeof window !== 'undefined' && window.location.hash) {
          const hash = window.location.hash.replace(/^#/, '?');
          const params = new URLSearchParams(hash);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token) {
            const authAny: unknown = supabase.auth;

            const hasSetSession = (v: unknown): v is { setSession: (s: { access_token?: string | null; refresh_token?: string | null }) => Promise<unknown> } => {
              return typeof v === 'object' && v !== null && typeof (v as Record<string, unknown>)['setSession'] === 'function';
            };

            const hasGetSessionFromUrl = (v: unknown): v is { getSessionFromUrl: () => Promise<unknown> } => {
              return typeof v === 'object' && v !== null && typeof (v as Record<string, unknown>)['getSessionFromUrl'] === 'function';
            };

            if (hasSetSession(authAny)) {
              try {
                // @ts-expect-error runtime API
                await supabase.auth.setSession({ access_token, refresh_token });
                console.debug('setSession succeeded');
                history.replaceState(null, '', window.location.pathname + window.location.search);
                router.replace('/chat');
                return;
              } catch (e) {
                console.debug('setSession failed', e);
              }
            }

            if (hasGetSessionFromUrl(authAny)) {
              try {
                // @ts-expect-error runtime API
                await supabase.auth.getSessionFromUrl();
                console.debug('getSessionFromUrl succeeded');
                history.replaceState(null, '', window.location.pathname + window.location.search);
                router.replace('/chat');
                return;
              } catch (e) {
                console.debug('getSessionFromUrl failed', e);
              }
            }

            // fallback: try getSession after short delay
            setTimeout(async () => {
              try {
                const { data } = await supabase.auth.getSession();
                if (data?.session) router.replace('/chat');
              } catch (e) {
                console.debug('fallback getSession after hash parse failed', e);
              }
            }, 500);
          }
        }
      } catch (e) {
        console.debug('error handling OAuth callback hash', e);
      }

      setIsLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.debug('Supabase auth event:', event, session);
      if (event === 'SIGNED_IN' && session) {
        router.replace('/chat');
      }
    });

    return () => {
      // safe unsubscribe across client versions
      try {
        const l: unknown = listener;
        const hasSubUnsub = (v: unknown): v is { subscription: { unsubscribe: () => void } } => {
          return (
            typeof v === 'object' && v !== null &&
            'subscription' in (v as object) &&
            typeof (v as Record<string, unknown>)['subscription'] === 'object' &&
            typeof ((v as Record<string, unknown>)['subscription'] as Record<string, unknown>)['unsubscribe'] === 'function'
          );
        };
        const hasUnsub = (v: unknown): v is { unsubscribe: () => void } => {
          return (
            typeof v === 'object' && v !== null &&
            typeof (v as Record<string, unknown>)['unsubscribe'] === 'function'
          );
        };

        if (hasSubUnsub(l)) l.subscription.unsubscribe();
        else if (hasUnsub(l)) l.unsubscribe();
      } catch (e) {
        console.debug('error unsubscribing auth listener', e);
      }
    };
  }, [router]);

  const redirectTo = origin ? `${origin.replace(/\/$/, '')}/login` : undefined;

  // Development-only helpers and debug state were removed to avoid
  // unused-variable lint warnings; auth flow and session handling
  // remain unchanged (router redirect on SIGNED_IN).

  const customTheme = {
    default: {
      colors: {
        brand: '#3b82f6',
        brandAccent: '#1d4ed8',
        brandButtonText: 'white',
        defaultButtonBackground: '#f8fafc',
        defaultButtonBackgroundHover: '#f1f5f9',
        defaultButtonBorder: '#e2e8f0',
        defaultButtonText: '#334155',
        dividerBackground: '#e2e8f0',
        inputBackground: 'white',
        inputBorder: '#e2e8f0',
        inputBorderHover: '#cbd5e1',
        inputBorderFocus: '#3b82f6',
        inputText: '#0f172a',
        inputLabelText: '#475569',
        inputPlaceholder: '#94a3b8',
        messageText: '#dc2626',
        messageTextDanger: '#dc2626',
        anchorTextColor: '#3b82f6',
        anchorTextHoverColor: '#1d4ed8',
      },
      space: {
        spaceSmall: '4px',
        spaceMedium: '8px',
        spaceLarge: '16px',
        labelBottomMargin: '8px',
        anchorBottomMargin: '4px',
        emailInputSpacing: '4px',
        socialAuthSpacing: '4px',
        buttonPadding: '10px 15px',
        inputPadding: '10px 15px',
      },
      fontSizes: {
        baseBodySize: '14px',
        baseInputSize: '14px',
        baseLabelSize: '14px',
        baseButtonSize: '14px',
      },
      fonts: {
        bodyFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
        buttonFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
        inputFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
        labelFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
      },
      borderWidths: {
        buttonBorderWidth: '1px',
        inputBorderWidth: '1px',
      },
      radii: {
        borderRadiusButton: '8px',
        buttonBorderRadius: '8px',
        inputBorderRadius: '8px',
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-emerald-50 to-teal-50 flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md shadow-sm">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            MoodTherapist
          </span>
        </Link>
        <Link 
          href="/" 
          className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          ← Back to Home
        </Link>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-6">
              🔐 Secure Login
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-lg">
              Continue your mental health journey with our AI-powered companion
            </p>
          </div>

          {/* Auth Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : (
              <>
                <Auth
                  supabaseClient={supabase}
                  appearance={{ 
                    theme: ThemeSupa,
                    variables: customTheme,
                    className: {
                      container: 'space-y-4',
                      label: 'block text-sm font-medium text-gray-700 mb-2',
                      input: 'w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200',
                      button: 'w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 focus:ring-2 focus:ring-offset-2',
                      message: 'text-sm text-red-600 mt-2',
                      anchor: 'text-emerald-600 hover:text-blue-800 font-medium transition-colors',
                      divider: 'my-6',
                    }
                  }}
                  providers={["google"]}
                  theme="light"
                  socialLayout="horizontal"
                  view="sign_in"
                  {...(redirectTo ? { redirectTo } : {})}
                />
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      New to MoodTherapist?
                    </p>
                    <Link
                      href="/chat"
                      className="inline-flex items-center text-emerald-600 hover:text-blue-800 font-semibold transition-colors"
                    >
                      Start chatting now
                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-gray-700">100% Private</p>
            </div>
            <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-gray-700">AI-Powered</p>
            </div>
            <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-gray-700">24/7 Available</p>
            </div>
          </div>

          {/* Support Notice */}
          <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Mental Health Support</p>
                <p className="text-xs text-blue-700">
                  If you&apos;re experiencing a crisis, please contact emergency services or a crisis hotline immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500 bg-white/60 backdrop-blur-sm">
        <p>© {new Date().getFullYear()} MoodTherapist. Your privacy and mental health matter.</p>
      </footer>
    </div>
  );
}
