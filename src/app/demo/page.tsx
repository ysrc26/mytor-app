// src/app/demo/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Phone, User, MessageCircle, CheckCircle, Star, MapPin } from 'lucide-react';

// נתוני דוגמה
const demoBusinessData = {
  user: {
    id: "demo-1",
    full_name: "שרה כהן",
    phone: "050-123-4567",
    slug: "sarah-beauty",
    description: "מטפלת קוסמטיקה מקצועית עם 8 שנות ניסיון. מתמחה בטיפולי פנים, עיצוב גבות ופדיקור רפואי. מזמינה אתכן לחוויה מפנקת ומקצועית במכון הפרטי שלי.",
    profile_pic: "",
    terms: "• ביטול תור יש לבצע עד 24 שעות מראש\n• איחור של יותר מ-15 דקות עלול לגרום לביטול התור\n• התשלום במזומן או בהעברה בנקאית\n• נא להגיע עם איפור מינימלי לטיפולי פנים",
    payment_link: null,
    created_at: "2024-01-01T00:00:00Z"
  },
  availability: [
    { id: "1", user_id: "demo-1", day_of_week: 0, start_time: "09:00", end_time: "16:00", is_active: true },
    { id: "2", user_id: "demo-1", day_of_week: 1, start_time: "09:00", end_time: "18:00", is_active: true },
    { id: "3", user_id: "demo-1", day_of_week: 2, start_time: "09:00", end_time: "18:00", is_active: true },
    { id: "4", user_id: "demo-1", day_of_week: 3, start_time: "09:00", end_time: "18:00", is_active: true },
    { id: "5", user_id: "demo-1", day_of_week: 4, start_time: "09:00", end_time: "16:00", is_active: true }
  ]
};

