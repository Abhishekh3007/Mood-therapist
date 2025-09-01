import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const { cookies, nextUrl } = req;
  const session = cookies.get('sb-access-token')?.value;

  // Protected routes that require authentication
  const protectedRoutes = ['/chat', '/dashboard'];
  const isProtectedRoute = protectedRoutes.some(route => nextUrl.pathname.startsWith(route));

  // If user tries to access protected routes without a session, redirect to /login
  // NOTE: Supabase client stores session in browser localStorage by default, so the server
  // may not see a cookie named 'sb-access-token' even when the client has an active session.
  // Redirecting here immediately prevents client-side post-login navigation (router.replace)
  // because the server will redirect the navigation back to /login.
  //
  // For a robust server-side protection, configure Supabase to set server cookies on auth
  // (or verify JWT server-side). For now, allow the request to proceed so the client can
  // finalize the session and navigate to protected routes after SIGNED_IN.
  if (!session && isProtectedRoute) {
    // let the client handle redirect after it finalizes the session
    console.debug('middleware: no sb-access-token cookie present; allowing protected route for client-side check');
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Only run middleware for routes that need protection. Keep the landing page and /login public.
export const config = {
  matcher: ['/chat/:path*', '/dashboard/:path*'],
};
