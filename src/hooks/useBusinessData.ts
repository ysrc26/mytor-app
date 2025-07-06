// src/hooks/useBusinessData.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { BusinessAPI, BusinessNotFoundError } from '@/lib/business-api';
import { showErrorToast, showSuccessToast } from '@/lib/toast-utils';
import type { Business, Service, Availability } from '@/lib/types';

export interface UseBusinessDataResult {
  // Data
  business: Business | null;
  services: Service[];
  availability: Availability[];
  
  // States
  loading: boolean;
  saving: boolean;
  uploadingImage: boolean;
  error: string | null;
  
  // Business Actions
  reload: () => Promise<void>;
  updateBusiness: (data: Partial<Business>) => Promise<void>;
  
  // Services Actions
  addService: (serviceData: Omit<Service, 'id' | 'business_id' | 'created_at'>) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  
  // Availability Actions
  addAvailability: (availabilityData: Omit<Availability, 'id' | 'business_id'>) => Promise<void>;
  deleteAvailability: (availabilityId: string) => Promise<void>;
  
  // Image Actions
  uploadProfileImage: (file: File) => Promise<string | null>;
  deleteProfileImage: () => Promise<boolean>;
  getImageUrl: (path: string) => string;
  
  // Utilities
  clearError: () => void;
  
  // API instance for direct access
  api: BusinessAPI;
}

/**
 * Custom hook לניהול נתוני העסק, שירותים, זמינות ותמונות
 * מרכז את כל הstate management והAPI calls הקשורים לעסק
 */
