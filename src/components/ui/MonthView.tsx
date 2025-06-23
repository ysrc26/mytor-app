// src/components/ui/MonthView.tsx
'use client';

import React, { useMemo } from 'react';
import { CalendarEvent, CalendarAvailability } from '@/lib/types';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';

interface MonthViewProps {
  events: CalendarEvent[];
  availability: CalendarAvailability[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
}

const MonthView: React.FC<MonthViewProps> = ({
  events,
  availability,
  currentDate,
  onDateChange,
  onEventClick,
  onTimeSlotClick
}) => {
  // יצירת לוח החודש
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // יום ראשון בחודש
    const firstDay = new Date(year, month, 1);
    // יום אחרון בחודש
    const lastDay = new Date(year, month + 1, 0);
    
    // יום ראשון שמוצג (ראשון השבוע של היום הראשון)
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // יום אחרון שמוצג
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate]);

  // קבלת אירועים לתאריך מסוים
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  // בדיקה אם התאריך זמין (יש זמינות ביום הזה)
  const isDateAvailable = (date: Date): boolean => {
    const dayOfWeek = date.getDay();
    return availability.some(avail => 
      avail.day_of_week === dayOfWeek && avail.is_active
    );
  };

  // בדיקה אם זה היום
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // בדיקה אם התאריך בחודש הנוכחי
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  // ניווט בין חודשים
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    onDateChange(newDate);
  };

  // צבע לפי סטטוס אירוע
  const getEventStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-200 text-yellow-800 border-l-4 border-yellow-400';
      case 'confirmed':
        return 'bg-green-200 text-green-800 border-l-4 border-green-400';
      case 'declined':
        return 'bg-red-200 text-red-800 border-l-4 border-red-400';
      case 'cancelled':
        return 'bg-gray-200 text-gray-800 border-l-4 border-gray-400';
      default:
        return 'bg-blue-200 text-blue-800 border-l-4 border-blue-400';
    }
  };

  // שמות החודשים בעברית
  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  // שמות הימים בעברית
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="חודש קודם"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="חודש הבא"
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
      <div className="p-6">
        {/* Header Row - Days of Week */}
        <div className="grid grid-cols-7 gap-px mb-4">
          {dayNames.map((dayName) => (
            <div
              key={dayName}
              className="bg-gray-100 p-3 text-center text-sm font-medium text-gray-600 rounded-lg"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {monthDays.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isAvailable = isDateAvailable(date);
            const todayDate = isToday(date);
            const currentMonth = isCurrentMonth(date);

            return (
              <div
                key={index}
                className={`
                  bg-white min-h-[120px] p-2 relative cursor-pointer transition-all hover:bg-gray-50
                  ${!currentMonth ? 'opacity-40' : ''}
                `}
                onClick={() => onTimeSlotClick && onTimeSlotClick(date, '09:00')}
              >
                {/* תאריך */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`
                      text-sm font-medium w-6 h-6 rounded-full flex items-center justify-center
                      ${todayDate
                        ? 'bg-blue-500 text-white'
                        : currentMonth
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }
                    `}
                  >
                    {date.getDate()}
                  </span>
                  
                  {/* אינדיקטור זמינות */}
                  {isAvailable && currentMonth && (
                    <div className="w-2 h-2 bg-green-400 rounded-full" title="יום פעיל" />
                  )}
                </div>

                {/* רשימת אירועים */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className={`
                        text-xs p-1 rounded cursor-pointer transition-all hover:opacity-80
                        ${getEventStatusColor(event.status)}
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      title={`${event.time} - ${event.client_name} (${event.status})`}
                    >
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className="truncate">
                          {event.time} {event.client_name}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* אירועים נוספים */}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayEvents.length - 3} נוספים
                    </div>
                  )}
                </div>

                {/* כפתור הוספת תור (רק בימים זמינים) */}
                {isAvailable && currentMonth && dayEvents.length === 0 && (
                  <div className="absolute bottom-2 left-2">
                    <button
                      className="w-6 h-6 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTimeSlotClick && onTimeSlotClick(date, '09:00');
                      }}
                      title="הוסף תור"
                    >
                      <Plus className="w-3 h-3 text-blue-600" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* מקרא */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs">
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
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-gray-600">יום פעיל</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthView;