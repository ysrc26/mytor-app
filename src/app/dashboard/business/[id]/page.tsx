// src/app/dashboard/business/[id]/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRealtime } from '@/hooks/useRealtime';
import { useBusinessData } from '@/hooks/useBusinessData';
import { useAppointments } from '@/hooks/useAppointments';
import { useUserPreferences } from '@/hooks/useUserPreferences';

// UI Components
import { Header } from '@/components/dashboard/Header';
import { SideNavigation } from '@/components/dashboard/SideNavigation';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { TabNavigation, type TabType } from '@/components/dashboard/TabNavigation';
import { PendingAppointments } from '@/components/dashboard/PendingAppointments';
import { CalendarView } from '@/components/dashboard/CalendarView';
import { AppointmentsList } from '@/components/dashboard/AppointmentsList';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { AppointmentsControls } from '@/components/dashboard/AppointmentsControls';

// Modals
import { BusinessProfileModal } from '@/components/dashboard/modals/BusinessProfileModal';
import { ServicesModal } from '@/components/dashboard/modals/ServicesModal';
import { AvailabilityModal } from '@/components/dashboard/modals/AvailabilityModal';
import { UnavailableDatesModal } from '@/components/dashboard/modals/UnavailableDatesModal';
import { SettingsModal } from '@/components/dashboard/modals/SettingsModal';
import { CreateAppointmentModal } from '@/components/dashboard/modals/CreateAppointmentModal';
import { EditAppointmentModal } from '@/components/dashboard/modals/EditAppointmentModal';
import { DeleteConfirmationModal } from '@/components/dashboard/modals/DeleteConfirmationModal';

// Loading & Error States
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';

// Types
import type { Appointment, Service, Availability, Business } from '@/lib/types';

// Subscription
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionStatus from '@/components/subscription/SubscriptionStatus';
import UsageWarning from '@/components/subscription/UsageWarning';
import LimitReachedModal from '@/components/subscription/LimitReachedModal';

