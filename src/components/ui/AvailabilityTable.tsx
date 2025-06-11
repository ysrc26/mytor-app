// src/components/ui/AvailabilityTable.tsx
import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Save, Loader2 } from 'lucide-react';
import { Availability } from '@/lib/types';

// טיפוס נוסף לניהול הזמינות בטבלה
interface DayAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_closed: boolean;
  id?: string | null;
}

interface AvailabilityTableProps {
  businessId: string;
  initialAvailability?: Availability[];
  onSaveSuccess?: () => void; // הוסף את זה
}

const AvailabilityTable: React.FC<AvailabilityTableProps> = ({ businessId, initialAvailability = [], onSaveSuccess }) => {
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const daysOfWeek = [
    { id: 0, name: 'ראשון', shortName: 'א\'' },
    { id: 1, name: 'שני', shortName: 'ב\'' },
    { id: 2, name: 'שלישי', shortName: 'ג\'' },
    { id: 3, name: 'רביעי', shortName: 'ד\'' },
    { id: 4, name: 'חמישי', shortName: 'ה\'' },
    { id: 5, name: 'שישי', shortName: 'ו\'' },
    { id: 6, name: 'שבת', shortName: 'ש\'' }
  ];

  // אתחול הזמינות עם ברירות מחדל וטעינה מחדש כשמשתנה initialAvailability
  useEffect(() => {
    const defaultAvailability = daysOfWeek.map(day => {
      const existing = initialAvailability.find(avail => avail.day_of_week === day.id);
      return {
        day_of_week: day.id,
        start_time: existing?.start_time || '09:00',
        end_time: existing?.end_time || '17:00',
        is_closed: !existing, // אם אין זמינות לליום הזה - הוא סגור
        id: existing?.id || null
      };
    });
    setAvailability(defaultAvailability);
  }, [initialAvailability]);

  const updateDay = (dayIndex: number, field: keyof DayAvailability, value: string | boolean) => {
    setAvailability(prev => prev.map((day, index) => 
      index === dayIndex ? { ...day, [field]: value } : day
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      // מחק קודם את כל הזמינות הקיימת
      await fetch(`/api/businesses/${businessId}/availability/bulk`, {
        method: 'DELETE'
      });

      // הוסף רק ימים שלא סגורים
      const activeAvailability = availability
        .filter(day => !day.is_closed)
        .map(day => ({
          day_of_week: day.day_of_week,
          start_time: day.start_time,
          end_time: day.end_time
        }));
      
      if (activeAvailability.length > 0) {
        const response = await fetch(`/api/businesses/${businessId}/availability/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ availability: activeAvailability })
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('API Error:', errorData);
          throw new Error('שגיאה בשמירת הזמינות');
        }
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // קרא לcallback לרענון הנתונים
      if (onSaveSuccess) {
        onSaveSuccess();
      }

    } catch (err) {
      setError('שגיאה בשמירת הזמינות');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">זמינות שבועית</h3>
            <p className="text-sm text-gray-600">הגדר את שעות הפעילות לכל יום</p>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              שומר...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              שמור שינויים
            </>
          )}
        </button>
      </div>

      {/* הודעות */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-medium">הזמינות נשמרה בהצלחה!</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-2">
          <X className="w-5 h-5 text-red-600" />
          <span className="text-red-800 font-medium">{error}</span>
        </div>
      )}

      {/* הטבלה */}
      <div className="overflow-hidden rounded-2xl border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 border-b">יום</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 border-b">שעת התחלה</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 border-b">שעת סיום</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 border-b">סגור</th>
            </tr>
          </thead>
          <tbody>
            {availability.map((day, index) => {
              const dayInfo = daysOfWeek[index];
              return (
                <tr 
                  key={day.day_of_week} 
                  className={`border-b border-gray-100 ${day.is_closed ? 'bg-gray-50 opacity-60' : 'bg-white hover:bg-gray-50'} transition-colors`}
                >
                  {/* יום */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        day.is_closed 
                          ? 'bg-gray-200 text-gray-500' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {dayInfo.shortName}
                      </div>
                      <span className={`font-medium ${day.is_closed ? 'text-gray-400' : 'text-gray-900'}`}>
                        {dayInfo.name}
                      </span>
                    </div>
                  </td>

                  {/* שעת התחלה */}
                  <td className="px-6 py-4 text-center">
                    <input
                      type="time"
                      value={day.start_time}
                      onChange={(e) => updateDay(index, 'start_time', e.target.value)}
                      disabled={day.is_closed}
                      className={`px-3 py-2 border rounded-lg text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        day.is_closed 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'border-gray-300 bg-white'
                      }`}
                    />
                  </td>

                  {/* שעת סיום */}
                  <td className="px-6 py-4 text-center">
                    <input
                      type="time"
                      value={day.end_time}
                      onChange={(e) => updateDay(index, 'end_time', e.target.value)}
                      disabled={day.is_closed}
                      className={`px-3 py-2 border rounded-lg text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        day.is_closed 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'border-gray-300 bg-white'
                      }`}
                    />
                  </td>

                  {/* checkbox סגור */}
                  <td className="px-6 py-4 text-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={day.is_closed}
                        onChange={(e) => updateDay(index, 'is_closed', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 border-2 rounded-md flex items-center justify-center transition-colors ${
                        day.is_closed 
                          ? 'bg-red-500 border-red-500 text-white' 
                          : 'bg-white border-gray-300 hover:border-red-400'
                      }`}>
                        {day.is_closed && <X className="w-4 h-4" />}
                      </div>
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* הסבר */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-blue-600 text-xs">💡</span>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">עצות לניהול זמינות:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>סמן "סגור" לימים שאינך עובד בהם (כמו שבת)</li>
              <li>הגדר שעות עבודה אחידות לניהול קל יותר</li>
              <li>זכור לעדכן זמינות לפני חגים וחופשות</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityTable;