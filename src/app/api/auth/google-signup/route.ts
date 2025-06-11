// src/app/api/auth/google-signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { user_id, email, full_name, profile_pic } = await request.json();
    
    const supabase = await createClient();
    
    // בדיקה שהמשתמש לא קיים כבר
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' });
    }

    // יצירת slug ייחודי
    const slug = full_name.toLowerCase()
      .replace(/[^\u0590-\u05FF\w\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    // הוספת המשתמש לטבלת users
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: user_id,
        full_name,
        email,
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        profile_pic
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'User profile created successfully' });

  } catch (error) {
    console.error('Google signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}