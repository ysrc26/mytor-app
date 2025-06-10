# MyTor - מערכת תורים אולטרה־פשוטה לעצמאים

## תיאור הפרויקט

MyTor היא מערכת תורים פשוטה ויעילה שמיועדת לעצמאים קטנים - קוסמטיקאיות, פדיקוריסטיות, מורים פרטיים, מטפלים ועוד. המערכת מאפשרת לקבל בקשות תור בקלות מבלי לתת ללקוח לבחור תור לבד, ושומרת שליטה מלאה אצל בעל העסק.

## תכונות עיקריות

### 🎯 עבור בעלי העסק
- **שליטה מלאה**: הלקוח מבקש תור ואתה מאשר/דוחה
- **עמוד עסקי אישי**: קישור ייחודי עם פרטי העסק
- **ניהול זמינות**: הגדרת ימים ושעות פעילות
- **דשבורד פשוט**: מעקב אחר כל הבקשות במקום אחד
- **התראות**: הודעות באימייל על בקשות חדשות

### 🌟 עבור הלקוחות
- **תהליך פשוט**: בחירת זמן ← אימות טלפון ← שליחת בקשה
- **בלי הורדות**: עובד מכל דפדפן, בלי אפליקציה
- **אימות בטוח**: קוד SMS למניעת בקשות מזויפות

## טכנולוגיות

- **Frontend**: Next.js 14 + React + TypeScript + TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **SMS**: Twilio (אופציונלי)
- **Email**: Resend (אופציונלי)
- **Deployment**: Vercel

## התקנה ופיתוח

### דרישות מקדימות

- Node.js 18+ 
- npm או yarn
- חשבון Supabase
- חשבון Vercel (לפריסה)

### שלבי ההתקנה

1. **שכפול הפרויקט**
```bash
git clone https://github.com/yourusername/mytor-app.git
cd mytor-app
```

2. **התקנת dependencies**
```bash
npm install
```

