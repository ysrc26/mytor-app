// ===================================
// 🏠 src/app/page.tsx (עדכון דף הבית עם תמחור)
// ===================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Check, Star, Users, Calendar, MessageSquare, Crown, Zap, Building } from 'lucide-react';
import PricingPlans from '@/components/pricing/PricingPlans';

export default function HomePage() {
  const router = useRouter();
  const [pricingVisible, setPricingVisible] = useState(false);

  const handleGetStarted = () => {
    router.push('/auth/signup');
  };

  const handleUpgrade = async (plan: string) => {
    if (plan === 'free') {
      router.push('/auth/signup');
      return;
    }

    // נסה ליצור checkout (אם לא מחובר יפנה להרשמה)
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
        router.push('/auth/signup');
      }
    } catch (error) {
      router.push('/auth/signup');
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
                onClick={() => setPricingVisible(!pricingVisible)}
              >
                תמחור
              </Button>
              <Button 
                variant="ghost"
                onClick={() => router.push('/auth/login')}
              >
                התחברות
              </Button>
              <Button 
                onClick={handleGetStarted}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                התחל עכשיו
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
              🎯 מערכת תורים אולטרה־פשוטה
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              קבל בקשות תור<br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                בקלי קלות
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              לעצמאים קטנים: קוסמטיקאיות, פדיקוריסטיות, מורים פרטיים ומטפלים.
              <br />שלח קישור → קבל בקשה → אשר ידנית. פשוט כמו שצריך להיות.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg"
                onClick={handleGetStarted}
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4"
              >
                <ArrowRight className="w-5 h-5 ml-2" />
                התחל חינם
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => setPricingVisible(true)}
                className="text-lg px-8 py-4"
              >
                ראה תמחור
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>אלפי עצמאים</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>מאות תורים ביום</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span>4.9/5 ציון</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        {pricingVisible && (
          <section className="py-20 px-4 bg-white/50">
            <div className="container mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  תמחור פשוט ושקוף
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  בחר את התוכנית שמתאימה לך. התחל חינם ושדרג רק כשאתה מוכן.
                </p>
              </div>
              
              <PricingPlans onUpgrade={handleUpgrade} />
              
              <div className="text-center mt-12">
                <p className="text-gray-600 mb-4">
                  יש לך שאלות? אנחנו כאן לעזור
                </p>
                <Button variant="outline" size="lg">
                  <MessageSquare className="w-4 h-4 ml-2" />
                  צור קשר
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                למה לבחור במייטור?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                פתרון שתוכנן במיוחד לעצמאים שרוצים שליטה מלאה על התורים שלהם
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">שליטה מלאה</h3>
                <p className="text-gray-600">
                  הלקוח מבקש, אתה מאשר. אין הזמנות אוטומטיות בלי הסכמתך.
                </p>
              </Card>

              <Card className="text-center p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">פשוט להפליא</h3>
                <p className="text-gray-600">
                  קישור אחד → בחירת שעה → בקשת אישור. הכי פשוט שיש.
                </p>
              </Card>

              <Card className="text-center p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">ללא אפליקציה</h3>
                <p className="text-gray-600">
                  עובד מכל דפדפן, על כל מכשיר. אין צורך להוריד כלום.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                מה אומרים המשתמשים
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6 border-0 shadow-lg">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">
                  "סוף סוף מערכת שמבינה איך אני עובדת! פשוטה ויעילה."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <span className="text-pink-600 font-bold">ר</span>
                  </div>
                  <div>
                    <p className="font-semibold">רחל כהן</p>
                    <p className="text-gray-600 text-sm">קוסמטיקאית</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-lg">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">
                  "החיים שלי השתנו! כל התורים מאורגנים ואני שולט על הכל."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">ד</span>
                  </div>
                  <div>
                    <p className="font-semibold">דני לוי</p>
                    <p className="text-gray-600 text-sm">מטפל עיסוי</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-lg">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">
                  "הלקוחות שלי אוהבים כמה קל לבקש תור. גם אני!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">מ</span>
                  </div>
                  <div>
                    <p className="font-semibold">מיכל אברהם</p>
                    <p className="text-gray-600 text-sm">מורה פרטית</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">
              מוכן להתחיל?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              הצטרף לאלפי עצמאים שכבר משתמשים במייטור ומקבלים יותר תורים
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg"
                onClick={handleGetStarted}
                className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4"
              >
                <ArrowRight className="w-5 h-5 ml-2" />
                התחל חינם היום
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8 py-4"
                onClick={() => handleUpgrade('premium')}
              >
                <Crown className="w-5 h-5 ml-2" />
                שדרג לפרימיום
              </Button>
            </div>
            
            <p className="text-blue-200 text-sm">
              🎁 7 ימי ניסיון חינם לכל התוכניות • ביטול בכל עת
            </p>
          </div>
        </section>
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
                מערכת תורים פשוטה ויעילה לעצמאים בישראל
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">מוצר</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => setPricingVisible(true)} className="hover:text-white">תמחור</button></li>
                <li><a href="#features" className="hover:text-white">תכונות</a></li>
                <li><a href="#" className="hover:text-white">דוגמאות</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">תמיכה</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">מרכז עזרה</a></li>
                <li><a href="#" className="hover:text-white">צור קשר</a></li>
                <li><a href="#" className="hover:text-white">מדריכים</a></li>
                <li><a href="#" className="hover:text-white">סטטוס השירות</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">חוקי</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/privacy" className="hover:text-white">מדיניות פרטיות</a></li>
                <li><a href="/terms" className="hover:text-white">תנאי שימוש</a></li>
                <li><a href="#" className="hover:text-white">עוגיות</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; 2024 MyTor. כל הזכויות שמורות.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <p className="text-gray-400 text-sm">עשוי בישראל 🇮🇱</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
