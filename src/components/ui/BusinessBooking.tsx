// src/components/ui/BusinessBooking.tsx
import React from 'react';
import ServiceBookingCard from './ServiceBookingCard';
import { BookingService, BookingAvailability } from '@/lib/types';

interface BusinessBookingProps {
    businessSlug: string;
    businessName: string;
    services: BookingService[];
    availability: BookingAvailability[];
    businessTerms?: string;
    onClose?: () => void;
}

const BusinessBooking: React.FC<BusinessBookingProps> = ({
    businessSlug,
    businessName,
    services,
    availability,
    businessTerms,
    onClose
  }) => {
    if (services.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600">אין שירותים זמינים כרגע</p>
        </div>
      );
    }
  
    return (
      <div className="space-y-6">
        {/* הצג כותרת רק אם לא במודל */}
        {!onClose && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">השירותים שלנו</h2>
            <p className="text-gray-600">בחר שירות וקבע תור בקלות</p>
          </div>
        )}
        
        {services.map((service) => (
          <ServiceBookingCard
            key={service.id}
            service={service}
            availability={availability}
            businessSlug={businessSlug}
            businessName={businessName}
            businessTerms={businessTerms}
            onClose={onClose} // העבר את זה הלאה
          />
        ))}
      </div>
    );
  };

export default BusinessBooking;