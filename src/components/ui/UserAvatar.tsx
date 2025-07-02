// src/components/ui/UserAvatar.tsx
'use client';

import { User as UserIcon } from 'lucide-react';
import type { User } from '@/lib/types';

interface UserAvatarProps {
  user?: User | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showFallback?: boolean;
  className?: string;
}

export const UserAvatar = ({ 
  user, 
  size = 'md', 
  showFallback = true,
  className = '' 
}: UserAvatarProps) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  // Get profile picture URL
  const getProfilePicUrl = () => {
    if (user?.profile_pic) return user.profile_pic;
    return null;
  };

  // Get user initials
  const getInitials = () => {
    if (!user?.full_name) return 'U';
    
    const names = user.full_name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const profilePicUrl = getProfilePicUrl();
  const initials = getInitials();

  if (profilePicUrl) {
    return (
      <div className={`${sizeClasses[size]} ${className} relative`}>
        <img
          src={profilePicUrl}
          alt={`${user?.full_name || 'משתמש'} - תמונת פרופיל`}
          className="w-full h-full rounded-full object-cover border-2 border-white shadow-sm"
          onError={(e) => {
            // If image fails to load, hide it and show fallback
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            
            // Show fallback
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) {
              fallback.style.display = 'flex';
            }
          }}
        />
        
        {/* Fallback that's initially hidden */}
        <div 
          className={`absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold ${sizeClasses[size]}`}
          style={{ display: 'none' }}
        >
          {initials}
        </div>
      </div>
    );
  }

  // Fallback when no profile picture
  if (showFallback) {
    return (
      <div className={`${sizeClasses[size]} ${className} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold`}>
        {user?.full_name ? initials : <UserIcon className={iconSizes[size]} />}
      </div>
    );
  }

  return null;
};