// src/lib/types.ts
export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  profile_pic?: string;
  created_at: string;
}

export interface Business {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  address: string;
  slug: string;
  description?: string;
  profile_pic?: string;
  terms?: string;
  payment_link?: string;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  price?: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  business_id: string; // שונה מuser_id
  client_name: string;
  client_phone: string;
  client_verified: boolean;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled';
  note?: string;
  created_at: string;
}

export interface Availability {
  id: string;
  business_id: string; // שונה מuser_id
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface UnavailableDate {
  id: string;
  user_id: string;
  date: string;
}

export interface OTPVerification {
  id: string;
  phone: string;
  otp_code: string;
  verified: boolean;
  method: 'sms' | 'call';
  created_at: string;
}