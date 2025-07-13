// ===================================
// 🏢 src/components/business/BusinessBranding.tsx
// ===================================
'use client';

import { useSubscription } from '@/hooks/useSubscription';

interface BusinessBrandingProps {
  businessName?: string;
  className?: string;
}

export default function BusinessBranding({ 
  businessName,
  className = "text-center py-4 border-t border-gray-200 bg-gray-50" 
}: BusinessBrandingProps) {
  const { isPremium, loading } = useSubscription();

  // אם טוען או המשתמש הוא פרימיום, לא להציג מיתוג
  if (loading || isPremium) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="text-sm font-semibold text-gray-700">
            מופעל על ידי MyTor
          </span>
        </div>
        <p className="text-xs text-gray-500">
          מערכת תורים חינמית לעצמאים
        </p>
        <a 
          href="https://mytor.app" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-700 underline"
        >
          צור לך גם מערכת תורים חינם
        </a>
      </div>
    </div>
  );
}