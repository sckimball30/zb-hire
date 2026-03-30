import { Toaster } from 'sonner'

export default function OffersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="bottom-right" richColors />
    </>
  )
}
