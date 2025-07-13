// src/app/[slug]/page.tsx - גרסה מחודשת
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Clock,
  Phone,
  User,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
  Shield
} from 'lucide-react';

import { Business, Service, Availability } from '@/lib/types';
import { supabasePublic } from '@/lib/supabase-public';

interface BusinessPageData {
  business: Business;
  services: Service[];
  availability: Availability[];
  unavailableDates?: string[];
}

interface AppointmentRequest {
  client_name: string;
  client_phone: string;
  service_id: string;
  date: string;
  time: string;
  note?: string;
}

const DAYS_HEBREW = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const MONTHS_HEBREW = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

export default function BusinessPage() {
  const params = useParams();
  const slug = params.slug as string;

  // ===== State Management =====
  const [businessData, setBusinessData] = useState<BusinessPageData | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Booking Flow States
  const [step, setStep] = useState<'service' | 'date' | 'time' | 'details' | 'otp' | 'success'>('service');
  const [appointmentRequest, setAppointmentRequest] = useState<AppointmentRequest>({
    client_name: '',
    client_phone: '',
    service_id: '',
    date: '',
    time: '',
    note: ''
  });

  // OTP & Submission
  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // ===== Data Fetching =====
  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/public/${slug}`);
        if (!response.ok) {
          throw new Error('עסק לא נמצא');
        }

        const data = await response.json();

        //
        // שלוף ישירות עם business_id שכבר יש לך
        const { data: blockedDates } = await supabasePublic
          .from('public_unavailable_dates')
          .select('date')
          .eq('business_id', data.business.id);
        
        if (blockedDates) {
          console.log('🚫 Blocked dates loaded:',blockedDates);
        }

        data.unavailableDates = blockedDates?.map(d => d.date) || [];

        setBusinessData(data);

        // Auto-select single service but stay on service step
        if (data.services && data.services.length === 1) {
          setSelectedService(data.services[0]);
          setAppointmentRequest(prev => ({ ...prev, service_id: data.services[0].id }));
          // Don't auto-advance to date step, let user see the service first
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה בטעינת העמוד');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBusinessData();
    }
  }, [slug]);

  // ===== Available Slots Fetching =====
  const fetchAvailableSlots = async (date: string, serviceId: string) => {
    if (!date || !serviceId) return;

    setLoadingSlots(true);
    try {
      const response = await fetch(
        `/api/public/${slug}/available-slots?date=${date}&service_id=${serviceId}`
      );

      if (!response.ok) {
        throw new Error('שגיאה בטעינת שעות פנויות');
      }

      const data = await response.json();
      setAvailableSlots(data.available_slots || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setError('שגיאה בטעינת שעות פנויות');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // ===== Helper Functions =====
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateAvailable = (date: Date): boolean => {
    if (!businessData?.availability) return false;

    // בדיקה שהתאריך לא חסום
    const dateStr = formatDateForAPI(date);
    console.log('🔍 Checking date availability:', { dateStr, unavailableDates: businessData?.unavailableDates });

    if (businessData.unavailableDates?.includes(dateStr)) {
      console.log('❌ Date is blocked!');
      return false;
    }

    const dayOfWeek = date.getDay();
    return businessData.availability.some(slot =>
      slot.day_of_week === dayOfWeek && slot.is_active
    );
  };

  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatDateForDisplay = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getDate()} ${MONTHS_HEBREW[date.getMonth()]} ${date.getFullYear()}`;
  };

  // ===== Event Handlers =====
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setAppointmentRequest(prev => ({ ...prev, service_id: service.id }));
    setStep('date');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setAppointmentRequest(prev => ({ ...prev, date }));
    setSelectedTime('');
    setError(''); // Clear any previous errors
    fetchAvailableSlots(date, appointmentRequest.service_id);
    setStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setAppointmentRequest(prev => ({ ...prev, time }));
    setError(''); // Clear any previous errors
    setStep('details');
  };

  const handleDetailsSubmit = async () => {
    if (!appointmentRequest.client_name || !appointmentRequest.client_phone) {
      return;
    }

    // Send OTP
    setOtpSending(true);
    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: appointmentRequest.client_phone,
          method: 'sms'
        })
      });

      if (response.ok) {
        setStep('otp');
        setResendTimer(60);
        const timer = setInterval(() => {
          setResendTimer(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'שגיאה בשליחת קוד אימות');
      }
    } catch (error) {
      setError('שגיאה בשליחת קוד אימות');
    } finally {
      setOtpSending(false);
    }
  };

  const handleOTPSubmit = async () => {
    if (!otpCode || otpCode.length !== 6) return;

    setOtpVerifying(true);
    try {
      // Verify OTP
      const verifyResponse = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: appointmentRequest.client_phone,
          code: otpCode
        })
      });

      if (!verifyResponse.ok) {
        setError('קוד אימות שגוי');
        return;
      }

      // Submit appointment request
      setSubmitting(true);
      const appointmentResponse = await fetch('/api/appointments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          service_id: appointmentRequest.service_id,
          client_name: appointmentRequest.client_name,
          client_phone: appointmentRequest.client_phone,
          date: appointmentRequest.date,
          start_time: appointmentRequest.time, // ✅ שינוי מ-time ל-start_time
          note: appointmentRequest.note
        })
      });

      if (appointmentResponse.ok) {
        setStep('success');
      } else {
        const errorData = await appointmentResponse.json();
        setError(errorData.error || 'שגיאה בשליחת בקשת התור');
      }
    } catch (error) {
      setError('שגיאה בשליחת בקשת התור');
    } finally {
      setOtpVerifying(false);
      setSubmitting(false);
    }
  };

  // ===== Calendar Generation =====
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison

    for (let i = 0; i < 42; i++) {
      const date = new Date(current);
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const isAvailable = isDateAvailable(date) && isCurrentMonth;
      const isPast = date < today; // Fixed: compare with today at 00:00
      const isSelectable = isAvailable && !isPast;

      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth,
        isToday,
        isAvailable,
        isPast,
        isSelectable
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // ===== Loading State =====
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  // ===== Error State =====
  if (error && !businessData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center p-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">שגיאה</h1>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const business = businessData?.business;
  const services = businessData?.services || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div
        className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40 relative overflow-hidden min-h-[100px]"
        style={{
          backgroundImage: business?.profile_image_url ? `url(${business.profile_image_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'local'
        }}
      >
        {/* Overlay for better text readability */}
        {business?.profile_image_url && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/50 backdrop-blur-[1px]"></div>
        )}

        <div className="max-w-6xl mx-auto px-4 py-16 relative z-10">
          <div className="text-center">
            <h1 className={`text-6xl font-bold mb-6 ${business?.profile_image_url ? 'text-white drop-shadow-2xl' : 'text-gray-900'}`}>
              {business?.name}
            </h1>

            <div className="flex items-center justify-center gap-8 text-base">
              {business?.phone && (
                <div className={`flex items-center gap-2 ${business?.profile_image_url ? 'text-white/90 drop-shadow' : 'text-gray-500'}`}>
                  <Phone className="w-5 h-5" />
                  <span>{business.phone}</span>
                </div>
              )}
              <div className={`flex items-center gap-2 ${business?.profile_image_url ? 'text-white/90 drop-shadow' : 'text-gray-500'}`}>
                <MapPin className="w-5 h-5" />
                <span>{business?.address || 'ישראל'}</span>
              </div>
              <div className={`flex items-center gap-2 ${business?.profile_image_url ? 'text-white/90 drop-shadow' : 'text-gray-500'}`}>
                <Star className="w-5 h-5 text-yellow-400 drop-shadow" />
                <span>4.8 (127 ביקורות)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Info Section */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border-0 mb-6">
          <div className="p-6">
            <div className="space-y-8">
              {/* Business Details */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">על העסק</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {business?.description || "ברוכים הבאים לעסק שלנו! אנו מתמחים במתן שירות מקצועי ואיכותי ללקוחותינו."}
                  </p>
                </div>

                {/* Services Overview */}
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">השירותים שלנו</h3>
                  <div className="flex flex-wrap gap-2">
                    {services.map((service) => (
                      <Badge key={service.id} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        {service.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  שעות פעילות
                </h3>
                <div className="space-y-1 text-sm">
                  {businessData?.availability.map((slot) => (
                    <div key={slot.id} className="flex justify-between">
                      <span className="text-gray-600">{DAYS_HEBREW[slot.day_of_week]}</span>
                      <span className="text-gray-900 font-medium">
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-2">{/* Reduced padding */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Service Selection */}
        {step === 'service' && (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                בחר שירות
              </CardTitle>
              <p className="text-gray-600">בחר את השירות שברצונך לקבוע</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {services.length === 1 ? (
                // Single service - highlighted design
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-30"></div>
                  <div className="relative bg-white p-6 rounded-xl border-2 border-blue-200">
                    <div className="text-center mb-4">
                      <Badge className="bg-blue-100 text-blue-800">השירות שלנו</Badge>
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {services[0].name}
                      </h3>
                      {services[0].description && (
                        <p className="text-gray-600 mb-4">{services[0].description}</p>
                      )}
                      <div className="flex items-center justify-center gap-6 mb-6 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {services[0].duration_minutes} דקות
                        </span>
                        {services[0].price && (
                          <span className="font-medium text-green-600 text-lg">
                            ₪{services[0].price}
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={() => handleServiceSelect(services[0])}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-3"
                      >
                        המשך לקביעת תור
                        <ChevronRight className="w-5 h-5 mr-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Multiple services - original grid
                services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="w-full p-6 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300 text-right group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-700">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="text-sm text-gray-600">{service.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {service.duration_minutes} דקות
                          </span>
                          {service.price && (
                            <span className="font-medium text-green-600">
                              ₪{service.price}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                  </button>
                )))}
            </CardContent>
          </Card>
        )}

        {/* Date Selection */}
        {step === 'date' && selectedService && (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <button
                  onClick={() => setStep('service')}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  ← שנה שירות
                </button>
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                בחר תאריך
              </CardTitle>
              <div className="bg-blue-50 rounded-lg p-3 inline-block">
                <p className="text-sm text-blue-800">
                  <Sparkles className="w-4 h-4 inline ml-1" />
                  {selectedService.name} • {selectedService.duration_minutes} דקות
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => {
                    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
                    const today = new Date();
                    // Don't allow going to months before current month
                    if (prevMonth.getFullYear() > today.getFullYear() ||
                      (prevMonth.getFullYear() === today.getFullYear() && prevMonth.getMonth() >= today.getMonth())) {
                      setCurrentMonth(prevMonth);
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentMonth.getFullYear() === new Date().getFullYear() && currentMonth.getMonth() === new Date().getMonth()}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-semibold">
                  {MONTHS_HEBREW[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {DAYS_HEBREW.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {generateCalendarDays().map((day, index) => (
                  <button
                    key={index}
                    onClick={() => day.isSelectable ? handleDateSelect(formatDateForAPI(day.date)) : null}
                    disabled={!day.isSelectable}
                    className={`
                      p-3 text-sm rounded-lg transition-all duration-200 relative
                      ${!day.isCurrentMonth ? 'text-gray-300' : ''}
                      ${day.isToday ? 'ring-2 ring-blue-500 font-bold' : ''}
                      ${day.isSelectable
                        ? 'hover:bg-blue-100 cursor-pointer text-gray-900 border-2 border-transparent hover:border-blue-300'
                        : 'cursor-not-allowed text-gray-400'
                      }
                      ${day.isPast && day.isCurrentMonth ? 'bg-gray-100 text-gray-400' : ''}
                      ${day.isAvailable && !day.isPast ? 'bg-green-50 text-green-800' : ''}
                    `}
                  >
                    {day.day}
                    {day.isAvailable && !day.isPast && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep('service')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← חזור
                </button>
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
                    <span>ימים זמינים</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Selection */}
        {step === 'time' && selectedService && selectedDate && (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-4 mb-2">
                <button
                  onClick={() => setStep('service')}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  ← שנה שירות
                </button>
                <button
                  onClick={() => setStep('date')}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  ← שנה תאריך
                </button>
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                בחר שעה
              </CardTitle>
              <div className="bg-blue-50 rounded-lg p-3 inline-block">
                <p className="text-sm text-blue-800">
                  <Calendar className="w-4 h-4 inline ml-1" />
                  {formatDateForDisplay(selectedDate)} • {selectedService.name}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSlots ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">טוען שעות פנויות...</p>
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {availableSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border border-blue-200 hover:border-blue-400 rounded-lg transition-all duration-200 text-blue-800 font-medium hover:shadow-md"
                    >
                      {time}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">אין שעות פנויות בתאריך זה</p>
                  <button
                    onClick={() => setStep('date')}
                    className="mt-3 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    בחר תאריך אחר
                  </button>
                </div>
              )}

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep('date')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← חזור
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Client Details */}
        {step === 'details' && (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-4 mb-2">
                <button
                  onClick={() => setStep('service')}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  ← שנה שירות
                </button>
                <button
                  onClick={() => setStep('time')}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  ← שנה שעה
                </button>
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                פרטים אישיים
              </CardTitle>
              <div className="bg-blue-50 rounded-lg p-3 inline-block">
                <p className="text-sm text-blue-800">
                  <Clock className="w-4 h-4 inline ml-1" />
                  {formatDateForDisplay(selectedDate)} • {selectedTime} • {selectedService?.name}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="client_name">שם מלא *</Label>
                <div className="relative mt-1">
                  <Input
                    id="client_name"
                    value={appointmentRequest.client_name}
                    onChange={(e) => setAppointmentRequest(prev => ({ ...prev, client_name: e.target.value }))}
                    placeholder="הכנס שם מלא"
                    className="pr-10"
                    dir="rtl"
                  />
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div>
                <Label htmlFor="client_phone">מספר טלפון *</Label>
                <div className="relative mt-1">
                  <Input
                    id="client_phone"
                    value={appointmentRequest.client_phone}
                    onChange={(e) => setAppointmentRequest(prev => ({ ...prev, client_phone: e.target.value }))}
                    placeholder="05X-XXXXXXX"
                    className="pr-10"
                    dir="ltr"
                  />
                  <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div>
                <Label htmlFor="note">הערות (אופציונלי)</Label>
                <div className="relative mt-1">
                  <Textarea
                    id="note"
                    value={appointmentRequest.note}
                    onChange={(e) => setAppointmentRequest(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="הערות נוספות לתור..."
                    className="pr-10"
                    dir="rtl"
                    rows={3}
                  />
                  <MessageCircle className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('time')}
                  className="flex-1 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← חזור
                </button>
                <Button
                  onClick={handleDetailsSubmit}
                  disabled={!appointmentRequest.client_name || !appointmentRequest.client_phone || otpSending}
                  className="flex-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {otpSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent ml-2"></div>
                      שולח קוד...
                    </>
                  ) : (
                    'המשך לאימות'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* OTP Verification */}
        {step === 'otp' && (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                אימות טלפון
              </CardTitle>
              <p className="text-gray-600 mt-2">
                שלחנו קוד אימות ל-{appointmentRequest.client_phone}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="otp">קוד אימות (6 ספרות)</Label>
                <Input
                  id="otp"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest"
                  dir="ltr"
                  maxLength={6}
                />
              </div>

              {resendTimer > 0 && (
                <p className="text-sm text-gray-500 text-center">
                  ניתן לשלוח קוד חדש בעוד {resendTimer} שניות
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('details')}
                  className="flex-1 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← חזור
                </button>
                <Button
                  onClick={handleOTPSubmit}
                  disabled={otpCode.length !== 6 || otpVerifying || submitting}
                  className="flex-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {otpVerifying || submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent ml-2"></div>
                      {submitting ? 'שולח בקשה...' : 'מאמת...'}
                    </>
                  ) : (
                    'שלח בקשת תור'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success */}
        {step === 'success' && (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                בקשת התור נשלחה בהצלחה!
              </h2>
              <p className="text-gray-600 mb-6">
                {business?.name} יאשר את התור ויצור איתך קשר בקרוב
              </p>

              <div className="bg-blue-50 rounded-xl p-6 mb-6 text-right">
                <h3 className="font-semibold text-blue-900 mb-3">פרטי התור:</h3>
                <div className="space-y-2 text-blue-800">
                  <p><Calendar className="w-4 h-4 inline ml-2" />{formatDateForDisplay(selectedDate)}</p>
                  <p><Clock className="w-4 h-4 inline ml-2" />{selectedTime}</p>
                  <p><Sparkles className="w-4 h-4 inline ml-2" />{selectedService?.name}</p>
                  <p><User className="w-4 h-4 inline ml-2" />{appointmentRequest.client_name}</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span>המידע שלך מוגן ובטוח</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}