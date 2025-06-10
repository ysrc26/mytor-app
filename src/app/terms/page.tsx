// src/app/terms/page.tsx
import { Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
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
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-l from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
              תנאי השימוש
            </h1>
            <p className="text-xl text-gray-600 font-light">
              עדכון אחרון: 1 בינואר 2025
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border border-white/60">
            <div className="prose prose-lg max-w-none" style={{ direction: 'rtl' }}>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-6">1. הסכמה לתנאים</h2>
              <p className="text-gray-700 leading-relaxed mb-8">
                השימוש בשירותי MyTor מהווה הסכמה מלאה לתנאי השימוש המפורטים להלן. אם אינך מסכים לתנאים אלה, אנא הימנע משימוש בשירות.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">2. הגדרות</h2>
              <ul className="text-gray-700 leading-relaxed mb-8 space-y-2">
                <li><strong>"השירות"</strong> - מערכת MyTor לניהול תורים מקוונת</li>
                <li><strong>"המשתמש"</strong> - כל אדם או גוף העושה שימוש בשירות</li>
                <li><strong>"העסק"</strong> - בעל העסק הרשום במערכת</li>
                <li><strong>"הלקוח"</strong> - מי שמבקש תור דרך המערכת</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">3. השירות</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                MyTor מספקת פלטפורמה לניהול תורים המאפשרת לעסקים לקבל בקשות תורים מלקוחות ולנהל את לוח הזמנים שלהם. השירות כולל:
              </p>
              <ul className="text-gray-700 leading-relaxed mb-8 space-y-2 list-disc list-inside">
                <li>יצירת דף אישי לעסק</li>
                <li>ניהול זמינות ולוח זמנים</li>
                <li>קבלת בקשות תורים</li>
                <li>אישור או דחיית תורים</li>
                <li>התראות ועדכונים</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">4. רישום וחשבון משתמש</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                לשימוש בשירות נדרש רישום וחשבון משתמש. המשתמש מתחייב:
              </p>
              <ul className="text-gray-700 leading-relaxed mb-8 space-y-2 list-disc list-inside">
                <li>לספק מידע מדויק ועדכני</li>
                <li>לשמור על סודיות פרטי ההתחברות</li>
                <li>להודיע מיידית על שימוש לא מורשה בחשבון</li>
                <li>להשתמש בשירות בהתאם לחוק ולתנאים אלה</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">5. שימוש מורשה</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                המשתמש מתחייב לא לעשות שימוש בשירות למטרות:
              </p>
              <ul className="text-gray-700 leading-relaxed mb-8 space-y-2 list-disc list-inside">
                <li>לא חוקיות או מזיקות</li>
                <li>הטרדה או פגיעה באחרים</li>
                <li>הפרת זכויות יוצרים או קניין רוחני</li>
                <li>שיבוש פעילות השירות</li>
                <li>איסוף מידע על משתמשים אחרים ללא הסכמה</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">6. תשלומים ותמחור</h2>
              <p className="text-gray-700 leading-relaxed mb-8">
                השירות מוצע במודל freemium עם אפשרות שדרוג לגרסה בתשלום. התמחור מפורסם באתר ועשוי להשתנות בהודעה מראש של 30 יום. תשלומים אינם ניתנים להחזר אלא במקרים חריגים.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">7. פרטיות ומידע</h2>
              <p className="text-gray-700 leading-relaxed mb-8">
                השימוש במידע אישי כפוף למדיניות הפרטיות שלנו. אנו מתחייבים לשמור על פרטיות המשתמשים ולא לחשוף מידע לצדדים שלישיים ללא הסכמה מפורשת.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">8. אחריות והגבלות</h2>
              <p className="text-gray-700 leading-relaxed mb-8">
                השירות מסופק "כמו שהוא" ללא אחריות מפורשת או משתמעת. החברה לא תהיה אחראית לנזקים עקיפים, תוצאתיים או מיוחדים הנובעים משימוש בשירות.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">9. סיום השירות</h2>
              <p className="text-gray-700 leading-relaxed mb-8">
                אנו שומרים על הזכות להשעות או לסיים חשבונות משתמשים הפרים את תנאי השימוש. המשתמש יכול לבטל את חשבונו בכל עת דרך הגדרות החשבון.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">10. שינויים בתנאים</h2>
              <p className="text-gray-700 leading-relaxed mb-8">
                אנו שומרים על הזכות לעדכן תנאים אלה מעת לעת. שינויים מהותיים יפורסמו באתר עם הודעה מוקדמת של 15 יום לפחות.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">11. חוק החל ושיפוט</h2>
              <p className="text-gray-700 leading-relaxed mb-8">
                תנאים אלה כפופים לחוקי מדינת ישראל. כל מחלוקת תידון בבתי המשפט המוסמכים בישראל.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">12. יצירת קשר</h2>
              <p className="text-gray-700 leading-relaxed mb-8">
                לשאלות או הבהרות בנוגע לתנאי השימוש, ניתן לפנות אלינו במייל: 
                <a href="mailto:support@mytor.app" className="text-blue-600 hover:text-blue-700 font-medium">
                  support@mytor.app
                </a>
              </p>

            </div>
          </div>

          {/* Back to top */}
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