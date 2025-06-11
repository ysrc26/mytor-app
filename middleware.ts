// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({ request: req });

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
            req.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: רענון session - זה קריטי!
  const { data: { session }, error } = await supabase.auth.getSession();

  // If user is on dashboard but not authenticated, redirect to login
  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // If user is authenticated and tries to access auth pages, redirect to dashboard
  if (session && req.nextUrl.pathname.startsWith('/auth') && !req.nextUrl.pathname.includes('/callback')) {
    return NextResponse.redirect(new URL('/dashboard/redirect', req.url));
  }

  // IMPORTANT: החזר את supabaseResponse שמכיל את הcookies המעודכנים
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};