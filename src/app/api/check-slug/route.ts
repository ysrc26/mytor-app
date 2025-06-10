// src/app/api/check-slug/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { slug, currentSlug } = await request.json();
    
    if (!slug) {
      return NextResponse.json({ available: false, error: 'חסר slug' });
    }

    const supabase = createServerComponentClient({ cookies: () => cookies() });
    
    let query = supabase
      .from('users')
      .select('slug')
      .eq('slug', slug);
      
    // אם זה עדכון של slug קיים, לא לבדוק מול עצמו
    if (currentSlug) {
      query = query.neq('slug', currentSlug);
    }
    
    const { data } = await query.maybeSingle();
    
    return NextResponse.json({ 
      available: !data,
      slug 
    });

  } catch (error) {
    return NextResponse.json({ available: false, error: 'שגיאה בבדיקה' });
  }
}