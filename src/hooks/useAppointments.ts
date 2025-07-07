// src/hooks/useAppointments.ts
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BusinessAPI } from '@/lib/business-api';
import { checkBusinessOwnerConflicts, isAppointmentEditable } from '@/lib/appointment-utils';
import { showErrorToast, showSuccessToast, showWarningToast } from '@/lib/toast-utils';
import type { Appointment, Service } from '@/lib/types';
import { timeUtils } from '@/lib/time-utils';

export interface UseAppointmentsFilters {
  status?: 'all' | 'pending' | 'confirmed' | 'declined' | 'cancelled';
  date?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  serviceId?: string;
}

export interface CreateAppointmentData {
  client_name: string;
  client_phone: string;
  service_id?: string;
  custom_service_name?: string;
  duration_minutes?: number;
  date: string;
  time: string;
  note?: string;
  status?: 'pending' | 'confirmed';
}

export interface UseAppointmentsResult {
  // Data
  appointments: Appointment[];
  filteredAppointments: Appointment[];

  // Computed data
  pendingCount: number;
  confirmedCount: number;
  totalCount: number;
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];

  // States
  loading: boolean;
  updating: boolean;
  error: string | null;
  loadingMore: boolean;
  pagination: {
    current_page: number;
    limit: number;
    total_count: number;
    total_pages: number;
    has_more: boolean;
  };
  dateRange: { start?: string; end?: string };

  // Filters
  filters: UseAppointmentsFilters;
  setFilters: (filters: UseAppointmentsFilters) => void;
  clearFilters: () => void;

  // Actions
  loadAppointments: (filters?: UseAppointmentsFilters) => Promise<void>;
  loadMoreAppointments: () => Promise<void>;
  loadPreviousMonth: () => Promise<void>;
  getDefaultDateRange: () => { start: string; end: string };
  setDateRangeAndLoad: (start?: string, end?: string) => Promise<void>;
  createAppointment: (data: CreateAppointmentData) => Promise<Appointment | null>;
  updateAppointmentStatus: (appointmentId: string, status: 'confirmed' | 'declined' | 'cancelled') => Promise<void>;
  updateAppointment: (appointmentId: string, data: { date?: string; time?: string; service_id?: string }) => Promise<void>;
  checkConflicts: (serviceId: string, date: string, time: string, excludeId?: string) => Promise<{ hasConflict: boolean; error?: string }>;
  refreshAppointments: () => Promise<void>;
  clearError: () => void;
  clearCache: () => void;

  // Utilities
  isAppointmentPast: (appointment: Appointment) => boolean;
  isAppointmentToday: (appointment: Appointment) => boolean;
  canEditAppointment: (appointment: Appointment) => boolean;

  // API instance
  api: BusinessAPI;
}

/**
 * Custom hook לניהול תורים - כל הפעולות על תורים במקום אחד
 */
