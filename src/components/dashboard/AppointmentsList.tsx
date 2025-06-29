// src/components/dashboard/AppointmentsList.tsx
'use client';

import { useState, useMemo } from 'react';
import { 
  Users, Phone, Calendar, Clock, CheckCircle, AlertCircle, X, Edit, 
  Trash2, Filter, Search, Copy, ChevronDown, MessageCircle, Sparkles
} from 'lucide-react';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
import { isAppointmentEditable } from '@/lib/appointment-utils';
import type { Appointment, Service } from '@/lib/types';

interface AppointmentsListProps {
  appointments: Appointment[];
  services: Service[];
  loading?: boolean;
  onUpdateStatus: (appointmentId: string, status: 'confirmed' | 'declined' | 'cancelled') => Promise<void>;
  onDeleteAppointment: (appointmentId: string) => Promise<void>;
  onEditAppointment?: (appointment: Appointment) => void;
  businessId: string;
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'declined' | 'cancelled';
type SortOption = 'date-asc' | 'date-desc' | 'name-asc' | 'name-desc' | 'status';
type ViewMode = 'cards' | 'table';

export const AppointmentsList = ({
  appointments,
  services,
  loading = false,
  onUpdateStatus,
  onDeleteAppointment,
  onEditAppointment,
  businessId
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
          return new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime();
        case 'date-desc':
          return new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime();
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
    const total = filteredAndSortedAppointments.length;
    const pending = filteredAndSortedAppointments.filter(apt => apt.status === 'pending').length;
    const confirmed = filteredAndSortedAppointments.filter(apt => apt.status === 'confirmed').length;
    const today = new Date().toISOString().split('T')[0];
    const todayCount = filteredAndSortedAppointments.filter(apt => apt.date === today && apt.status === 'confirmed').length;

    return { total, pending, confirmed, todayCount };
  }, [filteredAndSortedAppointments]);

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
        <EmptyAppointmentsState 
          hasFilter={filterStatus !== 'all' || searchQuery.trim() !== ''}
          onClearFilters={() => {
            setFilterStatus('all');
            setSearchQuery('');
          }}
        />
      ) : (
        <>
          {viewMode === 'cards' ? (
            <AppointmentsCardsView
              appointments={filteredAndSortedAppointments}
              services={services}
              selectedAppointments={selectedAppointments}
              onToggleSelection={setSelectedAppointments}
              updatingIds={updatingIds}
              deletingIds={deletingIds}
              onUpdateStatus={handleStatusUpdate}
              onDelete={handleDelete}
              onEdit={onEditAppointment}
            />
          ) : (
            <AppointmentsTableView
              appointments={filteredAndSortedAppointments}
              services={services}
              selectedAppointments={selectedAppointments}
              onToggleSelection={setSelectedAppointments}
              updatingIds={updatingIds}
              deletingIds={deletingIds}
              onUpdateStatus={handleStatusUpdate}
              onDelete={handleDelete}
              onEdit={onEditAppointment}
            />
          )}

          {/* Summary */}
          <AppointmentsSummary
            appointments={filteredAndSortedAppointments}
            totalAppointments={appointments.length}
          />
        </>
      )}
    </div>
  );
};

// ===================================
// 🎨 Header Component
// ===================================

