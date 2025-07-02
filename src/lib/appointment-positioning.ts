// src/lib/appointment-positioning.ts
// אלגוריתם למיקום תורים חופפים בקלנדר

import { useMemo, useEffect } from 'react';
import { timeUtils } from './time-utils';
import type { Appointment } from './types';

export interface AppointmentLayout {
  appointment: Appointment;
  left: number;      // מיקום מהצד שמאל (0-100%)
  width: number;     // רוחב (0-100%)
  column: number;    // מספר העמודה
  totalColumns: number; // סך העמודות בחפיפה הזו
}

export interface TimeSlotOverlap {
  startMinutes: number;
  endMinutes: number;
  appointments: Appointment[];
  maxConcurrent: number; // מקסימום תורים במקביל בטווח הזה
}

/**
 * מחלקה לחישוב מיקום תורים חופפים
 */
export class AppointmentPositioning {
  
  /**
   * מחשב מיקום עבור כל התורים ביום נתון
   */
  static calculateDayLayout(appointments: Appointment[]): AppointmentLayout[] {
    if (appointments.length === 0) return [];

    // מיון התורים לפי זמן התחלה
    const sortedAppointments = [...appointments].sort((a, b) => {
      const timeA = timeUtils.extractStartTime(a);
      const timeB = timeUtils.extractStartTime(b);
      return timeA.localeCompare(timeB);
    });

    // זיהוי קבוצות חפיפות
    const overlapGroups = this.findOverlapGroups(sortedAppointments);
    
    // חישוב מיקום עבור כל קבוצה
    const layouts: AppointmentLayout[] = [];
    
    for (const group of overlapGroups) {
      const groupLayouts = this.calculateGroupLayout(group);
      layouts.push(...groupLayouts);
    }

    return layouts;
  }

  /**
   * מוצא קבוצות תורים שחופפים זה לזה
   */
  private static findOverlapGroups(appointments: Appointment[]): Appointment[][] {
    const groups: Appointment[][] = [];
    const processed = new Set<string>();

    for (const appointment of appointments) {
      if (processed.has(appointment.id)) continue;

      // מצא את כל התורים שחופפים לתור הנוכחי
      const group = this.findAllOverlapping(appointment, appointments, processed);
      
      if (group.length > 0) {
        groups.push(group);
        // סמן את כל התורים בקבוצה כמעובדים
        group.forEach(apt => processed.add(apt.id));
      }
    }

    return groups;
  }

  /**
   * מוצא את כל התורים שחופפים לתור נתון (כולל חפיפות עקיפות)
   */
  private static findAllOverlapping(
    appointment: Appointment, 
    allAppointments: Appointment[], 
    exclude: Set<string>
  ): Appointment[] {
    const group = [appointment];
    const toProcess = [appointment];
    const inGroup = new Set([appointment.id]);

    while (toProcess.length > 0) {
      const current = toProcess.shift()!;
      
      // מצא תורים שחופפים לתור הנוכחי
      for (const other of allAppointments) {
        if (exclude.has(other.id) || inGroup.has(other.id)) continue;
        
        if (this.hasTimeOverlap(current, other)) {
          group.push(other);
          toProcess.push(other);
          inGroup.add(other.id);
        }
      }
    }

    return group;
  }

  /**
   * בדיקה אם שני תורים חופפים בזמן
   */
  private static hasTimeOverlap(apt1: Appointment, apt2: Appointment): boolean {
    try {
      const start1 = timeUtils.extractStartTime(apt1);
      const end1 = timeUtils.extractEndTime(apt1);
      const start2 = timeUtils.extractStartTime(apt2);
      const end2 = timeUtils.extractEndTime(apt2);

      return timeUtils.hasTimeOverlap(start1, end1, start2, end2);
    } catch (error) {
      console.warn('Error checking time overlap:', error);
      return false;
    }
  }

