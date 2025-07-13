// src/hooks/useAnalytics.ts
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { Appointment, Service, Business } from '@/lib/types';

// ===================================
// 🎯 Analytics Types
// ===================================

export interface AnalyticsTimeRange {
  start: Date;
  end: Date;
  label: string;
}

export interface AnalyticsFilters {
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  compareWithPrevious: boolean;
  includeDeclined: boolean;
}

export interface AnalyticsMetrics {
  // Core metrics
  totalAppointments: number;
  confirmedAppointments: number;
  cancelledAppointments: number;
  pendingAppointments: number;
  
  // Financial
  totalRevenue: number;
  averageRevenuePerAppointment: number;
  
  // Performance
  confirmationRate: number;
  cancellationRate: number;
  noShowRate: number;
  
  // Customer metrics
  uniqueCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
  
  // Time metrics
  averageResponseTime: number;
  peakHours: Array<{ hour: string; count: number }>;
  busyDays: Array<{ day: string; count: number }>;
  
  // Trends (comparison with previous period)
  trends: {
    appointments: number; // percentage change
    revenue: number;
    customers: number;
  };
}

export interface ServiceMetrics {
  id: string;
  name: string;
  appointmentCount: number;
  revenue: number;
  averageDuration: number;
  popularityScore: number;
  cancellationRate: number;
}

export interface CustomerInsights {
  totalUniqueCustomers: number;
  newCustomersThisPeriod: number;
  returningCustomersThisPeriod: number;
  averageAppointmentsPerCustomer: number;
  customerLifetimeValue: number;
  topCustomers: Array<{
    name: string;
    phone: string;
    appointmentCount: number;
    totalSpent: number;
    lastVisit: string;
  }>;
}

export interface BusinessPredictions {
  nextPeriodAppointments: number;
  nextPeriodRevenue: number;
  growthTrend: 'growing' | 'stable' | 'declining';
  confidenceLevel: number;
  seasonalFactors: Array<{
    period: string;
    multiplier: number;
    description: string;
  }>;
  recommendations: Array<{
    type: 'pricing' | 'scheduling' | 'marketing' | 'service';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    expectedImpact: string;
  }>;
}

// ===================================
// 🎯 Main Hook
// ===================================

