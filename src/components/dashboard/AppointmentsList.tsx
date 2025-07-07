// src/components/dashboard/AppointmentsList.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Users, Phone, Calendar, Clock, CheckCircle, AlertCircle, X, Edit,
  Trash2, Filter, Search, Copy, ChevronDown, MessageCircle, Sparkles,
  Eye, EyeOff
} from 'lucide-react';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
import { isAppointmentEditable } from '@/lib/appointment-utils';
import { timeUtils } from '@/lib/time-utils';
import type { Appointment, Service } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from './DateRangePicker';
import { AppointmentsControls } from './AppointmentsControls';

interface AppointmentsListProps {
  appointments: Appointment[];
  services: Service[];
  loading?: boolean;
  onUpdateStatus: (appointmentId: string, status: 'confirmed' | 'declined' | 'cancelled') => Promise<void>;
  onDeleteAppointment: (appointmentId: string) => Promise<void>;
  onEditAppointment?: (appointment: Appointment) => void;
  businessId: string;
  pagination: {
    current_page: number;
    limit: number;
    total_count: number;
    total_pages: number;
    has_more: boolean;
  };
  loadingMore: boolean;
  dateRange: { start?: string; end?: string };
  onLoadMore: () => void;
  onLoadPrevious: () => void;
  onDateRangeChange: (start?: string, end?: string) => void;
  onRefresh: () => void;
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'declined' | 'cancelled';
type SortOption = 'date-asc' | 'date-desc' | 'name-asc' | 'name-desc' | 'status';
type ViewMode = 'cards' | 'table';

export const AppointmentsList = ({
  appointments,
  services,
  businessId,
  loading = false,
  onUpdateStatus,
  onDeleteAppointment,
  onEditAppointment,
  pagination,
  loadingMore,
  dateRange,
  onLoadMore,
  onLoadPrevious,
  onDateRangeChange,
  onRefresh
}: AppointmentsListProps) => {
  // ===================================
  // 🎯 State Management
  // ===================================
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedAppointments, setSelectedAppointments] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // ===================================
  // 📊 Computed Data
  // ===================================

  const filteredAndSortedAppointments = useMemo(() => {
    let filtered = [...appointments];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === filterStatus);
    }

    // Filter out past appointments by default
    // const today = timeUtils.dateToLocalString(new Date());
    // filtered = filtered.filter(apt => {
    //   // בדוק אם התאריך עבר
    //   if (timeUtils.isPastDate(new Date(apt.date))) {
    //     return false;
    //   }

    //   // אם זה היום, בדוק אם השעה עברה
    //   if (apt.date === today) {
    //     return !timeUtils.isPastTime(apt.start_time, new Date(apt.date));
    //   }

