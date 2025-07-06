// src/app/api/businesses/[id]/profile-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(
 request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
   const supabase = await createClient();
   const resolvedParams = await params;
   
   const { data: { user }, error: authError } = await supabase.auth.getUser();
   if (authError || !user) {
     return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
   }

   const { id: businessId } = resolvedParams;

   const { data: business, error: businessError } = await supabase
     .from('businesses')
     .select('id, user_id, profile_image_url')
     .eq('id', businessId)
     .eq('user_id', user.id)
     .single();

   if (businessError || !business) {
     return NextResponse.json({ error: 'עסק לא נמצא' }, { status: 404 });
   }

   const formData = await request.formData();
   const file = formData.get('image') as File;

   if (!file) {
     return NextResponse.json({ error: 'לא נבחר קובץ' }, { status: 400 });
   }

   if (!file.type.startsWith('image/')) {
     return NextResponse.json({ error: 'סוג קובץ לא נתמך. אנא בחר תמונה' }, { status: 400 });
   }

   if (file.size > 5 * 1024 * 1024) {
     return NextResponse.json({ error: 'גודל הקובץ חייב להיות עד 5MB' }, { status: 400 });
   }

   const buffer = await file.arrayBuffer();
   const fileExtension = file.name.split('.').pop() || 'jpg';
   const fileName = `business-${businessId}-profile-${Date.now()}.${fileExtension}`;

   const { data: uploadData, error: uploadError } = await supabase.storage
     .from('business-images')
     .upload(fileName, buffer, {
       contentType: file.type,
       upsert: true
     });

   if (uploadError) {
     console.error('Upload error:', uploadError);
     return NextResponse.json({ error: 'שגיאה בהעלאת הקובץ' }, { status: 500 });
   }

   const { data: { publicUrl } } = supabase.storage
     .from('business-images')
     .getPublicUrl(fileName);

   if (business.profile_image_url) {
     try {
       const oldFileName = business.profile_image_url.split('/').pop();
       if (oldFileName) {
         await supabase.storage.from('business-images').remove([oldFileName]);
       }
     } catch (error) {
       console.warn('Failed to delete old image:', error);
     }
   }

   const { data: updatedBusiness, error: updateError } = await supabase
     .from('businesses')
     .update({ profile_image_url: publicUrl })
     .eq('id', businessId)
     .eq('user_id', user.id)
     .select()
     .single();

   if (updateError) {
     console.error('Database update error:', updateError);
     return NextResponse.json({ error: 'שגיאה בעדכון בסיס הנתונים' }, { status: 500 });
   }

   return NextResponse.json({
     message: 'תמונת הפרופיל עודכנה בהצלחה',
     profile_image_url: publicUrl,
     business: updatedBusiness
   });

 } catch (error) {
   console.error('Error in profile image upload:', error);
   return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
 }
}

export async function DELETE(
 request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
   const supabase = await createClient();
   const resolvedParams = await params;
   
   const { data: { user }, error: authError } = await supabase.auth.getUser();
   if (authError || !user) {
     return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
   }

   const { id: businessId } = resolvedParams;

   const { data: business, error: businessError } = await supabase
     .from('businesses')
     .select('id, user_id, profile_image_url')
     .eq('id', businessId)
     .eq('user_id', user.id)
     .single();

   if (businessError || !business) {
     return NextResponse.json({ error: 'עסק לא נמצא' }, { status: 404 });
   }

   if (!business.profile_image_url) {
     return NextResponse.json({ error: 'אין תמונת פרופיל למחיקה' }, { status: 400 });
   }

   try {
     const fileName = business.profile_image_url.split('/').pop();
     if (fileName) {
       const { error: deleteError } = await supabase.storage
         .from('business-images')
         .remove([fileName]);

       if (deleteError) {
         console.warn('Failed to delete image from storage:', deleteError);
       }
     }
   } catch (error) {
     console.warn('Error deleting image from storage:', error);
   }

   const { data: updatedBusiness, error: updateError } = await supabase
     .from('businesses')
     .update({ profile_image_url: null })
     .eq('id', businessId)
     .eq('user_id', user.id)
     .select()
     .single();

   if (updateError) {
     console.error('Database update error:', updateError);
     return NextResponse.json({ error: 'שגיאה בעדכון בסיס הנתונים' }, { status: 500 });
   }

   return NextResponse.json({
     message: 'תמונת הפרופיל נמחקה בהצלחה',
     business: updatedBusiness
   });

 } catch (error) {
   console.error('Error in profile image deletion:', error);
   return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
 }
}