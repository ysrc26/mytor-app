//  src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MyTor - מערכת תורים לעצמאים',
  description: 'מערכת תורים פשוטה ויעילה לעצמאים בישראל',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl" className="font-heebo">
      <head>
      <meta name="apple-mobile-web-app-title" content="MyTorApp" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-heebo antialiased">
        {children}
      </body>
    </html>
  )
}