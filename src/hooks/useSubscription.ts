//src/hooks/useSubscription.ts

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';

interface SubscriptionLimits {
  can_create_appointment: boolean;
  appointments_used: number;
  appointments_limit: number;
  subscription_tier: string;
}

interface SubscriptionInfo {
  id: string;
  user_id: string;
  subscription_tier: string;
  subscribed: boolean;
  monthly_appointments_used: number;
  monthly_limit: number;
  billing_period_start: string;
  billing_period_end: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscriptionInfo();
      fetchSubscriptionLimits();
    } else {
      // אם אין משתמש מחובר, סיים את הטעינה
      setLoading(false);
      setLimits(null);
      setSubscriptionInfo(null);
    }
  }, [user]);
  const fetchSubscriptionInfo = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription info:', error);
        return;
      }

      setSubscriptionInfo(data);
    } catch (error) {
      console.error('Error in fetchSubscriptionInfo:', error);
    }
  };

  const fetchSubscriptionLimits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_subscription_limits', { p_user_id: user.id });

      if (error) {
        console.error('Error fetching subscription limits:', error);
        return;
      }

      if (data && data.length > 0) {
        setLimits(data[0]);
      }
    } catch (error) {
      console.error('Error in fetchSubscriptionLimits:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanCreateAppointment = (): boolean => {
    if (!limits) return false;
    
    const canCreate = limits.can_create_appointment;
    
    if (!canCreate) {
      showErrorToast(
        `הגעת לגבול של ${limits.appointments_limit} תורים בחודש. שדרג את המנוי שלך לקבלת תורים נוספים.`
      );
    }
    
    return canCreate;
  };

  const incrementUsage = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .rpc('increment_appointment_usage', { p_user_id: user.id });

      if (error) {
        console.error('Error incrementing usage:', error);
        return false;
      }

      // Refresh limits after incrementing
      await fetchSubscriptionLimits();
      await fetchSubscriptionInfo();

      return data;
    } catch (error) {
      console.error('Error in incrementUsage:', error);
      return false;
    }
  };

  const getSubscriptionTierLabel = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'חינם';
      case 'premium':
        return 'פרימיום';
      case 'business':
        return 'עסקי';
      default:
        return tier;
    }
  };

  const getSubscriptionTierLimits = (tier: string) => {
    switch (tier) {
      case 'free':
        return {
          appointments: 10,
          price: 0,
          features: ['10 תורים בחודש', 'ניהול לקוחות בסיסי', 'לוח שנה פשוט']
        };
      case 'premium':
        return {
          appointments: 100,
          price: 19.90,
          features: ['100 תורים בחודש', 'ניהול לקוחות מתקדם', 'לוח שנה מלא', 'תזכורות SMS', 'הסרת מיתוג']
        };
      case 'business':
        return {
          appointments: 1000,
          price: 49.90,
          features: ['1000 תורים בחודש', "כל הפיצ'רים", 'דוחות מתקדמים', 'מספר עסקים', 'תמיכה VIP']
        };
      default:
        return {
          appointments: 0,
          price: 0,
          features: []
        };
    }
  };

  // פונקציה זמנית לשדרוג ידני (עד שנממש תשלומים)
  const upgradeSubscription = async (newTier: 'premium' | 'business') => {
    if (!user) return;

    try {
      const newLimit = newTier === 'premium' ? 100 : 1000;
      
      // עדכון בטבלת subscribers
      const { error: subError } = await supabase
        .from('subscribers')
        .upsert({
          user_id: user.id,
          email: user.email,
          subscription_tier: newTier,
          subscribed: true,
          monthly_limit: newLimit,
          updated_at: new Date().toISOString(),
        });

      if (subError) throw subError;

      // עדכון בטבלת users
      const { error: userError } = await supabase
        .from('users')
        .update({ subscription_tier: newTier })
        .eq('auth_user_id', user.id);

      if (userError) throw userError;

      // רענון המידע
      await fetchSubscriptionInfo();
      await fetchSubscriptionLimits();

      showSuccessToast(
        `עברת לתוכנית ${getSubscriptionTierLabel(newTier)} עם ${newLimit} תורים בחודש!`
      );

    } catch (error) {
      console.error('Error upgrading subscription:', error);
      showErrorToast("אירעה שגיאה בעת שדרוג המנוי. נסה שוב.");
    }
  };

  return {
    subscriptionInfo,
    limits,
    loading,
    checkCanCreateAppointment,
    incrementUsage,
    getSubscriptionTierLabel,
    getSubscriptionTierLimits,
    upgradeSubscription, // זמני עד שנממש תשלומים
    refreshLimits: fetchSubscriptionLimits,
    refreshSubscriptionInfo: fetchSubscriptionInfo
  };
};