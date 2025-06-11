// src/app/[slug]/page.tsx
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BusinessBooking from '@/components/ui/BusinessBooking';
import { Calendar, Clock, Phone, User, MessageCircle, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { User as UserType, Availability, Business, Service } from '@/lib/types';

interface BusinessPageData {
  business: Business;
  availability: Availability[];
  services: Service[];
}

interface AppointmentRequest {
  client_name: string;
  client_phone: string;
  date: string;
  time: string;
  note?: string;
}

interface OTPStep {
  phone: string;
  code: string;
}

const DAYS_HEBREW = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export default function BusinessPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [businessData, setBusinessData] = useState<BusinessPageData | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // בקשת תור
  const [appointmentRequest, setAppointmentRequest] = useState<AppointmentRequest>({
    client_name: '',
    client_phone: '',
    date: '',
    time: '',
    note: ''
  });

  // OTP
  const [otpStep, setOtpStep] = useState<OTPStep>({ phone: '', code: '' });
  const [showOTP, setShowOTP] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  // מצבים
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // טעינת נתוני העסק
  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        const response = await fetch(`/api/public/${slug}`);
        if (!response.ok) {
          throw new Error('עסק לא נמצא');
        }
        const data = await response.json();
        setBusinessData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBusinessData();
    }
  }, [slug]);

  // יצירת רשימת זמנים זמינים
  const getAvailableSlots = () => {
    if (!businessData?.availability) return [];

    const slots: { day: string, dayNum: number, times: string[] }[] = [];

    businessData.availability
      .filter(avail => avail.is_active)
      .forEach(avail => {
        const times: string[] = [];
        const start = parseTime(avail.start_time);
        const end = parseTime(avail.end_time);

        // יצירת משבצות של 30 דקות
        for (let hour = start.hour; hour < end.hour || (hour === end.hour && start.minute < end.minute); hour++) {
          for (let minute = (hour === start.hour ? start.minute : 0); minute < 60; minute += 30) {
            if (hour === end.hour && minute >= end.minute) break;
            times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
          }
        }

        slots.push({
          day: DAYS_HEBREW[avail.day_of_week],
          dayNum: avail.day_of_week,
          times
        });
      });

    return slots.sort((a, b) => a.dayNum - b.dayNum);
  };

  // פונקציה להצגת משך השירות בטקסט ידידותי
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} דקות`;
    if (minutes % 60 === 0) {
      const hours = minutes / 60;
      return hours === 1 ? 'שעה' : `${hours} שעות`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours === 1 ? `שעה ו${remainingMinutes} דקות` : `${hours} שעות ו${remainingMinutes} דקות`;
  };

  const parseTime = (timeStr: string) => {
    const [hour, minute] = timeStr.split(':').map(Number);
    return { hour, minute };
  };

  // שליחת קוד OTP
  const sendOTP = async (method: 'sms' | 'call' = 'sms') => {
    setOtpSending(true);
    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: appointmentRequest.client_phone,
          method
        })
      });

      if (!response.ok) {
        throw new Error('שגיאה בשליחת קוד האימות');
      }

      setOtpStep({ ...otpStep, phone: appointmentRequest.client_phone });
      setShowOTP(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשליחת קוד');
    } finally {
      setOtpSending(false);
    }
  };

  // אימות קוד OTP
  const verifyOTP = async () => {
    setOtpVerifying(true);
    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: otpStep.phone,
          code: otpStep.code
        })
      });

      const result = await response.json();
      if (!result.verified) {
        throw new Error('קוד שגוי');
      }

      // שליחת בקשת התור לאחר אימות
      await submitAppointment();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה באימות');
    } finally {
      setOtpVerifying(false);
    }
  };

  // שליחת בקשת תור
  const submitAppointment = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/appointments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          service_id: selectedService?.id,
          ...appointmentRequest
        })
      });

      if (!response.ok) {
        throw new Error('שגיאה בשליחת הבקשה');
      }

      setSuccess(true);
      setDialogOpen(false);

      // איפוס הטופס
      setAppointmentRequest({
        client_name: '',
        client_phone: '',
        date: '',
        time: '',
        note: ''
      });
      setShowOTP(false);
      setOtpStep({ phone: '', code: '' });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשליחת הבקשה');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // בדיקת שדות חובה
    if (!appointmentRequest.client_name || !appointmentRequest.client_phone ||
      !appointmentRequest.date || !appointmentRequest.time) {
      setError('יש למלא את כל השדות הנדרשים');
      return;
    }

    // אם עוד לא נשלח OTP, שולחים אותו
    if (!showOTP) {
      await sendOTP();
    } else {
      // אחרת מאמתים את הקוד
      await verifyOTP();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (error && !businessData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">עסק לא נמצא</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!businessData) return null;

  const availableSlots = getAvailableSlots();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* הצלחה */}
      {success && (
        <Alert className="mx-4 mt-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            בקשתך נשלחה בהצלחה! בעל העסק יצור איתך קשר בקרוב.
          </AlertDescription>
        </Alert>
      )}

      {/* שגיאות */}
      {error && (
        <Alert className="mx-4 mt-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* כרטיס פרטי העסק */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4 space-x-reverse">
              <Avatar className="h-16 w-16">
                <AvatarImage src={businessData.business.profile_pic} />
                <AvatarFallback className="text-xl">
                  {businessData.business.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {businessData.business.name}
              </h1>

              {businessData.business.description && (
                <p className="text-gray-600 mb-3 leading-relaxed">
                  {businessData.business.description}
                </p>
              )}

              <div className="flex items-center text-gray-500 mb-4">
                <Phone className="h-4 w-4 ml-2" />
                <span className="font-hebrew">{businessData.business.phone}</span>
              </div>

              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                <Calendar className="h-3 w-3 ml-1" />
                זמין לתורים
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* שירותים */}
        {businessData.services && businessData.services.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 ml-2" />
                השירותים שלנו
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {businessData.services.map((service) => (
                  <div
                    key={service.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedService?.id === service.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                      }`}
                    onClick={() => setSelectedService(
                      selectedService?.id === service.id ? null : service
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{service.name}</h4>
                      {service.price && (
                        <span className="font-bold text-blue-600">₪{service.price}</span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDuration(service.duration_minutes)}</span>
                      {selectedService?.id === service.id && (
                        <span className="text-blue-600 font-medium">✓ נבחר</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {selectedService && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>נבחר:</strong> {selectedService.name}
                    {selectedService.price && ` (₪${selectedService.price})`}
                    {` - ${formatDuration(selectedService.duration_minutes)}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {/* זמני פעילות */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 ml-2" />
              שעות פעילות
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableSlots.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                אין זמנים זמינים כרגע
              </p>
            ) : (
              <div className="space-y-3">
                {availableSlots.map((slot, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="font-medium text-gray-900">{slot.day}</span>
                    <div className="flex flex-wrap gap-2">
                      {slot.times.slice(0, 3).map((time, timeIndex) => (
                        <Badge key={timeIndex} variant="outline" className="text-xs">
                          {time}
                        </Badge>
                      ))}
                      {slot.times.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{slot.times.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* כפתור בקשת תור - עם מודל BusinessBooking */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium"
              disabled={availableSlots.length === 0}
            >
              <MessageCircle className="h-5 w-5 ml-2" />
              {selectedService ? `בקש תור ל${selectedService.name}` : 'בקש תור'}
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>בקשת תור ב{businessData.business.name}</DialogTitle>
              <DialogDescription>
                {selectedService
                  ? `בחר תאריך ושעה לשירות ${selectedService.name}`
                  : 'בחר שירות, תאריך ושעה'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <BusinessBooking
                businessSlug={businessData.business.slug}
                businessName={businessData.business.name}
                services={selectedService ? [selectedService] : businessData.services}
                availability={businessData.availability}
                businessTerms={businessData.business.terms}
                onClose={() => setDialogOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div >
  );
}