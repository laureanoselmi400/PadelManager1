import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import AppShellWrapper from '@/components/AppShellWrapper'

export const metadata: Metadata = {
  title: 'PadelManager',
  description: 'Gestión de canchas de pádel',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <AppShellWrapper>
            {children}
          </AppShellWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}
