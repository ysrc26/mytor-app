// src/app/api/users/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    console.log('Auth debug:', { user: authUser?.id, error: authError });
    if (authError || !authUser) {
      console.log('Authentication failed:', authError);
      return NextResponse.json(
        { error: 'לא מורשה' },
        { status: 401 }
      );
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'שגיאה בשליפת נתוני המשתמש' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: userData });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    const { full_name, phone, profile_pic } = await request.json();

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        full_name,
        phone,
        profile_pic
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'שגיאה בעדכון הפרטים' }, { status: 500 });
    }

    return NextResponse.json({ message: 'הפרטים עודכנו בהצלחה', user: updatedUser });

  } catch (error) {
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}