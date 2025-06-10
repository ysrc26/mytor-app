// src/app/api/public/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies: () => cookies() });
    const { slug } = params;

    // שליפת פרטי העסק לפי slug
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'עסק לא נמצא' },
        { status: 404 }
      );
    }

    // שליפת זמינות פעילה
    const { data: availability, error: availabilityError } = await supabase
      .from('availability')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('day_of_week');

    if (availabilityError) {
      console.error('Error fetching availability:', availabilityError);
      return NextResponse.json(
        { error: 'שגיאה בטעינת זמינות' },
        { status: 500 }
      );
    }

    // שליפת שירותים פעילים
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('created_at');
    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      return NextResponse.json(
        { error: 'שגיאה בטעינת שירותים' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      business,
      availability: availability || [],
      services: services || []
    });

  } catch (error) {
    console.error('Error in public API:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}