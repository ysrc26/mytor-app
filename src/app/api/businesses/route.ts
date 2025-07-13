// ===================================
// 🔧 src/app/api/businesses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSlugFromName } from '@/lib/slugUtils';
import { createClient } from '@/lib/supabase-server';
import { checkSubscriptionLimit } from '@/lib/subscription-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    const url = new URL(request.url);
    const getSingle = url.searchParams.get('single') === 'true';

    if (getSingle) {
      const { data: business, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: 'שגיאה בשליפת עסק' }, { status: 500 });
      }

      if (!business) {
        return NextResponse.json({ error: 'לא נמצא עסק' }, { status: 404 });
      }

      return NextResponse.json(business);
    } else {
      const { data: businesses, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: 'שגיאה בשליפת עסקים' }, { status: 500 });
      }

      return NextResponse.json(businesses || []);
    }

  } catch (error) {
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    // בדיקת מגבלות לפני יצירה
    const limitCheck = await checkSubscriptionLimit(user.id, 'create_business');
    if (!limitCheck.allowed) {
      return NextResponse.json({ 
        error: limitCheck.reason,
        limit_reached: true,
        action_required: limitCheck.upgradeRequired ? 'upgrade' : 'none'
      }, { status: 403 });
    }

    const { name, description, terms } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'חסר שם עסק' }, { status: 400 });
    }

    // יצירת slug ייחודי
    const baseSlug = createSlugFromName(name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const { data: existingBusiness } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!existingBusiness) break;
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // יצירת העסק
    const { data: business, error } = await supabase
      .from('businesses')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        terms: terms?.trim() || null,
        slug: slug,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating business:', error);
      return NextResponse.json({ error: 'שגיאה ביצירת העסק' }, { status: 500 });
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error('Error in POST /api/businesses:', error);
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}