import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BeBrilliant — Institutional Excellence Platform',
    short_name: 'BeBrilliant',
    description: "India's Premier Multi-Role Academic Platform for Schools, Teachers, Students & Parents.",
    start_url: '/',
    display: 'standalone',
    background_color: '#020B18',
    theme_color: '#020B18',
    orientation: 'portrait-primary',
    scope: '/',
    categories: ['education', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'Student Portal',
        short_name: 'Student',
        url: '/student/dashboard',
        description: 'Access exams, study materials and weakness analytics',
      },
      {
        name: 'Teacher Hub',
        short_name: 'Teacher',
        url: '/teacher/exams',
        description: 'Manage question banks, offline marks, and student batches',
      },
      {
        name: 'Parent Portal',
        short_name: 'Parent',
        url: '/parent',
        description: 'Track child performance, attendance, and fee payments',
      },
    ],
  }
}
