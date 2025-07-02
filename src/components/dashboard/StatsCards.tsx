// src/components/dashboard/StatsCards.tsx
'use client';

import { Clock, Check, BarChart, TrendingUp, Calendar, Users } from 'lucide-react';
import type { Appointment } from '@/lib/types';

interface StatsCardsProps {
  appointments: Appointment[];
  loading?: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'yellow' | 'green' | 'blue' | 'orange' | 'purple' | 'red';
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
}

export const StatsCards = ({ appointments, loading = false }: StatsCardsProps) => {
  // ===================================
  // 📊 Calculate Statistics
  // ===================================
  
  const pendingCount = appointments.filter(apt => apt.status === 'pending').length;
  const confirmedCount = appointments.filter(apt => apt.status === 'confirmed').length;
  const totalCount = appointments.length;

  // Today's appointments
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(apt => 
    apt.date === today && apt.status === 'confirmed'
  ).length;

  // This week's appointments
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  
  const thisWeekAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return aptDate >= startOfWeek && 
           aptDate <= endOfWeek && 
           apt.status === 'confirmed';
  }).length;

  // Upcoming appointments (next 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return aptDate > new Date() && 
           aptDate <= nextWeek && 
           apt.status === 'confirmed';
  }).length;

  // ===================================
  // 🎨 Stats Configuration
  // ===================================

  const stats: StatCardProps[] = [
    {
      title: 'בקשות ממתינות',
      value: pendingCount,
      subtitle: 'דורש טיפול',
      icon: Clock,
      color: 'yellow',
      trend: pendingCount > 0 ? {
        value: pendingCount,
        isPositive: false,
        label: 'דרוש אישור'
      } : undefined
    },
    {
      title: 'תורים מאושרים',
      value: confirmedCount,
      subtitle: 'פעילים במערכת',
      icon: Check,
      color: 'green',
      trend: {
        value: Math.round((confirmedCount / Math.max(totalCount, 1)) * 100),
        isPositive: true,
        label: 'אחוז אישור'
      }
    },
    {
      title: 'סה״כ בקשות',
      value: totalCount,
      subtitle: 'חודש נוכחי',
      icon: BarChart,
      color: 'blue',
      trend: totalCount > 0 ? {
        value: totalCount,
        isPositive: true,
        label: 'כל הזמנים'
      } : undefined
    },
    {
      title: 'תורים היום',
      value: todayAppointments,
      subtitle: new Date().toLocaleDateString('he-IL', { weekday: 'long' }),
      icon: Calendar,
      color: 'orange',
      trend: todayAppointments > 0 ? {
        value: todayAppointments,
        isPositive: true,
        label: 'מאושרים'
      } : undefined
    }
  ];

  if (loading) {
    return <StatsCardsSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

// ===================================
// 📊 Individual Stat Card Component
// ===================================

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  trend 
}: StatCardProps) => {
  const colorClasses = {
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600',
      value: 'text-yellow-700',
      trend: 'text-yellow-600'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      value: 'text-green-700',
      trend: 'text-green-600'
    },
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      value: 'text-blue-700',
      trend: 'text-blue-600'
    },
    orange: {
      bg: 'bg-orange-100',
      text: 'text-orange-600',
      value: 'text-orange-700',
      trend: 'text-orange-600'
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      value: 'text-purple-700',
      trend: 'text-purple-600'
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      value: 'text-red-700',
      trend: 'text-red-600'
    }
  };

  const classes = colorClasses[color];

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 group">
      <div className="flex items-center justify-between">
        {/* Content */}
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
          <p className={`text-3xl font-bold ${classes.value} group-hover:scale-105 transition-transform duration-200`}>
            {value.toLocaleString('he-IL')}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          
          {/* Trend Indicator */}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 ${classes.trend}`}>
              <TrendingUp className={`w-3 h-3 ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`} />
              <span className="text-xs font-medium">
                {trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>

        {/* Icon */}
        <div className={`w-12 h-12 ${classes.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`w-6 h-6 ${classes.text}`} />
        </div>
      </div>
    </div>
  );
};

// ===================================
// 💀 Loading Skeleton
// ===================================

const StatsCardsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-xl animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ===================================
// 🎯 Additional Stats Variants
// ===================================

/**
 * Enhanced stats with more detailed metrics
 */
export const DetailedStatsCards = ({ appointments }: StatsCardsProps) => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Advanced calculations
  const todayCount = appointments.filter(apt => apt.date === today && apt.status === 'confirmed').length;
  const yesterdayCount = appointments.filter(apt => apt.date === yesterdayStr && apt.status === 'confirmed').length;
  const dailyGrowth = yesterdayCount > 0 ? ((todayCount - yesterdayCount) / yesterdayCount) * 100 : 0;

  const detailedStats: StatCardProps[] = [
    {
      title: 'תורים היום',
      value: todayCount,
      subtitle: 'לעומת אתמול',
      icon: Calendar,
      color: 'blue',
      trend: {
        value: Math.abs(Math.round(dailyGrowth)),
        isPositive: dailyGrowth >= 0,
        label: dailyGrowth >= 0 ? 'גידול' : 'ירידה'
      }
    },
    {
      title: 'לקוחות ייחודיים',
      value: new Set(appointments.map(apt => apt.client_phone)).size,
      subtitle: 'מספרי טלפון שונים',
      icon: Users,
      color: 'purple',
    },
    {
      title: 'אחוז אישור',
      value: Math.round((appointments.filter(apt => apt.status === 'confirmed').length / Math.max(appointments.length, 1)) * 100),
      subtitle: 'מכלל הבקשות',
      icon: TrendingUp,
      color: 'green',
    },
    {
      title: 'זמן תגובה ממוצע',
      value: 24, // This would need to be calculated from actual data
      subtitle: 'שעות עד אישור',
      icon: Clock,
      color: 'orange',
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {detailedStats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatsCards;