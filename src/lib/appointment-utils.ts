// src/lib/appointment-utils.ts
import { supabasePublic } from '@/lib/supabase-public';
import { getSupabaseClient } from '@/lib/api-auth';
import { timeUtils } from '@/lib/time-utils';
import { Appointment, Availability, Service } from '@/lib/types';

// Extended types for appointment logic (no changes to original types.ts)
export interface AppointmentValidationOptions {
  businessId: string;
  serviceId: string;
  date: string;
  start_time: string;
  excludeAppointmentId?: string; // For editing existing appointments
}

export interface AvailabilityCheckResult {
  isValid: boolean;
  error?: string;
  availableSlots?: string[];
}

export interface TimeSlotConflict {
  hasConflict: boolean;
  conflictingTime?: string;
  conflictingService?: string;
}

export interface AppointmentWithService {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  services?: {
    duration_minutes: number;
    name?: string;
  };
}

/**
 * Centralized appointment validation logic
 * Used by both public booking API and private management APIs
 */
export class AppointmentValidator {

  /**
   * Validate if a time slot is available for booking
   */
  static async validateTimeSlot(options: AppointmentValidationOptions): Promise<AvailabilityCheckResult> {
    const { businessId, serviceId, date, start_time, excludeAppointmentId } = options;

    try {
      // 1. Get business and service info
      const [business, service] = await Promise.all([
        this.getBusinessInfo(businessId),
        this.getServiceInfo(serviceId, businessId)
      ]);

      if (!business?.is_active || !service?.is_active) {
        return { isValid: false, error: 'עסק או שירות לא פעילים' };
      }

      // 2. Check date validity
      const appointmentDate = new Date(date);
      if (timeUtils.isPastDate(appointmentDate)) {
        return { isValid: false, error: 'לא ניתן לקבוע תור בעבר' };
      }

      if (timeUtils.isPastTime(start_time, appointmentDate)) {
        return { isValid: false, error: 'לא ניתן לקבוע תור בזמן שעבר' };
      }

      // 3. Check business availability for this day
      const dayOfWeek = appointmentDate.getDay();
      const availabilityCheck = await this.checkBusinessAvailability(businessId, dayOfWeek, start_time);
      if (!availabilityCheck.isValid) {
        return availabilityCheck;
      }

      // 4. Check for unavailable dates
      const unavailableCheck = await this.checkUnavailableDate(businessId, date);
      if (!unavailableCheck.isValid) {
        return unavailableCheck;
      }

      // 5. Check for appointment conflicts
      const conflictCheck = await this.checkAppointmentConflicts(
        businessId,
        date,
        start_time,
        service.duration_minutes,
        excludeAppointmentId
      );

      if (conflictCheck.hasConflict) {
        return {
          isValid: false,
          error: `השעה תפוסה - יש חפיפה עם תור קיים ב-${conflictCheck.conflictingTime}`
        };
      }

      return { isValid: true };

    } catch (error) {
      console.error('Error validating time slot:', error);
      return { isValid: false, error: 'שגיאה בבדיקת זמינות' };
    }
  }

  /**
   * Get available time slots for a specific date and service
   */
  static async getAvailableSlots(businessId: string, serviceId: string, date: string): Promise<string[]> {
    try {
      const [service, availability, existingAppointments] = await Promise.all([
        this.getServiceInfo(serviceId, businessId),
        this.getBusinessAvailability(businessId),
        this.getExistingAppointments(businessId, date)
      ]);

      if (!service) return [];

      const appointmentDate = new Date(date);
      const dayOfWeek = appointmentDate.getDay();

      // Filter availability for this day
      const dayAvailability = availability.filter(slot =>
        slot.day_of_week === dayOfWeek && slot.is_active
      );

      if (dayAvailability.length === 0) return [];

      // Generate all possible slots
      const allSlots: string[] = [];

      for (const slot of dayAvailability) {
        const startTime = new Date(`2000-01-01T${slot.start_time}`);
        const endTime = new Date(`2000-01-01T${slot.end_time}`);

        let currentTime = new Date(startTime);

        while (currentTime < endTime) {
          const timeString = currentTime.toTimeString().slice(0, 5);

          // Check if this slot would fit the service duration
          const slotEndTime = new Date(currentTime);
          slotEndTime.setMinutes(slotEndTime.getMinutes() + service.duration_minutes);

          if (slotEndTime <= endTime) {
            allSlots.push(timeString);
          }

          // Move to next 15-minute slot
          currentTime.setMinutes(currentTime.getMinutes() + 15);
        }
      }

      // Filter out conflicting slots
      const availableSlots = allSlots.filter(slot => {
        const conflict = this.checkTimeConflictSync(
          slot,
          service.duration_minutes,
          existingAppointments
        );
        return !conflict.hasConflict;
      });

      return availableSlots;

    } catch (error) {
      console.error('Error getting available slots:', error);
      return [];
    }
  }

  /**
   * Check if business is available on a specific date (not blocked)
   */
  static async checkUnavailableDate(businessId: string, date: string): Promise<AvailabilityCheckResult> {
    try {
      const { data: unavailableDates } = await supabasePublic
        .from('unavailable_dates')
        .select('date')
        .eq('business_id', businessId)
        .eq('date', date);

      if (unavailableDates && unavailableDates.length > 0) {
        return { isValid: false, error: 'התאריך לא זמין לקביעת תורים' };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error checking unavailable date:', error);
      return { isValid: false, error: 'שגיאה בבדיקת זמינות תאריך' };
    }
  }

  // Private helper methods
  private static async getBusinessInfo(businessId: string) {
    const { data } = await supabasePublic
      .from('businesses')
      .select('id, is_active, user_id')
      .eq('id', businessId)
      .single();
    return data;
  }

  private static async getServiceInfo(serviceId: string, businessId: string) {
    const { data } = await supabasePublic
      .from('services')
      .select('id, name, duration_minutes, is_active')
      .eq('id', serviceId)
      .eq('business_id', businessId)
      .single();
    return data;
  }

  private static async getBusinessAvailability(businessId: string): Promise<Availability[]> {
    const { data } = await supabasePublic
      .from('availability')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true);
    return (data || []).map(appointment => ({
      ...appointment,
      services: appointment.services ? appointment.services[0] : undefined
    }));
  }

private static async getExistingAppointments(businessId: string, date: string): Promise<AppointmentWithService[]> {
  try {
    console.log('🔍 Fetching existing appointments:', { businessId, date });
    
    // ✅ נשתמש ישירות ב-service role client (בטוח כי זה לוגיקה פנימית)
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data, error } = await supabaseServer
      .from('appointments')
      .select(`
        id, start_time, end_time, status,
        services!inner(duration_minutes, name)
      `)
      .eq('business_id', businessId)
      .eq('date', date)
      .in('status', ['pending', 'confirmed']); // ✅ כולל גם pending

    console.log('📋 Found existing appointments:', {
      count: data?.length || 0,
      appointments: data,
      error
    });

    if (error) {
      console.error('❌ Error fetching appointments:', error);
      return [];
    }

    return (data || []).map(appointment => ({
      ...appointment,
      services: appointment.services ? 
        (Array.isArray(appointment.services) ? appointment.services[0] : appointment.services)
        : undefined
    }));
    
  } catch (error) {
    console.error('❌ Unexpected error in getExistingAppointments:', error);
    return [];
  }
}

