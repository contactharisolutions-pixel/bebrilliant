import type { Metadata } from 'next'
import { Inter, Manrope, Work_Sans } from 'next/font/google'
import './globals.css'
import { ClientTimeZone } from '@/components/ClientTimeZone'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
})

const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-worksans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BeBrilliant — India\'s Institutional Excellence Platform',
  description:
    'Empower every educator, inspire every student. India\'s most trusted multi-role platform for institutions — smart exams, WhatsApp growth, real-time analytics, and secure fee collection.',
  keywords: 'coaching institute software, online exam platform India, LMS India, student management system, fee collection software, WhatsApp affiliate education',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'BeBrilliant — India\'s Institutional Excellence Platform',
    description: 'Smart exams, WhatsApp growth, analytics, and secure payments for 500+ institutions.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} ${workSans.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientTimeZone />
        {children}
      </body>
    </html>
  )
}
