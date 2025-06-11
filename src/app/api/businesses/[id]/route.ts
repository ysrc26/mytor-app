// src/app/api/businesses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = await createClient();

    // authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    // בדיקה שהמשתמש הוא הבעלים של העסק
    const { data: business, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id)
      .single();

    if (error || !business) {
      return NextResponse.json({ error: 'עסק לא נמצא' }, { status: 404 });
    }

    return NextResponse.json(business);

  } catch (error) {
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    // עדכון העסק
    const { data: business, error } = await supabase
      .from('businesses')
      .update(body)
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'שגיאה בעדכון העסק' }, { status: 500 });
    }

    return NextResponse.json(business);

  } catch (error) {
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}