// src/app/api/public/[slug]/available-slots/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabase-public';
import { getSupabaseClient } from '@/lib/api-auth';
import { timeUtils } from '@/lib/time-utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {

  const { createClient } = await import('@supabase/supabase-js');
    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const service_id = searchParams.get('service_id');

    console.log('🔍 Available slots request:', { slug, date, service_id });

    if (!date || !service_id) {
      return NextResponse.json(
        { error: 'חסרים פרמטרים נדרשים' },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'פורמט תאריך שגוי' },
        { status: 400 }
      );
    }

    // בדיקה שהתאריך לא בעבר
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      return NextResponse.json({
        date,
        service: { id: service_id, name: '', duration_minutes: 0 },
        available_slots: [],
        total_slots: 0
      }, { status: 200 });
    }

    const dayOfWeek = appointmentDate.getDay();
    console.log('📅 Date info:', { date, dayOfWeek });

    // שליפת פרטי עסק
    const { data: business, error: businessError } = await supabasePublic
      .from('businesses')
      .select('id, user_id, name, is_active')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (businessError || !business) {
      console.error('Business error:', businessError);
      return NextResponse.json({ error: 'עסק לא נמצא' }, { status: 404 });
    }

    console.log('✅ Business found:', business);

    // שליפת פרטי שירות
    const { data: service, error: serviceError } = await supabasePublic
      .from('services')
      .select('id, name, duration_minutes, is_active')
      .eq('id', service_id)
      .eq('business_id', business.id)
      .eq('is_active', true)
      .single();

    if (serviceError || !service) {
      console.error('Service error:', serviceError);
      return NextResponse.json({ error: 'שירות לא נמצא' }, { status: 404 });
    }

    console.log('✅ Service found:', service);

    // שליפת זמינות ליום זה
    const { data: availability, error: availabilityError } = await supabasePublic
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

    // בדיקת תאריכים לא זמינים - בדוק בשני המקומות (business_id וגם user_id)
    let unavailableDates;
    try {
      // נסה קודם עם business_id
      const { data: businessUnavailable, error: businessUnavailableError } = await supabasePublic
        .from('unavailable_dates')
        .select('date')
        .eq('business_id', business.id)
        .eq('date', date);

      if (!businessUnavailableError && businessUnavailable && businessUnavailable.length > 0) {
        unavailableDates = businessUnavailable;
      } else {
        // נסה עם user_id אם לא נמצא עם business_id
        const { data: userUnavailable, error: userUnavailableError } = await supabasePublic
          .from('unavailable_dates')
          .select('date')
          .eq('user_id', business.user_id)
          .eq('date', date);

        if (userUnavailableError) {
          console.error('❌ Unavailable dates query error:', userUnavailableError);
          return NextResponse.json({ error: 'שגיאה בבדיקת תאריכים לא זמינים' }, { status: 500 });
        }

        unavailableDates = userUnavailable || [];
      }

      console.log('🚫 Unavailable dates check:', {
        business_id: business.id,
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
    const { data: existingAppointments, error: appointmentsError } = await supabaseServer
      .from('appointments')
      .select('start_time, end_time, status')
      .eq('business_id', business.id)
      .eq('date', date)
      .in('status', ['pending', 'confirmed']);

    console.log('📋 Existing appointments:', {
      business_id: business.id,
      existingAppointments,
      appointmentsError
    });

    if (appointmentsError) {
      console.error('Appointments error:', appointmentsError);
      return NextResponse.json({ error: 'שגיאה בשליפת תורים קיימים' }, { status: 500 });
    }

    // חישוב שעות פנויות
    const allSlots: string[] = [];

    for (const slot of availability) {
      const startTime = new Date(`2000-01-01T${slot.start_time}`);
      const endTime = new Date(`2000-01-01T${slot.end_time}`);
      let currentTime = new Date(startTime);

      while (currentTime < endTime) {
        const timeString = currentTime.toTimeString().slice(0, 5);
        
        // בדיקה אם השעה הזו תתאים לשירות
        const slotEndTime = new Date(currentTime);
        slotEndTime.setMinutes(slotEndTime.getMinutes() + service.duration_minutes);

        if (slotEndTime <= endTime) {
          allSlots.push(timeString);
        }

        // מעבר לחריץ הבא (כל 15 דקות)
        currentTime.setMinutes(currentTime.getMinutes() + 15);
      }
    }

    // סינון שעות תפוסות
    const availableSlots = allSlots.filter(slot => {
      const slotStart = timeUtils.normalizeTime(slot);
      const slotEnd = timeUtils.minutesToTime(
        timeUtils.timeToMinutes(slotStart) + service.duration_minutes
      );

      // בדיקה אם השעה בעבר (אם זה היום)
      if (appointmentDate.toDateString() === today.toDateString()) {
        const now = new Date();
        const slotDateTime = new Date(`${date}T${slotStart}:00`);
        if (slotDateTime <= now) {
          return false;
        }
      }

      // בדיקת חפיפה עם תורים קיימים
      for (const apt of existingAppointments || []) {
        const hasOverlap = timeUtils.hasTimeOverlap(
          slotStart,
          slotEnd,
          apt.start_time,
          apt.end_time
        );

        if (hasOverlap) {
          return false;
        }
      }

      return true;
    });

    console.log('✅ Available slots calculated:', {
      totalSlots: allSlots.length,
      availableSlots: availableSlots.length,
      slots: availableSlots
    });

    return NextResponse.json({
      date,
      service: {
        id: service.id,
        name: service.name,
        duration_minutes: service.duration_minutes
      },
      available_slots: availableSlots,
      total_slots: allSlots.length
    });

  } catch (error) {
    console.error('Unexpected error in available-slots:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}