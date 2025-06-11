// src/app/dashboard/business/create-business/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { generateUniqueSlug } from '@/lib/slugUtils';

export default function CreateBusiness() {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  const generateSlug = async () => {
    if (!formData.name.trim()) {
      setError('יש למלא שם עסק קודם');
      return;
    }

    try {
      const newSlug = await generateUniqueSlug(formData.name, '');
      setFormData(prev => ({ ...prev, slug: newSlug }));
    } catch (error) {
      setError('שגיאה ביצירת קישור');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.slug.trim()) {
      setError('יש למלא שם עסק וקישור');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה ביצירת העסק');
      }

      const business = await response.json();
      // הפנה לדשבורד החדש של העסק
      router.push(`/dashboard/business/${business.id}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת העסק');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ברוך הבא! 🎉</h1>
          <p className="text-gray-600">בואו ניצור את העסק הראשון שלך</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              שם העסק *
            </Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="למשל: סטודיו יופי מרים"
              required
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              קישור אישי *
            </Label>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm">mytor.app/</span>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') 
                }))}
                placeholder="הקישור-שלך"
                className="flex-1"
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateSlug}
                className="shrink-0"
              >
                🎲
              </Button>
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              תיאור קצר (אופציונלי)
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="ספר קצת על העסק שלך..."
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'יוצר עסק...' : 'צור עסק'}
          </Button>
        </form>
      </div>
    </div>
  );
}