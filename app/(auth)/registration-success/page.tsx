import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function RegistrationSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Richiesta inoltrata con successo!
          </h2>
          
          <div className="mt-4 text-gray-600 space-y-4">
            <p>
              Grazie per la registrazione. Un nostro operatore verificherà i dati forniti 
              ed attiverà il tuo account il prima possibile.
            </p>
            
            <p>
              Riceverai una email di conferma quando il tuo account sarà attivo.
              Potrai quindi accedere utilizzando le credenziali inserite durante la registrazione.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <Link 
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Vai al login
            </Link>
            
            <p className="text-sm text-gray-500">
              Hai bisogno di assistenza? {' '}
              <a 
                href="mailto:support@tuodominio.it" 
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Contattaci
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 