// src/components/dashboard/modals/EditAppointmentModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, Calendar, Clock, User, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { checkBusinessOwnerConflicts } from '@/lib/appointment-utils';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
import type { Appointment, Service } from '@/lib/types';

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
  time: string;
  note: string;
}

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
    date: '',
    time: '',
    note: ''
  });
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  // const [conflictError, setConflictError] = useState<string | null>(null);

  // Initialize form when appointment changes
  useEffect(() => {
    if (isOpen && appointment) {
      setAppointmentForm({
        client_name: appointment.client_name || '',
        client_phone: appointment.client_phone || '',
        service_id: appointment.service_id || '',
        date: appointment.date || '',
        time: appointment.time || '',
        note: appointment.note || ''
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
    if (!appointmentForm.service_id || !appointmentForm.date || !appointmentForm.time) {
      return false;
    }

    try {
      setValidating(true);
      // setConflictError(null);

      const conflictCheck = await checkBusinessOwnerConflicts(
        businessId,
        appointmentForm.service_id,
        appointmentForm.date,
        appointmentForm.time
      );

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

    if (!appointmentForm.time) {
      showErrorToast('שעה היא שדה חובה');
      return;
    }

    // Check if appointment is in the past
    const appointmentDateTime = new Date(`${appointmentForm.date}T${appointmentForm.time}`);
    const now = new Date();
    if (appointmentDateTime < now) {
      showErrorToast('לא ניתן לקבוע תור בעבר');
      return;
    }

    // Check for conflicts
    const conflictCheck = await checkBusinessOwnerConflicts(
      businessId,
      appointmentForm.service_id,
      appointmentForm.date,
      appointmentForm.time,
      appointment.id // ✅ חשוב! לא לכלול את התור הנוכחי בבדיקה
    );

    try {
      setSaving(true);

      // Only send changed fields
      const updates: any = {};
      if (appointmentForm.date !== appointment.date) updates.date = appointmentForm.date;
      if (appointmentForm.time !== appointment.time) updates.time = appointmentForm.time;
      if (appointmentForm.service_id !== appointment.service_id) updates.service_id = appointmentForm.service_id;
      if (appointmentForm.note !== (appointment.note || '')) updates.note = appointmentForm.note;

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
    new Date(`${appointment.date}T${appointment.time}`) < new Date() : false;

  if (!isOpen || !appointment) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">עריכת תור</h2>
              <p className="text-green-100 mt-1">
                {isAppointmentPast ? 'תור שעבר - צפייה בלבד' : 'עדכן את פרטי התור'}
              </p>
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isAppointmentPast && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-orange-700">
                <Clock className="w-4 h-4" />
                <span className="font-medium">תור שעבר</span>
              </div>
              <p className="text-orange-600 text-sm mt-1">
                לא ניתן לערוך תור שכבר עבר. ניתן רק לצפות בפרטים.
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
                <div>
                  <Label htmlFor="appointment-date">תאריך *</Label>
                  <Input
                    id="appointment-date"
                    type="date"
                    value={appointmentForm.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="mt-1"
                    disabled={saving || isAppointmentPast}
                    readOnly={isAppointmentPast}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <Label htmlFor="appointment-time">שעה *</Label>
                  <div className="relative mt-1">
                    <Input
                      id="appointment-time"
                      type="time"
                      value={appointmentForm.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                      disabled={saving || isAppointmentPast}
                      readOnly={isAppointmentPast}
                    />
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Service Selection */}
                {services.length > 0 && (
                  <div className="md:col-span-2">
                    <Label htmlFor="service-select">שירות</Label>
                    <select
                      id="service-select"
                      value={appointmentForm.service_id}
                      onChange={(e) => handleInputChange('service_id', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      disabled={saving || isAppointmentPast}
                    >
                      <option value="">ללא שירות מוגדר</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} ({service.duration_minutes} דקות)
                          {service.price && service.price > 0 && ` - ₪${service.price}`}
                        </option>
                      ))}
                    </select>
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
        {!isAppointmentPast && (
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
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    שומר...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    שמירה
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};