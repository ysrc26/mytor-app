// ===================================
// 📊 src/components/subscription/SubscriptionStatus.tsx
// ===================================
'use client';

import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Calendar, Building, Zap, AlertTriangle } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/hooks/useSubscription';

interface SubscriptionStatusProps {
  onUpgrade?: () => void;
  compact?: boolean;
}

export default function SubscriptionStatus({ 
  onUpgrade, 
  compact = false 
}: SubscriptionStatusProps) {
  const { subscription, loading, isPremium } = useSubscription();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) return null;

  const plan = SUBSCRIPTION_PLANS[subscription.subscription_tier];
  const usagePercent = subscription.monthly_limit > 0 
    ? (subscription.monthly_appointments_used / subscription.monthly_limit) * 100 
    : 0;

  const getStatusBadge = () => {
    if (subscription.subscription_tier === 'free') {
      return <Badge variant="secondary">חינם</Badge>;
    }
    
    if (subscription.subscribed) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <Crown className="w-3 h-3 ml-1" />
          {plan.name}
        </Badge>
      );
    }
    
    return (
      <Badge variant="destructive">
        <AlertTriangle className="w-3 h-3 ml-1" />
        לא פעיל
      </Badge>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {getStatusBadge()}
            <span className="text-sm font-medium">
              {subscription.monthly_appointments_used}/{subscription.monthly_limit} תורים
            </span>
          </div>
          <Progress value={usagePercent} className="h-2" />
        </div>
        
        {!isPremium && onUpgrade && (
          <Button size="sm" onClick={onUpgrade}>
            שדרג
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {subscription.subscription_tier === 'free' ? (
              <Building className="w-5 h-5 text-gray-600" />
            ) : subscription.subscription_tier === 'premium' ? (
              <Zap className="w-5 h-5 text-blue-600" />
            ) : (
              <Crown className="w-5 h-5 text-purple-600" />
            )}
            מנוי נוכחי
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Plan Info */}
        <div>
          <h4 className="font-semibold mb-2">{plan.name}</h4>
          <p className="text-gray-600 text-sm">
            {plan.price === 0 ? 'חינם לעד' : `₪${plan.price} לחודש`}
          </p>
        </div>

        {/* Usage Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">שימוש חודשי</span>
            <span className="text-sm text-gray-600">
              {subscription.monthly_appointments_used}/{subscription.monthly_limit} תורים
            </span>
          </div>
          <Progress value={usagePercent} className="h-3" />
          
          {usagePercent > 80 && (
            <p className="text-sm text-orange-600 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              אתה מתקרב למגבלה החודשית
            </p>
          )}
        </div>

        {/* Subscription End Date */}
        {subscription.subscription_end && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            חידוש בתאריך: {new Date(subscription.subscription_end).toLocaleDateString('he-IL')}
          </div>
        )}

        {/* Features List */}
        <div>
          <h5 className="font-medium mb-2">התכונות שלך:</h5>
          <ul className="space-y-1">
            {plan.features.map((feature, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isPremium && onUpgrade && (
            <Button 
              onClick={onUpgrade}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Crown className="w-4 h-4 ml-2" />
              שדרג עכשיו
            </Button>
          )}
          
          {isPremium && (
            <Button 
              variant="outline"
              onClick={() => window.open('/api/subscriptions/portal', '_blank')}
              className="flex-1"
            >
              נהל מנוי
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}