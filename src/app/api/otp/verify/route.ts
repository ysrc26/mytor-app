// src/app/api/otp/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const body = await request.json();
    
    const { phone, code } = body;

    // ולידציה
    if (!phone || !code) {
      return NextResponse.json(
        { error: 'חסרים פרטים נדרשים' },
        { status: 400 }
      );
    }

    // בדיקה שהקוד הוא 4 ספרות
    if (!/^\d{4}$/.test(code)) {
      return NextResponse.json(
        { error: 'קוד לא תקין' },
        { status: 400 }
      );
    }

    // חיפוש הקוד האחרון שנשלח לטלפון הזה
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone', phone)
      .eq('otp_code', code)
      .eq('verified', false)
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return NextResponse.json(
        { error: 'קוד שגוי או פג תוקף' },
        { status: 400 }
      );
    }

    // סימון הקוד כמאומת
    const { error: updateError } = await supabase
      .from('otp_verifications')
      .update({ verified: true })
      .eq('id', otpRecord.id);

    if (updateError) {
      console.error('Error updating OTP:', updateError);
      return NextResponse.json(
        { error: 'שגיאה באימות הקוד' },
        { status: 500 }
      );
    }

    // מחיקת קודים ישנים לטלפון הזה (ניקיון)
    await supabase
      .from('otp_verifications')
      .delete()
      .eq('phone', phone)
      .neq('id', otpRecord.id);

    return NextResponse.json({
      verified: true,
      message: 'הטלפון אומת בהצלחה'
    });

  } catch (error) {
    console.error('Error in OTP verify:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}