private static async checkBusinessAvailability(businessId: string, dayOfWeek: number, time: string): Promise<AvailabilityCheckResult> {
  try {
    console.log('🏢 Checking business availability:', { businessId, dayOfWeek, time });

    // וודא שהפרמטרים תקינים
    if (!time || typeof time !== 'string') {
      console.error('❌ Invalid time parameter:', time);
      return { isValid: false, error: 'זמן לא תקין' };
    }

    const { data: availability, error } = await supabasePublic
      .from('availability')
      .select('start_time, end_time')
      .eq('business_id', businessId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (error) {
      console.error('❌ Error fetching availability:', error);
      return { isValid: false, error: 'שגיאה בבדיקת זמינות עסק' };
    }

    if (!availability || availability.length === 0) {
      console.log('⚠️ No availability found for:', { businessId, dayOfWeek });
      return { isValid: false, error: 'העסק לא זמין ביום זה' };
    }

    console.log('📋 Availability slots found:', availability);

    const normalizedTime = timeUtils.normalizeTime(time);
    console.log('⏰ Normalized time:', normalizedTime);

    // בדיקת זמינות עם לוג מפורט
    const isTimeAvailable = availability.some(slot => {
      if (!slot.start_time || !slot.end_time) {
        console.warn('⚠️ Invalid slot found (missing times):', slot);
        return false;
      }

      console.log('🔍 Checking slot:', {
        slot_start: slot.start_time,
        slot_end: slot.end_time,
        requested_time: normalizedTime
      });

      try {
        // ✅ הקריאה הנכונה עם TimeSlot object
        const result = timeUtils.isTimeInSlot(normalizedTime, {
          start_time: timeUtils.normalizeTime(slot.start_time),
          end_time: timeUtils.normalizeTime(slot.end_time)
        });

        console.log('🔍 Slot check result:', {
          requested: normalizedTime,
          slot: `${slot.start_time}-${slot.end_time}`,
          result
        });

        return result;
      } catch (error) {
        console.error('❌ Error checking if time in slot:', error);
        return false;
      }
    });

    console.log('🏢 Final availability check result:', isTimeAvailable);

    if (!isTimeAvailable) {
      return { 
        isValid: false, 
        error: `השעה ${normalizedTime} לא זמינה ביום זה` 
      };
    }

    console.log('✅ Time is within business hours');
    return { isValid: true };

  } catch (error) {
    console.error('❌ Error in checkBusinessAvailability:', error);
    return { isValid: false, error: 'שגיאה בבדיקת זמינות עסק' };
  }
}

  private static async checkAppointmentConflicts(
    businessId: string,
    date: string,
    start_time: string, // ✅ שונה מ-time
    duration: number,
    excludeId?: string
  ): Promise<TimeSlotConflict> {
    const existingAppointments = await this.getExistingAppointments(businessId, date);

    // Filter out the appointment being edited
    const relevantAppointments = excludeId
      ? existingAppointments.filter(apt => apt.id !== excludeId)
      : existingAppointments;

    // Check for conflicts
    for (const existingApt of relevantAppointments) {
      const hasConflict = timeUtils.hasTimeOverlap(
        start_time,
        timeUtils.minutesToTime(timeUtils.timeToMinutes(start_time) + duration),
        existingApt.start_time, // ✅ שונה מ-time
        existingApt.end_time
      );

      if (hasConflict) {
        return {
          hasConflict: true,
          conflictingTime: existingApt.start_time, // ✅
          conflictingService: existingApt.services?.name
        };
      }
    }

    return { hasConflict: false };
  }

  private static checkTimeConflictSync(
    start_time: string,
    duration: number,
    existingAppointments: AppointmentWithService[]
  ): TimeSlotConflict {
    const normalizedTime = timeUtils.normalizeTime(start_time);

    for (const apt of existingAppointments) {
      const hasConflict = timeUtils.hasTimeConflict(
        normalizedTime,
        duration,
        timeUtils.normalizeTime(apt.start_time),
        apt.services?.duration_minutes || 60
      );

      if (hasConflict) {
        return {
          hasConflict: true,
          conflictingTime: apt.start_time,
          conflictingService: apt.services?.name
        };
      }
    }

    return { hasConflict: false };
  }
}

// ===================================
// 🏢 Business Owner Specific Validation
// ===================================

/**
 * מחלקה מיוחדת לבעלי עסק - בדיקות מותאמות בלי הגבלות זמינות
 * בעל העסק יכול לקבוע תורים גם מחוץ לשעות העבודה הרגילות
 */
export class BusinessOwnerValidator {

