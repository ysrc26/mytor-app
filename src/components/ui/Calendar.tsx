// src/components/ui/Calendar.tsx
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousViewRef = useRef<CalendarView | null>(null);

  // Update current time every minute
  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(new Date());
    updateCurrentTime();

    const timer = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Scroll to default time slot on mount
  // Default time slot is set to 6:00 AM
  useEffect(() => {
    const scrollToDefaultTime = () => {
      if (!scrollContainerRef.current) return;

      // גלילה לשעה 8:00 בבוקר (slot index 12)
      const defaultSlotIndex = 8; // 8:00 AM

      // גובה כל משבצת
      const slotHeight = 51;

      // חישוב המיקום
      const scrollPosition = defaultSlotIndex * slotHeight;

      // גלילה מיידית
      scrollContainerRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'auto'
      });
    };

    // גלול רק אם:
    // 1. זה הפעם הראשונה (previousViewRef.current הוא null)
    // 2. או אם חזרנו מתצוגת חודש לתצוגה אחרת
    const shouldScroll = (
      previousViewRef.current === null || // פעם ראשונה
      (previousViewRef.current === 'month' && view !== 'month') // חזרה מחודש
    );

    if (shouldScroll && view !== 'month') {
      const timeoutId = setTimeout(scrollToDefaultTime, 50);
      previousViewRef.current = view; // עדכן את התצוגה הקודמת
      return () => clearTimeout(timeoutId);
    } else {
      previousViewRef.current = view; // עדכן את התצוגה הקודמת גם אם לא גללנו
    }
  }, [view]);

  useEffect(() => {
    const scrollToDefaultTime = () => {
      if (!scrollContainerRef.current) return;

      console.log('First load - scrolling to 8 AM');

      // גלילה לשעה 8:00 בבוקר
      const defaultSlotIndex = 8;
      const slotHeight = 51;
      const scrollPosition = defaultSlotIndex * slotHeight;

      scrollContainerRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'auto'
      });
    };

    // גלול רק אם זה לא תצוגת חודש
    if (view !== 'month') {
      const timeoutId = setTimeout(scrollToDefaultTime, 100); // delay יותר ארוך לטעינה ראשונה
      return () => clearTimeout(timeoutId);
    }
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

  // פונקציות עזר לטיפול בשעות
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // פונקציה להוספת דקות לשעה
  const addMinutesToTime = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  };

  // פונקציה לקבלת אירועים לפי תאריך ושעה
  const getEventsForDateTime = (events: CalendarEvent[], date: Date, slotHour: number, slotMinute: number): CalendarEvent[] => {
    return events.filter(event => {

      // בדיקה אם האירוע הוא כל היום
      if (event.is_all_day) return false;

      const eventStartDate = event.date;
      const eventStartTime = event.time;
      const eventDurationMinutes = event.duration_minutes;

      const eventStart = new Date(`${eventStartDate}T${eventStartTime}`);
      const eventEnd = new Date(eventStart.getTime() + eventDurationMinutes * 60000);

      const slotDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), slotHour, slotMinute);
      const slotEndTime = new Date(slotDateTime.getTime() + 60 * 60000);

      return eventStart < slotEndTime && eventEnd > slotDateTime;
    });
  };

  // פונקציה לבדוק אם יש זמינות בתאריך ושעה מסוימים
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

  // פונקציה ליצירת תאריכים לתצוגה
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

  // פונקציות עזר לתאריך
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // פונקציה לבדוק אם השעה היא בעבר
  const isPastTime = (date: Date, time: string): boolean => {
    const now = new Date();
    const dateTime = new Date(`${date.toISOString().split('T')[0]} ${time}`);
    return dateTime < now;
  };

  // פונקציה לחישוב גובה אירוע לפי משך
  const calculateEventHeight = (durationMinutes: number): number => {
    const minHeight = 40;
    const calculatedHeight = (durationMinutes / 60) * 60;
    return Math.max(minHeight, calculatedHeight);
  };

  // פונקציה לקבלת שם יום קצר
  const getShortDayName = (date: Date): string => {
    const dayNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
    return dayNames[date.getDay()];
  };

  // פונקציה לקבלת צבע סטטוס אירוע
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

  // פונקציה לקבלת מיקום השעה הנוכחית
  const getCurrentTimePosition = (timeSlot: string): { showLine: boolean; percentage: number } => {
    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();

    const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
    const slotMinutes = slotHour * 60 + slotMinute;
    const currentMinutes = hours * 60 + minutes;
    const nextSlotMinutes = slotMinutes + 60;

    if (currentMinutes >= slotMinutes && currentMinutes < nextSlotMinutes) {
      const percentage = ((currentMinutes - slotMinutes) / 60) * 100;
      return { showLine: true, percentage };
    }

    return { showLine: false, percentage: 0 };
  };

  const timeSlots = useMemo(() => generateTimeSlots(0, 24, 60), []);
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

  // פונקציה לקבלת טקסט כותרת של התאריך הנוכחי
  const getHeaderText = (): string => {
    switch (view) {
      case 'day': {
        return currentDate.toLocaleDateString('he-IL', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }

      case 'three-days': {
        const startDate = new Date(currentDate);
        const endDate = new Date(currentDate);
        endDate.setDate(startDate.getDate() + 2);

        const start = startDate.getDate();
        const end = endDate.getDate();
        const startMonth = startDate.toLocaleDateString('he-IL', { month: 'long' });
        const endMonth = endDate.toLocaleDateString('he-IL', { month: 'long' });
        const year = startDate.getFullYear();

        // בדיקה אם זה אותו חודש
        if (startDate.getMonth() === endDate.getMonth()) {
          return `${start}-${end} ${startMonth} ${year}`;
        } else {
          return `${start} ${startMonth} - ${end} ${endMonth} ${year}`;
        }
      }

      case 'week': {
        const sunday = new Date(currentDate);
        sunday.setDate(currentDate.getDate() - currentDate.getDay());
        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);

        const start = sunday.getDate();
        const end = saturday.getDate();
        const startMonth = sunday.toLocaleDateString('he-IL', { month: 'long' });
        const endMonth = saturday.toLocaleDateString('he-IL', { month: 'long' });
        const year = sunday.getFullYear();

        // בדיקה אם זה אותו חודש
        if (sunday.getMonth() === saturday.getMonth()) {
          return `${start}-${end} ${startMonth} ${year}`;
        } else {
          return `${start} ${startMonth} - ${end} ${endMonth} ${year}`;
        }
      }

      case 'work-days': {
        const workDays = availability
          .filter(avail => avail.is_active)
          .map(avail => avail.day_of_week)
          .sort();

        if (workDays.length === 0) {
          return currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
        }

        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());

        const firstWorkDay = new Date(weekStart);
        firstWorkDay.setDate(weekStart.getDate() + workDays[0]);

        const lastWorkDay = new Date(weekStart);
        lastWorkDay.setDate(weekStart.getDate() + workDays[workDays.length - 1]);

        const start = firstWorkDay.getDate();
        const end = lastWorkDay.getDate();
        const startMonth = firstWorkDay.toLocaleDateString('he-IL', { month: 'long' });
        const endMonth = lastWorkDay.toLocaleDateString('he-IL', { month: 'long' });
        const year = firstWorkDay.getFullYear();

        // בדיקה אם זה אותו חודש
        if (firstWorkDay.getMonth() === lastWorkDay.getMonth()) {
          return `${start}-${end} ${startMonth} ${year}`;
        } else {
          return `${start} ${startMonth} - ${end} ${endMonth} ${year}`;
        }
      }

      case 'month':
      default: {
        return currentDate.toLocaleDateString('he-IL', {
          month: 'long',
          year: 'numeric'
        });
      }
    }
  };

  // פונקציה לקבלת אירועים שנמשכים כל היום
  const getAllDayEvents = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return events.filter(event =>
      event.date === dateStr && event.is_all_day === true
    );
  };

  // פונקציה לבדוק אם יש אירועי יום שלם בתאריכים מסוימים
  const hasAnyAllDayEvents = (events: CalendarEvent[], dates: Date[]): boolean => {
    return dates.some(date => {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return events.some(event => event.date === dateStr && event.is_all_day === true);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-lg font-semibold text-gray-900">
              {getHeaderText()}
            </h3>
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
        <div ref={scrollContainerRef} className="overflow-auto max-h-[600px]">
          <div className="grid relative" style={{ gridTemplateColumns: `80px repeat(${displayDates.length}, 1fr)` }}>
            {/* Header Row - Days */}
            <div className="sticky top-0 bg-gray-50 p-4 border-b border-gray-200 z-10"></div>
            {displayDates.map((date, index) => (
              <div key={index} className="sticky top-0 bg-gray-50 p-4 border-b border-gray-200 text-center z-30">
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

            {/* All-Day Events Row - רק אם יש אירועי יום שלם */}
            {hasAnyAllDayEvents(getFilteredEvents(events), displayDates) && (
              <>
                {/* תווית ריקה לעמודת השעות */}
                <div className="sticky top-[73px] bg-white border-b border-gray-200 z-20 min-h-[40px]">
                  {/* ריק - בלי טקסט */}
                </div>

                {/* אירועי יום שלם לכל יום */}
                {displayDates.map((date, dateIndex) => {
                  const allDayEvents = getAllDayEvents(getFilteredEvents(events), date);

                  return (
                    <div
                      key={`all-day-${dateIndex}`}
                      className="sticky top-[73px] bg-white border-b border-gray-200 z-20 min-h-[40px] p-1"
                    >
                      {allDayEvents.map((event) => (
                        <div
                          key={`all-day-event-${event.id}`}
                          className="text-xs p-1 mb-1 rounded cursor-pointer transition-all hover:opacity-80 bg-blue-100 text-blue-800 border border-blue-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                          title={`${event.client_name} - ${event.service_name || 'אירוע יום שלם'}`}
                        >
                          <div className="truncate font-medium">
                            {event.client_name}
                          </div>
                          {event.service_name && (
                            <div className="truncate opacity-75">
                              {event.service_name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            )}

            {/* Time Slots and Events */}
            {timeSlots.map((timeSlot, timeIndex) => {
              const [slotHour, slotMinute] = timeSlot.split(':').map(Number);

              return (
                <React.Fragment key={timeSlot}>
                  {/* Time Label */}
                  <div className={`sticky bg-gray-50 p-2 text-xs text-gray-500 font-medium border-b border-gray-100 z-10 ${hasAnyAllDayEvents(getFilteredEvents(events), displayDates)
                      ? 'top-[113px]'
                      : 'top-[73px]'
                    }`}>
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
                        className={`relative border-b border-gray-100 min-h-[50px] transition-colors ${isPast
                          ? 'bg-gray-100 cursor-not-allowed'
                          : !isAvailable
                            ? 'bg-gray-100 cursor-not-allowed'
                            : 'bg-white cursor-pointer hover:bg-gray-50'
                          } ${showCurrentTime ? 'z-10' : ''}`}
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
                              className={`absolute left-1 right-1 p-2 text-xs rounded-lg cursor-pointer transition-all hover:opacity-80 z-20 ${getEventStatusColor(event.status)}`}
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
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
      {/* Legend for non-month views */}
      {view !== 'month' && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-200 border-l-2 border-yellow-400 rounded-sm" />
              <span className="text-gray-600">ממתין לאישור</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-200 border-l-2 border-green-400 rounded-sm" />
              <span className="text-gray-600">מאושר</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-200 border-l-2 border-red-400 rounded-sm" />
              <span className="text-gray-600">נדחה</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-200 border-l-2 border-gray-400 rounded-sm" />
              <span className="text-gray-600">בוטל</span>
            </div>
            <div className="flex items-center gap-2 ml-4 border-l border-gray-300 pl-4">
              <Plus className="w-3 h-3 text-gray-500" />
              <span className="text-gray-600">לחץ על שעה פנויה ליצירת תור</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};