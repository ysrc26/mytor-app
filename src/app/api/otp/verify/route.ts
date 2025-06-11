// src/app/api/otp/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabase-public';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limiting - 10 ניסיונות אימות לדקה
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(clientIp, 10, 60000)) {
    return NextResponse.json({ error: 'יותר מדי ניסיונות אימות' }, { status: 429 });
  }

  try {
    const supabase = supabasePublic;
    const body = await request.json();

    const { phone, code } = body;

    // ולידציה
    if (!phone || !code) {
      return NextResponse.json(
        { error: 'חסרים פרטים נדרשים' },
        { status: 400 }
      );
    }

    // בדיקה שהקוד הוא 6 ספרות
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'קוד לא תקין' },
        { status: 400 }
      );
    }

    console.log(`Verifying OTP for phone: ${phone}, code: ${code}`);

    // חיפוש קודים לא מאומתים תוך 5 דקות בלבד
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: validUnverifiedCodes, error: fetchError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone', phone)
      .eq('verified', false)
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching valid unverified codes:', fetchError);
      return NextResponse.json(
        { error: 'שגיאה באימות הקוד' },
        { status: 500 }
      );
    }

    console.log(`Found ${validUnverifiedCodes?.length || 0} valid unverified codes`);

    // חיפוש הקוד המבוקש
    const matchingCode = validUnverifiedCodes?.find(record => record.otp_code === code);

    if (!matchingCode) {
      console.log('No matching valid code found');
      return NextResponse.json(
        { error: 'קוד שגוי או פג תוקף' },
        { status: 400 }
      );
    }

    console.log(`Found matching code: ${matchingCode.id}`);

    // סימון הקוד כמאומת
    const { error: updateError } = await supabase
      .from('otp_verifications')
      .update({ verified: true })
      .eq('id', matchingCode.id);

    if (updateError) {
      console.error('Error updating OTP:', updateError);
      return NextResponse.json(
        { error: 'שגיאה באימות הקוד' },
        { status: 500 }
      );
    }

    console.log('Code marked as verified, starting cleanup...');

    // ניקיון: מחיקת כל הקודים הלא מאומתים
    const { error: deleteUnverifiedError } = await supabase
      .from('otp_verifications')
      .delete()
      .eq('phone', phone)
      .eq('verified', false);

    if (deleteUnverifiedError) {
      console.error('Error deleting unverified codes:', deleteUnverifiedError);
    } else {
      console.log('All unverified codes deleted');
    }

    // שמירת רק הקוד המאומת האחרון
    const { data: allVerifiedCodes, error: fetchVerifiedError } = await supabase
      .from('otp_verifications')
      .select('id, created_at')
      .eq('phone', phone)
      .eq('verified', true)
      .order('created_at', { ascending: false });

    if (fetchVerifiedError) {
      console.error('Error fetching verified codes:', fetchVerifiedError);
    } else if (allVerifiedCodes && allVerifiedCodes.length > 1) {
      // שמור רק את הראשון, מחק את השאר
      const idsToDelete = allVerifiedCodes.slice(1).map(record => record.id);

      const { error: deleteOldVerifiedError } = await supabase
        .from('otp_verifications')
        .delete()
        .in('id', idsToDelete);

      if (deleteOldVerifiedError) {
        console.error('Error deleting old verified codes:', deleteOldVerifiedError);
      } else {
        console.log(`Deleted ${idsToDelete.length} old verified codes`);
      }
    }

    console.log('OTP verification and cleanup completed successfully');

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