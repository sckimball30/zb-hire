import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { SessionProvider } from '@/components/SessionProvider'
import { Sidebar } from '@/components/layout/Sidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'ZB Hire',
  description: 'ZB Designs hiring pipeline',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden bg-gray-50">
        <SessionProvider>
          <Sidebar />
          <main className="flex-1 overflow-auto">{children}</main>
          <Toaster position="bottom-right" richColors />
        </SessionProvider>
      </body>
    </html>
  )
}
