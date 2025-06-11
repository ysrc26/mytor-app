// src/app/api/businesses/[id]/services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Wait for params to resolve
  const resolvedParams = await params;

  try {
    const supabase = await createClient();
    
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

    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', resolvedParams.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'שגיאה בשליפת השירותים' }, { status: 500 });
    }

    return NextResponse.json(services || []);

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

    const { name, description, price, duration_minutes } = await request.json();

    if (!name || !duration_minutes) {
      return NextResponse.json({ error: 'חסרים פרטים נדרשים' }, { status: 400 });
    }

    const { data: service, error } = await supabase
      .from('services')
      .insert({
        business_id: resolvedParams.id,
        name,
        description,
        price,
        duration_minutes,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'שגיאה ביצירת שירות' }, { status: 500 });
    }

    return NextResponse.json(service, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}