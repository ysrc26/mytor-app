// src/components/dashboard/BusinessProfileImage.tsx
'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
import type { Business } from '@/lib/types';

interface BusinessProfileImageProps {
  business: Business;
  onImageUpdate?: (imageUrl: string | null) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
}

const SIZE_CLASSES = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16', 
  lg: 'w-24 h-24',
  xl: 'w-32 h-32'
};

const SIZE_ICON_CLASSES = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-6 h-6', 
  xl: 'w-8 h-8'
};

export const BusinessProfileImage = ({
  business,
  onImageUpdate,
  size = 'lg',
  editable = false
}: BusinessProfileImageProps) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEditOptions, setShowEditOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showErrorToast('אנא בחר קובץ תמונה');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showErrorToast('גודל הקובץ חייב להיות עד 5MB');
      return;
    }

    setUploading(true);
    setShowEditOptions(false);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`/api/businesses/${business.id}/profile-image`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        showSuccessToast('תמונת הפרופיל עודכנה בהצלחה');
        onImageUpdate?.(data.profile_image_url);
      } else {
        const error = await response.json();
        showErrorToast(error.error || 'שגיאה בהעלאת התמונה');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showErrorToast('שגיאה בהעלאת התמונה');
    } finally {
      setUploading(false);
      // Clear the input value to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את תמונת הפרופיל?')) {
      return;
    }

    setDeleting(true);
    setShowEditOptions(false);

    try {
      const response = await fetch(`/api/businesses/${business.id}/profile-image`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccessToast('תמונת הפרופיל נמחקה');
        onImageUpdate?.(null);
      } else {
        const error = await response.json();
        showErrorToast(error.error || 'שגיאה במחיקת התמונה');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      showErrorToast('שגיאה במחיקת התמונה');
    } finally {
      setDeleting(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
    setShowEditOptions(false);
  };

  const renderImage = () => {
    if (business.profile_image_url) {
      return (
        <img
          src={business.profile_image_url}
          alt={`תמונת פרופיל של ${business.name}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
        <User className={SIZE_ICON_CLASSES[size]} />
      </div>
    );
  };

  const renderEditOverlay = () => {
    if (!editable || (!uploading && !deleting && !showEditOptions)) return null;

    if (uploading || deleting) {
      return (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-full">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mx-auto mb-1"></div>
            <div className="text-xs">
              {uploading ? 'מעלה...' : 'מוחק...'}
            </div>
          </div>
        </div>
      );
    }

    if (showEditOptions) {
      return (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-full">
          <div className="flex gap-2">
            <button
              onClick={openFileDialog}
              className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
              title="העלה תמונה חדשה"
            >
              <Upload className="w-4 h-4" />
            </button>
            
            {business.profile_image_url && (
              <button
                onClick={handleDeleteImage}
                className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                title="מחק תמונה"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => setShowEditOptions(false)}
              className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
              title="ביטול"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="relative inline-block">
      {/* Main Image Container */}
      <div
        className={`
          ${SIZE_CLASSES[size]} rounded-full overflow-hidden border-2 border-gray-200 bg-white
          ${editable ? 'cursor-pointer hover:border-blue-300 transition-colors' : ''}
          relative
        `}
        onClick={() => editable && setShowEditOptions(true)}
      >
        {renderImage()}
        {renderEditOverlay()}
        
        {/* Edit indicator */}
        {editable && !uploading && !deleting && !showEditOptions && (
          <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1.5 text-white shadow-lg transform translate-x-1 translate-y-1">
            <Camera className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error fallback for broken images */}
      {business.profile_image_url && (
        <style jsx>{`
          img[src="${business.profile_image_url}"] {
            display: block;
          }
          img[src="${business.profile_image_url}"]:not([style*="display: none"]) + div {
            display: none;
          }
        `}</style>
      )}
    </div>
  );
};

// ===================================
// 🎯 Profile Header Component
// ===================================

interface BusinessProfileHeaderProps {
  business: Business;
  onBusinessUpdate?: (updates: Partial<Business>) => void;
  editable?: boolean;
}

export const BusinessProfileHeader = ({
  business,
  onBusinessUpdate,
  editable = false
}: BusinessProfileHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: business.name || '',
    description: business.description || '',
    phone: business.phone || '',
    address: business.address || ''
  });
  const [saving, setSaving] = useState(false);

  const handleImageUpdate = (imageUrl: string | null) => {
    onBusinessUpdate?.({ profile_image_url: imageUrl });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/businesses/${business.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedBusiness = await response.json();
        onBusinessUpdate?.(updatedBusiness);
        setIsEditing(false);
        showSuccessToast('פרטי העסק עודכנו בהצלחה');
      } else {
        const error = await response.json();
        showErrorToast(error.error || 'שגיאה בעדכון פרטי העסק');
      }
    } catch (error) {
      console.error('Error updating business:', error);
      showErrorToast('שגיאה בעדכון פרטי העסק');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: business.name || '',
      description: business.description || '',
      phone: business.phone || '',
      address: business.address || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        {/* Profile Image */}
        <div className="flex-shrink-0">
          <BusinessProfileImage
            business={business}
            onImageUpdate={handleImageUpdate}
            size="xl"
            editable={editable}
          />
        </div>

        {/* Business Info */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-4">
              {/* Edit Form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם העסק
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="הזן שם עסק..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  תיאור העסק
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="תאר את העסק שלך..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    טלפון
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="050-1234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    כתובת
                  </label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="כתובת העסק..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving || !editForm.name.trim()}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      שומר...
                    </>
                  ) : (
                    'שמור שינויים'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  ביטול
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Display Mode */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {business.name || 'ללא שם'}
                  </h1>
                  {business.description && (
                    <p className="text-gray-600 leading-relaxed">
                      {business.description}
                    </p>
                  )}
                </div>
                
                {editable && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    ערוך
                  </Button>
                )}
              </div>

              {/* Contact Details */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {business.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{business.phone}</span>
                  </div>
                )}
                
                {business.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{business.address}</span>
                  </div>
                )}
              </div>

              {/* Business Stats */}
              <div className="flex gap-4 pt-2">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {business.total_appointments || 0}
                  </div>
                  <div className="text-xs text-gray-500">תורים</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {business.total_services || 0}
                  </div>
                  <div className="text-xs text-gray-500">שירותים</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {business.rating || '5.0'}
                  </div>
                  <div className="text-xs text-gray-500">דירוג</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===================================
// 🖼️ Profile Image Gallery Component
// ===================================

interface BusinessImageGalleryProps {
  business: Business;
  onImagesUpdate?: (images: string[]) => void;
  editable?: boolean;
  maxImages?: number;
}

export const BusinessImageGallery = ({
  business,
  onImagesUpdate,
  editable = false,
  maxImages = 6
}: BusinessImageGalleryProps) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images = business.gallery_images || [];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (images.length + files.length > maxImages) {
      showErrorToast(`ניתן להעלות עד ${maxImages} תמונות`);
      return;
    }

    // Validate all files before uploading
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        showErrorToast('אנא בחר רק קבצי תמונה');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast('גודל הקובץ חייב להיות עד 5MB');
        return;
      }
    }

    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`images`, file);
      });

      const response = await fetch(`/api/businesses/${business.id}/gallery`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        showSuccessToast(`${files.length} תמונות הועלו בהצלחה`);
        onImagesUpdate?.(data.gallery_images);
      } else {
        const error = await response.json();
        showErrorToast(error.error || 'שגיאה בהעלאת התמונות');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      showErrorToast('שגיאה בהעלאת התמונות');
    } finally {
      setUploading(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק תמונה זו?')) {
      return;
    }

    setDeleting(imageUrl);

    try {
      const response = await fetch(`/api/businesses/${business.id}/gallery`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      });

      if (response.ok) {
        const data = await response.json();
        showSuccessToast('תמונה נמחקה');
        onImagesUpdate?.(data.gallery_images);
      } else {
        const error = await response.json();
        showErrorToast(error.error || 'שגיאה במחיקת התמונה');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      showErrorToast('שגיאה במחיקת התמונה');
    } finally {
      setDeleting(null);
    }
  };

  if (images.length === 0 && !editable) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          גלריית תמונות
        </h3>
        
        {editable && images.length < maxImages && (
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            size="sm"
            className="flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                מעלה...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                הוסף תמונות
              </>
            )}
          </Button>
        )}
      </div>

      {images.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Camera className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>אין תמונות בגלריה</p>
          {editable && (
            <p className="text-sm mt-1">הוסף תמונות להציג את העסק שלך</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
            >
              <img
                src={imageUrl}
                alt={`תמונה ${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              
              {editable && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                  <button
                    onClick={() => handleDeleteImage(imageUrl)}
                    disabled={deleting === imageUrl}
                    className="opacity-0 group-hover:opacity-100 p-2 bg-red-600 text-white rounded-full transition-opacity hover:bg-red-700"
                  >
                    {deleting === imageUrl ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};