// src/components/dashboard/modals/SettingsModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  CheckCircle, 
  Settings, 
  Calendar, 
  Save, 
  Loader2, 
  Clock,
  ChevronDown
} from 'lucide-react';

export interface UserPreferences {
  default_calendar_view: 'day' | 'week' | 'month' | 'work-days' | 'agenda';
  booking_advance_limit: 'week' | 'two-weeks' | 'month';
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    default_calendar_view: 'work-days',
    booking_advance_limit: 'week'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // אפשרויות תצוגת יומן
  const calendarViewOptions = [
    { 
      value: 'day' as const, 
      label: 'יום', 
      icon: '📅', 
      description: 'תצוגת יום בודד מפורטת' 
    },
    { 
      value: 'week' as const, 
      label: 'שבוע', 
      icon: '🗓️', 
      description: 'תצוגת שבוע מלא (א׳-ש׳)' 
    },
    { 
      value: 'month' as const, 
      label: 'חודש', 
      icon: '📆', 
      description: 'תצוגת חודש מלא עם סקירה כללית' 
    },
    { 
      value: 'work-days' as const, 
      label: 'ימי עבודה', 
      icon: '💼', 
      description: 'רק הימים בהם יש לך זמינות' 
    },
    { 
      value: 'agenda' as const, 
      label: 'סדר יום', 
      icon: '📋', 
      description: 'רשימת תורים לימים הקרובים' 
    }
  ];

  // אפשרויות זמן הזמנה מראש
  const bookingAdvanceOptions = [
    { 
      value: 'week' as const, 
      label: 'שבוע קדימה', 
      description: 'לקוחות יכולים להזמין עד שבוע מראש' 
    },
    { 
      value: 'two-weeks' as const, 
      label: 'שבועיים קדימה', 
      description: 'לקוחות יכולים להזמין עד שבועיים מראש' 
    },
    { 
      value: 'month' as const, 
      label: 'חודש קדימה', 
      description: 'לקוחות יכולים להזמין עד חודש מראש' 
    }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchPreferences();
    }
  }, [isOpen]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/users/preferences');
      
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }
      
      const data = await response.json();
      setPreferences({
        default_calendar_view: data.default_calendar_view || 'work-days',
        booking_advance_limit: data.booking_advance_limit || 'week'
      });
    } catch (err) {
      console.error('Error fetching preferences:', err);
      setError('שגיאה בטעינת ההעדפות');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      setSuccess('ההעדפות נשמרו בהצלחה!');
      
      // סגור הודעת הצלחה אחרי 2 שניות
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('שגיאה בשמירת ההעדפות');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
      // נקה הודעות כשסוגרים
      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-blue-600" />
            </div>
            הגדרות אישיות
          </DialogTitle>
          <DialogDescription>
            נהל את ההעדפות שלך במערכת ההזמנות
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="mr-2 text-gray-600">טוען הגדרות...</span>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <div className="space-y-6">
            {/* Alerts */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Calendar Preferences */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  העדפות יומן
                </h3>
              </div>

              {/* Default Calendar View */}
              <div className="space-y-3">
                <Label className="text-base font-medium text-gray-900">
                  תצוגת ברירת מחדל ביומן
                </Label>
                <p className="text-sm text-gray-600">
                  בחר איזה תצוגה תוצג כברירת מחדל כשאתה נכנס לטאב היומן
                </p>

                {/* Dropdown */}
                <div className="relative">
                  <select
                    value={preferences.default_calendar_view}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      default_calendar_view: e.target.value as UserPreferences['default_calendar_view']
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    {calendarViewOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.icon} {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Booking Preferences */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  העדפות הזמנות
                </h3>
              </div>

              {/* Booking Advance Limit */}
              <div className="space-y-3">
                <Label className="text-base font-medium text-gray-900">
                  כמה זמן מראש לקוחות יכולים להזמין תור
                </Label>
                <p className="text-sm text-gray-600">
                  קבע את המקסימום זמן שלקוחות יכולים להזמין תור מראש
                </p>

                {/* Dropdown */}
                <div className="relative">
                  <select
                    value={preferences.booking_advance_limit}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      booking_advance_limit: e.target.value as UserPreferences['booking_advance_limit']
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none cursor-pointer"
                  >
                    {bookingAdvanceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    💡 <strong>טיפ:</strong> זמן קצר יותר מראש יכול להגביר דחיפות ולהקטין ביטולים,
                    בעוד זמן ארוך יותר נותן גמישות רבה יותר ללקוחות.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={saving}
                className="px-6"
              >
                ביטול
              </Button>
              <Button
                onClick={savePreferences}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    שומר...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    שמור הגדרות
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};