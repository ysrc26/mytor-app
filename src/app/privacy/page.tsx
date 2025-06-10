// src/app/privacy/page.tsx
import { Calendar, ArrowRight, Shield, Eye, Lock, Users } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" style={{ fontFamily: "'Heebo', 'Assistant', sans-serif", direction: 'rtl' }}>
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/90 border-b border-gray-200/50 shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-l from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                  MyTor
                </h1>
                <p className="text-sm text-gray-500 font-medium">מערכת תורים חכמה</p>
              </div>
            </Link>
            
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowRight className="w-4 h-4" />
              <span>חזרה לדף הבית</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-8">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center shadow-xl shadow-green-500/30">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-l from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
              מדיניות פרטיות
            </h1>
            <p className="text-xl text-gray-600 font-light">
              אנחנו מתחייבים לשמור על הפרטיות שלך
            </p>
            <p className="text-lg text-gray-500 mt-2">
              עדכון אחרון: 1 בינואר 2025
            </p>
          </div>

          {/* Privacy principles */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <Lock className="w-6 h-6 text-white" />,
                title: "הצפנה מלאה",
                description: "כל הנתונים מוצפנים בדרכים המתקדמות ביותר",
                gradient: "from-blue-500 to-indigo-500"
              },
              {
                icon: <Eye className="w-6 h-6 text-white" />,
                title: "שקיפות מלאה",
                description: "אתה יודע בדיוק איך אנחנו משתמשים במידע שלך",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: <Users className="w-6 h-6 text-white" />,
                title: "ללא מכירה לצד שלישי",
                description: "המידע שלך נשאר אצלנו ולא נמכר לאף אחד",
                gradient: "from-purple-500 to-pink-500"
              }
            ].map((principle, index) => (
              <div key={index} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className={`w-12 h-12 bg-gradient-to-br ${principle.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                  {principle.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{principle.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{principle.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border border-white/60">
            <div className="prose prose-lg max-w-none" style={{ direction: 'rtl' }}>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-6">1. מידע שאנחנו אוספים</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-4">מידע שאתה מספק לנו:</h3>
              <ul className="text-gray-700 leading-relaxed mb-6 space-y-2 list-disc list-inside">
                <li><strong>פרטי רישום:</strong> שם, כתובת מייל, מספר טלפון</li>
                <li><strong>פרטי עסק:</strong> שם העסק, תיאור, שעות פעילות</li>
                <li><strong>תמונות:</strong> תמונת פרופיל (אופציונלי)</li>
                <li><strong>תוכן:</strong> הגדרות זמינות, תנאי שירות אישיים</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-4">מידע שנאסף אוטומטית:</h3>
              <ul className="text-gray-700 leading-relaxed mb-8 space-y-2 list-disc list-inside">
                <li><strong>נתוני שימוש:</strong> איך ומתי אתה משתמש בשירות</li>
                <li><strong>מידע טכני:</strong> כתובת IP, סוג דפדפן, מערכת הפעלה</li>
                <li><strong>עוגיות:</strong> לשיפור חוויית השימוש והתאמה אישית</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">2. איך אנחנו משתמשים במידע</h2>
              <ul className="text-gray-700 leading-relaxed mb-8 space-y-2 list-disc list-inside">
                <li><strong>הפעלת השירות:</strong> ניהול חשבונך ומתן השירותים</li>
                <li><strong>תקשורת:</strong> שליחת התראות על תורים וחשיבויות חשבון</li>
                <li><strong>שיפור השירות:</strong> ניתוח שימוש לפיתוח תכונות חדשות</li>
                <li><strong>אבטחה:</strong> זיהוי ומניעת שימוש לא מורשה</li>
                <li><strong>תמיכה:</strong> מתן עזרה ותמיכה טכנית</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">3. שיתוף מידע עם צדדים שלישיים</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                אנחנו <strong>לא מוכרים או משתפים</strong> את המידע האישי שלך עם חברות אחרות למטרות שיווק. 
                המידע שלך עשוי להישתף רק במקרים הבאים:
              </p>
              <ul className="text-gray-700 leading-relaxed mb-8 space-y-2 list-disc list-inside">
                <li><strong>ספקי שירות:</strong> חברות שעוזרות לנו להפעיל את השירות (הוסטינג, אנליטיקה)</li>
                <li><strong>דרישה חוקית:</strong> כאשר נדרש על פי חוק או צו בית משפט</li>
                <li><strong>בטיחות:</strong> להגנה על הבטיחות שלנו ושל המשתמשים</li>
                <li><strong>העברת עסק:</strong> במקרה של מכירה או מיזוג (בהודעה מוקדמת)</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">4. אבטחת המידע</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                אנחנו נוקטים אמצעי אבטחה מתקדמים כדי להגן על המידע שלך:
              </p>
              <ul className="text-gray-700 leading-relaxed mb-8 space-y-2 list-disc list-inside">
                <li><strong>הצפנה:</strong> כל הנתונים מוצפנים במעבר ובמנוחה</li>
                <li><strong>גישה מוגבלת:</strong> רק עובדים מורשים יכולים לגשת למידע</li>
                <li><strong>ניטור:</strong> מעקב מתמיד אחר פעילות חשודה</li>
                <li><strong>גיבויים:</strong> גיבוי קבוע והגנה מפני אובדן מידע</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">5. הזכויות שלך</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                כמשתמש, יש לך זכויות הבאות לגבי המידע האישי שלך:
              </p>
              <ul className="text-gray-700 leading-relaxed mb-8 space-y-2 list-disc list-inside">
                <li><strong>צפייה:</strong> לראות איזה מידע אצור עליך</li>
                <li><strong>תיקון:</strong> לתקן מידע לא מדויק</li>
                <li><strong>מחיקה:</strong> לבקש מחיקת המידע שלך</li>
                <li><strong>הגבלה:</strong> להגביל את השימוש במידע</li>
                <li><strong>ניידות:</strong> לקבל את המידע שלך בפורמט מובנה</li>
                <li><strong>התנגדות:</strong> להתנגד לעיבוד מסוים של המידע</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">6. שמירת מידע</h2>
              <p className="text-gray-700 leading-relaxed mb-8">
                אנחנו שומרים את המידע שלך כל עוד החשבון פעיל או כפי שנדרש לצורך מתן השירות. 
                לאחר מחיקת החשבון, המידע יימחק תוך 30 יום, למעט מידע שנדרש לשמור על פי חוק.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">7. עוגיות (Cookies)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                אנחנו משתמשים בעוגיות לשיפור חוויית השימוש:
              </p>
              <ul className="text-gray-700 leading-relaxed mb-8 space-y-2 list-disc list-inside">
                <li><strong>עוגיות הכרחיות:</strong> לפעילות בסיסית של האתר</li>
                <li><strong>עוגיות ביצועים:</strong> לניתוח שימוש ושיפור השירות</li>
                <li><strong>עוגיות העדפות:</strong> לזכירת ההגדרות שלך</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">8. שינויים במדיניות</h2>
              <p className="text-gray-700 leading-relaxed mb-8">
                אנחנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יפורסמו באתר עם הודעה מוקדמת של 30 יום. 
                המשך השימוש בשירות לאחר השינויים מהווה הסכמה למדיניות המעודכנת.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">9. פרטיות קטינים</h2>
              <p className="text-gray-700 leading-relaxed mb-8">
                השירות מיועד לבני 16 ומעלה. איננו אוספים מידע מקטינים מתחת לגיל 16 במודע. 
                אם נתגלה כי נאסף מידע כזה, נמחק אותו מיידית.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">10. יצירת קשר ושאלות</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                יש לך שאלות על מדיניות הפרטיות או רוצה לממש את הזכויות שלך? 
                אנחנו כאן לעזור:
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <p className="text-gray-700 leading-relaxed">
                  <strong>מייל:</strong> <a href="mailto:privacy@mytor.app" className="text-blue-600 hover:text-blue-700 font-medium">privacy@mytor.app</a><br />
                  <strong>טלפון:</strong> 03-1234567<br />
                  <strong>כתובת:</strong> רחוב הרצל 123, תל אביב
                </p>
                <p className="text-sm text-gray-600 mt-4">
                  אנחנו מתחייבים להשיב תוך 48 שעות בימי עבודה
                </p>
              </div>

            </div>
          </div>

          {/* Back to home */}
          <div className="text-center mt-12">
            <Link 
              href="/"
              className="inline-flex items-center gap-3 bg-gradient-to-l from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <ArrowRight className="w-5 h-5" />
              חזרה לדף הבית
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}