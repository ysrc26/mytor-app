// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session
  await supabase.auth.getUser();

  // IMPORTANT: רענון session - זה קריטי!
  const { data: { session }, error } = await supabase.auth.getSession();

  // If user is on dashboard but not authenticated, redirect to login
  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // If user is authenticated and tries to access auth pages, redirect to dashboard
  if (session && req.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard/redirect', req.url));
  }

  // ✅ ESSENTIAL SECURITY HEADERS
  supabaseResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
  supabaseResponse.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Strict CSP for better XSS protection
  supabaseResponse.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https:; " +
    "connect-src 'self' https://*.supabase.co https://*.supabase.in;"
  );

  // IMPORTANT: החזר את supabaseResponse שמכיל את הcookies המעודכנים
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};