// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();

    const { email, password, full_name, phone } = body;

    // ולידציה בסיסית
    if (!email || !password || !full_name || !phone) {
      return NextResponse.json(
        { error: 'חסרים פרטים נדרשים' },
        { status: 400 }
      );
    }

    // יצירת slug ייחודי מהשם
    let slug = full_name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // הסרת תווים מיוחדים
      .replace(/\s+/g, '-'); // החלפת רווחים במקפים

    // בדיקה שה-slug לא תפוס
    let slugExists = true;
    let counter = 1;
    let finalSlug = slug;

    while (slugExists) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('slug')
        .eq('slug', finalSlug)
        .single();

      if (!existingUser) {
        slugExists = false;
      } else {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }
    }

    // יצירת המשתמש ב-Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          phone,
          slug: finalSlug
        }
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return NextResponse.json(
        { error: 'שגיאה ביצירת החשבון: ' + authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'שגיאה ביצירת החשבון' },
        { status: 400 }
      );
    }

    // יצירת רשומה בטבלת users
    // נשתמש ב-service role client כדי לעקוף את ה-RLS
    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // Service Role Key
    );

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        full_name,
        email,
        phone,
        slug: finalSlug
      })
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);

      // מחיקת המשתמש מ-Auth אם נכשלה יצירת הרשומה
      await supabase.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        { error: 'שגיאה בשמירת פרטי המשתמש' },
        { status: 500 }
      );
    }

    // התחברות אוטומטית אחרי רישום
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return NextResponse.json({
      message: 'חשבון נוצר בהצלחה',
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        slug: userData.slug
      },
      needsEmailConfirmation: !authData.session,
      signedIn: !signInError
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}