// src/lib/time-utils.ts

/**
 * Utility functions לניהול זמנים במערכת MyTor
 * פונקציות אלו משותפות לFrontend ולBackend כדי להבטיח עקביות
 */

export interface TimeSlot {
  start_time: string;
  end_time: string;
}

export interface AppointmentConflict {
  time: string;
  duration_minutes: number;
}

export const timeUtils = {
  /**
   * המרת מחרוזת זמן לדקות
   * @param timeStr - זמן בפורמט "HH:MM" או "HH:MM:SS"
   * @returns מספר דקות מתחילת היום
   */
  timeToMinutes: (timeStr: string): number => {
    if (!timeStr || typeof timeStr !== 'string') {
      console.error('❌ timeToMinutes: Invalid input -', timeStr);
      throw new Error(`Invalid time string: ${timeStr}`);
    }

    // בדיקה אם זה UUID במקום זמן (למניעת באג נפוץ)
    if (timeStr.length === 36 && timeStr.includes('-')) {
      console.error('❌ timeToMinutes: Received UUID instead of time -', timeStr);
      throw new Error(`Received UUID instead of time format: ${timeStr}`);
    }

    // בדיקה לפורמט זמן תקין
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/;
    if (!timeRegex.test(timeStr)) {
      console.error('❌ timeToMinutes: Invalid time format -', timeStr);
      throw new Error(`Invalid time format: ${timeStr}. Expected HH:MM or HH:MM:SS`);
    }

    const [hours, minutes] = timeStr.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.error('❌ timeToMinutes: Invalid time values -', { timeStr, hours, minutes });
      throw new Error(`Invalid time format: ${timeStr}`);
    }

    return hours * 60 + minutes;
  },

  /**
   * המרת דקות למחרוזת זמן
   * @param minutes - מספר דקות מתחילת היום
   * @returns זמן בפורמט "HH:MM"
   */
  minutesToTime: (minutes: number): string => {
    if (minutes < 0 || minutes >= 24 * 60) {
      throw new Error(`Invalid minutes value: ${minutes}`);
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  },

  /**
   * נורמליזציה של מחרוזת זמן (הסרת שניות)
   * @param timeStr - זמן בפורמט "HH:MM:SS" או "HH:MM"
   * @returns זמן בפורמט "HH:MM"
   */
  normalizeTime: (timeStr: string): string => {
    if (!timeStr || typeof timeStr !== 'string') {
      console.warn('⚠️ normalizeTime: Empty or invalid input -', timeStr);
      return '';
    }

    // בדיקה אם זה UUID
    if (timeStr.length === 36 && timeStr.includes('-')) {
      console.error('❌ normalizeTime: Received UUID instead of time -', timeStr);
      throw new Error(`Received UUID instead of time format: ${timeStr}`);
    }

    return timeStr.slice(0, 5); // חותך את השניות אם קיימות
  },

  /**
* פורמט תאריך ל-API (YYYY-MM-DD) ללא בעיות timezone
* @param date - התאריך לפורמט
* @returns מחרוזת תאריך בפורמט YYYY-MM-DD
*/
  formatDateForAPI: (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const result = `${year}-${month}-${day}`;

    return result;
  },

  /**
   * בדיקת חפיפה בין שני זמנים
   * @param slot1Start - זמן התחלה של slot 1
   * @param slot1Duration - משך slot 1 בדקות
   * @param slot2Start - זמן התחלה של slot 2  
   * @param slot2Duration - משך slot 2 בדקות
   * @returns true אם יש חפיפה
   */
  hasTimeConflict: (
    slot1Start: string,
    slot1Duration: number,
    slot2Start: string,
    slot2Duration: number
  ): boolean => {
    try {
      const start1 = timeUtils.timeToMinutes(timeUtils.normalizeTime(slot1Start));
      const end1 = start1 + slot1Duration;
      const start2 = timeUtils.timeToMinutes(timeUtils.normalizeTime(slot2Start));
      const end2 = start2 + slot2Duration;

      // יש חפיפה אם התחלת אחד לפני סוף השני ולהיפך
      return (start1 < end2 && start2 < end1);
    } catch (error) {
      console.error('Error checking time conflict:', error);
      return false; // במקרה של שגיאה, נניח שאין חפיפה
    }
  },

  /**
   * בדיקת חפיפה בין שני טווחי זמן
   * @param start1 - התחלה של טווח 1
   * @param end1 - סוף של טווח 1
   * @param start2 - התחלה של טווח 2
   * @param end2 - סוף של טווח 2
   * @returns true אם יש חפיפה
   */
  hasTimeOverlap: (
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean => {
    try {
      const start1Minutes = timeUtils.timeToMinutes(timeUtils.normalizeTime(start1));
      const end1Minutes = timeUtils.timeToMinutes(timeUtils.normalizeTime(end1));
      const start2Minutes = timeUtils.timeToMinutes(timeUtils.normalizeTime(start2));
      const end2Minutes = timeUtils.timeToMinutes(timeUtils.normalizeTime(end2));

      // 🔍 הוסף לוג לדיבוג
      console.log('🔍 Overlap check:', {
        range1: `${start1}-${end1} (${start1Minutes}-${end1Minutes})`,
        range2: `${start2}-${end2} (${start2Minutes}-${end2Minutes})`,
        overlap: (start1Minutes < end2Minutes && start2Minutes < end1Minutes)
      });

      return (start1Minutes < end2Minutes && start2Minutes < end1Minutes);
    } catch (error) {
      console.error('❌ hasTimeOverlap: Error checking overlap', error);
      return false;
    }
  },


  /**
   * בדיקה אם זמן נתון נמצא בטווח זמינות
   * @param time - הזמן לבדיקה
   * @param timeSlot - טווח הזמינות
   * @returns true אם הזמן בטווח
   */
  isTimeInSlot: (time: string, timeSlot: TimeSlot): boolean => {
    try {
      const timeMinutes = timeUtils.timeToMinutes(timeUtils.normalizeTime(time));
      const startMinutes = timeUtils.timeToMinutes(timeUtils.normalizeTime(timeSlot.start_time));
      const endMinutes = timeUtils.timeToMinutes(timeUtils.normalizeTime(timeSlot.end_time));

      return timeMinutes >= startMinutes && timeMinutes < endMinutes;
    } catch (error) {
      console.error('Error checking if time in slot:', error);
      return false;
    }
  },

  /**
 * המרת תאריך מ-API string לDate object בצורה בטוחה
 * @param dateStr - תאריך בפורמט YYYY-MM-DD
 * @returns Date object
 */
  parseAPIDate: (dateStr: string): Date => {
    if (!dateStr || typeof dateStr !== 'string') {
      throw new Error(`Invalid date string: ${dateStr}`);
    }

    const [year, month, day] = dateStr.split('-').map(Number);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }

    // יצירת תאריך מקומי ללא בעיות UTC
    return new Date(year, month - 1, day);
  },

  /**
   * בדיקה אם שני תאריכים שווים (בלי שעה)
   * @param date1 - תאריך ראשון
   * @param date2 - תאריך שני
   * @returns true אם התאריכים שווים
   */
  isSameDate: (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  },

  /**
   * יצירת תאריך ללא שעה (00:00:00)
   * @param date - התאריך
   * @returns תאריך עם שעה 00:00:00
   */
  startOfDay: (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  },

  /**
   * יצירת רשימת זמנים פנויים לתאריך ושירות נתונים
   * @param date - התאריך
   * @param serviceDuration - משך השירות בדקות
   * @param availability - רשימת זמינויות
   * @param existingAppointments - תורים קיימים
   * @param slotInterval - רווח בין slots בדקות (ברירת מחדל: 15)
   * @returns מערך של זמנים פנויים
   */
  generateAvailableSlots: (
    date: Date,
    serviceDuration: number,
    availability: TimeSlot[],
    existingAppointments: AppointmentConflict[] = [],
    slotInterval: number = 15
  ): string[] => {
    const dayOfWeek = date.getDay();
    const slots: string[] = [];

    // מציאת זמינות ליום זה
    const dayAvailability = availability.find((slot: any) =>
      slot.day_of_week === dayOfWeek ||
      (typeof slot.day_of_week === 'undefined' && slot.start_time && slot.end_time)
    );

    if (!dayAvailability) {
      return [];
    }

    try {
      const startMinutes = timeUtils.timeToMinutes(timeUtils.normalizeTime(dayAvailability.start_time));
      const endMinutes = timeUtils.timeToMinutes(timeUtils.normalizeTime(dayAvailability.end_time));

      // חישוב זמן אחרון אפשרי להתחלת שירות
      const lastStartMinutes = endMinutes - serviceDuration;

      // יצירת slots
      for (let currentMinutes = startMinutes; currentMinutes <= lastStartMinutes; currentMinutes += slotInterval) {
        const timeString = timeUtils.minutesToTime(currentMinutes);

        // בדיקה אם הslot לא מתנגש עם תור קיים
        const hasConflict = existingAppointments.some(appointment =>
          timeUtils.hasTimeConflict(
            timeString,
            serviceDuration,
            timeUtils.normalizeTime(appointment.time),
            appointment.duration_minutes
          )
        );

        if (!hasConflict) {
          slots.push(timeString);
        }
      }

      return slots;
    } catch (error) {
      console.error('Error generating available slots:', error);
      return [];
    }
  },

  /**
   * 
   * @returns רשימת הצעות זמנים
   * מ-08:00 עד 20:00 כל 15 דקות
   * לדוגמה: ["08:00", "08:15", "08:30", ..., "20:00"]
   */
  generateTimeSuggestions: () => {
    const suggestions = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        suggestions.push(timeStr);
      }
    }
    return suggestions;
  },

  /**
   * בדיקה אם תאריך הוא בעבר (יום קודם)
   * @param date - התאריך לבדיקה
   * @returns true אם התאריך בעבר
   */
  isPastDate: (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate < today;
  },

  /**
   * בדיקה אם זמן עבר (באותו יום)
   * @param time - הזמן לבדיקה
   * @param date - התאריך (אופציונלי, ברירת מחדל היום)
   * @returns true אם הזמן עבר
   */
  isPastTime: (time: string, date?: Date): boolean => {
    const checkDate = date || new Date();
    const today = new Date();

    // אם זה לא היום, לא רלוונטי
    if (checkDate.toDateString() !== today.toDateString()) {
      return false;
    }

    try {
      const timeMinutes = timeUtils.timeToMinutes(timeUtils.normalizeTime(time));
      const currentMinutes = today.getHours() * 60 + today.getMinutes();

      return timeMinutes <= currentMinutes;
    } catch (error) {
      console.error('Error checking if time is past:', error);
      return false;
    }
  },

  /**
   * פורמט תאריך ישראלי
   * @param date - התאריך
   * @returns תאריך בפורמט ישראלי
   */
  formatHebrewDate: (date: Date): string => {
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  },

  /**
   * פורמט זמן ישראלי
   * @param time - הזמן בפורמט "HH:MM"
   * @returns זמן בפורמט ישראלי
   */
  formatHebrewTime: (time: string): string => {
    try {
      const [hours, minutes] = timeUtils.normalizeTime(time).split(':');
      return `${hours}:${minutes}`;
    } catch (error) {
      return time;
    }
  },

  /**
   * פונקציה לbacking up עם time אם start_time לא קיים
   */
  extractStartTime: (appointment: any): string => {
    // נסה קודם start_time, אחר כך time כ-fallback
    const startTime = appointment.start_time || appointment.time;

    if (!startTime) {
      console.error('❌ extractStartTime: No time field found in appointment', appointment);
      throw new Error('No valid time field found in appointment');
    }

    return timeUtils.normalizeTime(startTime);
  },

  /**
   * פונקציה לbacking up עם calculated end_time אם לא קיים
   */
  extractEndTime: (appointment: any): string => {
    if (appointment.end_time) {
      return timeUtils.normalizeTime(appointment.end_time);
    }

    // חישוב end_time מ-start_time + duration
    const startTime = timeUtils.extractStartTime(appointment);
    const duration = appointment.duration_minutes ||
      appointment.service?.duration_minutes ||
      appointment.services?.duration_minutes ||
      60;

    return timeUtils.minutesToTime(
      timeUtils.timeToMinutes(startTime) + duration
    );
  }
};

// Export individual functions for convenience
export const {
  timeToMinutes,
  minutesToTime,
  normalizeTime,
  hasTimeConflict,
  isTimeInSlot,
  generateAvailableSlots,
  isPastDate,
  isPastTime,
  formatHebrewDate,
  formatHebrewTime,
  formatDateForAPI
} = timeUtils;