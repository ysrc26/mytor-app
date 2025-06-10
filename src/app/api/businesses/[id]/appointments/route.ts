// src/app/api/businesses/[id]/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies:() => cookies() });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    // בדיקה שהעסק שייך למשתמש
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'עסק לא נמצא' }, { status: 404 });
    }

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('business_id', params.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'שגיאה בשליפת התורים' }, { status: 500 });
    }

    return NextResponse.json(appointments || []);

  } catch (error) {
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}