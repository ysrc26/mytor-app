// src/app/api/users/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies: () => cookies() });
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
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
    const supabase = createServerComponentClient({ cookies: () => cookies() });
    
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