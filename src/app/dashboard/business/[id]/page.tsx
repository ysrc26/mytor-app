// src/app/dashboard/business/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useParams } from 'next/navigation';
import { Business, Service, Appointment, Availability, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateUniqueSlug } from '@/lib/slugUtils';
import {
    Calendar,
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
    ExternalLink,
    LogOut,
    Sparkles,
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';

export default function BusinessDashboard() {
    const params = useParams();
    const businessId = params.id as string;
    const [business, setBusiness] = useState<Business | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'services' | 'profile' | 'availability' | 'premium'>('overview');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // עריכת עסק
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

    const router = useRouter();
    const supabase = createClientComponentClient();

    useEffect(() => {
        if (businessId) {
            loadBusinessData();
        }
    }, [businessId]);

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
                router.push('/dashboard');
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" style={{ fontFamily: "'Heebo', 'Assistant', sans-serif", direction: 'rtl' }}>
            {/* Header */}
            <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg shadow-black/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/dashboard')}
                                className="p-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black bg-gradient-to-l from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                                    {business.name}
                                </h1>
                                <p className="text-sm text-gray-500 font-medium">ניהול עסק</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                onClick={() => window.open(`/${business.slug}`, '_blank')}
                                className="flex items-center gap-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                צפה בעמוד הציבורי
                            </Button>
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
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                                title="התנתק"
                            >
                                <LogOut className="w-5 h-5" />
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
                                { key: 'overview', label: 'סקירה', icon: BarChart },
                                { key: 'appointments', label: 'תורים', icon: Calendar },
                                { key: 'services', label: 'שירותים', icon: Sparkles },
                                { key: 'profile', label: 'פרטי עסק', icon: Settings },
                                { key: 'availability', label: 'זמינות', icon: Clock },
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
                        {activeTab === 'overview' && (
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-6">סקירת התורים של {business.name}</h3>

                                {appointments.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h4 className="text-lg font-semibold text-gray-900 mb-2">אין תורים עדיין</h4>
                                        <p className="text-gray-600 mb-6">שתף את הקישור הציבורי שלך כדי להתחיל לקבל בקשות תור</p>
                                        <button
                                            onClick={copyPublicLink}
                                            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
                                        >
                                            העתק קישור ציבורי
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {appointments.slice(0, 5).map((appointment) => (
                                            <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <Users className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{appointment.client_name}</p>
                                                        <p className="text-sm text-gray-600">{formatDate(appointment.date)} • {appointment.time}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                                                    {getStatusText(appointment.status)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'appointments' && (
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-6">ניהול תורים</h3>
                                <p className="text-gray-600 mb-4">כאן תוכל לראות ולנהל את כל התורים של {business.name}</p>
                                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                                    <p className="text-blue-800">🚧 בפיתוח - ממשק מלא לניהול תורים בקרוב</p>
                                </div>
                            </div>
                        )}
                        {activeTab === 'services' && (
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-6">ניהול שירותים</h3>
                                <p className="text-gray-600 mb-6">הגדר את השירותים שאתה מציע ללקוחות</p>

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
                                                                        <span>{service.duration_minutes} דקות</span>
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
                                                                onClick={() => deleteService(service.id)}
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
                                                <Label className="block text-sm font-medium text-gray-700 mb-2">משך זמן (דקות) *</Label>
                                                <Input
                                                    type="number"
                                                    value={newService.duration_minutes}
                                                    onChange={(e) => setNewService({
                                                        ...newService,
                                                        duration_minutes: parseInt(e.target.value) || 60
                                                    })}
                                                    placeholder="60"
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
                        {activeTab === 'profile' && (
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-6">פרטי העסק</h3>
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

                        {activeTab === 'availability' && (
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-6">ניהול זמינות</h3>
                                <p className="text-gray-600 mb-6">הגדר את הימים והשעות שבהם {business.name} זמין לקבל לקוחות</p>

                                <div className="space-y-6">
                                    <div className="bg-gray-50/50 rounded-2xl p-6">
                                        <h4 className="font-semibold text-gray-900 mb-4">זמינות שבועית נוכחית:</h4>
                                        {availability.length === 0 ? (
                                            <p className="text-gray-500 text-center py-8">לא הוגדרה זמינות עדיין</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {availability.map((avail) => (
                                                    <div key={avail.id} className="flex items-center justify-between bg-white p-4 rounded-xl">
                                                        <span className="font-medium">
                                                            יום {getDayName(avail.day_of_week)}: {avail.start_time} - {avail.end_time}
                                                        </span>
                                                        <button
                                                            onClick={() => deleteAvailability(avail.id)}
                                                            className="text-red-600 hover:text-red-800 p-2"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                        <h4 className="font-semibold text-gray-900 mb-4">הוסף זמינות חדשה:</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <Label className="block text-sm font-medium text-gray-700 mb-2">יום</Label>
                                                <select
                                                    value={newAvailability.day_of_week}
                                                    onChange={(e) => setNewAvailability({
                                                        ...newAvailability,
                                                        day_of_week: parseInt(e.target.value)
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                                                >
                                                    <option value={0}>ראשון</option>
                                                    <option value={1}>שני</option>
                                                    <option value={2}>שלישי</option>
                                                    <option value={3}>רביעי</option>
                                                    <option value={4}>חמישי</option>
                                                    <option value={5}>שישי</option>
                                                    <option value={6}>שבת</option>
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="block text-sm font-medium text-gray-700 mb-2">שעת התחלה</Label>
                                                <Input
                                                    type="time"
                                                    value={newAvailability.start_time}
                                                    onChange={(e) => setNewAvailability({
                                                        ...newAvailability,
                                                        start_time: e.target.value
                                                    })}
                                                />
                                            </div>
                                            <div>
                                                <Label className="block text-sm font-medium text-gray-700 mb-2">שעת סיום</Label>
                                                <Input
                                                    type="time"
                                                    value={newAvailability.end_time}
                                                    onChange={(e) => setNewAvailability({
                                                        ...newAvailability,
                                                        end_time: e.target.value
                                                    })}
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <Button
                                                    onClick={addAvailability}
                                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                                >
                                                    הוסף
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
        </div>
    );
}