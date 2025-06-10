// src/app/api/otp/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const body = await request.json();

    const { phone, method = 'sms' } = body;

    // ולידציה של מספר טלפון
    if (!phone) {
      return NextResponse.json(
        { error: 'חסר מספר טלפון' },
        { status: 400 }
      );
    }

    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'מספר טלפון לא תקין' },
        { status: 400 }
      );
    }

    // בדיקת הגבלת זמן (rate limiting) - לא יותר מקוד אחד בדקה
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recentOtp } = await supabase
      .from('otp_verifications')
      .select('created_at')
      .eq('phone', phone)
      .gte('created_at', oneMinuteAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentOtp && recentOtp.length > 0) {
      return NextResponse.json(
        { error: 'יש להמתין דקה לפני בקשת קוד חדש' },
        { status: 429 }
      );
    }

    // יצירת קוד אקראי 4 ספרות
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    // שמירת הקוד בבסיס הנתונים
    const { error: insertError } = await supabase
      .from('otp_verifications')
      .insert({
        phone,
        otp_code: otpCode,
        method,
        verified: false
      });

    if (insertError) {
      console.error('Error saving OTP:', insertError);
      return NextResponse.json(
        { error: 'שגיאה בשמירת קוד האימות' },
        { status: 500 }
      );
    }

    // שליחת הקוד
    if (method === 'sms') {
      await sendSMS(phone, otpCode);
    } else if (method === 'call') {
      await makeVoiceCall(phone, otpCode);
    }

    return NextResponse.json({
      message: 'קוד האימות נשלח בהצלחה',
      method
    });

  } catch (error) {
    console.error('Error in OTP send:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}

// פונקציה לשליחת SMS
async function sendSMS(phone: string, code: string) {
  // TODO: הטמעה עם Twilio או ספק SMS אחר

  const message = `קוד האימות שלך למערכת MyTor הוא: ${code}`;

  // לצורך הדוגמה - לוג בלבד
  console.log(`SMS to ${phone}: ${message}`);

  // דוגמה עם Twilio:
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = require('twilio')(accountSid, authToken);

  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `+972${phone.substring(1)}` // המרה לפורמט בינלאומי
  });
}

// פונקציה לשיחה קולית
async function makeVoiceCall(phone: string, code: string) {
  // TODO: הטמעה עם Twilio Voice

  const message = `שלום, קוד האימות שלך הוא: ${code.split('').join(', ')}. אחזור: ${code.split('').join(', ')}`;

  console.log(`Voice call to ${phone}: ${message}`);

  // דוגמה עם Twilio Voice:

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = require('twilio')(accountSid, authToken);

  await client.calls.create({
    twiml: `<Response><Say language="he-IL">${message}</Say></Response>`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `+972${phone.substring(1)}`
  });
}