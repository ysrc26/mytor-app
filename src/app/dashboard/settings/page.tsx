// src/app/dashboard/settings/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { CheckCircle, Settings, Calendar, Save, Loader2, ArrowRight } from 'lucide-react';
import { CalendarView, UserPreferences } from '@/lib/types';

export default function SettingsPage() {
    const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
        default_calendar_view: 'work-days'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const calendarViewOptions = [
        { value: 'day' as CalendarView, label: 'יום', icon: '📅', description: 'תצוגת יום בודד' },
        { value: 'three-days' as CalendarView, label: '3 ימים', icon: '📊', description: 'תצוגת 3 ימים רצופים' },
        { value: 'week' as CalendarView, label: 'שבוע', icon: '🗓️', description: 'תצוגת שבוע מלא (א׳-ש׳)' },
        { value: 'work-days' as CalendarView, label: 'ימי עבודה', icon: '💼', description: 'רק הימים בהם יש לך זמינות' },
        { value: 'month' as CalendarView, label: 'חודש', icon: '📆', description: 'תצוגת חודש מלא' }
    ];

    useEffect(() => {
        fetchPreferences();
    }, []);

    const router = useRouter();

    const fetchPreferences = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/users/preferences');

            if (!response.ok) {
                throw new Error('Failed to fetch preferences');
            }

            const data = await response.json();
            setPreferences(data);
        } catch (err) {
            setError('שגיאה בטעינת ההעדפות');
            console.error('Error fetching preferences:', err);
        } finally {
            setLoading(false);
        }
    };

    const savePreferences = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const response = await fetch('/api/users/preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(preferences)
            });

            if (!response.ok) {
                throw new Error('Failed to save preferences');
            }

            setSuccess('ההעדפות נשמרו בהצלחה!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('שגיאה בשמירת ההעדפות');
            console.error('Error saving preferences:', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50" dir="rtl">
            <div className="max-w-4xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowRight className="w-4 h-4" />
                            <span className="text-sm font-medium">חזור</span>
                        </button>

                        <div className="h-6 w-px bg-gray-300"></div>

                        <div className="flex items-center gap-3">
                            <Settings className="w-8 h-8 text-blue-600" />
                            <h1 className="text-3xl font-bold text-gray-900">הגדרות</h1>
                        </div>
                    </div>
                    <p className="text-gray-600 mr-20">נהל את ההעדפות שלך במערכת</p>
                </div>

                {/* Alerts */}
                {success && (
                    <Alert className="mb-6 border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-600">{success}</AlertDescription>
                    </Alert>
                )}

                {error && (
                    <Alert className="mb-6 border-red-200 bg-red-50">
                        <AlertDescription className="text-red-600">{error}</AlertDescription>
                    </Alert>
                )}

                {/* Calendar Preferences */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            העדפות יומן
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label className="text-base font-medium text-gray-900 mb-4 block">
                                תצוגת ברירת מחדל ביומן
                            </Label>
                            <p className="text-sm text-gray-600 mb-4">
                                בחר איזה תצוגה תוצג כברירת מחדל כשאתה נכנס לטאב היומן
                            </p>

                            <div className="grid gap-3">
                                {calendarViewOptions.map((option) => (
                                    <label
                                        key={option.value}
                                        className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${preferences.default_calendar_view === option.value
                                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                            : 'border-gray-200'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="default_calendar_view"
                                            value={option.value}
                                            checked={preferences.default_calendar_view === option.value}
                                            onChange={(e) => setPreferences({
                                                ...preferences,
                                                default_calendar_view: e.target.value as CalendarView
                                            })}
                                            className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">{option.icon}</span>
                                                <span className="font-medium text-gray-900">{option.label}</span>
                                            </div>
                                            <p className="text-sm text-gray-600">{option.description}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button
                        onClick={savePreferences}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                שומר...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                שמור הגדרות
                            </>
                        )}
                    </Button>
                </div>

                {/* Footer Navigation */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowRight className="w-4 h-4" />
                        <span>חזור</span>
                    </button>
                </div>
            </div>
        </div>
    );
}