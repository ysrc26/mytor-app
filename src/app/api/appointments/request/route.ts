// src/app/api/appointments/request/route.ts - FIXED VERSION with proper client
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, validateIsraeliPhone, verifyPhoneOTP, getSupabaseClient } from '@/lib/api-auth';
import { AppointmentValidator } from '@/lib/appointment-utils';
import { incrementAppointmentUsage } from '@/lib/subscription-utils';
import { timeUtils } from '@/lib/time-utils';

export async function POST(request: NextRequest) {
  // Rate limit - 5 booking attempts per minute per IP
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(clientIp, 5, 60000)) {
    return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
  }

  try {
    // ✅ השתמש בפונקציה הקיימת עם service role לעקיפת RLS
    const supabase = await getSupabaseClient('server');

    const body = await request.json();

    const {
      slug,
      service_id,
      client_name,
      client_phone,
      date,
      start_time,
      note
    } = body;

    console.log('📝 Appointment request received:', {
      slug,
      service_id,
      client_name,
      client_phone,
      date,
      start_time,
      note
    });

    // 📋 Basic validation
    if (!slug || !client_name || !client_phone || !date || !start_time || !service_id) {
      return NextResponse.json(
        { error: 'חסרים פרטים נדרשים' },
        { status: 400 }
      );
    }

    // 📞 Phone validation
    if (!validateIsraeliPhone(client_phone)) {
      return NextResponse.json(
        { error: 'מספר טלפון לא תקין' },
        { status: 400 }
      );
    }

    // 🔒 Phone verification check - CRITICAL SECURITY
    const phoneVerification = await verifyPhoneOTP(client_phone);
    if (!phoneVerification.isVerified) {
      return NextResponse.json(
        {
          error: phoneVerification.error || 'נדרש אימות טלפון',
          code: 'PHONE_NOT_VERIFIED'
        },
        { status: 401 }
      );
    }

    // 🏢 Get business by slug
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, user_id, is_active')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (businessError || !business) {
      console.error('Business error:', businessError);
      return NextResponse.json({ error: 'עסק לא נמצא' }, { status: 404 });
    }

    console.log('✅ Business found:', business);

    // 🎯 Get service details
    const { data: service, error: serviceError } = await supabase
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

    // 🛡️ Centralized validation using AppointmentValidator
    console.log('🔍 Validating time slot with:', {
      businessId: business.id,
      serviceId: service_id,
      date,
      start_time
    });

    const validationResult = await AppointmentValidator.validateTimeSlot({
      businessId: business.id,
      serviceId: service_id,
      date,
      start_time
    });

    if (!validationResult.isValid) {
      console.error('❌ Validation failed:', validationResult.error);
      return NextResponse.json(
        { error: validationResult.error || 'השעה לא זמינה' },
        { status: 400 }
      );
    }

    console.log('✅ Time slot validation passed');

    // 🧮 Calculate end_time based on service duration
    const normalizedStartTime = timeUtils.normalizeTime(start_time);
    const endTimeMinutes = timeUtils.timeToMinutes(normalizedStartTime) + service.duration_minutes;
    const end_time = timeUtils.minutesToTime(endTimeMinutes);

    console.log('⏰ Calculated times:', {
      normalizedStartTime,
      end_time,
      duration: service.duration_minutes
    });

    // 💾 Create appointment in database using server client (bypasses RLS)
    const { data: newAppointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        business_id: business.id,
        user_id: business.user_id,
        service_id: service_id,
        client_name: client_name.trim(),
        client_phone: client_phone.trim(),
        client_verified: true, // מאומת דרך OTP
        date,
        start_time: normalizedStartTime,
        end_time,
        status: 'pending',
        note: note?.trim() || null
      })
      .select(`
        id, date, start_time, end_time, status,
        services!inner(name),
        businesses!inner(name)
      `)
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'שגיאה ביצירת התור' },
        { status: 500 }
      );
    }

    console.log('✅ Appointment created successfully:', newAppointment.id);

    // אחרי יצירת התור בהצלחה, עדכן שימוש
    if (newAppointment && business.user_id) {
      await incrementAppointmentUsage(business.user_id);
    }

    // 📧 TODO: Send notification to business owner (email/SMS)
    // await sendAppointmentNotification(business.user_id, newAppointment);

    return NextResponse.json({
      success: true,
      appointment: {
        id: newAppointment.id,
        date: newAppointment.date,
        start_time: newAppointment.start_time,
        end_time: newAppointment.end_time,
        status: newAppointment.status,
        service_name: (newAppointment as any).services.name,
        business_name: (newAppointment as any).businesses.name
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