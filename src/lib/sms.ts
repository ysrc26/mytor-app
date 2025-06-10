// src/lib/sms.ts
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendOTPSMS(phone: string, otpCode: string) {
  try {
    // Convert Israeli phone format (05xxxxxxxx) to international (+972)
    const internationalPhone = phone.replace(/^05/, '+9725');
    
    const message = await client.messages.create({
      body: `קוד האימות שלך ב-MyTor: ${otpCode}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: internationalPhone
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error };
  }
}

export async function makeOTPCall(phone: string, otpCode: string) {
  try {
    const internationalPhone = phone.replace(/^05/, '+9725');
    
    // Create TwiML for voice call
    const twiml = `
      <Response>
        <Say voice="alice" language="he-IL">
          קוד האימות שלך ב-מיי טור הוא: ${otpCode.split('').join(', ')}
        </Say>
        <Pause length="2"/>
        <Say voice="alice" language="he-IL">
          אחזור: ${otpCode.split('').join(', ')}
        </Say>
      </Response>
    `;

    const call = await client.calls.create({
      twiml,
      to: internationalPhone,
      from: process.env.TWILIO_PHONE_NUMBER || (() => { throw new Error('TWILIO_PHONE_NUMBER is not defined'); })()
    });

    return { success: true, callId: call.sid };
  } catch (error) {
    console.error('Voice call error:', error);
    return { success: false, error };
  }
}