import { LogoutButton } from '@/components/auth/logout-button'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
    

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
            {/* Contenuto del dashboard */}
            <h2 className="text-lg font-medium">Benvenuto nella dashboard</h2>
          </div>
        </div>
      </main>
    </div>
  )
} 