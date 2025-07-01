// src/components/dashboard/CalendarView.tsx
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
    Calendar, ChevronLeft, ChevronRight, Clock, Users, Plus,
    Eye, Settings, TrendingUp, BarChart, CheckCircle, AlertCircle,
    Filter, Sparkles, MapPin, Phone, MessageCircle, X, Tag
} from 'lucide-react';
import { showSuccessToast } from '@/lib/toast-utils';
import { isToday, isPastTime, dateToLocalString } from '@/lib/calendar-utils';
import type { Appointment, Availability, Service } from '@/lib/types';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface CalendarViewProps {
    appointments: Appointment[];
    availability: Availability[];
    services: Service[];
    businessId: string;
    initialView?: CalendarViewMode;
    onCreateAppointment?: (date: string, time: string) => void;
    onEditAppointment?: (appointment: Appointment) => void;
    onUpdateStatus: (appointmentId: string, status: 'confirmed' | 'declined' | 'cancelled') => void;
}

type CalendarViewMode = 'day' | 'work-days' | 'week' | 'month' | 'agenda';

export const CalendarView = ({
    appointments,
    availability,
    services,
    businessId,
    initialView = 'month',
    onCreateAppointment,
    onEditAppointment,
    onUpdateStatus
}: CalendarViewProps) => {
    // ===================================
    // 🎯 State Management
    // ===================================
    const { preferences: userPreferences } = useUserPreferences();
    const [viewMode, setViewMode] = useState<CalendarViewMode>(initialView);
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
    // 📅 View Mode Initialization
    // ===================================
    useEffect(() => {
        if (initialView) {
            setViewMode(initialView);
        }
    }, [initialView]);

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
            case 'agenda':
                newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
                break;
        }

        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        // setSelectedDate(new Date());
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
                services={services}
                selectedServices={selectedServices}
                onServiceToggle={handleServiceFilter}
                onClearFilters={() => setSelectedServices(new Set())}
            />

            {/* Filters
            <CalendarFilters
                services={services}
                selectedServices={selectedServices}
                onServiceToggle={handleServiceFilter}
                onClearFilters={() => setSelectedServices(new Set())}
            /> */}

            {/* Calendar Content */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">

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

                {viewMode === 'work-days' && (
                    <WorkDaysView
                        currentDate={currentDate}
                        appointments={filteredAppointments}
                        availability={availability}
                        services={services}
                        onCreateAppointment={onCreateAppointment}
                        onEditAppointment={onEditAppointment}
                        onUpdateStatus={onUpdateStatus}
                    // currentTime={currentTime}
                    // getCurrentTimePosition={getCurrentTimePosition}
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
                    // getCurrentTimePosition={getCurrentTimePosition}
                    />
                )}

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
    services: Service[];
    selectedServices: Set<string>;
    onServiceToggle: (serviceId: string) => void;
    onClearFilters: () => void;
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
    availability,
    services,
    selectedServices,
    onServiceToggle,
    onClearFilters
}: CalendarHeaderProps) => {
    const [showFilters, setShowFilters] = useState(false);
    const { preferences: userPreferences } = useUserPreferences();
    const formatHeaderDate = () => {
        // פונקציה לקבלת תחילת השבוע
        const weekStart = getWeekStart(currentDate);
        
        switch (viewMode) {
            case 'month':
                return currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
            case 'week':
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);

                // בדיקה אם השבוע חוצה חודשים
                if (weekStart.getMonth() !== weekEnd.getMonth()) {
                    // שני חודשים שונים
                    const startMonth = weekStart.toLocaleDateString('he-IL', { month: 'long' });
                    const endMonthYear = weekEnd.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
                    return `${weekStart.getDate()} ${startMonth} - ${weekEnd.getDate()} ${endMonthYear}`;
                } else {
                    // אותו חודש
                    return `${weekStart.getDate()}-${weekEnd.getDate()} ${weekStart.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}`;
                }
            case 'work-days':
                const workDays = availability
                    .filter((avail: any) => avail.is_active)
                    .map((avail: any) => avail.day_of_week)
                    .filter((value: number, index: number, self: number[]) => self.indexOf(value) === index)
                    .sort();

                if (workDays.length === 0) {
                    return currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }) + ' - אין ימי עבודה';
                }
                // מציאת יום העבודה הראשון והאחרון בשבוע הנוכחי
                const workDaysInWeek = workDays.map(dayOfWeek => {
                    const day = new Date(weekStart);
                    day.setDate(weekStart.getDate() + dayOfWeek);
                    return day;
                });

                const firstWorkDay = workDaysInWeek[0];
                const lastWorkDay = workDaysInWeek[workDaysInWeek.length - 1];

                // בדיקה אם ימי העבודה חוצים חודשים
                if (firstWorkDay.getMonth() !== lastWorkDay.getMonth()) {
                    // שני חודשים שונים
                    const startMonth = firstWorkDay.toLocaleDateString('he-IL', { month: 'long' });
                    const endMonthYear = lastWorkDay.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
                    return `${firstWorkDay.getDate()} ${startMonth} - ${lastWorkDay.getDate()} ${endMonthYear}`;
                } else {
                    // אותו חודש
                    return `${firstWorkDay.getDate()}-${lastWorkDay.getDate()} ${firstWorkDay.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}`;
                }
            case 'day':
                return currentDate.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            case 'agenda':
                return currentDate.toLocaleDateString('he-IL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
            default:
                return '';
        }
    };

    const viewModes = [
        { key: 'day' as const, label: 'יום', icon: '📋' },
        { key: 'work-days' as const, label: 'ימי עבודה', icon: '💼' },
        { key: 'week' as const, label: 'שבוע', icon: '📅' },
        { key: 'month' as const, label: 'חודש', icon: '🗓️' },
        { key: 'agenda' as const, label: 'סדר יום', icon: '📝' }
    ];

    return (
        <div className="mb-6">
            {/* שורה אחת עם הכל */}
            <div className="flex items-center justify-between mb-4">
                {/* Navigation + View Modes */}
                <div className="flex items-center gap-6">
                    {/* Navigation */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onNavigate('prev')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="תקופה קודמת"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        <div className="min-w-72 text-center">
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

                        {/* כפתור פילטר */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${showFilters
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>

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
                                title={`תצוגת ${mode.label}${userPreferences?.default_calendar_view === mode.key ? ' (ברירת מחדל)' : ''}`}
                            >
                                <span className="text-xs">{mode.icon}</span>
                                <span className="hidden sm:inline">{mode.label}</span>
                                {userPreferences?.default_calendar_view === mode.key && (
                                    <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded ml-1">ברירת מחדל</span>
                                )}
                            </button>
                        ))}
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

            {/* Filters - מוסתר כברירת מחדל */}
            {showFilters && (
                <div className="mb-4 p-4 bg-gray-50 rounded-xl border">
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
                            </button>
                        ))}
                    </div>

                    {selectedServices.size > 0 && (
                        <div className="mt-2 flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                                מציג תורים עבור {selectedServices.size} שירותים
                            </div>
                            <button
                                onClick={onClearFilters}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                נקה הכל
                            </button>
                        </div>
                    )}
                </div>
            )}
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
        const dateStr = dateToLocalString(date);
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

    const isPastTime = (date: Date, time?: string) => {
        const now = new Date();
        if (time) {
            const dateTime = new Date(`${date.toISOString().split('T')[0]} ${time}`);
            return dateTime < now;
        }
        // עבור תאריכים - בדוק רק את התאריך (לא שעה)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today;
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
                                min-h-24 p-2 border border-gray-100 transition-all duration-200
                                ${currentMonth ? 'bg-white' : 'bg-gray-50'}
                                ${todayDate ? 'border-blue-400 bg-blue-50' : ''}
                                ${isSelected ? 'ring-2 ring-blue-500 bg-blue-100' : ''}
                                ${!isPastTime(date) ? 'cursor-pointer hover:bg-gray-50' : 'cursor-pointer opacity-60'}
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

// ===================================
// 📅 Week View Component - גרסה משופרת
// ===================================

interface WeekViewProps {
    currentDate: Date;
    currentTime: Date;
    appointments: Appointment[];
    availability: Availability[];
    services: Service[];
    onCreateAppointment?: (date: string, time: string) => void;
    onEditAppointment?: (appointment: Appointment) => void;
    onUpdateStatus?: (appointmentId: string, status: 'confirmed' | 'declined') => void;
}

const WeekView = ({
    currentDate,
    appointments,
    availability,
    services,
    onCreateAppointment,
    onEditAppointment,
    onUpdateStatus
}: WeekViewProps) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const timeColumnRef = useRef<HTMLDivElement>(null);

    // עדכון זמן נוכחי כל דקה
    useEffect(() => {
        const updateCurrentTime = () => setCurrentTime(new Date());
        updateCurrentTime();

        const timer = setInterval(updateCurrentTime, 60000);
        return () => clearInterval(timer);
    }, []);

    // סנכרון גלילה בין התוכן לעמודת השעות
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (timeColumnRef.current) {
            timeColumnRef.current.scrollTop = e.currentTarget.scrollTop;
        }
    };

    // גלילה לשעה הנוכחית
    useEffect(() => {
        if (!scrollContainerRef.current) return;

        const now = new Date();
        const currentHour = now.getHours();
        const scrollToHour = Math.max(0, currentHour - 2);

        const scrollPosition = scrollToHour * 64;

        setTimeout(() => {
            scrollContainerRef.current?.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
            });
        }, 300);
    }, [currentDate]);

    // קבלת ימי השבוע
    const weekDays = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            days.push(day);
        }
        return days;
    }, [currentDate]);

    // יצירת כל רבעי השעה (0:00-23:45)
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let quarter = 0; quarter < 4; quarter++) {
                const minutes = quarter * 15;
                const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                slots.push({
                    time: timeStr,
                    hour,
                    quarter,
                    isHourStart: quarter === 0
                });
            }
        }
        return slots;
    }, []);

    // קבלת תורים ליום ספציפי
    const getDayAppointments = (date: Date) => {
        const dateStr = dateToLocalString(date);
        return appointments.filter(apt => apt.date === dateStr);
    };

    // בדיקה אם זמן זמין ביום ספציפי
    const isTimeAvailable = (date: Date, time: string) => {
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

    // חישוב משך התור לפי השירות
    const getAppointmentDuration = (appointment: Appointment): number => {
        const service = services.find(s => s.id === appointment.service_id);
        return service?.duration_minutes || 60;
    };

    // חישוב אילו רבעי שעה התור תופס
    const getAppointmentSlots = (appointment: Appointment) => {
        const [hour, minute] = appointment.time.split(':').map(Number);
        const startMinutes = hour * 60 + minute;
        const duration = getAppointmentDuration(appointment);
        const endMinutes = startMinutes + duration;

        const occupiedSlots = [];
        for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += 15) {
            const slotHour = Math.floor(currentMinutes / 60);
            const slotMinute = currentMinutes % 60;
            const slotTime = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;
            occupiedSlots.push(slotTime);
        }

        return occupiedSlots;
    };

    // מציאת תור בזמן ספציפי ביום ספציפי
    const findAppointmentAtTime = (date: Date, time: string) => {
        const dayAppointments = getDayAppointments(date);
        return dayAppointments.find(apt => {
            const occupiedSlots = getAppointmentSlots(apt);
            return occupiedSlots.includes(time);
        });
    };

    // בדיקה אם זה תחילת התור
    const isAppointmentStart = (appointment: Appointment, time: string) => {
        return appointment.time.substring(0, 5) === time;
    };

    // חישוב מיקום הקו האדום (רק לימי היום)
    const getCurrentTimePosition = () => {
        const now = currentTime;
        const hours = now.getHours();
        const minutes = now.getMinutes();

        const totalMinutes = hours * 60 + minutes;
        return (totalMinutes / 60) * 64;
    };

    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

    return (
        <div className="h-[600px] bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
            {/* כותרת השבוע */}
            <div className="border-b border-gray-200 bg-gray-50">
                <div className="flex">
                    {/* תא ריק עבור עמודת השעות */}
                    <div className="w-16 p-2 border-l border-gray-200"></div>

                    {/* כותרות הימים */}
                    {weekDays.map((date, index) => (
                        <div key={index} className="flex-1 p-2 text-center border-l border-gray-200">
                            <div className="text-xs font-medium text-gray-600 mb-1">
                                {dayNames[date.getDay()]}
                            </div>
                            <div className={`text-sm font-bold ${isToday(date) ? 'text-blue-600' : 'text-gray-900'}`}>
                                {date.getDate()}.{date.getMonth() + 1}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {getDayAppointments(date).length} תורים
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* תוכן השבוע */}
            <div className="flex flex-row-reverse flex-1 overflow-hidden">
                {/* עמודת שעות - מימין */}
                <div
                    ref={timeColumnRef}
                    className="w-16 border-l border-gray-200 bg-gray-50 overflow-y-auto order-2"
                    style={{ overflowY: 'hidden' }}
                >
                    {Array.from({ length: 24 }, (_, hour) => (
                        <div
                            key={hour}
                            className="h-16 flex items-start justify-center pt-1 border-b border-gray-100"
                        >
                            <span className="text-xs text-gray-500 font-mono">
                                {hour.toString().padStart(2, '0')}:00
                            </span>
                        </div>
                    ))}
                </div>

                {/* תוכן הימים - משמאל */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto relative order-1"
                >
                    <div className="flex">
                        {weekDays.map((date, dayIndex) => (
                            <div key={dayIndex} className="flex-1 border-l border-gray-200 relative">
                                {/* קו השעה הנוכחית - רק לימי היום */}
                                {isToday(date) && (
                                    <div
                                        className="absolute left-0 right-0 h-0.5 bg-red-500 z-20"
                                        style={{ top: `${getCurrentTimePosition()}px` }}
                                    >
                                        <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                                    </div>
                                )}

                                {/* רבעי השעות ליום */}
                                {timeSlots.map((slot, slotIndex) => {
                                    const isAvailable = isTimeAvailable(date, slot.time);
                                    const appointment = findAppointmentAtTime(date, slot.time);
                                    const isStart = appointment && isAppointmentStart(appointment, slot.time);
                                    const dateStr = dateToLocalString(date);

                                    return (
                                        <div
                                            key={`${dayIndex}-${slotIndex}`}
                                            onClick={() => {
                                                if (appointment && isStart) {
                                                    onEditAppointment?.(appointment);
                                                } else if (!appointment && onCreateAppointment && !isPastTime(date, slot.time)) {
                                                    onCreateAppointment(dateStr, slot.time);
                                                }
                                            }}
                                            className={`
                        h-4 border-b border-gray-100 cursor-pointer transition-colors relative
                        ${slot.isHourStart ? 'border-t border-gray-200' : ''}
                        ${isAvailable
                                                    ? 'bg-white hover:bg-green-50'
                                                    : 'bg-gray-50 hover:bg-gray-100'
                                                }
                        ${appointment ? 'bg-blue-50' : ''}
                      `}
                                        >
                                            {/* הצגת תור - רק בתחילת התור */}
                                            {appointment && isStart && (
                                                <div
                                                    className={`
                            absolute inset-x-1 inset-y-0 rounded px-1 py-1 text-xs font-medium cursor-pointer z-10
                            ${appointment.status === 'confirmed'
                                                            ? 'bg-green-200 text-green-800 border border-green-300'
                                                            : appointment.status === 'pending'
                                                                ? 'bg-yellow-200 text-yellow-800 border border-yellow-300'
                                                                : appointment.status === 'declined'
                                                                    ? 'bg-red-200 text-red-800 border border-red-300'
                                                                    : appointment.status === 'cancelled'
                                                                        ? 'bg-gray-200 text-gray-800 border border-gray-300'
                                                                        : 'bg-blue-200 text-blue-800 border border-blue-300'
                                                        }
                          `}
                                                    style={{
                                                        height: `${Math.ceil(getAppointmentDuration(appointment) / 15) * 16}px`,
                                                        minHeight: '32px'
                                                    }}
                                                >
                                                    <div className="truncate font-semibold text-xs">{appointment.client_name}</div>
                                                    <div className="truncate text-xs opacity-75">
                                                        {appointment.time.substring(0, 5)}
                                                    </div>
                                                    {services.find(s => s.id === appointment.service_id)?.name && (
                                                        <div className="truncate text-xs opacity-60">
                                                            {services.find(s => s.id === appointment.service_id)?.name}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* הצגת זמן בהובר - רק אם אין תור */}
                                            {!appointment && (
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <span className="text-xs text-gray-600 bg-white px-1 py-0.5 rounded shadow-sm">
                                                        {slot.time}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ===================================
// 💼 Work Days View Component - גרסה משופרת
// ===================================

interface WorkDaysViewProps {
    currentDate: Date;
    appointments: Appointment[];
    availability: Availability[];
    services: Service[];
    onCreateAppointment?: (date: string, time: string) => void;
    onEditAppointment?: (appointment: Appointment) => void;
    onUpdateStatus?: (appointmentId: string, status: 'confirmed' | 'declined') => void;
}

const WorkDaysView = ({
    currentDate,
    appointments,
    availability,
    services,
    onCreateAppointment,
    onEditAppointment,
    onUpdateStatus
}: WorkDaysViewProps) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const timeColumnRef = useRef<HTMLDivElement>(null);

    // עדכון זמן נוכחי כל דקה
    useEffect(() => {
        const updateCurrentTime = () => setCurrentTime(new Date());
        updateCurrentTime();

        const timer = setInterval(updateCurrentTime, 60000);
        return () => clearInterval(timer);
    }, []);

    // סנכרון גלילה בין התוכן לעמודת השעות
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (timeColumnRef.current) {
            timeColumnRef.current.scrollTop = e.currentTarget.scrollTop;
        }
    };

    // גלילה לשעה הנוכחית
    useEffect(() => {
        if (!scrollContainerRef.current) return;

        const now = new Date();
        const currentHour = now.getHours();
        const scrollToHour = Math.max(0, currentHour - 2);

        // כל שעה = 64px (4 רבעי שעה × 16px)
        const scrollPosition = scrollToHour * 64;

        setTimeout(() => {
            scrollContainerRef.current?.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
            });
        }, 300);
    }, [currentDate]);

    // קבלת ימי העבודה בלבד
    const workDays = useMemo(() => {
        // מציאת ימי העבודה הפעילים
        const activeDays = availability
            .filter(avail => avail.is_active)
            .map(avail => avail.day_of_week)
            .filter((value, index, self) => self.indexOf(value) === index) // הסרת כפילויות
            .sort(); // מיון מיום ראשון לשבת

        if (activeDays.length === 0) return [];

        // חישוב תחילת השבוע
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

        // יצירת התאריכים לימי העבודה
        return activeDays.map(dayOfWeek => {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + dayOfWeek);
            return day;
        });
    }, [currentDate, availability]);

    // יצירת כל רבעי השעה (0:00-23:45)
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let quarter = 0; quarter < 4; quarter++) {
                const minutes = quarter * 15;
                const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                slots.push({
                    time: timeStr,
                    hour,
                    quarter,
                    isHourStart: quarter === 0
                });
            }
        }
        return slots;
    }, []);

    // קבלת תורים ליום ספציפי
    const getDayAppointments = (date: Date) => {
        const dateStr = dateToLocalString(date);
        return appointments.filter(apt => apt.date === dateStr);
    };

    // בדיקה אם זמן זמין ביום ספציפי
    const isTimeAvailable = (date: Date, time: string) => {
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

    // חישוב משך התור לפי השירות
    const getAppointmentDuration = (appointment: Appointment): number => {
        const service = services.find(s => s.id === appointment.service_id);
        return service?.duration_minutes || 60;
    };

    // חישוב אילו רבעי שעה התור תופס
    const getAppointmentSlots = (appointment: Appointment) => {
        const [hour, minute] = appointment.time.split(':').map(Number);
        const startMinutes = hour * 60 + minute;
        const duration = getAppointmentDuration(appointment);
        const endMinutes = startMinutes + duration;

        const occupiedSlots = [];
        for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += 15) {
            const slotHour = Math.floor(currentMinutes / 60);
            const slotMinute = currentMinutes % 60;
            const slotTime = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;
            occupiedSlots.push(slotTime);
        }

        return occupiedSlots;
    };

    // מציאת תור בזמן ספציפי ביום ספציפי
    const findAppointmentAtTime = (date: Date, time: string) => {
        const dayAppointments = getDayAppointments(date);
        return dayAppointments.find(apt => {
            const occupiedSlots = getAppointmentSlots(apt);
            return occupiedSlots.includes(time);
        });
    };

    // בדיקה אם זה תחילת התור
    const isAppointmentStart = (appointment: Appointment, time: string) => {
        return appointment.time.substring(0, 5) === time;
    };

    // חישוב מיקום הקו האדום (רק לימי היום)
    const getCurrentTimePosition = () => {
        const now = currentTime;
        const hours = now.getHours();
        const minutes = now.getMinutes();

        const totalMinutes = hours * 60 + minutes;
        return (totalMinutes / 60) * 64;
    };

    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

    // אם אין ימי עבודה מוגדרים
    if (workDays.length === 0) {
        return (
            <div className="h-[600px] bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📅</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">אין ימי עבודה מוגדרים</h3>
                    <p className="text-gray-500">הגדר ימי עבודה בהגדרות הזמינות כדי לראות את התצוגה</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[600px] bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
            {/* כותרת ימי העבודה */}
            <div className="border-b border-gray-200 bg-gray-50">
                <div className="flex">
                    {/* תא ריק עבור עמודת השעות */}
                    <div className="w-16 p-2 border-l border-gray-200"></div>

                    {/* כותרות ימי העבודה */}
                    {workDays.map((date, index) => (
                        <div key={index} className="flex-1 p-2 text-center border-l border-gray-200">
                            <div className="text-xs font-medium text-gray-600 mb-1">
                                {dayNames[date.getDay()]}
                            </div>
                            <div className={`text-sm font-bold ${isToday(date) ? 'text-blue-600' : 'text-gray-900'}`}>
                                {date.getDate()}.{date.getMonth() + 1}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {getDayAppointments(date).length} תורים
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* תוכן ימי העבודה */}
            <div className="flex flex-row-reverse flex-1 overflow-hidden">
                {/* עמודת שעות - מימין */}
                <div
                    ref={timeColumnRef}
                    className="w-16 border-l border-gray-200 bg-gray-50 overflow-y-auto order-2"
                    style={{ overflowY: 'hidden' }}
                >
                    {Array.from({ length: 24 }, (_, hour) => (
                        <div
                            key={hour}
                            className="h-16 flex items-start justify-center pt-1 border-b border-gray-100"
                        >
                            <span className="text-xs text-gray-500 font-mono">
                                {hour.toString().padStart(2, '0')}:00
                            </span>
                        </div>
                    ))}
                </div>

                {/* תוכן הימים - משמאל */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto relative order-1"
                >
                    <div className="flex">
                        {workDays.map((date, dayIndex) => (
                            <div key={dayIndex} className="flex-1 border-l border-gray-200 relative">
                                {/* קו השעה הנוכחית - רק לימי היום */}
                                {isToday(date) && (
                                    <div
                                        className="absolute left-0 right-0 h-0.5 bg-red-500 z-20"
                                        style={{ top: `${getCurrentTimePosition()}px` }}
                                    >
                                        <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                                    </div>
                                )}

                                {/* רבעי השעות ליום */}
                                {timeSlots.map((slot, slotIndex) => {
                                    const isAvailable = isTimeAvailable(date, slot.time);
                                    const appointment = findAppointmentAtTime(date, slot.time);
                                    const isStart = appointment && isAppointmentStart(appointment, slot.time);
                                    const dateStr = dateToLocalString(date);

                                    return (
                                        <div
                                            key={`${dayIndex}-${slotIndex}`}
                                            onClick={() => {
                                                if (appointment && isStart) {
                                                    onEditAppointment?.(appointment);
                                                } else if (!appointment && onCreateAppointment && !isPastTime(date, slot.time)) {
                                                    onCreateAppointment(dateStr, slot.time);
                                                }
                                            }}
                                            className={`
                        h-4 border-b border-gray-100 cursor-pointer transition-colors relative
                        ${slot.isHourStart ? 'border-t border-gray-200' : ''}
                        ${isAvailable
                                                    ? 'bg-white hover:bg-green-50'
                                                    : 'bg-gray-50 hover:bg-gray-100'
                                                }
                        ${appointment ? 'bg-blue-50' : ''}
                      `}
                                        >
                                            {/* הצגת תור - רק בתחילת התור */}
                                            {appointment && isStart && (
                                                <div
                                                    className={`
                            absolute inset-x-1 inset-y-0 rounded px-1 py-1 text-xs font-medium cursor-pointer z-10
                            ${appointment.status === 'confirmed'
                                                            ? 'bg-green-200 text-green-800 border border-green-300'
                                                            : appointment.status === 'pending'
                                                                ? 'bg-yellow-200 text-yellow-800 border border-yellow-300'
                                                                : appointment.status === 'declined'
                                                                    ? 'bg-red-200 text-red-800 border border-red-300'
                                                                    : appointment.status === 'cancelled'
                                                                        ? 'bg-gray-200 text-gray-800 border border-gray-300'
                                                                        : 'bg-blue-200 text-blue-800 border border-blue-300'
                                                        }
                          `}
                                                    style={{
                                                        height: `${Math.ceil(getAppointmentDuration(appointment) / 15) * 16}px`,
                                                        minHeight: '32px'
                                                    }}
                                                >
                                                    <div className="truncate font-semibold text-xs">{appointment.client_name}</div>
                                                    <div className="truncate text-xs opacity-75">
                                                        {appointment.time.substring(0, 5)}
                                                    </div>
                                                    {services.find(s => s.id === appointment.service_id)?.name && (
                                                        <div className="truncate text-xs opacity-60">
                                                            {services.find(s => s.id === appointment.service_id)?.name}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* הצגת זמן בהובר - רק אם אין תור */}
                                            {!appointment && (
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <span className="text-xs text-gray-600 bg-white px-1 py-0.5 rounded shadow-sm">
                                                        {slot.time}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
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
        // השתמש בתאריך מקומי במקום toISOString
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

        const dayAppointments = appointments
            .filter(apt => apt.date === dateStr)
            .sort((a, b) => a.time.localeCompare(b.time));

        return dateStr ? { [dateStr]: dayAppointments } : {};
    }, [appointments, currentDate]);

    const formatDate = (date: Date) => {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const dayAndDate = date.toLocaleDateString('he-IL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });

        if (date.toDateString() === today.toDateString()) {
            return <><strong>היום</strong> {dayAndDate}</>;
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return <><strong>מחר</strong> {dayAndDate}</>;
        } else {
            return dayAndDate;
        }
    };

    const getTotalAppointments = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        return agendaData[dateStr]?.length || 0;
    };

    const getPendingCount = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        return agendaData[dateStr]?.filter(apt => apt.status === 'pending').length || 0;
    };

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto">
                {/* Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-gray-900">
                                {formatDate(currentDate)}
                            </h4>
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
                            <div key={date} className="space-y-2">
                                {/* Appointments List */}
                                {dateAppointments.map((appointment) => {
                                    const service = services.find(s => s.id === appointment.service_id);

                                    return (
                                        <div
                                            key={appointment.id}
                                            onClick={() => onEditAppointment?.(appointment)}
                                            className="p-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
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

    const dateStr = dateToLocalString(date);

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center p-4 z-50">
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
                            {!isPastTime(date) && (
                                <>
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
                                </>
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

                            {/* כפתור הוספת תור - רק אם התאריך לא עבר */}
                            {!isPastTime(date) && onCreateAppointment && (
                                <div className="pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            onCreateAppointment(dateStr, '09:00');
                                            onClose();
                                        }}
                                        className="w-full p-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        הוסף תור נוסף
                                    </button>
                                </div>
                            )}
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

// ===================================
// 📋 Day View Component - גרסה משופרת
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
    const [currentTime, setCurrentTime] = useState(new Date());
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const timeColumnRef = useRef<HTMLDivElement>(null);

    // עדכון זמן נוכחי כל דקה
    useEffect(() => {
        const updateCurrentTime = () => setCurrentTime(new Date());
        updateCurrentTime();

        const timer = setInterval(updateCurrentTime, 60000);
        return () => clearInterval(timer);
    }, []);

    // סנכרון גלילה בין התוכן לעמודת השעות
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (timeColumnRef.current) {
            timeColumnRef.current.scrollTop = e.currentTarget.scrollTop;
        }
    };

    // גלילה לשעה הנוכחית
    useEffect(() => {
        if (!scrollContainerRef.current) return;

        const now = new Date();
        const currentHour = now.getHours();
        const scrollToHour = Math.max(0, currentHour - 2);

        // כל שעה = 64px (4 רבעי שעה × 16px)
        const scrollPosition = scrollToHour * 64;

        setTimeout(() => {
            scrollContainerRef.current?.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
            });
        }, 300);
    }, [currentDate]);

    // יצירת כל רבעי השעה (0:00-23:45)
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let quarter = 0; quarter < 4; quarter++) {
                const minutes = quarter * 15;
                const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                slots.push({
                    time: timeStr,
                    hour,
                    quarter,
                    isHourStart: quarter === 0
                });
            }
        }
        return slots;
    }, []);

    // סינון תורים ליום הנוכחי
    const dayAppointments = useMemo(() => {
        const dateStr = currentDate.toISOString().split('T')[0];
        return appointments.filter(apt => apt.date === dateStr);
    }, [appointments, currentDate]);

    // בדיקה אם זמן זמין
    const isTimeAvailable = (time: string) => {
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

    // חישוב משך התור לפי השירות
    const getAppointmentDuration = (appointment: Appointment): number => {
        const service = services.find(s => s.id === appointment.service_id);
        return service?.duration_minutes || 60; // ברירת מחדל 60 דקות
    };

    // חישוב אילו רבעי שעה התור תופס
    const getAppointmentSlots = (appointment: Appointment) => {
        const [hour, minute] = appointment.time.split(':').map(Number);
        const startMinutes = hour * 60 + minute;
        const duration = getAppointmentDuration(appointment);
        const endMinutes = startMinutes + duration;

        const occupiedSlots = [];
        for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += 15) {
            const slotHour = Math.floor(currentMinutes / 60);
            const slotMinute = currentMinutes % 60;
            const slotTime = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;
            occupiedSlots.push(slotTime);
        }

        return occupiedSlots;
    };

    // מציאת תור בזמן ספציפי
    const findAppointmentAtTime = (time: string) => {
        return dayAppointments.find(apt => {
            const occupiedSlots = getAppointmentSlots(apt);
            return occupiedSlots.includes(time);
        });
    };

    // בדיקה אם זה תחילת התור
    const isAppointmentStart = (appointment: Appointment, time: string) => {
        return appointment.time.substring(0, 5) === time;
    };

    // חישוב מיקום הקו האדום
    const getCurrentTimePosition = () => {
        const now = currentTime;
        const hours = now.getHours();
        const minutes = now.getMinutes();

        // כל שעה = 64px, כל דקה = 64/60 px
        const totalMinutes = hours * 60 + minutes;
        return (totalMinutes / 60) * 64;
    };

    const isToday = currentDate.toDateString() === new Date().toDateString();
    const dateStr = currentDate.toISOString().split('T')[0];

    return (
        <div className="h-[600px] bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
            {/* כותרת באמצע */}
            <div className="border-b border-gray-200 p-4 bg-gray-50 text-center">
                <h3 className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {currentDate.toLocaleDateString('he-IL', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                    })}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    {dayAppointments.length} תורים מתוכננים
                </p>
            </div>

            {/* תוכן ראשי */}
            <div className="flex flex-row-reverse flex-1 overflow-hidden">
                {/* תוכן התורים - משמאל */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto relative bg-white order-1"
                >
                    {/* קו השעה הנוכחית */}
                    {isToday && (
                        <div
                            className="absolute left-0 right-4 h-0.5 bg-red-500 z-20"
                            style={{ top: `${getCurrentTimePosition()}px` }}
                        >
                            <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                    )}

                    {/* רבעי השעות */}
                    <div className="relative">
                        {timeSlots.map((slot, index) => {
                            const isAvailable = isTimeAvailable(slot.time);
                            const appointment = findAppointmentAtTime(slot.time);
                            const isStart = appointment && isAppointmentStart(appointment, slot.time);

                            return (
                                <div
                                    key={slot.time}
                                    onClick={() => {
                                        if (appointment && isStart) {
                                            onEditAppointment?.(appointment);
                                        } else if (!appointment && onCreateAppointment && !isPastTime(currentDate, slot.time)) {
                                            onCreateAppointment(dateStr, slot.time);
                                        }
                                    }}
                                    className={`
                    h-4 border-b border-gray-100 cursor-pointer transition-colors relative
                    ${slot.isHourStart ? 'border-t border-gray-200' : ''}
                    ${isAvailable
                                            ? 'bg-white hover:bg-green-50'
                                            : 'bg-gray-50 hover:bg-gray-100'
                                        }
                    ${appointment ? 'bg-blue-50' : ''}
                            `}
                                >
                                    {/* הצגת תור - רק בתחילת התור */}
                                    {appointment && isStart && (
                                        <div
                                            className={`
                            absolute inset-x-1 inset-y-0 rounded px-1 py-1 text-xs font-medium cursor-pointer z-10
                            ${appointment.status === 'confirmed'
                                                    ? 'bg-green-200 text-green-800 border border-green-300'
                                                    : appointment.status === 'pending'
                                                        ? 'bg-yellow-200 text-yellow-800 border border-yellow-300'
                                                        : appointment.status === 'declined'
                                                            ? 'bg-red-200 text-red-800 border border-red-300'
                                                            : appointment.status === 'cancelled'
                                                                ? 'bg-gray-200 text-gray-800 border border-gray-300'
                                                                : 'bg-blue-200 text-blue-800 border border-blue-300'
                                                }
                          `}
                                            style={{
                                                height: `${Math.ceil(getAppointmentDuration(appointment) / 15) * 16}px`,
                                                minHeight: '48px'
                                            }}
                                        >
                                            <div className="truncate font-semibold">{appointment.client_name}</div>
                                            <div className="truncate text-xs opacity-75">
                                                {appointment.time.substring(0, 5)}
                                                {services.find(s => s.id === appointment.service_id)?.name &&
                                                    ` • ${services.find(s => s.id === appointment.service_id)?.name}`
                                                }
                                            </div>
                                            <div className="truncate text-xs opacity-60">
                                                {getAppointmentDuration(appointment)} דקות
                                            </div>
                                        </div>
                                    )}

                                    {/* הצגת זמן בהובר - רק אם אין תור */}
                                    {!appointment && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded shadow-sm">
                                                {slot.time}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* עמודת שעות - מימין */}
                <div
                    ref={timeColumnRef}
                    className="w-16 border-l border-gray-200 bg-gray-50 overflow-y-auto order-2"
                    style={{ overflowY: 'hidden' }} // מונע גלילה עצמאית
                >
                    {Array.from({ length: 24 }, (_, hour) => (
                        <div
                            key={hour}
                            className="h-16 flex items-start justify-center pt-1 border-b border-gray-100"
                        >
                            <span className="text-xs text-gray-500 font-mono">
                                {hour.toString().padStart(2, '0')}:00
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DayView;