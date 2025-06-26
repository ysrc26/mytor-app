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
      throw new Error(`Invalid time string: ${timeStr}`);
    }

    const [hours, minutes] = timeStr.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
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
    if (!timeStr) return '';
    return timeStr.slice(0, 5); // חותך שניות אם יש
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

    // 🐛 DEBUG לוג
    console.log('🔧 formatDateForAPI:', {
      inputDate: date,
      inputISOString: date.toISOString(),
      year,
      month,
      day,
      result,
      dateGetDay: date.getDay(),
      reconstructed: new Date(result + 'T12:00:00')
    });

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