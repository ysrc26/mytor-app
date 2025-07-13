// ===================================
// 🚫 src/components/subscription/LimitReachedModal.tsx
// ===================================
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Crown } from 'lucide-react';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  limitType: 'businesses' | 'appointments' | 'sms';
  currentCount?: number;
  maxCount?: number;
}

export default function LimitReachedModal({
  isOpen,
  onClose,
  onUpgrade,
  limitType,
  currentCount,
  maxCount
}: LimitReachedModalProps) {
  
  const getLimitMessage = () => {
    switch (limitType) {
      case 'businesses':
        return {
          title: 'הגעת למגבלת העסקים',
          description: `אתה יכול לנהל עד ${maxCount} עסקים בתוכנית החינמית. שדרג לפרימיום כדי לנהל עד 3 עסקים.`,
          icon: <AlertTriangle className="w-6 h-6 text-orange-500" />
        };
      case 'appointments':
        return {
          title: 'הגעת למגבלת התורים החודשית',
          description: `השתמשת ב-${currentCount} מתוך ${maxCount} התורים המותרים החודש. שדרג כדי לקבל יותר תורים.`,
          icon: <AlertTriangle className="w-6 h-6 text-orange-500" />
        };
      case 'sms':
        return {
          title: 'SMS התראות זמינות רק למנויים',
          description: 'שדרג לתוכנית פרימיום או עסקית כדי לקבל SMS התראות אוטומטיות ללקוחות שלך.',
          icon: <AlertTriangle className="w-6 h-6 text-blue-500" />
        };
      default:
        return {
          title: 'הגעת למגבלה',
          description: 'שדרג את התוכנית שלך כדי להמשיך.',
          icon: <AlertTriangle className="w-6 h-6 text-orange-500" />
        };
    }
  };

  const { title, description, icon } = getLimitMessage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            {icon}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">פרימיום - ₪19.90/חודש</span>
            </div>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• עד 3 עסקים</li>
              <li>• 100 תורים בחודש</li>
              <li>• SMS התראות</li>
              <li>• הסרת מיתוג</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              אולי מאוחר יותר
            </Button>
            <Button 
              onClick={onUpgrade}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Crown className="w-4 h-4 ml-2" />
              שדרג עכשיו
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            🎁 7 ימי ניסיון חינם • ביטול בכל עת
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}