  /**
   * בדיקת חפיפות תורים לבעל עסק (בלי בדיקת זמינות עסק)
   * רק בדיקות בסיסיות + חפיפות זמנים
   */
  static async checkConflictsForOwner(options: {
    businessId: string;
    serviceId?: string;
    date: string;
    start_time: string;
    durationMinutes?: number;
    excludeAppointmentId?: string;
  }): Promise<{
    hasConflict: boolean;
    error?: string;
    conflictingAppointment?: any;
  }> {
    const { businessId, serviceId, date, start_time, durationMinutes, excludeAppointmentId } = options;

    try {
      // 1. בדיקות בסיסיות לתאריך ושעה
      const basicValidation = this.validateBasicTimeConstraints(date, start_time);
      if (!basicValidation.isValid) {
        return {
          hasConflict: true,
          error: basicValidation.error
        };
      }

      let serviceDuration: number;

      if (options.durationMinutes) {
        // אם העברו duration ישירות - השתמש בזה
        serviceDuration = options.durationMinutes;
      } else if (options.serviceId) {
        // אם יש service_id - שלוף מהשירות
        const service = await this.getServiceDetails(options.serviceId, options.businessId);
        if (!service) {
          return { hasConflict: true, error: 'שירות לא נמצא' };
        }
        serviceDuration = service.duration_minutes;
      } else {
        return { hasConflict: true, error: 'חסר מידע על משך התור' };
      }

      // 3. בדיקת חפיפות עם תורים קיימים - ✅ שימוש בפונקציה החדשה
      const existingAppointments = await this.getExistingAppointmentsForDate(businessId, date);
      console.log('🔍 Active appointments found:', existingAppointments.length);
      console.log('🔍 Appointments details:', existingAppointments);

      // סנן תורים פעילים ולא כולל את התור הנוכחי
      const activeAppointments = existingAppointments.filter((apt: any) =>
        ['pending', 'confirmed'].includes(apt.status) &&
        apt.id !== excludeAppointmentId
      );

      console.log('🔍 Active appointments after filtering:', activeAppointments.length);

      // בדיקת חפיפות עם כל תור קיים
      for (const existingApt of activeAppointments) {
        // חישוב end_time של התור החדש
        const newEndTime = timeUtils.minutesToTime(
          timeUtils.timeToMinutes(start_time) + serviceDuration
        );

        const hasConflict = timeUtils.hasTimeOverlap(
          start_time,              // start_time של התור החדש
          newEndTime,              // end_time של התור החדש
          existingApt.start_time,  // start_time של התור הקיים
          existingApt.end_time     // end_time של התור הקיים
        );

        console.log('🔍 OVERLAP TEST:', {
          newRange: `${start_time}-${newEndTime}`,
          existingRange: `${existingApt.start_time}-${existingApt.end_time}`,
          result: hasConflict
        });

        // console.log('🔍 Checking conflict:', {
        //   new: `${start_time}-${newEndTime}`,
        //   existing: `${existingApt.start_time}-${existingApt.end_time}`,
        //   hasConflict
        // });

        if (hasConflict) {
          return {
            hasConflict: true,
            error: `יש חפיפה עם תור קיים (${existingApt.start_time}-${existingApt.end_time})`,
            conflictingAppointment: existingApt
          };
        }
      }

      console.log('✅ No conflicts found for business owner');
      return { hasConflict: false };

    } catch (error) {
      console.error('Error in BusinessOwnerValidator:', error);
      return {
        hasConflict: true,
        error: 'שגיאה בבדיקת חפיפות'
      };
    }
  }

  /**
   * קבלת פרטי שירות (פונקציה עצמאית)
   */
  private static async getServiceDetails(serviceId: string, businessId: string) {
    const { data } = await supabasePublic
      .from('services')
      .select('id, name, duration_minutes, is_active')
      .eq('id', serviceId)
      .eq('business_id', businessId)
      .single();
    return data;
  }

  /**
   * קבלת תורים קיימים (פונקציה עצמאית)
   */
  private static async getExistingAppointmentsForDate(businessId: string, date: string) {
    const { data, error } = await supabasePublic
      .from('public_appointments_with_services') // ✅ View public
      .select('id, start_time, end_time, status, duration_minutes')
      .eq('business_id', businessId)
      .eq('date', date)
      .in('status', ['pending', 'confirmed']);

    console.log('🔍 Using public view result:', { data, error });

    if (error) {
      console.error('❌ Error fetching appointments:', error);
      return [];
    }

    return (data || []).map(apt => ({
      ...apt,
      start_time: timeUtils.normalizeTime(apt.start_time),
      end_time: timeUtils.normalizeTime(apt.end_time)
    }));
  }

