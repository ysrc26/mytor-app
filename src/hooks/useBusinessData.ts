// src/hooks/useBusinessData.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  error: string | null;
  
  // Actions
  reload: () => Promise<void>;
  updateBusiness: (data: Partial<Business>) => Promise<void>;
  addService: (serviceData: Omit<Service, 'id' | 'business_id' | 'created_at'>) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  addAvailability: (availabilityData: Omit<Availability, 'id' | 'business_id'>) => Promise<void>;
  deleteAvailability: (availabilityId: string) => Promise<void>;
  clearError: () => void;
  
  // API instance for direct access
  api: BusinessAPI;
}

/**
 * Custom hook לניהול נתוני העסק, שירותים וזמינות
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
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  
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
    error,
    
    // Actions
    reload,
    updateBusiness,
    addService,
    deleteService,
    addAvailability,
    deleteAvailability,
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
    isActive: business?.is_active || false
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