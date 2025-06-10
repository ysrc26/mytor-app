// src/app/auth/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { Calendar, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, User, Phone, CheckCircle } from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות לא תואמות');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      setLoading(false);
      return;
    }

    // Israeli phone validation
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('מספר טלפון לא תקין (05xxxxxxxx)');
      setLoading(false);
      return;
    }

    try {
      // // Sign up with Supabase Auth
      // const { data, error: authError } = await supabase.auth.signUp({
      //   email: formData.email,
      //   password: formData.password,
      //   options: {
      //     data: {
      //       full_name: formData.fullName,
      //       phone: formData.phone
      //     }
      //   }
      // });

      // if (authError) {
      //   if (authError.message.includes('already registered')) {
      //     setError('האימייל הזה כבר רשום במערכת');
      //   } else {
      //     setError('שגיאה ביצירת החשבון. אנא נסה שנית.');
      //   }
      // } else if (data.user) {
        // Create user profile in our database
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            full_name: formData.fullName
          }),
        });

        if (response.ok) {
          const supabase = createClientComponentClient();
          await supabase.auth.getSession();
          setSuccess(true);
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 2000);
        } else {
          const data = await response.json();
          setError(data.error || 'שגיאה ביצירת החשבון');
        }
    } catch (err) {
      setError('שגיאה ביצירת החשבון. אנא נסה שנית.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?signup=true`
        }
      });

      if (error) {
        setError('שגיאה בהרשמה עם Google. אנא נסה שנית.');
        setGoogleLoading(false);
      }
      // If successful, user will be redirected to Google
    } catch (err) {
      setError('שגיאה בהרשמה עם Google. אנא נסה שנית.');
      setGoogleLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center" style={{ fontFamily: "'Heebo', 'Assistant', sans-serif", direction: 'rtl' }}>
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">ברוך הבא ל-MyTor!</h2>
          <p className="text-gray-600 mb-6">החשבון שלך נוצר בהצלחה</p>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
            <p className="text-green-800 text-sm">
              נשלח אליך אימייל לאימות החשבון. אנא בדוק את תיבת הדואר שלך.
            </p>
          </div>
          <p className="text-sm text-gray-500">מעביר אותך לדף האישי...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" style={{ fontFamily: "'Heebo', 'Assistant', sans-serif", direction: 'rtl' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-black bg-gradient-to-l from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                MyTor
              </h1>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">צור חשבון חדש</h2>
            <p className="text-gray-600">הצטרף לאלפי עצמאים שכבר משתמשים ב-MyTor</p>
          </div>

          {/* Signup Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Google Signup Button */}
            <button
              onClick={handleGoogleSignup}
              disabled={googleLoading || loading}
              className="w-full mb-6 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 px-6 py-4 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              <span>{googleLoading ? 'נרשם...' : 'הירשם עם Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">או הירשם עם אימייל</span>
              </div>
            </div>

            {/* Email Signup Form */}
            <form onSubmit={handleEmailSignup} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                  שם מלא
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full pr-12 pl-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                    placeholder="הכנס את השם המלא שלך"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  כתובת אימייל
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pr-12 pl-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  מספר טלפון
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full pr-12 pl-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                    placeholder="05xxxxxxxx"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  סיסמה
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pr-12 pl-12 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                    placeholder="לפחות 6 תווים"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  אימות סיסמה
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full pr-12 pl-12 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                    placeholder="הכנס שוב את הסיסמה"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  required
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                />
                <span className="mr-3 text-sm text-gray-600">
                  אני מסכים ל
                  <Link href="/terms" className="text-blue-600 hover:text-blue-800 font-medium"> תנאי השימוש </Link>
                  ול
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-800 font-medium"> מדיניות הפרטיות</Link>
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full group relative overflow-hidden bg-gradient-to-l from-blue-600 via-blue-700 to-indigo-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="absolute inset-0 bg-gradient-to-l from-blue-500 via-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>צור חשבון חינם</span>
                      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-l from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-x-full group-hover:translate-x-[-200%] skew-x-12"></div>
              </button>
            </form>
          </div>

          {/* Login Link */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              יש לך כבר חשבון?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-all duration-200">
                התחבר כאן
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              חזור לעמוד הבית
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}