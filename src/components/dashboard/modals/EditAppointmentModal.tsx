// src/components/dashboard/modals/EditAppointmentModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, Calendar, Clock, User, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { CustomTimePicker } from '@/components/ui/CustomTimePicker';
import { BusinessOwnerValidator, checkBusinessOwnerConflicts } from '@/lib/appointment-utils';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
import type { Appointment, Service } from '@/lib/types';
import { timeUtils } from '@/lib/time-utils';

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  services: Service[];
  businessId: string;
  onUpdate: (appointmentId: string, data: { date?: string; time?: string; service_id?: string; note?: string }) => Promise<void>;
}

interface AppointmentForm {
  client_name: string;
  client_phone: string;
  service_id: string;
  date: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: string;
  custom_service_name?: string;
  note: string;
}

const extractCustomServiceName = (note: string): string => {
  const match = note.match(/^שירות: (.+?)(\n|$)/);
  return match ? match[1] : '';
};

const removeCustomServiceFromNote = (note: string): string => {
  return note.replace(/^שירות: .+?(\n|$)/, '').trim();
};

export const EditAppointmentModal = ({
  isOpen,
  onClose,
  appointment,
  businessId,
  services,
  onUpdate
}: EditAppointmentModalProps) => {
  const [appointmentForm, setAppointmentForm] = useState<AppointmentForm>({
    client_name: '',
    client_phone: '',
    service_id: '',
    custom_service_name: '', // 👈 הוסף את זה
    date: '',
    start_time: '',
    end_time: '',
    note: ''
  });

  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);

  // Initialize form when appointment changes
  useEffect(() => {
    if (isOpen && appointment) {
      setAppointmentForm({
        client_name: appointment.client_name || '',
        client_phone: appointment.client_phone || '',
        service_id: appointment.service_id || '',
        custom_service_name: extractCustomServiceName(appointment.note || ''),
        date: appointment.date || '',
        start_time: appointment.start_time || '',
        end_time: appointment.end_time || '',
        note: removeCustomServiceFromNote(appointment.note || '')
      });
    }
  }, [isOpen, appointment]);

  const handleInputChange = (field: keyof AppointmentForm, value: string) => {
    setAppointmentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const checkForConflicts = async () => {
    if (!appointmentForm.date || !appointmentForm.start_time) {
      return false;
    }

    const durationMinutes = getAppointmentDuration();

    try {
      setValidating(true);

      const conflictCheck = await BusinessOwnerValidator.checkConflictsForOwner({
        businessId,
        date: appointmentForm.date,
        start_time: appointmentForm.start_time,
        durationMinutes,
        excludeAppointmentId: appointment?.id ?? ''
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
    if (!appointment) return;

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

    // אם לא נבחר שירות קיים, בדוק שירות מותאם
    if (!appointmentForm.service_id) {
      if (!(appointmentForm.custom_service_name ?? '').trim()) {
        showErrorToast('שם השירות הוא שדה חובה');
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

    // בדיקת חפיפות אם יש שירות
    if (appointmentForm.service_id) {
      const hasConflict = await checkForConflicts();
      if (hasConflict) {
        return;
      }
    }

    try {
      setSaving(true);

      // הכנת הנתונים לעדכון
      const updates: any = {};

      // בדיקת שינויים בפרטים הבסיסיים
      if (appointmentForm.client_name.trim() !== appointment.client_name) {
        updates.client_name = appointmentForm.client_name.trim();
      }

      if (appointmentForm.client_phone.trim() !== appointment.client_phone) {
        updates.client_phone = appointmentForm.client_phone.trim();
      }

      if (appointmentForm.date !== appointment.date) {
        updates.date = appointmentForm.date;
      }

      if (appointmentForm.start_time !== appointment.start_time) {
        updates.start_time = appointmentForm.start_time;
      }

      if (appointmentForm.service_id !== (appointment.service_id || '')) {
        updates.service_id = appointmentForm.service_id || null;
      }

      // טיפול בהערות - כולל שירות מותאם
      let newNote = appointmentForm.note.trim();

      // אם יש שירות מותאם, הוסף אותו לתחילת ההערה
      if (!appointmentForm.service_id && (appointmentForm.custom_service_name ?? '').trim()) {
        const customServiceNote = `שירות: ${(appointmentForm.custom_service_name ?? '').trim()}`;
        newNote = newNote ? `${customServiceNote}\n${newNote}` : customServiceNote;
      }

      // בדיקה אם השערה השתנתה
      const originalNote = appointment.note || '';
      if (newNote !== originalNote) {
        updates.note = newNote;
      }

      if (Object.keys(updates).length === 0) {
        showErrorToast('לא בוצעו שינויים');
        return;
      }

      await onUpdate(appointment.id, updates);
      showSuccessToast('התור עודכן בהצלחה');
      onClose();
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'שגיאה בעדכון התור');
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isAppointmentPast = appointment ?
    new Date(appointment.date + 'T' + appointment.start_time + ':00') < new Date() :
    false;

  // Generate time suggestions
  const timeSuggestions = timeUtils.generateTimeSuggestions();

  const getAppointmentDuration = () => {
    if (appointmentForm.service_id) {
      const service = services.find(s => s.id === appointmentForm.service_id);
      return service?.duration_minutes || 60;
    } else if (appointmentForm.end_time && appointmentForm.start_time) {
      const startMinutes = timeUtils.timeToMinutes(appointmentForm.start_time);
      const endMinutes = timeUtils.timeToMinutes(appointmentForm.end_time);
      return endMinutes - startMinutes;
    }
    return 60; // ברירת מחדל
  };

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
              <h2 className="text-2xl font-bold">עריכת תור</h2>
              <p className="text-blue-100 mt-1">עדכן פרטי התור</p>
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

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Past appointment warning */}
          {isAppointmentPast && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">
                ⚠️ תור זה התקיים בעבר - ניתן רק לצפות בפרטים.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* Client Information */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
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
                    disabled={saving || isAppointmentPast}
                    readOnly={isAppointmentPast}
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
                      disabled={saving || isAppointmentPast}
                      readOnly={isAppointmentPast}
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                פרטי התור
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* תאריך */}
                <div>
                  <Label htmlFor="appointment-date">תאריך *</Label>
                  <CustomDatePicker
                    value={appointmentForm.date}
                    onChange={(value) => handleInputChange('date', value)}
                    disabled={saving || isAppointmentPast}
                    readOnly={isAppointmentPast}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1"
                  />
                </div>

                {/* שעה */}
                <div>
                  <Label htmlFor="appointment-time">שעה *</Label>
                  <CustomTimePicker
                    value={appointmentForm.start_time}
                    onChange={(value) => handleInputChange('start_time', value)}
                    disabled={saving || isAppointmentPast}
                    readOnly={isAppointmentPast}
                    suggestions={timeSuggestions}
                    step={15}
                    className="mt-1"
                  />
                </div>

                {/* Service Selection */}
                {services.length > 0 && (
                  <div className="md:col-span-2">
                    <Label htmlFor="service-select">שירות</Label>
                    <select
                      id="service-select"
                      value={appointmentForm.service_id}
                      onChange={(e) => handleInputChange('service_id', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={saving || isAppointmentPast}
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
                )}

                {/* שירות מותאם - רק אם לא נבחר שירות קיים */}
                {!appointmentForm.service_id && (
                  <div className="md:col-span-2">
                    <Label htmlFor="custom-service-name">שם השירות *</Label>
                    <Input
                      id="custom-service-name"
                      value={appointmentForm.custom_service_name}
                      onChange={(e) => handleInputChange('custom_service_name', e.target.value)}
                      className="mt-1"
                      placeholder="לדוגמה: טיפול פנים, עיסוי..."
                      disabled={saving || isAppointmentPast}
                      readOnly={isAppointmentPast}
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
                disabled={saving || isAppointmentPast}
                readOnly={isAppointmentPast}
              />
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
              {isAppointmentPast ? 'סגור' : 'ביטול'}
            </Button>
            {!isAppointmentPast && (
              <Button
                onClick={handleSave}
                disabled={saving || validating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    שומר...
                  </>
                ) : validating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    בודק חפיפות...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 ml-2" />
                    שמור שינויים
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};