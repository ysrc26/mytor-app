// src/app/api/public/[slug]/appointments/route.ts
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
  if (!rateLimit(clientIp, 20, 60000)) { // 20 בקשות לדקה
    return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
  }

  try {
    const supabase = supabasePublic;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const slug = params.slug;

    if (!date) {
      return NextResponse.json({ error: 'חסר תאריך' }, { status: 400 });
    }

    // מציאת העסק לפי slug
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, is_active')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (businessError || !business) {
      return NextResponse.json({ error: 'עסק לא נמצא או לא פעיל' }, { status: 404 });
    }

    // קבלת התורים לתאריך הספציפי
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id, date, start_time, end_time,
        service_id, status,
        services!inner(id, name, duration_minutes)
      `)
      .eq('business_id', business.id)
      .eq('date', date)
      .in('status', ['pending', 'confirmed']);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'שגיאה בשליפת תורים' }, { status: 500 });
    }

    // אם אין תורים, החזר מערך ריק
    if (!appointments || appointments.length === 0) {
      return NextResponse.json([]);
    }

    // פורמט התוצאה עם נורמליזציה של זמנים
    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      date: apt.date,
      start_time: timeUtils.normalizeTime(apt.start_time), // ✅
      end_time: timeUtils.normalizeTime(apt.end_time), // ✅
      duration_minutes: (apt.services as any)?.duration_minutes || 60,
      service_name: (apt.services as any)?.name || 'שירות לא מוגדר',
      status: apt.status
    }));

    return NextResponse.json(formattedAppointments);

  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}