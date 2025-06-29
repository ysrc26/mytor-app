// src/components/dashboard/modals/DeleteConfirmationModal.tsx
'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Appointment } from '@/lib/types';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  appointment?: Appointment | null;
}

export const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'מחק',
  cancelText = 'ביטול',
  isDangerous = true,
  appointment
}: DeleteConfirmationModalProps) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    try {
      setDeleting(true);
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handling should be done in the parent component
      console.error('Delete error:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !deleting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className={`${isDangerous ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'} text-white p-6 rounded-t-2xl`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{title}</h2>
                <p className="text-sm opacity-90">פעולה זו לא ניתנת לביטול</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              disabled={deleting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-center mb-6">
            {description}
          </p>

          {/* Appointment Details (if provided) */}
          {appointment && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-500">לקוח:</span>
                  <div className="font-medium">{appointment.client_name}</div>
                </div>
                <div>
                  <span className="text-gray-500">טלפון:</span>
                  <div className="font-medium">{appointment.client_phone}</div>
                </div>
                <div>
                  <span className="text-gray-500">תאריך:</span>
                  <div className="font-medium">
                    {new Date(appointment.date).toLocaleDateString('he-IL', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">שעה:</span>
                  <div className="font-medium">{appointment.time}</div>
                </div>
                {appointment.note && (
                  <div className="col-span-2">
                    <span className="text-gray-500">הערות:</span>
                    <div className="font-medium">{appointment.note}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warning Message */}
          {isDangerous && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">אזהרה!</span>
              </div>
              <p className="text-red-600 text-sm mt-1">
                פעולה זו תמחק את הנתונים לצמיתות ולא ניתן יהיה לשחזר אותם.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={deleting}
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={deleting}
              className={isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  מוחק...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {confirmText}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};