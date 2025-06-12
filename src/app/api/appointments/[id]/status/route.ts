// src/app/api/appointments/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabasePublic as createPublicClient } from '@/lib/supabase-public';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // יצירת supabase client ציבורי (ללא בדיקת אימות)
    const supabasePublic = createPublicClient;

    // שליפת פרטי התור
    const { data: appointmentData, error } = await supabasePublic
      .from('appointments')
      .select(`
        id,
        client_name,
        client_phone,
        date,
        time,
        status,
        created_at,
        note,
        user_id,
        business_id,
        service_id
      `)
      .eq('id', id)
      .single();

    if (error || !appointmentData) {
      return NextResponse.json(
        { error: 'התור לא נמצא' },
        { status: 404 }
      );
    }

    // בדיקה אם התור לא פג תוקפו (תורים ישנים מ-24 שעות נמחקים מהעמוד)
    const appointmentDate = new Date(`${appointmentData.date}T${appointmentData.time}`);
    const now = new Date();
    const hoursPassed = (now.getTime() - appointmentDate.getTime()) / (1000 * 60 * 60);

    // אם התור עבר ביותר מ-24 שעות והוא מאושר, הסתר את העמוד
    if (hoursPassed > 24 && appointmentData.status === 'confirmed') {
      return NextResponse.json(
        { error: 'התור כבר הסתיים' },
        { status: 410 }
      );
    }

    // שליפת פרטי העסק
    console.log('Fetching business data for appointment:', appointmentData.business_id);
    const { data: businessData, error: businessError } = await supabasePublic
      .from('businesses')
      .select('name, phone')
      .eq('id', appointmentData.business_id)
      .single();

    if (businessError || !businessData) {
      return NextResponse.json(
        { error: 'פרטי העסק לא נמצאו' },
        { status: 404 }
      );
    }
    // שליפת פרטי השירות
    const { data: serviceData, error: serviceError } = await supabasePublic
      .from('services')
      .select('name, duration_minutes, price')
      .eq('id', appointmentData.service_id)
      .single();

    // אם השירות לא נמצא, נמשיך בלי להחזיר פרטי שירות
    if (serviceError || !serviceData) {
      // נרשום את השגיאה אך לא נחזיר שגיאה ללקוח
      console.error('Error fetching service data:', serviceError);
    }

    const appointment = appointmentData;

    // יצירת התגובה עם כל הפרטים הנדרשים
    const response = {
      id: appointment.id,
      client_name: appointment.client_name,
      client_phone: appointment.client_phone,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      created_at: appointment.created_at,
      note: appointment.note,
      business: {
        name: businessData.name,
        phone: businessData.phone
      },
      service: serviceData ? {
        name: serviceData.name,
        duration_minutes: serviceData.duration_minutes,
        price: serviceData.price
      } : null
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching appointment status:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status } = await request.json();
    const { id } = await params;

    if (!['confirmed', 'declined', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // יצירת Supabase client עם אימות
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // עדכון הסטטוס רק אם התור שייך למשתמש
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // TODO: שליחת הודעה ללקוח על השינוי

    return NextResponse.json({
      message: 'סטטוס התור עודכן בהצלחה',
      appointmentId: id,
      newStatus: status
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}