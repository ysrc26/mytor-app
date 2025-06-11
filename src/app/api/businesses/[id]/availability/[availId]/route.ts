// src/app/api/businesses/[id]/availability/[availId]/route.ts
import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; availId: string } }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }
    // בדוק אם המשתמש הוא הבעלים של העסק
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();
    if (businessError || !business) {
      return NextResponse.json({ error: 'עסק לא קיים או שאינך הבעלים' }, { status: 403 });
    }

    // מחיקת זמינות
    const { error } = await supabase
      .from('availability')
      .delete()
      .eq('id', params.availId)
      .eq('business_id', params.id);

    if (error) {
      return NextResponse.json({ error: 'שגיאה במחיקת זמינות' }, { status: 500 });
    }

    return NextResponse.json({ message: 'זמינות נמחקה בהצלחה' });

  } catch (error) {
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}