// src/components/dashboard/modals/UnavailableDatesModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Coffee, Plane, Heart, Star, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { Badge } from '@/components/ui/badge';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';

interface UnavailableDate {
  id: string;
  business_id?: string;
  user_id?: string;
  date: string;
  reason?: string;
  created_at: string;
}

interface UnavailableDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
}

// תבניות מוכנות לסיבות נפוצות
const REASON_TEMPLATES = [
  { icon: Plane, label: 'חופשה', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { icon: Heart, label: 'אירוע משפחתי', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { icon: Coffee, label: 'יום מנוחה', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { icon: Star, label: 'חג', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { icon: Sun, label: 'חופש קיץ', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
];

const MONTHS_HEBREW = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

export function UnavailableDatesModal({ isOpen, onClose, businessId }: UnavailableDatesModalProps) {
  // ===== State Management =====
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form for adding new blocked date
  const [newDate, setNewDate] = useState({
    date: '',
    reason: ''
  });

  // ===== Data Fetching =====
  const fetchUnavailableDates = async () => {
    if (!businessId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/unavailable');
      if (response.ok) {
        const data = await response.json();
        setUnavailableDates(data);
      }
    } catch (error) {
      console.error('Error fetching unavailable dates:', error);
      showErrorToast('שגיאה בטעינת תאריכים חסומים');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUnavailableDates();
    }
  }, [isOpen, businessId]);

  // ===== Event Handlers =====
  const handleAddDate = async () => {
    if (!newDate.date) {
      showErrorToast('בחר תאריך');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/unavailable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newDate.date,
          reason: newDate.reason || null
        })
      });

      if (response.ok) {
        showSuccessToast('תאריך נחסם בהצלחה');
        setNewDate({ date: '', reason: '' });
        fetchUnavailableDates();
      } else {
        const error = await response.json();
        showErrorToast(error.error || 'שגיאה בחסימת התאריך');
      }
    } catch (error) {
      console.error('Error adding unavailable date:', error);
      showErrorToast('שגיאה בחסימת התאריך');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDate = async (id: string) => {
    setDeleting(id);
    try {
      const response = await fetch(`/api/unavailable/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccessToast('תאריך שוחרר בהצלחה');
        fetchUnavailableDates();
      } else {
        const error = await response.json();
        showErrorToast(error.error || 'שגיאה בשחרור התאריך');
      }
    } catch (error) {
      console.error('Error deleting unavailable date:', error);
      showErrorToast('שגיאה בשחרור התאריך');
    } finally {
      setDeleting(null);
    }
  };

  const handleReasonTemplateClick = (reason: string) => {
    setNewDate(prev => ({ ...prev, reason }));
  };

  const formatDateForDisplay = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getDate()} ${MONTHS_HEBREW[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getReasonTemplate = (reason: string) => {
    return REASON_TEMPLATES.find(template => template.label === reason);
  };

  // ===== Component =====
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            ניהול תאריכים חסומים
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-full max-h-[calc(90vh-80px)]">
          {/* Add New Date Panel */}
          <div className="lg:w-1/2 p-6 border-b lg:border-b-0 lg:border-l border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              הוסף תאריך חסום
            </h3>

            <div className="space-y-4">
              {/* Date Selection */}
              <div>
                <Label htmlFor="block-date">תאריך לחסימה *</Label>
                <CustomDatePicker
                  value={newDate.date}
                  onChange={(value) => setNewDate(prev => ({ ...prev, date: value }))}
                  placeholder="בחר תאריך לחסימה"
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>

              {/* Reason Templates */}
              <div>
                <Label>תבניות נפוצות</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {REASON_TEMPLATES.map((template) => (
                    <button
                      key={template.label}
                      onClick={() => handleReasonTemplateClick(template.label)}
                      className={`
                        p-3 rounded-lg border transition-all duration-200 text-sm font-medium
                        ${newDate.reason === template.label 
                          ? template.color + ' ring-2 ring-offset-1 ring-blue-500' 
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }
                      `}
                    >
                      <template.icon className="w-4 h-4 mb-1 mx-auto" />
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Reason */}
              <div>
                <Label htmlFor="reason">סיבה (אופציונלי)</Label>
                <Textarea
                  id="reason"
                  value={newDate.reason}
                  onChange={(e) => setNewDate(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="סיבת החסימה (למשל: חופשה, אירוע משפחתי...)"
                  className="mt-1"
                  rows={2}
                  dir="rtl"
                />
              </div>

              {/* Add Button */}
              <Button
                onClick={handleAddDate}
                disabled={!newDate.date || saving}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent ml-2"></div>
                    חוסם תאריך...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 ml-2" />
                    חסום תאריך
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Existing Blocked Dates */}
          <div className="lg:w-1/2 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              תאריכים חסומים ({unavailableDates.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            ) : unavailableDates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>אין תאריכים חסומים</p>
                <p className="text-sm">הוסף תאריך חסום כדי למנוע קביעת תורים</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unavailableDates
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((blockedDate) => {
                    const template = getReasonTemplate(blockedDate.reason || '');
                    const dateObj = new Date(blockedDate.date);
                    const isPast = dateObj < new Date();

                    return (
                      <div
                        key={blockedDate.id}
                        className={`
                          p-4 border rounded-lg transition-all duration-200
                          ${isPast 
                            ? 'bg-gray-50 border-gray-200 opacity-60' 
                            : 'bg-white border-gray-200 hover:border-red-300 hover:shadow-sm'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {/* Date */}
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className={`font-medium ${isPast ? 'text-gray-500' : 'text-gray-900'}`}>
                                {formatDateForDisplay(blockedDate.date)}
                              </span>
                              {isPast && (
                                <Badge variant="secondary" className="text-xs">
                                  עבר
                                </Badge>
                              )}
                            </div>

                            {/* Reason */}
                            {blockedDate.reason && (
                              <div className="flex items-center gap-2">
                                {template ? (
                                  <Badge className={`${template.color} text-xs`}>
                                    <template.icon className="w-3 h-3 ml-1" />
                                    {blockedDate.reason}
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                    {blockedDate.reason}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteDate(blockedDate.id)}
                            disabled={deleting === blockedDate.id}
                            className={`
                              p-2 rounded-lg transition-colors
                              ${isPast 
                                ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100' 
                                : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                              }
                            `}
                            title="שחרר תאריך"
                          >
                            {deleting === blockedDate.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <strong>טיפ:</strong> תאריכים חסומים מונעים מלקוחות לקבוע תורים באותם ימים
            </div>
            <Button onClick={onClose} variant="outline">
              סגור
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}