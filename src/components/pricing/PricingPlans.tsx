// ===================================
// 🏷️ src/components/pricing/PricingPlans.tsx
// ===================================
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Building } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/hooks/useSubscription';

interface PricingPlansProps {
  currentPlan?: 'free' | 'premium' | 'business';
  onUpgrade?: (plan: string) => void;
  loading?: boolean;
}

export default function PricingPlans({ 
  currentPlan = 'free', 
  onUpgrade,
  loading = false 
}: PricingPlansProps) {
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const handleUpgrade = async (plan: string) => {
    if (!onUpgrade) return;
    
    setUpgrading(plan);
    try {
      await onUpgrade(plan);
    } finally {
      setUpgrading(null);
    }
  };

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'free': return <Building className="w-6 h-6" />;
      case 'premium': return <Zap className="w-6 h-6" />;
      case 'business': return <Crown className="w-6 h-6" />;
      default: return <Building className="w-6 h-6" />;
    }
  };

  const getPlanColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'border-gray-200';
      case 'premium': return 'border-blue-500 ring-2 ring-blue-100';
      case 'business': return 'border-purple-500 ring-2 ring-purple-100';
      default: return 'border-gray-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      {Object.entries(SUBSCRIPTION_PLANS).map(([tier, plan]) => {
        const isCurrentPlan = currentPlan === tier;
        const isPopular = tier === 'premium';
        
        return (
          <Card 
            key={tier}
            className={`relative ${getPlanColor(tier)} transition-all duration-300 hover:shadow-lg`}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-3 py-1">
                  הכי פופולרי
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className={`p-3 rounded-full ${
                  tier === 'free' ? 'bg-gray-100 text-gray-600' :
                  tier === 'premium' ? 'bg-blue-100 text-blue-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {getPlanIcon(tier)}
                </div>
              </div>
              
              <CardTitle className="text-xl font-bold mb-2">
                {plan.name}
              </CardTitle>
              
              <div className="text-center mb-4">
                <span className="text-4xl font-bold">
                  {plan.price === 0 ? 'חינם' : `₪${plan.price}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-gray-600 text-sm">/חודש</span>
                )}
              </div>

              {tier !== 'free' && (
                <div className="text-sm text-gray-600 mb-4">
                  🎁 7 ימי ניסיון חינם
                </div>
              )}
            </CardHeader>

            <CardContent>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="text-center">
                {isCurrentPlan ? (
                  <Button 
                    disabled 
                    variant="outline" 
                    className="w-full"
                  >
                    התוכנית הנוכחית שלך
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUpgrade(tier)}
                    disabled={loading || !!upgrading}
                    className={`w-full ${
                      tier === 'premium' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : tier === 'business'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {upgrading === tier ? 'מעבר לתשלום...' : 
                     tier === 'free' ? 'התחל חינם' : `שדרג ל${plan.name}`}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}