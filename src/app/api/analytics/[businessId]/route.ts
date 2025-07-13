// src/app/api/analytics/[businessId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    const { businessId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'month';

    // Verify business ownership
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, user_id, name')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single();

    if (businessError || !business) {
      return NextResponse.json({ error: 'עסק לא נמצא' }, { status: 404 });
    }

    // Check if user has business subscription (required for advanced analytics)
    const { data: subscription } = await supabase
      .from('subscribers')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (!subscription || subscription.subscription_tier !== 'business') {
      return NextResponse.json({ error: 'נדרש מנוי עסקי לאנליטיקה מתקדמת' }, { status: 403 });
    }

    // Calculate date ranges
    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        endDate = now;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
    }

    // Fetch appointments data
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        date,
        start_time,
        end_time,
        status,
        client_name,
        client_phone,
        service_id,
        created_at,
        services!left(id, name, price, duration_minutes)
      `)
      .eq('business_id', businessId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      return NextResponse.json({ error: 'שגיאה בשליפת נתוני תורים' }, { status: 500 });
    }

    // Fetch services data
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true);

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      return NextResponse.json({ error: 'שגיאה בשליפת נתוני שירותים' }, { status: 500 });
    }

    // Calculate analytics on the server (optional - can also be done on client)
    const analytics = calculateAnalytics(appointments || [], services || [], { startDate, endDate });

    return NextResponse.json({
      success: true,
      data: {
        business,
        appointments: appointments || [],
        services: services || [],
        analytics,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          range: timeRange
        }
      }
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}

// ===================================
// 🔢 Analytics Calculation Functions
// ===================================

interface AnalyticsResult {
  summary: {
    totalAppointments: number;
    confirmedAppointments: number;
    pendingAppointments: number;
    cancelledAppointments: number;
    totalRevenue: number;
    uniqueCustomers: number;
  };
  performance: {
    confirmationRate: number;
    cancellationRate: number;
    averageResponseTime: number;
  };
  trends: {
    dailyBookings: Array<{ date: string; count: number; revenue: number }>;
    hourlyDistribution: Array<{ hour: number; count: number }>;
    servicePopularity: Array<{ serviceId: string; name: string; count: number; revenue: number }>;
  };
  customers: {
    newCustomers: number;
    returningCustomers: number;
    topCustomers: Array<{
      name: string;
      phone: string;
      appointmentCount: number;
      totalSpent: number;
    }>;
  };
}

function calculateAnalytics(
  appointments: any[],
  services: any[],
  period: { startDate: Date; endDate: Date }
): AnalyticsResult {
  
  // Basic metrics
  const totalAppointments = appointments.length;
  const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed').length;
  const pendingAppointments = appointments.filter(apt => apt.status === 'pending').length;
  const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled' || apt.status === 'declined').length;

  // Revenue calculation
  const totalRevenue = appointments.reduce((sum, apt) => {
    if (apt.status === 'confirmed' && apt.services?.price) {
      return sum + apt.services.price;
    }
    return sum + (apt.services?.price || 80); // Default price
  }, 0);

  // Unique customers
  const uniqueCustomers = new Set(appointments.map(apt => apt.client_phone)).size;

  // Performance metrics
  const confirmationRate = totalAppointments > 0 ? (confirmedAppointments / totalAppointments) * 100 : 0;
  const cancellationRate = totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0;
  
  // Mock response time (would need actual created_at vs first_response timestamps)
  const averageResponseTime = 25; // minutes

  // Daily trends
  const dailyBookings = groupByDate(appointments);
  
  // Hourly distribution
  const hourlyDistribution = groupByHour(appointments);
  
  // Service popularity
  const servicePopularity = groupByService(appointments, services);
  
  // Customer analysis
  const customerAnalysis = analyzeCustomers(appointments);

  return {
    summary: {
      totalAppointments,
      confirmedAppointments,
      pendingAppointments,
      cancelledAppointments,
      totalRevenue,
      uniqueCustomers
    },
    performance: {
      confirmationRate,
      cancellationRate,
      averageResponseTime
    },
    trends: {
      dailyBookings,
      hourlyDistribution,
      servicePopularity
    },
    customers: customerAnalysis
  };
}

function groupByDate(appointments: any[]) {
  const groups: { [date: string]: { count: number; revenue: number } } = {};
  
  appointments.forEach(apt => {
    const date = apt.date;
    if (!groups[date]) {
      groups[date] = { count: 0, revenue: 0 };
    }
    groups[date].count++;
    if (apt.status === 'confirmed') {
      groups[date].revenue += apt.services?.price || 80;
    }
  });

  return Object.entries(groups)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function groupByHour(appointments: any[]) {
  const groups: { [hour: number]: number } = {};
  
  appointments.forEach(apt => {
    const hour = parseInt(apt.start_time.split(':')[0]);
    groups[hour] = (groups[hour] || 0) + 1;
  });

  return Object.entries(groups)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => a.hour - b.hour);
}

function groupByService(appointments: any[], services: any[]) {
  const groups: { [serviceId: string]: { count: number; revenue: number; name: string } } = {};
  
  appointments.forEach(apt => {
    const serviceId = apt.service_id;
    const service = services.find(s => s.id === serviceId);
    
    if (!groups[serviceId]) {
      groups[serviceId] = { 
        count: 0, 
        revenue: 0, 
        name: service?.name || 'שירות לא מוגדר' 
      };
    }
    groups[serviceId].count++;
    if (apt.status === 'confirmed') {
      groups[serviceId].revenue += service?.price || 80;
    }
  });

  return Object.entries(groups)
    .map(([serviceId, data]) => ({ serviceId, ...data }))
    .sort((a, b) => b.count - a.count);
}

function analyzeCustomers(appointments: any[]) {
  const customerData: { [phone: string]: { name: string; appointments: any[]; totalSpent: number } } = {};
  
  appointments.forEach(apt => {
    if (!customerData[apt.client_phone]) {
      customerData[apt.client_phone] = {
        name: apt.client_name,
        appointments: [],
        totalSpent: 0
      };
    }
    customerData[apt.client_phone].appointments.push(apt);
    
    if (apt.status === 'confirmed') {
      customerData[apt.client_phone].totalSpent += apt.services?.price || 80;
    }
  });

  const customers = Object.entries(customerData).map(([phone, data]) => ({
    name: data.name,
    phone,
    appointmentCount: data.appointments.length,
    totalSpent: data.totalSpent
  }));

  // Determine new vs returning customers (simplified logic)
  const totalCustomers = customers.length;
  const newCustomers = Math.floor(totalCustomers * 0.3); // Mock: 30% new customers
  const returningCustomers = totalCustomers - newCustomers;

  const topCustomers = customers
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  return {
    newCustomers,
    returningCustomers,
    topCustomers
  };
}