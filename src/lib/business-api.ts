// src/lib/business-api.ts
import type { Business, Service, Appointment, Availability } from '@/lib/types';

/**
 * API client class לניהול כל הקריאות הקשורות לעסק
 * מרכז את כל ה-API calls במקום אחד ומספק interface נקי
 */
export class BusinessAPI {
  constructor(private businessId: string) {}

  /**
   * טעינת פרטי העסק
   */
  async fetchBusiness(): Promise<Business> {
    const response = await fetch(`/api/businesses/${this.businessId}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new BusinessNotFoundError('עסק לא נמצא');
      }
      throw new APIError('שגיאה בטעינת פרטי העסק');
    }
    return response.json();
  }

  /**
   * טעינת רשימת שירותים
   */
  async fetchServices(): Promise<Service[]> {
    const response = await fetch(`/api/businesses/${this.businessId}/services`);
    if (!response.ok) {
      throw new APIError('שגיאה בטעינת שירותים');
    }
    return response.json();
  }

  /**
   * טעינת תורים עם פילטרים אופציונליים
   */
  async fetchAppointments(filters?: {
    date?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Appointment[]> {
    const params = new URLSearchParams();
    if (filters?.date) params.set('date', filters.date);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());

    const url = `/api/businesses/${this.businessId}/appointments${
      params.toString() ? '?' + params.toString() : ''
    }`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new APIError('שגיאה בטעינת תורים');
    }
    return response.json();
  }

  /**
   * טעינת זמינות העסק
   */
  async fetchAvailability(): Promise<Availability[]> {
    const response = await fetch(`/api/businesses/${this.businessId}/availability`);
    if (!response.ok) {
      throw new APIError('שגיאה בטעינת זמינות');
    }
    return response.json();
  }

  /**
   * עדכון סטטוס תור
   */
  async updateAppointmentStatus(
    appointmentId: string, 
    status: 'confirmed' | 'declined' | 'cancelled'
  ): Promise<Appointment> {
    const response = await fetch(`/api/appointments/${appointmentId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new APIError(errorData.error || 'שגיאה בעדכון סטטוס התור');
    }
    return response.json();
  }

  /**
   * מחיקת תור
   */
  async deleteAppointment(appointmentId: string): Promise<void> {
    const response = await fetch(`/api/appointments/${appointmentId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new APIError(errorData.error || 'שגיאה במחיקת התור');
    }
  }

  /**
   * עדכון תור (תאריך, שעה, שירות)
   */
  async updateAppointment(appointmentId: string, data: {
    date?: string;
    time?: string;
    service_id?: string;
  }): Promise<Appointment> {
    const response = await fetch(`/api/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new APIError(errorData.error || 'שגיאה בעדכון התור');
    }
    return response.json();
  }

  /**
   * יצירת תור חדש (לבעל העסק)
   */
  async createAppointment(data: {
    client_name: string;
    client_phone: string;
    service_id?: string;
    custom_service_name?: string;
    duration_minutes?: number;
    date: string;
    time: string;
    note?: string;
    status?: 'pending' | 'confirmed';
  }): Promise<Appointment> {
    const response = await fetch(`/api/businesses/${this.businessId}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new APIError(errorData.error || 'שגיאה ביצירת התור');
    }
    return response.json();
  }

  /**
   * עדכון פרטי העסק (כולל תמונות)
   */
  async updateBusiness(data: Partial<Business>): Promise<Business> {
    const response = await fetch(`/api/businesses/${this.businessId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new APIError(errorData.error || 'שגיאה בעדכון העסק');
    }
    return response.json();
  }

  /**
   * הוספת שירות חדש
   */
  async addService(data: {
    name: string;
    description?: string;
    price?: number;
    duration_minutes: number;
  }): Promise<Service> {
    const response = await fetch(`/api/businesses/${this.businessId}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new APIError(errorData.error || 'שגיאה בהוספת שירות');
    }
    return response.json();
  }

  /**
   * מחיקת שירות
   */
  async deleteService(serviceId: string): Promise<void> {
    const response = await fetch(`/api/businesses/${this.businessId}/services/${serviceId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new APIError(errorData.error || 'שגיאה במחיקת שירות');
    }
  }

  /**
   * הוספת זמינות חדשה
   */
  async addAvailability(data: {
    day_of_week: number;
    start_time: string;
    end_time: string;
  }): Promise<Availability> {
    const response = await fetch(`/api/businesses/${this.businessId}/availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new APIError(errorData.error || 'שגיאה בהוספת זמינות');
    }
    return response.json();
  }

  /**
   * מחיקת זמינות
   */
  async deleteAvailability(availabilityId: string): Promise<void> {
    const response = await fetch(`/api/businesses/${this.businessId}/availability/${availabilityId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new APIError(errorData.error || 'שגיאה במחיקת זמינות');
    }
  }
}

/**
 * Custom error classes לטיפול מובחן בשגיאות
 */
export class APIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'APIError';
  }
}

export class BusinessNotFoundError extends APIError {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessNotFoundError';
  }
}

/**
 * Helper function ליצירת instance של BusinessAPI
 */
export const createBusinessAPI = (businessId: string) => new BusinessAPI(businessId);