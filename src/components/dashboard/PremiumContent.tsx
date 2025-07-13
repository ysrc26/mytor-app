// src/components/dashboard/PremiumContent.tsx
'use client';

import { useState } from 'react';
import { 
  Crown, 
  Zap, 
  Star, 
  MessageSquare, 
  BarChart, 
  Palette, 
  Users, 
  Calendar, 
  CreditCard,
  Building2,
  TrendingUp,
  Headphones,
  FileText,
  CheckCircle,
  Clock,
  Settings,
  BarChart3
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdvancedAnalytics } from './AdvancedAnalytics';
import type { Appointment, Service, Business } from '@/lib/types';

// ===================================
// 🎯 Types
// ===================================

interface PremiumContentProps {
  subscriptionTier: string;
  limits: {
    appointments_used: number;
    appointments_limit: number;
    subscription_tier: string;
  } | null;
  upgradeSubscription: (tier: 'premium' | 'business') => void;
  businessId?: string;
  appointments?: Appointment[];
  services?: Service[];
  business?: Business;
}

// ===================================
// 🎯 Main Component
// ===================================

export const PremiumContent = ({ 
  subscriptionTier, 
  limits, 
  upgradeSubscription,
  businessId,
  appointments = [],
  services = [],
  business
}: PremiumContentProps) => {
  
  // בדיקה אם המשתמש פרימיום
  const isPremiumUser = subscriptionTier !== 'free';
  
  // אם אין נתוני limits, הצג loading או fallback
  if (!limits) {
    return (
      <div className="py-8 text-center">
        <div className="w-8 h-8 mx-auto mb-4 animate-spin border-2 border-blue-600 border-t-transparent rounded-full"></div>
        <p className="text-gray-600">טוען נתוני מנוי...</p>
      </div>
    );
  }
  
  return (
    <div className="py-8">
      {isPremiumUser ? (
        <PremiumFeaturesContent 
          subscriptionTier={subscriptionTier}
          limits={limits}
          upgradeSubscription={upgradeSubscription}
          businessId={businessId}
          appointments={appointments}
          services={services}
          business={business}
        />
      ) : (
        <UpgradeContent upgradeSubscription={upgradeSubscription} />
      )}
    </div>
  );
};

// ===================================
// 🎯 Premium Features Content
// ===================================

interface PremiumFeaturesContentProps {
  subscriptionTier: string;
  limits: {
    appointments_used: number;
    appointments_limit: number;
    subscription_tier: string;
  };
  upgradeSubscription: (tier: 'premium' | 'business') => void;
  businessId?: string;
  appointments?: Appointment[];
  services?: Service[];
  business?: Business;
}

