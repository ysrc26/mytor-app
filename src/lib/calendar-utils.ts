// src/lib/calendar-utils.ts

import { CalendarEvent, CalendarAvailability } from './types';

/**
 * פונקציה להוספת דקות לשעה
 */
export const addMinutesToTime = (time: string, minutes: number): string => {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
};

/**
 * פונקציה לבדיקה אם זמן נמצא בטווח
 */
export const isTimeInRange = (time: string, startTime: string, endTime: string): boolean => {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
};

/**
 * המרת שעה לדקות
 */
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * יצירת רשימת חלונות זמן
 */
export const generateTimeSlots = (
  startHour: number = 6, 
  endHour: number = 23, 
  intervalMinutes: number = 30
): string[] => {
  const slots: string[] = [];
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      if (hour === endHour && minute > 0) break; // לא להוסיף חצי שעה אחרי השעה האחרונה
      
      const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeSlot);
    }
  }
  
  return slots;
};

/**
 * קבלת אירועים לתאריך ושעה ספציפיים
 */
export const getEventsForDateTime = (
  events: CalendarEvent[], 
  date: Date, 
  timeSlot: string
): CalendarEvent[] => {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  
  return events.filter(event => {
    if (event.date !== dateStr) return false;
    
    const eventStartTime = event.start_time;
    const eventEndTime = addMinutesToTime(event.start_time, event.duration_minutes);
    
    return isTimeInRange(timeSlot, eventStartTime, eventEndTime);
  });
};

/**
 * בדיקה אם יש זמינות בתאריך ושעה
 */
export const hasAvailability = (
  availability: CalendarAvailability[], 
  date: Date, 
  timeSlot: string
): boolean => {
  const dayOfWeek = date.getDay();
  const dayAvailability = availability.find(avail => 
    avail.day_of_week === dayOfWeek && avail.is_active
  );
  
  if (!dayAvailability) return false;
  
  return isTimeInRange(timeSlot, dayAvailability.start_time, dayAvailability.end_time);
};

/**
 * קבלת צבע לפי סטטוס אירוע
 */
export const getEventStatusColor = (status: string): string => {
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

/**
 * פורמט תאריך לתצוגה בעברית
 */
export const formatDateHebrew = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  };
  
  return date.toLocaleDateString('he-IL', { ...defaultOptions, ...options });
};

/**
 * קבלת שם יום בעברית קצר
 */
export const getShortDayName = (date: Date): string => {
  const dayNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  return dayNames[date.getDay()];
};

/**
 * בדיקה אם תאריך הוא היום
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * בדיקה אם זמן או תאריך עברו  
 */
export const isPastTime = (date: Date, time?: string): boolean => {
  const now = new Date();
  
  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    const dateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
    return dateTime < now;
  }
  
  // השוואת תאריכים בלי שעות
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return checkDate < today;
};

/**
 * חישוב גובה אירוע לפי משכו
 */
export const calculateEventHeight = (durationMinutes: number, slotHeight: number = 30): number => {
  const minHeight = 40; // גובה מינימלי
  const calculatedHeight = (durationMinutes / 30) * slotHeight;
  return Math.max(minHeight, calculatedHeight);
};

/**
 * קבלת ימי עבודה בשבוע
 */
export const getWorkDays = (availability: CalendarAvailability[]): number[] => {
  return availability
    .filter(avail => avail.is_active)
    .map(avail => avail.day_of_week)
    .sort();
};

/**
 * יצירת תאריכים לתצוגה לפי סוג התצוגה
 */
export const generateDisplayDates = (
  currentDate: Date, 
  view: string, 
  availability: CalendarAvailability[]
): Date[] => {
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
      // התחל מיום ראשון של השבוע
      const sunday = new Date(startDate);
      sunday.setDate(startDate.getDate() - startDate.getDay());
      for (let i = 0; i < 7; i++) {
        const date = new Date(sunday);
        date.setDate(sunday.getDate() + i);
        dates.push(date);
      }
      break;
      
    case 'work-days':
      const workDays = getWorkDays(availability);
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

/**
 * המרת תאריך לstring מקומי (בלי UTC)
 */
export const dateToLocalString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};