// src/app/api/unavailable/route.ts - FIXED VERSION
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

    // Get user's business first
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'עסק לא נמצא' },
        { status: 404 }
      );
    }

    // שליפת תאריכים לא זמינים - משתמש ב-business_id אם קיים, אחרת ב-user_id
    let unavailableDates;

    // נסה קודם עם business_id
    const { data: businessUnavailable, error: businessUnavailableError } = await supabase
      .from('unavailable_dates')
      .select('*')
      .eq('business_id', business.id)
      .order('date');

    if (!businessUnavailableError && businessUnavailable && businessUnavailable.length > 0) {
      unavailableDates = businessUnavailable;
    } else {
      // נסה עם user_id אם לא נמצא עם business_id
      const { data: userUnavailable, error: userUnavailableError } = await supabase
        .from('unavailable_dates')
        .select('*')
        .eq('user_id', user.id)
        .order('date');

      if (userUnavailableError) {
        console.error('Error fetching unavailable dates:', userUnavailableError);
        return NextResponse.json(
          { error: 'שגיאה בשליפת התאריכים החסומים' },
          { status: 500 }
        );
      }

      unavailableDates = userUnavailable || [];
    }

    return NextResponse.json(unavailableDates);

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

    // Get user's business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'עסק לא נמצא' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { date, tag, description } = body;

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

    // בדיקה אם התאריך כבר חסום (בדוק עם business_id)
    const { data: existingBlock } = await supabase
      .from('unavailable_dates')
      .select('*')
      .eq('business_id', business.id)
      .eq('date', date)
      .single();

    if (existingBlock) {
      return NextResponse.json(
        { error: 'תאריך זה כבר חסום' },
        { status: 400 }
      );
    }

    // יצירת חסימה חדשה - עם business_id וגם user_id לתאימות לאחור
    const { data: newBlock, error: insertError } = await supabase
      .from('unavailable_dates')
      .insert({
        business_id: business.id,
        user_id: user.id,  // לתאימות לאחור
        date,
        tag: body.tag || null,
        description: body.description || null
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