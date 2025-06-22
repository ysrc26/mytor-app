// src/lib/api-auth.ts
import { NextRequest } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase-server';
import { createClient as createClientSupabase } from '@/lib/supabase-client';
import { supabasePublic } from '@/lib/supabase-public';

export interface AuthResult {
  user: any;
  error?: string;
}

export interface BusinessOwnershipResult {
  isOwner: boolean;
  business?: any;
  error?: string;
}

/**
 * מחזיר את הקליינט הרלוונטי לפי סוג החיבור
 */
export function getSupabaseClient(access: 'server' | 'client' | 'public') {
  if (access === 'server') {
    return createServerSupabase();
  } else if (access === 'client') {
    return createClientSupabase();
  } else {
    return supabasePublic;
  }
}

/**
 * Authenticate the request and return user data
 * Returns { user, error } where user is null if not authenticated
 */
export async function authenticateRequest(): Promise<AuthResult> {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: 'לא מחובר' };
  }

  return { user };
}


/**
 * Check if user owns a specific business and return business data
 */
export async function validateBusinessOwnership(userId: string, businessId: string):
  Promise<BusinessOwnershipResult> {
  try {
    const supabase = await createServerSupabase();
    const { data: business, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();

    if (error || !business) {
      return {
        isOwner: false,
        error: 'עסק לא נמצא או שאינך הבעלים'
      };
    }

    return { isOwner: true, business };
  } catch (error) {
    console.error('Business ownership validation error:', error);
    return {
      isOwner: false,
      error: 'שגיאה בבדיקת הרשאות'
    };
  }
}


/**
 * Combined authentication and business ownership check
 * ✅ FIXED: Now properly uses authenticated client throughout
 */
export async function authenticateBusinessRequest( businessId: string): Promise<{
  user: any;
  business: any;
  error?: string;
}> {
  const auth = await authenticateRequest();
  if (!auth.user) {
    return { user: null, business: null, error: auth.error };
  }

  const ownership = await validateBusinessOwnership(auth.user.id, businessId);
  if (!ownership.isOwner) {
    return { user: null, business: null, error: ownership.error };
  }

  return { user: auth.user, business: ownership.business };
}

/**
 * Validate appointment ownership (either direct user or through business)
 */
export async function validateAppointmentOwnership(userId: string, appointmentId: string): Promise<{
  isOwner: boolean;
  appointment?: any;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();
    // Get appointment with business info
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        businesses!inner(user_id, name)
      `)
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      return {
        isOwner: false,
        error: 'תור לא נמצא'
      };
    }

    // Check if user owns the business that the appointment belongs to
    const isOwner = appointment.businesses.user_id === userId;

    if (!isOwner) {
      return {
        isOwner: false,
        error: 'אין הרשאה לתור זה'
      };
    }

    return { isOwner: true, appointment };
  } catch (error) {
    console.error('Appointment ownership validation error:', error);
    return {
      isOwner: false,
      error: 'שגיאה בבדיקת הרשאות'
    };
  }
}

/**
 * Rate limiting helper - can be moved to separate file if needed
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    // First request or window has passed
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false; // Rate limit exceeded
  }

  record.count++;
  return true;
}

/**
 * Clean up expired rate limit entries (should be called periodically)
 */
export function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Phone number validation for Israeli numbers
 */
export function validateIsraeliPhone(phone: string): boolean {
  // Israeli mobile: 05X-XXXXXXX (10 digits total)
  const mobileRegex = /^05\d{8}$/;
  // Israeli landline: 0X-XXXXXXX or 0XX-XXXXXXX (9-10 digits total)
  const landlineRegex = /^0[2-9]\d{7,8}$/;

  return mobileRegex.test(phone) || landlineRegex.test(phone);
}

/**
 * OTP verification check - used in public booking APIs
 */
export async function verifyPhoneOTP(phone: string, maxAgeMinutes: number = 5): Promise<{
  isVerified: boolean;
  error?: string;
}> {
  try {
    const maxAge = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();

    const { data: otpRecord, error } = await supabasePublic
      .from('otp_verifications')
      .select('*')
      .eq('phone', phone)
      .eq('verified', true)
      .gte('created_at', maxAge)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('OTP verification check error:', error);
      return { isVerified: false, error: 'שגיאה בבדיקת אימות טלפון' };
    }

    if (!otpRecord) {
      return { isVerified: false, error: 'נדרש אימות טלפון' };
    }

    return { isVerified: true };
  } catch (error) {
    console.error('Phone OTP verification error:', error);
    return { isVerified: false, error: 'שגיאה בבדיקת אימות טלפון' };
  }
}