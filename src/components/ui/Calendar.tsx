// src/components/ui/Calendar.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEvent, CalendarAvailability, CalendarView } from '@/lib/types';
import { getEventStatusColor } from '@/lib/calendar-utils';
import { ChevronLeft, ChevronRight, Clock, Users, Plus } from 'lucide-react';

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

  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(new Date());
    updateCurrentTime();
    
    const timer = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // פונקציות עזר
  const generateTimeSlots = (startHour: number = 6, endHour: number = 23, intervalMinutes: number = 30): string[] => {
    const slots: string[] = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        if (hour === endHour && minute > 0) break;
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeSlot);
      }
    }
    return slots;
  };

  const getEventsForDateTime = (events: CalendarEvent[], date: Date, timeSlot: string): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      if (event.date !== dateStr) return false;
      
      // 🔧 תיקון: חזור ללוגיקה הקודמת אבל מתוקנת
      const eventStartTime = event.time;
      const eventEndTime = addMinutesToTime(event.time, event.duration);
      
      // האירוע מוצג בslot אם הslot נמצא בין תחילת האירוע לסיומו
      return timeSlot >= eventStartTime && timeSlot < eventEndTime;
    });
  };

  // 🔧 תיקון: לוגיקת זמינות מתוקנת - אם השעה בתוך הטווח, היא זמינה
  const hasAvailability = (availability: CalendarAvailability[], date: Date, timeSlot: string): boolean => {
    const dayOfWeek = date.getDay();
    const dayAvailability = availability.find(avail => 
      avail.day_of_week === dayOfWeek && avail.is_active
    );
    
    if (!dayAvailability) return false;
    
    // המר זמנים לדקות לצורך השוואה
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const slotMinutes = timeToMinutes(timeSlot);
    const startMinutes = timeToMinutes(dayAvailability.start_time);
    const endMinutes = timeToMinutes(dayAvailability.end_time);
    
    // 🔧 תיקון: השעה זמינה אם היא >= start_time ו < end_time
    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
  };

  const addMinutesToTime = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
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

  // 🔧 תיקון: קו זמן נוכחי מתוקן
  const getCurrentTimePosition = (timeSlot: string): { showLine: boolean; percentage: number } => {
    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    if (hours < 6 || hours > 23) {
      return { showLine: false, percentage: 0 };
    }

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

  const timeSlots = useMemo(() => generateTimeSlots(6, 23, 30), []);
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

  if (view === 'month') {
    return <MonthView 
      events={events} 
      currentDate={currentDate} 
      onDateChange={onDateChange}
      onEventClick={onEventClick}
      availability={availability}
    />;
  }

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

      {/* Calendar Grid */}
      <div className="overflow-auto max-h-[600px]">
        <div className="grid relative" style={{ gridTemplateColumns: `80px repeat(${displayDates.length}, 1fr)` }}>
          {/* Header Row - Days */}
          <div className="sticky top-0 bg-gray-50 p-4 border-b border-gray-200 z-10"></div>
          {displayDates.map((date, index) => (
            <div key={index} className="sticky top-0 bg-gray-50 p-4 border-b border-gray-200 text-center z-10">
              <div className="font-medium text-gray-900">
                {getShortDayName(date)}
              </div>
              <div className={`text-2xl font-bold mt-1 w-10 h-10 rounded-full flex items-center justify-center mx-auto ${
                isToday(date)
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-900'
              }`}>
                {date.getDate()}
              </div>
            </div>
          ))}

          {/* Time Slots */}
          {timeSlots.map((timeSlot) => (
            <React.Fragment key={timeSlot}>
              {/* Time Column */}
              <div className="p-2 border-b border-gray-100 text-sm text-gray-500 text-center bg-gray-50">
                {timeSlot}
              </div>
              
              {/* Date Columns */}
              {displayDates.map((date, dateIndex) => {
                const eventsInSlot = getEventsForDateTime(events, date, timeSlot);
                const isAvailable = hasAvailability(availability, date, timeSlot);
                const isPast = isPastTime(date, timeSlot);
                const currentTimePos = getCurrentTimePosition(timeSlot);
                const showCurrentTimeLine = isToday(date) && currentTimePos.showLine;
                
                return (
                  <div
                    key={`${date.toISOString()}-${timeSlot}`}
                    className={`relative border-b border-r border-gray-100 min-h-[60px] ${
                      isPast ? 'bg-gray-100' : 
                      isAvailable ? 'bg-white hover:bg-blue-50 cursor-pointer' : 
                      'bg-gray-50'
                    }`}
                    onClick={() => {
                      if (isAvailable && !isPast && eventsInSlot.length === 0) {
                        onTimeSlotClick(date, timeSlot);
                      }
                    }}
                  >
                    {/* קו זמן נוכחי */}
                    {showCurrentTimeLine && (
                      <div
                        className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 shadow-sm"
                        style={{ 
                          top: `${currentTimePos.percentage}%`
                        }}
                      >
                        <div className="absolute -right-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        <div className="absolute -right-16 -top-3 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                          {currentTime.toLocaleTimeString('he-IL', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: false 
                          })}
                        </div>
                      </div>
                    )}

                    {/* אירועים בחלון הזמן */}
                    {eventsInSlot.map((event, eventIndex) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        className={`absolute inset-x-1 top-1 p-2 rounded-lg text-xs font-medium cursor-pointer border-2 z-10 ${getEventStatusColor(event.status)}`}
                        style={{
                          height: `${calculateEventHeight(event.duration)}px`,
                          zIndex: eventIndex + 1
                        }}
                      >
                        <div className="truncate font-semibold">{event.clientName}</div>
                        <div className="truncate text-xs opacity-90">
                          {event.time} • {event.serviceName || 'תור'}
                        </div>
                      </div>
                    ))}
                    
                    {/* אינדיקטור זמינות */}
                    {isAvailable && eventsInSlot.length === 0 && !isPast && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <div className="bg-blue-500 text-white p-1 rounded-full shadow-lg">
                          <Plus className="w-3 h-3" />
                        </div>
                      </div>
                    )}
                    
                    {/* אינדיקטור לא זמין */}
                    {!isAvailable && !isPast && eventsInSlot.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-gray-400 text-xs"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

const MonthView: React.FC<{
  events: CalendarEvent[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  availability: CalendarAvailability[];
}> = ({ events, currentDate, onDateChange, onEventClick, availability }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="text-center py-12">
        <div className="text-gray-500">תצוגת חודש - בפיתוח</div>
      </div>
    </div>
  );
};