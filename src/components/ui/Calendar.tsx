// src/components/ui/Calendar.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEvent, CalendarAvailability, CalendarView } from '@/lib/types';
import { getEventStatusColor } from '@/lib/calendar-utils';
import { ChevronLeft, ChevronRight, Clock, Users, Plus } from 'lucide-react';
import MonthView from './MonthView';

interface CalendarProps {
  events: CalendarEvent[];
  availability: CalendarAvailability[];
  view: CalendarView;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date, time: string) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
  events,
  availability,
  view,
  currentDate,
  onDateChange,
  onEventClick,
  onTimeSlotClick
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDeclined, setShowDeclined] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(new Date());
    updateCurrentTime();

    const timer = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // פונקציות עזר
  const generateTimeSlots = (startHour: number = 0, endHour: number = 24, intervalMinutes: number = 30): string[] => {
    const slots: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        if (hour === 23 && minute > 30) break;

        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeSlot);
      }
    }
    return slots;
  };

  // פונקציה לסינון אירועים לפי הגדרות התצוגה
  const getFilteredEvents = (events: CalendarEvent[]): CalendarEvent[] => {
    return events.filter(event => {
      if (event.status === 'confirmed' || event.status === 'pending') {
        return true;
      }
      if (event.status === 'declined' && showDeclined) {
        return true;
      }
      if (event.status === 'cancelled' && showCancelled) {
        return true;
      }
      return false;
    });
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const addMinutesToTime = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  };

  const getEventsForDateTime = (events: CalendarEvent[], date: Date, slotHour: number, slotMinute: number): CalendarEvent[] => {
    return events.filter(event => {
      const eventStartDate = event.date;
      const eventStartTime = event.time;
      const eventDurationMinutes = event.duration_minutes;

      const eventStart = new Date(`${eventStartDate}T${eventStartTime}`);
      const eventEnd = new Date(eventStart.getTime() + eventDurationMinutes * 60000);

      const slotDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), slotHour, slotMinute);
      const slotEndTime = new Date(slotDateTime.getTime() + 30 * 60000);

      return eventStart < slotEndTime && eventEnd > slotDateTime;
    });
  };

  const hasAvailability = (availability: CalendarAvailability[], date: Date, timeSlot: string): boolean => {
    const dayOfWeek = date.getDay();
    const dayAvailability = availability.find(avail =>
      avail.day_of_week === dayOfWeek && avail.is_active
    );

    if (!dayAvailability) return false;

    const slotMinutes = timeToMinutes(timeSlot);
    const startMinutes = timeToMinutes(dayAvailability.start_time);
    const endMinutes = timeToMinutes(dayAvailability.end_time);

    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
  };

  const generateDisplayDates = (currentDate: Date, view: string, availability: CalendarAvailability[]): Date[] => {
    const dates: Date[] = [];
    const startDate = new Date(currentDate);

    switch (view) {
      case 'day':
        dates.push(new Date(startDate));
        break;
      case 'three-days':
        for (let i = 0; i < 3; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          dates.push(date);
        }
        break;
      case 'week':
        const sunday = new Date(startDate);
        sunday.setDate(startDate.getDate() - startDate.getDay());
        for (let i = 0; i < 7; i++) {
          const date = new Date(sunday);
          date.setDate(sunday.getDate() + i);
          dates.push(date);
        }
        break;
      case 'work-days':
        const workDays = availability
          .filter(avail => avail.is_active)
          .map(avail => avail.day_of_week)
          .sort();

        if (workDays.length > 0) {
          const weekStart = new Date(startDate);
          weekStart.setDate(startDate.getDate() - startDate.getDay());

          workDays.forEach(dayOfWeek => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + dayOfWeek);
            dates.push(date);
          });
        }
        break;
    }
    return dates;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastTime = (date: Date, time: string): boolean => {
    const now = new Date();
    const dateTime = new Date(`${date.toISOString().split('T')[0]} ${time}`);
    return dateTime < now;
  };

  const calculateEventHeight = (durationMinutes: number): number => {
    const minHeight = 40;
    const calculatedHeight = (durationMinutes / 30) * 30;
    return Math.max(minHeight, calculatedHeight);
  };

  const getShortDayName = (date: Date): string => {
    const dayNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
    return dayNames[date.getDay()];
  };

  const getEventStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500 text-white border-green-600';
      case 'pending':
        return 'bg-yellow-400 text-yellow-900 border-yellow-500 opacity-75';
      case 'declined':
        return 'bg-red-400 text-red-900 border-red-500 opacity-65';
      case 'cancelled':
        return 'bg-gray-400 text-gray-900 border-gray-500 opacity-65';
      default:
        return 'bg-blue-500 text-white border-blue-600';
    }
  };

  const getCurrentTimePosition = (timeSlot: string): { showLine: boolean; percentage: number } => {
    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();

    const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
    const slotMinutes = slotHour * 60 + slotMinute;
    const currentMinutes = hours * 60 + minutes;
    const nextSlotMinutes = slotMinutes + 30;

    if (currentMinutes >= slotMinutes && currentMinutes < nextSlotMinutes) {
      const percentage = ((currentMinutes - slotMinutes) / 30) * 100;
      return { showLine: true, percentage };
    }

    return { showLine: false, percentage: 0 };
  };

  const timeSlots = useMemo(() => generateTimeSlots(0, 24, 30), []);
  const displayDates = useMemo(() => {
    return generateDisplayDates(currentDate, view, availability);
  }, [currentDate, view, availability]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);

    switch (view) {
      case 'day':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'three-days':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 3 : -3));
        break;
      case 'week':
      case 'work-days':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }

    onDateChange(newDate);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {currentDate.toLocaleDateString('he-IL', {
                month: 'long',
                year: 'numeric'
              })}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={() => onDateChange(new Date())}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            היום
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-gray-50 px-6 py-2 border-b border-gray-100">
        <div className="flex items-center justify-start gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">הצג גם:</span>

            <button
              onClick={() => setShowDeclined(!showDeclined)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${showDeclined
                ? 'bg-red-100 text-red-700 hover:bg-red-150'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              <span className="flex items-center gap-1">
                {showDeclined ? '✓' : '○'} תורים שנדחו
              </span>
            </button>

            <button
              onClick={() => setShowCancelled(!showCancelled)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${showCancelled
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-250'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              <span className="flex items-center gap-1">
                {showCancelled ? '✓' : '○'} תורים שבוטלו
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Content based on view */}
      {view === 'month' ? (
        <MonthView
          events={getFilteredEvents(events)}
          currentDate={currentDate}
          onDateChange={onDateChange}
          onEventClick={onEventClick}
          availability={availability}
          onTimeSlotClick={onTimeSlotClick}
        />
      ) : (
        <div className="overflow-auto max-h-[600px]">
          <div className="grid relative" style={{ gridTemplateColumns: `80px repeat(${displayDates.length}, 1fr)` }}>
            {/* Header Row - Days */}
            <div className="sticky top-0 bg-gray-50 p-4 border-b border-gray-200 z-10"></div>
            {displayDates.map((date, index) => (
              <div key={index} className="sticky top-0 bg-gray-50 p-4 border-b border-gray-200 text-center z-10">
                <div className="font-medium text-gray-900">
                  {getShortDayName(date)}
                </div>
                <div className={`text-2xl font-bold mt-1 w-10 h-10 rounded-full flex items-center justify-center mx-auto ${isToday(date)
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700'
                  }`}>
                  {date.getDate()}
                </div>
              </div>
            ))}

            {/* Time Slots and Events */}
            {timeSlots.map((timeSlot, timeIndex) => {
              const [slotHour, slotMinute] = timeSlot.split(':').map(Number);

              return (
                <React.Fragment key={timeSlot}>
                  {/* Time Label */}
                  <div className="p-2 text-xs text-gray-500 font-medium border-b border-gray-100 bg-gray-50">
                    {timeSlot}
                  </div>

                  {/* Time Slot Columns */}
                  {displayDates.map((date, dateIndex) => {
                    const slotDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), slotHour, slotMinute);
                    const slotEvents = getEventsForDateTime(getFilteredEvents(events), date, slotHour, slotMinute);
                    const isAvailable = hasAvailability(availability, date, timeSlot);
                    const timePosition = getCurrentTimePosition(timeSlot);
                    const showCurrentTime = isToday(date) && timePosition.showLine;
                    const isPast = isPastTime(date, timeSlot);

                    return (
                      <div
                        key={`${date.toISOString()}-${timeSlot}`}
                        className={`relative border-b border-gray-100 min-h-[50px] cursor-pointer transition-colors ${isPast
                          ? 'bg-gray-50'
                          : isAvailable
                            ? 'hover:bg-blue-50'
                            : 'bg-gray-25'
                          }`}
                        onClick={() => !isPast && isAvailable && onTimeSlotClick(date, timeSlot)}
                      >
                        {/* Current Time Line */}
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

                        {/* Events */}
                        {slotEvents.map((event, eventIndex) => {
                          const eventStart = new Date(`${event.date}T${event.time}`);
                          const slotDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), slotHour, slotMinute);

                          let isFirstSlotInDay = false;

                          if (eventStart.toDateString() === date.toDateString()) {
                            const eventStartHour = eventStart.getHours();
                            const eventStartMinute = Math.floor(eventStart.getMinutes() / 30) * 30;
                            isFirstSlotInDay = (slotHour === eventStartHour && slotMinute === eventStartMinute);
                          }
                          else if (eventStart < slotDateTime) {
                            isFirstSlotInDay = (slotHour === 0 && slotMinute === 0);
                          }

                          if (!isFirstSlotInDay) return null;

                          const eventEnd = new Date(eventStart.getTime() + event.duration_minutes * 60000);
                          const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0);
                          const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

                          const eventStartInDay = eventStart > dayStart ? eventStart : dayStart;
                          const eventEndInDay = eventEnd < dayEnd ? eventEnd : dayEnd;
                          const minutesInDay = (eventEndInDay.getTime() - eventStartInDay.getTime()) / 60000;

                          const eventHeight = Math.ceil(minutesInDay / 30) * 50;

                          return (
                            <div
                              key={`${event.id}-${date.toDateString()}-${timeSlot}`}
                              className={`absolute left-1 right-1 p-2 text-xs rounded-lg cursor-pointer transition-all hover:opacity-80 z-10 ${getEventStatusColor(event.status)}`}
                              style={{
                                height: `${eventHeight}px`,
                                top: '2px'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEventClick(event);
                              }}
                            >
                              <div className="font-medium truncate">{event.client_name}</div>
                              <div className="flex items-center gap-1 mt-1 opacity-75">
                                <Clock className="w-3 h-3" />
                                <span>{event.time}</span>
                                {event.duration_minutes > 60 && (
                                  <span className="text-xs">
                                    ({Math.floor(event.duration_minutes / 60)}ש {event.duration_minutes % 60 > 0 ? `${event.duration_minutes % 60}ד` : ''})
                                  </span>
                                )}
                              </div>
                              {event.service_name && (
                                <div className="truncate text-xs opacity-75 mt-1">{event.service_name}</div>
                              )}
                            </div>
                          );
                        })}

                        {/* Add Button for Available Empty Slots */}
                        {slotEvents.length === 0 && !isPast && isAvailable && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Plus className="w-4 h-4 text-gray-400" />
                          </div>
                        )}

                        {/* Unavailable indicator */}
                        {!isAvailable && !isPast && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-gray-300 text-xs">לא זמין</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};