// src/components/dashboard/AdvancedAnalytics.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Clock,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  Zap,
  Star,
  Phone,
  UserCheck,
  UserX
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Appointment, Service, Business } from '@/lib/types';

// ===================================
// 🎯 Types for Analytics
// ===================================

interface AnalyticsTimeRange {
  start: Date;
  end: Date;
  label: string;
}

interface KPIMetric {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  format: 'number' | 'currency' | 'percentage' | 'time';
  target?: number;
}

interface ServiceAnalytics {
  id: string;
  name: string;
  bookings: number;
  revenue: number;
  avgDuration: number;
  popularity: number; // percentage
  noShowRate: number;
}

interface CustomerInsights {
  newCustomers: number;
  returningCustomers: number;
  totalUniqueCustomers: number;
  avgTimeBetweenVisits: number;
  customerRetentionRate: number;
}

interface TimeAnalytics {
  peakHours: Array<{ hour: string; bookings: number }>;
  slowDays: Array<{ day: string; bookings: number }>;
  utilizationRate: number;
  avgResponseTime: number; // minutes
}

interface BusinessPredictions {
  nextMonthBookings: number;
  nextMonthRevenue: number;
  trend: 'growing' | 'stable' | 'declining';
  confidence: number;
  recommendations: string[];
}

interface AnalyticsData {
  kpis: KPIMetric[];
  services: ServiceAnalytics[];
  customers: CustomerInsights;
  timeAnalytics: TimeAnalytics;
  predictions: BusinessPredictions;
  lastUpdated: Date;
}

// ===================================
// 🎯 Main Component
// ===================================

interface AdvancedAnalyticsProps {
  businessId: string;
  appointments: Appointment[];
  services: Service[];
  business: Business;
}