const DAYS_HEBREW = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export default function DemoBusinessPage() {
  const [appointmentRequest, setAppointmentRequest] = useState({
    client_name: '',
    client_phone: '',
    date: '',
    time: '',
    note: ''
  });
  
  const [showOTP, setShowOTP] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [success, setSuccess] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // יצירת רשימת זמנים זמינים
  const getAvailableSlots = () => {
    const slots: { day: string, dayNum: number, times: string[] }[] = [];
    
    demoBusinessData.availability
      .filter(avail => avail.is_active)
      .forEach(avail => {
        const times: string[] = [];
        const start = parseTime(avail.start_time);
        const end = parseTime(avail.end_time);
        
        // יצירת משבצות של 30 דקות
        for (let hour = start.hour; hour < end.hour || (hour === end.hour && start.minute < end.minute); hour++) {
          for (let minute = (hour === start.hour ? start.minute : 0); minute < 60; minute += 30) {
            if (hour === end.hour && minute >= end.minute) break;
            times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
          }
        }
        
        slots.push({
          day: DAYS_HEBREW[avail.day_of_week],
          dayNum: avail.day_of_week,
          times
        });
      });
    
    return slots.sort((a, b) => a.dayNum - b.dayNum);
  };

  const parseTime = (timeStr: string) => {
    const [hour, minute] = timeStr.split(':').map(Number);
    return { hour, minute };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!showOTP) {
      // שליחת קוד OTP (דוגמה)
      setShowOTP(true);
    } else {
      // אימות קוד (דוגמה)
      if (otpCode === '1234') {
        setSuccess(true);
        setDialogOpen(false);
        // איפוס
        setAppointmentRequest({
          client_name: '',
          client_phone: '',
          date: '',
          time: '',
          note: ''
        });
        setShowOTP(false);
        setOtpCode('');
      } else {
        alert('קוד שגוי - נסה 1234');
      }
    }
  };

  const availableSlots = getAvailableSlots();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* כותרת דוגמה */}
      <div className="bg-blue-500 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-xl font-bold">🎯 דף דוגמה - MyTor</h1>
          <p className="text-blue-100 mt-1">כך ייראה הדף האישי של העסק שלך</p>
        </div>
      </div>

      {/* הצלחה */}
      {success && (
        <Alert className="mx-4 mt-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            🎉 בקשתך נשלחה בהצלחה! שרה תצור איתך קשר בקרוב.
          </AlertDescription>
        </Alert>
      )}

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* כרטיס פרטי העסק */}
        <Card className="mb-6 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4 space-x-reverse">
              <Avatar className="h-20 w-20 border-4 border-blue-100">
                <AvatarFallback className="text-2xl bg-blue-500 text-white">
                  ש
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {demoBusinessData.user.full_name}
                  </h1>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
                
                <p className="text-gray-600 mb-3 leading-relaxed">
                  {demoBusinessData.user.description}
                </p>
                
                <div className="flex items-center text-gray-500 mb-2">
                  <Phone className="h-4 w-4 ml-2" />
                  <span className="font-hebrew">{demoBusinessData.user.phone}</span>
                </div>
                
                <div className="flex items-center text-gray-500 mb-4">
                  <MapPin className="h-4 w-4 ml-2" />
                  <span>רחוב הרצל 45, תל אביב</span>
                </div>
                
                <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-green-50 text-green-700">
                    <Calendar className="h-3 w-3 ml-1" />
                    זמין לתורים
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    ⚡ מענה מהיר
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* שירותים */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>השירותים שלי</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'טיפול פנים קלאסי', price: '₪120', duration: '60 דק' },
                { name: 'עיצוב גבות', price: '₪80', duration: '30 דק' },
                { name: 'פדיקור רפואי', price: '₪150', duration: '45 דק' },
                { name: 'הסרת שיער בלייזר', price: '₪200', duration: '30 דק' }
              ].map((service, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <div className="font-medium text-gray-900">{service.name}</div>
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>{service.duration}</span>
                    <span className="font-medium text-blue-600">{service.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* זמני פעילות */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 ml-2" />
              שעות פעילות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableSlots.map((slot, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="font-medium text-gray-900">{slot.day}</span>
                  <div className="flex flex-wrap gap-2">
                    {slot.times.slice(0, 4).map((time, timeIndex) => (
                      <Badge key={timeIndex} variant="outline" className="text-xs">
                        {time}
                      </Badge>
                    ))}
                    {slot.times.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{slot.times.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* תנאים */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>תנאים חשובים</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {demoBusinessData.user.terms}
            </p>
          </CardContent>
        </Card>

        {/* כפתור בקשת תור */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="lg" 
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-4 text-lg"
            >
              <MessageCircle className="h-5 w-5 ml-2" />
              בקש תור אצל שרה
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>בקשת תור אצל שרה</DialogTitle>
              <DialogDescription>
                {showOTP ? 'הזן את הקוד 1234 (דוגמה)' : 'מלא את הפרטים לבקשת תור'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!showOTP ? (
                <>
                  <div>
                    <Label htmlFor="name">שם מלא *</Label>
                    <Input
                      id="name"
                      value={appointmentRequest.client_name}
                      onChange={(e) => setAppointmentRequest({
                        ...appointmentRequest,
                        client_name: e.target.value
                      })}
                      placeholder="השם שלך"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">מספר טלפון *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={appointmentRequest.client_phone}
                      onChange={(e) => setAppointmentRequest({
                        ...appointmentRequest,
                        client_phone: e.target.value
                      })}
                      placeholder="050-1234567"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="date">יום מועדף *</Label>
                    <select
                      id="date"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={appointmentRequest.date}
                      onChange={(e) => setAppointmentRequest({
                        ...appointmentRequest,
                        date: e.target.value,
                        time: ''
                      })}
                      required
                    >
                      <option value="">בחר יום</option>
                      {availableSlots.map((slot, index) => (
                        <option key={index} value={slot.dayNum.toString()}>
                          {slot.day}
                        </option>
                      ))}
                    </select>
                  </div>

                  {appointmentRequest.date && (
                    <div>
                      <Label htmlFor="time">שעה מועדפת *</Label>
                      <select
                        id="time"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={appointmentRequest.time}
                        onChange={(e) => setAppointmentRequest({
                          ...appointmentRequest,
                          time: e.target.value
                        })}
                        required
                      >
                        <option value="">בחר שעה</option>
                        {availableSlots.find(slot => slot.dayNum.toString() === appointmentRequest.date)?.times.map((time, index) => (
                          <option key={index} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <Label htmlFor="otp">קוד אימות</Label>
                  <Input
                    id="otp"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="הזן 1234"
                    maxLength={4}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    📱 נשלח קוד ל-{appointmentRequest.client_phone}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setShowOTP(false);
                  }}
                  className="flex-1"
                >
                  ביטול
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  {showOTP ? 'אמת ושלח' : 'קבל קוד אימות'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* הודעה תחתית */}
        <div className="text-center mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 זהו דף דוגמה. ללמוד איך ליצור דף כזה לעסק שלך ב-
            <span className="font-bold">MyTor</span>
          </p>
        </div>
      </div>
    </div>
  );
}