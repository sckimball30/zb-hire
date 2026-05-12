import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { SessionProvider } from '@/components/SessionProvider'
import { Sidebar } from '@/components/layout/Sidebar'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import './globals.css'

export const metadata: Metadata = {
  title: 'ZB Hire',
  description: 'ZB Designs hiring pipeline',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="app-shell flex flex-col md:flex-row overflow-hidden bg-gray-50">
        <SessionProvider>
          <Sidebar />
          <main className="flex-1 overflow-auto min-w-0 mobile-main" style={{ paddingRight: 'env(safe-area-inset-right)', paddingBottom: 'env(safe-area-inset-bottom)' }}>{children}</main>
          <PreviewBanner />
          <Toaster position="bottom-right" richColors />
        </SessionProvider>
      </body>
    </html>
  )
}
