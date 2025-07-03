// src/components/ui/AppointmentBooking.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight, ChevronLeft, User, Phone, MessageSquare, CheckCircle } from 'lucide-react';
import {
  BookingService,
  BookingAvailability,
  BookingAppointment,
  ClientDetails,
  BookingComponentProps,
  BookingStep
} from '@/lib/types';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { CustomTimePicker } from '@/components/ui/CustomTimePicker';
import { timeUtils } from '@/lib/time-utils';

const AppointmentBooking: React.FC<BookingComponentProps> = ({
  businessSlug,
  services,
  availability,
  businessName
}) => {
  const [step, setStep] = useState<BookingStep>('service');
  const [selectedService, setSelectedService] = useState<BookingService | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [existingAppointments, setExistingAppointments] = useState<BookingAppointment[]>([]);
  const [loading, setLoading] = useState(false);

  // פרטי לקוח
  const [clientDetails, setClientDetails] = useState<ClientDetails>({
    name: '',
    phone: '',
    note: ''
  });

  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  const dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  // טעינת שעות פנויות באמצעות ה-API החדש
  const fetchAvailableSlots = async (date: Date, service: BookingService) => {
    if (!date || !service?.id) return;

    setLoading(true);

    try {
      // ✅ תיקון UTC - השתמש בפונקציה הבטוחה
      const dateStr = timeUtils.formatDateForAPI(date);
      const response = await fetch(
        `/api/public/${businessSlug}/available-slots?date=${dateStr}&service_id=${service.id}`
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.available_slots || []);
      } else {
        console.error('Error fetching available slots');
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // טעינת תורים קיימים (לתצוגה)
  useEffect(() => {
    if (selectedDate) {
      const fetchExistingAppointments = async () => {
        try {
          // ✅ תיקון UTC - השתמש בפונקציה הבטוחה
          const dateStr = timeUtils.formatDateForAPI(selectedDate);
          const response = await fetch(`/api/public/${businessSlug}/appointments?date=${dateStr}`);
          if (response.ok) {
            const appointments = await response.json();
            setExistingAppointments(appointments);
          }
        } catch (error) {
          console.error('Error fetching appointments:', error);
        }
      };

      fetchExistingAppointments();
    }
  }, [selectedDate, businessSlug]);

  // חישוב שעות פנויות כשמשנים תאריך או שירות
  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailableSlots(selectedDate, selectedService);
      setSelectedTime(''); // איפוס בחירת השעה
    }
  }, [selectedDate, selectedService, businessSlug]);

  // פונקציה לבדיקה אם תאריך זמין
  // const isDateAvailable = (date: Date): boolean => {
  //   if (timeUtils.isPastDate(date)) return false;

  //   const dayOfWeek = date.getDay();
  //   return availability.some(slot => slot.day_of_week === dayOfWeek);
  // };

  // יצירת לוח השנה
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.toDateString() === new Date().toDateString();

      // ✅ תיקון UTC - השתמש בפונקציה הבטוחה
      const dateStr = timeUtils.formatDateForAPI(currentDate);
      const isAvailable = isDateAvailable(currentDate);
      const isSelected = selectedDate && timeUtils.formatDateForAPI(selectedDate) === dateStr;

      days.push({
        date: new Date(currentDate),
        dateStr,
        day: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        isAvailable,
        isSelected
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  // שליחת בקשת תור
  const submitAppointment = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientDetails.name || !clientDetails.phone) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/appointments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: businessSlug,
          service_id: selectedService.id,
          client_name: clientDetails.name,
          client_phone: clientDetails.phone,
          date: selectedDate.toISOString().split('T')[0],
          time: selectedTime,
          note: clientDetails.note
        })
      });

      if (response.ok) {
        setStep('success');
      } else {
        const errorData = await response.json();
        console.error('Error submitting appointment:', errorData);
      }
    } catch (error) {
      console.error('Error submitting appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDateAvailable = (date: Date): boolean => {
    const dayOfWeek = date.getDay();
    return availability.some(avail =>
      avail.day_of_week === dayOfWeek && avail.is_active
    );
  };

  const isTimeAvailable = (date: Date, time: string): boolean => {
    const dayOfWeek = date.getDay();
    const dayAvailability = availability.find(a =>
      a.day_of_week === dayOfWeek && a.is_active
    );

    if (!dayAvailability) return false;

    return time >= dayAvailability.start_time && time <= dayAvailability.end_time;
  };

  const getAvailableTimes = (date: Date | null): string[] => {
    if (!date) return [];

    const dayOfWeek = date.getDay();
    const dayAvailability = availability.find(a =>
      a.day_of_week === dayOfWeek && a.is_active
    );

    if (!dayAvailability) return [];

    // השתמש בפונקציה הקיימת ולאחר מכן סנן לפי זמינות היום
    return timeSuggestions.filter(time =>
      time >= dayAvailability.start_time &&
      time <= dayAvailability.end_time.slice(0, -3) + '00' // להבטיח שלא נחרוג מהשעה הסופית
    );
  };

  const timeSuggestions = timeUtils.generateTimeSuggestions();

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">

      {/* תצוגת שלבים */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${step === 'service' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
            1
          </div>
          <div className="h-1 w-16 mx-2 bg-gray-200">
            <div className={`h-full bg-blue-500 transition-all ${['date', 'time', 'details', 'success'].includes(step) ? 'w-full' : 'w-0'
              }`} />
          </div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${['date', 'time', 'details', 'success'].includes(step) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
            2
          </div>
          <div className="h-1 w-16 mx-2 bg-gray-200">
            <div className={`h-full bg-blue-500 transition-all ${['time', 'details', 'success'].includes(step) ? 'w-full' : 'w-0'
              }`} />
          </div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${['time', 'details', 'success'].includes(step) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
            3
          </div>
          <div className="h-1 w-16 mx-2 bg-gray-200">
            <div className={`h-full bg-blue-500 transition-all ${['details', 'success'].includes(step) ? 'w-full' : 'w-0'
              }`} />
          </div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${['details', 'success'].includes(step) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
            4
          </div>
        </div>
      </div>

      {/* בחירת שירות */}
      {step === 'service' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">בחר שירות</h2>
          <div className="space-y-4">
            {services?.map(service => (
              <div
                key={service.id}
                onClick={() => {
                  setSelectedService(service);
                  setStep('date');
                }}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <h3 className="font-medium text-gray-900">{service.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {service.duration_minutes} דקות
                  </span>
                  {service.price && (
                    <span>₪{service.price}</span>
                  )}
                </div>
                {service.description && (
                  <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* בחירת תאריך */}
      {step === 'date' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">בחר תאריך</h2>
            <button
              onClick={() => setStep('service')}
              className="text-blue-500 hover:text-blue-600"
            >
              שנה שירות
            </button>
          </div>

          {selectedService && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="font-medium text-blue-900">{selectedService.name}</p>
              <p className="text-blue-800 text-sm">
                {selectedService.duration_minutes} דקות
                {selectedService.price && ` • ₪${selectedService.price}`}
              </p>
            </div>
          )}

          {/* Date Picker */}
          <div className="mb-6">
            <CustomDatePicker
              value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
              onChange={(dateStr) => {
                if (dateStr) {
                  const date = new Date(dateStr);
                  const isAvailable = isDateAvailable(date);

                  if (isAvailable) {
                    setSelectedDate(date);
                    setStep('time');
                  } else {
                    alert('התאריך שנבחר אינו זמין');
                  }
                }
              }}
              min={new Date().toISOString().split('T')[0]}
              className="w-full"
              placeholder="בחר תאריך לתור"
            />
          </div>

          {/* הצגת זמינות השבוע */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">זמינות השבוע:</h4>
            <div className="grid grid-cols-7 gap-2 text-center">
              {['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'].map((day, index) => {
                const dayAvailability = availability.find(a => a.day_of_week === index && a.is_active);
                return (
                  <div key={index} className="text-xs">
                    <div className="font-medium text-gray-700">{day}</div>
                    <div className={`mt-1 px-1 py-0.5 rounded text-xs ${dayAvailability
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                      }`}>
                      {dayAvailability
                        ? `${dayAvailability.start_time}-${dayAvailability.end_time}`
                        : 'סגור'
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* בחירת שעה */}
      {step === 'time' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">בחר שעה</h2>
            <button
              onClick={() => setStep('date')}
              className="text-blue-500 hover:text-blue-600"
            >
              שנה תאריך
            </button>
          </div>

          {selectedService && selectedDate && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="font-medium text-blue-900">{selectedService.name}</p>
              <p className="text-blue-800 text-sm">
                {selectedDate.toLocaleDateString('he-IL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
                {selectedService.duration_minutes && ` • ${selectedService.duration_minutes} דקות`}
                {selectedService.price && ` • ₪${selectedService.price}`}
              </p>
            </div>
          )}

          {/* Time Picker */}
          <div className="mb-6">
            <CustomTimePicker
              value={selectedTime}
              onChange={(timeStr) => {
                if (timeStr && selectedDate) {
                  const isAvailable = isTimeAvailable(selectedDate, timeStr);

                  if (isAvailable) {
                    setSelectedTime(timeStr);
                    setStep('details');
                  } else {
                    alert('השעה שנבחרה אינה זמינה');
                  }
                }
              }}
              suggestions={getAvailableTimes(selectedDate)}
              step={15}
              className="w-full"
              placeholder="בחר שעה לתור"
            />
          </div>
        </div>
      )}

      {/* פרטים אישיים */}
      {step === 'details' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">פרטים אישיים</h2>
            <button
              onClick={() => setStep('time')}
              className="text-blue-500 hover:text-blue-600"
            >
              שנה שעה
            </button>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="font-medium text-blue-900">סיכום הזמנה:</p>
            <p className="text-blue-800">{timeUtils.formatHebrewDate(selectedDate!)}</p>
            <p className="text-blue-800">שעה: {timeUtils.formatHebrewTime(selectedTime)}</p>
            <p className="text-blue-800">שירות: {selectedService?.name}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם מלא *
              </label>
              <input
                type="text"
                value={clientDetails.name}
                onChange={(e) => setClientDetails({ ...clientDetails, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="הכנס שם מלא"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מספר טלפון *
              </label>
              <input
                type="tel"
                value={clientDetails.phone}
                onChange={(e) => setClientDetails({ ...clientDetails, phone: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="050-123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                הערות (אופציונלי)
              </label>
              <textarea
                value={clientDetails.note}
                onChange={(e) => setClientDetails({ ...clientDetails, note: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="הערות נוספות..."
              />
            </div>

            <button
              onClick={submitAppointment}
              disabled={loading || !clientDetails.name || !clientDetails.phone}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'שולח בקשה...' : 'שלח בקשת תור'}
            </button>
          </div>
        </div>
      )}

      {/* הצלחה */}
      {step === 'success' && (
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            בקשת התור נשלחה בהצלחה!
          </h2>
          <p className="text-gray-600 mb-6">
            תקבל עדכון על אישור או דחיית הבקשה בהקדם
          </p>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-medium">פרטי התור:</p>
            <p>{timeUtils.formatHebrewDate(selectedDate!)}</p>
            <p>שעה: {timeUtils.formatHebrewTime(selectedTime)}</p>
            <p>שירות: {selectedService?.name}</p>
            <p>לקוח: {clientDetails.name}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentBooking;