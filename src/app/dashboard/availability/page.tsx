// src/app/dashboard/availability/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Plus, Edit2, Trash2, Save, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import { Availability, UnavailableDate } from '@/lib/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const DAYS_HEBREW = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

interface AvailabilityForm {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export default function AvailabilityManagement() {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // טופס זמינות
  const [availabilityForm, setAvailabilityForm] = useState<AvailabilityForm>({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '17:00',
    is_active: true
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // תאריך לא זמין
  const [blockDateInput, setBlockDateInput] = useState('');
  const [blockingDate, setBlockingDate] = useState(false);

  // טעינת נתונים
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // טעינת זמינות
      const availabilityResponse = await fetch('/api/availability', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (availabilityResponse.ok) {
        const availabilityData = await availabilityResponse.json();
        setAvailability(availabilityData);
      }

      // טעינת תאריכים חסומים
      const unavailableResponse = await fetch('/api/unavailable', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (unavailableResponse.ok) {
        const unavailableData = await unavailableResponse.json();
        setUnavailableDates(unavailableData);
      }

    } catch (err) {
      setError('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  // שמירת זמינות
  const saveAvailability = async () => {
    if (!availabilityForm.start_time || !availabilityForm.end_time) {
      setError('יש למלא שעת התחלה וסיום');
      return;
    }

    if (availabilityForm.start_time >= availabilityForm.end_time) {
      setError('שעת התחלה חייבת להיות לפני שעת הסיום');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = editingId ? `/api/availability/${editingId}` : '/api/availability';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(availabilityForm)
      });

      if (!response.ok) {
        throw new Error('שגיאה בשמירה');
      }

      setSuccess(editingId ? 'זמינות עודכנה בהצלחה' : 'זמינות נוספה בהצלחה');
      setDialogOpen(false);
      resetForm();
      await fetchData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  // מחיקת זמינות
  const deleteAvailability = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק זמינות זו?')) {
      return;
    }

    try {
      const response = await fetch(`/api/availability/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('שגיאה במחיקה');
      }

      setSuccess('זמינות נמחקה בהצלחה');
      await fetchData();

    } catch (err) {
      setError('שגיאה במחיקה');
    }
  };

  // חסימת תאריך
  const blockDate = async () => {
    if (!blockDateInput) {
      setError('יש לבחור תאריך');
      return;
    }

    const selectedDate = new Date(blockDateInput);
    if (selectedDate < new Date()) {
      setError('לא ניתן לחסום תאריך בעבר');
      return;
    }

    setBlockingDate(true);
    setError(null);

    try {
      const response = await fetch('/api/unavailable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ date: blockDateInput })
      });

      if (!response.ok) {
        throw new Error('שגיאה בחסימת התאריך');
      }

      setSuccess('תאריך נחסם בהצלחה');
      setBlockDateInput('');
      await fetchData();

    } catch (err) {
      setError('שגיאה בחסימת התאריך');
    } finally {
      setBlockingDate(false);
    }
  };

  // ביטול חסימת תאריך
  const unblockDate = async (id: string) => {
    try {
      const response = await fetch(`/api/unavailable/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('שגיאה בביטול החסימה');
      }

      setSuccess('חסימת תאריך בוטלה');
      await fetchData();

    } catch (err) {
      setError('שגיאה בביטול החסימה');
    }
  };

  // עריכת זמינות
  const editAvailability = (avail: Availability) => {
    setAvailabilityForm({
      day_of_week: avail.day_of_week,
      start_time: avail.start_time.slice(0, 5), // HH:MM
      end_time: avail.end_time.slice(0, 5),
      is_active: avail.is_active
    });
    setEditingId(avail.id);
    setDialogOpen(true);
  };

  // איפוס טופס
  const resetForm = () => {
    setAvailabilityForm({
      day_of_week: 0,
      start_time: '09:00',
      end_time: '17:00',
      is_active: true
    });
    setEditingId(null);
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
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="mr-3 text-gray-600">טוען נתונים...</span>
        </div>
      </div>
    );
  }

  // ארגון זמינות לפי ימים
  const availabilityByDay = DAYS_HEBREW.map((dayName, index) => ({
    dayName,
    dayIndex: index,
    slots: availability.filter(a => a.day_of_week === index)
  }));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ניהול זמינות</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-500 hover:bg-blue-600">
              <Plus className="h-4 w-4 ml-2" />
              הוסף זמינות
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'עריכת זמינות' : 'הוספת זמינות חדשה'}
              </DialogTitle>
              <DialogDescription>
                קבע באילו ימים ושעות אתה זמין לקבל תורים
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* יום בשבוע */}
              <div>
                <Label>יום בשבוע</Label>
                <select
                  value={availabilityForm.day_of_week}
                  onChange={(e) => setAvailabilityForm({
                    ...availabilityForm,
                    day_of_week: parseInt(e.target.value)
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {DAYS_HEBREW.map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>
              </div>

              {/* שעת התחלה */}
              <div>
                <Label htmlFor="start_time">שעת התחלה</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={availabilityForm.start_time}
                  onChange={(e) => setAvailabilityForm({
                    ...availabilityForm,
                    start_time: e.target.value
                  })}
                />
              </div>

              {/* שעת סיום */}
              <div>
                <Label htmlFor="end_time">שעת סיום</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={availabilityForm.end_time}
                  onChange={(e) => setAvailabilityForm({
                    ...availabilityForm,
                    end_time: e.target.value
                  })}
                />
              </div>

              {/* פעיל */}
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="is_active"
                  checked={availabilityForm.is_active}
                  onCheckedChange={(checked) => setAvailabilityForm({
                    ...availabilityForm,
                    is_active: checked
                  })}
                />
                <Label htmlFor="is_active">פעיל</Label>
              </div>

              {/* כפתורים */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  ביטול
                </Button>
                <Button
                  onClick={saveAvailability}
                  disabled={saving}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  {saving && <LoadingSpinner size="sm" className="ml-2" />}
                  {saving ? 'שומר...' : 'שמור'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* הודעות */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* זמינות שבועית */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 ml-2" />
            זמינות שבועית
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {availabilityByDay.map((day) => (
              <div key={day.dayIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{day.dayName}</h3>
                  {day.slots.length === 0 && (
                    <Badge variant="secondary" className="text-gray-500">
                      לא פעיל
                    </Badge>
                  )}
                </div>
                
                {day.slots.length > 0 ? (
                  <div className="space-y-2">
                    {day.slots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center gap-3">
                          <Badge variant={slot.is_active ? "default" : "secondary"}>
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </Badge>
                          {!slot.is_active && (
                            <span className="text-sm text-gray-500">(לא פעיל)</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editAvailability(slot)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteAvailability(slot.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">אין זמינות מוגדרת ליום זה</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* חסימת תאריכים */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 ml-2" />
            חסימת תאריכים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* הוספת תאריך חסום */}
            <div className="flex gap-3">
              <Input
                type="date"
                value={blockDateInput}
                onChange={(e) => setBlockDateInput(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="flex-1"
                placeholder="בחר תאריך לחסימה"
              />
              <Button
                onClick={blockDate}
                disabled={blockingDate || !blockDateInput}
                className="bg-red-500 hover:bg-red-600"
              >
                {blockingDate && <LoadingSpinner size="sm" className="ml-2" />}
                חסום תאריך
              </Button>
            </div>

            {/* רשימת תאריכים חסומים */}
            {unavailableDates.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">תאריכים חסומים:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {unavailableDates.map((blockedDate) => (
                    <div key={blockedDate.id} className="flex items-center justify-between bg-red-50 p-3 rounded-md border border-red-200">
                      <span className="text-red-800">
                        {new Date(blockedDate.date).toLocaleDateString('he-IL')}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unblockDate(blockedDate.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        בטל חסימה
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">אין תאריכים חסומים</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}