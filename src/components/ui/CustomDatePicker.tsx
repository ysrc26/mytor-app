// src/components/ui/CustomDatePicker.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { timeUtils } from '@/lib/time-utils';

interface CustomDatePickerProps {
  value: string; // format: YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  min?: string;
  max?: string;
  className?: string;
}

const MONTHS_HEBREW = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

const DAYS_HEBREW = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export const CustomDatePicker = ({ 
  value, 
  onChange, 
  placeholder = "בחר תאריך", 
  disabled = false, 
  readOnly = false,
  min,
  max,
  className = "" 
}: CustomDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      const date = new Date(value);
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }
    return new Date();
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // סגירת הקלנדר בלחיצה מחוץ לאזור
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // פורמט התאריך לתצוגה
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return placeholder;
    
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // יצירת ימי החודש
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // יום ראשון של החודש
    const firstDay = new Date(year, month, 1);
    // יום אחרון של החודש
    const lastDay = new Date(year, month + 1, 0);
    
    // התחלה מהראשון של השבוע
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // סוף בשבת של השבוע האחרון
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    const days = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const isCurrentMonth = current.getMonth() === month;
      const isToday = current.toDateString() === new Date().toDateString();
      
      // ✅ תיקון UTC - השתמש בפונקציה הבטוחה
      const dateStr = timeUtils.formatDateForAPI(current);
      const isSelected = value === dateStr;
      
      // בדיקת תאריכים מינימום ומקסימום
      let isDisabled = disabled;
      if (min && dateStr < min) isDisabled = true;
      if (max && dateStr > max) isDisabled = true;

      days.push({
        date: new Date(current),
        dateStr,
        day: current.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        isDisabled
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const handleDateSelect = (dateStr: string, isDisabled: boolean) => {
    if (isDisabled || readOnly) return;
    
    onChange(dateStr);
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    
    // ✅ תיקון UTC - השתמש בפונקציה הבטוחה
    const todayStr = timeUtils.formatDateForAPI(today);
    
    // בדיקה אם התאריך מותר
    let canSelectToday = !disabled && !readOnly;
    if (min && todayStr < min) canSelectToday = false;
    if (max && todayStr > max) canSelectToday = false;
    
    if (canSelectToday) {
      onChange(todayStr);
      setIsOpen(false);
    }
  };

  const calendarDays = generateCalendarDays();

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input להצגה ופתיחת הקלנדר */}
      <button
        type="button"
        onClick={() => !disabled && !readOnly && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 text-right
          border border-gray-300 rounded-lg bg-white
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors duration-200
          ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'hover:border-gray-400'}
          ${readOnly ? 'cursor-default' : 'cursor-pointer'}
        `}
      >
        <Calendar className="w-4 h-4 text-gray-400 ml-2" />
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {formatDisplayDate(value)}
        </span>
      </button>

      {/* הקלנדר הנפתח */}
      {isOpen && !disabled && !readOnly && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4">
          {/* כותרת החודש וניווט */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <h3 className="font-semibold text-gray-900">
                {MONTHS_HEBREW[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                onClick={goToToday}
                type="button"
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                היום
              </button>
            </div>

            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* ימי השבוע */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_HEBREW.map((day, index) => (
              <div key={index} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* ימי החודש */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleDateSelect(day.dateStr, day.isDisabled)}
                disabled={day.isDisabled}
                className={`
                  p-2 text-sm rounded-lg transition-all duration-200 min-h-[2.5rem]
                  ${!day.isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                  ${day.isToday ? 'bg-blue-50 text-blue-600 font-semibold ring-1 ring-blue-200' : ''}
                  ${day.isSelected ? 'bg-blue-600 text-white font-semibold' : ''}
                  ${day.isDisabled 
                    ? 'cursor-not-allowed opacity-40' 
                    : !day.isSelected && !day.isToday 
                      ? 'hover:bg-gray-100 cursor-pointer' 
                      : ''
                  }
                `}
              >
                {day.day}
              </button>
            ))}
          </div>

          {/* כפתורי פעולה */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
            <button
              onClick={() => onChange('')}
              type="button"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              נקה
            </button>
            <button
              onClick={() => setIsOpen(false)}
              type="button"
              className="text-sm text-gray-600 hover:text-gray-700 font-medium"
            >
              סגור
            </button>
          </div>
        </div>
      )}
    </div>
  );
};