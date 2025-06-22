// src/app/api/appointments/[id]/status/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabase-public';
import { authenticateRequest, validateAppointmentOwnership } from '@/lib/api-auth';

// 📊 Get appointment status (PUBLIC - for client to check)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 🌐 PUBLIC ACCESS - no authentication required
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
        businesses!inner(name, phone),
        services!inner(name, duration_minutes, price)
      `)
      .eq('id', id)
      .single();

    if (error || !appointmentData) {
      return NextResponse.json({ error: 'התור לא נמצא' }, { status: 404 });
    }

    // ⏰ Check if appointment is too old (24+ hours after appointment time)
    const appointmentDateTime = new Date(`${appointmentData.date}T${appointmentData.time}`);
    const now = new Date();
    const hoursPassed = (now.getTime() - appointmentDateTime.getTime()) / (1000 * 60 * 60);

    if (hoursPassed > 24 && appointmentData.status === 'confirmed') {
      return NextResponse.json({ error: 'התור כבר הסתיים' }, { status: 410 });
    }

    // ✅ Fix: Handle services as array and extract first service
    const serviceData = Array.isArray((appointmentData as any).services) 
      ? (appointmentData as any).services[0] 
      : (appointmentData as any).services;

    const businessData = Array.isArray((appointmentData as any).businesses)
      ? (appointmentData as any).businesses[0]
      : (appointmentData as any).businesses;

    return NextResponse.json({
      id: appointmentData.id,
      client_name: appointmentData.client_name,
      client_phone: appointmentData.client_phone,
      date: appointmentData.date,
      time: appointmentData.time,
      status: appointmentData.status,
      created_at: appointmentData.created_at,
      note: appointmentData.note,
      business: {
        name: businessData?.name || '',
        phone: businessData?.phone || ''
      },
      service: serviceData ? {
        name: serviceData.name,
        duration_minutes: serviceData.duration_minutes,
        price: serviceData.price
      } : null
    });

  } catch (error) {
    console.error('Error fetching appointment status:', error);
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}

// 🔄 Update appointment status (PROTECTED - for business owner)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status } = await request.json();
    const { id } = await params;

    // ✅ Validate status
    if (!['confirmed', 'declined', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'סטטוס לא תקין' }, { status: 400 });
    }

    // 🔒 Authenticate user
    const auth = await authenticateRequest(request);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // 🔒 Validate appointment ownership
    const ownership = await validateAppointmentOwnership(auth.user.id, id);
    if (!ownership.isOwner) {
      return NextResponse.json({ error: ownership.error }, { status: 404 });
    }

    // 🔄 Update status
    const { error: updateError } = await supabasePublic
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (updateError) {
      console.error('Status update error:', updateError);
      return NextResponse.json({ error: 'שגיאה בעדכון סטטוס התור' }, { status: 500 });
    }

    // 📧 TODO: Send status change notification to client
    // await sendStatusChangeNotification(appointment.client_phone, status);

    return NextResponse.json({
      message: 'סטטוס התור עודכן בהצלחה',
      appointmentId: id,
      newStatus: status
    });

  } catch (error) {
    console.error('Error updating appointment status:', error);
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}