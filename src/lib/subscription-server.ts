// ===================================
// src/lib/subscription-server.ts
// ===================================
import { createClient } from '@/lib/supabase-server';

/**
 * בדיקת מגבלות משתמש בצד השרת
 */
export async function checkSubscriptionLimit(
  userId: string, 
  action: 'create_business' | 'create_appointment' | 'send_sms'
): Promise<{ allowed: boolean; reason?: string; upgradeRequired?: boolean }> {
  
  const supabase = await createClient();
  
  try {
    switch (action) {
      case 'create_business':
        // בדיקת מספר עסקים קיימים
        const { count: businessCount } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_active', true);

        // זמנית - משתמשים חינמיים יכולים עסק אחד
        if ((businessCount || 0) >= 1) {
          return { 
            allowed: false, 
            reason: 'משתמשים חינמיים יכולים לנהל עסק אחד בלבד. שדרג לפרימיום לעסקים נוספים.',
            upgradeRequired: true
          };
        }
        
        return { allowed: true };

      case 'create_appointment':
        // זמנית מאפשר הכל - נוסיף בדיקות אמיתיות בהמשך
        return { allowed: true };

      case 'send_sms':
        // זמנית - SMS לא זמין למשתמשים חינמיים
        return { 
          allowed: false, 
          reason: 'SMS התראות זמינות רק בתוכניות בתשלום.',
          upgradeRequired: true
        };

      default:
        return { allowed: true };
    }
  } catch (error) {
    console.error('Error checking subscription limits:', error);
    return { allowed: false, reason: 'שגיאה בבדיקת מגבלות' };
  }
}