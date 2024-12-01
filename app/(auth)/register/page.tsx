'use client'
import { RegisterForm } from '@/components/auth/register-form'
import { Logo } from '@/components/ui/logo'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <Logo className="h-12 w-auto mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Registrazione Nuovo Account
          </h1>
          <p className="text-gray-600">
            Completa i passaggi per creare il tuo account aziendale
          </p>
        </div>

        {/* Steps Indicator */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-between text-sm">
              <div className="bg-gray-50 px-4">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full">
                  1
                </span>
                <span className="mt-2 block text-xs text-gray-500">
                  Dati Personali
                </span>
              </div>
              <div className="bg-gray-50 px-4">
                <span className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-600 rounded-full">
                  2
                </span>
                <span className="mt-2 block text-xs text-gray-500">
                  Dati Aziendali
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="max-w-2xl mx-auto">
          <RegisterForm />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Hai già un account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-500">
              Accedi qui
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}