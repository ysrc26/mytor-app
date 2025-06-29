// src/hooks/useRealtime.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import { showSuccessToast, showInfoToast } from '@/lib/toast-utils';
import type { Appointment } from '@/lib/types';

export interface NewAppointmentAlert {
  appointment: Appointment;
  timestamp: number;
}

export interface UseRealtimeResult {
  // Connection state
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // Alerts
  newAppointmentAlert: NewAppointmentAlert | null;
  
  // Actions
  dismissAlert: () => void;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => void;
  testNotification: () => void;
  
  // Callbacks for external state updates
  onAppointmentCreated?: (appointment: Appointment) => void;
  onAppointmentUpdated?: (appointment: Appointment) => void;
  onAppointmentDeleted?: (appointmentId: string) => void;
}

export interface UseRealtimeOptions {
  enableSound?: boolean;
  enableBrowserNotifications?: boolean;
  alertDuration?: number; // זמן הצגת האלרט במילישניות
  onAppointmentCreated?: (appointment: Appointment) => void;
  onAppointmentUpdated?: (appointment: Appointment) => void;
  onAppointmentDeleted?: (appointmentId: string) => void;
}

/**
 * Custom hook לניהול realtime subscriptions והתראות
 * מטפל בכל האירועים הreal-time של התורים
 */
