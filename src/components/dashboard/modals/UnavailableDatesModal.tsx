// src/components/dashboard/modals/UnavailableDatesModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Coffee, Plane, Heart, Star, Sun, Edit3 } from 'lucide-react';
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
  const [editing, setEditing] = useState<string | null>(null);

  // Form for adding new blocked date
  const [newDate, setNewDate] = useState({
    date: '',
    reason: ''
  });

  // Form for editing existing date
  const [editForm, setEditForm] = useState({
    id: '',
    reason: ''
  });

  // ===== Helper Functions =====
  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = MONTHS_HEBREW[date.getMonth()];
    const year = date.getFullYear();
    const dayName = date.toLocaleDateString('he-IL', { weekday: 'long' });
    
    return `${dayName}, ${day} ${month} ${year}`;
  };

  const getReasonTemplate = (reason: string) => {
    return REASON_TEMPLATES.find(template => 
      template.label.toLowerCase() === reason.toLowerCase()
    );
  };

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
        showSuccessToast('חסימת התאריך בוטלה');
        fetchUnavailableDates();
      } else {
        const error = await response.json();
        showErrorToast(error.error || 'שגיאה בביטול החסימה');
      }
    } catch (error) {
      console.error('Error deleting unavailable date:', error);
      showErrorToast('שגיאה בביטול החסימה');
    } finally {
      setDeleting(null);
    }
  };

  const handleEditReason = async (id: string) => {
    if (!editForm.reason.trim()) {
      showErrorToast('הזן סיבה');
      return;
    }

    try {
      const response = await fetch(`/api/unavailable/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: editForm.reason
        })
      });

      if (response.ok) {
        showSuccessToast('סיבת החסימה עודכנה');
        setEditing(null);
        setEditForm({ id: '', reason: '' });
        fetchUnavailableDates();
      } else {
        const error = await response.json();
        showErrorToast(error.error || 'שגיאה בעדכון הסיבה');
      }
    } catch (error) {
      console.error('Error updating reason:', error);
      showErrorToast('שגיאה בעדכון הסיבה');
    }
  };

  const startEdit = (dateId: string, currentReason: string) => {
    setEditing(dateId);
    setEditForm({ id: dateId, reason: currentReason || '' });
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditForm({ id: '', reason: '' });
  };

  const handleReasonTemplateClick = (template: string) => {
    setNewDate(prev => ({ ...prev, reason: template }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-l from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">ניהול זמנים חסומים</h2>
              <p className="text-sm text-gray-600 mt-1">
                נהל תאריכים בהם לא ניתן לקבוע תורים
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-70 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-200px)]">
          {/* Add New Date Form */}
          <div className="lg:w-1/2 p-6 border-l border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              חסום תאריך חדש
            </h3>

            <div className="space-y-4">
              {/* Date Selection */}
              <div>
                <Label htmlFor="date">תאריך</Label>
                <CustomDatePicker
                  value={newDate.date}
                  onChange={(date) => setNewDate(prev => ({ ...prev, date }))}
                  placeholder="בחר תאריך לחסימה"
                />
              </div>

              {/* Reason Templates */}
              <div>
                <Label>סיבות נפוצות</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {REASON_TEMPLATES.map((template) => (
                    <button
                      key={template.label}
                      onClick={() => handleReasonTemplateClick(template.label)}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                        ${template.color} hover:shadow-sm
                        ${newDate.reason === template.label ? 'ring-2 ring-blue-500' : ''}
                      `}
                    >
                      <template.icon className="w-3 h-3 ml-1 inline-block" />
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Reason */}
              <div>
                <Label htmlFor="reason">סיבה מותאמת אישית (אופציונלי)</Label>
                <Input
                  id="reason"
                  value={newDate.reason}
                  onChange={(e) => setNewDate(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="למשל: ביקור רופא, פגישה חשובה..."
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {newDate.reason.length}/50 תווים
                </p>
              </div>

              {/* Add Button */}
              <Button
                onClick={handleAddDate}
                disabled={saving || !newDate.date}
                className="w-full"
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
                    const isEditing = editing === blockedDate.id;

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

                            {/* Reason - Edit Mode */}
                            {isEditing ? (
                              <div className="space-y-2">
                                <Input
                                  value={editForm.reason}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, reason: e.target.value }))}
                                  placeholder="הזן סיבה חדשה..."
                                  maxLength={50}
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleEditReason(blockedDate.id)}
                                    disabled={!editForm.reason.trim()}
                                  >
                                    שמור
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEdit}
                                  >
                                    ביטול
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              /* Reason - Display Mode */
                              <div className="flex items-center gap-2">
                                {blockedDate.reason ? (
                                  <>
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
                                    {!isPast && (
                                      <button
                                        onClick={() => startEdit(blockedDate.id, blockedDate.reason || '')}
                                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                        title="ערוך סיבה"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <button
                                    onClick={() => startEdit(blockedDate.id, '')}
                                    className="text-sm text-gray-400 hover:text-blue-600 transition-colors"
                                  >
                                    + הוסף סיבה
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Delete Button */}
                          {!isEditing && (
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
                          )}
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