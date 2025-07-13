// ===================================
// 📄 src/app/pricing/page.tsx
// ===================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Users, Building2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PricingPlans from '@/components/pricing/PricingPlans';

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (plan: string) => {
    if (plan === 'free') {
      router.push('/auth/signup');
      return;
    }

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
        // אם לא מחובר, הפנה להרשמה
        router.push('/auth/signup');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      router.push('/auth/signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="text-xl font-bold">MyTor</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/')}
              >
                דף הבית
              </Button>
              <Button 
                onClick={() => router.push('/auth/login')}
              >
                התחברות
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            תמחור שקוף וגמיש
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            בחר את התוכנית שמתאימה לך. התחל חינם ושדרג רק כשאתה מוכן.
          </p>
          <Button 
            size="lg"
            onClick={() => router.push('/auth/signup')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ArrowRight className="w-5 h-5 ml-2" />
            התחל היום
          </Button>
        </div>

        {/* Pricing Plans */}
        <div className="mb-20">
          <PricingPlans 
            onUpgrade={handleUpgrade}
            loading={loading}
          />
        </div>

        {/* Features Comparison */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            השוואת תכונות
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-lg shadow-lg">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-right p-4 font-semibold">תכונה</th>
                  <th className="text-center p-4 font-semibold">חינם</th>
                  <th className="text-center p-4 font-semibold text-blue-600">פרימיום</th>
                  <th className="text-center p-4 font-semibold text-purple-600">עסקי</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-4 font-medium">מספר עסקים</td>
                  <td className="text-center p-4">1</td>
                  <td className="text-center p-4">3</td>
                  <td className="text-center p-4">ללא הגבלה</td>
                </tr>
                <tr className="border-t bg-gray-50">
                  <td className="p-4 font-medium">תורים בחודש</td>
                  <td className="text-center p-4">10</td>
                  <td className="text-center p-4">100</td>
                  <td className="text-center p-4">1,000</td>
                </tr>
                <tr className="border-t">
                  <td className="p-4 font-medium">SMS התראות</td>
                  <td className="text-center p-4">❌</td>
                  <td className="text-center p-4">✅</td>
                  <td className="text-center p-4">✅</td>
                </tr>
                <tr className="border-t bg-gray-50">
                  <td className="p-4 font-medium">הסרת מיתוג</td>
                  <td className="text-center p-4">❌</td>
                  <td className="text-center p-4">✅</td>
                  <td className="text-center p-4">✅</td>
                </tr>
                <tr className="border-t">
                  <td className="p-4 font-medium">מטפלים מרובים</td>
                  <td className="text-center p-4">❌</td>
                  <td className="text-center p-4">❌</td>
                  <td className="text-center p-4">✅</td>
                </tr>
                <tr className="border-t bg-gray-50">
                  <td className="p-4 font-medium">API גישה</td>
                  <td className="text-center p-4">❌</td>
                  <td className="text-center p-4">❌</td>
                  <td className="text-center p-4">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            שאלות נפוצות
          </h2>
          
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                האם יש התחייבות?
              </h3>
              <p className="text-gray-600 text-sm">
                לא, אין התחייבות. אתה יכול לבטל או לשנות את המנוי שלך בכל עת.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                מה קורה אם אני חורג ממגבלת התורים?
              </h3>
              <p className="text-gray-600 text-sm">
                המערכת תמנע יצירת תורים נוספים. אתה יכול לשדרג בכל עת.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                איך אני משנה תוכניות?
              </h3>
              <p className="text-gray-600 text-sm">
                אתה יכול לשדרג או להוריד דרגה בכל עת מהדשבורד שלך.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                איך עובד החיוב?
              </h3>
              <p className="text-gray-600 text-sm">
                החיוב מתבצע חודשית דרך Stripe בצורה מאובטחת.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">
            מוכן להתחיל?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            הצטרף לאלפי בעלי עסקים שכבר משתמשים במייטור
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              size="lg"
              variant="outline"
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => router.push('/auth/signup')}
            >
              התחל חינם
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={() => handleUpgrade('premium')}
            >
              שדרג לפרימיום
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">M</span>
                </div>
                <span className="text-xl font-bold">MyTor</span>
              </div>
              <p className="text-gray-400 text-sm">
                מערכת תורים פשוטה ויעילה לעצמאים
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">מוצר</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">תכונות</a></li>
                <li><a href="#" className="hover:text-white">תמחור</a></li>
                <li><a href="#" className="hover:text-white">דוגמאות</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">תמיכה</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">מרכז עזרה</a></li>
                <li><a href="#" className="hover:text-white">צור קשר</a></li>
                <li><a href="#" className="hover:text-white">סטטוס</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">חוקי</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/privacy" className="hover:text-white">פרטיות</a></li>
                <li><a href="/terms" className="hover:text-white">תנאי שימוש</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 MyTor. כל הזכויות שמורות.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
