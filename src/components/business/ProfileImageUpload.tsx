// src/components/business/ProfileImageUpload.tsx
'use client';

import { useState, useRef } from 'react';
import { Camera, Trash2, Upload, User } from 'lucide-react';
import { useBusinessData } from '@/hooks/useBusinessData';

interface ProfileImageUploadProps {
  businessId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProfileImageUpload = ({
  businessId,
  size = 'md',
  className = ''
}: ProfileImageUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    business, 
    uploadingImage, 
    uploadProfileImage, 
    deleteProfileImage 
  } = useBusinessData(businessId);

  // גדלים שונים
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  /**
   * טיפול בבחירת קובץ
   */
  const handleFileSelect = async (file: File) => {
    await uploadProfileImage(file);
  };

  /**
   * טיפול ב-file input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * טיפול ב-drag & drop
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  /**
   * מחיקת תמונה
   */
  const handleDeleteImage = async () => {
    await deleteProfileImage();
  };

  /**
   * פתיחת file picker
   */
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // אם אין עדיין נתוני עסק - הצג loading
  if (!business) {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <div className="w-full h-full rounded-full bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      {/* תמונת הפרופיל */}
      <div
        className={`
          ${sizeClasses[size]} 
          relative rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200
          ${dragActive ? 'border-blue-400 bg-blue-50' : ''}
          ${uploadingImage ? 'opacity-50' : ''}
          transition-all duration-200
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {business.profile_image_url ? (
          <img
            src={business.profile_image_url}
            alt={`תמונת פרופיל של ${business.name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <User className={iconSizes[size]} />
          </div>
        )}

        {/* Loading overlay */}
        {uploadingImage && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          </div>
        )}

        {/* Drag overlay */}
        {dragActive && (
          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
        )}
      </div>

      {/* פקדי עריכה */}
      <div className="absolute -bottom-1 -right-1 flex gap-1">
        {/* כפתור העלאה/עריכה */}
        <button
          onClick={openFilePicker}
          disabled={uploadingImage}
          className="
            w-8 h-8 bg-blue-600 text-white rounded-full
            flex items-center justify-center
            hover:bg-blue-700 transition-colors
            shadow-lg hover:shadow-xl
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          title="העלה תמונה"
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* כפתור מחיקה */}
        {business.profile_image_url && (
          <button
            onClick={handleDeleteImage}
            disabled={uploadingImage}
            className="
              w-8 h-8 bg-red-600 text-white rounded-full
              flex items-center justify-center
              hover:bg-red-700 transition-colors
              shadow-lg hover:shadow-xl
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            title="מחק תמונה"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* הוראות drag & drop */}
      {size === 'lg' && (
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-500">
            גרור תמונה או לחץ על מצלמה
          </p>
          <p className="text-xs text-gray-400">
            עד 5MB | JPG, PNG, GIF
          </p>
        </div>
      )}
    </div>
  );
};