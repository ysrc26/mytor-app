// src/components/dashboard/modals/ServicesModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Clock, DollarSign, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import type { Service } from '@/lib/types';

interface ServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  onAddService: (serviceData: Omit<Service, 'id' | 'business_id' | 'created_at'>) => Promise<void>;
  onUpdateService: (serviceId: string, serviceData: Partial<Service>) => Promise<void>;
  onDeleteService: (serviceId: string) => Promise<void>;
}

interface ServiceForm {
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

export const ServicesModal = ({
  isOpen,
  onClose,
  services,
  onAddService,
  onUpdateService,
  onDeleteService
}: ServicesModalProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceForm>({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 0,
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    service: Service | null;
  }>({ isOpen: false, service: null });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setServiceForm({
      name: '',
      description: '',
      duration_minutes: 60,
      price: 0,
      is_active: true
    });
    setEditingService(null);
    setShowForm(false);
  };

  const handleInputChange = (field: keyof ServiceForm, value: string | number | boolean) => {
    setServiceForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddService = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEditService = (service: Service) => {
    setServiceForm({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price: service.price || 0,
      is_active: service.is_active
    });
    setEditingService(service);
    setShowForm(true);
  };

  const handleSaveService = async () => {
    if (!serviceForm.name.trim()) {
      showErrorToast('שם השירות הוא שדה חובה');
      return;
    }

    if (serviceForm.duration_minutes <= 0) {
      showErrorToast('משך השירות חייב להיות חיובי');
      return;
    }

    try {
      setSaving(true);
      
      if (editingService) {
        await onUpdateService(editingService.id, serviceForm);
        showSuccessToast('השירות עודכן בהצלחה');
      } else {
        await onAddService(serviceForm);
        showSuccessToast('השירות נוסף בהצלחה');
      }
      
      resetForm();
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'שגיאה בשמירת השירות');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (service: Service) => {
    setDeleteModal({ isOpen: true, service });
  };

  const confirmDeleteService = async () => {
    if (!deleteModal.service) return;

    try {
      await onDeleteService(deleteModal.service.id);
      showSuccessToast('השירות נמחק בהצלחה');
      setDeleteModal({ isOpen: false, service: null });
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'שגיאה במחיקת השירות');
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
      <div 
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleOverlayClick}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">ניהול שירותים</h2>
                <p className="text-purple-100 mt-1">הוסף, ערוך ונהל את השירותים שלך</p>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Add Service Button */}
            {!showForm && (
              <div className="mb-6">
                <Button onClick={handleAddService} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  הוסף שירות חדש
                </Button>
              </div>
            )}

            {/* Service Form */}
            {showForm && (
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {editingService ? 'עריכת שירות' : 'שירות חדש'}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Service Name */}
                  <div className="md:col-span-2">
                    <Label htmlFor="service-name">שם השירות *</Label>
                    <Input
                      id="service-name"
                      type="text"
                      placeholder="למשל: תספורת, מניקור..."
                      value={serviceForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="mt-1"
                      disabled={saving}
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <Label htmlFor="service-duration">משך זמן (דקות) *</Label>
                    <div className="relative mt-1">
                      <Input
                        id="service-duration"
                        type="number"
                        min="5"
                        max="480"
                        step="5"
                        placeholder="60"
                        value={serviceForm.duration_minutes}
                        onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 0)}
                        disabled={saving}
                      />
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <Label htmlFor="service-price">מחיר (₪)</Label>
                    <div className="relative mt-1">
                      <Input
                        id="service-price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={serviceForm.price}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        disabled={saving}
                      />
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <Label htmlFor="service-description">תיאור השירות</Label>
                    <Textarea
                      id="service-description"
                      placeholder="תאר מה כולל השירות..."
                      value={serviceForm.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="mt-1"
                      disabled={saving}
                    />
                  </div>

                  {/* Active Status */}
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={serviceForm.is_active}
                        onChange={(e) => handleInputChange('is_active', e.target.checked)}
                        disabled={saving}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">שירות פעיל</span>
                    </label>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 mt-6">
                  <Button onClick={handleSaveService} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
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
            )}

            {/* Services List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">השירותים שלך ({services.length})</h3>
              
              {services.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <div className="text-6xl mb-4">🎯</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">אין שירותים עדיין</h4>
                  <p className="text-gray-600 mb-4">הוסף את השירות הראשון שלך כדי להתחיל לקבל תורים</p>
                  <Button onClick={handleAddService} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    הוסף שירות ראשון
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{service.name}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              service.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {service.is_active ? 'פעיל' : 'לא פעיל'}
                            </span>
                          </div>
                          
                          {service.description && (
                            <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{service.duration_minutes} דקות</span>
                            </div>
                            {service.price && service.price > 0 && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                <span>₪{service.price}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditService(service)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="ערוך שירות"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="מחק שירות"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, service: null })}
        onConfirm={confirmDeleteService}
        title="מחיקת שירות"
        description={`האם אתה בטוח שברצונך למחוק את השירות "${deleteModal.service?.name}"?`}
        confirmText="מחק שירות"
        cancelText="ביטול"
        isDangerous={true}
      />
    </>
  );
};