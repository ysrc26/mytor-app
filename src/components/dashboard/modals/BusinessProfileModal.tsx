// src/components/dashboard/modals/BusinessProfileModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
import { generateUniqueSlug } from '@/lib/slugUtils';
import type { Business } from '@/lib/types';

interface BusinessProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
  onUpdate: (updatedBusiness: Partial<Business>) => Promise<void>;
}

interface EditedBusiness {
  name: string;
  slug: string;
  description: string;
  terms: string;
}

export const BusinessProfileModal = ({
  isOpen,
  onClose,
  business,
  onUpdate
}: BusinessProfileModalProps) => {
  const [editedBusiness, setEditedBusiness] = useState<EditedBusiness>({
    name: '',
    slug: '',
    description: '',
    terms: ''
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingSlug, setGeneratingSlug] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && business) {
      setEditedBusiness({
        name: business.name || '',
        slug: business.slug || '',
        description: business.description || '',
        terms: business.terms || ''
      });
    }
  }, [isOpen, business]);

  const handleInputChange = (field: keyof EditedBusiness, value: string) => {
    setEditedBusiness(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateSlug = async () => {
    if (!editedBusiness.name.trim()) {
      showErrorToast('יש להזין שם עסק תחילה');
      return;
    }

    try {
      setGeneratingSlug(true);
      const newSlug = await generateUniqueSlug(editedBusiness.name);
      handleInputChange('slug', newSlug);
      showSuccessToast('קישור חדש נוצר!');
    } catch (error) {
      showErrorToast('שגיאה ביצירת קישור');
    } finally {
      setGeneratingSlug(false);
    }
  };

  const copyPublicLink = async () => {
    try {
      const link = `${window.location.origin}/${editedBusiness.slug}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      showSuccessToast('הקישור הועתק ללוח');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showErrorToast('שגיאה בהעתקת הקישור');
    }
  };

  const handleSave = async () => {
    if (!editedBusiness.name.trim()) {
      showErrorToast('שם העסק הוא שדה חובה');
      return;
    }

    if (!editedBusiness.slug.trim()) {
      showErrorToast('קישור העסק הוא שדה חובה');
      return;
    }

    try {
      setSaving(true);
      await onUpdate(editedBusiness);
      showSuccessToast('פרטי העסק עודכנו בהצלחה');
      onClose();
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'שגיאה בעדכון פרטי העסק');
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">עריכת פרטי העסק</h2>
              <p className="text-blue-100 mt-1">עדכן את פרטי העסק והקישור הציבורי</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/20 rounded-xl transition-colors"
              disabled={saving}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Business Name */}
            <div>
              <Label htmlFor="business-name">שם העסק *</Label>
              <Input
                id="business-name"
                type="text"
                placeholder="הזן את שם העסק..."
                value={editedBusiness.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="mt-1"
                disabled={saving}
              />
            </div>

            {/* Public Link */}
            <div>
              <Label htmlFor="business-slug">קישור ציבורי *</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="business-slug"
                  type="text"
                  placeholder="my-business"
                  value={editedBusiness.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  className="flex-1"
                  disabled={saving}
                />
                <Button
                  onClick={generateSlug}
                  disabled={generatingSlug || saving}
                  variant="outline"
                  className="shrink-0"
                >
                  {generatingSlug ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'יצירה אוטומטית'
                  )}
                </Button>
              </div>
              
              {/* Preview Link */}
              {editedBusiness.slug && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      הקישור הציבורי שלך: <span className="font-mono text-blue-600">
                        {window.location.origin}/{editedBusiness.slug}
                      </span>
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={copyPublicLink}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'הועתק!' : 'העתק'}
                      </button>
                      <a
                        href={`/${editedBusiness.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        צפייה
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="business-description">תיאור העסק</Label>
              <Textarea
                id="business-description"
                placeholder="ספר על העסק שלך, השירותים שאתה מספק ומה מייחד אותך..."
                value={editedBusiness.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="mt-1 min-h-[100px]"
                disabled={saving}
              />
            </div>

            {/* Terms */}
            <div>
              <Label htmlFor="business-terms">תנאי השירות</Label>
              <Textarea
                id="business-terms"
                placeholder="תנאי ביטול, זמני הגעה, דמי ביטול וכל מידע חשוב ללקוחות..."
                value={editedBusiness.terms}
                onChange={(e) => handleInputChange('terms', e.target.value)}
                className="mt-1 min-h-[100px]"
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              ביטול
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  שמירה
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};