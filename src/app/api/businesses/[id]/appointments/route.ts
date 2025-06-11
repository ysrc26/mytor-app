// src/app/api/businesses/[id]/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const supabase = await createClient();
    const resolvedParams = await params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    // בדיקה שהעסק שייך למשתמש
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'עסק לא נמצא' }, { status: 404 });
    }

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`*,services!inner(name)`)
      .eq('business_id', resolvedParams.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'שגיאה בשליפת התורים' }, { status: 500 });
    }

    return NextResponse.json(appointments || []);

  } catch (error) {
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}