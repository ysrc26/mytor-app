// ===================================
// 🔄 src/lib/cron-jobs.ts (אופציונלי - לאיפוס שימוש חודשי)
// ===================================
import { resetMonthlyUsage } from '@/lib/subscription-utils'

/**
 * פונקציה לאיפוס שימוש חודשי
 * יש להפעיל דרך cron job או Vercel Cron
 */
export async function monthlyReset() {
  try {
    console.log('Starting monthly usage reset...');
    await resetMonthlyUsage();
    console.log('Monthly usage reset completed');
    return { success: true };
  } catch (error) {
    console.error('Error in monthly reset:', error);
    return { success: false, error };
  }
}