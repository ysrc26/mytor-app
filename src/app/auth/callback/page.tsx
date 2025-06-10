// src/app/auth/callback/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Calendar, CheckCircle, AlertCircle } from 'lucide-react';

function AuthCallbackContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setError('שגיאה באימות. אנא נסה להתחבר שנית.');
          setLoading(false);
          return;
        }

        if (data.session) {
          const user = data.session.user;
          const isSignup = searchParams.get('signup') === 'true';
          
          // אם זה הרשמה עם Google, צריך ליצור פרופיל במאגר שלנו
          if (isSignup) {
            try {
              const response = await fetch('/api/auth/google-signup', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  user_id: user.id,
                  email: user.email,
                  full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'משתמש',
                  profile_pic: user.user_metadata?.avatar_url || null
                }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                console.error('Error creating user profile:', errorData);
              }
            } catch (err) {
              console.error('Error in Google signup process:', err);
            }
          }

          // הפניה לדשבורד
          router.push('/dashboard');
        } else {
          setError('לא התקבלו פרטי משתמש. אנא נסה שנית.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('שגיאה לא צפויה. אנא נסה שנית.');
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router, supabase, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center" style={{ fontFamily: "'Heebo', 'Assistant', sans-serif", direction: 'rtl' }}>
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">שגיאה באימות</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
            >
              חזור לדף התחברות
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
            >
              חזור לעמוד הבית
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center" style={{ fontFamily: "'Heebo', 'Assistant', sans-serif", direction: 'rtl' }}>
      <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-l from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
            MyTor
          </h1>
        </div>
        
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">מאמת את החשבון שלך...</h2>
        <p className="text-gray-600">אנא המתן, מעבד את פרטי ההתחברות</p>
        
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-1 rtl:space-x-reverse">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div>טוען...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}