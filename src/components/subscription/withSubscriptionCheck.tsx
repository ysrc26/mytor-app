// ===================================
// 🛡️ src/components/subscription/withSubscriptionCheck.tsx (מתוקן)
// ===================================
'use client';

import { useEffect, useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import LimitReachedModal from './LimitReachedModal';

interface WithSubscriptionCheckOptions {
  action: 'create_business' | 'create_appointment' | 'send_sms';
  fallback?: React.ComponentType;
}

export function withSubscriptionCheck<P extends object>(
  Component: React.ComponentType<P>,
  options: WithSubscriptionCheckOptions
) {
  return function WrappedComponent(props: P) {
    const { checkLimit } = useSubscription();
    const [canAccess, setCanAccess] = useState<boolean | null>(null);
    const [limitModalOpen, setLimitModalOpen] = useState(false);
    
    // תיקון - המרת action לסוג נכון
    const [limitType, setLimitType] = useState<'businesses' | 'appointments' | 'sms'>(() => {
      switch (options.action) {
        case 'create_business':
          return 'businesses';
        case 'create_appointment':
          return 'appointments';
        case 'send_sms':
          return 'sms';
        default:
          return 'appointments';
      }
    });

    useEffect(() => {
      const checkAccess = async () => {
        const result = await checkLimit(options.action);
        
        if (!result.allowed) {
          // עדכון limitType לפי action
          const mappedType = options.action === 'create_business' ? 'businesses' :
                           options.action === 'send_sms' ? 'sms' : 'appointments';
          setLimitType(mappedType);
          setLimitModalOpen(true);
          setCanAccess(false);
        } else {
          setCanAccess(true);
        }
      };

      checkAccess();
    }, [checkLimit, options.action]);

    const handleUpgrade = async () => {
      setLimitModalOpen(false);
      
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'premium' })
      });

      const data = await response.json();
      
      if (response.ok && data.url) {
        window.location.href = data.url;
      }
    };

    if (canAccess === null) {
      return <div>בודק הרשאות...</div>;
    }

    if (!canAccess) {
      if (options.fallback) {
        const FallbackComponent = options.fallback;
        return <FallbackComponent />;
      }
      
      return (
        <>
          <div className="text-center p-8 text-gray-500">
            תכונה זו זמינה רק למנויים פרימיום
          </div>
          <LimitReachedModal
            isOpen={limitModalOpen}
            onClose={() => setLimitModalOpen(false)}
            onUpgrade={handleUpgrade}
            limitType={limitType}
          />
        </>
      );
    }

    return (
      <>
        <Component {...props} />
        <LimitReachedModal
          isOpen={limitModalOpen}
          onClose={() => setLimitModalOpen(false)}
          onUpgrade={handleUpgrade}
          limitType={limitType}
        />
      </>
    );
  };
}