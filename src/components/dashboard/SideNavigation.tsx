// src/components/dashboard/SideNavigation.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, Settings, Sparkles, Clock, Calendar, BarChart,
  LogOut, ChevronLeft, ExternalLink, Crown, Bell,
  CreditCard, Users, Phone, Copy, Check,
  CalendarX
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { showSuccessToast } from '@/lib/toast-utils';
import type { Business, Service, Availability, User } from '@/lib/types';
import { UserAvatar } from '../ui/UserAvatar';

interface SideNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
  services: Service[];
  availability: Availability[];
  user?: User | null;
  onOpenModal?: (modalType: 'profile' | 'services' | 'availability' | 'unavailable-dates') => void;
  onOpenSettingsModal?: () => void;
}

export const SideNavigation = ({
  isOpen,
  onClose,
  business,
  services,
  availability,
  user,
  onOpenModal,
  onOpenSettingsModal, 
}: SideNavigationProps) => {
  const router = useRouter();
  const supabase = createClient();
  const [copied, setCopied] = useState(false);

  // ===================================
  // 🔧 Actions
  // ===================================

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const copyPublicLink = async () => {
    if (business?.slug) {
      const link = `${window.location.origin}/${business.slug}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      showSuccessToast('קישור הועתק ללוח!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={handleOverlayClick}
      />

      {/* Side Navigation Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>

        {/* Header */}
        <SideNavHeader
          business={business}
          onClose={onClose}
        />

        {/* Content */}
        <div className="p-4 overflow-y-auto h-[calc(100vh-80px)]">

          {/* Quick Actions */}
          <QuickActions
            business={business}
            onCopyLink={copyPublicLink}
            copied={copied}
          />

          {/* Main Navigation */}
          <MainNavigation
            onOpenModal={onOpenModal}
            onClose={onClose}
          />

          {/* Business Stats */}
          <BusinessStats
            services={services}
            availability={availability}
          />

          {/* Premium Features Preview */}
          <PremiumPreview />

          {/* User Section */}
          <UserSection
            user={user}
            onLogout={handleLogout}
            onClose={onClose}
            onOpenSettingsModal={onOpenSettingsModal} 
          />
        </div>
      </div>
    </>
  );
};

// ===================================
// 🎨 Sub-Components
// ===================================

interface SideNavHeaderProps {
  business: Business;
  onClose: () => void;
}

const SideNavHeader = ({ business, onClose }: SideNavHeaderProps) => (
  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-bold">ניהול עסק</h3>
        <p className="text-blue-100 text-sm truncate">{business.name}</p>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        title="סגור תפריט"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  </div>
);

interface QuickActionsProps {
  business: Business;
  onCopyLink: () => void;
  copied: boolean;
}

const QuickActions = ({ business, onCopyLink, copied }: QuickActionsProps) => (
  <div className="mb-6">
    <h4 className="text-sm font-semibold text-gray-900 mb-3">פעולות מהירות</h4>

    {/* Public Link */}
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h5 className="font-medium text-green-900 text-sm">הקישור הציבורי</h5>
          <p className="text-green-700 text-xs font-mono truncate mt-1">
            mytor.app/{business.slug}
          </p>
        </div>
        <button
          onClick={onCopyLink}
          className="p-2 bg-green-200 hover:bg-green-300 rounded-lg transition-colors"
          title="העתק קישור"
        >
          {copied ? <Check className="w-4 h-4 text-green-700" /> : <Copy className="w-4 h-4 text-green-700" />}
        </button>
      </div>
    </div>

    {/* View Public Page */}
    <button
      onClick={() => window.open(`/${business.slug}`, '_blank')}
      className="w-full p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2"
    >
      <ExternalLink className="w-4 h-4" />
      צפה בעמוד הציבורי
    </button>
  </div>
);

interface MainNavigationProps {
  onOpenModal?: (modalType: 'profile' | 'services' | 'availability' | 'unavailable-dates') => void;
  onClose: () => void;
}

const MainNavigation = ({ onOpenModal, onClose }: MainNavigationProps) => {
  const router = useRouter();

  const navigationItems = [
    {
      key: 'profile',
      label: 'פרטי עסק',
      icon: Settings,
      desc: 'עדכן מידע וקישורים',
      color: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200',
      action: () => onOpenModal?.('profile')
    },
    {
      key: 'services',
      label: 'שירותים',
      icon: Sparkles,
      desc: 'הוסף ועדכן שירותים',
      color: 'bg-purple-100 text-purple-600 group-hover:bg-purple-200',
      action: () => onOpenModal?.('services')
    },
    {
      key: 'availability',
      label: 'שעות עבודה',
      icon: Clock,
      desc: 'הגדר שעות פעילות',
      color: 'bg-green-100 text-green-600 group-hover:bg-green-200',
      action: () => onOpenModal?.('availability')
    },
    {
      key: 'unavailable-dates',
      label: 'תאריכים חסומים',
      icon: CalendarX,
      desc: 'נהל חופשות וחגים',
      color: 'bg-red-100 text-red-600 group-hover:bg-red-200',
      action: () => onOpenModal?.('unavailable-dates')
    }
  ];

  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">ניהול העסק</h4>
      <nav className="space-y-2">
        {navigationItems.map((item) => (
          <button
            key={item.key}
            onClick={item.action}
            className="w-full text-right p-4 rounded-xl transition-all duration-200 group hover:bg-gray-50 border-2 border-transparent text-gray-700 hover:text-gray-900"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-gray-100 text-gray-600 group-hover:bg-gray-200">
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
    </div>
  );
};

interface BusinessStatsProps {
  services: Service[];
  availability: Availability[];
}

const BusinessStats = ({ services, availability }: BusinessStatsProps) => (
  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
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
      <div className="flex justify-between">
        <span>סטטוס:</span>
        <span className="font-medium text-green-600">פעיל</span>
      </div>
    </div>
  </div>
);

const PremiumPreview = () => (
  <div className="mb-6">
    <h4 className="text-sm font-semibold text-gray-900 mb-3">תכונות פרימיום</h4>
    <div className="space-y-2">
      {[
        { icon: Bell, title: 'התראות SMS', desc: 'שלח תזכורות ללקוחות' },
        { icon: BarChart, title: 'אנליטיקה', desc: 'נתונים מפורטים על העסק' },
        { icon: CreditCard, title: 'תשלומים', desc: 'קבל תשלומים מראש' }
      ].map((feature, index) => (
        <div key={index} className="bg-gray-100 rounded-xl p-3 opacity-60 relative">
          <div className="absolute top-2 right-2">
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-center gap-3">
            <feature.icon className="w-6 h-6 text-gray-400" />
            <div>
              <h5 className="font-semibold text-gray-700 text-sm">{feature.title}</h5>
              <p className="text-xs text-gray-500">{feature.desc}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
    <button className="w-full mt-3 p-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium text-sm hover:from-amber-600 hover:to-orange-600 transition-all">
      שדרג לפרימיום
    </button>
  </div>
);

interface UserSectionProps {
  user?: User | null;
  onLogout: () => void;
  onClose: () => void;
  onOpenSettingsModal?: () => void;
}

const UserSection = ({ user, onLogout, onClose, onOpenSettingsModal }: UserSectionProps) => {
  const router = useRouter();

  return (
    <div className="border-t border-gray-200 pt-4 space-y-3">
      {/* User Profile */}
      <button
        onClick={() => {
          router.push('/dashboard/profile');
          onClose();
        }}
        className="w-full text-right p-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3"
      >
        <div className="flex items-center gap-3">
          <UserAvatar
            user={user}
            size="md"
            className="ring-2 ring-blue-100"
          />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{user?.full_name || 'משתמש'}</h4>
            <p className="text-sm text-gray-600">פרופיל אישי</p>
          </div>
        </div>
        <ChevronLeft className="w-4 h-4 text-gray-400" />
      </button>

      {/* System Settings */}
      <button
        onClick={() => {
          onOpenSettingsModal?.();
          onClose();
        }}
        className="w-full text-right p-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3"
      >
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">הגדרות מערכת</h4>
          <p className="text-sm text-gray-600">העדפות אישיות</p>
        </div>
        <ChevronLeft className="w-4 h-4 text-gray-400" />
      </button>

      {/* Main Dashboard */}
      <button
        onClick={() => {
          router.push('/dashboard');
          onClose();
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

      {/* Logout */}
      <button
        onClick={onLogout}
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
  );
};

export default SideNavigation;