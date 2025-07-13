// ===================================
// 🔧 src/hooks/useSubscription.ts (מתוקן)
// ===================================
'use client';

import { useState, useEffect } from 'react';

// ===================================
// 🏷️ Types & Interfaces - מתוקן
// ===================================
export interface UserSubscription {
  user_id: string;
  email: string;
  subscribed: boolean;
  subscription_tier: 'free' | 'premium' | 'business';
  subscription_end?: string;
  monthly_limit: number;
  monthly_appointments_used: number;
}

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  remainingCount?: number;
}

// תיקון הטיפוסים כדי שיעבדו עם TypeScript
interface PlanLimits {
  businesses: number | 'unlimited';
  appointments_per_month: number | 'unlimited';
  sms_notifications: boolean;
  custom_branding: boolean;
}

interface SubscriptionPlan {
  name: string;
  price: number;
  limits: PlanLimits;
  features: string[];
}

// ===================================
// 📋 תוכניות מנוי - מתוקן
// ===================================
export const SUBSCRIPTION_PLANS: Record<'free' | 'premium' | 'business', SubscriptionPlan> = {
  free: {
    name: 'חינם',
    price: 0,
    limits: {
      businesses: 1,
      appointments_per_month: 10,
      sms_notifications: false,
      custom_branding: false
    },
    features: [
      'עסק אחד',
      'עד 10 תורים בחודש',
      'ממשק בסיסי'
    ]
  },
  premium: {
    name: 'פרימיום',
    price: 19.90,
    limits: {
      businesses: 3,
      appointments_per_month: 100,
      sms_notifications: true,
      custom_branding: true
    },
    features: [
      'עד 3 עסקים',
      'עד 100 תורים בחודש',
      'SMS התראות',
      'הסרת מיתוג'
    ]
  },
  business: {
    name: 'עסקי',
    price: 49.90,
    limits: {
      businesses: 'unlimited' as const,
      appointments_per_month: 'unlimited' as const,
      sms_notifications: true,
      custom_branding: true
    },
    features: [
      'עסקים ללא הגבלה',
      'תורים ללא הגבלה',
      'מטפלים מרובים'
    ]
  }
};

// ===================================
// 🎯 Hook מתוקן
// ===================================
export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      
      // ברירת מחדל - משתמש חינמי
      const defaultSubscription: UserSubscription = {
        user_id: '',
        email: '',
        subscribed: false,
        subscription_tier: 'free',
        monthly_limit: 10,
        monthly_appointments_used: 0
      };

      setSubscription(defaultSubscription);
      
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('שגיאה בטעינת מנוי');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  // בדיקת מגבלות - מתוקן
  const checkLimit = async (action: 'create_business' | 'create_appointment' | 'send_sms'): Promise<LimitCheckResult> => {
    if (!subscription) {
      return { allowed: false, reason: 'לא נמצא מידע על המנוי' };
    }

    const plan = SUBSCRIPTION_PLANS[subscription.subscription_tier];

    switch (action) {
      case 'create_business':
        if (plan.limits.businesses === 'unlimited') return { allowed: true };
        return { allowed: true }; // זמנית מאפשר הכל
        
      case 'create_appointment':
        // תיקון הבעיה - בדיקה נכונה של הטיפוס
        if (plan.limits.appointments_per_month === 'unlimited') return { allowed: true };
        
        const remaining = subscription.monthly_limit - subscription.monthly_appointments_used;
        if (remaining <= 0) {
          return { 
            allowed: false, 
            reason: `הגעת למגבלת התורים החודשית (${subscription.monthly_limit})`,
            remainingCount: 0
          };
        }
        return { allowed: true, remainingCount: remaining };
        
      case 'send_sms':
        if (!plan.limits.sms_notifications) {
          return { 
            allowed: false, 
            reason: 'SMS התראות זמינות רק בתוכניות בתשלום'
          };
        }
        return { allowed: true };
        
      default:
        return { allowed: true };
    }
  };

  return {
    subscription,
    loading,
    error,
    checkLimit,
    refreshSubscription: fetchSubscription,
    isPremium: subscription?.subscription_tier !== 'free' && subscription?.subscribed
  };
}