interface AppointmentsHeaderProps {
  statistics: { total: number; pending: number; confirmed: number; todayCount: number };
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
  onBulkAction
}: AppointmentsHeaderProps) => {
  return (
    <div className="mb-6">
      {/* Title and Stats */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">כל התורים</h3>
          <p className="text-gray-600 text-sm mt-1">
            {statistics.total} תורים במערכת • {statistics.pending} ממתינים • {statistics.todayCount} היום
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">{statistics.pending}</div>
            <div className="text-xs text-gray-500">ממתינים</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{statistics.confirmed}</div>
            <div className="text-xs text-gray-500">מאושרים</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{statistics.todayCount}</div>
            <div className="text-xs text-gray-500">היום</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Left Side - Search and Filters */}
        <div className="flex items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="חפש לפי שם, טלפון או הערה..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters Toggle */}
          <button
            onClick={onToggleFilters}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showFilters
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">פילטרים</span>
          </button>
        </div>

        {/* Right Side - View Controls and Bulk Actions */}
        <div className="flex items-center gap-3">
          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm text-blue-700 font-medium">{selectedCount} נבחרו</span>
              <div className="flex gap-1">
                <button
                  onClick={() => onBulkAction('confirm')}
                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                  title="אשר הכל"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onBulkAction('decline')}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                  title="דחה הכל"
                >
                  <AlertCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onBulkAction('delete')}
                  className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                  title="מחק הכל"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('cards')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="תצוגת כרטיסים"
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                {[1,2,3,4].map(i => <div key={i} className="bg-current rounded-sm" />)}
              </div>
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="תצוגת טבלה"
            >
              <div className="w-4 h-4 flex flex-col gap-0.5">
                {[1,2,3].map(i => <div key={i} className="bg-current h-0.5 rounded-sm" />)}
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
  appointments
}: FiltersPanelProps) => {
  const statusOptions = [
    { key: 'all', label: 'הכל', count: appointments.length },
    { key: 'pending', label: 'ממתינים', count: appointments.filter(apt => apt.status === 'pending').length },
    { key: 'confirmed', label: 'מאושרים', count: appointments.filter(apt => apt.status === 'confirmed').length },
    { key: 'declined', label: 'נדחו', count: appointments.filter(apt => apt.status === 'declined').length },
    { key: 'cancelled', label: 'בוטלו', count: appointments.filter(apt => apt.status === 'cancelled').length }
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
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  filterStatus === option.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {option.label}
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  filterStatus === option.key
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {option.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">מיון</h4>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {sortOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================================
// 🎨 Cards View Component
// ===================================

interface AppointmentsCardsViewProps {
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

const AppointmentsCardsView = ({
  appointments,
  services,
  selectedAppointments,
  onToggleSelection,
  updatingIds,
  deletingIds,
  onUpdateStatus,
  onDelete,
  onEdit
}: AppointmentsCardsViewProps) => {
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
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <AppointmentCard
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
    </div>
  );
};

// ===================================
// 🎯 Individual Appointment Card
// ===================================

interface AppointmentCardProps {
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

const AppointmentCard = ({
  appointment,
  services,
  isSelected,
  onToggleSelection,
  isUpdating,
  isDeleting,
  onUpdateStatus,
  onDelete,
  onEdit
}: AppointmentCardProps) => {
  const [copied, setCopied] = useState(false);

  const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
  const now = new Date();
  const isPast = appointmentDateTime < now;
  const isToday = appointment.date === now.toISOString().split('T')[0];
  const isEditable = isAppointmentEditable(appointment, 1);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'declined': return <AlertCircle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(appointment.client_phone);
      setCopied(true);
      showSuccessToast('מספר טלפון הועתק');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showErrorToast('שגיאה בהעתקת מספר הטלפון');
    }
  };

  return (
    <div className={`
      bg-white border-2 rounded-2xl p-6 shadow-sm transition-all duration-200 hover:shadow-md
      ${isSelected ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'}
      ${isPast ? 'opacity-60' : ''}
      ${isToday && !isPast ? 'border-orange-300 bg-orange-50/30' : ''}
    `}>
      <div className="flex items-center justify-between">
        {/* Left Side - Selection & Content */}
        <div className="flex items-center gap-4 flex-1">
          {/* Selection Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelection}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>

          {/* Status Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isPast ? 'bg-gray-100' : 
            appointment.status === 'confirmed' ? 'bg-green-100' :
            appointment.status === 'declined' ? 'bg-red-100' :
            appointment.status === 'cancelled' ? 'bg-gray-100' :
            'bg-yellow-100'
          }`}>
            {isPast ? (
              <Clock className="w-6 h-6 text-gray-500" />
            ) : (
              <div className={`w-6 h-6 ${
                appointment.status === 'confirmed' ? 'text-green-600' :
                appointment.status === 'declined' ? 'text-red-600' :
                appointment.status === 'cancelled' ? 'text-gray-600' :
                'text-yellow-600'
              }`}>
                {getStatusIcon(appointment.status)}
              </div>
            )}
          </div>

          {/* Appointment Details */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h5 className="font-semibold text-gray-900 text-lg">{appointment.client_name}</h5>
              
              {/* Status Badge */}
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}>
                {getStatusText(appointment.status)}
              </span>

              {/* Today Badge */}
              {isToday && !isPast && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                  🔥 היום
                </span>
              )}

              {/* Past Badge */}
              {isPast && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                  ✓ הושלם
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {/* Phone */}
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{appointment.client_phone}</span>
                <button
                  onClick={copyPhone}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="העתק מספר טלפון"
                >
                  {copied ? <CheckCircle className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-400" />}
                </button>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{formatDate(appointment.date)} • {appointment.time}</span>
              </div>

              {/* Service */}
              {appointment.service_id && (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gray-500" />
                  <span className="text-blue-600 font-medium">
                    {services.find(s => s.id === appointment.service_id)?.name || 'שירות לא ידוע'}
                  </span>
                </div>
              )}

              {/* Created Time */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-xs">
                  נוצר {new Date(appointment.created_at).toLocaleDateString('he-IL')}
                </span>
              </div>
            </div>

            {/* Note */}
            {appointment.note && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 text-gray-500 mt-0.5" />
                  <p className="text-gray-600 text-sm">💬 {appointment.note}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-2">
          {/* Status Actions */}
          {appointment.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateStatus(appointment.id, 'confirmed')}
                disabled={isUpdating || isDeleting}
                className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {isUpdating ? (
                  <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">אשר</span>
              </button>
              <button
                onClick={() => onUpdateStatus(appointment.id, 'declined')}
                disabled={isUpdating || isDeleting}
                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {isUpdating ? (
                  <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">דחה</span>
              </button>
            </div>
          )}

          {/* Edit/Delete Actions */}
          <div className="flex gap-1">
            {/* Edit Button */}
            <button
              onClick={() => onEdit?.(appointment)}
              disabled={!isEditable || isUpdating || isDeleting}
              className={`p-2 rounded-lg transition-colors ${
                isEditable && !isUpdating && !isDeleting
                  ? 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title={isEditable ? 'ערוך תור' : 'לא ניתן לערוך תור שעבר'}
            >
              <Edit className="w-4 h-4" />
            </button>

            {/* Delete Button */}
            <button
              onClick={() => onDelete(appointment.id)}
              disabled={!isEditable || isUpdating || isDeleting}
              className={`p-2 rounded-lg transition-colors ${
                isEditable && !isUpdating && !isDeleting
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
        </div>
      </div>
    </div>
  );
};

// ===================================
// 📊 Table View Component
// ===================================

interface AppointmentsTableViewProps extends AppointmentsCardsViewProps {}

const AppointmentsTableView = ({
  appointments,
  services,
  selectedAppointments,
  onToggleSelection,
  updatingIds,
  deletingIds,
  onUpdateStatus,
  onDelete,
  onEdit
}: AppointmentsTableViewProps) => {
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
                  checked={appointments.length > 0 && selectedAppointments.size === appointments.length}
                  onChange={toggleAllSelection}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">סטטוס</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">לקוח</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">טלפון</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">תאריך ושעה</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">שירות</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">פעולות</th>
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
// 📋 Table Row Component
// ===================================

interface AppointmentTableRowProps extends AppointmentCardProps {}

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
  const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
  const now = new Date();
  const isPast = appointmentDateTime < now;
  const isToday = appointment.date === now.toISOString().split('T')[0];
  const isEditable = isAppointmentEditable(appointment, 1);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${isPast ? 'opacity-60' : ''} ${isToday && !isPast ? 'bg-orange-50' : ''}`}>
      {/* Selection */}
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
          {getStatusText(appointment.status)}
        </span>
      </td>

      {/* Client */}
      <td className="px-4 py-3">
        <div>
          <div className="font-medium text-gray-900">{appointment.client_name}</div>
          {appointment.note && (
            <div className="text-xs text-gray-500 mt-1 truncate max-w-40" title={appointment.note}>
              💬 {appointment.note}
            </div>
          )}
        </div>
      </td>

      {/* Phone */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{appointment.client_phone}</span>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(appointment.client_phone);
              showSuccessToast('מספר טלפון הועתק');
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="העתק מספר טלפון"
          >
            <Copy className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      </td>

      {/* Date & Time */}
      <td className="px-4 py-3">
        <div className="text-sm">
          <div className="text-gray-900">
            {new Date(appointment.date).toLocaleDateString('he-IL', {
              day: 'numeric',
              month: 'short'
            })}
          </div>
          <div className="text-gray-500">{appointment.time}</div>
        </div>
      </td>

      {/* Service */}
      <td className="px-4 py-3">
        <div className="text-sm text-blue-600">
          {appointment.service_id 
            ? services.find(s => s.id === appointment.service_id)?.name || 'שירות לא ידוע'
            : '-'
          }
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {/* Status Actions */}
          {appointment.status === 'pending' && (
            <>
              <button
                onClick={() => onUpdateStatus(appointment.id, 'confirmed')}
                disabled={isUpdating || isDeleting}
                className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
                title="אשר תור"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => onUpdateStatus(appointment.id, 'declined')}
                disabled={isUpdating || isDeleting}
                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                title="דחה תור"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Edit Button */}
          <button
            onClick={() => onEdit?.(appointment)}
            disabled={!isEditable || isUpdating || isDeleting}
            className={`p-1 rounded transition-colors ${
              isEditable && !isUpdating && !isDeleting
                ? 'text-gray-500 hover:text-blue-600 hover:bg-blue-100'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title={isEditable ? 'ערוך תור' : 'לא ניתן לערוך תור שעבר'}
          >
            <Edit className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(appointment.id)}
            disabled={!isEditable || isUpdating || isDeleting}
            className={`p-1 rounded transition-colors ${
              isEditable && !isUpdating && !isDeleting
                ? 'text-gray-500 hover:text-red-600 hover:bg-red-100'
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
// 📊 Summary Component
// ===================================

interface AppointmentsSummaryProps {
  appointments: Appointment[];
  totalAppointments: number;
}

const AppointmentsSummary = ({ appointments, totalAppointments }: AppointmentsSummaryProps) => {
  const stats = {
    showing: appointments.length,
    total: totalAppointments,
    confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
    pending: appointments.filter(apt => apt.status === 'pending').length,
    uniqueClients: new Set(appointments.map(apt => apt.client_phone)).size
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
          <div className="text-blue-800 text-sm">תורים מאושרים</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-yellow-800 text-sm">ממתינים לאישור</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-600">{stats.uniqueClients}</div>
          <div className="text-purple-800 text-sm">לקוחות ייחודיים</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-600">{stats.showing}/{stats.total}</div>
          <div className="text-gray-800 text-sm">מוצגים מתוך הכל</div>
        </div>
      </div>
    </div>
  );
};

// ===================================
// 🌟 Empty State Component
// ===================================

interface EmptyAppointmentsStateProps {
  hasFilter: boolean;
  onClearFilters: () => void;
}

const EmptyAppointmentsState = ({ hasFilter, onClearFilters }: EmptyAppointmentsStateProps) => {
  if (hasFilter) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">לא נמצאו תורים</h4>
        <p className="text-gray-600 mb-6">
          לא נמצאו תורים התואמים את הפילטרים שבחרת
        </p>
        <button
          onClick={onClearFilters}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
        >
          נקה פילטרים
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users className="w-8 h-8 text-gray-400" />
      </div>
      <h4 className="text-lg font-semibold text-gray-900 mb-2">אין תורים עדיין</h4>
      <p className="text-gray-600">
        כל התורים שלך יופיעו כאן ברגע שלקוחות יתחילו להזמין
      </p>
    </div>
  );
};

// ===================================
// 💀 Loading Skeleton
// ===================================

const AppointmentsListSkeleton = () => {
  return (
    <div>
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="h-10 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
        </div>
      </div>

      {/* Cards Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border-2 border-gray-200 rounded-2xl p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-16 h-8 bg-gray-200 rounded-lg"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentsList;