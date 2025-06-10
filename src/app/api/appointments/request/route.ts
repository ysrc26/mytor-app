// src/app/api/appointments/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const body = await request.json();

    const {
      slug,
      client_name,
      client_phone,
      date,
      time,
      note
    } = body;

    // ולידציה בסיסית
    if (!slug || !client_name || !client_phone || !date || !time) {
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

    // מציאת העסק לפי slug
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, user_id')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'עסק לא נמצא' },
        { status: 404 }
      );
    }

    // בדיקה אם הטלפון אומת (נניח שכל הבקשות צריכות אימות)
    const { data: otpRecord } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone', client_phone)
      .eq('verified', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'נדרש אימות טלפון' },
        { status: 401 }
      );
    }

    // בדיקה אם הזמן עדיין זמין (בדיקה בסיסית)
    const dayOfWeek = parseInt(date); // date מגיע כמספר יום בשבוע
    const { data: availability } = await supabase
      .from('availability')
      .select('*')
      .eq('business_id', business.id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (!availability || availability.length === 0) {
      return NextResponse.json(
        { error: 'הזמן שנבחר לא זמין' },
        { status: 400 }
      );
    }

    // יצירת התור כ-pending
    const appointmentDate = getNextDateForDay(dayOfWeek);

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        business_id: business.id,
        client_name,
        client_phone,
        client_verified: true, // כי עבר אימות OTP
        date: appointmentDate,
        time,
        status: 'pending',
        note: note || null
      })
      .select()
      .single();

    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError);
      return NextResponse.json(
        { error: 'שגיאה ביצירת התור' },
        { status: 500 }
      );
    }

    // שליחת התראה למייל בעל העסק (אופציונלי)
    try {
      await sendAppointmentNotification(business, appointment);
    } catch (emailError) {
      console.warn('Failed to send email notification:', emailError);
      // לא נכשיל את כל התהליך בגלל מייל
    }

    return NextResponse.json({
      message: 'בקשת התור נשלחה בהצלחה',
      appointment_id: appointment.id,
      status: 'pending'
    });

  } catch (error) {
    console.error('Error in appointment request:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}

// פונקציה עזר למציאת התאריך הבא של יום מסוים
function getNextDateForDay(dayOfWeek: number): string {
  const today = new Date();
  const currentDay = today.getDay();

  let daysUntilTarget = dayOfWeek - currentDay;
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7; // שבוע הבא
  }

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysUntilTarget);

  return targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// פונקציה לשליחת התראה למייל (בסיסית)
async function sendAppointmentNotification(
  business: any, 
  appointment: any
) {
  const emailBody = `
    בקשת תור חדשה עבור ${business.name}!
    
    לקוח: ${appointment.client_name}
    טלפון: ${appointment.client_phone}
    תאריך: ${appointment.date}
    שעה: ${appointment.time}
    ${appointment.note ? `הערה: ${appointment.note}` : ''}
    
    כנס לדשבורד כדי לאשר או לדחות:
    ${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/business/${business.id}
  `;

  // TODO: הטמעת שליחת מייל
  console.log('Email notification:', emailBody);
}