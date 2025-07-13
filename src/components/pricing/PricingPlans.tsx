// src/components/pricing/PricingPlans.tsx

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap, AlertTriangle } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';

interface PricingPlansProps {
  showTitle?: boolean;
  compact?: boolean;
  showCurrentPlan?: boolean;
}

const PricingPlans = ({
  showTitle = true,
  compact = false,
  showCurrentPlan = true
}: PricingPlansProps) => {
  const { user } = useAuth();
  const {
    limits,
    upgradeSubscription,
    getSubscriptionTierLabel
  } = useSubscription();

  const plans = [
    {
      id: 'free',
      name: 'חינם',
      price: 0,
      period: '',
      icon: Star,
      description: 'מושלם להתחלה',
      features: ['10 תורים בחודש', 'ניהול לקוחות בסיסי', 'לוח שנה פשוט', 'מיתוג MyTor'],
      buttonText: 'התחל חינם',
      popular: false,
      action: () => { }
    },
    {
      id: 'premium',
      name: 'פרימיום',
      price: 19.90,
      period: '/חודש',
      icon: Crown,
      description: 'לעסקים צומחים',
      features: [
        '100 תורים בחודש',
        'ניהול לקוחות מתקדם',
        'לוח שנה מלא',
        'תזכורות SMS',
        'הסרת מיתוג MyTor',
        'דוחות בסיסיים',
        'תמיכה במייל'
      ],
      buttonText: 'שדרג לפרימיום',
      popular: true,
      action: () => {
        if (!user) {
          window.location.href = '/auth/signup';
        } else {
          upgradeSubscription('premium');
        }
      }
    },
    {
      id: 'business',
      name: 'עסקי',
      price: 49.90,
      period: '/חודש',
      icon: Zap,
      description: 'לעסקים מתקדמים',
      features: [
        '1000 תורים בחודש',
        "כל הפיצ'רים",
        'דוחות מתקדמים',
        'מספר עסקים',
        'תמיכה VIP',
        'אנליטיקה מתקדמת',
        'אינטגרציות מתקדמות'
      ],
      buttonText: 'שדרג לעסקי',
      popular: false,
      action: () => {
        if (!user) {
          window.location.href = '/auth/signup';
        } else {
          upgradeSubscription('business');
        }
      }
    }
  ];

  const currentTier = limits?.subscription_tier || 'free';

  const getButtonText = (planId: string) => {
    if (!user) {
      return planId === 'free' ? 'התחל חינם' : 'בחר';
    }

    if (planId === currentTier) {
      return null; // ללא כפתור לתוכנית הפעילה
    }

    return plans.find(p => p.id === planId)?.buttonText || 'בחר תוכנית';
  };

  const isCurrentPlan = (planId: string) => user && planId === currentTier;
  const canUpgrade = (planId: string) => user && planId !== 'free' && !isCurrentPlan(planId);
  const showButton = (planId: string) => {
    if (!user) return true; // תמיד הצג כפתור למשתמשים לא מחוברים
    return !isCurrentPlan(planId); // הסתר כפתור רק לתוכנית הפעילה
  };

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            תוכניות מחיר פשוטות ושקופות
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            התחל בחינם ושדרג כשאתה מוכן. ללא עמלות נסתרות, ללא הפתעות.
            מתאים לעסקים קטנים בישראל.
          </p>
        </div>
      )}

      <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6 max-w-6xl mx-auto`}>
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = isCurrentPlan(plan.id);
          const canUpgradeThis = canUpgrade(plan.id);

          return (
            <Card
              key={plan.id}
              className={`relative ${plan.popular
                ? 'border-primary shadow-lg scale-105'
                : 'border-border'
                } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">פופולרי ביותר</Badge>
                </div>
              )}

              {isCurrent && showCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-500 text-white">תוכנית פעילה</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${plan.popular ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                    <Icon className={`w-6 h-6 ${plan.popular ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                  </div>
                </div>

                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>

                <div className="mt-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">₪{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {showButton(plan.id) && (
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={plan.action}
                    disabled={!canUpgrade(plan.id) && plan.id !== 'free' && !!user}
                  >
                    {getButtonText(plan.id)}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* הצגת סטטיסטיקות נוכחיות */}
      {limits && user && showCurrentPlan && (
        <div className="mt-8 text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {limits.subscription_tier === 'premium' && <Crown className="w-4 h-4 text-amber-500" />}
                    {limits.subscription_tier === 'business' && <Zap className="w-4 h-4 text-blue-500" />}
                    <span className="font-medium">מנוי {getSubscriptionTierLabel(limits.subscription_tier)}</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {limits.appointments_used}/{limits.appointments_limit} תורים
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>נותרו {limits.appointments_limit - limits.appointments_used} תורים החודש</span>
                  <span>{Math.round((limits.appointments_used / limits.appointments_limit) * 100)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${limits.appointments_used >= limits.appointments_limit * 0.9
                      ? 'bg-red-500'
                      : limits.appointments_used >= limits.appointments_limit * 0.7
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                      }`}
                    style={{
                      width: `${Math.min((limits.appointments_used / limits.appointments_limit) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* אזהרת שדרוג */}
              {limits.subscription_tier === 'free' && limits.appointments_used >= limits.appointments_limit * 0.8 && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        אתה מתקרב לגבול התורים החודשי שלך
                      </p>
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => upgradeSubscription('premium')}
                      >
                        שדרג לפרימיום - 100 תורים
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* חסימה מלאה */}
              {!limits.can_create_appointment && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                        הגעת לגבול התורים החודשי
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        שדרג את המנוי שלך כדי לקבל תורים נוספים
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => upgradeSubscription('premium')}
                        >
                          פרימיום - ₪19.90
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => upgradeSubscription('business')}
                        >
                          עסקי - ₪49.90
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PricingPlans;