// src/lib/appointment-utils.ts
import { supabasePublic } from '@/lib/supabase-public';
import { timeUtils } from '@/lib/time-utils';
import { Appointment, Availability, Service } from '@/lib/types';

// Extended types for appointment logic (no changes to original types.ts)
export interface AppointmentValidationOptions {
  businessId: string;
  serviceId: string;
  date: string;
  time: string;
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
  time: string;
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
    const { businessId, serviceId, date, time, excludeAppointmentId } = options;

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

      if (timeUtils.isPastTime(time, appointmentDate)) {
        return { isValid: false, error: 'לא ניתן לקבוע תור בזמן שעבר' };
      }

      // 3. Check business availability for this day
      const dayOfWeek = appointmentDate.getDay();
      const availabilityCheck = await this.checkBusinessAvailability(businessId, dayOfWeek, time);
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
        time, 
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
    const { data } = await supabasePublic
      .from('appointments')
      .select(`
        id, time, status,
        services!inner(duration_minutes, name)
      `)
      .eq('business_id', businessId)
      .eq('date', date)
      .in('status', ['pending', 'confirmed']);
    return (data || []).map(appointment => ({
      ...appointment,
      services: appointment.services ? appointment.services[0] : undefined
    }));
  }

  private static async checkBusinessAvailability(businessId: string, dayOfWeek: number, time: string): Promise<AvailabilityCheckResult> {
    const { data: availability } = await supabasePublic
      .from('availability')
      .select('start_time, end_time')
      .eq('business_id', businessId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (!availability || availability.length === 0) {
      return { isValid: false, error: 'העסק לא זמין ביום זה' };
    }

    const normalizedTime = timeUtils.normalizeTime(time);
    const isTimeAvailable = availability.some(slot => 
      timeUtils.isTimeInSlot(normalizedTime, {
        start_time: timeUtils.normalizeTime(slot.start_time),
        end_time: timeUtils.normalizeTime(slot.end_time)
      })
    );

    if (!isTimeAvailable) {
      return { isValid: false, error: 'השעה שנבחרה לא זמינה' };
    }

    return { isValid: true };
  }

  private static async checkAppointmentConflicts(
    businessId: string, 
    date: string, 
    time: string, 
    duration: number,
    excludeId?: string
  ): Promise<TimeSlotConflict> {
    const existingAppointments = await this.getExistingAppointments(businessId, date);
    
    // Filter out the appointment being edited
    const relevantAppointments = excludeId 
      ? existingAppointments.filter(apt => apt.id !== excludeId)
      : existingAppointments;

    return this.checkTimeConflictSync(time, duration, relevantAppointments);
  }

  private static checkTimeConflictSync(
    time: string, 
    duration: number, 
    existingAppointments: AppointmentWithService[]
  ): TimeSlotConflict {
    const normalizedTime = timeUtils.normalizeTime(time);
    
    for (const apt of existingAppointments) {
      const hasConflict = timeUtils.hasTimeConflict(
        normalizedTime,
        duration,
        timeUtils.normalizeTime(apt.time),
        apt.services?.duration_minutes || 60
      );
      
      if (hasConflict) {
        return {
          hasConflict: true,
          conflictingTime: apt.time,
          conflictingService: apt.services?.name
        };
      }
    }
    
    return { hasConflict: false };
  }
}