// src/lib/supabase-server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * יצירת Supabase client לשימוש ב-Server Components ו-API Routes
 * עם תמיכה מלאה ב-Next.js 15 cookies API
 */
export async function createClient() {
  const cookieStore = await cookies();
  
   // הוסף debugging
   const allCookies = cookieStore.getAll();
   console.log('All cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })));
   
   const authCookie = allCookies.find(c => c.name.includes('auth-token'));
   console.log('Auth cookie found:', !!authCookie);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}