  /**
   * בדיקות בסיסיות של תאריך ושעה (בלי זמינות עסק)
   */
  private static validateBasicTimeConstraints(date: string, time: string): {
    isValid: boolean;
    error?: string;
  } {
    try {
      const appointmentDate = new Date(date);

      // בדיקה שהתאריך לא בעבר
      if (timeUtils.isPastDate(appointmentDate)) {
        return {
          isValid: false,
          error: 'לא ניתן לקבוע תור בעבר'
        };
      }

      // בדיקה שהזמן לא בעבר (אם זה היום)
      if (timeUtils.isPastTime(time, appointmentDate)) {
        return {
          isValid: false,
          error: 'לא ניתן לקבוע תור בזמן שעבר'
        };
      }

      return { isValid: true };

    } catch (error) {
      console.error('Error validating basic time constraints:', error);
      return {
        isValid: false,
        error: 'תאריך או שעה לא תקינים'
      };
    }
  }

  /**
   * בדיקת חפיפות עם רשימת תורים קיימת (לשימוש מקומי)
   * שימושי כשכבר יש רשימת תורים בזיכרון ואין צורך בקריאה נוספת לשרת
   */
  static checkConflictsWithExistingAppointments(
    newAppointment: {
      time: string;
      duration_minutes: number;
    },
    existingAppointments: Array<{
      id: string;
      time: string;
      duration_minutes?: number;
      status: string;
    }>,
    excludeAppointmentId?: string
  ): {
    hasConflict: boolean;
    conflictingAppointment?: any;
  } {
    try {
      // סנן רק תורים פעילים ולא כולל את התור הנוכחי
      const activeAppointments = existingAppointments.filter(apt =>
        ['pending', 'confirmed'].includes(apt.status) &&
        apt.id !== excludeAppointmentId
      );

      console.log('🔍 Checking conflicts with existing appointments:', {
        newTime: newAppointment.time,
        newDuration: newAppointment.duration_minutes,
        existingCount: activeAppointments.length
      });

      for (const existingApt of activeAppointments) {
        const existingDuration = existingApt.duration_minutes || 60; // ברירת מחדל

        const hasConflict = timeUtils.hasTimeConflict(
          newAppointment.time,
          newAppointment.duration_minutes,
          existingApt.time,
          existingDuration
        );

        if (hasConflict) {
          console.log('⚠️ Conflict found with existing appointment:', {
            existingId: existingApt.id,
            existingTime: existingApt.time,
            existingDuration
          });

          return {
            hasConflict: true,
            conflictingAppointment: existingApt
          };
        }
      }

      console.log('✅ No conflicts with existing appointments');
      return { hasConflict: false };

    } catch (error) {
      console.error('Error checking conflicts with existing appointments:', error);
      return { hasConflict: true };
    }
  }

  /**
   * בדיקה אם תור ניתן לעריכה (לא עבר ויש מרווח זמן מתאים)
   */
  static isAppointmentEditable(appointment: {
    date: string;
    time: string;
  }, marginHours: number = 1): boolean {
    try {
      const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
      const now = new Date();

      // הוסף margin לפני התור
      const marginTime = new Date(appointmentDateTime.getTime() - (marginHours * 60 * 60 * 1000));

      return now < marginTime;
    } catch (error) {
      console.error('Error checking if appointment is editable:', error);
      return false;
    }
  }

