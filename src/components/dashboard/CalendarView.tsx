// src/components/dashboard/CalendarView.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Calendar, ChevronLeft, ChevronRight, Clock, Users, Plus,
    Eye, Settings, TrendingUp, BarChart, CheckCircle, AlertCircle,
    Filter, Sparkles, MapPin, Phone, MessageCircle, X, Tag
} from 'lucide-react';
import { showSuccessToast } from '@/lib/toast-utils';
import type { Appointment, Availability, Service } from '@/lib/types';

interface CalendarViewProps {
    appointments: Appointment[];
    availability: Availability[];
    services: Service[];
    businessId: string;
    onCreateAppointment?: (date: string, time: string) => void;
    onEditAppointment?: (appointment: Appointment) => void;
    onUpdateStatus?: (appointmentId: string, status: 'confirmed' | 'declined') => void;
}

type CalendarViewMode = 'month' | 'week' | 'work-days' | 'day' | 'agenda';

export const CalendarView = ({
    appointments,
    availability,
    services,
    businessId,
    onCreateAppointment,
    onEditAppointment,
    onUpdateStatus
}: CalendarViewProps) => {
    // ===================================
    // 🎯 State Management
    // ===================================
    const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showAvailabilityOnly, setShowAvailabilityOnly] = useState(false);
    const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());

    // עדכון זמן נוכחי כל דקה
    useEffect(() => {
        const updateCurrentTime = () => setCurrentTime(new Date());
        updateCurrentTime();

        const timer = setInterval(updateCurrentTime, 60000);
        return () => clearInterval(timer);
    }, []);

    // ===================================
    // 📊 Computed Data
    // ===================================

    const filteredAppointments = useMemo(() => {
        let filtered = appointments;

        // Filter by selected services
        if (selectedServices.size > 0) {
            filtered = filtered.filter(apt =>
                apt.service_id && selectedServices.has(apt.service_id)
            );
        }

        return filtered;
    }, [appointments, selectedServices]);

    const calendarStats = useMemo(() => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const thisWeek = getWeekRange(now);
        const thisMonth = getMonthRange(now);

        return {
            today: filteredAppointments.filter(apt => apt.date === today && apt.status === 'confirmed').length,
            thisWeek: filteredAppointments.filter(apt => {
                const aptDate = new Date(apt.date);
                return aptDate >= thisWeek.start && aptDate <= thisWeek.end && apt.status === 'confirmed';
            }).length,
            thisMonth: filteredAppointments.filter(apt => {
                const aptDate = new Date(apt.date);
                return aptDate >= thisMonth.start && aptDate <= thisMonth.end && apt.status === 'confirmed';
            }).length,
            pending: filteredAppointments.filter(apt => apt.status === 'pending').length
        };
    }, [filteredAppointments]);

    // ===================================
    // 🔧 Navigation Functions
    // ===================================

    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);

        switch (viewMode) {
            case 'month':
                newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
                break;
            case 'week':
            case 'work-days':
                newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
                break;
            case 'day':
                newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
                break;
        }

        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(new Date());
    };

    const handleServiceFilter = (serviceId: string) => {
        const newSelection = new Set(selectedServices);
        if (newSelection.has(serviceId)) {
            newSelection.delete(serviceId);
        } else {
            newSelection.add(serviceId);
        }
        setSelectedServices(newSelection);
    };

    // פונקציה לקבלת מיקום השעה הנוכחית
    const getCurrentTimePosition = (timeSlot: string): { showLine: boolean; percentage: number } => {
        const now = currentTime;
        const hours = now.getHours();
        const minutes = now.getMinutes();

        const [slotHour] = timeSlot.split(':').map(Number);
        const slotMinutes = slotHour * 60;
        const currentMinutes = hours * 60 + minutes;
        const nextSlotMinutes = slotMinutes + 60; // 60 דקות לכל משבצת

        if (currentMinutes >= slotMinutes && currentMinutes < nextSlotMinutes) {
            const percentage = ((currentMinutes - slotMinutes) / 60) * 100;
            return { showLine: true, percentage };
        }

        return { showLine: false, percentage: 0 };
    };

    return (
        <div>
            {/* Header Controls */}
            <CalendarHeader
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                currentDate={currentDate}
                onNavigate={navigateDate}
                onGoToToday={goToToday}
                stats={calendarStats}
                showAvailabilityOnly={showAvailabilityOnly}
                onToggleAvailability={() => setShowAvailabilityOnly(!showAvailabilityOnly)}
                availability={availability}
            />

            {/* Filters */}
            <CalendarFilters
                services={services}
                selectedServices={selectedServices}
                onServiceToggle={handleServiceFilter}
                onClearFilters={() => setSelectedServices(new Set())}
            />

            {/* Calendar Content */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                {viewMode === 'month' && (
                    <MonthView
                        currentDate={currentDate}
                        appointments={filteredAppointments}
                        availability={availability}
                        services={services}
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        showAvailabilityOnly={showAvailabilityOnly}
                        onCreateAppointment={onCreateAppointment}
                        onEditAppointment={onEditAppointment}
                    />
                )}

                {viewMode === 'week' && (
                    <WeekView
                        currentDate={currentDate}
                        appointments={filteredAppointments}
                        availability={availability}
                        services={services}
                        onCreateAppointment={onCreateAppointment}
                        onEditAppointment={onEditAppointment}
                        onUpdateStatus={onUpdateStatus}
                        currentTime={currentTime}  // 👈 הוסף
                        getCurrentTimePosition={getCurrentTimePosition}
                    />
                )}

                {viewMode === 'work-days' && (
                    <WorkDaysView
                        currentDate={currentDate}
                        appointments={filteredAppointments}
                        availability={availability}
                        services={services}
                        onCreateAppointment={onCreateAppointment}
                        onEditAppointment={onEditAppointment}
                        onUpdateStatus={onUpdateStatus}
                        currentTime={currentTime}
                        getCurrentTimePosition={getCurrentTimePosition}
                    />
                )}

                {viewMode === 'day' && (
                    <DayView
                        currentDate={currentDate}
                        appointments={filteredAppointments}
                        availability={availability}
                        services={services}
                        onCreateAppointment={onCreateAppointment}
                        onEditAppointment={onEditAppointment}
                        onUpdateStatus={onUpdateStatus}
                    />
                )}

                {viewMode === 'agenda' && (
                    <AgendaView
                        currentDate={currentDate}
                        appointments={filteredAppointments}
                        services={services}
                        onEditAppointment={onEditAppointment}
                        onUpdateStatus={onUpdateStatus}
                    />
                )}
            </div>

            {/* Selected Date Panel */}
            {selectedDate && viewMode === 'month' && (
                <SelectedDatePanel
                    date={selectedDate}
                    appointments={filteredAppointments.filter(apt => apt.date === selectedDate.toISOString().split('T')[0])}
                    services={services}
                    onEditAppointment={onEditAppointment}
                    onUpdateStatus={onUpdateStatus}
                    onCreateAppointment={onCreateAppointment}
                    onClose={() => setSelectedDate(null)}
                />
            )}
        </div>
    );
};

