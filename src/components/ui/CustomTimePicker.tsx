// src/components/ui/CustomTimePicker.tsx
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';

interface CustomTimePickerProps {
    value: string; // format: HH:MM
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    min?: string; // format: HH:MM
    max?: string; // format: HH:MM
    step?: number; // מרווח בדקות (15, 30, 60)
    className?: string;
    suggestions?: string[]; // רשימת זמנים מוצעים
}

// *** פונקציות עזר מחוץ לרכיב - זה קריטי! ***
const isValidTime = (timeStr: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(timeStr);
};

const formatDisplayTime = (timeStr: string, placeholder: string): string => {
    if (!timeStr) return placeholder;
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
};

export const CustomTimePicker = ({
    value,
    onChange,
    placeholder = "בחר שעה",
    disabled = false,
    readOnly = false,
    min,
    max,
    step = 15,
    className = "",
    suggestions = []
}: CustomTimePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // סגירת התפריט בלחיצה מחוץ לאזור
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // יצירת רשימת זמנים - עכשיו isValidTime זמינה
    const timeOptions = useMemo(() => {
        const times: string[] = [];

        // אם יש הצעות, השתמש בהן
        if (suggestions.length > 0) {
            suggestions.forEach(time => {
                if (isValidTime(time)) {
                    times.push(time);
                }
            });
        } else {
            // יצירת זמנים לפי step
            for (let hour = 0; hour < 24; hour++) {
                for (let minute = 0; minute < 60; minute += step) {
                    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    times.push(timeStr);
                }
            }
        }

        // סינון לפי min/max
        return times.filter(time => {
            if (min && time < min) return false;
            if (max && time > max) return false;
            return true;
        });
    }, [step, min, max, suggestions]);

    // פילטור זמנים לפי חיפוש
    const filteredTimes = useMemo(() => {
        if (!searchTerm) return timeOptions;

        return timeOptions.filter(time =>
            time.includes(searchTerm) ||
            formatDisplayTime(time, placeholder).includes(searchTerm)
        );
    }, [timeOptions, searchTerm, placeholder]);

    // טיפול בבחירת זמן
    const handleTimeSelect = (timeStr: string) => {
        if (disabled || readOnly) return;

        onChange(timeStr);
        setIsOpen(false);
        setSearchTerm('');
    };

    // טיפול בהקלדה ישירה
    const handleInputChange = (inputValue: string) => {
        setSearchTerm(inputValue);

        // אם הוקלד זמן תקין, שמור אותו
        if (isValidTime(inputValue)) {
            // בדיקת תקינות לפי min/max
            let isAllowed = true;
            if (min && inputValue < min) isAllowed = false;
            if (max && inputValue > max) isAllowed = false;

            if (isAllowed) {
                onChange(inputValue);
            }
        }
    };

    // טיפול ב-Enter
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            if (filteredTimes.length > 0) {
                handleTimeSelect(filteredTimes[0]);
            } else if (isValidTime(searchTerm)) {
                handleTimeSelect(searchTerm);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    // קבלת הזמן הנוכחי
    const getCurrentTime = () => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        // עיגול לפי step
        const [hours, minutes] = timeStr.split(':').map(Number);
        const roundedMinutes = Math.round(minutes / step) * step;
        const finalMinutes = roundedMinutes >= 60 ? 0 : roundedMinutes;
        const finalHours = roundedMinutes >= 60 ? hours + 1 : hours;

        const finalTime = `${finalHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;

        // בדיקה אם מותר
        if (min && finalTime < min) return null;
        if (max && finalTime > max) return null;

        return finalTime;
    };

    const setCurrentTime = () => {
        const currentTime = getCurrentTime();
        if (currentTime) {
            handleTimeSelect(currentTime);
        }
    };

    const displayValue = value || searchTerm;

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Input לזמן */}
            <div
                onClick={() => !disabled && !readOnly && setIsOpen(true)}
                className={`
          w-full flex items-center px-3 py-2 text-right
          border border-gray-300 rounded-lg bg-white
          focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
          transition-colors duration-200
          ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'hover:border-gray-400'}
          ${readOnly ? 'cursor-default' : 'cursor-pointer'}
        `}
            >
                <Clock className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />

                <input
                    ref={inputRef}
                    type="text"
                    value={displayValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => !disabled && !readOnly && setIsOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    readOnly={readOnly}
                    className="flex-1 bg-transparent outline-none text-right"
                    dir="ltr"
                />
            </div>

            {/* תפריט הזמנים */}
            {isOpen && !disabled && !readOnly && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-hidden">
                    {/* כותרת וכפתור זמן נוכחי */}
                    <div className="p-3 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">בחר שעה</span>
                            <button
                                onClick={setCurrentTime}
                                type="button"
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                עכשיו
                            </button>
                        </div>
                    </div>

                    {/* רשימת זמנים */}
                    <div className="max-h-60 overflow-y-auto">
                        {filteredTimes.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                {searchTerm ? 'לא נמצאו זמנים מתאימים' : 'אין זמנים זמינים'}
                            </div>
                        ) : (
                            <div className="p-2">
                                {filteredTimes.map((time, index) => {
                                    const isSelected = value === time;
                                    const isHighlighted = searchTerm && time.includes(searchTerm);

                                    return (
                                        <button
                                            key={time}
                                            type="button"
                                            onClick={() => handleTimeSelect(time)}
                                            className={`
                        w-full px-3 py-2 text-right rounded-lg transition-colors
                        flex items-center justify-between
                        ${isSelected
                                                    ? 'bg-blue-600 text-white'
                                                    : isHighlighted
                                                        ? 'bg-blue-50 text-blue-900'
                                                        : 'hover:bg-gray-100 text-gray-900'
                                                }
                      `}
                                        >
                                            <span className="text-sm font-mono">{formatDisplayTime(time, placeholder)}</span>
                                            {isSelected && (
                                                <span className="text-xs opacity-75">נבחר</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* כפתורי פעולה */}
                    <div className="flex justify-between items-center p-3 border-t border-gray-200 bg-gray-50">
                        <button
                            onClick={() => {
                                onChange('');
                                setIsOpen(false);
                                setSearchTerm('');
                            }}
                            type="button"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            נקה
                        </button>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setSearchTerm('');
                            }}
                            type="button"
                            className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                        >
                            סגור
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};