  /**
   * חישוב זמן סיום תור
   */
  static calculateAppointmentEndTime(startTime: string, durationMinutes: number): string {
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + durationMinutes;
      const endHours = Math.floor(totalMinutes / 60);
      const endMins = totalMinutes % 60;

      return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error calculating end time:', error);
      return startTime; // החזר את זמן ההתחלה במקרה של שגיאה
    }
  }

  /**
   * בדיקה אם תור חדש מתחיל אחרי תור קיים
   */
  static isAppointmentAfter(
    newAppointmentTime: string,
    existingAppointmentTime: string,
    existingDurationMinutes: number
  ): boolean {
    try {
      const existingEndTime = this.calculateAppointmentEndTime(
        existingAppointmentTime,
        existingDurationMinutes
      );

      const newStartMinutes = timeUtils.timeToMinutes(newAppointmentTime);
      const existingEndMinutes = timeUtils.timeToMinutes(existingEndTime);

      return newStartMinutes >= existingEndMinutes;
    } catch (error) {
      console.error('Error checking if appointment is after:', error);
      return false;
    }
  }

  /**
   * מציאת השעה הפנויה הקרובה ביותר לשעה המבוקשת
   */
  static async findNearestAvailableSlot(
    businessId: string,
    serviceId: string,
    date: string,
    preferredTime: string,
    searchRangeHours: number = 3
  ): Promise<{
    availableTime?: string;
    found: boolean;
    message: string;
  }> {
    try {
      // ✅ שימוש בפונקציה החדשה
      const service = await this.getServiceDetails(serviceId, businessId);
      if (!service) {
        return {
          found: false,
          message: 'שירות לא נמצא'
        };
      }

      // ✅ שימוש בפונקציה החדשה
      const existingAppointments = await this.getExistingAppointmentsForDate(businessId, date);
      const preferredMinutes = timeUtils.timeToMinutes(preferredTime);

      // שאר הלוגיקה נשארת זהה...
      for (let offset = 0; offset <= searchRangeHours * 60; offset += 15) {
        const forwardTime = timeUtils.minutesToTime(preferredMinutes + offset);
        const forwardEndTime = timeUtils.minutesToTime(preferredMinutes + offset + service.duration_minutes);

        if (forwardTime && !this.hasConflictAtTime(forwardTime, forwardEndTime, existingAppointments)) {
          return {
            availableTime: forwardTime,
            found: true,
            message: `השעה ${preferredTime} תפוסה, אבל ${forwardTime} פנוי`
          };
        }

        if (offset > 0) {
          const backwardTime = timeUtils.minutesToTime(preferredMinutes - offset);
          const backwardEndTime = timeUtils.minutesToTime(preferredMinutes - offset + service.duration_minutes);

          if (backwardTime && !this.hasConflictAtTime(backwardTime, backwardEndTime, existingAppointments)) {
            return {
              availableTime: backwardTime,
              found: true,
              message: `השעה ${preferredTime} תפוסה, אבל ${backwardTime} פנוי`
            };
          }
        }
      }

      return {
        found: false,
        message: `לא נמצא זמן פנוי בטווח של ${searchRangeHours} שעות מ-${preferredTime}`
      };

    } catch (error) {
      console.error('Error finding nearest available slot:', error);
      return {
        found: false,
        message: 'שגיאה בחיפוש זמן פנוי'
      };
    }
  }

  /**
   * בדיקה אם יש חפיפה בשעה ספציפית
   */
  private static hasConflictAtTime(
    start_time: string,
    end_time: string,
    existingAppointments: Array<{ start_time: string; end_time: string; status: string }>
  ): boolean {
    const activeAppointments = existingAppointments.filter(apt =>
      ['pending', 'confirmed'].includes(apt.status)
    );

    return activeAppointments.some(apt => {
      return timeUtils.hasTimeOverlap(
        start_time,
        end_time,
        apt.start_time,
        apt.end_time
      );
    });
  }
}

// ===================================
// 🎯 Helper functions for easier usage
// ===================================

/**
 * פונקציה מקוצרת לבדיקת חפיפות לבעל עסק
 */
export const checkBusinessOwnerConflicts = (
  businessId: string,
  serviceId: string,
  date: string,
  start_time: string,
  end_time?: string,
  excludeAppointmentId?: string
) => {
  return BusinessOwnerValidator.checkConflictsForOwner({
    businessId,
    serviceId,
    date,
    start_time,
    durationMinutes: end_time ? timeUtils.timeToMinutes(end_time) - timeUtils.timeToMinutes(start_time) : undefined,
    excludeAppointmentId
  });
};

// /**
//  * פונקציה מקוצרת לבדיקה מהירה
//  */
// export const hasQuickConflict = (
//   businessId: string,
//   serviceId: string,
//   date: string,
//   time: string,
//   excludeAppointmentId?: string
// ) => {
//   return BusinessOwnerValidator.quickConflictCheck(
//     businessId,
//     serviceId,
//     date,
//     time,
//     excludeAppointmentId
//   );
// };

/**
 * פונקציה לבדיקת עריכה של תור
 */
export const isAppointmentEditable = (
  appointment: { date: string; time: string },
  marginHours = 1
) => {
  return BusinessOwnerValidator.isAppointmentEditable(appointment, marginHours);
};