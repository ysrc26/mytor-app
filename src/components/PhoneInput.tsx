// src/components/PhoneInput.tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  label = "מספר טלפון",
  placeholder = "050-1234567",
  required = false,
  className
}: PhoneInputProps) {
  const [isValid, setIsValid] = useState(true);

  const formatPhone = (input: string) => {
    // הסרת כל מה שלא ספרות
    const numbers = input.replace(/\D/g, '');
    
    // הגבלה ל-10 ספרות
    const limited = numbers.slice(0, 10);
    
    // פורמט עם מקפים
    if (limited.length >= 3) {
      if (limited.length >= 6) {
        return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
      } else {
        return `${limited.slice(0, 3)}-${limited.slice(3)}`;
      }
    }
    
    return limited;
  };

  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return /^05\d{8}$/.test(cleanPhone);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    onChange(formatted);
    
    if (formatted) {
      setIsValid(validatePhone(formatted));
    } else {
      setIsValid(true); // ריק זה תקין
    }
  };

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="phone" className="block mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Input
        id="phone"
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className={cn(
          "text-left",
          !isValid && value && "border-red-300 focus:border-red-500"
        )}
        dir="ltr"
      />
      {!isValid && value && (
        <p className="text-red-500 text-sm mt-1">
          מספר טלפון לא תקין (צריך להתחיל ב-05 ולהכיל 10 ספרות)
        </p>
      )}
    </div>
  );
}