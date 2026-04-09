import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { SessionProvider } from '@/components/SessionProvider'
import { Sidebar } from '@/components/layout/Sidebar'
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="flex flex-col md:flex-row h-screen overflow-hidden bg-gray-50">
        <SessionProvider>
          <Sidebar />
          <main className="flex-1 overflow-auto min-w-0">{children}</main>
          <Toaster position="bottom-right" richColors />
        </SessionProvider>
      </body>
    </html>
  )
}
