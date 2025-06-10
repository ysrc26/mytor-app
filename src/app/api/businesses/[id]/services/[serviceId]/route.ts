// src/app/api/businesses/[id]/services/[serviceId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; serviceId: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies: () => cookies() });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', params.serviceId)
      .eq('business_id', params.id);

    if (error) {
      return NextResponse.json({ error: 'שגיאה במחיקת שירות' }, { status: 500 });
    }

    return NextResponse.json({ message: 'שירות נמחק בהצלחה' });

  } catch (error) {
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}