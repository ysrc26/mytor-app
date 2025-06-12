// src/app/[appointmentId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Clock, CheckCircle, XCircle, Calendar, User, Phone } from 'lucide-react';

interface AppointmentDetails {
  id: string;
  client_name: string;
  client_phone: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled';
  created_at: string;
  business: {
    name: string;
    phone: string;
  };
  service: {
    name: string;
    duration_minutes: number;
    price?: number;
  } | null;
}

export default function AppointmentPage({
  params
}: {
  params: Promise<{ appointmentId: string }>
}) {
  const [appointmentId, setAppointmentId] = useState<string>('');
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // קבלת ה-params באופן אסינכרוני
  useEffect(() => {
    params.then(({ appointmentId }) => {
      setAppointmentId(appointmentId);
    });
  }, [params]);

  useEffect(() => {
    if (!appointmentId) return;

    const supabase = createClient();
    let isMounted = true; // למניעת state updates אחרי unmount

    // טעינת פרטי התור
    const fetchAppointment = async () => {
      try {
        const response = await fetch(`/api/appointments/${appointmentId}/status`);
        if (!response.ok) {
          if (isMounted) setError('התור לא נמצא או שפג תוקפו');
          return;
        }

        const data = await response.json();
        if (isMounted) setAppointment(data);
      } catch (error) {
        if (isMounted) setError('שגיאה בטעינת פרטי התור');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAppointment();

    // הגדרת Realtime subscription לעדכוני התור
    const channel = supabase
      .channel(`appointment-${appointmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `id=eq.${appointmentId}`
        },
        (payload) => {
          console.log('עדכון סטטוס התור:', payload.new);
          const updatedAppointment = payload.new as any;

          // עדכון רק הסטטוס - לא צריך לטעון הכל מחדש!
          if (isMounted) {
            setAppointment(prev => prev ? {
              ...prev,
              status: updatedAppointment.status
            } : null);
          }

          // אם התור אושר או נדחה, הצג הודעה ואז הפנה
          if (updatedAppointment.status === 'confirmed') {
            setTimeout(() => {
              // אפשר להפנות לעמוד אישור או לסגור
            }, 3000);
          } else if (updatedAppointment.status === 'declined') {
            setTimeout(() => {
              // הפניה לעמוד "התור נדחה"
            }, 3000);
          }
        }
      )
      .subscribe();

    // ניקוי subscription כשהקומפוננט נמחק
    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [appointmentId]);

  // בדיקה אם התור עבר (רק לתורים מאושרים)
  useEffect(() => {
    if (!appointment || appointment.status !== 'confirmed') return;

    const checkIfAppointmentPassed = () => {
      const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
      const now = new Date();

      if (now > appointmentDateTime) {
        router.push('/appointment-completed');
      }
    };

    // בדיקה מיידית
    checkIfAppointmentPassed();

    // בדיקה כל דקה
    const interval = setInterval(checkIfAppointmentPassed, 60000);

    return () => clearInterval(interval);
  }, [appointment?.date, appointment?.time, appointment?.status, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">טוען פרטי התור...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-700 mb-2">שגיאה</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <Clock className="w-4 h-4" />
            ממתין לאישור
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4" />
            מאושר
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4" />
            נדחה
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <XCircle className="w-4 h-4" />
            בוטל
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <XCircle className="w-4 h-4" />
            לא ידוע
          </span>
        );
    }
  };

  // הצגת סטטוס התור
  const getStatusContent = () => {
    switch (appointment.status) {
      case 'pending':
        return {
          icon: <Clock className="w-16 h-16 text-blue-500 animate-pulse" />,
          title: 'בקשת התור שלך התקבלה',
          message: 'התור ממתין לאישור מבעל העסק',
          bgColor: 'from-blue-50 to-white',
          textColor: 'text-blue-700'
        };
      case 'confirmed':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          title: 'התור שלך אושר! 🎉',
          message: 'מחכים לראות אותך בזמן שנקבע',
          bgColor: 'from-green-50 to-white',
          textColor: 'text-green-700'
        };
      case 'declined':
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: 'התור לא אושר',
          message: 'הזמן שביקשת אינו זמין',
          bgColor: 'from-red-50 to-white',
          textColor: 'text-red-700'
        };
      case 'cancelled':
        return {
          icon: <XCircle className="w-16 h-16 text-gray-500" />,
          title: 'התור בוטל',
          message: 'התור בוטל',
          bgColor: 'from-gray-50 to-white',
          textColor: 'text-gray-700'
        };
      default:
        return {
          icon: <XCircle className="w-16 h-16 text-gray-500" />,
          title: 'סטטוס לא ידוע',
          message: 'אנא צור קשר עם בעל העסק',
          bgColor: 'from-gray-50 to-white',
          textColor: 'text-gray-700'
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${statusContent.bgColor} flex items-center justify-center p-4`}>
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* אייקון סטטוס */}
          <div className="mb-6 flex justify-center items-center">
            {statusContent.icon}
          </div>

          {/* כותרת */}
          <h1 className={`text-2xl font-bold mb-2 ${statusContent.textColor}`}>
            {statusContent.title}
          </h1>

          {/* Badge סטטוס */}
          <div className="mb-4 flex justify-center">
            {getStatusBadge(appointment.status)}
          </div>

          {/* הודעה */}
          <p className="text-gray-600 mb-8">
            {statusContent.message}
          </p>

          {/* פרטי התור - מעוצב מחדש */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-right space-y-4">
            <h3 className="font-semibold text-gray-800 mb-4 text-center border-b pb-2">
              פרטי התור
            </h3>

            {/* שם העסק */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">שם העסק:</span>
              <span className="font-medium text-gray-800">{appointment.business.name}</span>
            </div>

            {/* שירות */}
            {appointment.service && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">שירות:</span>
                <span className="font-medium text-gray-800">{appointment.service.name}</span>
              </div>
            )}

            {/* תאריך */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">תאריך:</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-800">{appointment.date}</span>
              </div>
            </div>

            {/* שעה */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">שעה:</span>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-800">{appointment.time}</span>
              </div>
            </div>

            {/* משך זמן */}
            {appointment.service?.duration_minutes && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">משך זמן:</span>
                <span className="font-medium text-gray-800">{appointment.service.duration_minutes} דקות</span>
              </div>
            )}

            {/* לקוח */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">שם הלקוח:</span>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-800">{appointment.client_name}</span>
              </div>
            </div>

            {/* סטטוס התור
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-gray-500 text-sm">סטטוס התור:</span>
              {getStatusBadge(appointment.status)}
            </div> */}
          </div>

          {/* הודעה בזמן אמת */}
          {appointment.status === 'pending' && (
            <div className="text-sm text-gray-500 bg-blue-50 rounded-lg p-3 mb-4">
              <p>🔄 הדף הזה יתעדכן אוטומטי כשהתור יאושר או יידחה</p>
            </div>
          )}

          {/* פרטי יצירת קשר */}
          {appointment.status === 'declined' && (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-gray-600">רוצה לנסות זמן אחר?</p>
              <a
                href={`tel:${appointment.business.phone}`}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                <Phone className="w-4 h-4" />
                התקשר ל{appointment.business.name}
              </a>
            </div>
          )}

          {/* מידע נוסף לתור מאושר */}
          {appointment.status === 'confirmed' && (
            <div className="mt-6 bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">מידע חשוב:</h4>
              <p className="text-green-700 text-sm mb-2">
                📍 כתובת: {appointment.business.name}
              </p>
              <p className="text-green-700 text-sm">
                📞 טלפון: {appointment.business.phone}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}