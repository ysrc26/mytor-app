// src/lib/types.ts

// ===== Time Management Types =====

export interface TimeSlot {
  start_time: string;
  end_time: string;
}

export interface AppointmentConflict {
  time: string;
  duration_minutes: number;
}

export interface AvailableSlotsResponse {
  date: string;
  service: {
    id: number;
    name: string;
    duration_minutes: number;
  };
  available_slots: string[];
  total_slots: number;
}

// ===== Existing Types =====

export interface BookingService {
  id: number;
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
  is_active: boolean;
}

export interface BookingAvailability {
  id: number;
  day_of_week: number; // 0-6 (ראשון-שבת)
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface BookingAppointment {
  id: number;
  date: string;
  time: string;
  duration_minutes: number;
  service_name?: string;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled';
  client_name?: string;
  client_phone?: string;
}

export interface ClientDetails {
  name: string;
  phone: string;
  note?: string;
}

export interface BusinessInfo {
  id: number;
  name: string;
  description?: string;
  slug: string;
  phone?: string;
  terms?: string;
  is_active: boolean;
}

export type BookingStep = 'service' | 'date' | 'time' | 'details' | 'success';

export interface BookingComponentProps {
  businessSlug: string;
  services: BookingService[];
  availability: BookingAvailability[];
  businessName: string;
  businessInfo?: BusinessInfo;
}

// ===== API Response Types =====

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AppointmentRequestBody {
  slug: string;
  service_id: number;
  client_name: string;
  client_phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  note?: string;
}

export interface AppointmentResponse {
  id: number;
  date: string;
  time: string;
  status: string;
  service_name: string;
  business_name: string;
}

export interface OTPRequest {
  phone: string;
  method: 'sms' | 'call';
}

export interface OTPVerification {
  phone: string;
  code: string;
}

export interface OTPResponse {
  verified: boolean;
  error?: string;
}

// ===== Database Schema Types =====

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  slug: string;
  profile_pic?: string;
  description?: string;
  terms?: string;
  payment_link?: string;
  created_at: string;
}

export interface Business {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  slug: string;
  phone?: string;
  terms?: string;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
  is_active: boolean;
  created_at: string;
}

export interface Availability {
  id: string;
  user_id: string;
  business_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface UnavailableDate {
  id: string;
  business_id: string;
  date: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  business_id: string;
  service_id: string;
  client_name: string;
  client_phone: string;
  client_verified: boolean;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled';
  note?: string;
  created_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  notes?: string;
}

export interface OTPVerificationRecord {
  id: string;
  phone: string;
  otp_code: string;
  verified: boolean;
  method: 'sms' | 'call';
  created_at: string;
}

// ===== Utility Types =====

export interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isAvailable: boolean;
}

export interface TimeValidationResult {
  isValid: boolean;
  error?: string;
  conflictingAppointment?: {
    time: string;
    service_name: string;
  };
}

export interface SlotGenerationOptions {
  serviceDuration: number;
  slotInterval?: number; // ברירת מחדל: 15 דקות
  includeEndTime?: boolean; // ברירת מחדל: false
}

// ===== Form Validation Types =====

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ===== Component State Types =====

export interface BookingFormState {
  step: BookingStep;
  selectedService: BookingService | null;
  selectedDate: Date | null;
  selectedTime: string;
  clientDetails: ClientDetails;
  loading: boolean;
  error: string;
}

export interface CalendarState {
  currentMonth: Date;
  selectedDate: Date | null;
  availableDates: Date[];
  loadingDates: boolean;
}

export interface TimeSlotState {
  availableSlots: string[];
  selectedTime: string;
  loadingSlots: boolean;
  error: string;
}

// ===== Constants =====

export const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
export const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

export const APPOINTMENT_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed', 
  DECLINED: 'declined',
  CANCELLED: 'cancelled'
} as const;

export const DEFAULT_SLOT_INTERVAL = 15; // דקות
export const DEFAULT_SERVICE_DURATION = 60; // דקות
export const OTP_EXPIRY_MINUTES = 5;
export const RESEND_OTP_COOLDOWN = 60; // שניות

// Type guards
export const isValidAppointmentStatus = (status: string): status is keyof typeof APPOINTMENT_STATUSES => {
  return Object.values(APPOINTMENT_STATUSES).includes(status as any);
};

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^05\d{8}$/;
  return phoneRegex.test(phone);
};

export const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

export const isValidDateFormat = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date) && !isNaN(Date.parse(date));
};