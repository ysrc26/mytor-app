// ===================================
// 🎛️ src/components/subscription/UpgradeButton.tsx
// ===================================
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, Loader2 } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface UpgradeButtonProps {
  plan?: 'premium' | 'business';
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export default function UpgradeButton({ 
  plan = 'premium',
  className,
  children,
  variant = 'default',
  size = 'default'
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const { isPremium } = useSubscription();

  const handleUpgrade = async () => {
    if (isPremium) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });

      const data = await response.json();
      
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        console.error('Error creating checkout:', data.error);
      }
    } catch (error) {
      console.error('Error upgrading:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isPremium) {
    return null; // לא להציג כפתור שדרוג למשתמשים פרימיום
  }

  return (
    <Button
      onClick={handleUpgrade}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin ml-2" />
      ) : (
        <Crown className="w-4 h-4 ml-2" />
      )}
      {loading ? 'מעבר לתשלום...' : (children || 'שדרג לפרימיום')}
    </Button>
  );
}