    //   return true;
    // });

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.client_name.toLowerCase().includes(query) ||
        apt.client_phone.includes(query) ||
        apt.note?.toLowerCase().includes(query)
      );
    }

    // Sort appointments
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(`${a.date} ${a.start_time}`).getTime() - new Date(`${b.date} ${b.start_time}`).getTime();
        case 'date-desc':
          return new Date(`${b.date} ${b.start_time}`).getTime() - new Date(`${a.date} ${a.start_time}`).getTime();
        case 'name-asc':
          return a.client_name.localeCompare(b.client_name, 'he');
        case 'name-desc':
          return b.client_name.localeCompare(a.client_name, 'he');
        case 'status':
          const statusOrder = { pending: 0, confirmed: 1, declined: 2, cancelled: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });

    return filtered;
  }, [appointments, filterStatus, searchQuery, sortBy]);

  const statistics = useMemo(() => {
    // Filter appointments based on current view settings
    let visibleAppointments = [...appointments];

    // Apply same filters as the main view
    // תמיד הסתר תורים שעברו בסטטיסטיקות
    // const today = timeUtils.dateToLocalString(new Date());
    // visibleAppointments = visibleAppointments.filter(apt => {
    //   if (timeUtils.isPastDate(new Date(apt.date))) {
    //     return false;
    //   }
    //   if (apt.date === today) {
    //     return !timeUtils.isPastTime(apt.start_time, new Date(apt.date));
    //   }
    //   return true;
    // });

    const total = visibleAppointments.length;
    const pending = visibleAppointments.filter(apt => apt.status === 'pending').length;
    const confirmed = visibleAppointments.filter(apt => apt.status === 'confirmed').length;
    const declined = visibleAppointments.filter(apt => apt.status === 'declined').length;
    const cancelled = visibleAppointments.filter(apt => apt.status === 'cancelled').length;
    const showing = filteredAndSortedAppointments.length;
    const today = timeUtils.dateToLocalString(new Date());
    const todayCount = visibleAppointments.filter(apt => apt.date === today && apt.status === 'confirmed').length;

    // Calculate past appointments count (only when showing all appointments)
    const pastCount = appointments.filter(apt => {
      const today = timeUtils.dateToLocalString(new Date());
      return timeUtils.isPastDate(new Date(apt.date)) ||
        (apt.date === today && timeUtils.isPastTime(apt.start_time, new Date(apt.date)));
    }).length;

    return {
      total,
      pending,
      confirmed,
      declined,
      cancelled,
      showing,
      todayCount,
      pastCount
    };
  }, [appointments, filteredAndSortedAppointments]);

  // ===================================
  // 🔧 Action Handlers
  // ===================================

  const handleStatusUpdate = async (appointmentId: string, status: 'confirmed' | 'declined' | 'cancelled') => {
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

  const handleDelete = async (appointmentId: string) => {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;

    if (!confirm(`האם אתה בטוח שברצונך למחוק את התור של ${appointment.client_name}?`)) {
      return;
    }

    if (deletingIds.has(appointmentId)) return;

    try {
      setDeletingIds(prev => new Set(prev).add(appointmentId));
      await onDeleteAppointment(appointmentId);
    } catch (error) {
      showErrorToast('שגיאה במחיקת התור');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const handleBulkAction = async (action: 'confirm' | 'decline' | 'delete') => {
    if (selectedAppointments.size === 0) return;

    const confirmMessage = {
      confirm: `האם אתה בטוח שברצונך לאשר ${selectedAppointments.size} תורים?`,
      decline: `האם אתה בטוח שברצונך לדחות ${selectedAppointments.size} תורים?`,
      delete: `האם אתה בטוח שברצונך למחוק ${selectedAppointments.size} תורים?`
    };

    if (!confirm(confirmMessage[action])) return;

    try {
      const promises = Array.from(selectedAppointments).map(id => {
        if (action === 'delete') {
          return onDeleteAppointment(id);
        } else {
          return onUpdateStatus(id, action === 'confirm' ? 'confirmed' : 'declined');
        }
      });

      await Promise.all(promises);
      setSelectedAppointments(new Set());
      showSuccessToast(`${selectedAppointments.size} תורים עודכנו בהצלחה`);
    } catch (error) {
      showErrorToast('שגיאה בעדכון התורים');
    }
  };

  if (loading) {
    return <AppointmentsListSkeleton />;
  }

  return (
    <div>
      {/* Header with Actions */}
      <AppointmentsHeader
        statistics={statistics}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedCount={selectedAppointments.size}
        onBulkAction={handleBulkAction}
      />

      {/* Date Range Picker ו-Controls */}
      <div className="space-y-4 mb-6">
        <DateRangePicker
          startDate={dateRange.start}
          endDate={dateRange.end}
          onDateRangeChange={onDateRangeChange}
          className="w-full sm:w-auto"
        />

        <AppointmentsControls
          totalCount={appointments.length}
          showingCount={filteredAndSortedAppointments.length}
          pagination={pagination}
          loading={loading}
          loadingMore={loadingMore}
          dateRange={dateRange}
          onLoadMore={onLoadMore}
          onLoadPrevious={onLoadPrevious}
          onRefresh={onRefresh}
          canLoadPrevious={!!dateRange.start}
        />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <FiltersPanel
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          sortBy={sortBy}
          onSortChange={setSortBy}
          services={services}
          appointments={appointments}
        />
      )}

      {/* Content */}
      {filteredAndSortedAppointments.length === 0 ? (
        <EmptyState
          searchQuery={searchQuery}
          filterStatus={filterStatus}
          onClearFilters={() => {
            setSearchQuery('');
            setFilterStatus('all');
          }}
        />
      ) : (
        <AppointmentsContent
          appointments={filteredAndSortedAppointments}
          services={services}
          viewMode={viewMode}
          selectedAppointments={selectedAppointments}
          onToggleSelection={setSelectedAppointments}
          onSelectAppointment={(id, selected) => {
            setSelectedAppointments(prev => {
              const newSet = new Set(prev);
              if (selected) {
                newSet.add(id);
              } else {
                newSet.delete(id);
              }
              return newSet;
            });
          }}
          onUpdateStatus={handleStatusUpdate}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDelete}
          onDeleteAppointment={handleDelete}
          onEdit={onEditAppointment}
          onEditAppointment={onEditAppointment}
          updatingIds={updatingIds}
          deletingIds={deletingIds}
        />
      )}
    </div>
  );
};

