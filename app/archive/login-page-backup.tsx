"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function LoginPageBackup() {
  const [origin, setOrigin] = useState<string | null>(null);
  const router = useRouter();
  const [lastAuthEvent, setLastAuthEvent] = useState<string | null>(null);
  const [lastAuthSession, setLastAuthSession] = useState<unknown>(null);
  const [checkResult, setCheckResult] = useState<string | null>(null);
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
      setLastAuthEvent(event ?? null);
      setLastAuthSession(session ?? null);
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

  const isDev = process.env.NODE_ENV !== 'production';

  const doCheckSession = async () => {
    try {
      const s = await supabase.auth.getSession();
      const u = await supabase.auth.getUser?.();
      setCheckResult(JSON.stringify({ session: s?.data?.session ?? null, user: u ?? null }, null, 2));
      console.debug('manual checkSession', s, u);
    } catch (e) {
      setCheckResult(String(e));
    }
  };

  const manualFinalize = async () => {
    try {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash.replace(/^#/, '?');
      const params = new URLSearchParams(hash);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token) {
        if (typeof (supabase.auth as unknown as Record<string, unknown>)['setSession'] === 'function') {
          // @ts-expect-error runtime
          await supabase.auth.setSession({ access_token, refresh_token });
          console.debug('manual setSession succeeded');
          setCheckResult('manual setSession succeeded');
          history.replaceState(null, '', window.location.pathname + window.location.search);
          router.replace('/chat');
          return;
        }
        if (typeof (supabase.auth as unknown as Record<string, unknown>)['getSessionFromUrl'] === 'function') {
          const fn = (supabase.auth as unknown as Record<string, unknown>)['getSessionFromUrl'] as () => Promise<unknown>;
          await fn();
          console.debug('manual getSessionFromUrl succeeded');
          setCheckResult('manual getSessionFromUrl succeeded');
          history.replaceState(null, '', window.location.pathname + window.location.search);
          router.replace('/chat');
          return;
        }
        setCheckResult('no runtime finalize method available');
      } else {
        setCheckResult('no access_token in URL hash');
      }
    } catch (e) {
      setCheckResult(String(e));
    }
  };

  const clearSession = async () => {
    try {
      await supabase.auth.signOut();
      setCheckResult('Session cleared');
      setLastAuthEvent('SIGNED_OUT');
      setLastAuthSession(null);
      // Refresh the page to show the login form
      window.location.reload();
    } catch (e) {
      setCheckResult('Error clearing session: ' + String(e));
    }
  };

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

  return null;
}
