// src/components/dashboard/modals/AvailabilityModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, Clock, Plus, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import type { Availability } from '@/lib/types';

interface AvailabilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    availability: Availability[];
    businessId: string;
    onAddAvailability: (availabilityData: Omit<Availability, 'id' | 'business_id'>) => Promise<void>;
    onDeleteAvailability: (availabilityId: string) => Promise<void>;
}

interface AvailabilityForm {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
}

const DAYS_HEBREW = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export function AvailabilityModal({
    isOpen,
    onClose,
    availability,
    businessId,
    onAddAvailability,
    onDeleteAvailability
}: AvailabilityModalProps) {
    // ===================================
    // 🎯 State Management
    // ===================================
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<AvailabilityForm>({
        day_of_week: 0,
        start_time: '09:00',
        end_time: '17:00',
        is_active: true
    });

    // Delete confirmation modal
    const [deleteModalData, setDeleteModalData] = useState<{
        isOpen: boolean;
        availabilityId: string | null;
        dayName: string | null;
        timeRange: string | null;
    }>({
        isOpen: false,
        availabilityId: null,
        dayName: null,
        timeRange: null
    });

    // ===================================
    // 🔧 Helper Functions
    // ===================================
    const formatTimeForDisplay = (time: string) => {
        return time.slice(0, 5); // Remove seconds if present
    };

    const resetForm = () => {
        setForm({
            day_of_week: 0,
            start_time: '09:00',
            end_time: '17:00',
            is_active: true
        });
    };

    const getAvailabilityByDay = () => {
        const grouped: Record<number, Availability[]> = {};
        for (let i = 0; i < 7; i++) {
            grouped[i] = availability.filter(avail => avail.day_of_week === i);
        }
        return grouped;
    };

    const validateForm = () => {
        if (!form.start_time || !form.end_time) {
            showErrorToast('יש למלא שעת התחלה וסיום');
            return false;
        }

        if (form.start_time >= form.end_time) {
            showErrorToast('שעת הסיום חייבת להיות אחרי שעת ההתחלה');
            return false;
        }

        // Check for conflicts with existing availability for the same day
        const existingForDay = availability.filter(avail => avail.day_of_week === form.day_of_week);
        const hasConflict = existingForDay.some(existing => {
            const existingStart = existing.start_time.slice(0, 5);
            const existingEnd = existing.end_time.slice(0, 5);
            return (
                (form.start_time >= existingStart && form.start_time < existingEnd) ||
                (form.end_time > existingStart && form.end_time <= existingEnd) ||
                (form.start_time <= existingStart && form.end_time >= existingEnd)
            );
        });

        if (hasConflict) {
            showErrorToast('קיימת חפיפה עם שעות עבודה קיימות באותו יום');
            return false;
        }

        return true;
    };

    // ===================================
    // 🎯 Event Handlers
    // ===================================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            await onAddAvailability({
                ...form,
                user_id: businessId // או איך שאתה מקבל את ה-user_id
            });
            showSuccessToast('שעות העבודה נוספו בהצלחה');
            resetForm();
        } catch (error) {
            console.error('Error adding availability:', error);
            showErrorToast('שגיאה בהוספת שעות העבודה');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (availabilityItem: Availability) => {
        const dayName = DAYS_HEBREW[availabilityItem.day_of_week];
        const timeRange = `${formatTimeForDisplay(availabilityItem.start_time)}-${formatTimeForDisplay(availabilityItem.end_time)}`;

        setDeleteModalData({
            isOpen: true,
            availabilityId: availabilityItem.id,
            dayName,
            timeRange
        });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModalData.availabilityId) return;

        try {
            await onDeleteAvailability(deleteModalData.availabilityId);
            showSuccessToast('שעות העבודה נמחקו בהצלחה');
            setDeleteModalData({ isOpen: false, availabilityId: null, dayName: null, timeRange: null });
        } catch (error) {
            console.error('Error deleting availability:', error);
            showErrorToast('שגיאה במחיקת שעות העבודה');
        }
    };

    // ===================================
    // 🎯 Effects
    // ===================================
    useEffect(() => {
        if (!isOpen) {
            resetForm();
            setDeleteModalData({ isOpen: false, availabilityId: null, dayName: null, timeRange: null });
        }
    }, [isOpen]);

    // ===================================
    // 🎨 Render
    // ===================================
    if (!isOpen) return null;

    const availabilityByDay = getAvailabilityByDay();

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">שעות עבודה</h2>
                                <p className="text-sm text-gray-500">הגדרת זמני פעילות העסק</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* Add New Availability Form */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Plus className="w-5 h-5 text-green-600" />
                                    <h3 className="text-lg font-medium text-gray-900">הוספת שעות עבודה</h3>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Day Selection */}
                                    <div>
                                        <Label htmlFor="day_of_week">יום</Label>
                                        <select
                                            id="day_of_week"
                                            value={form.day_of_week}
                                            onChange={(e) => setForm(prev => ({ ...prev, day_of_week: parseInt(e.target.value) }))}
                                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {DAYS_HEBREW.map((day, index) => (
                                                <option key={index} value={index}>{day}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Time Range */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="start_time">שעת התחלה</Label>
                                            <Input
                                                id="start_time"
                                                type="time"
                                                value={form.start_time}
                                                onChange={(e) => setForm(prev => ({ ...prev, start_time: e.target.value }))}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="end_time">שעת סיום</Label>
                                            <Input
                                                id="end_time"
                                                type="time"
                                                value={form.end_time}
                                                onChange={(e) => setForm(prev => ({ ...prev, end_time: e.target.value }))}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                מוסיף...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                הוסף שעות עבודה
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </div>

                            {/* Current Availability Display */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    <h3 className="text-lg font-medium text-gray-900">שעות עבודה נוכחיות</h3>
                                </div>

                                <div className="space-y-4">
                                    {DAYS_HEBREW.map((dayName, dayIndex) => (
                                        <div key={dayIndex} className="border border-gray-200 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900 mb-2">{dayName}</h4>

                                            {availabilityByDay[dayIndex]?.length > 0 ? (
                                                <div className="space-y-2">
                                                    {availabilityByDay[dayIndex].map((availItem) => (
                                                        <div
                                                            key={availItem.id}
                                                            className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-4 h-4 text-gray-500" />
                                                                <span className="text-sm font-medium">
                                                                    {formatTimeForDisplay(availItem.start_time)} - {formatTimeForDisplay(availItem.end_time)}
                                                                </span>
                                                                {!availItem.is_active && (
                                                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                                                        לא פעיל
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteClick(availItem)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">אין שעות עבודה מוגדרות</p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {availability.length === 0 && (
                                    <div className="text-center py-8">
                                        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">אין שעות עבודה מוגדרות</h3>
                                        <p className="text-gray-500">הוסף שעות עבודה כדי שלקוחות יוכלו לבקש תורים</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModalData.isOpen}
                onClose={() => setDeleteModalData({ isOpen: false, availabilityId: null, dayName: null, timeRange: null })}
                onConfirm={handleConfirmDelete}
                title="מחיקת שעות עבודה"
                description={`האם אתה בטוח שברצונך למחוק את שעות העבודה ביום ${deleteModalData.dayName} בין השעות ${deleteModalData.timeRange}?`}
                confirmText="מחק"
                cancelText="ביטול"
                isDangerous={true}
            />
        </>
    );
}