export const useBusinessData = (businessId: string): UseBusinessDataResult => {
  // ===================================
  // 🎯 State Management
  // ===================================
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();
  
  // יצירת API instance - רק פעם אחת לכל businessId
  const api = useMemo(() => new BusinessAPI(businessId), [businessId]);

  // ===================================
  // 🔄 Data Loading Functions
  // ===================================

  /**
   * טעינת כל נתוני העסק (עסק + שירותים + זמינות)
   */
  const loadBusinessData = useCallback(async () => {
    if (!businessId) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading business data for:', businessId);

      // טעינה מקבילה של כל הנתונים
      const [businessData, servicesData, availabilityData] = await Promise.all([
        api.fetchBusiness(),
        api.fetchServices(),
        api.fetchAvailability()
      ]);
      
      setBusiness(businessData);
      setServices(servicesData);
      setAvailability(availabilityData);
      
      console.log('✅ Business data loaded successfully');

    } catch (err) {
      console.error('❌ Error loading business data:', err);
      
      if (err instanceof BusinessNotFoundError) {
        // עסק לא נמצא - הפנה לדף ראשי
        router.push('/dashboard/redirect');
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בטעינת נתוני העסק';
      setError(errorMessage);
      showErrorToast(errorMessage);
      
    } finally {
      setLoading(false);
    }
  }, [businessId, api, router]);

  /**
   * טעינה ראשונית כשה-hook נטען
   */
  useEffect(() => {
    loadBusinessData();
  }, [loadBusinessData]);

  // ===================================
  // 🏢 Business Management Functions
  // ===================================

  /**
   * עדכון פרטי העסק
   */
  const updateBusiness = useCallback(async (data: Partial<Business>) => {
    if (!business) return;

    try {
      setSaving(true);
      setError(null);
      
      console.log('🔄 Updating business:', data);
      
      const updatedBusiness = await api.updateBusiness(data);
      setBusiness(updatedBusiness);
      
      showSuccessToast('העסק עודכן בהצלחה');
      console.log('✅ Business updated successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בעדכון העסק';
      setError(errorMessage);
      showErrorToast(errorMessage);
      console.error('❌ Error updating business:', err);
      
    } finally {
      setSaving(false);
    }
  }, [business, api]);

  // ===================================
  // 🛠️ Services Management Functions
  // ===================================

  /**
   * הוספת שירות חדש
   */
  const addService = useCallback(async (serviceData: Omit<Service, 'id' | 'business_id' | 'created_at'>) => {
    try {
      setSaving(true);
      setError(null);
      
      console.log('🔄 Adding service:', serviceData);
      
      const newService = await api.addService(serviceData);
      setServices(prev => [...prev, newService]);
      
      showSuccessToast('שירות נוסף בהצלחה');
      console.log('✅ Service added successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בהוספת שירות';
      setError(errorMessage);
      showErrorToast(errorMessage);
      console.error('❌ Error adding service:', err);
      
    } finally {
      setSaving(false);
    }
  }, [api]);

  /**
   * מחיקת שירות
   */
  const deleteService = useCallback(async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    // אישור מחיקה
    if (!confirm(`האם אתה בטוח שברצונך למחוק את השירות "${service.name}"?`)) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      console.log('🔄 Deleting service:', serviceId);
      
      await api.deleteService(serviceId);
      setServices(prev => prev.filter(s => s.id !== serviceId));
      
      showSuccessToast('שירות נמחק בהצלחה');
      console.log('✅ Service deleted successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה במחיקת שירות';
      setError(errorMessage);
      showErrorToast(errorMessage);
      console.error('❌ Error deleting service:', err);
      
    } finally {
      setSaving(false);
    }
  }, [services, api]);

  // ===================================
  // 📅 Availability Management Functions
  // ===================================

  /**
   * הוספת זמינות חדשה
   */
  const addAvailability = useCallback(async (availabilityData: Omit<Availability, 'id' | 'business_id'>) => {
    try {
      setSaving(true);
      setError(null);
      
      console.log('🔄 Adding availability:', availabilityData);
      
      const newAvailability = await api.addAvailability(availabilityData);
      setAvailability(prev => [...prev, newAvailability]);
      
      showSuccessToast('זמינות נוספה בהצלחה');
      console.log('✅ Availability added successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בהוספת זמינות';
      setError(errorMessage);
      showErrorToast(errorMessage);
      console.error('❌ Error adding availability:', err);
      
    } finally {
      setSaving(false);
    }
  }, [api]);

  /**
   * מחיקת זמינות
   */
  const deleteAvailability = useCallback(async (availabilityId: string) => {
    const availItem = availability.find(a => a.id === availabilityId);
    if (!availItem) return;

    // אישור מחיקה
    if (!confirm('האם אתה בטוח שברצונך למחוק זמינות זו?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      console.log('🔄 Deleting availability:', availabilityId);
      
      await api.deleteAvailability(availabilityId);
      setAvailability(prev => prev.filter(a => a.id !== availabilityId));
      
      showSuccessToast('זמינות נמחקה בהצלחה');
      console.log('✅ Availability deleted successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה במחיקת זמינות';
      setError(errorMessage);
      showErrorToast(errorMessage);
      console.error('❌ Error deleting availability:', err);
      
    } finally {
      setSaving(false);
    }
  }, [availability, api]);

  // ===================================
  // 🖼️ Image Management Functions
  // ===================================

  /**
   * העלאת תמונת פרופיל חדשה
   */
  const uploadProfileImage = useCallback(async (file: File): Promise<string | null> => {
    if (!business) {
      showErrorToast('לא ניתן להעלות תמונה ללא נתוני עסק');
      return null;
    }

    setUploadingImage(true);
    
    try {
      // ולידציה בסיסית
      if (!file.type.startsWith('image/')) {
        showErrorToast('אנא בחר קובץ תמונה בלבד');
        return null;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        showErrorToast('גודל התמונה לא יכול לעלות על 5MB');
        return null;
      }

      // מחיקת תמונה קודמת אם קיימת
      if (business.profile_image_path) {
        try {
          await supabase.storage
            .from('business-profiles')
            .remove([business.profile_image_path]);
        } catch (err) {
          console.warn('Failed to delete old image:', err);
        }
      }

      // יצירת שם קובץ ייחודי
      const fileExt = file.name.split('.').pop();
      const fileName = `${businessId}/${Date.now()}.${fileExt}`;

      // העלאה ל-Storage
      const { data, error } = await supabase.storage
        .from('business-profiles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        showErrorToast('שגיאה בהעלאת התמונה');
        return null;
      }

      // קבלת URL ציבורי
      const { data: urlData } = supabase.storage
        .from('business-profiles')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      // עדכון העסק עם התמונה החדשה
      const updatedBusinessData = {
        profile_image_url: imageUrl,
        profile_image_path: fileName,
        profile_image_updated_at: new Date().toISOString()
      };

      const updatedBusiness = await api.updateBusiness(updatedBusinessData);
      setBusiness(updatedBusiness);

      showSuccessToast('תמונה הועלתה בהצלחה!');
      console.log('✅ Profile image uploaded successfully');
      
      return imageUrl;

    } catch (error) {
      console.error('Upload process error:', error);
      showErrorToast('שגיאה כללית בהעלאת התמונה');
      return null;
    } finally {
      setUploadingImage(false);
    }
  }, [business, businessId, api, supabase]);

  /**
   * מחיקת תמונת פרופיל
   */
  const deleteProfileImage = useCallback(async (): Promise<boolean> => {
    if (!business) return false;

    try {
      setUploadingImage(true);

      // מחיקה מה-Storage אם יש path
      if (business.profile_image_path) {
        const { error: deleteError } = await supabase.storage
          .from('business-profiles')
          .remove([business.profile_image_path]);

        if (deleteError) {
          console.error('Storage delete error:', deleteError);
        }
      }

      // עדכון העסק (איפוס השדות)
      const updatedBusinessData = {
        profile_image_url: null,
        profile_image_path: null,
        profile_image_updated_at: new Date().toISOString()
      };

      const updatedBusiness = await api.updateBusiness(updatedBusinessData);
      setBusiness(updatedBusiness);

      showSuccessToast('תמונה נמחקה בהצלחה');
      console.log('✅ Profile image deleted successfully');
      
      return true;

    } catch (error) {
      console.error('Delete process error:', error);
      showErrorToast('שגיאה במחיקת התמונה');
      return false;
    } finally {
      setUploadingImage(false);
    }
  }, [business, api, supabase]);

  /**
   * קבלת URL של תמונה מ-Storage
   */
  const getImageUrl = useCallback((path: string): string => {
    const { data } = supabase.storage
      .from('business-profiles')
      .getPublicUrl(path);
    
    return data.publicUrl;
  }, [supabase]);

  // ===================================
  // 🛠️ Utility Functions
  // ===================================

  /**
   * ניקוי שגיאות
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * רענון נתונים מלא
   */
  const reload = useCallback(async () => {
    await loadBusinessData();
  }, [loadBusinessData]);

  // ===================================
  // 📊 Return Hook Result
  // ===================================
  
  return {
    // Data
    business,
    services,
    availability,
    
    // States
    loading,
    saving,
    uploadingImage,
    error,
    
    // Business Actions
    reload,
    updateBusiness,
    
    // Services Actions
    addService,
    deleteService,
    
    // Availability Actions
    addAvailability,
    deleteAvailability,
    
    // Image Actions
    uploadProfileImage,
    deleteProfileImage,
    getImageUrl,
    
    // Utilities
    clearError,
    
    // API instance
    api
  };
};

// ===================================
// 🎯 Additional Helper Hooks
// ===================================

/**
 * Hook קל יותר רק לקריאת נתוני עסק בסיסיים
 */
export const useBasicBusinessData = (businessId: string) => {
  const { business, loading, error } = useBusinessData(businessId);
  
  return {
    business,
    loading,
    error,
    businessName: business?.name || '',
    businessSlug: business?.slug || '',
    isActive: business?.is_active || false,
    profileImageUrl: business?.profile_image_url || null
  };
};

/**
 * Hook לבדיקה מהירה אם עסק קיים
 */
export const useBusinessExists = (businessId: string) => {
  const { business, loading, error } = useBasicBusinessData(businessId);
  
  return {
    exists: !!business && !error,
    loading,
    error
  };
};