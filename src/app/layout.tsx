import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClientTimeZone } from '@/components/ClientTimeZone'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BeBrilliant — India\'s Institutional Excellence Platform',
  description:
    'Empower every educator, inspire every student. India\'s most trusted multi-role platform for institutions — smart exams, WhatsApp growth, real-time analytics, and secure fee collection.',
  keywords: 'coaching institute software, online exam platform India, LMS India, student management system, fee collection software, WhatsApp affiliate education',
  icons: {
    icon: 'https://bfzlkdurgggzytegvvrw.supabase.co/storage/v1/object/public/bebrilliant/favicon.ico',
  },
  openGraph: {
    title: 'BeBrilliant — India\'s Institutional Excellence Platform',
    description: 'Smart exams, WhatsApp growth, analytics, and secure payments for 500+ institutions.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientTimeZone />
        {children}
      </body>
    </html>
  )
}
