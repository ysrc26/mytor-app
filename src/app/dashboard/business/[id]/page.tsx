// src/app/dashboard/business/[id]/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRealtime } from '@/hooks/useRealtime';
import { useBusinessData } from '@/hooks/useBusinessData';
import { useAppointments } from '@/hooks/useAppointments';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useSubscription } from '@/hooks/useSubscription';

// UI Components
import { Header } from '@/components/dashboard/Header';
import { SideNavigation } from '@/components/dashboard/SideNavigation';
import { TabNavigation, type TabType } from '@/components/dashboard/TabNavigation';
import { PendingAppointments } from '@/components/dashboard/PendingAppointments';
import { CalendarView } from '@/components/dashboard/CalendarView';
import { AppointmentsList } from '@/components/dashboard/AppointmentsList';
import { PremiumContent } from '@/components/dashboard/PremiumContent';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Modals
import { BusinessProfileModal } from '@/components/dashboard/modals/BusinessProfileModal';
import { ServicesModal } from '@/components/dashboard/modals/ServicesModal';
import { AvailabilityModal } from '@/components/dashboard/modals/AvailabilityModal';
import { UnavailableDatesModal } from '@/components/dashboard/modals/UnavailableDatesModal';
import { SettingsModal } from '@/components/dashboard/modals/SettingsModal';
import { CreateAppointmentModal } from '@/components/dashboard/modals/CreateAppointmentModal';
import { EditAppointmentModal } from '@/components/dashboard/modals/EditAppointmentModal';

// Loading & Error States
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';

// Types
import type { Appointment, Service } from '@/lib/types';
import {
  Crown,
  Zap,
  Star,
  MessageSquare,
  BarChart,
  Palette,
  Users,
  Calendar,
  CreditCard,
  Building2,
  TrendingUp,
  Headphones,
  FileText,
  CheckCircle,
  Clock,
  Settings
} from 'lucide-react';

export default function BusinessDashboard() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;

  // ===================================
  // 🎯 Hooks - Data & Authentication
  // ===================================
  const { user, loading: userLoading, isAuthenticated } = useAuth();
  const { preferences: userPreferences, loading: preferencesLoading } = useUserPreferences();
  const { limits, upgradeSubscription } = useSubscription();

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

  // Appointments List State
  const [appointmentsListFilter, setAppointmentsListFilter] = useState<'all' | 'pending' | 'confirmed' | 'declined' | 'cancelled'>('all');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // UI State
  const [copied, setCopied] = useState(false);

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
    try {
      await createAppointment(appointmentData);
      showSuccessToast('התור נוצר בהצלחה');
      setCreateAppointmentModalOpen(false);
      setCreateAppointmentData({});
    } catch (error) {
      console.error('Error creating appointment:', error);
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
                <PremiumContent
                  subscriptionTier={limits?.subscription_tier || 'free'}
                  limits={limits}
                  upgradeSubscription={upgradeSubscription}
                  businessId={businessId}
                  appointments={appointments}
                  services={services}
                  business={business}
                />
              )}
            </div>
          </div>
        </main>
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

// ===================================
// 🎯 קומפוננט תוכן לקוחות פרימיום  
// ===================================

interface PremiumFeaturesContentProps {
  subscriptionTier: string;
  limits: any;
  upgradeSubscription: (tier: 'premium' | 'business') => void;
}

