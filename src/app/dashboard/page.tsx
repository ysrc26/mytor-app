// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { User, Business } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Plus,
  Building2,
  Users,
  BarChart,
  Crown,
  LogOut,
  ExternalLink,
  Settings,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function MainDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // טופס יצירת עסק חדש
  const [newBusiness, setNewBusiness] = useState({
    name: '',
    description: '',
    terms: ''
  });

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/auth/login');
      return;
    }

    await Promise.all([
      fetchUserData(),
      fetchBusinesses()
    ]);

    setLoading(false);
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();

        // הוספת הלוגיקה לתמונת גוגל
        const { data: { user: authUser } } = await supabase.auth.getUser();
        let profilePicUrl = data.user.profile_pic || '';

        // אם אין תמונה מותאמת אישית, נסה לקבל מGoogle
        if (!profilePicUrl && authUser?.user_metadata?.avatar_url) {
          profilePicUrl = authUser.user_metadata.avatar_url;
        }

        setUser({
          ...data.user,
          profile_pic: profilePicUrl
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('שגיאה בטעינת נתוני המשתמש');
    }
  };

  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/businesses');
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  };

  const createBusiness = async () => {
    if (!newBusiness.name.trim()) {
      setError('יש למלא שם עסק');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBusiness)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה ביצירת העסק');
      }

      setSuccess('עסק נוצר בהצלחה!');
      setDialogOpen(false);
      setNewBusiness({ name: '', description: '', terms: '' });
      await fetchBusinesses();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת העסק');
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // הסתרת הודעות אחרי זמן
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center" style={{ fontFamily: "'Heebo', 'Assistant', sans-serif", direction: 'rtl' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">טוען את הדשבורד...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isPremium = false; // TODO: בדיקת סטטוס premium
  const canCreateMore = isPremium || businesses.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" style={{ fontFamily: "'Heebo', 'Assistant', sans-serif", direction: 'rtl' }}>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-l from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                  MyTor
                </h1>
                <p className="text-sm text-gray-500 font-medium">ניהול עסקים</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/dashboard/profile')}
                  className="flex items-center gap-3 hover:bg-gray-50 rounded-xl p-2 transition-colors"
                >
                  {user.profile_pic ? (
                    <img
                      src={user.profile_pic}
                      alt={user.full_name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                      {user.full_name.charAt(0)}
                    </div>
                  )}
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                title="התנתק"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* הודעות */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">שלום {user.full_name}! 👋</h2>
          <p className="text-gray-600">נהל את כל העסקים שלך במקום אחד</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">עסקים פעילים</p>
                <p className="text-3xl font-bold text-blue-600">{businesses.filter(b => b.is_active).length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">סה"כ תורים</p>
                <p className="text-3xl font-bold text-green-600">0</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">לקוחות</p>
                <p className="text-3xl font-bold text-purple-600">0</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">חבילה</p>
                <p className="text-xl font-bold text-gray-600">{isPremium ? 'פרימיום' : 'חינם'}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPremium ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                <Crown className={`w-6 h-6 ${isPremium ? 'text-yellow-600' : 'text-gray-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* מערכת העסקים */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-gray-900">העסקים שלי</CardTitle>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={!canCreateMore}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    עסק חדש
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>יצירת עסק חדש</DialogTitle>
                    <DialogDescription>
                      הוסף עסק חדש למערכת ותתחיל לקבל תורים
                    </DialogDescription>
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
                        placeholder="שם העסק שלך"
                        required
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
                        placeholder="ספר על העסק שלך, השירותים שאתה מציע..."
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
                        disabled={creating}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {creating && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                        {creating ? 'יוצר...' : 'צור עסק'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {!canCreateMore && (
              <p className="text-sm text-gray-500">
                משתמשים חינמיים יכולים לנהל עסק אחד בלבד.
                <button className="text-blue-600 hover:text-blue-700 font-medium mr-1">
                  שדרג לפרימיום
                </button>
                לעסקים נוספים.
              </p>
            )}
          </CardHeader>

          <CardContent>
            {businesses.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">אין עסקים עדיין</h3>
                <p className="text-gray-600 mb-6">צור את העסק הראשון שלך והתחל לקבל תורים</p>
                <Button
                  onClick={() => setDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  צור עסק ראשון
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businesses.map((business) => (
                  <div key={business.id} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{business.name}</h3>
                        <p className="text-sm text-gray-500">mytor.app/{business.slug}</p>
                      </div>
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

        {/* פרימיום */}
        {!isPremium && (
          <Card className="mt-8 shadow-xl border-0 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">🚀 שדרג לפרימיום</h3>
                  <p className="text-blue-100 mb-4">עסקים מרובים, תורים ללא הגבלה, ועוד הרבה תכונות</p>
                  <ul className="text-sm text-blue-100 space-y-1">
                    <li>✓ עסקים ללא הגבלה</li>
                    <li>✓ תורים ללא הגבלה</li>
                    <li>✓ התראות SMS</li>
                    <li>✓ אנליטיקה מתקדמת</li>
                  </ul>
                </div>
                <div className="text-left">
                  <div className="text-3xl font-bold mb-2">₪9.90</div>
                  <div className="text-blue-100 text-sm mb-4">לחודש</div>
                  <Button className="bg-white text-blue-600 hover:bg-gray-100 font-bold">
                    שדרג עכשיו
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}