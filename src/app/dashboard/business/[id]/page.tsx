// src/app/dashboard/business/[id]/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter, useParams } from 'next/navigation';
import { Business, Service, Appointment, Availability, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AvailabilityTable from '@/components/ui/AvailabilityTable';
import { generateUniqueSlug } from '@/lib/slugUtils';
import {
    Calendar,
    Phone,
    Settings,
    Clock,
    Users,
    BarChart,
    Crown,
    Lock,
    Copy,
    Check,
    Edit,
    Trash2,
    Plus,
    Bell,
    CreditCard,
    ChevronDown,
    ExternalLink,
    LogOut,
    Sparkles,
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    Loader2,
    ChevronLeft,
    Menu,
    X
} from 'lucide-react';

export default function BusinessDashboard() {
    const params = useParams();
    const businessId = params.id as string;
    const [business, setBusiness] = useState<Business | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [newAppointmentAlert, setNewAppointmentAlert] = useState<any>(null);
    const [realtimeConnected, setRealtimeConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'calendar' | 'appointments' | 'premium'>('pending');
    const [sideNavOpen, setSideNavOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<'services' | 'profile' | 'availability' | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [editedBusiness, setEditedBusiness] = useState({
        name: '',
        slug: '',
        description: '',
        terms: ''
    });

    // שירות חדש
    const [newService, setNewService] = useState({
        name: '',
        description: '',
        price: '',
        duration_minutes: 60
    });

    // זמינות חדשה
    const [newAvailability, setNewAvailability] = useState({
        day_of_week: 0,
        start_time: '09:00',
        end_time: '17:00'
    });
    const subscriptionRef = useRef<any>(null);

    useEffect(() => {
        if (businessId) {
            loadBusinessData();
        }
    }, [businessId]);

    // פונקציה לטיפול במקש ESC
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && sideNavOpen) {
                closeSideNav();
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [sideNavOpen]);

    // הגדרת subscription לRealtime
    useEffect(() => {
        if (!businessId || !user?.id) return;

        console.log('Setting up realtime subscription for business:', businessId);

        // ניקוי subscription קודם אם קיים
        if (subscriptionRef.current) {
            console.log('Cleaning up previous subscription');
            supabase.removeChannel(subscriptionRef.current);
        }

        // יצירת subscription חדש
        const channel = supabase
            .channel(`business-${businessId}-appointments`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'appointments',
                    filter: `business_id=eq.${businessId}`
                },
                (payload) => {
                    console.log('🎉 New appointment received!', payload.new);
                    const newAppointment = payload.new as Appointment;

                    // הוספת התור החדש לרשימה
                    setAppointments(prev => [newAppointment, ...prev]);

                    // הצגת התראה
                    setNewAppointmentAlert(newAppointment);

                    // הסתרת ההתראה אחרי 60 שניות
                    setTimeout(() => setNewAppointmentAlert(null), 60000);

                    // השמעת צליל (אם יש הרשאה)
                    try {
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('🎯 תור חדש!', {
                                body: `${newAppointment.client_name} ביקש תור`,
                                icon: '/favicon.ico',
                                tag: 'new-appointment',
                                requireInteraction: true
                            });
                        }

                        // השמעת צליל פשוט
                        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAUCU+h7fG1aRUILXzN8rNjGgU+ldbywHkpBTKCz/LKdSsFK3fJ8N2QQAoRZrDq7qhWFAxPn+HyvmATE0ek6fG3bBoCNX7K8L9oGQU2jdH0xn8tBSpzxPDVjD0IFWi56+WjTwwNUajh8bBjFgY7k9n1vnEpBTJ9yvK9YhUJOIbO8sN1JwU2hdPyvmYdBi6Bz/PAaiUEOYPL9dpzJAUmcsDy2I4+CRVptuvmnUkLDF2o4PK2YxYGOpPZ9b9xKQU0fcP1wGIVCTmGzPLEeTEHL3fH8N+OQAoPZLTo65pTEgxMpOPwtGITB0CT1/W9cSgEOoXQ9L9qGgUtgM7ywHAjBS5/z/LDdygCOpHI9t5zJgQoer7y3I4/CRZqtevmoU4LDF2o4PKxYRUHPJDY9r9xKAU7fMr1wGMTCziGzPLEeCsLL3bH8N2OQAoOZLTo65pTEgxNpOPxs2ETB0GT1/W9cSgEOoXQ9L9qGgYtgM7ywHAjBS5/z/LDdygCPJHI9t5zJgUpeb7y3I4/CRZqtevmoU4LDF2o4PKxYRUHP5DY9r9xKAU7fMr1wGMTCzqGzPLEeCsLL3bH8N2OQAoOZLTo65pTEgxNpOPxs2ETB0GT1/W9cSgEOoXQ9L9qGgYtgM7ywHAjBS5/z/LDdygCO5HI9t5zJgUpeb7y3I4/CRZqtevmoU4LDF2o4PKxYRUHP5DY9r9xKAU7fMr1wGMTCzqGzPLEeCsLL3bH8N2OQAoOZLTo65pTEgxNpOPxs2ETB0GT1/W9cSgEOoXQ9L9qGgYtgM7ywHAjBS5/z/LDdygCO5HI9t5zJgUpeb7y3I4/CRZqtevmoU4LDF2o4PKxYRUHP5DY9r9xKAU7fMr1wGMTCzqGzPLEeCsLL3bH8N2OQAoOZLTo65pTEgxNpOPxs2ETB0GT1/W9cSgEOoXQ9L9qGgYtgM7ywHAjBS5/z/LDdygCO5HI9t5zJgUpeb7y3I4/CRZqtevmoU4LDF2o4PKxYRUHP5DY9r9xKAU7fMr1wGMTCzqGzPLEeCsLL3bH8N2OQAoOZLTo65pTEgxNpOPxs2ETB0GT1/W9cSgEOoXQ9L9qGgYtgM7ywHAjBS5/z/LDdygCO5HI9t5zJgUpeb7y3I4/CRZqtevmoU4LDh');
                        audio.volume = 0.3;
                        audio.play().catch(() => { }); // אל תצעק אם לא הצליח
                    } catch (error) {
                        console.log('Notification/sound not available:', error);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'appointments',
                    filter: `business_id=eq.${businessId}`
                },
                (payload) => {
                    console.log('📝 Appointment updated!', payload.new);
                    const updatedAppointment = payload.new as Appointment;

                    // עדכון התור ברשימה
                    setAppointments(prev =>
                        prev.map(apt =>
                            apt.id === updatedAppointment.id ? updatedAppointment : apt
                        )
                    );
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'appointments',
                    filter: `business_id=eq.${businessId}`
                },
                (payload) => {
                    console.log('🗑️ Appointment deleted!', payload.old);
                    const deletedId = payload.old.id;

                    // הסרת התור מהרשימה
                    setAppointments(prev =>
                        prev.filter(apt => apt.id !== deletedId)
                    );
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status);
                setRealtimeConnected(status === 'SUBSCRIBED');
            });

        subscriptionRef.current = channel;

        // בקשת הרשאות התראות
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('Notification permission:', permission);
            });
        }

        // ניקוי subscription כשהקומפוננט נמחק או הbusinessId משתנה
        return () => {
            console.log('Cleaning up realtime subscription');
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
                subscriptionRef.current = null;
            }
        };
    }, [businessId, user?.id]); // dependencies

    // פונקציה לטיפול במקש ESC למודל
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (modalOpen) {
                    closeModal(); // סוגר קודם את המודל
                } else if (sideNavOpen) {
                    closeSideNav(); // אם אין מודל, סוגר את הניווט
                }
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [modalOpen, sideNavOpen]);

    // הסתרת הודעות
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const router = useRouter();
    const supabase = createClient();

    // סגירת side navigation
    const closeSideNav = () => {
        setSideNavOpen(false);
    };

    // פונקציה לטיפול בלחיצה על overlay
    const handleOverlayClick = () => {
        closeSideNav();
    };

    // פתיחת modal עם תוכן ספציפי
    const openModal = (content: 'services' | 'profile' | 'availability') => {
        setModalContent(content);
        setModalOpen(true);
        // לא סוגרים את הניווט - נשאר פתוח אבל מטושטש
    };

    // סגירת modal
    const closeModal = () => {
        setModalOpen(false);
        setModalContent(null);
    };

    // פונקציה לטעינת כל הנתונים הדרושים לעסק
    const loadBusinessData = async () => {
        await Promise.all([
            fetchBusiness(),
            fetchAppointments(),
            fetchAvailability(),
            fetchServices(),
            fetchUser()
        ]);
        setLoading(false);
    };

    // פונקציה לטעינת פרטי העסק
    const fetchBusiness = async () => {
        try {
            const response = await fetch(`/api/businesses/${businessId}`);
            if (response.ok) {
                const data = await response.json();
                setBusiness(data);
                setEditedBusiness({
                    name: data.name,
                    slug: data.slug,
                    description: data.description || '',
                    terms: data.terms || ''
                });
            } else if (response.status === 404) {
                router.push('/dashboard/redirect');
            }
        } catch (error) {
            console.error('Error fetching business:', error);
        }
    };

    // פונקציה לטעינת שירותים
    const fetchServices = async () => {
        try {
            const response = await fetch(`/api/businesses/${businessId}/services`);
            if (response.ok) {
                const data = await response.json();
                setServices(data);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    // פונקציה לטעינת נתוני משתמש
    const fetchUser = async () => {
        try {
            const response = await fetch('/api/users/me');
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    };

    const fetchAppointments = async () => {
        try {
            const response = await fetch(`/api/businesses/${businessId}/appointments`);
            if (response.ok) {
                const data = await response.json();
                setAppointments(data);
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    const fetchAvailability = async () => {
        try {
            const response = await fetch(`/api/businesses/${businessId}/availability`);
            if (response.ok) {
                const data = await response.json();
                setAvailability(data);
            }
        } catch (error) {
            console.error('Error fetching availability:', error);
        }
    };

    const saveBusiness = async () => {
        setSaving(true);
        setError(null);

        try {
            const response = await fetch(`/api/businesses/${businessId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editedBusiness)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'שגיאה בשמירה');
            }

            const updatedBusiness = await response.json();
            setBusiness(updatedBusiness);
            setSuccess('העסק עודכן בהצלחה');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'שגיאה בשמירה');
        } finally {
            setSaving(false);
        }
    };

    // פונקציה ליצירת slug ייחודי
    const generateSlug = async () => {
        if (!editedBusiness.name.trim()) {
            setError('יש למלא שם עסק קודם');
            return;
        }

        try {
            const newSlug = await generateUniqueSlug(editedBusiness.name, editedBusiness.slug);
            setEditedBusiness({
                ...editedBusiness,
                slug: newSlug
            });
        } catch (error) {
            setError('שגיאה ביצירת slug');
        }
    };

    const addAvailability = async () => {
        try {
            const response = await fetch(`/api/businesses/${businessId}/availability`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAvailability)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'שגיאה בהוספת זמינות');
            }

            setSuccess('זמינות נוספה בהצלחה');
            setNewAvailability({ day_of_week: 0, start_time: '09:00', end_time: '17:00' });
            await fetchAvailability();

        } catch (err) {
            setError(err instanceof Error ? err.message : 'שגיאה בהוספת זמינות');
        }
    };

    const deleteAvailability = async (availId: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק זמינות זו?')) return;

        try {
            const response = await fetch(`/api/businesses/${businessId}/availability/${availId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('שגיאה במחיקת זמינות');
            }

            setSuccess('זמינות נמחקה בהצלחה');
            await fetchAvailability();

        } catch (err) {
            setError('שגיאה במחיקת זמינות');
        }
    };

    const addService = async () => {
        if (!newService.name.trim()) {
            setError('יש למלא שם שירות');
            return;
        }

        try {
            const response = await fetch(`/api/businesses/${businessId}/services`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newService.name,
                    description: newService.description,
                    price: newService.price ? parseFloat(newService.price) : null,
                    duration_minutes: newService.duration_minutes
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'שגיאה בהוספת שירות');
            }

            setSuccess('שירות נוסף בהצלחה');
            setNewService({ name: '', description: '', price: '', duration_minutes: 60 });
            await fetchServices();

        } catch (err) {
            setError(err instanceof Error ? err.message : 'שגיאה בהוספת שירות');
        }
    };

    const deleteService = async (serviceId: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק שירות זה?')) return;

        try {
            const response = await fetch(`/api/businesses/${businessId}/services/${serviceId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('שגיאה במחיקת שירות');
            }

            setSuccess('שירות נמחק בהצלחה');
            await fetchServices();

        } catch (err) {
            setError('שגיאה במחיקת שירות');
        }
    };

    const copyPublicLink = async () => {
        if (business?.slug) {
            const link = `${window.location.origin}/${business.slug}`;
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // פונקציה להצגת משך השירות בטקסט ידידותי
    const formatDuration = (minutes: number): string => {
        if (minutes < 60) return `${minutes} דקות`;
        if (minutes % 60 === 0) {
            const hours = minutes / 60;
            return hours === 1 ? 'שעה' : `${hours} שעות`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return hours === 1 ? `שעה ו${remainingMinutes} דקות` : `${hours} שעות ו${remainingMinutes} דקות`;
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('he-IL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'declined': return 'bg-red-100 text-red-800';
            case 'cancelled': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'ממתין';
            case 'confirmed': return 'אושר';
            case 'declined': return 'נדחה';
            case 'cancelled': return 'בוטל';
            default: return status;
        }
    };

    const getDayName = (dayNumber: number) => {
        const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
        return days[dayNumber];
    };



    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center" style={{ fontFamily: "'Heebo', 'Assistant', sans-serif", direction: 'rtl' }}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">טוען את נתוני העסק...</p>
                </div>
            </div>
        );
    }

    if (!business) return null;

    const pendingCount = appointments.filter(apt => apt.status === 'pending').length;
    const confirmedCount = appointments.filter(apt => apt.status === 'confirmed').length;
    const totalAppointments = appointments.length;

    // פונקציה לעדכון סטטוס תור
    const updateAppointmentStatus = async (appointmentId: string, newStatus: 'confirmed' | 'declined' | 'cancelled') => {
        try {
            const response = await fetch(`/api/appointments/${appointmentId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'שגיאה בעדכון סטטוס התור');
            }

            // עדכון מקומי של הרשימה
            setAppointments(appointments.map(apt =>
                apt.id === appointmentId
                    ? { ...apt, status: newStatus }
                    : apt
            ));

            // הודעת הצלחה
            const statusText = {
                'confirmed': 'אושר',
                'declined': 'נדחה',
                'cancelled': 'בוטל'
            }[newStatus];

            setSuccess(`התור ${statusText} בהצלחה`);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'שגיאה בעדכון סטטוס התור');
        }
    };

    // פונקציה לסגירת התראה על תור חדש
    const dismissAlert = () => setNewAppointmentAlert(null);

    // קומפוננטת התראה על תור חדש
    const NewAppointmentAlert = ({ appointment, onDismiss }: { appointment: any; onDismiss: () => void }) => {
        if (!appointment) return null;

        return (
            <div className="fixed top-4 left-4 z-50 animate-in slide-in-from-left duration-500">
                <div className="bg-white border-2 border-green-200 rounded-2xl shadow-2xl p-6 min-w-80 max-w-sm">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-green-800 text-lg">תור חדש! 🎉</h4>
                                <p className="text-green-600 text-sm">התקבלה בקשה חדשה</p>
                            </div>
                        </div>
                        <button
                            onClick={onDismiss}
                            className="text-gray-400 hover:text-gray-600 p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{appointment.client_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">{appointment.client_phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">{appointment.date} • {appointment.time}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => {
                                updateAppointmentStatus(appointment.id, 'confirmed');
                                onDismiss();
                            }}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" />
                            אשר
                        </button>
                        <button
                            onClick={() => {
                                updateAppointmentStatus(appointment.id, 'declined');
                                onDismiss();
                            }}
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <AlertCircle className="w-4 h-4" />
                            דחה
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" style={{ fontFamily: "'Heebo', 'Assistant', sans-serif", direction: 'rtl' }}>
            {/* new appointment alert */}
            <NewAppointmentAlert
                appointment={newAppointmentAlert}
                onDismiss={dismissAlert}
            />
            {/* Header */}
            <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg shadow-black/5">
                <div className="max-w-7xl mx-auto px-6">
                    {/* אינדיקטור Realtime */}
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs text-gray-500">
                            {realtimeConnected ? 'מחובר' : 'לא מחובר'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-4">
                            {/* Side Navigation */}
                            <button
                                onClick={() => setSideNavOpen(true)}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 flex items-center gap-2"
                                title="ניהול עסק"
                            >
                                <Menu className="w-5 h-5" />
                                <span className="text-sm font-medium hidden md:block">ניהול עסק</span>
                            </button>
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black bg-gradient-to-l from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                                    {business.name}
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* פרופיל משתמש */}
                            <button
                                onClick={() => router.push('/dashboard/profile')}
                                className="flex items-center gap-2 hover:bg-gray-50 rounded-xl p-2 transition-colors"
                            >
                                {user?.profile_pic ? (
                                    <img
                                        src={user.profile_pic}
                                        alt={user?.full_name}
                                        className="w-8 h-8 rounded-full object-cover border-2 border-blue-200"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                                        {user?.full_name.charAt(0)}
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* הודעות */}
                {error && (
                    <Alert className="mb-6 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="mb-6 border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                )}

                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">ברוך הבא לעסק {business.name}! 👋</h2>
                    <p className="text-gray-600">נהל את התורים, הזמינות והלקוחות שלך</p>
                </div>

                {/* Public Link Card */}
                <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-3xl p-6 mb-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold mb-2">הקישור הציבורי של {business.name} מוכן! 🎉</h3>
                            <p className="text-blue-100 mb-4">שתף את הקישור הזה עם הלקוחות שלך כדי שיוכלו להזמין תורים</p>
                            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 font-mono text-sm">
                                mytor.app/{business.slug}
                            </div>
                        </div>
                        <button
                            onClick={copyPublicLink}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-2xl font-semibold transition-all duration-200 flex items-center gap-2"
                        >
                            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            {copied ? 'הועתק!' : 'העתק קישור'}
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-medium">בקשות ממתינות</p>
                                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-medium">תורים מאושרים</p>
                                <p className="text-3xl font-bold text-green-600">{confirmedCount}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                                <Check className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-medium">סה"כ בקשות</p>
                                <p className="text-3xl font-bold text-blue-600">{totalAppointments}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                                <BarChart className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/50 shadow-xl mb-8">
                    <div className="border-b border-gray-200/50">
                        <nav className="flex">
                            {[
                                { key: 'pending', label: 'ממתין לאישור', icon: Clock },
                                { key: 'calendar', label: 'יומן', icon: Calendar },
                                { key: 'appointments', label: 'תורים', icon: Users },
                                { key: 'premium', label: 'פרימיום', icon: Crown }
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all duration-200 ${activeTab === tab.key
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-600 hover:text-blue-600'
                                        }`}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'pending' && (
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-6">תורים ממתינים לאישור</h3>

                                {/* פילטר רק תורים pending */}
                                {(() => {
                                    const pendingAppointments = appointments.filter(apt => apt.status === 'pending');

                                    return pendingAppointments.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">אין בקשות תור ממתינות</h4>
                                            <p className="text-gray-600 mb-6">כל הבקשות החדשות יופיעו כאן לאישור או דחייה</p>
                                            <button
                                                onClick={copyPublicLink}
                                                className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
                                            >
                                                העתק קישור ציבורי
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {pendingAppointments.map((appointment) => (
                                                <div key={appointment.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                                                <Users className="w-6 h-6 text-yellow-600" />
                                                            </div>
                                                            <div>
                                                                <h5 className="font-semibold text-gray-900 text-lg">{appointment.client_name}</h5>
                                                                <p className="text-gray-600 mb-1">📞 {appointment.client_phone}</p>
                                                                <p className="text-gray-600 mb-1">📅 {formatDate(appointment.date)} • ⏰ {appointment.time}</p>
                                                                {(appointment as any).services?.name && (
                                                                    <p className="text-blue-600 font-medium">🎯 {(appointment as any).services.name}</p>
                                                                )}
                                                                {appointment.note && (
                                                                    <p className="text-gray-500 text-sm mt-2 bg-gray-50 p-2 rounded-lg">
                                                                        💬 {appointment.note}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                                                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                                אשר
                                                            </button>
                                                            <button
                                                                onClick={() => updateAppointmentStatus(appointment.id, 'declined')}
                                                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
                                                            >
                                                                <AlertCircle className="w-4 h-4" />
                                                                דחה
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* סטטיסטיקה */}
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mt-6">
                                                <div className="flex items-center gap-3">
                                                    <Clock className="w-6 h-6 text-yellow-600" />
                                                    <div>
                                                        <p className="font-semibold text-yellow-800">
                                                            {pendingAppointments.length} בקשות ממתינות לטיפול
                                                        </p>
                                                        <p className="text-yellow-700 text-sm">
                                                            זכור לטפל בבקשות במהירות כדי לשמור על חוויה טובה ללקוחות
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                        {activeTab === 'calendar' && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-900">יומן תורים</h3>

                                    {/* בחירת תצוגה */}
                                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                                        {[
                                            { key: 'day', label: 'יום' },
                                            { key: 'three-days', label: '3 ימים' },
                                            { key: 'week', label: 'שבוע' },
                                            { key: 'work-days', label: 'ימי עבודה' },
                                            { key: 'month', label: 'חודש' }
                                        ].map((view) => (
                                            <button
                                                key={view.key}
                                                onClick={() => {/* TODO: set calendar view */ }}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view.key === 'week' // ברירת מחדל שבועית
                                                    ? 'bg-white text-blue-600 shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                                    }`}
                                            >
                                                {view.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* תצוגת יומן זמנית */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                    <div className="text-center py-12">
                                        <Calendar className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                                        <h4 className="text-lg font-semibold text-gray-900 mb-2">תצוגת יומן מתקדמת</h4>
                                        <p className="text-gray-600 mb-4">
                                            כאן תוצג תצוגת יומן שבועית עם כל התורים שלך
                                        </p>
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto">
                                            <h5 className="font-semibold text-blue-900 mb-2">תכונות מתוכננות:</h5>
                                            <ul className="text-blue-800 text-sm space-y-1 text-right">
                                                <li>• תצוגה שבועית אינטראקטיבית</li>
                                                <li>• גרירה ושחרור של תורים</li>
                                                <li>• תצוגת ימי עבודה בלבד</li>
                                                <li>• סנכרון עם Google Calendar (פרימיום)</li>
                                                <li>• הוספת תורים ידנית</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* תצוגה זמנית של התורים */}
                                    {appointments.length > 0 && (
                                        <div className="mt-8">
                                            <h5 className="font-semibold text-gray-900 mb-4">התורים הקרובים:</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {appointments
                                                    .filter(apt => apt.status === 'confirmed')
                                                    .slice(0, 6)
                                                    .map((appointment) => (
                                                        <div key={appointment.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-gray-900">{appointment.client_name}</p>
                                                                    <p className="text-sm text-gray-600">
                                                                        {formatDate(appointment.date)} • {appointment.time}
                                                                    </p>
                                                                    {(appointment as any).services.name && (
                                                                        <p className="text-xs text-blue-600 mt-1">{(appointment as any).services.name}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === 'appointments' && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-900">כל התורים</h3>

                                    {/* פילטרים */}
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                                            {[
                                                { key: 'confirmed', label: 'מאושרים', count: appointments.filter(apt => apt.status === 'confirmed').length },
                                                { key: 'declined', label: 'נדחו', count: appointments.filter(apt => apt.status === 'declined').length },
                                                { key: 'cancelled', label: 'בוטלו', count: appointments.filter(apt => apt.status === 'cancelled').length },
                                                { key: 'all', label: 'הכל', count: appointments.length }
                                            ].map((filter) => (
                                                <button
                                                    key={filter.key}
                                                    onClick={() => {/* TODO: set filter */ }}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filter.key === 'confirmed' // ברירת מחדל מאושרים
                                                        ? 'bg-white text-blue-600 shadow-sm'
                                                        : 'text-gray-600 hover:text-gray-900'
                                                        }`}
                                                >
                                                    {filter.label}
                                                    <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full text-xs">
                                                        {filter.count}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {(() => {
                                    // ברירת מחדל: רק תורים מאושרים, ממוינים לפי תאריך
                                    const filteredAppointments = appointments
                                        .filter(apt => apt.status === 'confirmed') // TODO: החלף בהתאם לפילטר שנבחר
                                        .sort((a, b) => {
                                            const dateA = new Date(`${a.date} ${a.time}`);
                                            const dateB = new Date(`${b.date} ${b.time}`);
                                            return dateA.getTime() - dateB.getTime(); // מיון עולה - הקרוב ביותר קודם
                                        });

                                    return filteredAppointments.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">אין תורים מאושרים</h4>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {filteredAppointments.map((appointment, index) => {
                                                const appointmentDate = new Date(`${appointment.date} ${appointment.time}`);
                                                const now = new Date();
                                                const isPast = appointmentDate < now;
                                                const isToday = appointment.date === now.toISOString().split('T')[0];
                                                const isUpcoming = appointmentDate > now && !isToday;

                                                return (
                                                    <div
                                                        key={appointment.id}
                                                        className={`bg-white border rounded-2xl p-6 shadow-sm transition-all hover:shadow-md ${isPast ? 'opacity-75 border-gray-200' :
                                                            isToday ? 'border-orange-300 bg-orange-50' :
                                                                'border-gray-200'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                {/* אינדיקטור סטטוס */}
                                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${appointment.status === 'confirmed' ? 'bg-green-100' :
                                                                    appointment.status === 'declined' ? 'bg-red-100' :
                                                                        appointment.status === 'cancelled' ? 'bg-gray-100' :
                                                                            'bg-yellow-100'
                                                                    }`}>
                                                                    {appointment.status === 'confirmed' ? (
                                                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                                                    ) : appointment.status === 'declined' ? (
                                                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                                                    ) : (
                                                                        <Clock className="w-6 h-6 text-gray-600" />
                                                                    )}
                                                                </div>

                                                                <div>
                                                                    <div className="flex items-center gap-3 mb-1">
                                                                        <h5 className="font-semibold text-gray-900 text-lg">{appointment.client_name}</h5>
                                                                        {isToday && (
                                                                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                                                                                היום
                                                                            </span>
                                                                        )}
                                                                        {isPast && (
                                                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                                                                                עבר
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center gap-4 text-gray-600 text-sm">
                                                                        <span>📞 {appointment.client_phone}</span>
                                                                        <span>📅 {formatDate(appointment.date)}</span>
                                                                        <span>⏰ {appointment.time}</span>
                                                                    </div>

                                                                    {(appointment as any).services.name && (
                                                                        <p className="text-blue-600 font-medium text-sm mt-1">
                                                                            🎯 {(appointment as any).services.name}
                                                                        </p>
                                                                    )}

                                                                    {appointment.note && (
                                                                        <p className="text-gray-500 text-sm mt-2 bg-gray-50 p-2 rounded-lg max-w-md">
                                                                            💬 {appointment.note}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                {/* סטטוס */}
                                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                                                                    {getStatusText(appointment.status)}
                                                                </span>

                                                                {/* פעולות */}
                                                                <div className="flex gap-2">
                                                                    {appointment.status === 'confirmed' && !isPast && (
                                                                        <button
                                                                            onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                                                            className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                                            title="בטל תור"
                                                                        >
                                                                            <AlertCircle className="w-4 h-4" />
                                                                        </button>
                                                                    )}

                                                                    <button
                                                                        onClick={() => {/* TODO: עריכת תור */ }}
                                                                        className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                                                        title="ערוך תור"
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* סטטיסטיקה */}
                                            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-6">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                                    <div>
                                                        <p className="text-2xl font-bold text-blue-600">
                                                            {appointments.filter(apt => apt.status === 'confirmed').length}
                                                        </p>
                                                        <p className="text-blue-800 text-sm">תורים מאושרים</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-bold text-orange-600">
                                                            {appointments.filter(apt => {
                                                                const today = new Date().toISOString().split('T')[0];
                                                                return apt.date === today && apt.status === 'confirmed';
                                                            }).length}
                                                        </p>
                                                        <p className="text-orange-800 text-sm">תורים היום</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-bold text-green-600">
                                                            {appointments.filter(apt => {
                                                                const aptDate = new Date(`${apt.date} ${apt.time}`);
                                                                const now = new Date();
                                                                return aptDate > now && apt.status === 'confirmed';
                                                            }).length}
                                                        </p>
                                                        <p className="text-green-800 text-sm">תורים קרובים</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                        {activeTab === 'premium' && (
                            <div>
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Crown className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">שדרג לפרימיום</h3>
                                    <p className="text-gray-600">פתח תכונות מתקדמות ושפר את החוויה לך וללקוחות שלך</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Free Features */}
                                    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-gray-200">
                                        <h4 className="text-lg font-bold text-gray-900 mb-4">התוכנית הנוכחית - חינם</h4>
                                        <ul className="space-y-3">
                                            <li className="flex items-center gap-3">
                                                <Check className="w-5 h-5 text-green-500" />
                                                <span>עד 10 תורים בחודש</span>
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <Check className="w-5 h-5 text-green-500" />
                                                <span>עמוד עסקי בסיסי</span>
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <Check className="w-5 h-5 text-green-500" />
                                                <span>התראות באימייל</span>
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <Check className="w-5 h-5 text-green-500" />
                                                <span>מיתוג MyTor</span>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Premium Features */}
                                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-6 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                                        <div className="relative">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Crown className="w-6 h-6" />
                                                <h4 className="text-lg font-bold">פרימיום - ₪9.90/חודש</h4>
                                            </div>
                                            <ul className="space-y-3 mb-6">
                                                <li className="flex items-center gap-3">
                                                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                                        <Sparkles className="w-3 h-3" />
                                                    </div>
                                                    <span>תורים ללא הגבלה</span>
                                                </li>
                                                <li className="flex items-center gap-3">
                                                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                                        <Lock className="w-3 h-3" />
                                                    </div>
                                                    <span>הסרת מיתוג MyTor</span>
                                                </li>
                                                <li className="flex items-center gap-3">
                                                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                                        <Bell className="w-3 h-3" />
                                                    </div>
                                                    <span>התראות SMS</span>
                                                </li>
                                                <li className="flex items-center gap-3">
                                                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                                        <CreditCard className="w-3 h-3" />
                                                    </div>
                                                    <span>חיבור לתשלומים</span>
                                                </li>
                                                <li className="flex items-center gap-3">
                                                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                                        <BarChart className="w-3 h-3" />
                                                    </div>
                                                    <span>אנליטיקה מתקדמת</span>
                                                </li>
                                            </ul>
                                            <button className="w-full bg-white text-blue-600 px-6 py-3 rounded-2xl font-bold hover:bg-gray-100 transition-colors">
                                                שדרג עכשיו
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Locked Features Preview */}
                                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { icon: Bell, title: 'התראות SMS', desc: 'שלח תזכורות ללקוחות' },
                                        { icon: BarChart, title: 'אנליטיקה', desc: 'נתונים מפורטים על העסק' },
                                        { icon: CreditCard, title: 'תשלומים', desc: 'קבל תשלומים מראש' }
                                    ].map((feature, index) => (
                                        <div key={index} className="bg-gray-100 rounded-2xl p-4 opacity-60 relative">
                                            <div className="absolute top-2 right-2">
                                                <Lock className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <feature.icon className="w-8 h-8 text-gray-400 mb-3" />
                                            <h5 className="font-semibold text-gray-700 mb-1">{feature.title}</h5>
                                            <p className="text-sm text-gray-500">{feature.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Side Navigation Overlay */}
            {sideNavOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                    onClick={handleOverlayClick}
                />
            )}

            {/* Side Navigation */}
            <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50
            ${sideNavOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header של Side Nav */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold">ניהול עסק</h3>
                            <p className="text-blue-100 text-sm">{business.name}</p>
                        </div>
                        <button
                            onClick={closeSideNav}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* תפריט הניווט */}
                <div className="p-4">
                    <nav className="space-y-2">
                        {[
                            { key: 'profile', label: 'פרטי עסק', icon: Settings, desc: 'עדכן מידע וקישורים' },
                            { key: 'services', label: 'שירותים', icon: Sparkles, desc: 'הוסף ועדכן שירותים' },
                            { key: 'availability', label: 'זמינות', icon: Clock, desc: 'הגדר שעות פעילות' }
                        ].map((item) => (
                            <button
                                key={item.key}
                                onClick={() => {
                                    // סגירת Side Nav ופתיחת המודאל המתאים
                                    // סגירת Side Nav TODO
                                    openModal(item.key as 'services' | 'profile' | 'availability');
                                }}
                                className={`w-full text-right p-4 rounded-xl transition-all duration-200 group
                                ${modalContent === item.key && modalOpen
                                        ? 'bg-blue-50 border-2 border-blue-200 text-blue-900'
                                        : 'hover:bg-gray-50 border-2 border-transparent text-gray-700 hover:text-gray-900'
                                    }
                            `}>
                                <div className="flex items-center gap-3">
                                    <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                            ${modalContent === item.key && modalOpen
                                            ? 'bg-blue-200 text-blue-700'
                                            : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                        }
                                   `}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold">{item.label}</h4>
                                        <p className="text-sm opacity-70">{item.desc}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </nav>

                    {/* מידע נוסף */}
                    <div className="mt-8 p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">מצב העסק</p>
                                <p className="text-sm text-gray-600">פעיל ומקבל תורים</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>שירותים פעילים:</span>
                                <span className="font-medium">{services.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>ימי עבודה:</span>
                                <span className="font-medium">{availability.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* קישור מהיר לעמוד הציבורי */}
                    <div className="mt-4">
                        <button
                            onClick={() => {
                                window.open(`/${business.slug}`, '_blank');
                                closeSideNav();
                            }}
                            className="w-full p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                            צפה בעמוד הציבורי
                        </button>
                    </div>
                    {/* פריצת קו */}
                    <div className="border-t border-gray-200 my-6"></div>

                    {/* פרופיל משתמש */}
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                router.push('/dashboard/profile');
                                closeSideNav();
                            }}
                            className="w-full text-right p-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                            <div className="flex items-center gap-3">
                                {user?.profile_pic ? (
                                    <img
                                        src={user.profile_pic}
                                        alt={user?.full_name}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                                        {user?.full_name?.charAt(0)}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{user?.full_name}</h4>
                                    <p className="text-sm text-gray-600">פרופיל אישי</p>
                                </div>
                            </div>
                            <ChevronLeft className="w-4 h-4 text-gray-400" />
                        </button>

                        {/* דשבורד ראשי */}
                        <button
                            onClick={() => {
                                router.push('/dashboard');
                                closeSideNav();
                            }}
                            className="w-full text-right p-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                                <BarChart className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">דשבורד ראשי</h4>
                                <p className="text-sm text-gray-600">כל העסקים שלי</p>
                            </div>
                            <ChevronLeft className="w-4 h-4 text-gray-400" />
                        </button>

                        {/* התנתקות */}
                        <button
                            onClick={handleLogout}
                            className="w-full text-right p-3 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600 hover:text-red-700"
                        >
                            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                <LogOut className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold">התנתק</h4>
                                <p className="text-sm text-red-500">יציאה מהמערכת</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
            {/* Modal section */}
            {modalOpen && (
                <>
                    {/* Modal Overlay - מטשטש הכל כולל הניווט */}
                    <div
                        className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
                        onClick={closeModal}
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()} // מונע סגירה בלחיצה על המודל עצמו
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        {modalContent === 'services' && 'שירותים'}
                                        {modalContent === 'profile' && 'פרטי העסק'}
                                        {modalContent === 'availability' && 'זמינות'}
                                    </h2>
                                    <p className="text-blue-100 mt-1">
                                        {modalContent === 'services' && 'הוסף, ערוך ונהל את השירותים שלך'}
                                        {modalContent === 'profile' && 'עדכן את פרטי העסק והקישור הציבורי'}
                                        {modalContent === 'availability' && 'הגדר את שעות הפעילות שלך'}
                                    </p>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="p-3 hover:bg-white/20 rounded-xl transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
                                {modalContent === 'services' && (
                                    <div>
                                        {/* העתק את כל התוכן של activeTab === 'services' לכאן */}
                                        <div className="space-y-6">
                                            {/* רשימת שירותים קיימים */}
                                            <div className="bg-gray-50/50 rounded-2xl p-6">
                                                <h4 className="font-semibold text-gray-900 mb-4">השירותים שלך:</h4>
                                                {services.length === 0 ? (
                                                    <p className="text-gray-500 text-center py-8">לא הוגדרו שירותים עדיין</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {services.map((service) => (
                                                            <div key={service.id} className="flex items-center justify-between bg-white p-4 rounded-xl border">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-4">
                                                                        <div>
                                                                            <h5 className="font-medium text-gray-900">{service.name}</h5>
                                                                            {service.description && (
                                                                                <p className="text-sm text-gray-600">{service.description}</p>
                                                                            )}
                                                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                                                <span>{formatDuration(service.duration_minutes)}</span>
                                                                                {service.price && <span>₪{service.price}</span>}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => {/* TODO: עריכה */ }}
                                                                    >
                                                                        <Edit className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => deleteService(service.id.toString())}
                                                                        className="text-red-600 hover:text-red-700"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* הוספת שירות חדש */}
                                            <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                                <h4 className="font-semibold text-gray-900 mb-4">הוסף שירות חדש:</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="block text-sm font-medium text-gray-700 mb-2">שם השירות *</Label>
                                                        <Input
                                                            value={newService.name}
                                                            onChange={(e) => setNewService({
                                                                ...newService,
                                                                name: e.target.value
                                                            })}
                                                            placeholder="למשל: עיצוב גבות"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="block text-sm font-medium text-gray-700 mb-2">מחיר (₪)</Label>
                                                        <Input
                                                            type="number"
                                                            value={newService.price}
                                                            onChange={(e) => setNewService({
                                                                ...newService,
                                                                price: e.target.value
                                                            })}
                                                            placeholder="120"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="block text-sm font-medium text-gray-700 mb-2">משך השירות *</Label>
                                                        <DurationSelector
                                                            value={newService.duration_minutes}
                                                            onChange={(value) => setNewService({
                                                                ...newService,
                                                                duration_minutes: value
                                                            })}
                                                        />
                                                    </div>
                                                    <div className="flex items-end">
                                                        <Button
                                                            onClick={addService}
                                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            הוסף שירות
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <Label className="block text-sm font-medium text-gray-700 mb-2">תיאור השירות</Label>
                                                    <Textarea
                                                        value={newService.description}
                                                        onChange={(e) => setNewService({
                                                            ...newService,
                                                            description: e.target.value
                                                        })}
                                                        placeholder="תיאור קצר של השירות..."
                                                        rows={2}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {modalContent === 'profile' && (
                                    <div>
                                        {/* העתק את כל התוכן של activeTab === 'profile' לכאן */}
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <Label className="block text-sm font-semibold text-gray-700 mb-2">שם העסק</Label>
                                                    <Input
                                                        type="text"
                                                        value={editedBusiness.name}
                                                        onChange={(e) => setEditedBusiness({
                                                            ...editedBusiness,
                                                            name: e.target.value
                                                        })}
                                                        placeholder="שם העסק שלך"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        קישור אישי (slug)
                                                    </Label>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-gray-500 text-sm">mytor.app/</span>
                                                        <Input
                                                            type="text"
                                                            value={editedBusiness.slug}
                                                            onChange={(e) => setEditedBusiness({
                                                                ...editedBusiness,
                                                                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                                                            })}
                                                            className="flex-1"
                                                            placeholder="הקישור-שלך"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            onClick={generateSlug}
                                                            className="shrink-0"
                                                        >
                                                            🎲 הגרל
                                                        </Button>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        זה יהיה הקישור שהלקוחות שלך ישתמשו בו להזמנת תורים
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="block text-sm font-semibold text-gray-700 mb-2">תיאור העסק</Label>
                                                <Textarea
                                                    value={editedBusiness.description}
                                                    onChange={(e) => setEditedBusiness({
                                                        ...editedBusiness,
                                                        description: e.target.value
                                                    })}
                                                    className="h-32"
                                                    placeholder="ספר על העסק שלך, השירותים שאתה מציע ומה מיוחד בך..."
                                                />
                                            </div>

                                            <div>
                                                <Label className="block text-sm font-semibold text-gray-700 mb-2">תנאי שירות</Label>
                                                <Textarea
                                                    value={editedBusiness.terms}
                                                    onChange={(e) => setEditedBusiness({
                                                        ...editedBusiness,
                                                        terms: e.target.value
                                                    })}
                                                    className="h-32"
                                                    placeholder="תנאי ביטול, מדיניות תשלום וכו..."
                                                />
                                            </div>

                                            <Button
                                                onClick={saveBusiness}
                                                disabled={saving}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                                                {saving ? 'שומר...' : 'שמור שינויים'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {modalContent === 'availability' && (
                                    <div>
                                        {/* העתק את כל התוכן של activeTab === 'availability' לכאן */}
                                        <AvailabilityTable
                                            businessId={businessId}
                                            initialAvailability={availability}
                                            onSaveSuccess={fetchAvailability}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// רכיב לבחירת משך שירות
const DurationSelector = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
    const [isOpen, setIsOpen] = useState(false);

    const generateDurationOptions = () => {
        const options = [];
        for (let minutes = 15; minutes <= 480; minutes += 15) {
            let label;
            if (minutes < 60) {
                label = `${minutes} דקות`;
            } else if (minutes % 60 === 0) {
                const hours = minutes / 60;
                label = hours === 1 ? 'שעה' : `${hours} שעות`;
            } else {
                const hours = Math.floor(minutes / 60);
                const remainingMinutes = minutes % 60;
                label = hours === 1 ? `שעה ו${remainingMinutes} דקות` : `${hours} שעות ו${remainingMinutes} דקות`;
            }
            options.push({ value: minutes, label });
        }
        return options;
    };

    const options = generateDurationOptions();
    const selected = options.find(opt => opt.value === value);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 text-right bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
            >
                <span>{selected?.label || 'בחר משך זמן'}</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => { onChange(option.value); setIsOpen(false); }}
                            className={`w-full px-3 py-2 text-right hover:bg-blue-50 ${value === option.value ? 'bg-blue-100 font-medium' : ''}`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};