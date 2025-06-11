// src/app/api/businesses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSlugFromName } from '@/lib/slugUtils';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
      const supabase = await createClient();
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
      }
  
      // בדוק אם זה בקשה לעסק בודד או לכל העסקים
      const url = new URL(request.url);
      const getSingle = url.searchParams.get('single') === 'true';
  
      if (getSingle) {
        // החזר עסק אחד (הראשון)
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
        // החזר כל העסקים (הפונקציונליות הקיימת)
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

    const { name, description, terms } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'חסר שם עסק' }, { status: 400 });
    }

    // בדיקה כמה עסקים יש למשתמש (הגבלה לfree users)
    const { data: existingBusinesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id);

    if (existingBusinesses && existingBusinesses.length >= 1) {
      // TODO: בדיקה אם המשתמש הוא premium
      return NextResponse.json({ 
        error: 'משתמשים חינמיים יכולים לנהל עסק אחד בלבד. שדרג לפרימיום לעסקים נוספים' 
      }, { status: 403 });
    }

    // יצירת slug ייחודי
    let baseSlug = createSlugFromName(name);
    if (!baseSlug || baseSlug.length < 2) {
      baseSlug = 'business';
    }

    let slug = baseSlug;
    let counter = 1;
    let slugExists = true;

    while (slugExists) {
      const { data } = await supabase
        .from('businesses')
        .select('slug')
        .eq('slug', slug)
        .maybeSingle();

      if (!data) {
        slugExists = false;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // יצירת העסק
    const { data: business, error: createError } = await supabase
      .from('businesses')
      .insert({
        user_id: user.id,
        name,
        slug,
        description,
        terms
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: 'שגיאה ביצירת העסק' }, { status: 500 });
    }

    return NextResponse.json(business, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}