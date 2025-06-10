// src/app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies: () => cookies() });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'לא מורשה' },
        { status: 401 }
      );
    }

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'שגיאה בשליפת התורים' },
        { status: 500 }
      );
    }

    return NextResponse.json(appointments || []);

  } catch (error) {
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}