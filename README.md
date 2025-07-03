# 📅 MyTor - מערכת תורים פשוטה לעצמאים

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> מערכת תורים אולטרה-פשוטה לעצמאים קטנים - **ללא אפליקציה, ללא סיבוכים**

[📱 דמו חי](https://mytor.vercel.app) | [📖 תיעוד API](docs/api.md) | [🚀 התחל עכשיו](#מתחילים)

---

## 🎯 למה MyTor?

**הבעיה:** קוסמטיקאיות, פדיקוריסטיות, מורים פרטיים ומטפלים צריכים דרך פשוטה לקבל בקשות תור
**הפתרון:** קישור אחד → הלקוח מבקש → אתה מאשר

### ✨ מה שמייחד אותנו
- 🔒 **שליטה מלאה** - הלקוח מבקש, אתה מאשר
- 📱 **ללא אפליקציה** - עובד מכל דפדפן
- ⚡ **הקמה תוך דקות** - רק שם + טלפון ואתה מוכן
- 🇮🇱 **מתאים לישראל** - עברית, SMS, שקלים

---

## 🚀 התחלה מהירה

### למשתמשים

1. **הירשם**: [mytor.vercel.app/signup](https://mytor.vercel.app/signup)
2. **הגדר זמינות**: בחר ימים ושעות
3. **שתף קישור**: העתק ושלח ללקוחות
4. **נהל בקשות**: אשר/דחה מהדשבורד

### למפתחים

```bash
# שכפל והתקן
git clone https://github.com/yourusername/mytor-app.git
cd mytor-app
npm install

# הגדר סביבה
cp .env.example .env.local
# ערוך את הקובץ עם פרטי Supabase

# הפעל
npm run dev
```

---

## 🛠 סטאק טכנולוגי

| קטגוריה | טכנולוגיה | תפקיד |
|----------|------------|--------|
| **Frontend** | Next.js 14 + TypeScript | ממשק משתמש ונתיבים |
| **Styling** | Tailwind CSS + shadcn/ui | עיצוב ורכיבים |
| **Backend** | Supabase | בסיס נתונים + Auth |
| **Deployment** | Vercel | אירוח ו-CI/CD |
| **SMS** | Twilio | אימות OTP |
| **Email** | Resend | התראות |

---

## 📁 מבנה הפרויקט

```
mytor-app/
├── 🎨 src/app/              # דפים ונתיבי API
│   ├── 🔐 api/             # API endpoints  
│   ├── 📊 dashboard/       # דשבורד בעלי עסק
│   ├── 🌐 [slug]/          # דפי עסק ציבוריים
│   └── 🏠 page.tsx         # דף בית
├── 📚 src/lib/             # utilities ו-helpers
├── 🎯 middleware.ts        # אימות נתיבים
└── 📋 database-setup.sql   # סכימת DB
```

---

## 🔧 הגדרת סביבה

### דרישות
- Node.js 18+
- חשבון [Supabase](https://supabase.com) (חינם)
- חשבון [Vercel](https://vercel.com) לפריסה (חינם)

### משתני סביבה
```env
# Supabase (חובה)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# אפליקציה
NEXT_PUBLIC_APP_URL=http://localhost:3000

# אופציונלי - SMS (לאימות OTP)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=your-number

# אופציונלי - Email (להתראות)
RESEND_API_KEY=your-api-key
```

---

## 📊 API העיקריים

### 🔐 Authentication
```http
POST /api/auth/signup    # הרשמה
POST /api/auth/login     # התחברות
```

### 👤 Users
```http
GET  /api/users/me       # פרטי משתמש
PUT  /api/users/me       # עדכון פרופיל
```

### 📅 Appointments
```http
GET  /api/appointments              # רשימת תורים
POST /api/appointments/request      # בקשת תור חדש
PUT  /api/appointments/:id/status   # עדכון סטטוס
```

### 📱 OTP
```http
POST /api/otp/send      # שליחת קוד SMS
POST /api/otp/verify    # אימות קוד
```

---

## 🎨 תכונות עיקריות

### ✅ מוכן כבר
- [x] מערכת תורים בסיסית
- [x] אימות SMS/שיחה קולית
- [x] דשבורד לבעלי עסק
- [x] ניהול זמינות שבועי
- [x] התראות אימייל
- [x] עמודי עסק ציבוריים

### 🚧 בפיתוח
- [ ] תזכורות SMS ללקוחות
- [ ] אינטגרציה Google Calendar
- [ ] מערכת תשלומים
- [ ] צ'אט WhatsApp

### 💡 עתידי
- [ ] אפליקציה ניידת
- [ ] ניהול מספר מטפלים
- [ ] אנליטיקה ודוחות

---

## 🚀 פריסה

### Vercel (מומלץ)
```bash
# התקן Vercel CLI
npm i -g vercel

# פרוס
vercel

# קבע משתני סביבה ב-dashboard
# פרוס לפרודקשן
vercel --prod
```

### Docker
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

---

## 🛟 בעיות נפוצות

<details>
<summary><strong>🔴 שגיאת חיבור Supabase</strong></summary>

**סימפטום:** `Error: Invalid API key`

**פתרון:**
1. בדוק ש-URL ו-keys נכונים ב-`.env.local`
2. ודא שפרויקט Supabase פעיל
3. הפעל מחדש את השרת: `npm run dev`
</details>

<details>
<summary><strong>📱 SMS לא נשלח</strong></summary>

**סימפטום:** `OTP not delivered`

**פתרון:**
1. בדוק חשבון Twilio פעיל ויש יתרה
2. ודא פורמט טלפון נכון: `05xxxxxxxx`
3. בפיתוח: הקוד מודפס לקונסול
</details>

<details>
<summary><strong>🔒 שגיאות אימות</strong></summary>

**סימפטום:** `Unauthorized access`

**פתרון:**
1. בדוק שהמשתמש מחובר
2. ודא ש-middleware פועל
3. בדוק RLS policies ב-Supabase
</details>

---

## 💰 מודל עסקי

| תוכנית | מחיר | תכונות |
|---------|------|---------|
| **חינמי** | ₪0 | עד 10 תורים/חודש, מיתוג MyTor |
| **פרו** | ₪9.90 | עד 100 תורים, הסרת מיתוג, SMS |
| **עסקי** | ₪49 | ללא הגבלה, מספר מטפלים, אנליטיקה |

---

## 🤝 תרומה לפרויקט

### דיווח באגים
פתח [Issue חדש](https://github.com/yourusername/mytor-app/issues) עם:
- תיאור הבעיה
- שלבים לשחזור  
- צילומי מסך
- פרטי סביבה

### בקשת תכונות
השתמש ב-[Feature Request template](https://github.com/yourusername/mytor-app/issues/new?template=feature_request.md)

### קוד
1. Fork הפרויקט
2. צור branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. פתח Pull Request

---

## 📄 רישיון

הפרויקט ברישיון MIT - ראה [LICENSE](LICENSE) לפרטים.

---

## 🙏 תודות

- [Supabase](https://supabase.com) - Backend מעולה
- [Vercel](https://vercel.com) - deployment מושלם
- [shadcn/ui](https://ui.shadcn.com) - רכיבי UI מדהימים
- הקהילה הישראלית של מפתחים 🇮🇱

---

<div align="center">

**🚀 מוכן להתחיל? [הירשם עכשיו](https://mytor.vercel.app/signup)**

</div>