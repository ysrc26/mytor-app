// src/components/dashboard/TabNavigation.tsx
'use client';

import { Clock, Calendar, Users, Crown } from 'lucide-react';

export type TabType = 'pending' | 'calendar' | 'appointments' | 'premium';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingCount?: number;
  appointmentsCount?: number;
}

interface Tab {
  key: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  description?: string;
}

export const TabNavigation = ({ 
  activeTab, 
  onTabChange, 
  pendingCount = 0,
  appointmentsCount = 0 
}: TabNavigationProps) => {
  
  const tabs: Tab[] = [
    { 
      key: 'pending', 
      label: 'ממתין לאישור', 
      icon: Clock,
      badge: pendingCount,
      description: 'בקשות תורים חדשות'
    },
    { 
      key: 'calendar', 
      label: 'יומן', 
      icon: Calendar,
      description: 'תצוגה חזותית של התורים'
    },
    { 
      key: 'appointments', 
      label: 'תורים', 
      icon: Users,
      badge: appointmentsCount,
      description: 'ניהול כל התורים'
    },
    { 
      key: 'premium', 
      label: 'פרימיום', 
      icon: Crown,
      description: 'שדרג את החשבון'
    }
  ];

  return (
    <div className="border-b border-gray-200/50">
      <nav className="flex overflow-x-auto">
        {tabs.map((tab) => (
          <TabButton
            key={tab.key}
            tab={tab}
            isActive={activeTab === tab.key}
            onClick={() => onTabChange(tab.key)}
          />
        ))}
      </nav>
    </div>
  );
};

// ===================================
// 🎨 Individual Tab Button
// ===================================

interface TabButtonProps {
  tab: Tab;
  isActive: boolean;
  onClick: () => void;
}

const TabButton = ({ tab, isActive, onClick }: TabButtonProps) => {
  const { icon: Icon, label, badge, description } = tab;
  
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-6 py-4 font-semibold transition-all duration-200 
        relative group whitespace-nowrap min-w-fit
        ${isActive
          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
          : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
        }
      `}
      title={description}
    >
      {/* Icon */}
      <div className="relative">
        <Icon className={`w-5 h-5 transition-colors ${
          isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-500'
        }`} />
        
        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <span className={`
            absolute -top-2 -right-2 min-w-[18px] h-[18px] 
            rounded-full text-[10px] font-bold flex items-center justify-center
            ${isActive 
              ? 'bg-blue-600 text-white' 
              : 'bg-red-500 text-white'
            }
            animate-pulse
          `}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>

      {/* Label */}
      <span className="hidden sm:inline">{label}</span>

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" />
      )}

      {/* Hover Effect */}
      {!isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-300 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
      )}
    </button>
  );
};

// ===================================
// 🎯 Enhanced Tab Navigation with More Features
// ===================================

interface EnhancedTabNavigationProps extends TabNavigationProps {
  showNotifications?: boolean;
  onNotificationClick?: () => void;
  compactMode?: boolean;
}

export const EnhancedTabNavigation = ({ 
  activeTab, 
  onTabChange, 
  pendingCount = 0,
  appointmentsCount = 0,
  showNotifications = false,
  onNotificationClick,
  compactMode = false
}: EnhancedTabNavigationProps) => {
  
  return (
    <div className="border-b border-gray-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center justify-between px-2">
        {/* Main Tabs */}
        <div className="flex overflow-x-auto flex-1">
          <TabNavigation 
            activeTab={activeTab}
            onTabChange={onTabChange}
            pendingCount={pendingCount}
            appointmentsCount={appointmentsCount}
          />
        </div>

        {/* Additional Actions */}
        <div className="flex items-center gap-2 px-4">
          {/* Notifications Toggle */}
          {showNotifications && (
            <button
              onClick={onNotificationClick}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="התראות"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          )}

          {/* Tab Info */}
          <div className="hidden lg:block text-xs text-gray-500">
            {getTabInfo(activeTab, pendingCount, appointmentsCount)}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================================
// 🛠️ Helper Functions
// ===================================

const getTabInfo = (activeTab: TabType, pendingCount: number, appointmentsCount: number): string => {
  switch (activeTab) {
    case 'pending':
      return pendingCount > 0 ? `${pendingCount} בקשות ממתינות` : 'אין בקשות ממתינות';
    case 'calendar':
      return 'תצוגה חזותית';
    case 'appointments':
      return `${appointmentsCount} תורים במערכת`;
    case 'premium':
      return 'שדרוג חשבון';
    default:
      return '';
  }
};

// ===================================
// 🎨 Animated Tab Transitions
// ===================================

export const AnimatedTabNavigation = ({ activeTab, onTabChange, pendingCount, appointmentsCount }: TabNavigationProps) => {
  const tabs: Tab[] = [
    { key: 'pending', label: 'ממתין לאישור', icon: Clock, badge: pendingCount },
    { key: 'calendar', label: 'יומן', icon: Calendar },
    { key: 'appointments', label: 'תורים', icon: Users, badge: appointmentsCount },
    { key: 'premium', label: 'פרימיום', icon: Crown }
  ];

  const activeIndex = tabs.findIndex(tab => tab.key === activeTab);

  return (
    <div className="border-b border-gray-200/50 relative">
      {/* Animated Background */}
      <div 
        className="absolute bottom-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ease-out"
        style={{
          width: `${100 / tabs.length}%`,
          transform: `translateX(${activeIndex * 100}%)`
        }}
      />
      
      <nav className="flex">
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-4 font-semibold 
              transition-all duration-200 relative group
              ${activeTab === tab.key
                ? 'text-blue-600 bg-blue-50/50 scale-105'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }
            `}
          >
            <div className="relative">
              <tab.icon className="w-5 h-5" />
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default TabNavigation;