// src/components/dashboard/Header.tsx
'use client';

import { Calendar, Menu, X, Users, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Business, User } from '@/lib/types';
import type { NewAppointmentAlert } from '@/hooks/useRealtime';
import { UserAvatar } from '../ui/UserAvatar';

interface HeaderProps {
  business: Business;
  user?: User | null;
  realtimeConnected?: boolean;
  newAppointmentAlert?: NewAppointmentAlert | null;
  onMenuClick: () => void;
  onDismissAlert?: () => void;
  onUpdateAppointmentStatus?: (appointmentId: string, status: 'confirmed' | 'declined') => void;
}

export const Header = ({
  business,
  user,
  realtimeConnected = false,
  newAppointmentAlert,
  onMenuClick,
  onDismissAlert,
  onUpdateAppointmentStatus
}: HeaderProps) => {
  const router = useRouter();

  return (
    <>
      {/* New Appointment Alert */}
      {newAppointmentAlert && (
        <NewAppointmentAlertComponent
          alert={newAppointmentAlert}
          onDismiss={onDismissAlert}
          onUpdateStatus={onUpdateAppointmentStatus}
        />
      )}

      {/* Main Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto px-6">
          {/* Realtime Connection Indicator */}
          <div className="flex items-center gap-2 py-1">
            <div className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500">
              {realtimeConnected ? 'מחובר' : 'לא מחובר'}
            </span>
          </div>

          {/* Main Header Content */}
          <div className="flex justify-between items-center py-4">
            {/* Left Side - Menu & Business Info */}
            <div className="flex items-center gap-4">
              {/* Menu Button */}
              <button
                onClick={onMenuClick}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 flex items-center gap-2"
                title="ניהול עסק"
              >
                <Menu className="w-5 h-5" />
                <span className="text-sm font-medium hidden md:block">ניהול עסק</span>
              </button>

              {/* Business Logo & Name */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black bg-gradient-to-l from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                    {business.name}
                  </h1>
                  {business.slug && (
                    <p className="text-xs text-gray-500">mytor.app/{business.slug}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - User Profile */}
            <div className="flex items-center gap-4">
              {/* User Profile Button */}
              <button
                onClick={() => router.push('/dashboard/profile')}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-xl p-2 transition-colors"
                title={`פרופיל - ${user?.full_name}`}
              >
                <UserAvatar
                  user={user}
                  size="sm"
                  className="ring-2 ring-blue-100"
                />
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

// ===================================
// 🎉 New Appointment Alert Component
// ===================================

interface NewAppointmentAlertProps {
  alert: NewAppointmentAlert;
  onDismiss?: () => void;
  onUpdateStatus?: (appointmentId: string, status: 'confirmed' | 'declined') => void;
}

const NewAppointmentAlertComponent = ({
  alert,
  onDismiss,
  onUpdateStatus
}: NewAppointmentAlertProps) => {
  const { appointment } = alert;

  return (
    <div className="fixed top-4 left-4 z-50 animate-in slide-in-from-left duration-500">
      <div className="bg-white border-2 border-green-200 rounded-2xl shadow-2xl p-6 min-w-80 max-w-sm">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-bold text-green-800 text-lg">תור חדש! 🎉</h4>
              <p className="text-green-600 text-sm">התקבלה בקשה חדשה</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
            title="סגור הודעה"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Appointment Details */}
        <div className="space-y-2 text-sm mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="font-medium">{appointment.client_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">{appointment.client_phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">
              {new Date(appointment.date).toLocaleDateString('he-IL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })} • {appointment.time}
            </span>
          </div>
          {appointment.note && (
            <div className="mt-2 p-2 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-xs">💬 {appointment.note}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              onUpdateStatus?.(appointment.id, 'confirmed');
              onDismiss?.();
            }}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            אשר
          </button>
          <button
            onClick={() => {
              onUpdateStatus?.(appointment.id, 'declined');
              onDismiss?.();
            }}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            דחה
          </button>
        </div>

        {/* Timestamp */}
        <div className="mt-3 text-xs text-gray-400 text-center">
          התקבל {new Date(alert.timestamp).toLocaleTimeString('he-IL')}
        </div>
      </div>
    </div>
  );
};

export default Header;