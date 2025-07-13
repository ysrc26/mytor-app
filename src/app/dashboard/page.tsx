// ===================================
// 📊 src/app/dashboard/page.tsx (עדכון עם מערכת מנויים)
// ===================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Building2, Calendar, Users, Crown, Settings, ExternalLink, AlertTriangle } from 'lucide-react';
import SubscriptionStatus from '@/components/subscription/SubscriptionStatus';
import UpgradeButton from '@/components/subscription/UpgradeButton';
import LimitReachedModal from '@/components/subscription/LimitReachedModal';
import { useSubscription } from '@/hooks/useSubscription';
import { Business } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { subscription, isPremium, checkLimit } = useSubscription();
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitType, setLimitType] = useState<'businesses' | 'appointments' | 'sms'>('businesses');
  
  const [newBusiness, setNewBusiness] = useState({
    name: '',
    description: '',
    terms: ''
  });

  // בדיקה האם המשתמש יכול ליצור עסק נוסף
  const canCreateMore = businesses.length < (isPremium ? 
    (subscription?.subscription_tier === 'business' ? Infinity : 3) : 1);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/businesses');
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBusiness = async () => {
    // בדיקת מגבלה לפני יצירה
    const limitCheck = await checkLimit('create_business');
    if (!limitCheck.allowed) {
      setLimitType('businesses');
      setLimitModalOpen(true);
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBusiness)
      });

      if (response.ok) {
        const business = await response.json();
        setBusinesses([...businesses, business]);
        setNewBusiness({ name: '', description: '', terms: '' });
        setDialogOpen(false);
      } else {
        const errorData = await response.json();
        if (errorData.limit_reached) {
          setLimitType('businesses');
          setLimitModalOpen(true);
        }
      }
    } catch (error) {
      console.error('Error creating business:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleUpgrade = async () => {
    setLimitModalOpen(false);
    
    const response = await fetch('/api/subscriptions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'premium' })
    });

    const data = await response.json();
    
    if (response.ok && data.url) {
      window.location.href = data.url;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              שלום! 👋
            </h1>
            <p className="text-gray-600">נהל את כל העסקים שלך במקום אחד</p>
          </div>
          
          <div className="flex items-center gap-4">
            {isPremium && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <Crown className="w-4 h-4 ml-1" />
                {subscription?.subscription_tier === 'business' ? 'עסקי' : 'פרימיום'}
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={() => router.push('/auth/logout')}
            >
              התנתק
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">עסקים פעילים</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {businesses.filter(b => b.is_active).length}
                      </p>
                    </div>
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">תורים החודש</p>
                      <p className="text-3xl font-bold text-green-600">
                        {subscription?.monthly_appointments_used || 0}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">מגבלה חודשית</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {subscription?.monthly_limit || 10}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Usage Warning */}
            {subscription && subscription.monthly_appointments_used >= subscription.monthly_limit * 0.8 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <div className="flex-1">
                      <p className="font-medium text-orange-900">
                        אתה מתקרב למגבלת התורים החודשית
                      </p>
                      <p className="text-sm text-orange-700">
                        השתמשת ב-{subscription.monthly_appointments_used} מתוך {subscription.monthly_limit} תורים
                      </p>
                    </div>
                    {!isPremium && (
                      <UpgradeButton size="sm" variant="outline">
                        שדרג עכשיו
                      </UpgradeButton>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Businesses List */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    העסקים שלי
                  </CardTitle>
                  
                  <Button
                    onClick={() => {
                      if (canCreateMore) {
                        setDialogOpen(true);
                      } else {
                        setLimitType('businesses');
                        setLimitModalOpen(true);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!canCreateMore && !isPremium}
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    עסק חדש
                  </Button>
                </div>

                {!canCreateMore && !isPremium && (
                  <p className="text-sm text-gray-500">
                    משתמשים חינמיים יכולים לנהל עסק אחד בלבד.
                    <UpgradeButton variant="ghost" size="sm" className="p-0 h-auto font-medium text-blue-600 hover:text-blue-700 mr-1">
                      שדרג לפרימיום
                    </UpgradeButton>
                    לעסקים נוספים.
                  </p>
                )}
              </CardHeader>

              <CardContent>
                {businesses.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      עדיין אין לך עסקים
                    </h3>
                    <p className="text-gray-600 mb-6">
                      צור את העסק הראשון שלך והתחל לקבל תורים
                    </p>
                    <Button 
                      onClick={() => setDialogOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      צור עסק ראשון
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {businesses.map((business) => (
                      <div key={business.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-lg">{business.name}</h4>
                          <div className={`w-3 h-3 rounded-full ${business.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        </div>

                        {business.description && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{business.description}</p>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={() => router.push(`/dashboard/business/${business.id}`)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                          >
                            <Settings className="w-4 h-4 ml-1" />
                            נהל
                          </Button>
                          <Button
                            onClick={() => window.open(`/${business.slug}`, '_blank')}
                            variant="outline"
                            className="text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription Status */}
            <SubscriptionStatus onUpgrade={handleUpgrade} />

            {/* Upgrade CTA for Free Users */}
            {!isPremium && (
              <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Crown className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
                    <h3 className="text-xl font-bold mb-2">🚀 שדרג לפרימיום</h3>
                    <p className="text-blue-100 mb-4 text-sm">
                      עסקים מרובים, תורים ללא הגבלה, ועוד הרבה תכונות
                    </p>
                    <ul className="text-sm text-blue-100 space-y-1 mb-6 text-right">
                      <li>✓ עד 3 עסקים</li>
                      <li>✓ 100 תורים בחודש</li>
                      <li>✓ SMS התראות</li>
                      <li>✓ הסרת מיתוג</li>
                      <li>✓ דוחות מתקדמים</li>
                    </ul>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">₪19.90</div>
                      <div className="text-blue-100 text-sm">לחודש</div>
                      <UpgradeButton 
                        className="w-full bg-white text-blue-600 hover:bg-gray-100 font-bold"
                        variant="outline"
                      >
                        שדרג עכשיו
                      </UpgradeButton>
                      <p className="text-xs text-blue-200">
                        🎁 7 ימי ניסיון חינם
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">קישורים מהירים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push('/pricing')}
                >
                  📋 תמחור ותוכניות
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push('/support')}
                >
                  💬 תמיכה ועזרה
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => window.open('https://docs.mytor.app', '_blank')}
                >
                  📚 מדריך למשתמש
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Business Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>צור עסק חדש</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="business-name">שם העסק *</Label>
              <Input
                id="business-name"
                value={newBusiness.name}
                onChange={(e) => setNewBusiness({
                  ...newBusiness,
                  name: e.target.value
                })}
                placeholder="למשל: סלון יופי רחל"
              />
            </div>

            <div>
              <Label htmlFor="business-description">תיאור העסק</Label>
              <Textarea
                id="business-description"
                value={newBusiness.description}
                onChange={(e) => setNewBusiness({
                  ...newBusiness,
                  description: e.target.value
                })}
                placeholder="תיאור קצר על העסק שלך"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="business-terms">תנאי שירות</Label>
              <Textarea
                id="business-terms"
                value={newBusiness.terms}
                onChange={(e) => setNewBusiness({
                  ...newBusiness,
                  terms: e.target.value
                })}
                placeholder="תנאי ביטול, מדיניות תשלום וכו'"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                ביטול
              </Button>
              <Button
                onClick={createBusiness}
                disabled={creating || !newBusiness.name}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                {creating ? 'יוצר...' : 'צור עסק'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Limit Reached Modal */}
      <LimitReachedModal
        isOpen={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        onUpgrade={handleUpgrade}
        limitType={limitType}
        currentCount={subscription?.monthly_appointments_used}
        maxCount={subscription?.monthly_limit}
      />
    </div>
  );
}