export default function BusinessDashboard() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;

  // ===================================
  // 🎯 Hooks - Data & Authentication
  // ===================================
  const { user, loading: userLoading, isAuthenticated } = useAuth();
  const { preferences: userPreferences, loading: preferencesLoading } = useUserPreferences();

  const {
    business,
    services,
    availability,
    loading: businessLoading,
    saving: businessSaving,
    error: businessError,
    reload: reloadBusiness,
    updateBusiness,
    addService,
    deleteService,
    addAvailability,
    deleteAvailability,
    clearError: clearBusinessError,
    api: businessApi
  } = useBusinessData(businessId);

  const {
    appointments,
    filteredAppointments,
    pendingCount,
    confirmedCount,
    totalCount,
    todayAppointments,
    upcomingAppointments,
    loading: appointmentsLoading,
    updating: appointmentsUpdating,
    error: appointmentsError,
    filters: appointmentFilters,
    setFilters: setAppointmentFilters,
    clearFilters: clearAppointmentFilters,
    loadAppointments,
    createAppointment,
    updateAppointmentStatus,
    updateAppointment,
    checkConflicts,
    refreshAppointments,
    clearError: clearAppointmentsError,
    isAppointmentPast,
    isAppointmentToday,
    canEditAppointment,
    loadingMore,
    pagination,
    dateRange,
    loadMoreAppointments,
    setDateRangeAndLoad,
    loadPreviousMonth,
    api: appointmentsApi
  } = useAppointments(businessId, services);

  const {
    isConnected: realtimeConnected,
    connectionStatus,
    newAppointmentAlert,
    dismissAlert,
    enableNotifications,
    disableNotifications,
    testNotification
  } = useRealtime(
    businessId,
    user?.id,
    {
      enableSound: true,
      enableBrowserNotifications: true,
      alertDuration: 5000,
      onAppointmentCreated: (appointment) => {
        refreshAppointments();
        showSuccessToast('התקבל תור חדש!');
      },
      onAppointmentUpdated: (appointment) => {
        refreshAppointments();
      },
      onAppointmentDeleted: (appointmentId) => {
        refreshAppointments();
      }
    }
  );

  // ===================================
  // 🎯 Local State Management
  // ===================================
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [sideNavOpen, setSideNavOpen] = useState(false);


  // Modal States
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [unavailableDatesModalOpen, setUnavailableDatesModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [createAppointmentModalOpen, setCreateAppointmentModalOpen] = useState(false);
  const [createAppointmentData, setCreateAppointmentData] = useState<{
    date?: string;
    time?: string;
  }>({});
  const [deleteModalData, setDeleteModalData] = useState<{
    isOpen: boolean;
    appointmentId: string | null;
    appointment: Appointment | null;
  }>({ isOpen: false, appointmentId: null, appointment: null });

  // Calendar State
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day' | 'agenda' | 'work-days'>('work-days');
  const [calendarCurrentDate, setCalendarCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [unavailableDates, setUnavailableDates] = useState<Array<{ date: string; tag?: string; description?: string }>>([]);

  // Appointments List State
  const [appointmentsListFilter, setAppointmentsListFilter] = useState<'all' | 'pending' | 'confirmed' | 'declined' | 'cancelled'>('all');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // UI State
  const [copied, setCopied] = useState(false);

  // Subscription State
  const { subscription, isPremium, checkLimit } = useSubscription();
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitType, setLimitType] = useState<'businesses' | 'appointments' | 'sms'>('appointments');

  // ===================================
  // 🔧 Computed Values
  // ===================================
  const isLoading = userLoading || businessLoading || appointmentsLoading;
  const hasError = businessError || appointmentsError;
  const isSaving = businessSaving || appointmentsUpdating;

  const pendingAppointments = useMemo(() =>
    appointments.filter(apt => apt.status === 'pending'),
    [appointments]
  );

  const appointmentStats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: totalCount,
      pending: pendingCount,
      confirmed: confirmedCount,
      today: todayAppointments.length,
      thisWeek: appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= thisWeekStart && aptDate <= now;
      }).length,
      thisMonth: appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= thisMonthStart && aptDate <= now;
      }).length,
      upcoming: upcomingAppointments.length,
      declined: appointments.filter(apt => apt.status === 'declined').length
    };
  }, [appointments, totalCount, pendingCount, confirmedCount, todayAppointments, upcomingAppointments]);

  // ===================================
  // 🎯 Event Handlers
  // ===================================
  const handleUpdateAppointmentStatus = async (appointmentId: string, status: 'confirmed' | 'declined' | 'cancelled') => {
    try {
      await updateAppointmentStatus(appointmentId, status);
      const statusText = status === 'confirmed' ? 'אושר' : status === 'declined' ? 'נדחה' : 'בוטל';
      showSuccessToast(`התור ${statusText} בהצלחה`);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      showErrorToast('שגיאה בעדכון סטטוס התור');
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setSelectedAppointment(appointment);
    // לעת עתה נציג הודעה - נוסיף את המודאל בהמשך
    showSuccessToast(`עריכת תור של ${appointment.client_name}`);
  };

  // ===================================
  // 🎯 Handlers for modals
  // ===================================

  // Calendar Create Appointment Handler (simplified for CalendarView interface)
  const handleCalendarCreateAppointment = (date: string, time: string) => {
    setCreateAppointmentData({ date, time });
    setCreateAppointmentModalOpen(true);
  };

  // Create Appointment Modal Handler
  const handleCreateAppointment = async (appointmentData: any) => {
    // בדיקת מגבלה לפני יצירת תור
    const limitCheck = await checkLimit('create_appointment');
    if (!limitCheck.allowed) {
      setLimitType('appointments');
      setLimitModalOpen(true);
      throw new Error(limitCheck.reason);
    }

    try {
      await createAppointment(appointmentData);
      showSuccessToast('התור נוצר בהצלחה');
      setCreateAppointmentModalOpen(false);
      setCreateAppointmentData({});
    } catch (error) {
      console.error('Error creating appointment:', error);
      if (error instanceof Error && error.message.includes('מגבלה')) {
        setLimitType('appointments');
        setLimitModalOpen(true);
      }
      showErrorToast('שגיאה ביצירת התור');
    }
  };


  // Edit Appointment Modal Handler
  const handleUpdateAppointment = async (appointmentData: any) => {
    if (!editingAppointment) return;
    try {
      await updateAppointment(editingAppointment.id, appointmentData);
      showSuccessToast('התור עודכן בהצלחה');
      setEditingAppointment(null);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error updating appointment:', error);
      showErrorToast('שגיאה בעדכון התור');
    }
  };

  const copyBusinessLink = async () => {
    try {
      const link = `${window.location.origin}/${business?.slug}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      showSuccessToast('הקישור הועתק ללוח');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showErrorToast('שגיאה בהעתקת הקישור');
    }
  };

  const closeSideNav = () => setSideNavOpen(false);
  const handleOverlayClick = () => setSideNavOpen(false);

  // Clear errors when component unmounts or businessId changes
  useEffect(() => {
    return () => {
      clearBusinessError();
      clearAppointmentsError();
    };
  }, [businessId, clearBusinessError, clearAppointmentsError]);

  // 🔧 User Preferences - Calendar View
  useEffect(() => {
    // עדכן את תצוגת היומן לפי העדפות המשתמש כשהן נטענות
    if (userPreferences?.default_calendar_view && !preferencesLoading) {
      setCalendarView(userPreferences.default_calendar_view);
    }
  }, [userPreferences, preferencesLoading]);

  // הוסף useEffect לטעינת תאריכים לא זמינים
  useEffect(() => {
    const fetchUnavailableDates = async () => {
      try {
        const response = await fetch('/api/unavailable');
        if (response.ok) {
          const data = await response.json();
          setUnavailableDates(data);
        }
      } catch (error) {
        console.error('Error fetching unavailable dates:', error);
      }
    };

    if (businessId) {
      fetchUnavailableDates();
    }
  }, [businessId]);

  // ===================================
  // 🔧 Loading & Error States
  // ===================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">טוען דשבורד...</p>
        </div>
      </div>
    );
  }

  if (hasError || !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            שגיאה בטעינת הדשבורד
          </h1>
          <p className="text-gray-600 mb-6">
            {businessError || appointmentsError || 'לא נמצא עסק תואם'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                reloadBusiness();
                refreshAppointments();
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              נסה שוב
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              חזור לדשבורד הראשי
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleUpgrade = async () => {
    setLimitModalOpen(false);

    try {
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'premium' })
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      showErrorToast('שגיאה ביצירת דף התשלום');
    }
  };

  // ===================================
  // 🎨 Main Render
  // ===================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sideNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm lg:hidden"
          onClick={handleOverlayClick}
        />
      )}

      {/* Side Navigation */}
      <SideNavigation
        business={business}
        user={user}
        services={services}
        availability={availability}
        isOpen={sideNavOpen}
        onClose={closeSideNav}
        onOpenModal={(modalType) => {
          console.log('🔍 Modal type clicked:', modalType);
          if (modalType === 'profile') setProfileModalOpen(true);
          else if (modalType === 'services') setServicesModalOpen(true);
          else if (modalType === 'availability') setAvailabilityModalOpen(true);
          else if (modalType === 'unavailable-dates') setUnavailableDatesModalOpen(true);
        }}
        onOpenSettingsModal={() => setSettingsModalOpen(true)}
      />

      {/* Main Content - Fixed Layout */}
      <div className="transition-all duration-300">
        {/* Header */}
        <Header
          business={business}
          user={user}
          realtimeConnected={realtimeConnected}
          newAppointmentAlert={newAppointmentAlert}
          onMenuClick={() => setSideNavOpen(!sideNavOpen)}
          onDismissAlert={dismissAlert}
          onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
        />

        {/* Main Dashboard Content - Centered */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Usage Warning - הוספה חדשה */}
          <UsageWarning />
          {/* Stats Cards
          <div className="mb-8">
            <StatsCards
              appointments={appointments}
              loading={appointmentsLoading}
            />
          </div> */}

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow mb-6">
            <TabNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              pendingCount={pendingCount}
              appointmentsCount={totalCount}
            />

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'pending' && (
                <PendingAppointments
                  appointments={pendingAppointments}
                  business={business}
                  loading={appointmentsLoading}
                  onUpdateStatus={handleUpdateAppointmentStatus}
                  onCopyPublicLink={copyBusinessLink}
                />
              )}

              {activeTab === 'calendar' && (
                <CalendarView
                  appointments={appointments}
                  availability={availability}
                  services={services}
                  businessId={businessId}
                  onCreateAppointment={handleCalendarCreateAppointment}
                  onEditAppointment={handleEditAppointment}
                  onUpdateStatus={handleUpdateAppointmentStatus}
                  initialView={calendarView}
                />
              )}

              {activeTab === 'appointments' && (
                <AppointmentsList
                  appointments={filteredAppointments}
                  pagination={pagination}
                  loadingMore={loadingMore}
                  dateRange={dateRange}
                  onLoadMore={loadMoreAppointments}
                  onLoadPrevious={loadPreviousMonth}
                  onDateRangeChange={setDateRangeAndLoad}
                  onRefresh={refreshAppointments}
                  services={services}
                  businessId={businessId}
                  loading={appointmentsLoading}
                  onUpdateStatus={handleUpdateAppointmentStatus}
                  onEditAppointment={handleEditAppointment}
                />
              )}

              {activeTab === 'premium' && (
                <div className="space-y-6">
                  {isPremium ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 text-yellow-500">
                        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        אתה כבר פרימיום! 🎉
                      </h3>
                      <p className="text-gray-600 mb-4">
                        נהנה מכל התכונות המתקדמות שלנו
                      </p>
                      <SubscriptionStatus onUpgrade={() => { }} />
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 text-yellow-500">
                        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        מעבר לחבילה פרימיום
                      </h3>
                      <p className="text-gray-600 mb-4">
                        קבל גישה לתכונות מתקדמות: SMS התראות, דוחות מפורטים, חיבור לגוגל קלנדר ועוד
                      </p>
                      <div className="space-y-3">
                        <button
                          onClick={handleUpgrade}
                          className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                        >
                          שדרג עכשיו - רק ₪19.90 לחודש
                        </button>
                        <p className="text-sm text-gray-500">
                          ניסיון חינם ל-7 יום, ביטול בכל עת
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
        {/* Subscription Modal - הוספה חדשה */}
        <LimitReachedModal
          isOpen={limitModalOpen}
          onClose={() => setLimitModalOpen(false)}
          onUpgrade={handleUpgrade}
          limitType={limitType}
          currentCount={subscription?.monthly_appointments_used}
          maxCount={subscription?.monthly_limit}
        />
      </div>

      {/* Modals */}
      <BusinessProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        business={business}
        onUpdate={updateBusiness}
      />

      <ServicesModal
        isOpen={servicesModalOpen}
        onClose={() => setServicesModalOpen(false)}
        services={services}
        onAddService={addService}
        onUpdateService={async (serviceId: string, serviceData: Partial<Service>) => {
          try {
            // זמנית נשתמש ב-console.log עד שנוסיף את updateService ל-API
            console.log('Update service:', serviceId, serviceData);
            showSuccessToast('השירות יעודכן בקרוב');
          } catch (error) {
            console.error('Error updating service:', error);
            showErrorToast('שגיאה בעדכון השירות');
          }
        }}
        onDeleteService={deleteService}
      />

      <AvailabilityModal
        isOpen={availabilityModalOpen}
        onClose={() => setAvailabilityModalOpen(false)}
        availability={availability}
        businessId={businessId}
        onAddAvailability={addAvailability}
        onDeleteAvailability={deleteAvailability}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      <CreateAppointmentModal
        isOpen={createAppointmentModalOpen}
        onClose={() => {
          setCreateAppointmentModalOpen(false);
          setCreateAppointmentData({});
        }}
        businessId={businessId}
        services={services}
        onCreate={handleCreateAppointment}
        prefilledDate={createAppointmentData.date}
        prefilledTime={createAppointmentData.time}
      />

      <EditAppointmentModal
        isOpen={editingAppointment !== null}
        onClose={() => {
          setEditingAppointment(null);
          setSelectedAppointment(null);
        }}
        appointment={editingAppointment}
        businessId={businessId}
        services={services}
        onUpdate={handleUpdateAppointment}
      />

      <UnavailableDatesModal
        isOpen={unavailableDatesModalOpen}
        onClose={() => setUnavailableDatesModalOpen(false)}
        businessId={businessId}
      />
    </div>
  );
}