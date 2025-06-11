// src/app/api/appointments/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { status } = await request.json();
    const { id } = await params;
    
    if (!['confirmed', 'declined', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // עדכון הסטטוס רק אם התור שייך למשתמש
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // TODO: שליחת הודעה ללקוח על השינוי
    
    return NextResponse.json({ message: 'Status updated successfully' });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}