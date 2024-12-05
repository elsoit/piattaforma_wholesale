'use client'

import { SessionProvider } from 'next-auth/react'
import { usePathname } from 'next/navigation'

interface ClientProvidersProps {
  children: React.ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  const pathname = usePathname()

  // Non mostrare il SessionProvider nelle pagine di autenticazione
  const isAuthPage = pathname?.startsWith('/login') || 
                    pathname?.startsWith('/register') || 
                    pathname?.startsWith('/verify-email')

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  )
} 