const PremiumFeaturesContent = ({
  subscriptionTier,
  limits,
  upgradeSubscription
}: PremiumFeaturesContentProps) => {

  const getSubscriptionIcon = (tier: string) => {
    switch (tier) {
      case 'premium': return <Crown className="w-8 h-8 text-amber-500" />;
      case 'business': return <Zap className="w-8 h-8 text-blue-500" />;
      default: return <Star className="w-8 h-8 text-gray-500" />;
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'premium': return 'פרימיום';
      case 'business': return 'עסקי';
      default: return 'חינם';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'from-amber-500 to-orange-500';
      case 'business': return 'from-blue-500 to-indigo-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  // פיצ'רים זמינים לפי רמת מנוי
  const availableFeatures = {
    premium: [
      { icon: MessageSquare, title: 'תזכורות SMS', desc: 'שליחת תזכורות אוטומטיות ללקוחות', status: 'active' },
      { icon: BarChart, title: 'דוחות בסיסיים', desc: 'סטטיסטיקות על התורים והלקוחות', status: 'active' },
      { icon: Palette, title: 'הסרת מיתוג', desc: 'הסרת לוגו MyTor מהעמוד שלך', status: 'active' },
      { icon: Users, title: 'ניהול לקוחות מתקדם', desc: 'שמירת פרטי לקוחות והיסטוריה', status: 'active' },
      { icon: Calendar, title: 'חיבור ליומן גוגל', desc: 'סנכרון אוטומטי עם גוגל קלנדר', status: 'coming_soon' },
      { icon: CreditCard, title: 'קבלת תשלומים', desc: 'אפשרות לקבל תשלום מראש', status: 'coming_soon' }
    ],
    business: [
      { icon: Building2, title: 'עסקים מרובים', desc: 'ניהול מספר עסקים מחשבון אחד', status: 'active' },
      { icon: TrendingUp, title: 'אנליטיקה מתקדמת', desc: 'ניתוח מעמיק של ביצועי העסק', status: 'active' },
      { icon: Headphones, title: 'תמיכה VIP', desc: 'תמיכה טכנית מועדפת', status: 'active' },
      { icon: Settings, title: 'הגדרות מתקדמות', desc: 'שליטה מלאה על פונקציונליות', status: 'active' },
      { icon: Zap, title: 'אינטגרציות', desc: 'חיבור למערכות חיצוניות', status: 'coming_soon' },
      { icon: FileText, title: 'דוחות מתקדמים', desc: 'ייצוא נתונים וניתוח מתקדם', status: 'active' }
    ]
  };

  const currentFeatures = subscriptionTier === 'business'
    ? [...availableFeatures.premium, ...availableFeatures.business]
    : availableFeatures.premium;

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* כותרת עם סטטוס מנוי */}
      <div className="text-center">
        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r ${getTierColor(subscriptionTier)} text-white mb-4`}>
          {getSubscriptionIcon(subscriptionTier)}
          <span className="text-lg font-bold">מנוי {getTierLabel(subscriptionTier)}</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          הפיצ'רים המתקדמים שלך
        </h2>
        <p className="text-gray-600">
          תהנה מכל התכונות הפרימיום שרכשת
        </p>
      </div>

      {/* סטטיסטיקות מנוי */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">תורים בחודש</h3>
            <p className="text-2xl font-bold text-green-600">
              {limits.appointments_used}/{limits.appointments_limit}
            </p>
            <p className="text-sm text-gray-500">
              נותרו {limits.appointments_limit - limits.appointments_used}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">שיעור אישורים</h3>
            <p className="text-2xl font-bold text-blue-600">87%</p>
            <p className="text-sm text-gray-500">מהבקשות מאושרות</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">זמן מענה ממוצע</h3>
            <p className="text-2xl font-bold text-purple-600">24 דק'</p>
            <p className="text-sm text-gray-500">לאישור בקשות</p>
          </CardContent>
        </Card>
      </div>

      {/* רשימת פיצ'רים זמינים */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-6">הפיצ'רים שלך</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentFeatures.map((feature, index) => (
            <Card key={index} className={`
              relative transition-all duration-200 
              ${feature.status === 'active' ? 'shadow-md hover:shadow-lg' : 'opacity-60'}
            `}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`
                    w-12 h-12 rounded-lg flex items-center justify-center
                    ${feature.status === 'active'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                    }
                  `}>
                    <feature.icon className="w-6 h-6" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                      {feature.status === 'active' && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                          פעיל
                        </Badge>
                      )}
                      {feature.status === 'coming_soon' && (
                        <Badge variant="outline" className="text-xs">
                          בקרוב
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{feature.desc}</p>
                  </div>

                  {feature.status === 'active' && (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* קישורים מהירים לפיצ'רים */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-4">פעולות מהירות</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto p-4 flex-col gap-2">
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm">הגדר SMS</span>
          </Button>

          <Button variant="outline" className="h-auto p-4 flex-col gap-2">
            <BarChart className="w-5 h-5" />
            <span className="text-sm">דוחות</span>
          </Button>

          <Button variant="outline" className="h-auto p-4 flex-col gap-2">
            <Settings className="w-5 h-5" />
            <span className="text-sm">הגדרות</span>
          </Button>

          <Button variant="outline" className="h-auto p-4 flex-col gap-2">
            <Headphones className="w-5 h-5" />
            <span className="text-sm">תמיכה</span>
          </Button>
        </div>
      </div>

      {/* שדרוג למנוי גבוה יותר */}
      {subscriptionTier === 'premium' && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  שדרג למנוי עסקי
                </h3>
                <p className="text-gray-600 mb-3">
                  קבל גישה לעסקים מרובים, אנליטיקה מתקדמת ותמיכה VIP
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ עסקים ללא הגבלה</li>
                  <li>✓ 1000 תורים בחודש</li>
                  <li>✓ דוחות מתקדמים</li>
                  <li>✓ תמיכה VIP</li>
                </ul>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">₪49.90</div>
                <div className="text-sm text-gray-500 mb-4">לחודש</div>
                <Button
                  onClick={() => upgradeSubscription('business')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  שדרג עכשיו
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* הערות כלליות */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          יש לך שאלות על המנוי שלך?
          <button className="text-blue-600 hover:underline ml-1">צור קשר עם התמיכה</button>
        </p>
      </div>
    </div>
  );
};

// ===================================
// 🎯 קומפוננט שדרוג למשתמשים חינמיים
// ===================================

interface UpgradeContentProps {
  upgradeSubscription: (tier: 'premium' | 'business') => void;
}

const UpgradeContent = ({ upgradeSubscription }: UpgradeContentProps) => {
  return (
    <div className="text-center py-12 max-w-2xl mx-auto">
      <div className="w-16 h-16 mx-auto mb-6">
        <div className="w-full h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
          <Crown className="w-8 h-8 text-white" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        שדרג לפרימיום
      </h3>

      <p className="text-lg text-gray-600 mb-8">
        קבל גישה לתכונות מתקדמות: תזכורות SMS, דוחות מפורטים, הסרת מיתוג ועוד
      </p>

      {/* תכונות עיקריות */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[
          { icon: MessageSquare, title: 'תזכורות SMS', desc: 'הקטן no-shows עם תזכורות אוטומטיות' },
          { icon: BarChart, title: 'דוחות מתקדמים', desc: 'בין איך העסק שלך מתפתח' },
          { icon: Palette, title: 'הסרת מיתוג', desc: 'העמוד שלך ללא לוגו MyTor' },
          { icon: Crown, title: 'תמיכה מועדפת', desc: 'קבל עזרה מהירה ומקצועית' }
        ].map((feature, index) => (
          <div key={index} className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center">
              <feature.icon className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
            <p className="text-sm text-gray-600">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* מחירים */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-8 mb-6">
        <div className="text-4xl font-bold mb-2">₪19.90</div>
        <div className="text-amber-100 mb-4">לחודש</div>
        <Button
          onClick={() => upgradeSubscription('premium')}
          className="bg-white text-amber-600 hover:bg-gray-100 font-bold px-8 py-3"
        >
          שדרג עכשיו
        </Button>
        <p className="text-sm text-amber-100 mt-4">
          ניסיון חינם ל-14 יום • ביטול בכל עת
        </p>
      </div>

      {/* שאלות נפוצות */}
      <div className="text-xs text-gray-500">
        <p>יש שאלות? <span className="text-blue-600 cursor-pointer hover:underline">צור קשר איתנו</span></p>
      </div>
    </div>
  );
};