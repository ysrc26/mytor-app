// src/components/dashboard/PendingAppointments.tsx
'use client';

import { useState } from 'react';
import { Clock, Users, Phone, Calendar, CheckCircle, AlertCircle, Copy, MessageCircle, Sparkles } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
import type { Appointment, Business } from '@/lib/types';

interface PendingAppointmentsProps {
  appointments: Appointment[];
  business: Business;
  loading?: boolean;
  onUpdateStatus: (appointmentId: string, status: 'confirmed' | 'declined' | 'cancelled') => Promise<void>;
  onCopyPublicLink?: () => void;
}

export const PendingAppointments = ({
  appointments,
  business,
  loading = false,
  onUpdateStatus,
  onCopyPublicLink
}: PendingAppointmentsProps) => {
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // Filter only pending appointments
  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');

  const handleStatusUpdate = async (appointmentId: string, status: 'confirmed' | 'declined') => {
    if (updatingIds.has(appointmentId)) return;

    try {
      setUpdatingIds(prev => new Set(prev).add(appointmentId));
      await onUpdateStatus(appointmentId, status);
    } catch (error) {
      showErrorToast('שגיאה בעדכון סטטוס התור');
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const isAppointmentToday = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  const isAppointmentTomorrow = (date: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date === tomorrow.toISOString().split('T')[0];
  };

  if (loading) {
    return <PendingAppointmentsSkeleton />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">תורים ממתינים לאישור</h3>
          <p className="text-gray-600 text-sm mt-1">
            {pendingAppointments.length > 0 
              ? `${pendingAppointments.length} בקשות ממתינות לטיפול`
              : 'כל הבקשות החדשות יופיעו כאן'
            }
          </p>
        </div>

        {/* Quick Stats */}
        {pendingAppointments.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {pendingAppointments.filter(apt => isAppointmentToday(apt.date)).length}
              </div>
              <div className="text-xs text-gray-500">להיום</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {pendingAppointments.filter(apt => isAppointmentTomorrow(apt.date)).length}
              </div>
              <div className="text-xs text-gray-500">למחר</div>
            </div>
          </div>
        )}
      </div>

      {pendingAppointments.length === 0 ? (
        <EmptyPendingState 
          business={business}
          onCopyPublicLink={onCopyPublicLink}
        />
      ) : (
        <div className="space-y-4">
          {pendingAppointments.map((appointment) => (
            <PendingAppointmentCard
              key={appointment.id}
              appointment={appointment}
              isUpdating={updatingIds.has(appointment.id)}
              onUpdateStatus={handleStatusUpdate}
            />
          ))}

          {/* Summary Stats */}
          <PendingSummaryCard 
            appointments={pendingAppointments}
          />
        </div>
      )}
    </div>
  );
};

// ===================================
// 🎯 Individual Pending Appointment Card
// ===================================

interface PendingAppointmentCardProps {
  appointment: Appointment;
  isUpdating: boolean;
  onUpdateStatus: (appointmentId: string, status: 'confirmed' | 'declined') => void;
}

const PendingAppointmentCard = ({
  appointment,
  isUpdating,
  onUpdateStatus
}: PendingAppointmentCardProps) => {
  const [copied, setCopied] = useState(false);
  
  const isToday = new Date().toISOString().split('T')[0] === appointment.date;
  const isTomorrow = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return appointment.date === tomorrow.toISOString().split('T')[0];
  })();

  const copyClientPhone = async () => {
    try {
      await navigator.clipboard.writeText(appointment.client_phone);
      setCopied(true);
      showSuccessToast('מספר טלפון הועתק');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showErrorToast('שגיאה בהעתקת מספר הטלפון');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  return (
    <div className={`
      bg-white border-2 rounded-2xl p-6 shadow-sm transition-all duration-200 hover:shadow-md
      ${isToday ? 'border-orange-200 bg-orange-50/30' : 
        isTomorrow ? 'border-blue-200 bg-blue-50/30' : 
        'border-gray-200'
      }
    `}>
      <div className="flex items-start justify-between">
        {/* Left Side - Appointment Info */}
        <div className="flex items-center gap-4 flex-1">
          {/* Status Icon */}
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>

          {/* Appointment Details */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h5 className="font-semibold text-gray-900 text-lg">{appointment.client_name}</h5>
              
              {/* Time Badges */}
              {isToday && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                  🔥 היום
                </span>
              )}
              {isTomorrow && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  📅 מחר
                </span>
              )}
            </div>

            <div className="space-y-1 text-sm">
              {/* Phone */}
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{appointment.client_phone}</span>
                <button
                  onClick={copyClientPhone}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="העתק מספר טלפון"
                >
                  {copied ? <CheckCircle className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-400" />}
                </button>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{formatDate(appointment.date)} • ⏰ {appointment.time}</span>
              </div>

              {/* Service */}
              {(appointment as any).services?.name && (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gray-500" />
                  <span className="text-blue-600 font-medium">🎯 {(appointment as any).services.name}</span>
                </div>
              )}

              {/* Note */}
              {appointment.note && (
                <div className="flex items-start gap-2 mt-2">
                  <MessageCircle className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="bg-gray-50 p-2 rounded-lg max-w-md">
                    <p className="text-gray-600 text-sm">💬 {appointment.note}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Created timestamp */}
            <div className="mt-3 text-xs text-gray-400">
              נתקבל {new Date(appointment.created_at).toLocaleString('he-IL')}
            </div>
          </div>
        </div>

        {/* Right Side - Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onUpdateStatus(appointment.id, 'confirmed')}
            disabled={isUpdating}
            className="px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#DBFCE7' }}
            onMouseEnter={(e) => !isUpdating && (e.currentTarget.style.backgroundColor = '#BBF7D0')}
            onMouseLeave={(e) => !isUpdating && (e.currentTarget.style.backgroundColor = '#DBFCE7')}
          >
            {isUpdating ? (
              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            אשר
          </button>
          
          <button
            onClick={() => onUpdateStatus(appointment.id, 'declined')}
            disabled={isUpdating}
            className="px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#FFE2E1' }}
            onMouseEnter={(e) => !isUpdating && (e.currentTarget.style.backgroundColor = '#FECACA')}
            onMouseLeave={(e) => !isUpdating && (e.currentTarget.style.backgroundColor = '#FFE2E1')}
          >
            {isUpdating ? (
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            דחה
          </button>
        </div>
      </div>
    </div>
  );
};

// ===================================
// 📊 Pending Summary Card
// ===================================

const PendingSummaryCard = ({ appointments }: { appointments: Appointment[] }) => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const todayCount = appointments.filter(apt => apt.date === today).length;
  const tomorrowCount = appointments.filter(apt => apt.date === tomorrowStr).length;
  const futureCount = appointments.filter(apt => apt.date > tomorrowStr).length;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mt-6">
      <div className="flex items-center gap-3 mb-4">
        <Clock className="w-6 h-6 text-yellow-600" />
        <div>
          <p className="font-semibold text-yellow-800 text-lg">
            {appointments.length} בקשות ממתינות לטיפול
          </p>
          <p className="text-yellow-700 text-sm">
            זכור לטפל בבקשות במהירות כדי לשמור על חוויה טובה ללקוחות
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{todayCount}</div>
          <div className="text-sm text-orange-700">להיום</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{tomorrowCount}</div>
          <div className="text-sm text-blue-700">למחר</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{futureCount}</div>
          <div className="text-sm text-purple-700">עתידיים</div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mt-4 p-3 bg-yellow-100 rounded-xl">
        <h6 className="font-medium text-yellow-900 mb-2">💡 טיפים מהירים:</h6>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• השב לבקשות תוך 2-4 שעות לחוויה מיטבית</li>
          <li>• תורים להיום ומחר דורשים תשובה דחופה</li>
          <li>• תוכל ליצור קשר ישירות עם הלקוח דרך הטלפון</li>
        </ul>
      </div>
    </div>
  );
};

// ===================================
// 🌟 Empty State Component
// ===================================

interface EmptyPendingStateProps {
  business: Business;
  onCopyPublicLink?: () => void;
}

const EmptyPendingState = ({ business, onCopyPublicLink }: EmptyPendingStateProps) => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-white" />
      </div>
      
      <h4 className="text-lg font-semibold text-gray-900 mb-2">מצוין! אין בקשות ממתינות</h4>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        כל הבקשות החדשות יופיעו כאן לאישור או דחייה. 
        שתף את הקישור הציבורי שלך כדי שלקוחות יוכלו להזמין תורים.
      </p>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onCopyPublicLink}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center"
        >
          <Copy className="w-4 h-4" />
          העתק קישור ציבורי
        </button>
        
        <button
          onClick={() => window.open(`/${business.slug}`, '_blank')}
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-2xl font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2 justify-center"
        >
          <Calendar className="w-4 h-4" />
          צפה בעמוד הציבורי
        </button>
      </div>

      {/* Tips */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-2xl max-w-md mx-auto">
        <h5 className="font-semibold text-blue-900 mb-2">💡 כדי לקבל יותר תורים:</h5>
        <ul className="text-blue-800 text-sm space-y-1 text-right">
          <li>📱 שתף את הקישור ברשתות החברתיות</li>
          <li>💬 שלח ללקוחות קיימים בוואטסאפ</li>
          <li>📧 הוסף לחתימת האימייל שלך</li>
          <li>🎯 הדפס ותלה בעסק</li>
        </ul>
      </div>
    </div>
  );
};

// ===================================
// 💀 Loading Skeleton
// ===================================

const PendingAppointmentsSkeleton = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border-2 border-gray-200 rounded-2xl p-6 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                    <div className="h-4 bg-gray-200 rounded w-40"></div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-16 h-8 bg-gray-200 rounded-xl"></div>
                <div className="w-16 h-8 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingAppointments;