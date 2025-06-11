// src/app/api/public/[slug]/available-slots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabase-public';
import { rateLimit } from '@/lib/rate-limit';
import { timeUtils } from '@/lib/time-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  
  // Rate limit configuration
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(clientIp, 30, 60000)) { // 30 בקשות לדקה
    return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
  }

  let date: string | null = null;
  try {
    const supabase = supabasePublic;
    const { searchParams } = new URL(request.url);
    date = searchParams.get('date');
    const serviceId = searchParams.get('service_id');
    const slug = params.slug;

    // ולידציה בסיסית
    if (!date) {
      return NextResponse.json({ error: 'חסר תאריך' }, { status: 400 });
    }

    if (!serviceId) {
      return NextResponse.json({ error: 'חסר מזהה שירות' }, { status: 400 });
    }

    // בדיקה שהתאריך לא בעבר
    const requestedDate = new Date(date);
    if (timeUtils.isPastDate(requestedDate)) {
      return NextResponse.json([], { status: 200 }); // החזר מערך ריק אם התאריך בעבר
    }

    // מציאת העסק לפי slug
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, user_id, name, is_active')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (businessError || !business) {
      return NextResponse.json({ error: 'עסק לא נמצא או לא פעיל' }, { status: 404 });
    }

    // שליפת פרטי השירות
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, name, duration_minutes, is_active')
      .eq('id', serviceId)
      .eq('business_id', business.id)
      .eq('is_active', true)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'שירות לא נמצא או לא פעיל' }, { status: 404 });
    }

    // חישוב יום בשבוע
    const dayOfWeek = requestedDate.getDay();

    // שליפת זמינות ליום זה
    const { data: availability, error: availabilityError } = await supabase
      .from('availability')
      .select('start_time, end_time, day_of_week')
      .eq('business_id', business.id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (availabilityError) {
      console.error('Availability error:', availabilityError);
      return NextResponse.json({ error: 'שגיאה בשליפת זמינות' }, { status: 500 });
    }

    // אם אין זמינות ליום זה
    if (!availability || availability.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // בדיקת תאריכים לא זמינים
    const { data: unavailableDates, error: unavailableError } = await supabase
      .from('unavailable_dates')
      .select('date')
      .eq('user_id', business.user_id)
      .eq('date', date);

    if (unavailableError) {
      console.error('Unavailable dates error:', unavailableError);
      return NextResponse.json({ error: 'שגיאה בבדיקת תאריכים לא זמינים' }, { status: 500 });
    }

    // אם התאריך חסום
    if (unavailableDates && unavailableDates.length > 0) {
      return NextResponse.json([], { status: 200 });
    }

    // שליפת תורים קיימים לתאריך זה
    const { data: existingAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        time,
        services!inner(duration_minutes)
      `)
      .eq('business_id', business.id)
      .eq('date', date)
      .in('status', ['pending', 'confirmed']);

    if (appointmentsError) {
      console.error('Appointments error:', appointmentsError);
      return NextResponse.json({ error: 'שגיאה בשליפת תורים קיימים' }, { status: 500 });
    }

    // פורמט התורים הקיימים למבנה שהפונקציה מצפה לו
    const formattedAppointments = existingAppointments?.map(apt => ({
      time: timeUtils.normalizeTime(apt.time),
      duration_minutes: (apt.services as any)?.duration_minutes || 60
    })) || [];

    // פורמט הזמינות למבנה שהפונקציה מצפה לו
    const formattedAvailability = availability.map(slot => ({
      day_of_week: slot.day_of_week,
      start_time: timeUtils.normalizeTime(slot.start_time),
      end_time: timeUtils.normalizeTime(slot.end_time)
    }));

    // יצירת שעות פנויות
    const availableSlots = timeUtils.generateAvailableSlots(
      requestedDate,
      service.duration_minutes,
      formattedAvailability,
      formattedAppointments,
      15 // רווח של 15 דקות בין slots
    );

    // סינון שעות שעברו (אם זה היום)
    const today = new Date();
    const filteredSlots = availableSlots.filter(slot => {
      if (requestedDate.toDateString() === today.toDateString()) {
        return !timeUtils.isPastTime(slot, requestedDate);
      }
      return true;
    });

    return NextResponse.json({
      date,
      service: {
        id: service.id,
        name: service.name,
        duration_minutes: service.duration_minutes
      },
      available_slots: filteredSlots,
      total_slots: filteredSlots.length
    });

  } catch (error) {
    console.error('Error generating available slots:', error);
    return NextResponse.json({ 
      error: 'שגיאת שרת פנימית',
      date: date,
      available_slots: [],
      total_slots: 0
    }, { status: 500 });
  }
}