// src/app/api/businesses/[id]/availability/[availId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; availId: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies:() => cookies() });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

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