// ===================================
// 📊 Header Component
// ===================================

interface AppointmentsHeaderProps {
  statistics: any;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedCount: number;
  onBulkAction: (action: 'confirm' | 'decline' | 'delete') => void;
}

const AppointmentsHeader = ({
  statistics,
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  viewMode,
  onViewModeChange,
  selectedCount,
  onBulkAction,
}: AppointmentsHeaderProps) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 mb-6">
      {/* Title and Stats */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            רשימת תורים
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {statistics.showing} מתוך {statistics.total}
            </Badge>
            {statistics.pending > 0 && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {statistics.pending} ממתינים
              </Badge>
            )}
            {statistics.confirmed > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {statistics.confirmed} מאושרים
              </Badge>
            )}
            {statistics.pastCount > 0 && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                {statistics.pastCount} עברו
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="חיפוש לפי שם, טלפון או הערה..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Bulk Actions */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-700 font-medium">
              {selectedCount} נבחרו
            </span>
            <Button size="sm" onClick={() => onBulkAction('confirm')}>
              אשר
            </Button>
            <Button size="sm" variant="outline" onClick={() => onBulkAction('decline')}>
              דחה
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onBulkAction('delete')}>
              מחק
            </Button>
          </div>
        )}

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFilters}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showFilters
              ? 'bg-blue-100 text-blue-800'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <Filter className="w-4 h-4" />
            סינון
          </button>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              onClick={() => onViewModeChange('cards')}
              className={`p-2 rounded transition-colors ${viewMode === 'cards'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
              title="תצוגת כרטיסים"
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                {[1, 2, 3, 4].map(i => <div key={i} className="bg-current rounded-sm" />)}
              </div>
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-2 rounded transition-colors ${viewMode === 'table'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
              title="תצוגת טבלה"
            >
              <div className="w-4 h-4 flex flex-col gap-0.5">
                {[1, 2, 3].map(i => <div key={i} className="bg-current h-0.5 rounded-sm" />)}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================================
// 🔍 Filters Panel
// ===================================

interface FiltersPanelProps {
  filterStatus: FilterStatus;
  onFilterStatusChange: (status: FilterStatus) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  services: Service[];
  appointments: Appointment[];
}

const FiltersPanel = ({
  filterStatus,
  onFilterStatusChange,
  sortBy,
  onSortChange,
  services,
  appointments,
}: FiltersPanelProps) => {
  // Filter appointments
  const visibleAppointments = useMemo(() => {
    return appointments;
  }, [appointments]);

  const statusOptions = [
    { key: 'all', label: 'הכל', count: visibleAppointments.length },
    { key: 'pending', label: 'ממתינים', count: visibleAppointments.filter(apt => apt.status === 'pending').length },
    { key: 'confirmed', label: 'מאושרים', count: visibleAppointments.filter(apt => apt.status === 'confirmed').length },
    { key: 'declined', label: 'נדחו', count: visibleAppointments.filter(apt => apt.status === 'declined').length },
    { key: 'cancelled', label: 'בוטלו', count: visibleAppointments.filter(apt => apt.status === 'cancelled').length }
  ] as const;

  const sortOptions = [
    { key: 'date-asc', label: 'תאריך - הקרוב ביותר' },
    { key: 'date-desc', label: 'תאריך - הרחוק ביותר' },
    { key: 'name-asc', label: 'שם - א׳ עד ת׳' },
    { key: 'name-desc', label: 'שם - ת׳ עד א׳' },
    { key: 'status', label: 'סטטוס' }
  ] as const;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Filter */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">סטטוס תור</h4>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => onFilterStatusChange(option.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filterStatus === option.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
              >
                {option.label}
                <Badge
                  variant="secondary"
                  className={`text-xs ${filterStatus === option.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                    }`}
                >
                  {option.count}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">מיון</h4>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

// ===================================
// 📝 Content Components
// ===================================

interface AppointmentsContentProps {
  appointments: Appointment[];
  services: Service[];
  viewMode: ViewMode;
  selectedAppointments: Set<string>;
  onToggleSelection: (appointments: Set<string>) => void;
  onSelectAppointment: (id: string, selected: boolean) => void;
  onUpdateStatus: (id: string, status: 'confirmed' | 'declined' | 'cancelled') => void;
  onStatusUpdate: (id: string, status: 'confirmed' | 'declined' | 'cancelled') => Promise<void>;
  onDelete: (id: string) => void;
  onDeleteAppointment: (id: string) => Promise<void>;
  onEdit?: (appointment: Appointment) => void;
  onEditAppointment?: (appointment: Appointment) => void;
  updatingIds: Set<string>;
  deletingIds: Set<string>;
}

const AppointmentsContent = ({
  appointments,
  services,
  viewMode,
  selectedAppointments,
  onToggleSelection,
  onSelectAppointment,
  onUpdateStatus,
  onStatusUpdate,
  onDelete,
  onDeleteAppointment,
  onEdit,
  onEditAppointment,
  updatingIds,
  deletingIds
}: AppointmentsContentProps) => {
  if (viewMode === 'table') {
    return (
      <AppointmentsTable
        appointments={appointments}
        services={services}
        selectedAppointments={selectedAppointments}
        onToggleSelection={onToggleSelection}
        updatingIds={updatingIds}
        deletingIds={deletingIds}
        onUpdateStatus={onUpdateStatus}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    );
  }

  return (
    <AppointmentCards
      appointments={appointments}
      services={services}
      selectedAppointments={selectedAppointments}
      onSelectAppointment={onSelectAppointment}
      onStatusUpdate={onStatusUpdate}
      onDeleteAppointment={onDeleteAppointment}
      onEditAppointment={onEditAppointment}
      updatingIds={updatingIds}
      deletingIds={deletingIds}
    />
  );
};

// ===================================
// 🃏 Cards View
// ===================================

interface AppointmentCardsProps {
  appointments: Appointment[];
  services: Service[];
  selectedAppointments: Set<string>;
  onSelectAppointment: (id: string, selected: boolean) => void;
  onStatusUpdate: (id: string, status: 'confirmed' | 'declined' | 'cancelled') => Promise<void>;
  onDeleteAppointment: (id: string) => Promise<void>;
  onEditAppointment?: (appointment: Appointment) => void;
  updatingIds: Set<string>;
  deletingIds: Set<string>;
}

const AppointmentCards = ({
  appointments,
  services,
  selectedAppointments,
  onSelectAppointment,
  onStatusUpdate,
  onDeleteAppointment,
  onEditAppointment,
  updatingIds,
  deletingIds
}: AppointmentCardsProps) => {
  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'שירות לא זמין';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'ממתין';
      case 'confirmed': return 'מאושר';
      case 'declined': return 'נדחה';
      case 'cancelled': return 'בוטל';
      default: return status;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const isAppointmentPast = (date: string, time: string) => {
    const today = timeUtils.dateToLocalString(new Date());
    return timeUtils.isPastDate(new Date(date)) ||
      (date === today && timeUtils.isPastTime(time, new Date(date)));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {appointments.map((appointment) => {
        const isSelected = selectedAppointments.has(appointment.id);
        const isUpdating = updatingIds.has(appointment.id);
        const isDeleting = deletingIds.has(appointment.id);
        const isPast = isAppointmentPast(appointment.date, appointment.start_time);
        const isEditable = isAppointmentEditable({ date: appointment.date, time: appointment.start_time });

        return (
          <div
            key={appointment.id}
            className={`
              bg-white border rounded-xl p-4 transition-all duration-200 hover:shadow-md
              ${isSelected ? 'ring-2 ring-blue-500 border-blue-200' : 'border-gray-200'}
              ${isPast ? 'opacity-75' : ''}
              ${(appointment.status === 'declined' || appointment.status === 'cancelled') ? 'opacity-60' : ''}
            `}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onSelectAppointment(appointment.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Badge className={`text-xs ${getStatusColor(appointment.status)}`}>
                  {getStatusText(appointment.status)}
                </Badge>
              </div>

              {isPast && (
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                  עבר
                </Badge>
              )}
            </div>

            {/* Client Info */}
            <div className="space-y-2 mb-4">
              <h3 className="font-semibold text-gray-900 text-lg">
                {appointment.client_name}
              </h3>

              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{appointment.client_phone}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{formatDate(appointment.date)}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {appointment.start_time} - {appointment.end_time}
                </span>
              </div>

              {appointment.service_id && (
                <div className="text-sm text-gray-600">
                  <strong>שירות:</strong> {getServiceName(appointment.service_id)}
                </div>
              )}

              {appointment.note && (
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <strong>הערה:</strong> {appointment.note}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              {appointment.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => onStatusUpdate(appointment.id, 'confirmed')}
                    disabled={isUpdating || isDeleting}
                    className="flex-1"
                  >
                    {isUpdating ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 ml-1" />
                        אשר
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusUpdate(appointment.id, 'declined')}
                    disabled={isUpdating || isDeleting}
                    className="flex-1"
                  >
                    <X className="w-3 h-3 ml-1" />
                    דחה
                  </Button>
                </>
              )}

              {appointment.status === 'confirmed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusUpdate(appointment.id, 'cancelled')}
                  disabled={isUpdating || isDeleting}
                  className="flex-1"
                >
                  <X className="w-3 h-3 ml-1" />
                  בטל
                </Button>
              )}

              {isEditable && onEditAppointment && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditAppointment(appointment)}
                  disabled={isUpdating || isDeleting}
                >
                  <Edit className="w-3 h-3" />
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => onDeleteAppointment(appointment.id)}
                disabled={isUpdating || isDeleting}
                className="text-red-600 hover:text-red-800"
              >
                {isDeleting ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ===================================
// 📊 Table View Component - FIXED
// ===================================

interface AppointmentsTableProps {
  appointments: Appointment[];
  services: Service[];
  selectedAppointments: Set<string>;
  onToggleSelection: (appointments: Set<string>) => void;
  updatingIds: Set<string>;
  deletingIds: Set<string>;
  onUpdateStatus: (id: string, status: 'confirmed' | 'declined' | 'cancelled') => void;
  onDelete: (id: string) => void;
  onEdit?: (appointment: Appointment) => void;
}

const AppointmentsTable = ({
  appointments,
  services,
  selectedAppointments,
  onToggleSelection,
  updatingIds,
  deletingIds,
  onUpdateStatus,
  onDelete,
  onEdit
}: AppointmentsTableProps) => {
  const toggleAllSelection = () => {
    if (selectedAppointments.size === appointments.length) {
      onToggleSelection(new Set());
    } else {
      onToggleSelection(new Set(appointments.map(apt => apt.id)));
    }
  };

  const toggleSelection = (appointmentId: string) => {
    const newSelection = new Set(selectedAppointments);
    if (newSelection.has(appointmentId)) {
      newSelection.delete(appointmentId);
    } else {
      newSelection.add(appointmentId);
    }
    onToggleSelection(newSelection);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-right">
                <input
                  type="checkbox"
                  checked={selectedAppointments.size === appointments.length && appointments.length > 0}
                  onChange={toggleAllSelection}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">לקוח</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">תאריך ושעה</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">שירות</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">סטטוס</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <AppointmentTableRow
                key={appointment.id}
                appointment={appointment}
                services={services}
                isSelected={selectedAppointments.has(appointment.id)}
                onToggleSelection={() => toggleSelection(appointment.id)}
                isUpdating={updatingIds.has(appointment.id)}
                isDeleting={deletingIds.has(appointment.id)}
                onUpdateStatus={onUpdateStatus}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ===================================
// 📋 Table Row Component - FIXED
// ===================================

interface AppointmentTableRowProps {
  appointment: Appointment;
  services: Service[];
  isSelected: boolean;
  onToggleSelection: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
  onUpdateStatus: (id: string, status: 'confirmed' | 'declined' | 'cancelled') => void;
  onDelete: (id: string) => void;
  onEdit?: (appointment: Appointment) => void;
}

const AppointmentTableRow = ({
  appointment,
  services,
  isSelected,
  onToggleSelection,
  isUpdating,
  isDeleting,
  onUpdateStatus,
  onDelete,
  onEdit
}: AppointmentTableRowProps) => {
  const appointmentDateTime = new Date(`${appointment.date}T${appointment.start_time}`);
  const now = new Date();
  const isPast = appointmentDateTime < now;
  const isToday = appointment.date === timeUtils.dateToLocalString(new Date());
  const isEditable = isAppointmentEditable({ date: appointment.date, time: appointment.start_time });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'ממתין';
      case 'confirmed': return 'אושר';
      case 'declined': return 'נדחה';
      case 'cancelled': return 'בוטל';
      default: return status;
    }
  };

  const getServiceName = (serviceId?: string) => {
    if (!serviceId) return 'שירות כללי';
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'שירות לא זמין';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${isPast ? 'opacity-60' : ''} ${isToday && !isPast ? 'bg-blue-50' : ''} ${isSelected ? 'bg-blue-100' : ''}`}>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </td>

      <td className="px-4 py-3">
        <div>
          <div className="font-medium text-gray-900">{appointment.client_name}</div>
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {appointment.client_phone}
          </div>
          {appointment.note && (
            <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {appointment.note}
            </div>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="text-sm">
          <div className="font-medium text-gray-900">{formatDate(appointment.date)}</div>
          <div className="text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {appointment.start_time} - {appointment.end_time}
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="text-sm text-gray-900">{getServiceName(appointment.service_id)}</div>
      </td>

      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
          {getStatusText(appointment.status)}
        </span>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {appointment.status === 'pending' && (
            <>
              <button
                onClick={() => onUpdateStatus(appointment.id, 'confirmed')}
                disabled={isUpdating || isDeleting}
                className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
                title="אשר"
              >
                {isUpdating ? (
                  <div className="w-4 h-4 border border-green-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => onUpdateStatus(appointment.id, 'declined')}
                disabled={isUpdating || isDeleting}
                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                title="דחה"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}

          {appointment.status === 'confirmed' && (
            <button
              onClick={() => onUpdateStatus(appointment.id, 'cancelled')}
              disabled={isUpdating || isDeleting}
              className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors disabled:opacity-50"
              title="בטל"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {isEditable && onEdit && (
            <button
              onClick={() => onEdit(appointment)}
              disabled={isUpdating || isDeleting}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors disabled:opacity-50"
              title="ערוך"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onDelete(appointment.id)}
            disabled={isUpdating || isDeleting}
            className={`p-1 rounded transition-colors disabled:opacity-50 ${isEditable
              ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
              : 'text-gray-300 cursor-not-allowed'
              }`}
            title={isEditable ? 'מחק תור' : 'לא ניתן למחוק תור שעבר'}
          >
            {isDeleting ? (
              <div className="w-4 h-4 border border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
};

// ===================================
// 📭 Empty State
// ===================================

interface EmptyStateProps {
  searchQuery: string;
  filterStatus: FilterStatus;
  onClearFilters: () => void;
}

const EmptyState = ({ searchQuery, filterStatus, onClearFilters }: EmptyStateProps) => {
  const hasFilters = searchQuery || filterStatus !== 'all';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />

      {hasFilters ? (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            לא נמצאו תורים מתאימים
          </h3>
          <p className="text-gray-600 mb-4">
            נסה לשנות את מסנני החיפוש או הסינון
          </p>
          <Button onClick={onClearFilters} variant="outline">
            נקה מסננים
          </Button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            אין תורים עתידיים
          </h3>
          <p className="text-gray-600">
            כאשר לקוחות יקבעו תורים, הם יופיעו כאן
          </p>
        </>
      )}
    </div>
  );
};

// ===================================
// 💀 Loading Skeleton
// ===================================

const AppointmentsListSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="flex gap-4 mb-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-6 bg-gray-200 rounded w-20"></div>
            ))}
          </div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="animate-pulse">
              <div className="flex justify-between mb-3">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};