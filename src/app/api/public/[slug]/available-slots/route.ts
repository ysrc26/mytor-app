// src/app/api/public/[slug]/available-slots/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabase-public';
import { rateLimit } from '@/lib/rate-limit';
import { timeUtils } from '@/lib/time-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {

  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(clientIp, 30, 60000)) {
    return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
  }



  let date: string | null = null;
  try {
    const supabase = supabasePublic;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('service_id');
    const { slug } = await params;

    date = searchParams.get('date');
    if (!date) {
      return NextResponse.json({ error: 'חסר תאריך' }, { status: 400 });
    }

    const [year, month, day] = date.split('-').map(Number);
    const requestedDate = new Date(year, month - 1, day, 12, 0, 0);
    const dayOfWeek = requestedDate.getDay();

    console.log('📅 Date check:', {
      inputDate: date,
      dayOfWeek,
      dayName: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][dayOfWeek]
    });

    console.log('🔍 Available slots API called:', { slug, date, serviceId });

    // ולידציה בסיסית
    if (!serviceId) {
      return NextResponse.json({ error: 'חסר מזהה שירות' }, { status: 400 });
    }

    // בדיקה שהתאריך לא בעבר
    if (timeUtils.isPastDate(requestedDate)) {
      console.log('📅 Date is in the past:', date);
      return NextResponse.json({
        date,
        service: null,
        available_slots: [],
        total_slots: 0
      }, { status: 200 });
    }

    // מציאת העסק לפי slug
    console.log('🏢 Looking for business with slug:', slug);
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, user_id, name, is_active')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (businessError || !business) {
      console.error('❌ Business not found:', businessError);
      return NextResponse.json({ error: 'עסק לא נמצא או לא פעיל' }, { status: 404 });
    }

    console.log('✅ Business found:', { id: business.id, name: business.name });

    // שליפת פרטי השירות - הוסף debug
    console.log('🎯 Looking for service:', { serviceId, businessId: business.id });
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, name, duration_minutes, is_active, business_id')
      .eq('id', serviceId)
      .eq('business_id', business.id)
      .eq('is_active', true)
      .single();

    console.log('🎯 Service query result:', { service, serviceError });

    if (serviceError || !service) {
      console.error('❌ Service not found:', {
        serviceError,
        serviceId,
        businessId: business.id
      });

      // בואו נבדוק אם השירות קיים בכלל
      const { data: allServices } = await supabase
        .from('services')
        .select('id, name, business_id, is_active')
        .eq('id', serviceId);

      console.log('🔍 All services with this ID:', allServices);

      // בואו נבדוק גם אילו שירותים יש לעסק הזה
      const { data: businessServices } = await supabase
        .from('services')
        .select('id, name, business_id, is_active')
        .eq('business_id', business.id);

      console.log('🔍 All services for this business:', businessServices);

      return NextResponse.json({
        error: 'שירות לא נמצא או לא פעיל',
        debug: {
          serviceId,
          businessId: business.id,
          allServicesWithThisId: allServices,
          businessServices: businessServices
        }
      }, { status: 404 });
    }

    console.log('✅ Service found:', service);

    console.log('🔍 Checking ALL availability for business:', business.id);
    const { data: allAvailability } = await supabase
      .from('availability')
      .select('*')
      .eq('business_id', business.id);

    console.log('📋 ALL availability records for business:', allAvailability);

    // ובואו נבדוק גם עם user_id במקום business_id
    const { data: userAvailability } = await supabase
      .from('availability')
      .select('*')
      .eq('user_id', business.user_id);

    console.log('👤 Availability records with user_id:', userAvailability);


    // שליפת זמינות ליום זה
    const { data: availability, error: availabilityError } = await supabase
      .from('availability')
      .select('start_time, end_time, day_of_week')
      .eq('business_id', business.id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    console.log('⏰ Availability for day:', { dayOfWeek, availability, availabilityError });

    if (availabilityError) {
      console.error('Availability error:', availabilityError);
      return NextResponse.json({ error: 'שגיאה בשליפת זמינות' }, { status: 500 });
    }

    // אם אין זמינות ליום זה
    if (!availability || availability.length === 0) {
      console.log('⚠️ No availability for this day');
      return NextResponse.json({
        date,
        service: {
          id: service.id,
          name: service.name,
          duration_minutes: service.duration_minutes
        },
        available_slots: [],
        total_slots: 0
      }, { status: 200 });
    }

    // בדיקת תאריכים לא זמינים
    let unavailableDates;
    try {
      const { data: unavailableData, error: unavailableError } = await supabase
        .from('unavailable_dates')
        .select('date')
        .eq('user_id', business.user_id)  // ✅ user_id במקום business_id
        .eq('date', date);

      if (unavailableError) {
        console.error('❌ Unavailable dates query error:', unavailableError);
        return NextResponse.json({ error: 'שגיאה בבדיקת תאריכים לא זמינים' }, { status: 500 });
      }

      unavailableDates = unavailableData || [];
      console.log('🚫 Unavailable dates check:', {
        user_id: business.user_id,
        date,
        unavailableDates
      });
    } catch (unavailableFetchError) {
      console.error('💥 Unexpected error checking unavailable dates:', unavailableFetchError);
      return NextResponse.json({ error: 'שגיאה בבדיקת תאריכים חסומים' }, { status: 500 });
    }

    // אם התאריך חסום
    if (unavailableDates && unavailableDates.length > 0) {
      console.log('🚫 Date is blocked');
      return NextResponse.json({
        date,
        service: {
          id: service.id,
          name: service.name,
          duration_minutes: service.duration_minutes
        },
        available_slots: [],
        total_slots: 0
      }, { status: 200 });
    }

    // שליפת תורים קיימים לתאריך זה
    const { data: existingAppointments, error: appointmentsError } = await supabase
      .from('public_appointments_with_services')  // 🔒 שימוש ב-View המאובטח
      .select('time, duration_minutes')            // 🔒 רק מה שצריך
      .eq('user_id', business.user_id)
      .eq('date', date)
      .in('status', ['pending', 'confirmed']);

    console.log('📋 Existing appointments from view:', {
      user_id: business.user_id,
      existingAppointments,
      appointmentsError
    });

    if (appointmentsError) {
      console.error('Appointments error:', appointmentsError);
      return NextResponse.json({ error: 'שגיאה בשליפת תורים קיימים' }, { status: 500 });
    }

    // פורמט התורים הקיימים
    const formattedAppointments = existingAppointments?.map(apt => ({
      time: timeUtils.normalizeTime(apt.time),
      duration_minutes: apt.duration_minutes || service.duration_minutes  // fallback לשירות הנוכחי
    })) || [];

    // פורמט הזמינות
    const formattedAvailability = availability.map(slot => ({
      day_of_week: slot.day_of_week,
      start_time: timeUtils.normalizeTime(slot.start_time),
      end_time: timeUtils.normalizeTime(slot.end_time)
    }));

    console.log('⚙️ Generating slots with:', {
      serviceDuration: service.duration_minutes,
      formattedAvailability,
      formattedAppointments
    });

    // יצירת שעות פנויות
    const availableSlots = timeUtils.generateAvailableSlots(
      requestedDate,
      service.duration_minutes,
      formattedAvailability,
      formattedAppointments,
      15
    );

    console.log('🕐 Generated slots:', availableSlots);

    // סינון שעות שעברו
    const today = new Date();
    const filteredSlots = availableSlots.filter(slot => {
      if (requestedDate.toDateString() === today.toDateString()) {
        return !timeUtils.isPastTime(slot, requestedDate);
      }
      return true;
    });

    console.log('✅ Final filtered slots:', filteredSlots);

    const response = NextResponse.json({
      date,
      service: {
        id: service.id,
        name: service.name,
        duration_minutes: service.duration_minutes
      },
      available_slots: filteredSlots,
      total_slots: filteredSlots.length
    });

    // 📦 Cache למשך 30 שניות (התאמה לצרכים)
    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    response.headers.set('ETag', `"${date}-${service.id}-${filteredSlots.length}"`);

    return response;

  } catch (error) {
    console.error('💥 API Error:', error);
    return NextResponse.json({
      error: 'שגיאת שרת פנימית',
      date: date,
      available_slots: [],
      total_slots: 0
    }, { status: 500 });
  }
}