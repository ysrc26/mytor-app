// src/app/api/businesses/[id]/availability/route.ts
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

    const { data: availability, error } = await supabase
      .from('availability')
      .select('*')
      .eq('business_id', resolvedParams.id)
      .order('day_of_week');

    if (error) {
      return NextResponse.json({ error: 'שגיאה בשליפת הזמינות' }, { status: 500 });
    }

    return NextResponse.json(availability || []);

  } catch (error) {
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}

export async function POST(
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

    const { day_of_week, start_time, end_time } = await request.json();

    const { data: availability, error } = await supabase
      .from('availability')
      .insert({
        business_id: resolvedParams.id,
        user_id: user.id,
        day_of_week,
        start_time,
        end_time,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'שגיאה בהוספת זמינות' }, { status: 500 });
    }

    return NextResponse.json(availability, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}