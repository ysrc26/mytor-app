// src/app/api/unavailable/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    
    // בדיקת authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'לא מורשה' },
        { status: 401 }
      );
    }

    // Get user's business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'עסק לא נמצא' },
        { status: 404 }
      );
    }

    const { id } = resolvedParams;

    // בדיקה שהחסימה שייכת למשתמש - נסה קודם עם business_id
    let existingBlock;
    
    // נסה עם business_id
    const { data: businessBlock, error: businessFetchError } = await supabase
      .from('unavailable_dates')
      .select('*')
      .eq('id', id)
      .eq('business_id', business.id)
      .single();

    if (!businessFetchError && businessBlock) {
      existingBlock = businessBlock;
    } else {
      // נסה עם user_id
      const { data: userBlock, error: userFetchError } = await supabase
        .from('unavailable_dates')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (userFetchError || !userBlock) {
        return NextResponse.json(
          { error: 'חסימה לא נמצאה' },
          { status: 404 }
        );
      }
      
      existingBlock = userBlock;
    }

    // מחיקת החסימה - מחק לפי ID ובעלות
    const { error: deleteError } = await supabase
      .from('unavailable_dates')
      .delete()
      .eq('id', id)
      .or(`business_id.eq.${business.id},user_id.eq.${user.id}`);

    if (deleteError) {
      console.error('Error deleting unavailable date:', deleteError);
      return NextResponse.json(
        { error: 'שגיאה בביטול החסימה' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'חסימה בוטלה בהצלחה' });

  } catch (error) {
    console.error('Error in unavailable DELETE:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    
    // בדיקת authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'לא מורשה' },
        { status: 401 }
      );
    }

    // Get user's business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'עסק לא נמצא' },
        { status: 404 }
      );
    }

    const { id } = resolvedParams;
    const body = await request.json();
    const { reason } = body;

    // Validation
    if (reason && reason.length > 50) {
      return NextResponse.json(
        { error: 'סיבה ארוכה מדי (מקסימום 50 תווים)' },
        { status: 400 }
      );
    }

    // בדיקה שהחסימה שייכת למשתמש - נסה קודם עם business_id
    let existingBlock;
    
    // נסה עם business_id
    const { data: businessBlock, error: businessFetchError } = await supabase
      .from('unavailable_dates')
      .select('*')
      .eq('id', id)
      .eq('business_id', business.id)
      .single();

    if (!businessFetchError && businessBlock) {
      existingBlock = businessBlock;
    } else {
      // נסה עם user_id
      const { data: userBlock, error: userFetchError } = await supabase
        .from('unavailable_dates')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (userFetchError || !userBlock) {
        return NextResponse.json(
          { error: 'חסימה לא נמצאה' },
          { status: 404 }
        );
      }
      
      existingBlock = userBlock;
    }

    // עדכון הסיבה
    const { data: updatedBlock, error: updateError } = await supabase
      .from('unavailable_dates')
      .update({ reason: reason || null })
      .eq('id', id)
      .or(`business_id.eq.${business.id},user_id.eq.${user.id}`)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating unavailable date:', updateError);
      return NextResponse.json(
        { error: 'שגיאה בעדכון הסיבה' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedBlock);

  } catch (error) {
    console.error('Error in unavailable PUT:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}