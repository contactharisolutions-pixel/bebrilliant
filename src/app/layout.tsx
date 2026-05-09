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
  title: 'BlinkOpticals — Modern Optical ERP System',
  description:
    'Visionary ERP for modern opticians. India\'s most advanced cloud ERP for optical stores — inventory tracking, automated prescriptions, and AI-powered sales insights.',
  keywords: 'optical store software, optician ERP, optical inventory management, optical shop billing software, eye clinic software India',
  icons: {
    icon: '/images/blinkopticals-logo.png',
  },
  openGraph: {
    title: 'BlinkOpticals — Modern Optical ERP System',
    description: 'Inventory tracking, automated prescriptions, and AI-powered sales insights for optical stores.',
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
