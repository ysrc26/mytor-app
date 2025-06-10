// src/app/dashboard/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  ArrowLeft,
  LogOut,
  Save,
  Upload,
  User as UserIcon,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  X
} from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // עריכת פרטים
  const [editedUser, setEditedUser] = useState({
    full_name: '',
    phone: '',
    profile_pic: ''
  });

  // טעינת תמונה
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    await fetchUserData();
    setLoading(false);
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setEditedUser({
          full_name: data.user.full_name,
          phone: data.user.phone,
          profile_pic: data.user.profile_pic || ''
        });
        setPreviewUrl(data.user.profile_pic || null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('שגיאה בטעינת נתוני המשתמש');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // בדיקת סוג קובץ
    if (!file.type.startsWith('image/')) {
      setError('יש לבחור קובץ תמונה בלבד');
      return;
    }

    // בדיקת גודל (מקסימום 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('גודל התמונה לא יכול לעלות על 5MB');
      return;
    }

    setSelectedFile(file);
    
    // יצירת תצוגה מקדימה
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    setUploading(true);
    try {
      // יצירת שם קובץ ייחודי
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `profile_${user?.id}_${Date.now()}.${fileExt}`;

      // העלאה ל-Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, selectedFile);

      if (error) {
        throw error;
      }

      // קבלת URL ציבורי
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      return publicUrl;

    } catch (error) {
      console.error('Upload error:', error);
      setError('שגיאה בהעלאת התמונה');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!editedUser.full_name.trim()) {
      setError('יש למלא שם מלא');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let profilePicUrl = editedUser.profile_pic;

      // העלאת תמונה חדשה אם נבחרה
      if (selectedFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          profilePicUrl = uploadedUrl;
        } else {
          return; // שגיאה בהעלאה
        }
      }

      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editedUser.full_name,
          phone: editedUser.phone,
          profile_pic: profilePicUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בשמירת הפרטים');
      }

      setSuccess('הפרטים עודכנו בהצלחה');
      setSelectedFile(null);
      await fetchUserData(); // רענון הנתונים

    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירת הפרטים');
    } finally {
      setSaving(false);
    }
  };

  const removeProfilePic = () => {
    setEditedUser({ ...editedUser, profile_pic: '' });
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // הסתרת הודעות
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
          <p className="text-gray-600 font-medium">טוען פרטים אישיים...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" style={{ fontFamily: "'Heebo', 'Assistant', sans-serif", direction: 'rtl' }}>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-l from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                  הפרטים האישיים שלי
                </h1>
                <p className="text-sm text-gray-500 font-medium">עדכן את הפרטים שלך</p>
              </div>
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
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
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

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">הפרטים האישיים שלי</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* תמונת פרופיל */}
            <div className="text-center">
              <div className="relative inline-block">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="תמונת פרופיל"
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-blue-200 shadow-lg">
                    {user.full_name.charAt(0)}
                  </div>
                )}
                
                {/* כפתור הסרת תמונה */}
                {previewUrl && (
                  <button
                    onClick={removeProfilePic}
                    className="absolute -top-2 -left-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="mt-4">
                <Label htmlFor="profile-pic" className="cursor-pointer">
                  <div className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    {uploading ? 'מעלה...' : 'העלה תמונה'}
                  </div>
                </Label>
                <input
                  id="profile-pic"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG עד 5MB
                </p>
              </div>
            </div>

            {/* פרטים אישיים */}
            <div className="space-y-6">
              <div>
                <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <UserIcon className="w-4 h-4" />
                  שם מלא *
                </Label>
                <Input
                  type="text"
                  value={editedUser.full_name}
                  onChange={(e) => setEditedUser({
                    ...editedUser,
                    full_name: e.target.value
                  })}
                  placeholder="השם המלא שלך"
                  className="text-lg py-3"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4" />
                  כתובת מייל
                </Label>
                <Input
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-gray-50 text-gray-500 text-lg py-3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  לא ניתן לשנות את כתובת המייל
                </p>
              </div>

              <div>
                <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="w-4 h-4" />
                  מספר טלפון
                </Label>
                <Input
                  type="tel"
                  value={editedUser.phone}
                  onChange={(e) => setEditedUser({
                    ...editedUser,
                    phone: e.target.value
                  })}
                  placeholder="050-1234567"
                  className="text-lg py-3"
                />
              </div>
            </div>

            {/* כפתורי פעולה */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="flex-1"
              >
                ביטול
              </Button>
              <Button
                onClick={saveProfile}
                disabled={saving || uploading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                <Save className="w-4 h-4 ml-2" />
                {saving ? 'שומר...' : 'שמור שינויים'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* מידע נוסף */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-bold text-blue-900 mb-2">💡 טיפ</h3>
            <p className="text-blue-800 text-sm leading-relaxed">
              תמונת פרופיל מקצועית עוזרת ללקוחות להכיר אותך ומגבירה את האמון. 
              השתמש בתמונה ברורה ואיכותית שמראה את הפנים שלך.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}