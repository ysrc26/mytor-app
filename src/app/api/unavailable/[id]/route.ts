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

    const { id } = resolvedParams;

    // בדיקה שהחסימה שייכת למשתמש
    const { data: existingBlock, error: fetchError } = await supabase
      .from('unavailable_dates')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingBlock) {
      return NextResponse.json(
        { error: 'חסימה לא נמצאה' },
        { status: 404 }
      );
    }

    // מחיקת החסימה
    const { error: deleteError } = await supabase
      .from('unavailable_dates')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

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