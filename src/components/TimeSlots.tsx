// src/components/TimeSlots.tsx
'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Availability } from '@/lib/types';

interface TimeSlotsProps {
  availability: Availability[];
  selectedDate?: string;
  selectedTime?: string;
  onTimeSelect: (date: string, time: string) => void;
  unavailableDates?: string[];
  className?: string;
}

const DAYS_HEBREW = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export default function TimeSlots({
  availability,
  selectedDate,
  selectedTime,
  onTimeSelect,
  unavailableDates = [],
  className
}: TimeSlotsProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(
    selectedDate ? parseInt(selectedDate) : null
  );

  // יצירת רשימת ימים זמינים
  const getAvailableDays = () => {
    return availability
      .filter(avail => avail.is_active)
      .map(avail => ({
        dayNum: avail.day_of_week,
        dayName: DAYS_HEBREW[avail.day_of_week],
        availability: avail
      }))
      .sort((a, b) => a.dayNum - b.dayNum);
  };

  // יצירת רשימת שעות ליום מסוים
  const getTimesForDay = (dayNum: number) => {
    const dayAvailability = availability.find(
      avail => avail.day_of_week === dayNum && avail.is_active
    );
    
    if (!dayAvailability) return [];

    const times: string[] = [];
    const start = parseTime(dayAvailability.start_time);
    const end = parseTime(dayAvailability.end_time);
    
    // יצירת משבצות של 30 דקות
    for (let hour = start.hour; hour < end.hour || (hour === end.hour && start.minute < end.minute); hour++) {
      for (let minute = (hour === start.hour ? start.minute : 0); minute < 60; minute += 30) {
        if (hour === end.hour && minute >= end.minute) break;
        times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    
    return times;
  };

  const parseTime = (timeStr: string) => {
    const [hour, minute] = timeStr.split(':').map(Number);
    return { hour, minute };
  };

  const handleDaySelect = (dayNum: number) => {
    setSelectedDay(dayNum);
    // איפוס בחירת שעה כשמשנים יום
    if (selectedTime) {
      onTimeSelect(dayNum.toString(), '');
    }
  };

  const handleTimeSelect = (time: string) => {
    if (selectedDay !== null) {
      onTimeSelect(selectedDay.toString(), time);
    }
  };

  const availableDays = getAvailableDays();

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Calendar className="h-5 w-5 ml-2" />
          בחר יום ושעה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* בחירת יום */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">יום מועדף</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableDays.map((day) => (
              <Button
                key={day.dayNum}
                variant={selectedDay === day.dayNum ? "default" : "outline"}
                onClick={() => handleDaySelect(day.dayNum)}
                className={cn(
                  "h-12 text-sm",
                  selectedDay === day.dayNum 
                    ? "bg-blue-500 hover:bg-blue-600 text-white" 
                    : "border-gray-300 hover:border-blue-300"
                )}
              >
                {day.dayName}
              </Button>
            ))}
          </div>
        </div>

        {/* בחירת שעה */}
        {selectedDay !== null && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Clock className="h-4 w-4 ml-2" />
              שעות זמינות ב{DAYS_HEBREW[selectedDay]}
            </h4>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {getTimesForDay(selectedDay).map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  onClick={() => handleTimeSelect(time)}
                  className={cn(
                    "h-10 text-sm",
                    selectedTime === time 
                      ? "bg-blue-500 hover:bg-blue-600 text-white" 
                      : "border-gray-300 hover:border-blue-300"
                  )}
                >
                  {time}
                </Button>
              ))}
            </div>
            
            {getTimesForDay(selectedDay).length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                אין זמנים זמינים ביום זה
              </p>
            )}
          </div>
        )}

        {/* מידע נוסף */}
        {selectedDay !== null && selectedTime && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-blue-800 text-sm">
              <strong>נבחר:</strong> יום {DAYS_HEBREW[selectedDay]} בשעה {selectedTime}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}