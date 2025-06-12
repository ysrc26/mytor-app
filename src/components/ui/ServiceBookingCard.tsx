// src/components/ui/ServiceBookingCard.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight, ChevronLeft, User, Phone, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { BookingService, BookingAvailability } from '@/lib/types';
import { timeUtils } from '@/lib/time-utils';

interface ServiceBookingCardProps {
  service: BookingService;
  availability: BookingAvailability[];
  businessSlug: string;
  businessName: string;
  businessTerms?: string;
  onClose?: () => void;
}

interface AvailableSlotsResponse {
  date: string;
  service: {
    id: number;
    name: string;
    duration_minutes: number;
  };
  available_slots: string[];
  total_slots: number;
}

const ServiceBookingCard: React.FC<ServiceBookingCardProps> = ({
  service,
  availability,
  businessSlug,
  businessName,
  businessTerms,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [loadingSlots, setLoadingSlots] = useState(false);

  // פרטי לקוח
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  const dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  // טעינת שעות פנויות מה-API החדש
  const fetchAvailableSlots = async (date: Date) => {
    if (!date || !service.id) return;

    setLoadingSlots(true);
    setError('');

    try {
      const dateStr = timeUtils.formatDateForAPI(date);
      const response = await fetch(
        `/api/public/${businessSlug}/available-slots?date=${dateStr}&service_id=${service.id}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בטעינת שעות פנויות');
      }

      const data: AvailableSlotsResponse = await response.json();
      setAvailableSlots(data.available_slots || []);

      console.log('Available slots loaded:', {
        date: dateStr,
        service: service.name,
        slots: data.available_slots,
        total: data.total_slots
      });

    } catch (error) {
      console.error('Error fetching available slots:', error);
      setError(error instanceof Error ? error.message : 'שגיאה בטעינת שעות פנויות');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // טעינת שעות פנויות כשמשנים תאריך
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
      setSelectedTime(''); // איפוס בחירת השעה
    }
  }, [selectedDate, service.id, businessSlug]);

  // ניהול timer לresend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // פונקציה לבדיקה אם תאריך זמין
  const isDateAvailable = (date: Date): boolean => {
    if (timeUtils.isPastDate(date)) return false;

    const dayOfWeek = date.getDay();
    return availability.some(slot => slot.day_of_week === dayOfWeek);
  };

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
      const isSelected = selectedDate && currentDate.toDateString() === selectedDate.toDateString();
      const isAvailable = isCurrentMonth && isDateAvailable(currentDate);

      days.push({
        date: new Date(currentDate),
        day: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        isAvailable
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  // שליחת קוד OTP
  const sendOTP = async (method: 'sms' | 'call' = 'sms') => {
    if (!clientPhone) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: clientPhone,
          method
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בשליחת קוד');
      }

      setStep('otp');
      setResendTimer(60);
      setCanResend(false);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'שגיאה בשליחת קוד');
    } finally {
      setLoading(false);
    }
  };

  // אימות קוד OTP
  const verifyOTP = async () => {
    if (!otpCode || !clientPhone) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: clientPhone,
          code: otpCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'קוד שגוי');
      }

      if (data.verified) {
        await submitAppointment();
      } else {
        setError('קוד שגוי, נסה שוב');
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'שגיאה באימות');
    } finally {
      setLoading(false);
    }
  };

  // שליחת בקשת התור
  const submitAppointment = async () => {
    if (!selectedDate || !selectedTime || !clientName || !clientPhone) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/appointments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: businessSlug,
          service_id: service.id,
          client_name: clientName,
          client_phone: clientPhone,
          date: timeUtils.formatDateForAPI(selectedDate),
          time: selectedTime
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בשליחת בקשה');
      }

      setStep('success');

    } catch (error) {
      setError(error instanceof Error ? error.message : 'שגיאה בשליחת בקשה');
    } finally {
      setLoading(false);
    }
  };

  // טיפול בטופס ראשוני
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim() || !clientPhone.trim()) {
      setError('נא למלא את כל השדות');
      return;
    }

    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(clientPhone)) {
      setError('מספר טלפון לא תקין (דוגמה: 0501234567)');
      return;
    }

    sendOTP();
  };

  if (!isExpanded) {
    return (
      <div
        className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{service.name}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {service.duration_minutes} דקות
              </span>
              {service.price && (
                <span>₪{service.price}</span>
              )}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
        {service.description && (
          <p className="text-sm text-gray-600 mt-2">{service.description}</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{service.name}</h2>
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {service.duration_minutes} דקות
            </span>
            {service.price && (
              <span>₪{service.price}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            setIsExpanded(false);
            onClose?.();
          }}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {service.description && (
        <p className="text-gray-600 mb-6">{service.description}</p>
      )}

      {/* מסך הצלחה */}
      {step === 'success' && (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            בקשת התור נשלחה בהצלחה!
          </h3>
          <p className="text-gray-600 mb-4">
            בעל העסק יבדוק את הבקשה ויחזור אליך בהקדם
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="font-medium">פרטי התור:</p>
            <p>{timeUtils.formatHebrewDate(selectedDate!)}</p>
            <p>שעה: {timeUtils.formatHebrewTime(selectedTime)}</p>
            <p>שירות: {service.name}</p>
          </div>
          <button
            onClick={() => {
              setIsExpanded(false);
              onClose?.();
            }}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            סגור
          </button>
        </div>
      )}

      {/* בחירת תאריך */}
      {step === 'form' && !showBookingForm && (
        <div>
          <h3 className="font-medium text-gray-900 mb-4">בחר תאריך</h3>

          {/* ניווט חודש */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h4 className="font-medium">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h4>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* לוח השנה */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            {generateCalendarDays().map((day, index) => (
              <button
                key={index}
                onClick={() => {
                  if (day.isAvailable) {
                    setSelectedDate(day.date);
                  }
                }}
                disabled={!day.isAvailable}
                className={`
                  p-2 text-sm rounded-lg transition-colors
                  ${!day.isCurrentMonth ? 'text-gray-300' : ''}
                  ${day.isToday ? 'bg-blue-50 text-blue-600 font-medium' : ''}
                  ${day.isSelected ? 'bg-blue-500 text-white' : ''}
                  ${day.isAvailable && !day.isSelected ? 'hover:bg-blue-50 cursor-pointer' : ''}
                  ${!day.isAvailable ? 'text-gray-300 cursor-not-allowed' : ''}
                `}
              >
                {day.day}
              </button>
            ))}
          </div>

          {/* בחירת שעה */}
          {selectedDate && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                בחר שעה ל{timeUtils.formatHebrewDate(selectedDate)}
              </h4>

              {loadingSlots && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="mr-2 text-gray-600">טוען שעות פנויות...</span>
                </div>
              )}

              {!loadingSlots && availableSlots.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  אין שעות פנויות בתאריך זה
                </div>
              )}

              {!loadingSlots && availableSlots.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
                  {availableSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`
                        p-2 text-sm rounded-lg border transition-colors
                        ${selectedTime === time
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                        }
                      `}
                    >
                      {timeUtils.formatHebrewTime(time)}
                    </button>
                  ))}
                </div>
              )}

              {selectedTime && (
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-medium"
                >
                  המשך לפרטים אישיים
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* טופס פרטים אישיים */}
      {step === 'form' && showBookingForm && (
        <div>
          <button
            onClick={() => setShowBookingForm(false)}
            className="flex items-center text-blue-500 hover:text-blue-600 mb-4"
          >
            <ChevronLeft className="w-4 h-4 ml-1" />
            חזור לבחירת זמן
          </button>

          <h3 className="font-medium text-gray-900 mb-4">פרטים אישיים</h3>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="font-medium text-blue-900">סיכום הזמנה:</p>
            <p className="text-blue-800">{timeUtils.formatHebrewDate(selectedDate!)}</p>
            <p className="text-blue-800">שעה: {timeUtils.formatHebrewTime(selectedTime)}</p>
            <p className="text-blue-800">שירות: {service.name}</p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם מלא *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="הכנס שם מלא"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מספר טלפון *
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="050-123-4567"
                required
              />
            </div>

            {businessTerms && (
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p className="font-medium mb-2">תנאי השירות:</p>
                <p>{businessTerms}</p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              שלח קוד אימות
            </button>
          </form>
        </div>
      )}

      {/* מסך אימות OTP */}
      {step === 'otp' && (
        <div>
          <h3 className="font-medium text-gray-900 mb-4">אימות טלפון</h3>

          <p className="text-gray-600 mb-6">
            נשלח קוד אימות למספר {clientPhone}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                קוד אימות
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                placeholder="123456"
                maxLength={6}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              onClick={verifyOTP}
              disabled={loading || !otpCode}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              אמת ושלח בקשה
            </button>

            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-gray-500 text-sm">
                  ניתן לשלוח קוד חדש בעוד {resendTimer} שניות
                </p>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => sendOTP('sms')}
                    disabled={loading}
                    className="text-blue-500 hover:text-blue-600 text-sm"
                  >
                    שלח קוד חדש בSMS
                  </button>
                  <br />
                  <button
                    onClick={() => sendOTP('call')}
                    disabled={loading}
                    className="text-blue-500 hover:text-blue-600 text-sm"
                  >
                    קבל קוד בשיחה קולית
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceBookingCard;