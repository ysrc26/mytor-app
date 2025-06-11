// src/app/api/appointments/request/route.ts - SECURE VERSION
import { NextRequest, NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabase-public';
import { rateLimit } from '@/lib/rate-limit';
import { timeUtils } from '@/lib/time-utils';

export async function POST(request: NextRequest) {

  // Rate limit configuration
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(clientIp, 5, 60000)) {
    return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
  }

  try {
    const supabase = supabasePublic;
    const body = await request.json();
    const {
      slug,
      service_id,
      client_name,
      client_phone,
      date, // זה יהיה תאריך מלא כמו "2025-06-09"
      time,
      note
    } = body;

    console.log('Received appointment request:', body);

    // ולידציה בסיסית
    if (!slug || !client_name || !client_phone || !date || !time || !service_id) {
      return NextResponse.json(
        { error: 'חסרים פרטים נדרשים' },
        { status: 400 }
      );
    }

    // ולידציה של מספר טלפון
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(client_phone)) {
      return NextResponse.json(
        { error: 'מספר טלפון לא תקין' },
        { status: 400 }
      );
    }

    // 🔒 CRITICAL: בדיקת אימות טלפון - חובה לכל בקשה!
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone', client_phone)
      .eq('verified', true)
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // אם אין אימות תקף - דחה מיד
    if (otpError || !otpRecord) {
      console.log(`Phone verification failed for ${client_phone}:`, otpError || 'No valid OTP record');
      return NextResponse.json(
        { 
          error: 'נדרש אימות טלפון',
          code: 'PHONE_NOT_VERIFIED'
        },
        { status: 401 }
      );
    }

    console.log(`Phone ${client_phone} verified successfully`);

    // בדיקה שהתאריך לא בעבר
    const appointmentDate = new Date(date);
    if (timeUtils.isPastDate(appointmentDate)) {
      return NextResponse.json(
        { error: 'לא ניתן לקבוע תור בעבר' },
        { status: 400 }
      );
    }

    // בדיקה שהזמן לא עבר (אם זה היום)
    if (timeUtils.isPastTime(time, appointmentDate)) {
      return NextResponse.json(
        { error: 'לא ניתן לקבוע תור בזמן שעבר' },
        { status: 400 }
      );
    }

    // מציאת העסק לפי slug
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, user_id, is_active')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (businessError || !business) {
      console.error('Business not found:', businessError);
      return NextResponse.json(
        { error: 'עסק לא נמצא או לא פעיל' },
        { status: 404 }
      );
    }

    // שליפת פרטי השירות
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, name, duration_minutes, is_active')
      .eq('id', service_id)
      .eq('business_id', business.id)
      .eq('is_active', true)
      .single();

    if (serviceError || !service) {
      console.error('Service not found:', serviceError);
      return NextResponse.json(
        { error: 'שירות לא נמצא או לא פעיל' },
        { status: 404 }
      );
    }

    // חישוב יום בשבוע מהתאריך
    const dayOfWeek = appointmentDate.getDay();

    // בדיקה אם העסק זמין ביום זה
    const { data: availability, error: availabilityError } = await supabase
      .from('availability')
      .select('start_time, end_time')
      .eq('business_id', business.id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (availabilityError) {
      console.error('Availability error:', availabilityError);
      return NextResponse.json(
        { error: 'שגיאה בבדיקת זמינות' },
        { status: 500 }
      );
    }

    if (!availability || availability.length === 0) {
      return NextResponse.json(
        { error: 'העסק לא זמין ביום זה' },
        { status: 400 }
      );
    }

    // בדיקת תאריכים לא זמינים
    const { data: unavailableDates } = await supabase
      .from('unavailable_dates')
      .select('date')
      .eq('user_id', business.user_id)
      .eq('date', date);

    if (unavailableDates && unavailableDates.length > 0) {
      return NextResponse.json(
        { error: 'התאריך לא זמין לקביעת תורים' },
        { status: 400 }
      );
    }

    // נורמליזציה של השעה והזמינות
    const normalizedTime = timeUtils.normalizeTime(time);

    // בדיקה אם השעה בטווח הזמינות
    const isTimeAvailable = availability.some(slot => 
      timeUtils.isTimeInSlot(normalizedTime, {
        start_time: timeUtils.normalizeTime(slot.start_time),
        end_time: timeUtils.normalizeTime(slot.end_time)
      })
    );

    if (!isTimeAvailable) {
      return NextResponse.json(
        { error: 'השעה שנבחרה לא זמינה' },
        { status: 400 }
      );
    }

    // שליפת תורים קיימים לבדיקת חפיפות
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
      return NextResponse.json(
        { error: 'שגיאה בבדיקת תורים קיימים' },
        { status: 500 }
      );
    }

    // בדיקת חפיפות עם תורים קיימים
    const hasConflict = existingAppointments?.some(apt => 
      timeUtils.hasTimeConflict(
        normalizedTime,
        service.duration_minutes,
        timeUtils.normalizeTime(apt.time),
        (apt.services as any)?.duration_minutes || 60
      )
    ) || false;

    if (hasConflict) {
      return NextResponse.json(
        { error: 'השעה תפוסה - יש חפיפה עם תור קיים' },
        { status: 400 }
      );
    }

    // לאחר כל הבדיקות, ניצור את התור החדש
    const { data: newAppointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        user_id: business.user_id,
        business_id: business.id,
        service_id: service.id,
        client_name: client_name.trim(),
        client_phone: client_phone.trim(),
        date,
        time: normalizedTime,
        status: 'pending',
        note: note?.trim() || null,
        client_verified: true
      })
      .select('id, date, time, status')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'שגיאה ביצירת התור' },
        { status: 500 }
      );
    }

    // TODO: שליחת התראה לבעל העסק (אימייל/SMS)
    
    console.log('Appointment created successfully:', newAppointment);

    return NextResponse.json({
      success: true,
      appointment: {
        id: newAppointment.id,
        date: newAppointment.date,
        time: newAppointment.time,
        status: newAppointment.status,
        service_name: service.name,
        business_name: business.name
      },
      message: 'בקשת התור נשלחה בהצלחה'
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in appointment request:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}