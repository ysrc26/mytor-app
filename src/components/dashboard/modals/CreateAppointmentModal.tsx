// src/components/dashboard/modals/CreateAppointmentModal.tsx
'use client';

import { useState, useEffect } from 'react';
import '@/styles/modal.css';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { CustomTimePicker } from '@/components/ui/CustomTimePicker';
import { X, Save, Loader2, Calendar, Clock, User, Phone, MessageCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
import { BusinessOwnerValidator } from '@/lib/appointment-utils';
import type { Service } from '@/lib/types';
import { timeUtils } from '@/lib/time-utils';

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  businessId: string;
  onCreate: (data: {
    client_name: string;
    client_phone: string;
    service_id?: string;
    date: string;
    start_time: string;
    end_time: string;
    note?: string;
  }) => Promise<void>;
  prefilledDate?: string;
  prefilledTime?: string;
}

interface AppointmentForm {
  client_name: string;
  client_phone: string;
  service_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes?: string; // משך זמן בשירות מותאם אישית
  custom_service_name?: string; // שירות מותאם אישית
  note: string;
}

export const CreateAppointmentModal = ({
  isOpen,
  onClose,
  businessId,
  services,
  onCreate,
  prefilledDate = '',
  prefilledTime = ''
}: CreateAppointmentModalProps) => {
  const [appointmentForm, setAppointmentForm] = useState<AppointmentForm>({
    client_name: '',
    client_phone: '',
    service_id: services.length === 1 ? services[0].id : '',
    custom_service_name: '',
    duration_minutes: '',
    date: prefilledDate || '',
    start_time: prefilledTime || '',
    end_time: '',
    note: ''
  });
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [timeConflict, setTimeConflict] = useState<{
    hasConflict: boolean;
    message?: string;
  }>({ hasConflict: false });
  // const [conflictError, setConflictError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAppointmentForm({
        client_name: '',
        client_phone: '',
        service_id: services.length === 1 ? services[0].id : '',
        date: prefilledDate || '',
        start_time: prefilledTime || '',
        end_time: '',
        note: ''
      });
    }
  }, [isOpen, services, prefilledDate, prefilledTime]);

  useEffect(() => {
    checkTimeConflictRealtime(
      appointmentForm.date,
      appointmentForm.start_time,
      appointmentForm.service_id
    );
  }, [appointmentForm.date, appointmentForm.start_time, appointmentForm.service_id]);

  const handleInputChange = (field: keyof AppointmentForm, value: string) => {
    setAppointmentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const checkTimeConflictRealtime = async (date: string, time: string, serviceId?: string) => {
    if (!date || !time) {
      setTimeConflict({ hasConflict: false });
      return;
    }

    try {
      let durationMinutes = 60;

      if (serviceId) {
        const service = services.find(s => s.id === serviceId);
        if (service) durationMinutes = service.duration_minutes;
      }

      // 🔍 הוסף לוג
      const newEndTime = timeUtils.minutesToTime(
        timeUtils.timeToMinutes(time) + durationMinutes
      );
      console.log('🔍 Checking conflict: ', {
        newSlot: `${time}-${newEndTime}`,
        duration: durationMinutes
      });

      const result = await BusinessOwnerValidator.checkConflictsForOwner({
        businessId,
        date,
        start_time: time,
        durationMinutes
      });

      setTimeConflict({
        hasConflict: result.hasConflict,
        message: result.error
      });
    } catch (error) {
      setTimeConflict({ hasConflict: false });
    }
  };

  const checkForConflicts = async () => {
    if (!appointmentForm.date || !appointmentForm.start_time) {
      return false;
    }

    // חישוב duration בדקות
    let durationMinutes: number;

    if (appointmentForm.service_id) {
      // אם נבחר שירות - קח את המשך מהשירות
      const service = services.find(s => s.id === appointmentForm.service_id);
      if (!service) return false;
      durationMinutes = service.duration_minutes;
    } else if (appointmentForm.end_time) {
      // אם לא נבחר שירות - חשב duration לפי start_time ו-end_time
      const startMinutes = timeUtils.timeToMinutes(appointmentForm.start_time);
      const endMinutes = timeUtils.timeToMinutes(appointmentForm.end_time);
      durationMinutes = endMinutes - startMinutes;
    } else {
      return false;
    }

    try {
      setValidating(true);
      // setConflictError(null);

      const conflictCheck = await BusinessOwnerValidator.checkConflictsForOwner({
        businessId,
        date: appointmentForm.date,
        start_time: appointmentForm.start_time,
        durationMinutes
      });

      console.log('🔧 DEBUG - Form state:', {
        service_id: appointmentForm.service_id,
        start_time: appointmentForm.start_time,
        end_time: appointmentForm.end_time,
        custom_service_name: appointmentForm.custom_service_name
      });

      if (conflictCheck.hasConflict) {
        showErrorToast(conflictCheck.error || 'יש חפיפה עם תור קיים');
        return true;
      }

      return false;
    } catch (error) {
      showErrorToast('שגיאה בבדיקת חפיפות');
      return true;
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    // Basic validation
    if (!appointmentForm.client_name.trim()) {
      showErrorToast('שם הלקוח הוא שדה חובה');
      return;
    }

    if (!appointmentForm.client_phone.trim()) {
      showErrorToast('מספר טלפון הוא שדה חובה');
      return;
    }

    // Phone validation
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(appointmentForm.client_phone)) {
      showErrorToast('מספר טלפון לא תקין (צריך להתחיל ב-05 ולהכיל 10 ספרות)');
      return;
    }

    if (!appointmentForm.date) {
      showErrorToast('תאריך הוא שדה חובה');
      return;
    }

    if (!appointmentForm.start_time) {
      showErrorToast('שעה היא שדה חובה');
      return;
    }

    // אם לא נבחר שירות קיים, יש צורך בפרטי השירות המותאם
    if (!appointmentForm.service_id) {
      if (!(appointmentForm.custom_service_name ?? '').trim()) {
        showErrorToast('שם השירות הוא שדה חובה');
        return;
      }

      if (!appointmentForm.duration_minutes) {
        showErrorToast('משך זמן הוא שדה חובה');
        return;
      }

      if (!appointmentForm.end_time) {
        showErrorToast('שעת סיום היא שדה חובה');
        return;
      }

      // וידוא ששעת הסיום אחרי שעת ההתחלה
      const startMinutes = timeUtils.timeToMinutes(appointmentForm.start_time);
      const endMinutes = timeUtils.timeToMinutes(appointmentForm.end_time);

      if (endMinutes <= startMinutes) {
        showErrorToast('שעת הסיום חייבת להיות אחרי שעת ההתחלה');
        return;
      }
    }

    // Check if appointment is in the past
    const appointmentDate = new Date(
      appointmentForm.date + 'T' + appointmentForm.start_time + ':00'
    );
    const now = new Date();
    if (appointmentDate < now) {
      showErrorToast('לא ניתן לקבוע תור בעבר');
      return;
    }

    // בדיקת חפיפות לפני שמירה
    if (appointmentForm.service_id) {
      const hasConflict = await checkForConflicts();
      if (hasConflict) {
        return;
      }
    }

    try {
      setSaving(true);

      const appointmentData = {
        client_name: appointmentForm.client_name.trim(),
        client_phone: appointmentForm.client_phone.trim(),
        date: appointmentForm.date,
        start_time: appointmentForm.start_time,
        end_time: appointmentForm.end_time,
        note: appointmentForm.note.trim()
      };

      // הוסף שירות או שעת סיום
      if (appointmentForm.service_id) {
        (appointmentData as any).service_id = appointmentForm.service_id;
      } else {
        // שירות מותאם - שמור בnote
        const customServiceNote = `שירות: ${appointmentForm.custom_service_name}`;
        const existingNote = appointmentForm.note.trim();
        (appointmentData as any).note = existingNote
          ? `${customServiceNote}\n${existingNote}`
          : customServiceNote;

        (appointmentData as any).end_time = appointmentForm.end_time;
      }

      try {
        await onCreate(appointmentData);
        onClose();
      } catch (error) {
        console.error('Error creating appointment:', error);
      }
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'שגיאה ביצירת התור');
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const timeSuggestions = timeUtils.generateTimeSuggestions();
  const todayDate = timeUtils.formatDateForAPI(new Date());

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">יצירת תור חדש</h2>
              <p className="text-blue-100 mt-1">הוסף תור חדש למערכת</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/20 rounded-xl transition-colors"
              disabled={saving}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Conflict Error
        {conflictError && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">חפיפת תורים</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{conflictError}</p>
          </div>
        )} */}

        {/* Time Conflict Warning */}
        {timeConflict.hasConflict && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700">
              <X className="w-4 h-4" />
              <span className="font-medium">זמן תפוס</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{timeConflict.message}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Client Information */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                פרטי הלקוח
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client-name">שם הלקוח *</Label>
                  <Input
                    id="client-name"
                    type="text"
                    placeholder="שם מלא"
                    value={appointmentForm.client_name}
                    onChange={(e) => handleInputChange('client_name', e.target.value)}
                    className="mt-1"
                    disabled={saving}
                    autoFocus
                  />
                </div>

                <div>
                  <Label htmlFor="client-phone">מספר טלפון *</Label>
                  <div className="relative mt-1">
                    <Input
                      id="client-phone"
                      type="tel"
                      placeholder="050-1234567"
                      value={appointmentForm.client_phone}
                      onChange={(e) => handleInputChange('client_phone', e.target.value)}
                      disabled={saving}
                      className="pr-10" // הוסף padding מימין
                    />
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                פרטי התור
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* תאריך */}
                <div>
                  <Label htmlFor="appointment-date">תאריך *</Label>
                  <CustomDatePicker
                    value={appointmentForm.date}
                    onChange={(value) => handleInputChange('date', value)}
                    disabled={saving}
                    min={todayDate}
                    className="mt-1"
                  />
                </div>

                {/* שעת התחלה */}
                <div>
                  <Label htmlFor="appointment-time">שעה *</Label>
                  <CustomTimePicker
                    value={appointmentForm.start_time}
                    onChange={(value) => handleInputChange('start_time', value)}
                    disabled={saving}
                    suggestions={timeSuggestions}
                    step={15}
                    className="mt-1"
                  />
                </div>

                {/* בחירת שירות */}
                <div className="md:col-span-2">
                  <Label htmlFor="service-select">שירות</Label>
                  <select
                    id="service-select"
                    value={appointmentForm.service_id}
                    onChange={(e) => handleInputChange('service_id', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={saving}
                  >
                    <option value="">שירות מותאם אישית</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                        {service.duration_minutes && ` (${service.duration_minutes} דקות)`}
                        {service.price && ` - ₪${service.price}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* שם שירות מותאם - רק אם לא נבחר שירות קיים */}
                {!appointmentForm.service_id && (
                  <div>
                    <Label htmlFor="custom-service-name">שם השירות *</Label>
                    <Input
                      id="custom-service-name"
                      value={appointmentForm.custom_service_name}
                      onChange={(e) => handleInputChange('custom_service_name', e.target.value)}
                      className="mt-1"
                      placeholder="לדוגמה: טיפול פנים, עיסוי..."
                      disabled={saving}
                    />
                  </div>
                )}

                {/* משך זמן - רק אם לא נבחר שירות קיים */}
                {!appointmentForm.service_id && (
                  <div>
                    <Label htmlFor="duration">משך זמן (דקות) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={appointmentForm.duration_minutes}
                      onChange={(e) => handleInputChange('duration_minutes', e.target.value)}
                      className="mt-1"
                      placeholder="60"
                      min="15"
                      max="480"
                      step="15"
                      disabled={saving}
                    />
                  </div>
                )}

                {/* שעת סיום - רק אם לא נבחר שירות */}
                {!appointmentForm.service_id && (
                  <div className="md:col-span-2">
                    <Label htmlFor="appointment-end-time">שעת סיום *</Label>
                    <CustomTimePicker
                      value={appointmentForm.end_time}
                      onChange={(value) => handleInputChange('end_time', value)}
                      disabled={saving}
                      min={appointmentForm.start_time}
                      suggestions={timeSuggestions}
                      step={15}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
            {/* Notes */}
            <div>
              <Label htmlFor="appointment-note" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                הערות
              </Label>
              <Textarea
                id="appointment-note"
                placeholder="הערות נוספות על התור..."
                value={appointmentForm.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
                className="mt-1 min-h-[80px]"
                disabled={saving}
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-3">פעולות מהירות</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleInputChange('date', todayDate)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  disabled={saving}
                >
                  היום
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    handleInputChange('date', tomorrow.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  disabled={saving}
                >
                  מחר
                </button>
                {['09:00', '12:00', '15:00', '18:00'].map(time => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleInputChange('start_time', time)}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                    disabled={saving}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              ביטול
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  יוצר...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  יצירת תור
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};