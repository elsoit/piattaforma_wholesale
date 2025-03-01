'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/components/auth/logout-button'
import { cn } from '@/lib/utils'

const adminRoutes = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/dashboard/users', label: 'Utenti' },
  { path: '/dashboard/clients', label: 'Clienti' },
  { path: '/dashboard/parametri', label: 'Parametri' },
  { path: '/dashboard/cataloghi', label: 'Cataloghi' },
  { path: '/dashboard/products', label: 'Prodotti' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 w-full border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex-shrink-0">
                <span className="text-xl font-bold">
                  ARTEX
                </span>
              </Link>
              <nav className="ml-6 flex items-baseline space-x-4">
                {adminRoutes.map((route) => (
                  <Link
                    key={route.path}
                    href={route.path}
                    className={cn(
                      "px-3 py-2 text-sm font-medium transition-colors",
                      pathname === route.path
                        ? "text-gray-900 font-bold"
                        : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    {route.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center">
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}