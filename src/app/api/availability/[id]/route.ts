// src/app/api/availability/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // בדיקת authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'לא מורשה' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { day_of_week, start_time, end_time, is_active } = body;

    // בדיקה שהזמינות שייכת למשתמש
    const { data: existingAvailability, error: fetchError } = await supabase
      .from('availability')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingAvailability) {
      return NextResponse.json(
        { error: 'זמינות לא נמצאה' },
        { status: 404 }
      );
    }

    // ולידציה
    if (start_time && end_time && start_time >= end_time) {
      return NextResponse.json(
        { error: 'שעת התחלה חייבת להיות לפני שעת הסיום' },
        { status: 400 }
      );
    }

    // עדכון הזמינות
    const updateData: any = {};
    if (day_of_week !== undefined) updateData.day_of_week = day_of_week;
    if (start_time) updateData.start_time = start_time;
    if (end_time) updateData.end_time = end_time;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: updatedAvailability, error: updateError } = await supabase
      .from('availability')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating availability:', updateError);
      return NextResponse.json(
        { error: 'שגיאה בעדכון הזמינות' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedAvailability);

  } catch (error) {
    console.error('Error in availability PATCH:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // בדיקת authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'לא מורשה' },
        { status: 401 }
      );
    }

    const { id } = params;

    // בדיקה שהזמינות שייכת למשתמש
    const { data: existingAvailability, error: fetchError } = await supabase
      .from('availability')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingAvailability) {
      return NextResponse.json(
        { error: 'זמינות לא נמצאה' },
        { status: 404 }
      );
    }

    // מחיקת הזמינות
    const { error: deleteError } = await supabase
      .from('availability')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting availability:', deleteError);
      return NextResponse.json(
        { error: 'שגיאה במחיקת הזמינות' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'זמינות נמחקה בהצלחה' });

  } catch (error) {
    console.error('Error in availability DELETE:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}