export const AdvancedAnalytics = ({ 
  businessId, 
  appointments, 
  services, 
  business 
}: AdvancedAnalyticsProps) => {
  
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ===================================
  // 🔢 Analytics Calculations
  // ===================================
  
  const analyticsData = useMemo<AnalyticsData>(() => {
    
    // Time range calculation
    const now = new Date();
    const ranges = {
      week: { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now },
      month: { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now },
      quarter: { start: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1), end: now },
      year: { start: new Date(now.getFullYear(), 0, 1), end: now }
    };
    
    const currentRange = ranges[selectedTimeRange];
    
    // Filter appointments for current period
    const periodAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= currentRange.start && aptDate <= currentRange.end;
    });

    // Previous period for comparison
    const periodLength = currentRange.end.getTime() - currentRange.start.getTime();
    const previousStart = new Date(currentRange.start.getTime() - periodLength);
    const previousAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= previousStart && aptDate < currentRange.start;
    });

    // ===================================
    // 📊 KPI Calculations
    // ===================================
    
    const totalBookings = periodAppointments.length;
    const previousBookings = previousAppointments.length;
    const bookingChange = previousBookings > 0 ? ((totalBookings - previousBookings) / previousBookings) * 100 : 0;

    const confirmedBookings = periodAppointments.filter(apt => apt.status === 'confirmed').length;
    const confirmationRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;

    const noShows = periodAppointments.filter(apt => apt.status === 'cancelled' || apt.status === 'declined').length;
    const noShowRate = totalBookings > 0 ? (noShows / totalBookings) * 100 : 0;

    // Mock revenue calculation (would need price data from services)
    const estimatedRevenue = periodAppointments.reduce((sum, apt) => {
      const service = services.find(s => s.id === apt.service_id);
      return sum + (service?.price || 80); // Default price if not set
    }, 0);

    const previousRevenue = previousAppointments.reduce((sum, apt) => {
      const service = services.find(s => s.id === apt.service_id);
      return sum + (service?.price || 80);
    }, 0);

    const revenueChange = previousRevenue > 0 ? ((estimatedRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Response time calculation (mock data - would need created_at vs updated_at)
    const avgResponseTime = 28; // minutes - mock data

    const kpis: KPIMetric[] = [
      {
        label: 'סה"כ תורים',
        value: totalBookings,
        change: bookingChange,
        trend: bookingChange > 0 ? 'up' : bookingChange < 0 ? 'down' : 'stable',
        format: 'number',
        target: Math.floor(totalBookings * 1.1)
      },
      {
        label: 'הכנסות משוערות',
        value: estimatedRevenue,
        change: revenueChange,
        trend: revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'stable',
        format: 'currency'
      },
      {
        label: 'שיעור אישורים',
        value: `${confirmationRate.toFixed(1)}%`,
        trend: confirmationRate >= 85 ? 'up' : confirmationRate >= 70 ? 'stable' : 'down',
        format: 'percentage',
        target: 85
      },
      {
        label: 'זמן מענה ממוצע',
        value: `${avgResponseTime} דק'`,
        trend: avgResponseTime <= 30 ? 'up' : avgResponseTime <= 60 ? 'stable' : 'down',
        format: 'time',
        target: 30
      }
    ];

    // ===================================
    // 📋 Service Analytics
    // ===================================
    
    const serviceAnalytics: ServiceAnalytics[] = services.map(service => {
      const serviceBookings = periodAppointments.filter(apt => apt.service_id === service.id);
      const serviceRevenue = serviceBookings.length * (service.price || 80);
      const serviceNoShows = serviceBookings.filter(apt => apt.status === 'cancelled' || apt.status === 'declined').length;
      
      return {
        id: service.id,
        name: service.name,
        bookings: serviceBookings.length,
        revenue: serviceRevenue,
        avgDuration: service.duration_minutes,
        popularity: totalBookings > 0 ? (serviceBookings.length / totalBookings) * 100 : 0,
        noShowRate: serviceBookings.length > 0 ? (serviceNoShows / serviceBookings.length) * 100 : 0
      };
    }).sort((a, b) => b.bookings - a.bookings);

    // ===================================
    // 👥 Customer Insights
    // ===================================
    
    const uniquePhones = new Set(periodAppointments.map(apt => apt.client_phone));
    const previousUniquePhones = new Set(previousAppointments.map(apt => apt.client_phone));
    
    const returningCustomers = Array.from(uniquePhones).filter(phone => 
      previousUniquePhones.has(phone)
    ).length;

    const customerInsights: CustomerInsights = {
      newCustomers: uniquePhones.size - returningCustomers,
      returningCustomers,
      totalUniqueCustomers: uniquePhones.size,
      avgTimeBetweenVisits: 21, // Mock data - would need complex calculation
      customerRetentionRate: uniquePhones.size > 0 ? (returningCustomers / uniquePhones.size) * 100 : 0
    };

    // ===================================
    // ⏰ Time Analytics
    // ===================================
    
    const hourCounts: { [hour: string]: number } = {};
    const dayCounts: { [day: string]: number } = {};

    periodAppointments.forEach(apt => {
      const hour = apt.start_time.substring(0, 2);
      const dayOfWeek = new Date(apt.date).getDay();
      const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
      const dayName = dayNames[dayOfWeek];

      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .map(([hour, bookings]) => ({ hour: `${hour}:00`, bookings }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 3);

    const slowDays = Object.entries(dayCounts)
      .map(([day, bookings]) => ({ day, bookings }))
      .sort((a, b) => a.bookings - b.bookings)
      .slice(0, 2);

    const timeAnalytics: TimeAnalytics = {
      peakHours,
      slowDays,
      utilizationRate: 76, // Mock data - would need availability data
      avgResponseTime
    };

    // ===================================
    // 🔮 Predictions
    // ===================================
    
    const trendMultiplier = bookingChange > 10 ? 1.15 : bookingChange > 0 ? 1.05 : bookingChange > -10 ? 0.95 : 0.85;
    
    const predictions: BusinessPredictions = {
      nextMonthBookings: Math.round(totalBookings * trendMultiplier),
      nextMonthRevenue: Math.round(estimatedRevenue * trendMultiplier),
      trend: bookingChange > 5 ? 'growing' : bookingChange > -5 ? 'stable' : 'declining',
      confidence: 75,
      recommendations: [
        noShowRate > 15 ? 'מומלץ להפעיל תזכורות SMS להפחתת no-shows' : '',
        confirmationRate < 80 ? 'מומלץ לשפר זמן מענה לבקשות תורים' : '',
        slowDays.length > 0 ? `מומלץ להציע מבצעים בימי ${slowDays.map(d => d.day).join(' ו')}` : '',
        'מומלץ להוסיף זמינות בשעות שיא להגדלת הכנסות'
      ].filter(Boolean)
    };

    return {
      kpis,
      services: serviceAnalytics,
      customers: customerInsights,
      timeAnalytics,
      predictions,
      lastUpdated: lastRefresh
    };

  }, [appointments, services, selectedTimeRange, lastRefresh]);

  // ===================================
  // 🔄 Actions
  // ===================================
  
  const handleRefresh = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLastRefresh(new Date());
      setLoading(false);
    }, 1000);
  };

  const handleExportData = () => {
    // TODO: Implement export functionality
    const data = JSON.stringify(analyticsData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${business.name}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // ===================================
  // 🎨 Render
  // ===================================

  return (
    <div className="space-y-6">
      
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            אנליטיקה מתקדמת
          </h2>
          <p className="text-gray-600 text-sm">
            תובנות מעמיקות על ביצועי העסק • עודכן לאחרונה: {analyticsData.lastUpdated.toLocaleTimeString('he-IL')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  selectedTimeRange === range
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range === 'week' ? 'שבוע' : range === 'month' ? 'חודש' : range === 'quarter' ? 'רבעון' : 'שנה'}
              </button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            רענן
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            ייצא
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsData.kpis.map((kpi, index) => (
          <KPICard key={index} metric={kpi} />
        ))}
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Service Performance */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              ביצועי שירותים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.services.slice(0, 5).map((service, index) => (
                <ServiceCard key={service.id} service={service} rank={index + 1} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Insights */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              תובנות לקוחות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerInsightsCard insights={analyticsData.customers} />
          </CardContent>
        </Card>

        {/* Time Analytics */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              ניתוח זמנים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TimeAnalyticsCard timeData={analyticsData.timeAnalytics} />
          </CardContent>
        </Card>

        {/* Predictions & Recommendations */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              תחזיות והמלצות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PredictionsCard predictions={analyticsData.predictions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ===================================
// 🧩 Sub-Components
// ===================================

interface KPICardProps {
  metric: KPIMetric;
}

const KPICard = ({ metric }: KPICardProps) => {
  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <div className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">{metric.label}</p>
          <p className="text-2xl font-bold">{metric.value}</p>
          {metric.change !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface ServiceCardProps {
  service: ServiceAnalytics;
  rank: number;
}

const ServiceCard = ({ service, rank }: ServiceCardProps) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
        {rank}
      </div>
      <div>
        <h4 className="font-medium">{service.name}</h4>
        <p className="text-sm text-gray-500">{service.bookings} תורים • {service.popularity.toFixed(1)}%</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-bold text-green-600">₪{service.revenue.toLocaleString()}</p>
      <p className="text-xs text-gray-500">{service.avgDuration} דק'</p>
    </div>
  </div>
);

interface CustomerInsightsCardProps {
  insights: CustomerInsights;
}

const CustomerInsightsCard = ({ insights }: CustomerInsightsCardProps) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center p-3 bg-green-50 rounded-lg">
        <UserCheck className="w-6 h-6 text-green-600 mx-auto mb-1" />
        <p className="text-2xl font-bold text-green-600">{insights.newCustomers}</p>
        <p className="text-xs text-gray-600">לקוחות חדשים</p>
      </div>
      <div className="text-center p-3 bg-blue-50 rounded-lg">
        <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
        <p className="text-2xl font-bold text-blue-600">{insights.returningCustomers}</p>
        <p className="text-xs text-gray-600">לקוחות חוזרים</p>
      </div>
    </div>
    
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm text-gray-600">שיעור החזרה</span>
        <span className="font-medium">{insights.customerRetentionRate.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${Math.min(insights.customerRetentionRate, 100)}%` }}
        />
      </div>
    </div>
    
    <div className="text-center text-sm text-gray-600">
      ממוצע {insights.avgTimeBetweenVisits} ימים בין ביקורים
    </div>
  </div>
);

interface TimeAnalyticsCardProps {
  timeData: TimeAnalytics;
}

const TimeAnalyticsCard = ({ timeData }: TimeAnalyticsCardProps) => (
  <div className="space-y-4">
    <div>
      <h4 className="font-medium mb-2 text-green-600">שעות שיא</h4>
      <div className="space-y-1">
        {timeData.peakHours.map((hour, index) => (
          <div key={hour.hour} className="flex justify-between text-sm">
            <span>{hour.hour}</span>
            <span className="font-medium">{hour.bookings} תורים</span>
          </div>
        ))}
      </div>
    </div>
    
    <div>
      <h4 className="font-medium mb-2 text-orange-600">ימים איטיים</h4>
      <div className="space-y-1">
        {timeData.slowDays.map((day, index) => (
          <div key={day.day} className="flex justify-between text-sm">
            <span>יום {day.day}</span>
            <span className="font-medium">{day.bookings} תורים</span>
          </div>
        ))}
      </div>
    </div>
    
    <div className="p-3 bg-purple-50 rounded-lg text-center">
      <p className="text-sm text-gray-600">ניצול זמן</p>
      <p className="text-xl font-bold text-purple-600">{timeData.utilizationRate}%</p>
    </div>
  </div>
);

interface PredictionsCardProps {
  predictions: BusinessPredictions;
}

const PredictionsCard = ({ predictions }: PredictionsCardProps) => (
  <div className="space-y-4">
    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Target className="w-5 h-5 text-blue-600" />
        <span className="font-medium">תחזית לחודש הבא</span>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-blue-600">{predictions.nextMonthBookings}</p>
        <p className="text-sm text-gray-600">תורים חזויים</p>
        <p className="text-lg font-medium text-green-600">₪{predictions.nextMonthRevenue.toLocaleString()}</p>
      </div>
      <Badge 
        variant={predictions.trend === 'growing' ? 'default' : predictions.trend === 'stable' ? 'secondary' : 'destructive'}
        className="mt-2"
      >
        {predictions.trend === 'growing' ? 'מגמה חיובית' : predictions.trend === 'stable' ? 'יציבות' : 'ירידה'}
      </Badge>
    </div>
    
    <div>
      <h4 className="font-medium mb-2 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-600" />
        המלצות
      </h4>
      <div className="space-y-2">
        {predictions.recommendations.map((rec, index) => (
          <div key={index} className="text-sm bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded">
            💡 {rec}
          </div>
        ))}
      </div>
    </div>
  </div>
);