3. **הגדרת Supabase**
   - צור פרויקט חדש ב-[Supabase](https://supabase.com)
   - עבור ל-SQL Editor והרץ את הקוד ב-`database-setup.sql`
   - העתק את ה-URL ואת ה-keys מ-Settings > API

4. **הגדרת קובץ Environment**
```bash
cp .env.example .env.local
```

ערוך את `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. **הפעלה בפיתוח**
```bash
npm run dev
```

האתר יהיה זמין בכתובת: `http://localhost:3000`

### הגדרות אופציונליות

#### SMS (Twilio)
```env
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone
```

#### Email (Resend)
```env
RESEND_API_KEY=your-resend-api-key
```

## מבנה הפרויקט

```
mytor-app/
├── src/
│   ├── app/                 # App Router pages
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Business owner dashboard
│   │   ├── [slug]/         # Public business pages
│   │   └── page.tsx        # Homepage
│   └── lib/                # Utilities and helpers
├── public/                 # Static assets
├── middleware.ts           # Auth middleware
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - הרשמת בעל עסק
- `POST /api/auth/login` - התחברות

### User Management  
- `GET /api/users/me` - שליפת פרטי המשתמש
- `PUT /api/users/me` - עדכון פרופיל

### Availability
- `GET /api/availability` - שליפת זמינות
- `POST /api/availability` - הוספת זמינות
- `POST /api/unavailable` - חסימת תאריכים

### Appointments
- `GET /api/appointments` - שליפת תורים (בעל עסק)
- `POST /api/appointments/request` - בקשת תור (ציבורי)
- `PUT /api/appointments/:id/status` - עדכון סטטוס

### OTP Verification
- `POST /api/otp/send` - שליחת קוד אימות
- `POST /api/otp/verify` - אימות קוד

### Public API
- `GET /api/public/:slug` - פרטי עמוד עסקי

## פריסה לפרודקשן

### Vercel (מומלץ)

1. **חבר את הפרויקט ל-Vercel**
```bash
npm i -g vercel
vercel
```

2. **הגדר Environment Variables ב-Vercel Dashboard**
   - כל המשתנים מ-`.env.local`
   - שנה את `NEXT_PUBLIC_APP_URL` לדומיין הסופי

3. **Deploy**
```bash
vercel --prod
```

### Docker (אופציונלי)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## תכונות לפיתוח עתידי

### שלב 2 - תכונות מתקדמות
- [ ] SMS תזכורות ללקוחות
- [ ] אינטגרציה עם Google Calendar
- [ ] מערכת תשלומים (Stripe/PayBox)
- [ ] צ'אט WhatsApp אוטומטי
- [ ] ניהול לקוחות חוזרים
- [ ] אנליטיקה ודוחות

### שלב 3 - גרסה עסקית
- [ ] ניהול מספר מטפלים
- [ ] הזמנות קבוצתיות
- [ ] מערכת נקודות נאמנות
- [ ] אפליקציה ניידת
- [ ] API פתוח לאינטגרציות

## בעיות נפוצות ופתרונות

### שגיאת חיבור ל-Supabase
```bash
Error: Invalid API key
```
**פתרון**: בדוק ש-NEXT_PUBLIC_SUPABASE_URL ו-ANON_KEY נכונים

### SMS לא נשלח
```bash
OTP not delivered
```
**פתרון**: 
1. בדוק שחשבון Twilio פעיל
2. ודא שמספר הטלפון בפורמט נכון (05xxxxxxxx)
3. בפיתוח - הקוד מודפס לקונסול

### בעיות עם RTL/עברית
**פתרון**: 
- וודא ש-`dir="rtl"` מוגדר ב-HTML
- בדוק ש-Tailwind מוגדר נכון לעברית

### שגיאות אימות
```bash
Unauthorized access
```
**פתרון**: 
1. בדוק שהמשתמש מחובר
2. ודא ש-middleware פועל נכון
3. בדוק RLS policies ב-Supabase

## תמיכה וקהילה

### דיווח על באגים
פתח Issue חדש ב-GitHub עם:
- תיאור הבעיה
- שלבים לשחזור
- צילומי מסך (אם רלוונטי)
- פרטי סביבה (דפדפן, מכשיר)

### בקשות תכונות
השתמש ב-Feature Request template ב-Issues

### קידוד ותרומה
1. Fork הפרויקט
2. צור branch חדש: `git checkout -b feature/amazing-feature`
3. Commit השינויים: `git commit -m 'Add amazing feature'`
4. Push ל-branch: `git push origin feature/amazing-feature`
5. פתח Pull Request

## רישיון

MIT License - ראה קובץ [LICENSE](LICENSE) לפרטים

## יוצרים

- **[שמך]** - פיתוח ראשי - [@yourusername](https://github.com/yourusername)

## תודות

- [Supabase](https://supabase.com) - Backend-as-a-Service מעולה
- [Vercel](https://vercel.com) - פלטפורמת deployment מושלמת
- [Tailwind CSS](https://tailwindcss.com) - framework CSS נהדר
- הקהילה הישראלית של מפתחים

---

## מדריך שימוש מהיר

### עבור בעל עסק

1. **הרשמה**
   - הירשם עם אימייל וסיסמה
   - מלא פרטי עסק בסיסיים

2. **הגדרת זמינות**
   - עבור לטאב "זמינות" בדשבורד
   - הגדר ימים ושעות פעילות
   - חסום תאריכים מיוחדים (חגים, חופשות)

3. **שיתוף הקישור**
   - העתק את הקישור מהדשבורד
   - שתף עם לקוחות בוואטסאפ/רשתות חברתיות

4. **ניהול בקשות**
   - קבל התראות על בקשות חדשות
   - אשר או דחה בקשות מהדשבורד

### עבור לקוח

1. **כניסה לעמוד העסק**
   - לחץ על הקישור שקיבלת

2. **בחירת זמן**
   - בחר תאריך ושעה מהאפשרויות הזמינות
   - מלא שם וטלפון

3. **אימות טלפון**
   - קבל קוד SMS
   - הכנס את הקוד

4. **אישור בקשה**
   - בעל העסק יקבל את הבקשה
   - תקבל עדכון על האישור/דחייה

---

## שאלות נפוצות (FAQ)

**ש: האם המערכת בחינם?**
ת: יש תוכנית חינמית עד 10 תורים בחודש, ותוכניות בתשלום למשתמשים כבדים יותר.

**ש: האם אפשר לשנות את העיצוב?**
ת: בגרסה הפרימיום יש אפשרויות התאמה אישית מוגבלות. לשינויים מורכבים יותר נדרש פיתוח מותאם.

**ש: מה קורה אם הלקוח לא מקבל SMS?**
ת: יש אפשרות לקבל את הקוד בשיחה קולית כחלופה.

**ש: האם אפשר לחבר לגוגל קלנדר?**
ת: זה מתוכנן לגרסאות עתידיות.

**ש: איך מוחקים חשבון?**
ת: צור קשר עם התמיכה דרך האימייל או הדשבורד.

---

## רישום שינויים (Changelog)

### גרסה 1.0.0 (2025-01-XX)
- **תכונות חדשות:**
  - מערכת בקשת תורים בסיסית
  - אימות SMS/שיחה קולית
  - דשבורד לבעלי עסק
  - ניהול זמינות שבועית
  - התראות אימייל

- **תיקונים:**
  - שיפור ביצועים
  - תיקון באגים בטפסים

### גרסה 0.9.0 (Beta)
- **תכונות חדשות:**
  - עמודי עסק ציבוריים
  - מערכת אימות
  - API בסיסי

---

*מסמך זה מתעדכן באופן שוטף. לעדכונים אחרונים בקר ב-GitHub Repository.*