  /**
   * מחשב מיקום עבור קבוצת תורים חופפים
   */
  private static calculateGroupLayout(group: Appointment[]): AppointmentLayout[] {
    if (group.length === 1) {
      // תור יחיד - תופס את כל הרוחב
      return [{
        appointment: group[0],
        left: 0,
        width: 100,
        column: 0,
        totalColumns: 1
      }];
    }

    // מיון התורים לפי זמן התחלה ואז לפי זמן סיום
    const sortedGroup = [...group].sort((a, b) => {
      const startA = timeUtils.extractStartTime(a);
      const startB = timeUtils.extractStartTime(b);
      const comparison = startA.localeCompare(startB);
      
      if (comparison === 0) {
        // אם מתחילים באותו זמן, מיין לפי זמן סיום
        const endA = timeUtils.extractEndTime(a);
        const endB = timeUtils.extractEndTime(b);
        return endA.localeCompare(endB);
      }
      
      return comparison;
    });

    // חישוב מקסימום תורים במקביל
    const maxConcurrent = this.calculateMaxConcurrentAppointments(sortedGroup);
    
    // הקצאת עמודות לתורים
    const layouts: AppointmentLayout[] = [];
    const columnEndTimes: (number | null)[] = new Array(maxConcurrent).fill(null);

    for (const appointment of sortedGroup) {
      const startMinutes = timeUtils.timeToMinutes(timeUtils.extractStartTime(appointment));
      const endMinutes = timeUtils.timeToMinutes(timeUtils.extractEndTime(appointment));

      // מצא את העמודה הפנויה הראשונה
      let column = 0;
      for (let i = 0; i < columnEndTimes.length; i++) {
        if (columnEndTimes[i] === null || columnEndTimes[i]! <= startMinutes) {
          column = i;
          break;
        }
      }

      // עדכן את זמן הסיום של העמודה
      columnEndTimes[column] = endMinutes;

      // חשב מיקום ורוחב
      const width = 100 / maxConcurrent;
      const left = column * width;

      layouts.push({
        appointment,
        left,
        width,
        column,
        totalColumns: maxConcurrent
      });
    }

    return layouts;
  }

  /**
   * מחשב את המספר המקסימלי של תורים שרצים בו-זמנית
   */
  private static calculateMaxConcurrentAppointments(appointments: Appointment[]): number {
    const events: Array<{ time: number; type: 'start' | 'end'; id: string }> = [];

    // יצירת אירועי התחלה וסיום
    for (const appointment of appointments) {
      const startMinutes = timeUtils.timeToMinutes(timeUtils.extractStartTime(appointment));
      const endMinutes = timeUtils.timeToMinutes(timeUtils.extractEndTime(appointment));

      events.push({ time: startMinutes, type: 'start', id: appointment.id });
      events.push({ time: endMinutes, type: 'end', id: appointment.id });
    }

    // מיון האירועים לפי זמן
    events.sort((a, b) => {
      if (a.time === b.time) {
        // אם באותו זמן, סיום לפני התחלה
        return a.type === 'end' ? -1 : 1;
      }
      return a.time - b.time;
    });

    // חישוב מקסימום תורים פעילים
    let currentConcurrent = 0;
    let maxConcurrent = 0;

    for (const event of events) {
      if (event.type === 'start') {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
      } else {
        currentConcurrent--;
      }
    }

    return maxConcurrent;
  }

  /**
   * פונקציה עזר לבדיקת חפיפה מהירה
   */
  static hasOverlap(apt1: Appointment, apt2: Appointment): boolean {
    return this.hasTimeOverlap(apt1, apt2);
  }

  /**
   * מחשב כמה תורים חופפים לתור נתון
   */
  static getOverlappingCount(appointment: Appointment, allAppointments: Appointment[]): number {
    return allAppointments.filter(other => 
      other.id !== appointment.id && this.hasTimeOverlap(appointment, other)
    ).length + 1; // +1 לתור עצמו
  }

  /**
   * פונקציה לדיבוג - מציגה את המיקומים שחושבו
   */
  static debugLayout(layouts: AppointmentLayout[]): void {
    if (process.env.NODE_ENV !== 'development') return;

    console.log('📅 Appointment Layout Debug:');
    layouts.forEach(layout => {
      const start = timeUtils.extractStartTime(layout.appointment);
      const end = timeUtils.extractEndTime(layout.appointment);
      console.log(
        `${layout.appointment.client_name} (${start}-${end}): ` +
        `Column ${layout.column + 1}/${layout.totalColumns}, ` +
        `Left: ${layout.left.toFixed(1)}%, Width: ${layout.width.toFixed(1)}%`
      );
    });
  }
}

/**
 * Hook לשימוש בקומפוננטים
 */
export const useAppointmentLayouts = (appointments: Appointment[]) => {
  const layouts = useMemo(() => {
    return AppointmentPositioning.calculateDayLayout(appointments);
  }, [appointments]);

  // דיבוג במצב פיתוח
  useEffect(() => {
    AppointmentPositioning.debugLayout(layouts);
  }, [layouts]);

  return layouts;
};

// Export של הפונקציות העיקריות
export const {
  calculateDayLayout,
  hasOverlap,
  getOverlappingCount
} = AppointmentPositioning;