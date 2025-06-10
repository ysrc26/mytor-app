// src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAppointmentNotification(
  businessOwnerEmail: string,
  appointmentDetails: {
    clientName: string;
    clientPhone: string;
    date: string;
    time: string;
    businessName: string;
  }
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'MyTor <noreply@mytor.app>',
      to: [businessOwnerEmail],
      subject: 'בקשת תור חדשה - MyTor',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">קיבלת בקשת תור חדשה!</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>פרטי הבקשה:</h3>
            <p><strong>שם הלקוח:</strong> ${appointmentDetails.clientName}</p>
            <p><strong>טלפון:</strong> ${appointmentDetails.clientPhone}</p>
            <p><strong>תאריך:</strong> ${appointmentDetails.date}</p>
            <p><strong>שעה:</strong> ${appointmentDetails.time}</p>
          </div>
          
          <p>היכנס לדשבורד שלך כדי לאשר או לדחות את הבקשה:</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0;">
            עבור לדשבורד
          </a>
          
          <hr style="margin: 30px 0;">
          <p style="color: #64748b; font-size: 14px;">
            MyTor - מערכת תורים לעצמאים
          </p>
        </div>
      `
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error };
  }
}

export async function sendAppointmentStatusUpdate(
  clientPhone: string,
  status: 'confirmed' | 'declined',
  appointmentDetails: {
    businessName: string;
    date: string;
    time: string;
  }
) {
  // For now, this would just log - in production you'd integrate with SMS service
  const message = status === 'confirmed' 
    ? `התור שלך אצל ${appointmentDetails.businessName} ב-${appointmentDetails.date} ${appointmentDetails.time} אושר!`
    : `התור שלך אצל ${appointmentDetails.businessName} ב-${appointmentDetails.date} ${appointmentDetails.time} נדחה.`;
    
  console.log(`SMS to ${clientPhone}: ${message}`);
  
  // TODO: Implement actual SMS sending with Twilio
  return { success: true };
}