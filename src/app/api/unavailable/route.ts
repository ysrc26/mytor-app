// src/app/api/unavailable/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // בדיקת authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'לא מורשה' },
        { status: 401 }
      );
    }

    // שליפת תאריכים לא זמינים
    const { data: unavailableDates, error } = await supabase
      .from('unavailable_dates')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', new Date().toISOString().split('T')[0]) // רק תאריכים עתידיים
      .order('date');

    if (error) {
      console.error('Error fetching unavailable dates:', error);
      return NextResponse.json(
        { error: 'שגיאה בשליפת התאריכים החסומים' },
        { status: 500 }
      );
    }

    return NextResponse.json(unavailableDates || []);

  } catch (error) {
    console.error('Error in unavailable GET:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // בדיקת authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'לא מורשה' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { date } = body;

    // ולידציה
    if (!date) {
      return NextResponse.json(
        { error: 'חסר תאריך' },
        { status: 400 }
      );
    }

    const blockDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (blockDate < today) {
      return NextResponse.json(
        { error: 'לא ניתן לחסום תאריך בעבר' },
        { status: 400 }
      );
    }

    // בדיקה אם התאריך כבר חסום
    const { data: existingBlock } = await supabase
      .from('unavailable_dates')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .single();

    if (existingBlock) {
      return NextResponse.json(
        { error: 'תאריך זה כבר חסום' },
        { status: 400 }
      );
    }

    // יצירת חסימה חדשה
    const { data: newBlock, error: insertError } = await supabase
      .from('unavailable_dates')
      .insert({
        user_id: user.id,
        date
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating unavailable date:', insertError);
      return NextResponse.json(
        { error: 'שגיאה בחסימת התאריך' },
        { status: 500 }
      );
    }

    return NextResponse.json(newBlock, { status: 201 });

  } catch (error) {
    console.error('Error in unavailable POST:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}