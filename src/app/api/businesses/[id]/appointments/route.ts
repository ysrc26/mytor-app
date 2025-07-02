// src/app/api/businesses/[id]/appointments/route.ts - WORKING VERSION
import { NextRequest, NextResponse } from 'next/server';
import { authenticateBusinessRequest, getSupabaseClient } from '@/lib/api-auth';
import { timeUtils } from '@/lib/time-utils';
import { BusinessOwnerValidator } from '@/lib/appointment-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    const supabase = await getSupabaseClient('server');

    // Checks if the user is authenticated and if they own the business
    const { user: user, business: business, error: authBusinessError } = await authenticateBusinessRequest(businessId);
    if (authBusinessError || !user || !business) {
      return NextResponse.json({ error: authBusinessError || 'לא מורשה' }, { status: 401 });
    }

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`*,
        services (
          id,
          name,
          duration_minutes,
          price
        )
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'שגיאה בשליפת התורים' }, { status: 500 });
    }

    return NextResponse.json(appointments || []);

  } catch (error) {
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseClient('server');
    const { id: businessId } = await params;

    // Checks if the user is authenticated and if they own the business
    const { user: user, business: business, error: authBusinessError } =
      await authenticateBusinessRequest(businessId);
    if (authBusinessError || !user || !business) {
      return NextResponse.json({ error: authBusinessError || 'לא מורשה' }, { status: 401 });
    }

    // Parse request body
    const {
      client_name,
      client_phone,
      service_id,
      date,
      start_time,
      end_time,
      note,
      status = 'confirmed' // ברירת מחדל לתור שנוצר ידנית
    } = await request.json();

    // Basic validation
    if (!client_name?.trim()) {
      return NextResponse.json({ error: 'שם לקוח הוא שדה חובה' }, { status: 400 });
    }

    if (!client_phone?.trim()) {
      return NextResponse.json({ error: 'מספר טלפון הוא שדה חובה' }, { status: 400 });
    }

    // Validate Israeli phone number
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(client_phone)) {
      return NextResponse.json({
        error: 'מספר טלפון לא תקין (צריך להתחיל ב-05 ולהכיל 10 ספרות)'
      }, { status: 400 });
    }

    if (!date || !start_time) {
      return NextResponse.json({ error: 'תאריך ושעה הם שדות חובה' }, { status: 400 });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({ error: 'פורמט תאריך לא תקין' }, { status: 400 });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(start_time)) {
      return NextResponse.json({ error: 'פורמט שעה לא תקין' }, { status: 400 });
    }

    // Check if the requested time is in the past
    const appointmentDateTime = new Date(`${date} ${start_time}`);
    const now = new Date();
    if (appointmentDateTime < now) {
      return NextResponse.json({ error: 'לא ניתן לקבוע תור בעבר' }, { status: 400 });
    }

    // Validate end_time if provided
    if (service_id) {
      const conflictCheck = await BusinessOwnerValidator.checkConflictsForOwner({
        businessId,
        serviceId: service_id,
        date,
        start_time: timeUtils.normalizeTime(start_time)
      });

      if (conflictCheck.hasConflict) {
        return NextResponse.json({
          error: conflictCheck.error || 'יש חפיפה עם תור קיים'
        }, { status: 409 });
      }
    } else if (end_time) {
      const durationMinutes = timeUtils.timeToMinutes(end_time) - timeUtils.timeToMinutes(start_time);
      const conflictCheck = await BusinessOwnerValidator.checkConflictsForOwner({
        businessId,
        date,
        start_time: timeUtils.normalizeTime(start_time),
        durationMinutes
      });

      if (conflictCheck.hasConflict) {
        return NextResponse.json({
          error: conflictCheck.error || 'יש חפיפה עם תור קיים'
        }, { status: 409 });
      }
    }

    // Calculate final end_time for database insert
    let finalEndTime: string;

    if (service_id) {
      // אם נבחר שירות, חשב end_time לפי duration
      const { data: service } = await supabase
        .from('services')
        .select('duration_minutes')
        .eq('id', service_id)
        .eq('business_id', businessId)
        .single();

      if (!service) {
        return NextResponse.json({ error: 'שירות לא נמצא' }, { status: 400 });
      }

      finalEndTime = timeUtils.minutesToTime(
        timeUtils.timeToMinutes(timeUtils.normalizeTime(start_time)) + service.duration_minutes
      );
    } else if (end_time) {
      // אם לא נבחר שירות, השתמש ב-end_time שהועבר
      finalEndTime = timeUtils.normalizeTime(end_time);

      // וודא ששעת הסיום אחרי שעת ההתחלה
      const startMinutes = timeUtils.timeToMinutes(timeUtils.normalizeTime(start_time));
      const endMinutes = timeUtils.timeToMinutes(finalEndTime);

      if (endMinutes <= startMinutes) {
        return NextResponse.json({ error: 'שעת הסיום חייבת להיות אחרי שעת ההתחלה' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'יש לבחור שירות או להגדיר שעת סיום' }, { status: 400 });
    }


    // Create the appointment
    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        business_id: businessId,
        user_id: user.id,
        client_name: client_name.trim(),
        client_phone: client_phone.trim(),
        service_id: service_id || null,
        date,
        start_time: timeUtils.normalizeTime(start_time),
        end_time: finalEndTime,
        status,
        note: note?.trim() || null,
        client_verified: true // תור שנוצר ידנית נחשב כמאומת
      })
      .select(`*,
        services (
          id,
          name,
          duration_minutes,
          price
        )
      `)
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({
        error: 'שגיאה ביצירת התור: ' + insertError.message
      }, { status: 500 });
    }

    return NextResponse.json(appointment, { status: 201 });

  } catch (error) {
    console.error('POST appointments error:', error);
    return NextResponse.json({
      error: 'שגיאת שרת פנימית'
    }, { status: 500 });
  }
}