// ===================================
// 🎨 Header Component
// ===================================

interface CalendarHeaderProps {
    viewMode: CalendarViewMode;
    onViewModeChange: (mode: CalendarViewMode) => void;
    currentDate: Date;
    onNavigate: (direction: 'prev' | 'next') => void;
    onGoToToday: () => void;
    stats: { today: number; thisWeek: number; thisMonth: number; pending: number };
    showAvailabilityOnly: boolean;
    onToggleAvailability: () => void;
    availability: Availability[];
}

const CalendarHeader = ({
    viewMode,
    onViewModeChange,
    currentDate,
    onNavigate,
    onGoToToday,
    stats,
    showAvailabilityOnly,
    onToggleAvailability,
    availability
}: CalendarHeaderProps) => {
    const formatHeaderDate = () => {
        switch (viewMode) {
            case 'month':
                return currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
            case 'week':
                const weekStart = getWeekStart(currentDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                return `${weekStart.getDate()}-${weekEnd.getDate()} ${weekStart.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}`;
            case 'work-days':
                const workDays = availability
                    .filter((avail: any) => avail.is_active)
                    .map((avail: any) => avail.day_of_week)
                    .filter((value: number, index: number, self: number[]) => self.indexOf(value) === index)
                    .sort();

                if (workDays.length === 0) {
                    return currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }) + ' - אין ימי עבודה';
                }

                const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
                const workDayNames = workDays.map(day => dayNames[day]).join(', ');
                const weekStart2 = getWeekStart(currentDate);
                return `ימי עבודה (${workDayNames}) - ${weekStart2.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}`;
            case 'day':
                return currentDate.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            case 'agenda':
                return 'סדר יום';
            default:
                return '';
        }
    };

    const viewModes = [
        { key: 'month' as const, label: 'חודש', icon: '🗓️' },
        { key: 'week' as const, label: 'שבוע', icon: '📅' },
        { key: 'work-days' as const, label: 'ימי עבודה', icon: '💼' },
        { key: 'day' as const, label: 'יום', icon: '📋' },
        { key: 'agenda' as const, label: 'סדר יום', icon: '📝' }
    ];

    return (
        <div className="mb-6">
            {/* Title and Navigation */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-gray-900">יומן תורים</h3>

                    {/* Navigation */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onNavigate('prev')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="תקופה קודמת"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        <div className="min-w-48 text-center">
                            <h4 className="font-semibold text-gray-900">{formatHeaderDate()}</h4>
                        </div>

                        <button
                            onClick={() => onNavigate('next')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="תקופה הבאה"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <button
                            onClick={onGoToToday}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            היום
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">{stats.today}</div>
                        <div className="text-xs text-gray-500">היום</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{stats.thisWeek}</div>
                        <div className="text-xs text-gray-500">השבוע</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{stats.thisMonth}</div>
                        <div className="text-xs text-gray-500">החודש</div>
                    </div>
                    {stats.pending > 0 && (
                        <div className="text-center">
                            <div className="text-lg font-bold text-yellow-600">{stats.pending}</div>
                            <div className="text-xs text-gray-500">ממתינים</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* View Mode Selector */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                    {viewModes.map((mode) => (
                        <button
                            key={mode.key}
                            onClick={() => onViewModeChange(mode.key)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === mode.key
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <span className="text-xs">{mode.icon}</span>
                            <span className="hidden sm:inline">{mode.label}</span>
                        </button>
                    ))}
                </div>

                {/* Options */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onToggleAvailability}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showAvailabilityOnly
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <Eye className="w-4 h-4" />
                        {showAvailabilityOnly ? 'הצג הכל' : 'רק זמינות'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ===================================
// 🔽 Filters Component
// ===================================

interface CalendarFiltersProps {
    services: Service[];
    selectedServices: Set<string>;
    onServiceToggle: (serviceId: string) => void;
    onClearFilters: () => void;
}

const CalendarFilters = ({
    services,
    selectedServices,
    onServiceToggle,
    onClearFilters
}: CalendarFiltersProps) => {
    if (services.length === 0) return null;

    return (
        <div className="mb-4 p-4 bg-gray-50 rounded-xl border">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">סינון לפי שירותים</span>
                </div>
                {selectedServices.size > 0 && (
                    <button
                        onClick={onClearFilters}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        נקה הכל
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {services.map((service) => (
                    <button
                        key={service.id}
                        onClick={() => onServiceToggle(service.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedServices.has(service.id)
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <Tag className="w-3 h-3" />
                        {service.name}
                        {service.duration_minutes && (
                            <span className="text-xs opacity-75">({service.duration_minutes}ד)</span>
                        )}
                    </button>
                ))}
            </div>

            {selectedServices.size > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                    מציג תורים עבור {selectedServices.size} שירותים
                </div>
            )}
        </div>
    );
};

// ===================================
// 📅 Month View Component
// ===================================

interface MonthViewProps {
    currentDate: Date;
    appointments: Appointment[];
    availability: Availability[];
    services: Service[];
    selectedDate: Date | null;
    onDateSelect: (date: Date) => void;
    showAvailabilityOnly: boolean;
    onCreateAppointment?: (date: string, time: string) => void;
    onEditAppointment?: (appointment: Appointment) => void;
}

const MonthView = ({
    currentDate,
    appointments,
    availability,
    services,
    selectedDate,
    onDateSelect,
    showAvailabilityOnly,
    onCreateAppointment,
    onEditAppointment
}: MonthViewProps) => {
    const monthData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // First day of month
        const firstDay = new Date(year, month, 1);
        // Last day of month
        const lastDay = new Date(year, month + 1, 0);

        // Start from Sunday of the first week
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        // End at Saturday of the last week
        const endDate = new Date(lastDay);
        endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

        const days = [];
        const current = new Date(startDate);

        while (current <= endDate) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return { days, firstDay, lastDay };
    }, [currentDate]);

    const getDayAppointments = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return appointments.filter(apt => apt.date === dateStr);
    };

    const isDayAvailable = (date: Date) => {
        const dayOfWeek = date.getDay();
        return availability.some(avail => avail.day_of_week === dayOfWeek && avail.is_active);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === currentDate.getMonth();
    };

    const weekDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

    return (
        <div className="p-6">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-4">
                {weekDays.map((day, index) => (
                    <div key={index} className="p-2 text-center text-sm font-medium text-gray-500">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {monthData.days.map((date, index) => {
                    const dayAppointments = getDayAppointments(date);
                    const isAvailable = isDayAvailable(date);
                    const todayDate = isToday(date);
                    const currentMonth = isCurrentMonth(date);
                    const isSelected = selectedDate?.toDateString() === date.toDateString();

                    return (
                        <div
                            key={index}
                            onClick={() => onDateSelect(date)}
                            className={`
                min-h-24 p-2 border border-gray-100 cursor-pointer transition-all duration-200
                ${currentMonth ? 'bg-white' : 'bg-gray-50'}
                ${todayDate ? 'border-blue-400 bg-blue-50' : ''}
                ${isSelected ? 'ring-2 ring-blue-500 bg-blue-100' : ''}
                hover:bg-gray-50
                ${!currentMonth ? 'opacity-60' : ''}
              `}
                        >
                            {/* Date Number */}
                            <div className={`text-sm font-medium mb-1 ${todayDate ? 'text-blue-600' :
                                currentMonth ? 'text-gray-900' : 'text-gray-400'
                                }`}>
                                {date.getDate()}
                            </div>

                            {/* Availability Indicator */}
                            {isAvailable && (
                                <div className="w-2 h-2 bg-green-400 rounded-full mb-1"></div>
                            )}

                            {/* Appointments */}
                            {!showAvailabilityOnly && (
                                <div className="space-y-1">
                                    {dayAppointments.slice(0, 3).map((apt) => {
                                        const service = services.find(s => s.id === apt.service_id);
                                        return (
                                            <div
                                                key={apt.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditAppointment?.(apt);
                                                }}
                                                className={`
                          text-xs px-1 py-0.5 rounded truncate cursor-pointer
                          ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                        apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            apt.status === 'declined' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-100 text-gray-700'}
                        `}
                                                title={`${apt.time} - ${apt.client_name}${service ? ` (${service.name})` : ''}`}
                                            >
                                                {apt.time} {apt.client_name}
                                            </div>
                                        );
                                    })}
                                    {dayAppointments.length > 3 && (
                                        <div className="text-xs text-gray-500 px-1">
                                            +{dayAppointments.length - 3} נוספים
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ===================================
// 📅 Week View Component
// ===================================

interface WeekViewProps {
    currentDate: Date;
    appointments: Appointment[];
    availability: Availability[];
    services: Service[];
    currentTime: Date;
    getCurrentTimePosition: (timeSlot: string) => { showLine: boolean; percentage: number };  // 👈 הוסף
    onCreateAppointment?: (date: string, time: string) => void;
    onEditAppointment?: (appointment: Appointment) => void;
    onUpdateStatus?: (appointmentId: string, status: 'confirmed' | 'declined') => void;
}

const WeekView = ({
    currentDate,
    appointments,
    availability,
    services,
    currentTime,
    getCurrentTimePosition,
    onCreateAppointment,
    onEditAppointment,
    onUpdateStatus
}: WeekViewProps) => {

    const weekData = useMemo(() => {
        const weekStart = getWeekStart(currentDate);
        const days = [];

        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            days.push(day);
        }

        return days;
    }, [currentDate]);

    const timeSlots = useMemo(() => {
        const slots = [];
        for (let hour = 0; hour <= 23; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        return slots;
    }, []);

    const getDayAppointments = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return appointments.filter(apt => apt.date === dateStr);
    };

    const isDayAvailable = (date: Date, time: string) => {
        const dayOfWeek = date.getDay();
        const [hour, minute] = time.split(':').map(Number);
        const timeMinutes = hour * 60 + minute;

        return availability.some(avail => {
            if (avail.day_of_week !== dayOfWeek || !avail.is_active) return false;

            const [startHour, startMinute] = avail.start_time.split(':').map(Number);
            const [endHour, endMinute] = avail.end_time.split(':').map(Number);
            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;

            return timeMinutes >= startMinutes && timeMinutes < endMinutes;
        });
    };

    const weekDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

    return (
        <div className="flex flex-col h-[500px] overflow-hidden">
            {/* Week Header */}
            <div className="flex border-b border-gray-200">
                <div className="w-20 p-4 text-center text-sm font-medium text-gray-500">שעה</div>
                {weekData.map((date, index) => (
                    <div key={index} className="flex-1 p-4 text-center border-l border-gray-200">
                        <div className="text-sm font-medium text-gray-600">{weekDays[date.getDay()]}</div>
                        <div className={`text-lg font-bold ${isToday(date) ? 'text-blue-600' : 'text-gray-900'}`}>
                            {date.getDate()}
                        </div>
                    </div>
                ))}
            </div>

            {/* Time Slots */}
            <div className="flex-1 overflow-y-auto">
                <div className="flex">
                    {/* Time Column */}
                    <div className="w-20">
                        {timeSlots.map((time) => (
                            <div key={time} className="h-12 p-2 text-xs text-gray-500 border-b border-gray-100">
                                {time}
                            </div>
                        ))}
                    </div>

                    {/* Days Columns */}
                    {weekData.map((date, dayIndex) => {
                        const dayAppointments = getDayAppointments(date);

                        return (
                            <div key={dayIndex} className="flex-1 border-l border-gray-200">
                                {timeSlots.map((time) => {
                                    const isAvailable = isDayAvailable(date, time);
                                    const appointment = dayAppointments.find(apt => apt.time === time);
                                    const dateStr = date.toISOString().split('T')[0];

                                    // Calculate current time position
                                    const timePosition = getCurrentTimePosition(time);
                                    const showCurrentTime = isToday(date) && timePosition.showLine;

                                    return (
                                        <div
                                            key={time}
                                            onClick={() => {
                                                if (appointment) {
                                                    onEditAppointment?.(appointment);
                                                } else if (isAvailable && onCreateAppointment) {
                                                    onCreateAppointment(dateStr, time);
                                                }
                                            }}
                                            className={`
                                                relative h-12 p-1 border-b border-gray-100 cursor-pointer transition-colors
                                                ${isAvailable ? 'bg-green-50 hover:bg-green-100' : 'bg-gray-50'}
                                                ${appointment ? 'bg-blue-100 hover:bg-blue-200' : ''}
                                            `}
                                        >
                                            {/* 👇 הקו האדום */}
                                            {showCurrentTime && (
                                                <div
                                                    className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 shadow-sm"
                                                    style={{ top: `${timePosition.percentage}%` }}
                                                >
                                                    <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full shadow-sm"></div>
                                                    <div className="absolute -left-16 -top-3 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                                        {currentTime.toLocaleTimeString('he-IL', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: false
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {appointment && (
                                                <div className={`
                                                    text-xs p-1 rounded h-full overflow-hidden
                                                    ${appointment.status === 'confirmed' ? 'bg-green-200 text-green-800' :
                                                        appointment.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                                                            appointment.status === 'declined' ? 'bg-red-200 text-red-800' :
                                                                'bg-gray-200 text-gray-800'}
                                                `}>
                                                    <div className="font-medium truncate">{appointment.client_name}</div>
                                                    {appointment.service_id && (
                                                        <div className="truncate opacity-75">
                                                            {services.find(s => s.id === appointment.service_id)?.name}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// ===================================
// 💼 Work Days View Component
// ===================================

interface WorkDaysViewProps {
    currentDate: Date;
    appointments: Appointment[];
    availability: Availability[];
    services: Service[];
    currentTime: Date;
    getCurrentTimePosition: (timeSlot: string) => { showLine: boolean; percentage: number };  // 👈 הוסף את זה
    onCreateAppointment?: (date: string, time: string) => void;
    onEditAppointment?: (appointment: Appointment) => void;
    onUpdateStatus?: (appointmentId: string, status: 'confirmed' | 'declined') => void;
}

const WorkDaysView = ({
    currentDate,
    appointments,
    availability,
    services,
    currentTime,
    getCurrentTimePosition,
    onCreateAppointment,
    onEditAppointment,
    onUpdateStatus
}: WorkDaysViewProps) => {
    const workDaysData = useMemo(() => {
        const workDays = availability
            .filter(avail => avail.is_active)
            .map(avail => avail.day_of_week)
            .filter((value, index, self) => self.indexOf(value) === index)
            .sort();

        if (workDays.length === 0) return [];

        const weekStart = getWeekStart(currentDate);
        return workDays.map(dayOfWeek => {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + dayOfWeek);
            return day;
        });
    }, [currentDate, availability]);

    const timeSlots = useMemo(() => {
        const slots = [];
        for (let hour = 0; hour <= 23; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        return slots;
    }, []);

    const getDayAppointments = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return appointments.filter(apt => apt.date === dateStr);
    };

    const isDayAvailable = (date: Date, time: string) => {
        const dayOfWeek = date.getDay();
        const [hour, minute] = time.split(':').map(Number);
        const timeMinutes = hour * 60 + minute;

        return availability.some(avail => {
            if (avail.day_of_week !== dayOfWeek || !avail.is_active) return false;

            const [startHour, startMinute] = avail.start_time.split(':').map(Number);
            const [endHour, endMinute] = avail.end_time.split(':').map(Number);
            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;

            return timeMinutes >= startMinutes && timeMinutes < endMinutes;
        });
    };

    const weekDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

    if (workDaysData.length === 0) {
        return (
            <div className="p-6 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">אין ימי עבודה מוגדרים</h3>
                <p className="text-gray-500">הגדר ימי עבודה כדי לראות את התצוגה</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[500px] overflow-hidden">
            {/* Work Days Header */}
            <div className="flex border-b border-gray-200">
                <div className="w-20 p-4 text-center text-sm font-medium text-gray-500">שעה</div>
                {workDaysData.map((date, index) => (
                    <div key={index} className="flex-1 p-4 text-center border-l border-gray-200">
                        <div className="text-sm font-medium text-gray-600">{weekDays[date.getDay()]}</div>
                        <div className={`text-lg font-bold ${isToday(date) ? 'text-blue-600' : 'text-gray-900'}`}>
                            {date.getDate()}
                        </div>
                    </div>
                ))}
            </div>

            {/* Time Slots */}
            <div className="flex-1 overflow-y-auto">
                <div className="flex">
                    {/* Time Column */}
                    <div className="w-20">
                        {timeSlots.map((time) => (
                            <div key={time} className="h-12 p-2 text-xs text-gray-500 border-b border-gray-100">
                                {time}
                            </div>
                        ))}
                    </div>

                    {/* Work Days Columns */}
                    {workDaysData.map((date, dayIndex) => {
                        const dayAppointments = getDayAppointments(date);

                        return (
                            <div key={dayIndex} className="flex-1 border-l border-gray-200">
                                {timeSlots.map((time) => {
                                    const isAvailable = isDayAvailable(date, time);
                                    const appointment = dayAppointments.find(apt => apt.time === time);
                                    const dateStr = date.toISOString().split('T')[0];
                                    const timePosition = getCurrentTimePosition(time);
                                    const showCurrentTime = isToday(date) && timePosition.showLine;

                                    return (
                                        <div
                                            key={time}
                                            onClick={() => {
                                                if (appointment) {
                                                    onEditAppointment?.(appointment);
                                                } else if (isAvailable && onCreateAppointment) {
                                                    onCreateAppointment(dateStr, time);
                                                }
                                            }}
                                            className={`
                                                h-12 p-1 border-b border-gray-100 cursor-pointer transition-colors
                                                ${isAvailable ? 'bg-green-50 hover:bg-green-100' : 'bg-gray-50'}
                                                ${appointment ? 'bg-blue-100 hover:bg-blue-200' : ''}
                                            `}
                                        >
                                            {/* 👇 הקו האדום */}
                                            {showCurrentTime && (
                                                <div
                                                    className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 shadow-sm"
                                                    style={{ top: `${timePosition.percentage}%` }}
                                                >
                                                    <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full shadow-sm"></div>
                                                    <div className="absolute -left-16 -top-3 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                                        {currentTime.toLocaleTimeString('he-IL', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: false
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                            {appointment && (
                                                <div className={`
                                                    text-xs p-1 rounded h-full overflow-hidden
                                                    ${appointment.status === 'confirmed' ? 'bg-green-200 text-green-800' :
                                                        appointment.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                                                            appointment.status === 'declined' ? 'bg-red-200 text-red-800' :
                                                                'bg-gray-200 text-gray-800'}
                                                `}>
                                                    <div className="font-medium truncate">{appointment.client_name}</div>
                                                    {appointment.service_id && (
                                                        <div className="truncate opacity-75">
                                                            {services.find(s => s.id === appointment.service_id)?.name}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// ===================================
// 📝 Agenda View Component
// ===================================

interface AgendaViewProps {
    currentDate: Date;
    appointments: Appointment[];
    services: Service[];
    onEditAppointment?: (appointment: Appointment) => void;
    onUpdateStatus?: (appointmentId: string, status: 'confirmed' | 'declined') => void;
}

const AgendaView = ({
    currentDate,
    appointments,
    services,
    onEditAppointment,
    onUpdateStatus
}: AgendaViewProps) => {
    const agendaData = useMemo(() => {
        // Get appointments for the next 7 days
        const today = new Date();
        const weekFromNow = new Date();
        weekFromNow.setDate(today.getDate() + 7);

        const upcomingAppointments = appointments
            .filter(apt => {
                const aptDate = new Date(apt.date);
                return aptDate >= today && aptDate <= weekFromNow;
            })
            .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA.getTime() - dateB.getTime();
            });

        // Group by date
        const groupedByDate = upcomingAppointments.reduce((groups, apt) => {
            const date = apt.date;
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(apt);
            return groups;
        }, {} as Record<string, Appointment[]>);

        return groupedByDate;
    }, [appointments]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'היום';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'מחר';
        } else {
            return date.toLocaleDateString('he-IL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
        }
    };

    const getTotalAppointments = () => {
        return Object.values(agendaData).flat().length;
    };

    const getPendingCount = () => {
        return Object.values(agendaData).flat().filter(apt => apt.status === 'pending').length;
    };

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto">
                {/* Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-gray-900">סדר יום - 7 הימים הקרובים</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                {getTotalAppointments()} תורים מתוכננים
                                {getPendingCount() > 0 && (
                                    <span className="text-yellow-600"> • {getPendingCount()} ממתינים לאישור</span>
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{getTotalAppointments()}</div>
                                <div className="text-xs text-gray-500">סה"כ תורים</div>
                            </div>
                            {getPendingCount() > 0 && (
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-yellow-600">{getPendingCount()}</div>
                                    <div className="text-xs text-gray-500">ממתינים</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Agenda List */}
                {Object.keys(agendaData).length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">אין תורים מתוכננים</h3>
                        <p className="text-gray-500">אין לך תורים בשבוע הקרוב</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(agendaData).map(([date, dateAppointments]) => (
                            <div key={date} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                {/* Date Header */}
                                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h5 className="font-semibold text-gray-900">{formatDate(date)}</h5>
                                        <span className="text-sm text-gray-500">
                                            {dateAppointments.length} תורים
                                        </span>
                                    </div>
                                </div>

                                {/* Appointments List */}
                                <div className="divide-y divide-gray-200">
                                    {dateAppointments.map((appointment) => {
                                        const service = services.find(s => s.id === appointment.service_id);

                                        return (
                                            <div
                                                key={appointment.id}
                                                onClick={() => onEditAppointment?.(appointment)}
                                                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        {/* Time */}
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-gray-400" />
                                                            <span className="font-medium text-gray-900">{appointment.time}</span>
                                                        </div>

                                                        {/* Client Info */}
                                                        <div>
                                                            <div className="font-medium text-gray-900">{appointment.client_name}</div>
                                                            <div className="text-sm text-gray-600 flex items-center gap-2">
                                                                <Phone className="w-3 h-3" />
                                                                {appointment.client_phone}
                                                                {service && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>{service.name}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Status and Actions */}
                                                    <div className="flex items-center gap-3">
                                                        <span className={`
                              px-3 py-1 text-xs font-medium rounded-full
                              ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                                appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                    appointment.status === 'declined' ? 'bg-red-100 text-red-700' :
                                                                        'bg-gray-100 text-gray-700'}
                            `}>
                                                            {appointment.status === 'confirmed' ? 'אושר' :
                                                                appointment.status === 'pending' ? 'ממתין' :
                                                                    appointment.status === 'declined' ? 'נדחה' : 'בוטל'}
                                                        </span>

                                                        {appointment.status === 'pending' && onUpdateStatus && (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onUpdateStatus(appointment.id, 'confirmed');
                                                                    }}
                                                                    className="p-1 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                                                                    title="אשר תור"
                                                                >
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onUpdateStatus(appointment.id, 'declined');
                                                                    }}
                                                                    className="p-1 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                                                                    title="דחה תור"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Note */}
                                                {appointment.note && (
                                                    <div className="mt-2 text-sm text-gray-600 flex items-start gap-2">
                                                        <MessageCircle className="w-3 h-3 mt-0.5 text-gray-400" />
                                                        <span>{appointment.note}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ===================================
// 📋 Selected Date Panel Component
// ===================================

interface SelectedDatePanelProps {
    date: Date;
    appointments: Appointment[];
    services: Service[];
    onEditAppointment?: (appointment: Appointment) => void;
    onUpdateStatus?: (appointmentId: string, status: 'confirmed' | 'declined') => void;
    onCreateAppointment?: (date: string, time: string) => void;
    onClose: () => void;
}

const SelectedDatePanel = ({
    date,
    appointments,
    services,
    onEditAppointment,
    onUpdateStatus,
    onCreateAppointment,
    onClose
}: SelectedDatePanelProps) => {
    const sortedAppointments = useMemo(() => {
        return [...appointments].sort((a, b) => a.time.localeCompare(b.time));
    }, [appointments]);

    const dateStr = date.toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-96 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {date.toLocaleDateString('he-IL', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {appointments.length} תורים מתוכננים
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-80 overflow-y-auto">
                    {sortedAppointments.length === 0 ? (
                        <div className="text-center py-8">
                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h4 className="text-lg font-medium text-gray-900 mb-2">אין תורים ביום זה</h4>
                            <p className="text-gray-500 mb-4">תוכל להוסיף תור חדש ליום זה</p>
                            {onCreateAppointment && (
                                <button
                                    onClick={() => {
                                        onCreateAppointment(dateStr, '09:00');
                                        onClose();
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    הוסף תור
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sortedAppointments.map((appointment) => {
                                const service = services.find(s => s.id === appointment.service_id);

                                return (
                                    <div
                                        key={appointment.id}
                                        onClick={() => {
                                            onEditAppointment?.(appointment);
                                            onClose();
                                        }}
                                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {appointment.time}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {appointment.client_name}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {appointment.client_phone}
                                                        {service && ` • ${service.name}`}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`
                          px-2 py-1 text-xs font-medium rounded-full
                          ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            appointment.status === 'declined' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-100 text-gray-700'}
                        `}>
                                                    {appointment.status === 'confirmed' ? 'אושר' :
                                                        appointment.status === 'pending' ? 'ממתין' :
                                                            appointment.status === 'declined' ? 'נדחה' : 'בוטל'}
                                                </span>

                                                {appointment.status === 'pending' && onUpdateStatus && (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onUpdateStatus(appointment.id, 'confirmed');
                                                            }}
                                                            className="p-1 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                                                            title="אשר תור"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onUpdateStatus(appointment.id, 'declined');
                                                            }}
                                                            className="p-1 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                                                            title="דחה תור"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {appointment.note && (
                                            <div className="mt-2 text-sm text-gray-600">
                                                {appointment.note}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ===================================
// 🔧 Helper Functions
// ===================================

const getWeekRange = (date: Date) => {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
};

const getMonthRange = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
};

const getWeekStart = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    return start;
};

const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

// ===================================
// 📋 Day View Component  
// ===================================

interface DayViewProps {
    currentDate: Date;
    appointments: Appointment[];
    availability: Availability[];
    services: Service[];
    onCreateAppointment?: (date: string, time: string) => void;
    onEditAppointment?: (appointment: Appointment) => void;
    onUpdateStatus?: (appointmentId: string, status: 'confirmed' | 'declined') => void;
}

const DayView = ({
    currentDate,
    appointments,
    availability,
    services,
    onCreateAppointment,
    onEditAppointment,
    onUpdateStatus
}: DayViewProps) => {
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let hour = 0; hour <= 23; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        return slots;
    }, []);

    const dayAppointments = useMemo(() => {
        const dateStr = currentDate.toISOString().split('T')[0];
        return appointments.filter(apt => apt.date === dateStr);
    }, [appointments, currentDate]);

    const isDayAvailable = (time: string) => {
        const dayOfWeek = currentDate.getDay();
        const [hour, minute] = time.split(':').map(Number);
        const timeMinutes = hour * 60 + minute;

        return availability.some(avail => {
            if (avail.day_of_week !== dayOfWeek || !avail.is_active) return false;

            const [startHour, startMinute] = avail.start_time.split(':').map(Number);
            const [endHour, endMinute] = avail.end_time.split(':').map(Number);
            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;

            return timeMinutes >= startMinutes && timeMinutes < endMinutes;
        });
    };

    const dateStr = currentDate.toISOString().split('T')[0];

    return (
        <div className="p-6">
            <div className="max-w-2xl mx-auto">
                {/* Day Header */}
                <div className="mb-6 text-center">
                    <h4 className="text-lg font-semibold text-gray-900">
                        {currentDate.toLocaleDateString('he-IL', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                        })}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                        {dayAppointments.length} תורים מתוכננים
                    </p>
                </div>

                {/* Time Slots */}
                <div className="space-y-1 max-h-96 overflow-y-auto">
                    {timeSlots.map((time) => {
                        const isAvailable = isDayAvailable(time);
                        const appointment = dayAppointments.find(apt => apt.time === time);
                        const service = appointment ? services.find(s => s.id === appointment.service_id) : null;

                        return (
                            <div
                                key={time}
                                onClick={() => {
                                    if (appointment) {
                                        onEditAppointment?.(appointment);
                                    } else if (isAvailable && onCreateAppointment) {
                                        onCreateAppointment(dateStr, time);
                                    }
                                }}
                                className={`
                  flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200
                  ${appointment
                                        ? appointment.status === 'confirmed'
                                            ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                            : appointment.status === 'pending'
                                                ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
                                                : appointment.status === 'declined'
                                                    ? 'bg-red-50 border-red-200 hover:bg-red-100'
                                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                        : isAvailable
                                            ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                            : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                                    }
                `}
                            >
                                {/* Time */}
                                <div className="w-16 text-sm font-medium text-gray-600">
                                    {time}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    {appointment ? (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {appointment.client_name}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {service?.name || 'ללא שירות'} • {appointment.client_phone}
                                                </div>
                                                {appointment.note && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {appointment.note}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`
                          px-2 py-1 text-xs font-medium rounded-full
                          ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            appointment.status === 'declined' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-100 text-gray-700'}
                        `}>
                                                    {appointment.status === 'confirmed' ? 'אושר' :
                                                        appointment.status === 'pending' ? 'ממתין' :
                                                            appointment.status === 'declined' ? 'נדחה' : 'בוטל'}
                                                </span>
                                            </div>
                                        </div>
                                    ) : isAvailable ? (
                                        <div className="flex items-center gap-2 text-green-600">
                                            <Plus className="w-4 h-4" />
                                            <span className="text-sm">זמן פנוי - לחץ להוספת תור</span>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-400">
                                            לא זמין
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};