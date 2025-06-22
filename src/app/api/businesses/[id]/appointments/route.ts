// src/app/api/businesses/[id]/appointments/route.ts - WORKING VERSION
import { NextRequest, NextResponse } from 'next/server';
import { authenticateBusinessRequest, getSupabaseClient } from '@/lib/api-auth';

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
    const body = await request.json();
    const {
      client_name,
      client_phone,
      service_id,
      date,
      time,
      note,
      status = 'confirmed' // ברירת מחדל לתור שנוצר ידנית
    } = body;

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

    if (!date || !time) {
      return NextResponse.json({ error: 'תאריך ושעה הם שדות חובה' }, { status: 400 });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({ error: 'פורמט תאריך לא תקין' }, { status: 400 });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return NextResponse.json({ error: 'פורמט שעה לא תקין' }, { status: 400 });
    }

    // Check if the requested time is in the past
    const appointmentDateTime = new Date(`${date} ${time}`);
    const now = new Date();
    if (appointmentDateTime < now) {
      return NextResponse.json({ error: 'לא ניתן לקבוע תור בעבר' }, { status: 400 });
    }

    // Check for existing appointments at the same time
    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('id')
      .eq('business_id', businessId)
      .eq('date', date)
      .eq('time', time)
      .in('status', ['pending', 'confirmed']);

    if (existingAppointments && existingAppointments.length > 0) {
      return NextResponse.json({
        error: 'כבר קיים תור באותה שעה'
      }, { status: 409 });
    }

    // Validate service_id if provided
    if (service_id) {
      const { data: service } = await supabase
        .from('services')
        .select('id')
        .eq('id', service_id)
        .eq('business_id', businessId)
        .single();

      if (!service) {
        return NextResponse.json({ error: 'שירות לא נמצא' }, { status: 400 });
      }
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
        time,
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