export const useAppointments = (businessId: string, services: Service[] = []): UseAppointmentsResult => {
  // ===================================
  // 🎯 State Management
  // ===================================
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UseAppointmentsFilters>({ status: 'all' });
  const [pagination, setPagination] = useState({
    current_page: 1,
    limit: 50,
    total_count: 0,
    total_pages: 0,
    has_more: false
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [cache, setCache] = useState<Map<string, {
    appointments: Appointment[];
    timestamp: number;
    pagination: any;
  }>>(new Map());
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // יצירת API instance
  const api = useMemo(() => new BusinessAPI(businessId), [businessId]);

  // ===================================
  // 🔄 Data Loading Functions
  // ===================================

  const getDefaultDateRange = useCallback(() => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    return {
      start: today.toISOString().split('T')[0],
      end: nextMonth.toISOString().split('T')[0]
    };
  }, []);

  /**
   * טעינת תורים עם פילטרים
   */
  const loadAppointments = useCallback(async (queryFilters?: UseAppointmentsFilters) => {
    if (!businessId) return;

    try {
      setLoading(true);
      setError(null);

      const filtersToUse = queryFilters || filters;
      const cacheKey = `${filtersToUse.status || 'all'}_${dateRange.start || ''}_${dateRange.end || ''}`;
      const cachedData = cache.get(cacheKey);
      const now = Date.now();

      console.log('🔄 Loading appointments with filters:', filtersToUse);

      // בדוק אם יש מטמון תקף (פחות משעה)
      if (cachedData && (now - cachedData.timestamp) < 3600000) {
        console.log('🎯 Using cached data for:', cacheKey);
        setAppointments(cachedData.appointments);
        setPagination(cachedData.pagination);
        setLoading(false);
        return;
      }

      // הכנת פרמטרים לAPI
      const apiFilters: any = {};
      if (filtersToUse.date) apiFilters.date = filtersToUse.date;
      if (filtersToUse.status && filtersToUse.status !== 'all') {
        apiFilters.status = filtersToUse.status;
      }

      const response = await api.fetchAppointments({
        start_date: dateRange.start,
        end_date: dateRange.end,
        page: 1, // Reset to first page
        limit: 50,
        include_past: false,
        ...apiFilters
      });

      setAppointments(response.appointments);
      setPagination(response.pagination);

      setCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, {
          appointments: response.appointments,
          timestamp: now,
          pagination: response.pagination
        });

        // ניקוי מטמון ישן (יותר מ-2 שעות)
        for (const [key, value] of newCache.entries()) {
          if (now - value.timestamp > 7200000) {
            newCache.delete(key);
          }
        }

        return newCache;
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בטעינת תורים';
      setError(errorMessage);
      showErrorToast(errorMessage);
      console.error('❌ Error loading appointments:', err);

    } finally {
      setLoading(false);
    }
  }, [businessId, filters, api]);

  // שמור reference לפונקציה כדי שלא תשתנה
  const loadAppointmentsRef = useRef(loadAppointments);
  loadAppointmentsRef.current = loadAppointments;

  /**
   * טעינה ראשונית
   */
  useEffect(() => {
    if (businessId) {
      loadAppointmentsRef.current();
    }
  }, [businessId]); // רק businessId, לא loadAppointments!

  // הוסף useEffect נוסף:
  useEffect(() => {
    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
    };
  }, [autoRefreshInterval]);

  // הוסף useEffect חדש אחרי הקיים:
  useEffect(() => {
    // בדוק אם יש תורים של היום בטווח הנוכחי
    const today = new Date().toISOString().split('T')[0];
    const hasTodayInRange = (!dateRange.start || dateRange.start <= today) &&
      (!dateRange.end || dateRange.end >= today);

    if (hasTodayInRange) {
      // הגדר רענון כל שעה
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing today appointments');
        loadAppointments();
      }, 3600000); // כל שעה

      setAutoRefreshInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      // נקה רענון אם אין תורים של היום
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        setAutoRefreshInterval(null);
      }
    }
  }, [dateRange]);

  // ===================================
  // 📊 Computed Values
  // ===================================

  /**
   * תורים מפולטרים לפי הקריטריונים הנוכחיים
   */
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];

    // פילטר לפי סטטוס
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(apt => apt.status === filters.status);
    }

    // פילטר לפי טווח תאריכים
    if (filters.dateRange) {
      filtered = filtered.filter(apt =>
        apt.date >= filters.dateRange!.start && apt.date <= filters.dateRange!.end
      );
    }

    // פילטר לפי שירות
    if (filters.serviceId) {
      filtered = filtered.filter(apt => apt.service_id === filters.serviceId);
    }

    // מיון לפי תאריך ושעה
    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.start_time}`);
      const dateB = new Date(`${b.date} ${b.start_time}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [appointments, filters]);

  /**
   * סטטיסטיקות מחושבות
   */
  const pendingCount = useMemo(() =>
    appointments.filter(apt => apt.status === 'pending').length,
    [appointments]
  );

  const confirmedCount = useMemo(() =>
    appointments.filter(apt => apt.status === 'confirmed').length,
    [appointments]
  );

  const totalCount = appointments.length;

  /**
   * תורים להיום
   */
  const todayAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === today && apt.status === 'confirmed');
  }, [appointments]);

  /**
   * תורים קרובים (שבוע הקרוב)
   */
  const upcomingAppointments = useMemo(() => {
    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);

    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= today &&
        aptDate <= weekFromNow &&
        apt.status === 'confirmed';
    });
  }, [appointments]);

  // ===================================
  // 📝 CRUD Operations
  // ===================================

  /**
   * יצירת תור חדש
   */
  const createAppointment = useCallback(async (data: CreateAppointmentData): Promise<Appointment | null> => {
    try {
      setUpdating(true);
      setError(null);

      console.log('🔄 Creating appointment:', data);

      // 🚫 הסר את הvalidation הכפול מכאן - יש כבר ב-API!
      // if (data.service_id) {
      //   const conflictCheck = await checkBusinessOwnerConflicts(...);
      // }

      const newAppointment = await api.createAppointment(data);

      // רק אם הצליח - עדכן state
      setAppointments(prev => [newAppointment, ...prev]);

      // ✅ הטוסט יוצג רק כאן
      showSuccessToast('התור נוצר בהצלחה');
      console.log('✅ Appointment created successfully');

      return newAppointment;

    } catch (err: any) {
      // ✅ הטוסט שגיאה יוצג רק כאן
      const errorMessage = err.response?.data?.error || err.message || 'שגיאה ביצירת התור';
      setError(errorMessage);
      showErrorToast(errorMessage);
      console.error('❌ Error creating appointment:', err);

      // ✅ זרוק שגיאה כדי שהמודאל לא יסגר
      throw new Error(errorMessage);

    } finally {
      setUpdating(false);
    }
  }, [businessId, api]);

  /**
   * עדכון סטטוס תור
   */
  const updateAppointmentStatus = useCallback(async (
    appointmentId: string,
    status: 'confirmed' | 'declined' | 'cancelled'
  ) => {
    try {
      setUpdating(true);
      setError(null);

      setAppointments(prev => prev.map(apt =>
        apt.id === appointmentId ? { ...apt, status } : apt
      ));

      console.log(`🔄 Updating appointment ${appointmentId} status to ${status}`);

      await api.updateAppointmentStatus(appointmentId, status);

      // Optimistic update
      setAppointments(prev => prev.map(apt =>
        apt.id === appointmentId ? { ...apt, status } : apt
      ));

      const statusText = {
        'confirmed': 'אושר',
        'declined': 'נדחה',
        'cancelled': 'בוטל'
      }[status];

      showSuccessToast(`התור ${statusText} בהצלחה`);
      console.log(`✅ Appointment status updated to ${status}`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בעדכון סטטוס התור';
      setError(errorMessage);
      showErrorToast(errorMessage);
      console.error('❌ Error updating appointment status:', err);

    } finally {
      setUpdating(false);
    }
  }, [api]);

  /**
   * עדכון תור (תאריך, שעה, שירות)
   */
  const updateAppointment = useCallback(async (
    appointmentId: string,
    data: { date?: string; time?: string; service_id?: string }
  ) => {
    try {
      setUpdating(true);
      setError(null);

      console.log(`🔄 Updating appointment ${appointmentId}:`, data);

      // בדיקת חפיפות אם משנים תאריך/שעה/שירות
      if (data.date && data.time && data.service_id) {
        const conflictCheck = await checkBusinessOwnerConflicts(
          businessId,
          data.service_id,
          data.date,
          data.time,
          appointmentId
        );

        if (conflictCheck.hasConflict) {
          showErrorToast(conflictCheck.error || 'יש חפיפה עם תור קיים');
          return;
        }
      }

      const updatedAppointment = await api.updateAppointment(appointmentId, data);

      // Optimistic update
      setAppointments(prev => prev.map(apt =>
        apt.id === appointmentId ? { ...apt, ...updatedAppointment } : apt
      ));

      showSuccessToast('התור עודכן בהצלחה');
      console.log('✅ Appointment updated successfully');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בעדכון התור';
      setError(errorMessage);
      showErrorToast(errorMessage);
      console.error('❌ Error updating appointment:', err);

    } finally {
      setUpdating(false);
    }
  }, [businessId, api]);

  // /**
  //  * מחיקת תור
  //  */
  // const deleteAppointment = useCallback(async (appointmentId: string) => {
  //   const appointment = appointments.find(apt => apt.id === appointmentId);
  //   if (!appointment) return;

  //   try {
  //     setUpdating(true);
  //     setError(null);



  //     console.log(`🔄 Deleting appointment ${appointmentId}`);

  //     await api.deleteAppointment(appointmentId);

  //     // Optimistic update + clear cache
  //     setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
  //     setCache(new Map());

  //     showSuccessToast('התור נמחק בהצלחה');
  //     console.log('✅ Appointment deleted successfully');

  //   } catch (err) {
  //     const errorMessage = err instanceof Error ? err.message : 'שגיאה במחיקת התור';
  //     setError(errorMessage);
  //     showErrorToast(errorMessage);
  //     console.error('❌ Error deleting appointment:', err);

  //   } finally {
  //     setUpdating(false);
  //   }
  // }, [appointments, api]);

  // ===================================
  // 🛠️ Utility Functions
  // ===================================

  /**
   * בדיקת חפיפות
   */
  const checkConflicts = useCallback(async (
    serviceId: string,
    date: string,
    time: string,
    excludeId?: string
  ) => {
    try {
      const result = await checkBusinessOwnerConflicts(
        businessId,
        serviceId,
        date,
        time,
        excludeId
      );
      return {
        hasConflict: result.hasConflict,
        error: result.error
      };
    } catch (err) {
      console.error('Error checking conflicts:', err);
      return {
        hasConflict: true,
        error: 'שגיאה בבדיקת חפיפות'
      };
    }
  }, [businessId]);

  /**
   * בדיקה אם תור עבר
   */
  const isAppointmentPast = useCallback((appointment: Appointment): boolean => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.start_time}`);
    return appointmentDateTime < new Date();
  }, []);

  /**
   * בדיקה אם תור היום
   */
  const isAppointmentToday = useCallback((appointment: Appointment): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return appointment.date === today;
  }, []);

  /**
   * בדיקה אם ניתן לערוך תור
   */
  const canEditAppointment = useCallback((appointment: Appointment): boolean => {
    return isAppointmentEditable(
      { date: appointment.date, time: appointment.start_time },
      1
    ); // margin של שעה
  }, []);

  /**
   * רענון נתונים
   */
  const refreshAppointments = useCallback(async () => {
    await loadAppointments();
  }, [loadAppointments]);

  /**
   * ניקוי שגיאות
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * ניקוי פילטרים
   */
  const clearFilters = useCallback(() => {
    setFilters({ status: 'all' });
  }, []);

  /**
   * 
   */
  const loadMoreAppointments = useCallback(async () => {
    if (!pagination.has_more || loadingMore) return;

    try {
      setLoadingMore(true);
      const response = await api.fetchAppointments({
        start_date: dateRange.start,
        end_date: dateRange.end,
        page: pagination.current_page + 1,
        limit: pagination.limit,
        include_past: false,
        status: filters.status !== 'all' ? filters.status : undefined
      });

      setAppointments(prev => {
        const existingIds = new Set(prev.map(apt => apt.id));
        const newAppointments = response.appointments.filter(apt => !existingIds.has(apt.id));
        return [...prev, ...newAppointments];
      });

      setPagination(response.pagination);

    } catch (err) {
      console.error('Error loading more appointments:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [api, pagination, dateRange, filters.status, loadingMore]);

  /**
   * 
   */
  const setDateRangeAndLoad = useCallback(async (start?: string, end?: string) => {
    setCache(new Map());
    setDateRange({ start, end });
    try {
      setLoading(true);
      setError(null); // נקה שגיאות קודמות

      const response = await api.fetchAppointments({
        start_date: start,
        end_date: end,
        page: 1,
        limit: 50,
        include_past: !start && !end,
        status: filters.status !== 'all' ? filters.status : undefined
      });

      setAppointments(response.appointments);
      setPagination(response.pagination);
      console.log(`✅ Loaded ${response.appointments.length} appointments for date range`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בטעינת תורים';
      setError(errorMessage);
      console.error('❌ Error loading appointments by date range:', err);
    } finally {
      setLoading(false);
    }
  }, [api, filters.status]);

  const clearCache = useCallback(() => {
    setCache(new Map());
    console.log('🧹 Cache cleared');
  }, []);

  // הוסף לפני ה-return:
  const loadPreviousMonth = useCallback(async () => {
    if (!dateRange.start) return;

    const currentStart = new Date(dateRange.start);
    const previousMonth = new Date(currentStart);
    previousMonth.setMonth(currentStart.getMonth() - 1);

    const newStart = timeUtils.dateToLocalString(previousMonth);

    try {
      setLoading(true);

      const response = await api.fetchAppointments({
        start_date: newStart,
        end_date: dateRange.end,
        page: 1,
        limit: 50,
        include_past: true,
        status: filters.status !== 'all' ? filters.status : undefined
      });
      setAppointments(response.appointments);
      setPagination(response.pagination);
      setDateRange({ start: newStart, end: dateRange.end });

      // // הוסף תורים קודמים לתחילת הרשימה
      // setAppointments(prev => {
      //   const existingIds = new Set(prev.map(apt => apt.id));
      //   const newAppointments = response.appointments.filter(apt => !existingIds.has(apt.id));
      //   const combined = [...newAppointments, ...prev].sort((a, b) => {
      //     const dateA = new Date(`${a.date} ${a.start_time}`);
      //     const dateB = new Date(`${b.date} ${b.start_time}`);
      //     return dateA.getTime() - dateB.getTime();
      //   });

      //   // 🔧 עדכן pagination לפי הכמות החדשה
      //   setPagination(prev => ({
      //     ...prev,
      //     total_count: combined.length,
      //     limit: Math.max(50, combined.length), // הגדל limit אם צריך
      //     has_more: false // אין עוד לטעון כשמציגים הכל
      //   }));

      //   return combined;
      // });

      // setDateRange(prev => ({ ...prev, start: newStart }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת תורים קודמים');
    } finally {
      setLoading(false);
    }
  }, [api, dateRange, filters.status]);

  // ===================================
  // 📊 Return Hook Result
  // ===================================

  return {
    // Data
    appointments,
    filteredAppointments,

    // Computed data
    pendingCount,
    confirmedCount,
    totalCount,
    todayAppointments,
    upcomingAppointments,

    // States
    loading,
    updating,
    error,
    loadingMore,
    pagination,
    dateRange,


    // Filters
    filters,
    setFilters,
    clearFilters,

    // Actions
    loadAppointments,
    loadMoreAppointments,
    loadPreviousMonth,
    getDefaultDateRange,
    setDateRangeAndLoad,
    createAppointment,
    updateAppointmentStatus,
    updateAppointment,
    checkConflicts,
    refreshAppointments,
    clearCache,
    clearError,

    // Utilities
    isAppointmentPast,
    isAppointmentToday,
    canEditAppointment,

    // API instance
    api
  };
};

// ===================================
// 🎯 Additional Helper Hooks
// ===================================

/**
 * Hook לסטטיסטיקות מהירות
 */
export const useAppointmentStats = (businessId: string) => {
  const {
    pendingCount,
    confirmedCount,
    totalCount,
    todayAppointments,
    upcomingAppointments,
    loading
  } = useAppointments(businessId);

  return {
    pendingCount,
    confirmedCount,
    totalCount,
    todayCount: todayAppointments.length,
    upcomingCount: upcomingAppointments.length,
    loading
  };
};

/**
 * Hook לפעולות בסיסיות על תורים (בלי כל הstate)
 */
export const useAppointmentActions = (businessId: string) => {
  const api = useMemo(() => new BusinessAPI(businessId), [businessId]);

  const updateStatus = useCallback(async (id: string, status: 'confirmed' | 'declined' | 'cancelled') => {
    try {
      await api.updateAppointmentStatus(id, status);
      showSuccessToast(`התור ${status === 'confirmed' ? 'אושר' : status === 'declined' ? 'נדחה' : 'בוטל'} בהצלחה`);
    } catch (err) {
      showErrorToast('שגיאה בעדכון התור');
    }
  }, [api]);

  return {
    updateStatus,
  };
};