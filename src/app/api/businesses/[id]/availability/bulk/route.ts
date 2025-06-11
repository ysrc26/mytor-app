// src/app/api/businesses/[id]/availability/bulk/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    const businessId = resolvedParams.id;

    // בדיקת הרשאה
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    // בדיקה שהעסק שייך למשתמש
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single();

    if (businessError || !business) {
      return NextResponse.json({ error: 'עסק לא נמצא' }, { status: 404 });
    }

    // מחיקת כל הזמינות של העסק
    const { error: deleteError } = await supabase
      .from('availability')
      .delete()
      .eq('business_id', businessId)
      .eq('user_id', user.id);  // <- הוסף גם את זה לביטחון

    if (deleteError) {
      console.error('Delete error:', deleteError); // לוג לדיבוג
      return NextResponse.json({ error: 'שגיאה במחיקת זמינות' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting availability:', error);
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    const businessId = resolvedParams.id;
    const { availability }: { availability: { day_of_week: string; start_time: string; end_time: string }[] } = await request.json();

    // בדיקת הרשאה
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    // בדיקה שהעסק שייך למשתמש
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single();

    if (businessError || !business) {
      return NextResponse.json({ error: 'עסק לא נמצא' }, { status: 404 });
    }

    // הכנת הנתונים להכנסה - הוסף גם user_id וגם business_id
    const availabilityData = availability.map((avail: { day_of_week: string; start_time: string; end_time: string }) => ({
      user_id: user.id,          // <- הוסף את זה
      business_id: businessId,
      day_of_week: avail.day_of_week,
      start_time: avail.start_time,
      end_time: avail.end_time,
      is_active: true
    }));

    // יצירת זמינות חדשה
    const { error: insertError } = await supabase
      .from('availability')
      .insert(availabilityData);

    if (insertError) {
      console.error('Insert error:', insertError); // לוג לדיבוג
      return NextResponse.json({ error: 'שגיאה ביצירת זמינות' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error creating availability:', error);
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}