const PremiumFeaturesContent = ({ 
  subscriptionTier, 
  limits, 
  upgradeSubscription,
  businessId,
  appointments = [],
  services = [],
  business
}: PremiumFeaturesContentProps) => {
  
  const [activeView, setActiveView] = useState<'overview' | 'analytics'>('overview');

  const getSubscriptionIcon = (tier: string) => {
    switch(tier) {
      case 'premium': return <Crown className="w-8 h-8 text-amber-500" />;
      case 'business': return <Zap className="w-8 h-8 text-blue-500" />;
      default: return <Star className="w-8 h-8 text-gray-500" />;
    }
  };

  const getTierLabel = (tier: string) => {
    switch(tier) {
      case 'premium': return 'פרימיום';
      case 'business': return 'עסקי';
      default: return 'חינם';
    }
  };

  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'premium': return 'from-amber-500 to-orange-500';
      case 'business': return 'from-blue-500 to-indigo-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  // ===================================
  // 🎯 Quick Actions Handlers
  // ===================================
  
  const handleSMSSettings = () => {
    console.log('Opening SMS settings modal');
    alert('הגדרות SMS יפתחו בקרוב...');
  };

  const handleReports = () => {
    console.log('Opening reports view');
    alert('דוחות יפתחו בקרוב...');
  };

  const handleSettings = () => {
    console.log('Opening settings modal');
    alert('הגדרות אישיות יפתחו בקרוב...');
  };

  const handleSupport = () => {
    const supportMessage = encodeURIComponent('שלום, אני צריך עזרה עם המערכת');
    const whatsappUrl = `https://wa.me/972501234567?text=${supportMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // פיצ'רים זמינים לפי רמת מנוי
  const availableFeatures = {
    premium: [
      { icon: MessageSquare, title: 'תזכורות SMS', desc: 'שליחת תזכורות אוטומטיות ללקוחות', status: 'active' },
      { icon: BarChart, title: 'דוחות בסיסיים', desc: 'סטטיסטיקות על התורים והלקוחות', status: 'active' },
      { icon: Palette, title: 'הסרת מיתוג', desc: 'הסרת לוגו MyTor מהעמוד שלך', status: 'active' },
      { icon: Users, title: 'ניהול לקוחות מתקדם', desc: 'שמירת פרטי לקוחות והיסטוריה', status: 'active' },
      { icon: Calendar, title: 'חיבור ליומן גוגל', desc: 'סנכרון אוטומטי עם גוגל קלנדר', status: 'coming_soon' },
      { icon: CreditCard, title: 'קבלת תשלומים', desc: 'אפשרות לקבל תשלום מראש', status: 'coming_soon' }
    ],
    business: [
      { icon: Building2, title: 'עסקים מרובים', desc: 'ניהול מספר עסקים מחשבון אחד', status: 'active' },
      { icon: TrendingUp, title: 'אנליטיקה מתקדמת', desc: 'ניתוח מעמיק של ביצועי העסק', status: 'active' },
      { icon: Headphones, title: 'תמיכה VIP', desc: 'תמיכה טכנית מועדפת', status: 'active' },
      { icon: Settings, title: 'הגדרות מתקדמות', desc: 'שליטה מלאה על פונקציונליות', status: 'active' },
      { icon: Zap, title: 'אינטגרציות', desc: 'חיבור למערכות חיצוניות', status: 'coming_soon' },
      { icon: FileText, title: 'דוחות מתקדמים', desc: 'ייצוא נתונים וניתוח מתקדם', status: 'active' }
    ]
  };

  const currentFeatures = subscriptionTier === 'business' 
    ? [...availableFeatures.premium, ...availableFeatures.business]
    : availableFeatures.premium;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* כותרת עם סטטוס מנוי */}
      <div className="text-center">
        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r ${getTierColor(subscriptionTier)} text-white mb-4`}>
          {getSubscriptionIcon(subscriptionTier)}
          <span className="text-lg font-bold">מנוי {getTierLabel(subscriptionTier)}</span>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          הפיצ'רים המתקדמים שלך
        </h2>
        <p className="text-gray-600">
          תהנה מכל התכונות הפרימיום שרכשת
        </p>
      </div>

      {/* Navigation Tabs - רק למשתמשי Business */}
      {subscriptionTier === 'business' && (
        <div className="flex justify-center">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeView === 'overview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                סקירה כללית
              </div>
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeView === 'analytics'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                אנליטיקה מתקדמת
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Content based on active view */}
      {activeView === 'analytics' && subscriptionTier === 'business' && businessId && business ? (
        <AdvancedAnalytics
          businessId={businessId}
          appointments={appointments}
          services={services}
          business={business}
        />
      ) : (
        <>
          {/* סטטיסטיקות מנוי */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">תורים בחודש</h3>
                <p className="text-2xl font-bold text-green-600">
                  {limits.appointments_used}/{limits.appointments_limit}
                </p>
                <p className="text-sm text-gray-500">
                  נותרו {limits.appointments_limit - limits.appointments_used}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">שיעור אישורים</h3>
                <p className="text-2xl font-bold text-blue-600">87%</p>
                <p className="text-sm text-gray-500">מהבקשות מאושרות</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">זמן מענה ממוצע</h3>
                <p className="text-2xl font-bold text-purple-600">24 דק'</p>
                <p className="text-sm text-gray-500">לאישור בקשות</p>
              </CardContent>
            </Card>
          </div>

          {/* רשימת פיצ'רים זמינים */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">הפיצ'רים שלך</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentFeatures.map((feature, index) => (
                <Card key={index} className={`
                  relative transition-all duration-200 
                  ${feature.status === 'active' ? 'shadow-md hover:shadow-lg' : 'opacity-60'}
                `}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`
                        w-12 h-12 rounded-lg flex items-center justify-center
                        ${feature.status === 'active' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                        }
                      `}>
                        <feature.icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                          {feature.status === 'active' && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                              פעיל
                            </Badge>
                          )}
                          {feature.status === 'coming_soon' && (
                            <Badge variant="outline" className="text-xs">
                              בקרוב
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{feature.desc}</p>
                      </div>
                      
                      {feature.status === 'active' && (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* קישורים מהירים לפיצ'רים */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4">פעולות מהירות</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex-col gap-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                onClick={handleSMSSettings}
              >
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">הגדר SMS</span>
                <span className="text-xs text-gray-500">תזכורות ללקוחות</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 flex-col gap-2 hover:bg-green-50 hover:border-green-200 transition-colors"
                onClick={handleReports}
              >
                <BarChart className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">דוחות</span>
                <span className="text-xs text-gray-500">סטטיסטיקות</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 flex-col gap-2 hover:bg-purple-50 hover:border-purple-200 transition-colors"
                onClick={handleSettings}
              >
                <Settings className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">הגדרות</span>
                <span className="text-xs text-gray-500">העדפות אישיות</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 flex-col gap-2 hover:bg-orange-50 hover:border-orange-200 transition-colors"
                onClick={handleSupport}
              >
                <Headphones className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium">תמיכה</span>
                <span className="text-xs text-gray-500">עזרה מיידית</span>
              </Button>
            </div>
          </div>

          {/* אנליטיקה מתקדמת - תזכורת לפרימיום */}
          {subscriptionTier === 'premium' && (
            <Card className="border-2 border-gradient-to-r from-purple-200 to-blue-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    אנליטיקה מתקדמת זמינה במנוי עסקי
                  </h3>
                  <p className="text-gray-600 mb-4">
                    קבל תובנות מעמיקות על העסק שלך: תחזיות, ניתוח לקוחות, המלצות לשיפור ועוד
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {[
                      'תחזיות AI',
                      'ניתוח רווחיות',
                      'מעקב לקוחות',
                      'אופטימיזציה',
                      'דוחות מתקדמים'
                    ].map((feature, index) => (
                      <Badge key={index} variant="secondary" className="bg-white/80">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    onClick={() => upgradeSubscription('business')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3"
                  >
                    שדרג למנוי עסקי - ₪99/חודש
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* שדרוג למנוי גבוה יותר - לפרימיום */}
          {subscriptionTier === 'premium' && (
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      שדרג למנוי עסקי
                    </h3>
                    <p className="text-gray-600 mb-3">
                      קבל גישה לעסקים מרובים, אנליטיקה מתקדמת ותמיכה VIP
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>✓ עסקים ללא הגבלה</li>
                      <li>✓ 1000 תורים בחודש</li>
                      <li>✓ דוחות מתקדמים</li>
                      <li>✓ תמיכה VIP</li>
                    </ul>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">₪99</div>
                    <div className="text-sm text-gray-500 mb-4">לחודש</div>
                    <Button 
                      onClick={() => upgradeSubscription('business')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      שדרג עכשיו
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* הערות כלליות */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          יש לך שאלות על המנוי שלך? 
          <button className="text-blue-600 hover:underline ml-1">צור קשר עם התמיכה</button>
        </p>
      </div>
    </div>
  );
};

// ===================================
// 🎯 Upgrade Content for Free Users
// ===================================

interface UpgradeContentProps {
  upgradeSubscription: (tier: 'premium' | 'business') => void;
}

const UpgradeContent = ({ upgradeSubscription }: UpgradeContentProps) => {
  return (
    <div className="text-center py-12 max-w-2xl mx-auto">
      <div className="w-16 h-16 mx-auto mb-6">
        <div className="w-full h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
          <Crown className="w-8 h-8 text-white" />
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        שדרג לפרימיום
      </h3>
      
      <p className="text-lg text-gray-600 mb-8">
        קבל גישה לתכונות מתקדמות: תזכורות SMS, דוחות מפורטים, הסרת מיתוג ועוד
      </p>

      {/* תכונות עיקריות */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[
          { icon: MessageSquare, title: 'תזכורות SMS', desc: 'הקטן no-shows עם תזכורות אוטומטיות' },
          { icon: BarChart, title: 'דוחות מתקדמים', desc: 'בין איך העסק שלך מתפתח' },
          { icon: Palette, title: 'הסרת מיתוג', desc: 'העמוד שלך ללא לוגו MyTor' },
          { icon: Crown, title: 'תמיכה מועדפת', desc: 'קבל עזרה מהירה ומקצועית' }
        ].map((feature, index) => (
          <div key={index} className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center">
              <feature.icon className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
            <p className="text-sm text-gray-600">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* מחירים */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-8 mb-6">
        <div className="text-4xl font-bold mb-2">₪29</div>
        <div className="text-amber-100 mb-4">לחודש</div>
        <Button 
          onClick={() => upgradeSubscription('premium')}
          className="bg-white text-amber-600 hover:bg-gray-100 font-bold px-8 py-3"
        >
          שדרג עכשיו
        </Button>
        <p className="text-sm text-amber-100 mt-4">
          ניסיון חינם ל-14 יום • ביטול בכל עת
        </p>
      </div>

      {/* שאלות נפוצות */}
      <div className="text-xs text-gray-500">
        <p>יש שאלות? <span className="text-blue-600 cursor-pointer hover:underline">צור קשר איתנו</span></p>
      </div>
    </div>
  );
};