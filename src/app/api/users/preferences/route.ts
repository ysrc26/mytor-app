// src/app/api/users/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getSupabaseClient } from '@/lib/api-auth';

export async function GET() {
  try {
    // שימוש בפונקציה הקיימת לאימות
    const { user, error: authError } = await authenticateRequest();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // שימוש בפונקציה הקיימת לקבלת הקליינט
    const supabase = await getSupabaseClient('server');

    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching preferences:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // אם אין העדפות, החזר ברירות מחדל
    if (!preferences) {
      return NextResponse.json({
        default_calendar_view: 'work-days',
        booking_advance_limit: 'week'
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // שימוש בפונקציה הקיימת לאימות
    const { user, error: authError } = await authenticateRequest();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { default_calendar_view, booking_advance_limit } = body;

    // Validation
    const validViews = ['day', 'week', 'work-days', 'month', 'agenda'];
    const validBookingLimits = ['week', 'two-weeks', 'month'];

    if (!validViews.includes(default_calendar_view)) {
      return NextResponse.json({ error: 'Invalid calendar view' }, { status: 400 });
    }

    if (booking_advance_limit && !validBookingLimits.includes(booking_advance_limit)) {
      return NextResponse.json({ error: 'Invalid booking advance limit' }, { status: 400 });
    }

    // שימוש בפונקציה הקיימת לקבלת הקליינט
    const supabase = await getSupabaseClient('server');

    // Upsert העדפות
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        default_calendar_view,
        booking_advance_limit: booking_advance_limit || 'week'
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}