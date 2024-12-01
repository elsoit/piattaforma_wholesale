import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { LogoutButton } from '@/components/auth/logout-button'

const adminRoutes = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/dashboard/users', label: 'Utenti' },
  { path: '/dashboard/clients', label: 'Clienti' },
  { path: '/dashboard/parametri', label: 'Parametri' },
  { path: '/dashboard/cataloghi', label: 'Cataloghi' },

]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const ruolo = cookieStore.get('ruolo')?.value

  if (ruolo !== 'admin') {
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex space-x-4">
              {adminRoutes.map((route) => (
                <a
                  key={route.path}
                  href={route.path}
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {route.label}
                </a>
              ))}
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
} 