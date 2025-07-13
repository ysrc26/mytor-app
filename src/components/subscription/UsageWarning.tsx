// ===================================
// 🔧 src/components/subscription/UsageWarning.tsx (מתוקן)
// ===================================
'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useState } from 'react';

interface UsageWarningProps {
  threshold?: number;
}

export default function UsageWarning({ threshold = 80 }: UsageWarningProps) {
  const { subscription, isPremium } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  if (!subscription || isPremium || dismissed) {
    return null;
  }

  const usagePercent = subscription.monthly_limit > 0 
    ? (subscription.monthly_appointments_used / subscription.monthly_limit) * 100 
    : 0;

  if (usagePercent < threshold) {
    return null;
  }

  const remaining = subscription.monthly_limit - subscription.monthly_appointments_used;
  const isNearLimit = remaining <= 2;

  const handleUpgrade = async () => {
    // TODO: חיבור לStripe בהמשך
    alert('שדרוג יבוא בקרוב!');
  };

  return (
    <Alert className={`mb-4 ${isNearLimit ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
      <AlertTriangle className={`h-4 w-4 ${isNearLimit ? 'text-red-600' : 'text-orange-600'}`} />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <p className={`font-medium ${isNearLimit ? 'text-red-900' : 'text-orange-900'}`}>
            {isNearLimit 
              ? `נותרו לך רק ${remaining} תורים החודש!`
              : 'אתה מתקרב למגבלת התורים החודשית'
            }
          </p>
          <p className={`text-sm ${isNearLimit ? 'text-red-700' : 'text-orange-700'}`}>
            השתמשת ב-{subscription.monthly_appointments_used} מתוך {subscription.monthly_limit} תורים
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </Button>
          <Button
            size="sm"
            onClick={handleUpgrade}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Crown className="w-3 h-3 ml-1" />
            שדרג עכשיו
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}