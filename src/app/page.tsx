// src/app/page.tsx
'use client';
import { Calendar, Check, Clock, Phone, ArrowLeft, Sparkles, Shield, Zap, Play } from 'lucide-react';
import PricingPlans from '@/components/pricing/PricingPlans';
import { useState } from 'react';

export default function BeautifulHomepage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" style={{ fontFamily: "'Heebo', 'Assistant', sans-serif", direction: 'rtl' }}>
      {/* Heebo Font Import */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');
      `}</style>

      {/* Header - Glass morphism */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/90 border-b border-gray-200/50 shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-110">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-l from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                  MyTor
                </h1>
                <p className="text-sm text-gray-500 font-medium">מערכת תורים חכמה</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.href = '/auth/login'}
                className="text-gray-600 hover:text-gray-900 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:bg-gray-50"
              >
                התחברות
              </button>
              <button
                onClick={() => window.location.href = '/auth/signup'}
                className="group relative overflow-hidden bg-gradient-to-l from-blue-600 via-blue-700 to-indigo-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-l from-blue-500 via-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  הרשמה חינם
                </span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-l from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-x-full group-hover:translate-x-[-200%] skew-x-12"></div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-8 text-center">
          {/* Announcement Badge */}
          <div className="inline-flex items-center gap-3 bg-gradient-to-l from-blue-50 to-indigo-50 border border-blue-200/60 text-blue-700 px-6 py-3 rounded-full text-sm font-semibold mb-8 shadow-lg shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-100/80 transition-all duration-300 cursor-pointer">
            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
            <span>חדש! מערכת תורים מהפכנית ופשוטה</span>
            <Sparkles className="w-4 h-4" />
          </div>

          {/* Main Headline */}
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-black mb-8 leading-tight">
            <span className="block bg-gradient-to-l from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent hover:from-gray-800 hover:to-gray-900 transition-all duration-500">
              תורים
            </span>
            <span className="block bg-gradient-to-l from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-500 hover:to-purple-500 transition-all duration-500">
              פשוטים
            </span>
            <span className="block text-6xl md:text-7xl text-gray-600 font-bold">
              לעצמאים חכמים
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-2xl md:text-3xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
            המערכת הכי אלגנטית ופשוטה לניהול תורים בישראל.
            <br />
            <span className="font-semibold bg-gradient-to-l from-gray-800 to-gray-600 bg-clip-text text-transparent">
              אתה שולט, הלקוח מבקש - בדיוק כמו שצריך!
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <button
              onClick={() => window.location.href = '/auth/signup'}
              className="group relative overflow-hidden bg-gradient-to-l from-blue-600 via-blue-700 to-indigo-700 text-white px-12 py-6 rounded-3xl text-2xl font-black shadow-2xl shadow-blue-500/30 hover:shadow-3xl hover:shadow-blue-500/50 transition-all duration-500 transform hover:-translate-y-2 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-l from-blue-500 via-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center gap-4">
                התחל עכשיו בחינם
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-2 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-l from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-x-full group-hover:translate-x-[-200%] skew-x-12"></div>
            </button>

            <button
              onClick={() => window.location.href = '/demo'}
              className="group relative bg-white/90 backdrop-blur-sm border-2 border-gray-200/60 text-gray-700 px-12 py-6 rounded-3xl text-2xl font-bold hover:border-blue-300/60 hover:text-blue-600 hover:bg-white transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              <span className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-l from-gray-400 to-gray-500 flex items-center justify-center group-hover:from-blue-500 group-hover:to-indigo-500 transition-all duration-300">
                  <Play className="w-4 h-4 text-white mr-0.5" />
                </div>
                צפה בדמו חי
              </span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-base text-gray-500">
            {[
              { icon: <Shield className="w-5 h-5" />, text: "בחינם עד 10 תורים", color: "from-green-500 to-emerald-500" },
              { icon: <Zap className="w-5 h-5" />, text: "ללא התחייבות", color: "from-blue-500 to-indigo-500" },
              { icon: <Check className="w-5 h-5" />, text: "תמיכה בעברית", color: "from-purple-500 to-pink-500" }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 hover:text-gray-700 transition-colors duration-200 cursor-pointer">
                <div className={`w-4 h-4 bg-gradient-to-r ${item.color} rounded-full shadow-lg animate-pulse`}></div>
                <span className="font-semibold">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      
       {/* Pricing Section */}
      <section className="py-32 relative bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-8">
          <PricingPlans />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-24">
            <h2 className="text-6xl md:text-7xl font-black bg-gradient-to-l from-gray-900 to-gray-700 bg-clip-text text-transparent mb-8">
              למה אלפי עצמאים
              <br />
              בוחרים ב-MyTor?
            </h2>
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto font-light leading-relaxed">
              כי אנחנו מבינים שלעצמאים צריך פתרון שפשוט עובד, בלי סיבוכים מיותרים
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {[
              {
                icon: <Check className="w-10 h-10 text-white" />,
                gradient: "from-green-500 via-emerald-500 to-teal-500",
                title: "שליטה מלאה בידיך",
                description: "הלקוח מבקש, אתה מחליט. אין יותר הפתעות או תורים לא רצויים. כל בקשה עוברת דרכך לאישור ואתה קובע את הכללים.",
                highlight: "אתה המנהל!",
                highlightColor: "from-green-500 to-emerald-500"
              },
              {
                icon: <Clock className="w-10 h-10 text-white" />,
                gradient: "from-blue-500 via-indigo-500 to-purple-500",
                title: "פשטות מקסימלית",
                description: "לא צריך לשבת שעות על מדריכים או הדרכות. 5 דקות והכל מוכן! הלקוחות שלך יאהבו כמה קל להזמין תור איתך.",
                highlight: "מוכן תוך 5 דקות",
                highlightColor: "from-blue-500 to-indigo-500"
              },
              {
                icon: <Phone className="w-10 h-10 text-white" />,
                gradient: "from-purple-500 via-pink-500 to-rose-500",
                title: "התראות חכמות",
                description: "קבל הודעות מיידיות על כל בקשת תור חדשה. באימייל, SMS או וואטסאפ - איך שהכי נוח לך לעבוד.",
                highlight: "תמיד מעודכן",
                highlightColor: "from-purple-500 to-pink-500"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative"
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-all duration-500`}></div>
                <div className={`relative bg-white/95 backdrop-blur-sm p-10 rounded-3xl border border-white/60 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 ${hoveredCard === index ? 'border-white/80 scale-105' : ''}`}>
                  <div className={`w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-3xl flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    {feature.icon}
                  </div>

                  <h3 className="text-3xl font-black text-gray-900 mb-6 group-hover:text-blue-600 transition-colors duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed mb-8 font-light text-lg">
                    {feature.description}
                  </p>

                  <div className="inline-flex items-center gap-3 bg-gradient-to-l from-gray-50 to-blue-50 border border-blue-100 text-blue-700 px-5 py-3 rounded-full font-bold shadow-lg">
                    <div className={`w-3 h-3 bg-gradient-to-r ${feature.highlightColor} rounded-full animate-pulse`}></div>
                    <span>{feature.highlight}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 bg-gradient-to-br from-gray-50/80 via-white to-blue-50/50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-24">
            <h2 className="text-6xl md:text-7xl font-black bg-gradient-to-l from-gray-900 to-gray-700 bg-clip-text text-transparent mb-8">
              איך זה עובד?
              <br />
              פשוט כמו 1-2-3-4
            </h2>
            <p className="text-2xl text-gray-600 font-light leading-relaxed">
              4 צעדים פשוטים ואתה מוכן לקבל תורים בצורה המקצועית ביותר
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-10">
            {[
              {
                step: "01",
                title: "הירשם חינם",
                description: "הרשמה של 30 שניות עם הפרטים הבסיסיים שלך. ללא כרטיס אשראי או התחייבות.",
                icon: "👋",
                gradient: "from-blue-500 to-indigo-500"
              },
              {
                step: "02",
                title: "הגדר זמינות",
                description: "בחר את הימים והשעות שאתה זמין לקבל לקוחות. פשוט וגמיש.",
                icon: "📅",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                step: "03",
                title: "שתף קישור",
                description: "שלח ללקוחות את הקישור הייחודי שלך בוואטסאפ או ברשתות חברתיות.",
                icon: "🔗",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                step: "04",
                title: "אשר תורים",
                description: "קבל בקשות ואשר או דחה בלחיצה אחת. פשוט, מהיר וחכם!",
                icon: "✅",
                gradient: "from-orange-500 to-red-500"
              }
            ].map((step, index) => (
              <div key={index} className="group relative text-center">
                <div className="relative">
                  <div className={`inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br ${step.gradient} text-white rounded-3xl text-3xl font-black mb-8 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                    {step.step}
                  </div>
                  <div className="absolute -top-3 -right-3 text-5xl transform group-hover:scale-125 transition-transform duration-300">
                    {step.icon}
                  </div>
                </div>

                <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                  {step.title}
                </h3>

                <p className="text-gray-600 leading-relaxed font-light text-lg">
                  {step.description}
                </p>

                {/* Connection line */}
                {index < 3 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-1 bg-gradient-to-l from-gray-200 to-transparent transform translate-x-6"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-600 via-indigo-700 to-purple-800"></div>
        <div className="absolute inset-0 bg-black/30"></div>

        {/* Animated background elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="relative max-w-5xl mx-auto px-8 text-center">
          <h2 className="text-6xl md:text-8xl font-black text-white mb-8 leading-tight">
            מוכן להתחיל
            <br />
            את המהפכה?
          </h2>

          <p className="text-2xl md:text-3xl text-blue-100 mb-12 leading-relaxed font-light">
            הצטרף לאלפי עצמאים שכבר גילו איך לנהל תורים בצורה החכמה ביותר.
            <br />
            <span className="font-bold text-white">ההרשמה חינמית ואין התחייבות!</span>
          </p>

          <button
            onClick={() => window.location.href = '/auth/signup'}
            className="group relative overflow-hidden bg-white text-blue-700 px-16 py-8 rounded-3xl text-3xl font-black hover:bg-gray-50 transition-all duration-500 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 active:scale-95 inline-flex items-center gap-6"
          >
            <span>התחל עכשיו חינם</span>
            <ArrowLeft className="w-8 h-8 group-hover:-translate-x-2 transition-transform duration-300" />
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-l from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-x-full group-hover:translate-x-[-200%] skew-x-12"></div>
          </button>

          <div className="mt-12 flex justify-center items-center gap-12 text-blue-200">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6" />
              <span className="text-lg font-semibold">ללא כרטיס אשראי</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6" />
              <span className="text-lg font-semibold">מוכן תוך דקות</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇮🇱</span>
              <span className="text-lg font-semibold">תמיכה בעברית</span>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="icon-container bg-gradient-to-br from-blue-500 to-indigo-600 shadow-glow-blue w-10 h-10">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold-heebo">MyTor</h3>
              </div>
              <p className="text-gray-400 leading-relaxed font-light-heebo">
                מערכת תורים חכמה ופשוטה לעצמאים בישראל.
                בנויה עם ❤️ במיוחד עבורכם.
              </p>
            </div>

            {[
              {
                title: "מוצר",
                links: ["איך זה עובד", "תמחור", "דמו חי", "מדריך למתחילים"]
              },
              {
                title: "תמיכה",
                links: ["מרכז עזרה", "שאלות נפוצות", "צור קשר", "דווח על בעיה"]
              },
              {
                title: "חברה",
                links: ["אודותינו", "תנאי שימוש", "מדיניות פרטיות", "בלוג"]
              }
            ].map((section, index) => (
              <div key={index}>
                <h4 className="font-semibold-heebo text-gray-300 mb-4">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 font-light-heebo hover:translate-x-1 transform inline-block">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 font-light-heebo">
              &copy; 2025 MyTor. כל הזכויות שמורות. עשוי בישראל 🇮🇱
            </p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <span className="text-gray-500 text-sm font-medium-heebo">Follow us:</span>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gray-700 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors duration-200 cursor-pointer hover-lift">
                  <span className="text-xs">📘</span>
                </div>
                <div className="w-8 h-8 bg-gray-700 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors duration-200 cursor-pointer hover-lift">
                  <span className="text-xs">📷</span>
                </div>
                <div className="w-8 h-8 bg-gray-700 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors duration-200 cursor-pointer hover-lift">
                  <span className="text-xs">💬</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}