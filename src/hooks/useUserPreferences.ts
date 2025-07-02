// src/hooks/useUserPreferences.ts
'use client';

import { useState, useEffect } from 'react';

export interface UserPreferences {
  default_calendar_view: 'day' | 'week' | 'month' | 'work-days' | 'agenda';
  booking_advance_limit: 'week' | 'two-weeks' | 'month';
}

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/users/preferences');
      
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }
      
      const data = await response.json();
      
      // אם אין העדפות, הגדר ברירות מחדל
      const userPreferences: UserPreferences = {
        default_calendar_view: data.default_calendar_view || 'work-days',
        booking_advance_limit: data.booking_advance_limit || 'week'
      };
      
      setPreferences(userPreferences);
    } catch (err) {
      console.error('Error fetching user preferences:', err);
      setError('שגיאה בטעינת העדפות');
      
      // גם במקרה של שגיאה, הגדר ברירות מחדל
      setPreferences({
        default_calendar_view: 'work-days',
        booking_advance_limit: 'week'
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    try {
      const response = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPreferences)
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      const updatedData = await response.json();
      
      setPreferences({
        default_calendar_view: updatedData.default_calendar_view,
        booking_advance_limit: updatedData.booking_advance_limit
      });
      
      return true;
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError('שגיאה בעדכון העדפות');
      return false;
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  return {
    preferences,
    loading,
    error,
    fetchPreferences,
    updatePreferences,
    // Helper to get default calendar view
    getDefaultCalendarView: () => preferences?.default_calendar_view || 'work-days',
    // Helper to get booking advance limit
    getBookingAdvanceLimit: () => preferences?.booking_advance_limit || 'week'
  };
};