export const useRealtime = (
  businessId: string,
  userId?: string,
  options: UseRealtimeOptions = {}
): UseRealtimeResult => {
  const {
    enableSound = true,
    enableBrowserNotifications = true,
    alertDuration = 60000,
    onAppointmentCreated,
    onAppointmentUpdated,
    onAppointmentDeleted
  } = options;

  // ===================================
  // 🎯 State Management
  // ===================================
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [newAppointmentAlert, setNewAppointmentAlert] = useState<NewAppointmentAlert | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const subscriptionRef = useRef<any>(null);
  const supabase = createClient();

  // ===================================
  // 🔊 Notification Functions
  // ===================================

  /**
   * השמעת צליל התראה
   */
  const playNotificationSound = useCallback(() => {
    if (!enableSound) return;

    try {
      // צליל פשוט מ-data URL
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAUCU+h7fG1aRUILXzN8rNjGgU+ldbywHkpBTKCz/LKdSsFK3fJ8N2QQAoRZrDq7qhWFAxPn+HyvmATE0ek6fG3bBoCNX7K8L9oGQU2jdH0xn8tBSpzxPDVjD0IFWi56+WjTwwNUajh8bBjFgY7k9n1vnEpBTJ9yvK9YhUJOIbO8sN1JwU2hdPyvmYdBi6Bz/PAaiUEOYPL9dpzJAUmcsDy2I4+CRVptuvmnUkLDF2o4PK2YxYGOpPZ9b9xKQU0fcP1wGIVCTmGzPLEeTEHL3fH8N+OQAoPZLTo65pTEgxMpOPwtGITB0CT1/W9cSgEOoXQ9L9qGgUtgM7ywHAjBS5/z/LDdygCOpHI9t5zJgQoer7y3I4/CRZqtevmoU4LDF2o4PKxYRUHPJDY9r9xKAU7fMr1wGMTCziGzPLEeCsLL3bH8N2OQAoOZLTo65pTEgxNpOPxs2ETB0GT1/W9cSgEOoXQ9L9qGgYtgM7ywHAjBS5/z/LDdygCPJHI9t5zJgUpeb7y3I4/CRZqtevmoU4LDF2o4PKxYRUHP5DY9r9xKAU7fMr1wGMTCzqGzPLEeCsLL3bH8N2OQAoOZLTo65pTEgxNpOPxs2ETB0GT1/W9cSgEOoXQ9L9qGgYtgM7ywHAjBS5/z/LDdygCO5HI9t5zJgUpeb7y3I4/CRZqtevmoU4LDF2o4PKxYRUHP5DY9r9xKAU7fMr1wGMTCzqGzPLEeCsLL3bH8N2OQAoOZLTo65pTEgxNpOPxs2ETB0GT1/W9cSgEOoXQ9L9qGgYtgM7ywHAjBS5/z/LDdygCO5HI9t5zJgUpeb7y3I4/CRZqtevmoU4LDh');
      audio.volume = 0.3;
      audio.play().catch(() => {
        console.log('🔇 Could not play notification sound');
      });
    } catch (error) {
      console.log('🔇 Notification sound not available:', error);
    }
  }, [enableSound]);

  /**
   * הצגת Browser notification
   */
  const showBrowserNotification = useCallback((appointment: Appointment) => {
    if (!enableBrowserNotifications || !notificationsEnabled) return;

    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('🎯 תור חדש!', {
          body: `${appointment.client_name} ביקש תור`,
          icon: '/favicon.ico',
          tag: 'new-appointment',
          requireInteraction: true,
          data: { appointmentId: appointment.id }
        });

        // סגירה אוטומטית אחרי 10 שניות
        setTimeout(() => {
          notification.close();
        }, 10000);

        // הוספת event listeners
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    } catch (error) {
      console.log('📱 Browser notification not available:', error);
    }
  }, [enableBrowserNotifications, notificationsEnabled]);

  // ===================================
  // 🔗 Realtime Subscription Management
  // ===================================

  /**
   * הגדרת subscription לchanges בתורים
   */
  const setupRealtimeSubscription = useCallback(() => {
    if (!businessId || !userId) {
      console.log('⚠️ Missing businessId or userId for realtime subscription');
      return;
    }

    console.log('🔗 Setting up realtime subscription for business:', businessId);
    setConnectionStatus('connecting');

    // ניקוי subscription קודם אם קיים
    if (subscriptionRef.current) {
      console.log('🧹 Cleaning up previous subscription');
      supabase.removeChannel(subscriptionRef.current);
    }

    // יצירת subscription חדש
    const channel = supabase
      .channel(`business-${businessId}-appointments`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          console.log('🎉 New appointment received!', payload.new);
          const newAppointment = payload.new as Appointment;

          // הצגת אלרט
          setNewAppointmentAlert({
            appointment: newAppointment,
            timestamp: Date.now()
          });

          // הסתרת האלרט אחרי הזמן שנקבע
          setTimeout(() => {
            setNewAppointmentAlert(null);
          }, alertDuration);

          // השמעת צליל
          playNotificationSound();

          // הצגת browser notification
          showBrowserNotification(newAppointment);

          // הצגת Toast
          showSuccessToast(`תור חדש מ-${newAppointment.client_name}`, {
            duration: 5000
          });

          // קריאה לcallback חיצוני
          onAppointmentCreated?.(newAppointment);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          console.log('📝 Appointment updated!', payload.new);
          const updatedAppointment = payload.new as Appointment;

          showInfoToast('תור עודכן', { duration: 3000 });
          
          // קריאה לcallback חיצוני
          onAppointmentUpdated?.(updatedAppointment);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'appointments',
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          console.log('🗑️ Appointment deleted!', payload.old);
          const deletedId = payload.old.id;

          showInfoToast('תור נמחק', { duration: 3000 });
          
          // קריאה לcallback חיצוני
          onAppointmentDeleted?.(deletedId);
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
        
        switch (status) {
          case 'SUBSCRIBED':
            setIsConnected(true);
            setConnectionStatus('connected');
            break;
          case 'CHANNEL_ERROR':
          case 'TIMED_OUT':
            setIsConnected(false);
            setConnectionStatus('error');
            break;
          case 'CLOSED':
            setIsConnected(false);
            setConnectionStatus('disconnected');
            break;
          default:
            setConnectionStatus('connecting');
        }
      });

    subscriptionRef.current = channel;
  }, [businessId, userId, alertDuration, playNotificationSound, showBrowserNotification, onAppointmentCreated, onAppointmentUpdated, onAppointmentDeleted]);

  /**
   * הגדרת subscription בתחילת החיים של הcomponent
   */
  useEffect(() => {
    if (businessId && userId) {
      setupRealtimeSubscription();
    }

    // ניקוי subscription כשהקומפוננט נמחק או המזהים משתנים
    return () => {
      console.log('🧹 Cleaning up realtime subscription');
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [businessId, userId, setupRealtimeSubscription]);

  // ===================================
  // 🔔 Notification Permissions
  // ===================================

  /**
   * בקשת הרשאות browser notifications
   */
  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('📱 Browser notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const enabled = permission === 'granted';
      
      setNotificationsEnabled(enabled);
      
      if (enabled) {
        showSuccessToast('התראות הופעלו בהצלחה');
        console.log('✅ Browser notifications enabled');
      } else {
        showInfoToast('התראות לא הופעלו');
        console.log('❌ Browser notifications denied');
      }
      
      return enabled;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  /**
   * ביטול הרשאות notifications
   */
  const disableNotifications = useCallback(() => {
    setNotificationsEnabled(false);
    showInfoToast('התראות בוטלו');
    console.log('🔕 Browser notifications disabled');
  }, []);

  /**
   * בדיקת הרשאות קיימות בטעינה
   */
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // ===================================
  // 🛠️ Utility Functions
  // ===================================

  /**
   * סגירת אלרט על תור חדש
   */
  const dismissAlert = useCallback(() => {
    setNewAppointmentAlert(null);
  }, []);

  /**
   * בדיקת התראה לבדיקה
   */
  const testNotification = useCallback(() => {
    const testAppointment: Appointment = {
      id: 'test',
      client_name: 'לקוח לדוגמה',
      client_phone: '0501234567',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      status: 'pending',
      business_id: businessId,
      user_id: userId || '',
      service_id: '',
      note: undefined,
      client_verified: true,
      created_at: new Date().toISOString()
    };

    // הצגת אלרט בדיקה
    setNewAppointmentAlert({
      appointment: testAppointment,
      timestamp: Date.now()
    });

    // השמעת צליל
    playNotificationSound();

    // הצגת browser notification
    showBrowserNotification(testAppointment);

    // הסתרה אחרי 5 שניות
    setTimeout(() => {
      setNewAppointmentAlert(null);
    }, 5000);

    showSuccessToast('התראת בדיקה נשלחה');
  }, [businessId, userId, playNotificationSound, showBrowserNotification]);

  // ===================================
  // 📊 Return Hook Result
  // ===================================

  return {
    // Connection state
    isConnected,
    connectionStatus,
    
    // Alerts
    newAppointmentAlert,
    
    // Actions
    dismissAlert,
    enableNotifications,
    disableNotifications,
    testNotification,
    
    // Callbacks (passed through from options)
    onAppointmentCreated,
    onAppointmentUpdated,
    onAppointmentDeleted
  };
};

// ===================================
// 🎯 Additional Helper Hooks
// ===================================

/**
 * Hook פשוט יותר רק למצב החיבור
 */
export const useRealtimeConnection = (businessId: string, userId?: string) => {
  const { isConnected, connectionStatus } = useRealtime(businessId, userId, {
    enableSound: false,
    enableBrowserNotifications: false
  });

  return {
    isConnected,
    connectionStatus
  };
};

/**
 * Hook רק להתראות בלי realtime
 */
export const useNotifications = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;

    try {
      const permission = await Notification.requestPermission();
      const enabled = permission === 'granted';
      setNotificationsEnabled(enabled);
      return enabled;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  const disableNotifications = useCallback(() => {
    setNotificationsEnabled(false);
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  return {
    notificationsEnabled,
    enableNotifications,
    disableNotifications
  };
};