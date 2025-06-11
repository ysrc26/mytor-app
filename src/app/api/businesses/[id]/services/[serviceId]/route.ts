// src/app/api/businesses/[id]/services/[serviceId]/route.ts
import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';


export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; serviceId: string } }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }
    // בדיקת בעלות על העסק
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();
    if (businessError || !business) {
      return NextResponse.json({ error: 'לא מורשה לגשת לעסק זה' }, { status: 403 });
    }

    // מחיקת השירות
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