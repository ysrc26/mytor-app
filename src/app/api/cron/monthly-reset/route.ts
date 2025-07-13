// ===================================
// 📅 src/app/api/cron/monthly-reset/route.ts (אופציונלי)
// ===================================
import { NextRequest, NextResponse } from 'next/server';
import { monthlyReset } from '@/lib/cron-jobs';

export async function GET(request: NextRequest) {
  // בדיקת authorization (רק מVercel Cron או authorization header)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await monthlyReset();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset usage' }, { status: 500 });
  }
}