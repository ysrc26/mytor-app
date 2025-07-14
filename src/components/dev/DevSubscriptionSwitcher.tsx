// src/components/dev/DevSubscriptionSwitcher.tsx
'use client';

import { useState, useEffect } from 'react';
import { Crown, Zap, Star, Settings, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

// ===================================
// 🎯 Types
// ===================================

type SubscriptionTier = 'free' | 'premium' | 'business';

interface TierConfig {
  id: SubscriptionTier;
  name: string;
  price: number;
  limit: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
  features: string[];
}

// ===================================
// 🎯 Main Component
// ===================================

export const DevSubscriptionSwitcher = () => {
  const { user } = useAuth();
  const { limits } = useSubscription();
  const [loading, setLoading] = useState<SubscriptionTier | null>(null);
  
  // Get current tier from subscription hook
  const currentTier = (limits?.subscription_tier as SubscriptionTier) || 'free';

  // Configuration for each tier
  const tiers: TierConfig[] = [
    {
      id: 'free',
      name: 'חינם',
      price: 0,
      limit: 10,
      icon: Star,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 hover:bg-gray-200',
      description: 'מושלם להתחלה',
      features: ['10 תורים בחודש', 'ניהול בסיסי', 'מיתוג MyTor']
    },
    {
      id: 'premium',
      name: 'פרימיום',
      price: 29,
      limit: 100,
      icon: Crown,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 hover:bg-amber-200',
      description: 'לעסקים צומחים',
      features: ['100 תורים בחודש', 'תזכורות SMS', 'הסרת מיתוג', 'דוחות בסיסיים']
    },
    {
      id: 'business',
      name: 'עסקי',
      price: 99,
      limit: 1000,
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 hover:bg-blue-200',
      description: 'לעסקים מתקדמים',
      features: ['1000 תורים בחודש', 'אנליטיקה מתקדמת', 'עסקים מרובים', 'תמיכה VIP']
    }
  ];

  // ===================================
  // 🔧 Functions
  // ===================================

  const switchSubscription = async (targetTier: SubscriptionTier) => {
    if (!user) {
      showErrorToast('משתמש לא מחובר');
      return;
    }

    setLoading(targetTier);

    try {
      // Import the correct supabase instance
      const { createClient } = await import('@/lib/supabase-client');
      const supabase = createClient();
      
      // Get tier configuration
      const tierConfig = tiers.find(t => t.id === targetTier);
      if (!tierConfig) {
        throw new Error('Invalid tier');
      }

      console.log(`🔄 Switching to ${targetTier} tier for user ${user.id}`);
      console.log('User object keys:', Object.keys(user));
      console.log('User object:', user);

      // Check current data first
      const { data: currentSubscriber, error: fetchError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('Current subscriber data:', currentSubscriber);
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.log('Fetch error (not "not found"):', fetchError);
      }

      // Update subscribers table - בדוק קודם אם קיים
      console.log('🔄 Updating subscribers table...');
      
      // First, check if subscriber exists
      const { data: existingSubscriber } = await supabase
        .from('subscribers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const subscriberData = {
        user_id: user.id,
        email: user.email || user.email,
        subscription_tier: targetTier,
        subscribed: targetTier !== 'free',
        monthly_limit: tierConfig.limit,
        monthly_appointments_used: 0,
        updated_at: new Date().toISOString(),
      };
      
      console.log('Subscriber data:', subscriberData);

      let subData, subError;
      
      if (existingSubscriber) {
        // Update existing record
        console.log('📝 Updating existing subscriber...');
        const result = await supabase
          .from('subscribers')
          .update(subscriberData)
          .eq('user_id', user.id)
          .select();
        subData = result.data;
        subError = result.error;
      } else {
        // Insert new record
        console.log('➕ Creating new subscriber...');
        const result = await supabase
          .from('subscribers')
          .insert(subscriberData)
          .select();
        subData = result.data;
        subError = result.error;
      }

      if (subError) {
        console.error('❌ Subscribers table error:', subError);
        throw new Error(`Subscribers update failed: ${subError.message}`);
      }

      console.log('✅ Subscribers table updated:', subData);

      // Update users table
      console.log('🔄 Updating users table...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .update({ 
          subscription_tier: targetTier
        })
        .eq('id', user.id)
        .select();

      if (userError) {
        console.error('❌ Users table error:', userError);
        throw new Error(`Users update failed: ${userError.message}`);
      }

      console.log('✅ Users table updated:', userData);

      // Show success message
      showSuccessToast(
        `🎉 עברת למנוי ${tierConfig.name}! ${tierConfig.limit} תורים בחודש`
      );

      // Refresh page to update all components
      setTimeout(() => {
        console.log('🔄 Refreshing page...');
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('❌ Full error object:', error);
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      showErrorToast(`שגיאה בעדכון המנוי: ${errorMessage}`);
    } finally {
      setLoading(null);
    }
  };

  // ===================================
  // 🎨 Render
  // ===================================

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="border-2 border-dashed border-orange-300 bg-orange-50/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <Settings className="w-5 h-5" />
          🧪 כפתורי בדיקה - מעבר מנויים
          <Badge variant="outline" className="bg-orange-100 text-orange-700">
            DEV ONLY
          </Badge>
        </CardTitle>
        <p className="text-sm text-orange-600">
          כפתורים לבדיקת המעבר בין רמות מנוי שונות (פיתוח בלבד)
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        
        {/* Current Status */}
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
          <Eye className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium">מנוי נוכחי:</span>
          <Badge variant="secondary">
            {tiers.find(t => t.id === currentTier)?.name || 'לא ידוע'}
          </Badge>
        </div>

        {/* Tier Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isLoading = loading === tier.id;
            const isCurrent = currentTier === tier.id;
            
            return (
              <Button
                key={tier.id}
                onClick={() => switchSubscription(tier.id)}
                disabled={loading !== null}
                className={`
                  h-auto p-4 flex-col gap-3 relative transition-all duration-200
                  ${isCurrent 
                    ? 'ring-2 ring-green-500 bg-green-50 hover:bg-green-100 border-green-200' 
                    : tier.bgColor
                  }
                  ${isLoading ? 'opacity-50' : ''}
                `}
                variant="outline"
              >
                {/* Current indicator */}
                {isCurrent && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}

                {/* Loading spinner */}
                {isLoading && (
                  <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                )}

                {/* Icon */}
                <Icon className={`w-8 h-8 ${tier.color}`} />
                
                {/* Content */}
                <div className="text-center">
                  <h3 className="font-bold text-gray-900 mb-1">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {tier.description}
                  </p>
                  <div className="text-lg font-bold text-gray-900">
                    {tier.price === 0 ? 'חינם' : `₪${tier.price}/חודש`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {tier.limit} תורים בחודש
                  </div>
                </div>

                {/* Features */}
                <div className="text-xs text-gray-600 space-y-1">
                  {tier.features.slice(0, 2).map((feature, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </Button>
            );
          })}
        </div>

        {/* Warning */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-700">
            ⚠️ <strong>הערה:</strong> הכפתורים האלה משנים את המנוי באמת! 
            הם מיועדים לבדיקות פיתוח בלבד ולא יופיעו בפרודקשן.
          </p>
        </div>

        {/* Reset Button */}
        <Button
          onClick={() => switchSubscription('free')}
          variant="outline"
          size="sm"
          className="w-full text-gray-600 hover:text-gray-900"
          disabled={loading !== null}
        >
          🔄 איפוס למנוי חינם
        </Button>

      </CardContent>
    </Card>
  );
};