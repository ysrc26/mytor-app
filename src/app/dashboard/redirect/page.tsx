// /src/app/dashboard/redirect/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';


export default function DashboardRedirect() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUserBusiness = async () => {
      try {
        // בדוק אם המשתמש מחובר
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // בדוק אם יש לו עסק
        const response = await fetch('/api/businesses?single=true');
        
        if (response.ok) {
          const business = await response.json();
          // יש עסק - הפנה לדשבורד של העסק
          router.push(`/dashboard/business/${business.id}`);
        } else if (response.status === 404) {
          // אין עסק - הפנה ליצירת עסק
          router.push('/dashboard/business/create-business');
        } else {
          // שגיאה - הפנה לדף שגיאה או חזרה להתחברות
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error checking user business:', error);
        router.push('/auth/login');
      }
    };

    checkUserBusiness();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center" style={{ fontFamily: "'Heebo', 'Assistant', sans-serif", direction: 'rtl' }}>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">מפנה אותך...</p>
      </div>
    </div>
  );
}