export const useAnalytics = (
  businessId: string,
  appointments: Appointment[],
  services: Service[],
  initialFilters?: Partial<AnalyticsFilters>
) => {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    timeRange: 'month',
    compareWithPrevious: true,
    includeDeclined: false,
    ...initialFilters
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // ===================================
  // 🔢 Core Analytics Calculations
  // ===================================

  const analyticsData = useMemo(() => {
    if (!appointments.length) {
      return null;
    }

    // Calculate time ranges
    const now = new Date();
    const timeRanges = {
      week: {
        current: { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now },
        previous: { start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), end: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
      },
      month: {
        current: { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now },
        previous: { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 1) }
      },
      quarter: {
        current: { start: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1), end: now },
        previous: { start: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1), end: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1) }
      },
      year: {
        current: { start: new Date(now.getFullYear(), 0, 1), end: now },
        previous: { start: new Date(now.getFullYear() - 1, 0, 1), end: new Date(now.getFullYear(), 0, 1) }
      }
    };

    const currentRange = timeRanges[filters.timeRange].current;
    const previousRange = timeRanges[filters.timeRange].previous;

    // Filter appointments for current period
    const currentAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      const includeThisAppointment = filters.includeDeclined || apt.status !== 'declined';
      return aptDate >= currentRange.start && aptDate <= currentRange.end && includeThisAppointment;
    });

    // Filter appointments for previous period (for comparison)
    const previousAppointments = filters.compareWithPrevious ? appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      const includeThisAppointment = filters.includeDeclined || apt.status !== 'declined';
      return aptDate >= previousRange.start && aptDate <= previousRange.end && includeThisAppointment;
    }) : [];

    // ===================================
    // 📊 Calculate Core Metrics
    // ===================================

    const totalAppointments = currentAppointments.length;
    const confirmedAppointments = currentAppointments.filter(apt => apt.status === 'confirmed').length;
    const cancelledAppointments = currentAppointments.filter(apt => apt.status === 'cancelled').length;
    const pendingAppointments = currentAppointments.filter(apt => apt.status === 'pending').length;
    const declinedAppointments = currentAppointments.filter(apt => apt.status === 'declined').length;

    // Financial calculations
    const totalRevenue = currentAppointments.reduce((sum, apt) => {
      if (apt.status === 'confirmed') {
        const service = services.find(s => s.id === apt.service_id);
        return sum + (service?.price || 80); // Default price if not set
      }
      return sum;
    }, 0);

    const averageRevenuePerAppointment = confirmedAppointments > 0 ? totalRevenue / confirmedAppointments : 0;

    // Performance rates
    const confirmationRate = totalAppointments > 0 ? (confirmedAppointments / totalAppointments) * 100 : 0;
    const cancellationRate = totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0;
    const noShowRate = totalAppointments > 0 ? ((cancelledAppointments + declinedAppointments) / totalAppointments) * 100 : 0;

    // Customer metrics
    const uniqueCustomers = new Set(currentAppointments.map(apt => apt.client_phone));
    const previousUniqueCustomers = new Set(previousAppointments.map(apt => apt.client_phone));
    
    const returningCustomers = Array.from(uniqueCustomers).filter(phone => 
      previousUniqueCustomers.has(phone)
    ).length;
    
    const newCustomers = uniqueCustomers.size - returningCustomers;
    const customerRetentionRate = previousUniqueCustomers.size > 0 ? (returningCustomers / previousUniqueCustomers.size) * 100 : 0;

    // Time analytics
    const hourCounts: { [hour: string]: number } = {};
    const dayCounts: { [day: string]: number } = {};
    
    currentAppointments.forEach(apt => {
      const hour = apt.start_time.substring(0, 2);
      const dayOfWeek = new Date(apt.date).getDay();
      const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
      const dayName = dayNames[dayOfWeek];

      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
      .sort((a, b) => b.count - a.count);

    const busyDays = Object.entries(dayCounts)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => b.count - a.count);

    // Trend calculations
    const previousTotal = previousAppointments.length;
    const previousRevenue = previousAppointments.reduce((sum, apt) => {
      if (apt.status === 'confirmed') {
        const service = services.find(s => s.id === apt.service_id);
        return sum + (service?.price || 80);
      }
      return sum;
    }, 0);

    const trends = {
      appointments: previousTotal > 0 ? ((totalAppointments - previousTotal) / previousTotal) * 100 : 0,
      revenue: previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0,
      customers: previousUniqueCustomers.size > 0 ? ((uniqueCustomers.size - previousUniqueCustomers.size) / previousUniqueCustomers.size) * 100 : 0
    };

    const metrics: AnalyticsMetrics = {
      totalAppointments,
      confirmedAppointments,
      cancelledAppointments,
      pendingAppointments,
      totalRevenue,
      averageRevenuePerAppointment,
      confirmationRate,
      cancellationRate,
      noShowRate,
      uniqueCustomers: uniqueCustomers.size,
      newCustomers,
      returningCustomers,
      customerRetentionRate,
      averageResponseTime: 28, // Mock data - would need actual timestamps
      peakHours,
      busyDays,
      trends
    };

    // ===================================
    // 📋 Service Analytics
    // ===================================

    const serviceMetrics: ServiceMetrics[] = services.map(service => {
      const serviceAppointments = currentAppointments.filter(apt => apt.service_id === service.id);
      const serviceRevenue = serviceAppointments.filter(apt => apt.status === 'confirmed').length * (service.price || 80);
      const serviceCancellations = serviceAppointments.filter(apt => apt.status === 'cancelled' || apt.status === 'declined').length;
      
      return {
        id: service.id,
        name: service.name,
        appointmentCount: serviceAppointments.length,
        revenue: serviceRevenue,
        averageDuration: service.duration_minutes,
        popularityScore: totalAppointments > 0 ? (serviceAppointments.length / totalAppointments) * 100 : 0,
        cancellationRate: serviceAppointments.length > 0 ? (serviceCancellations / serviceAppointments.length) * 100 : 0
      };
    }).sort((a, b) => b.appointmentCount - a.appointmentCount);

    // ===================================
    // 👥 Customer Insights
    // ===================================

    // Calculate customer lifetime value and top customers
    const customerData: { [phone: string]: { name: string; appointments: Appointment[]; totalSpent: number } } = {};
    
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
        const service = services.find(s => s.id === apt.service_id);
        customerData[apt.client_phone].totalSpent += (service?.price || 80);
      }
    });

    const topCustomers = Object.entries(customerData)
      .map(([phone, data]) => ({
        name: data.name,
        phone,
        appointmentCount: data.appointments.length,
        totalSpent: data.totalSpent,
        lastVisit: data.appointments.reduce((latest, apt) => 
          apt.date > latest ? apt.date : latest, '1900-01-01'
        )
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    const averageAppointmentsPerCustomer = uniqueCustomers.size > 0 ? totalAppointments / uniqueCustomers.size : 0;
    const customerLifetimeValue = topCustomers.length > 0 ? 
      topCustomers.reduce((sum, customer) => sum + customer.totalSpent, 0) / topCustomers.length : 0;

    const customerInsights: CustomerInsights = {
      totalUniqueCustomers: uniqueCustomers.size,
      newCustomersThisPeriod: newCustomers,
      returningCustomersThisPeriod: returningCustomers,
      averageAppointmentsPerCustomer,
      customerLifetimeValue,
      topCustomers
    };

    // ===================================
    // 🔮 Business Predictions
    // ===================================

    const growthTrend: 'growing' | 'stable' | 'declining' = 
      trends.appointments > 10 ? 'growing' : 
      trends.appointments > -5 ? 'stable' : 'declining';

    const trendMultiplier = growthTrend === 'growing' ? 1.15 : growthTrend === 'stable' ? 1.02 : 0.9;
    
    const predictions: BusinessPredictions = {
      nextPeriodAppointments: Math.round(totalAppointments * trendMultiplier),
      nextPeriodRevenue: Math.round(totalRevenue * trendMultiplier),
      growthTrend,
      confidenceLevel: Math.min(85 + Math.abs(trends.appointments) * 2, 95),
      seasonalFactors: [
        { period: 'חורף', multiplier: 0.9, description: 'פחות פעילות בחודשי החורף' },
        { period: 'אביב', multiplier: 1.1, description: 'עלייה בפעילות באביב' },
        { period: 'קיץ', multiplier: 1.05, description: 'פעילות יציבה בקיץ' },
        { period: 'סתיו', multiplier: 1.15, description: 'שיא הפעילות בסתיו' }
      ],
      recommendations: generateRecommendations(metrics, serviceMetrics, customerInsights)
    };

    return {
      metrics,
      serviceMetrics,
      customerInsights,
      predictions,
      currentRange,
      previousRange
    };

  }, [appointments, services, filters]);

  // ===================================
  // 🛠️ Helper Functions
  // ===================================

  const generateRecommendations = (
    metrics: AnalyticsMetrics, 
    services: ServiceMetrics[], 
    customers: CustomerInsights
  ): BusinessPredictions['recommendations'] => {
    const recommendations: BusinessPredictions['recommendations'] = [];

    // High cancellation rate
    if (metrics.cancellationRate > 15) {
      recommendations.push({
        type: 'marketing',
        priority: 'high',
        title: 'הפעל תזכורות SMS',
        description: 'שיעור הביטולים גבוה. תזכורות SMS יכולות להקטין no-shows ב-40%',
        expectedImpact: 'הפחתת ביטולים ב-25-40%'
      });
    }

    // Low confirmation rate
    if (metrics.confirmationRate < 75) {
      recommendations.push({
        type: 'service',
        priority: 'high',
        title: 'שפר זמן מענה',
        description: 'שיעור אישורים נמוך. מענה מהיר יותר יכול לשפר את השיעור',
        expectedImpact: 'העלאת שיעור אישורים ב-15-25%'
      });
    }

    // Peak hours optimization
    if (metrics.peakHours.length > 0) {
      const topHour = metrics.peakHours[0];
      recommendations.push({
        type: 'scheduling',
        priority: 'medium',
        title: 'הוסף זמינות בשעות שיא',
        description: `השעה ${topHour.hour} היא הפופולרית ביותר. כדאי להוסיף זמינות`,
        expectedImpact: 'הגדלת הכנסות ב-10-20%'
      });
    }

    // Service optimization
    const topService = services[0];
    if (topService && topService.cancellationRate > 20) {
      recommendations.push({
        type: 'service',
        priority: 'medium',
        title: `שפר את שירות ${topService.name}`,
        description: 'לשירות הפופולרי ביותר יש שיעור ביטולים גבוה',
        expectedImpact: 'שיפור שביעות רצון הלקוחות'
      });
    }

    // Customer retention
    if (metrics.customerRetentionRate < 50) {
      recommendations.push({
        type: 'marketing',
        priority: 'medium',
        title: 'תוכנית נאמנות לקוחות',
        description: 'שיעור החזרת לקוחות נמוך. כדאי ליצור תוכנית נאמנות',
        expectedImpact: 'העלאת שיעור החזרה ב-20-30%'
      });
    }

    // Pricing optimization
    if (metrics.averageRevenuePerAppointment < 100) {
      recommendations.push({
        type: 'pricing',
        priority: 'low',
        title: 'בחן העלאת מחירים',
        description: 'ההכנסה הממוצעת לתור נמוכה. כדאי לבחון העלאת מחירים',
        expectedImpact: 'הגדלת רווחיות ב-15-25%'
      });
    }

    return recommendations;
  };

  // ===================================
  // 🔄 Actions
  // ===================================

  const updateFilters = (newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastUpdated(new Date());
    } catch (err) {
      setError('שגיאה בטעינת נתוני אנליטיקה');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!analyticsData) return;
    
    const exportData = {
      generatedAt: new Date().toISOString(),
      timeRange: filters.timeRange,
      period: {
        start: analyticsData.currentRange.start.toISOString(),
        end: analyticsData.currentRange.end.toISOString()
      },
      metrics: analyticsData.metrics,
      services: analyticsData.serviceMetrics,
      customers: analyticsData.customerInsights,
      predictions: analyticsData.predictions
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${filters.timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ===================================
  // 🎯 Return
  // ===================================

  return {
    // Data
    data: analyticsData,
    
    // State
    loading,
    error,
    lastUpdated,
    filters,
    
    // Actions
    updateFilters,
    refreshData,
    exportData,
    
    // Computed properties
    hasData: !!analyticsData,
    isEmpty: !appointments.length
  };
};