// src/app/api/businesses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies: () => cookies() });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    const { data: business, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', params.id)
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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies: () => cookies() });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    const updates = await request.json();

    const { data: business, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', params.id)
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