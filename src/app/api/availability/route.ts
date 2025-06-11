// src/app/api/availability/route.ts
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

    // שליפת כל הזמינות של המשתמש
    const { data: availability, error } = await supabase
      .from('availability')
      .select('*')
      .eq('user_id', user.id)
      .order('day_of_week');

    if (error) {
      console.error('Error fetching availability:', error);
      return NextResponse.json(
        { error: 'שגיאה בשליפת הזמינות' },
        { status: 500 }
      );
    }

    return NextResponse.json(availability || []);

  } catch (error) {
    console.error('Error in availability GET:', error);
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
    const { day_of_week, start_time, end_time, is_active = true } = body;

    // ולידציה
    if (day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'חסרים פרמטרים נדרשים' },
        { status: 400 }
      );
    }

    if (day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json(
        { error: 'יום לא תקין' },
        { status: 400 }
      );
    }

    if (start_time >= end_time) {
      return NextResponse.json(
        { error: 'שעת התחלה חייבת להיות לפני שעת הסיום' },
        { status: 400 }
      );
    }

    // בדיקה אם כבר קיימת זמינות לאותו יום ושעות חופפות
    const { data: existingAvailability } = await supabase
      .from('availability')
      .select('*')
      .eq('user_id', user.id)
      .eq('day_of_week', day_of_week)
      .eq('is_active', true);

    if (existingAvailability && existingAvailability.length > 0) {
      // בדיקת חפיפה בשעות
      const hasOverlap = existingAvailability.some(existing => {
        return (start_time < existing.end_time && end_time > existing.start_time);
      });

      if (hasOverlap) {
        return NextResponse.json(
          { error: 'כבר קיימת זמינות חופפת לשעות אלו' },
          { status: 400 }
        );
      }
    }

    // יצירת זמינות חדשה
    const { data: newAvailability, error: insertError } = await supabase
      .from('availability')
      .insert({
        user_id: user.id,
        day_of_week,
        start_time,
        end_time,
        is_active
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating availability:', insertError);
      return NextResponse.json(
        { error: 'שגיאה ביצירת הזמינות' },
        { status: 500 }
      );
    }

    return NextResponse.json(newAvailability, { status: 201 });

  } catch (error) {
    console.error('Error in availability POST:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}