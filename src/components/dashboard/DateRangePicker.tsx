// src/components/dashboard/DateRangePicker.tsx
import React, { useState, useCallback } from 'react';
import { Calendar, Clock, Filter, X } from 'lucide-react';
import { timeUtils } from '@/lib/time-utils';

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onDateRangeChange: (start?: string, end?: string) => void;
  className?: string;
}

type QuickRange = 'today' | 'week' | 'month' | 'quarter' | 'all';

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateRangeChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate || '');
  const [tempEnd, setTempEnd] = useState(endDate || '');

  // קבלת תאריכים לטווחים מהירים
  const getQuickRangeDates = useCallback((range: QuickRange): { start?: string; end?: string } => {
    const todayDate = new Date(); // Date object
    const today = timeUtils.dateToLocalString(todayDate); // string

    switch (range) {
      case 'today':
        return { start: today, end: today };

      case 'week': {
        const weekEnd = new Date(todayDate); // ✅ השתמש ב-todayDate
        weekEnd.setDate(todayDate.getDate() + 7); // ✅ השתמש ב-todayDate
        return { start: today, end: timeUtils.dateToLocalString(weekEnd) }; // ✅ timeUtils
      }

      case 'month': {
        const monthEnd = new Date(todayDate); // ✅ השתמש ב-todayDate
        monthEnd.setMonth(todayDate.getMonth() + 1); // ✅ השתמש ב-todayDate
        return { start: today, end: timeUtils.dateToLocalString(monthEnd) }; // ✅ timeUtils
      }

      case 'quarter': {
        const quarterEnd = new Date(todayDate); // ✅ השתמש ב-todayDate
        quarterEnd.setMonth(todayDate.getMonth() + 3); // ✅ השתמש ב-todayDate
        return { start: today, end: timeUtils.dateToLocalString(quarterEnd) }; // ✅ timeUtils
      }

      case 'all':
        return { start: undefined, end: undefined };

      default:
        return {};
    }
  }, []);

  // בחירת טווח מהיר
  const handleQuickRange = useCallback((range: QuickRange) => {
    const dates = getQuickRangeDates(range);
    setTempStart(dates.start || '');
    setTempEnd(dates.end || '');
  }, [getQuickRangeDates]);

  // אישור תאריכים מותאמים אישית
  const handleApplyCustom = useCallback(() => {
    const start = tempStart || undefined;
    const end = tempEnd || undefined;
    console.log('🎯 Applying custom date range:', { start, end });
    onDateRangeChange(start, end);
    setIsOpen(false);
  }, [tempStart, tempEnd, onDateRangeChange]);

  // איפוס הכל
  const handleClear = useCallback(() => {
    setTempStart('');
    setTempEnd('');
    onDateRangeChange(undefined, undefined);
    setIsOpen(false);
  }, [onDateRangeChange]);

  // פורמט תצוגה של התאריך
  const formatDisplayDate = useCallback((dateStr?: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  // טקסט התצוגה הנוכחי
  const getDisplayText = useCallback((): string => {
    if (!startDate && !endDate) return 'כל התורים';
    if (startDate && endDate) {
      if (startDate === endDate) return `${formatDisplayDate(startDate)}`;
      return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
    }
    if (startDate) return `מ-${formatDisplayDate(startDate)}`;
    if (endDate) return `עד ${formatDisplayDate(endDate)}`;
    return 'כל התורים';
  }, [startDate, endDate, formatDisplayDate]);

  const quickRanges = [
    { key: 'today' as QuickRange, label: 'היום', icon: Clock },
    { key: 'week' as QuickRange, label: 'השבוע הקרוב', icon: Calendar },
    { key: 'month' as QuickRange, label: 'החודש הקרוב', icon: Calendar },
    { key: 'quarter' as QuickRange, label: '3 חודשים', icon: Calendar },
    { key: 'all' as QuickRange, label: 'כל התורים', icon: Filter }
  ];

  return (
    <div className={`relative ${className}`}>
      {/* כפתור הפתיחה */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-colors"
        type="button"
      >
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {getDisplayText()}
        </span>
        <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* תפריט נפתח */}
      {isOpen && (
        <>
          {/* רקע */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* התפריט */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">

            {/* כותרת */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">בחירת טווח תאריכים</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* טווחים מהירים */}
            <div className="space-y-2 mb-4">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                בחירה מהירה
              </label>
              <div className="grid grid-cols-1 gap-1">
                {quickRanges.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => handleQuickRange(key)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-right hover:bg-gray-100 rounded transition-colors"
                  >
                    <Icon className="h-4 w-4 text-gray-500" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* בחירה מותאמת אישית */}
            <div className="border-t pt-4">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2 block">
                טווח מותאם אישית
              </label>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">תאריך התחלה</label>
                  <input
                    type="date"
                    value={tempStart}
                    onChange={(e) => setTempStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">תאריך סיום</label>
                  <input
                    type="date"
                    value={tempEnd}
                    onChange={(e) => setTempEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* כפתורי פעולה */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleApplyCustom}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                >
                  אישור
                </button>
                <button
                  onClick={handleClear}
                  className="px-3 py-2 text-gray-600 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-colors"
                >
                  איפוס
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};