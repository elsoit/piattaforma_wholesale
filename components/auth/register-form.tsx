import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

type BusinessType = 
  | 'wholeseller' 
  | 'distributer' 
  | 'outlet' 
  | 'online_boutique' 
  | 'physical_boutique' 
  | 'hybrid_stores'

interface UserFormData {
  nome: string
  cognome: string
  email: string
  telefono: string
  password: string
}

interface CompanyFormData {
  company_name: string
  vat_number: string
  business: BusinessType
  country: string
  address: string
  city: string
  zip_code: string
  company_email: string
  company_phone: string
  pec?: string
  sdi?: string
}

// Aggiungi questa lista di paesi all'inizio del file
const countries = [
  { code: 'IT', name: 'Italia' },
  { code: 'FR', name: 'Francia' },
  { code: 'DE', name: 'Germania' },
  { code: 'GB', name: 'Regno Unito' },
  { code: 'ES', name: 'Spagna' },
  { code: 'PT', name: 'Portogallo' },
  { code: 'BE', name: 'Belgio' },
  { code: 'NL', name: 'Paesi Bassi' },
  { code: 'LU', name: 'Lussemburgo' },
  { code: 'CH', name: 'Svizzera' },
  { code: 'AT', name: 'Austria' },
  { code: 'GR', name: 'Grecia' },
  // ... aggiungi altri paesi europei secondo necessità
].sort((a, b) => a.name.localeCompare(b.name))

export function RegisterForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [userForm, setUserForm] = useState<UserFormData>({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    password: ''
  })

  const [companyForm, setCompanyForm] = useState<CompanyFormData>({
    company_name: '',
    vat_number: '',
    business: 'wholeseller',
    country: '',
    address: '',
    city: '',
    zip_code: '',
    company_email: '',
    company_phone: '',
  })

  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const businessOptions = [
    { value: 'wholeseller', label: 'Wholeseller' },
    { value: 'distributer', label: 'Distributer' },
    { value: 'outlet', label: 'Outlet' },
    { value: 'online_boutique', label: 'Online Boutique' },
    { value: 'physical_boutique', label: 'Physical Boutique' },
    { value: 'hybrid_stores', label: 'Online & Physical Stores' }
  ]

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validazione campi obbligatori
    if (!userForm.nome || !userForm.cognome || !userForm.email || 
        !userForm.telefono || !userForm.password) {
      setError('Compila tutti i campi obbligatori')
      return
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userForm.email)) {
      setError('Inserisci un indirizzo email valido')
      return
    }

    // Validazione password
    if (userForm.password.length < 8) {
      setError('La password deve contenere almeno 8 caratteri')
      return
    }

    // Verifica conferma password
    if (userForm.password !== confirmPassword) {
      setError('Le password non coincidono')
      return
    }

    // Se tutto ok, procedi al prossimo step
    setError('')
    setStep(2)
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validazione base
    if (!companyForm.company_name || !companyForm.vat_number || !companyForm.country) {
      setError('Compila tutti i campi obbligatori')
      setLoading(false)
      return
    }

    // Validazione per aziende italiane
    if (companyForm.country === 'IT' && !companyForm.pec && !companyForm.sdi) {
      setError('Per le aziende italiane è necessario specificare almeno PEC o SDI')
      setLoading(false)
      return
    }

    try {
      // Registrazione completa (user + client)
      const userData = {
        nome: userForm.nome,
        cognome: userForm.cognome,
        email: userForm.email.toLowerCase(),
        telefono: userForm.telefono,
        password: userForm.password,
        ruolo: 'cliente',
        attivo: false
      }

      const companyData = {
        company_name: companyForm.company_name.trim(),
        vat_number: companyForm.vat_number.toUpperCase().trim(),
        business: companyForm.business,
        country: companyForm.country,
        address: companyForm.address.trim(),
        city: companyForm.city.trim(),
        zip_code: companyForm.zip_code.trim(),
        company_email: companyForm.company_email.toLowerCase().trim(),
        company_phone: companyForm.company_phone.trim(),
        pec: companyForm.pec?.toLowerCase().trim(),
        sdi: companyForm.sdi?.toUpperCase().trim(),
        stato: 'in_attesa_di_attivazione'
      }

      const response = await fetch('/api/auth/register-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: userData,
          client: companyData
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'Email già registrata') {
          setError('Email già registrata')
          setStep(1)
        } else if (data.error === 'Azienda già registrata') {
          setError('Azienda già presente nel sistema')
        } else {
          setError(data.error || 'Errore durante la registrazione')
        }
        return
      }

      // Registrazione completata con successo
      router.push('/registration-success')

    } catch (error) {
      console.error('Errore durante la registrazione:', error)
      setError('Si è verificato un errore. Riprova più tardi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      {error && (
        <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded">
          {error}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleUserSubmit} className="space-y-4">
          <h2 className="text-xl font-bold mb-6">Dati Personali</h2>
          
          <div>
            <label className="block text-sm font-medium mb-1">Nome *</label>
            <input
              type="text"
              required
              value={userForm.nome}
              onChange={e => setUserForm(prev => ({ ...prev, nome: e.target.value }))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cognome *</label>
            <input
              type="text"
              required
              value={userForm.cognome}
              onChange={e => setUserForm(prev => ({ ...prev, cognome: e.target.value }))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Rossi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              required
              value={userForm.email}
              onChange={e => setUserForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="mario.rossi@esempio.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Telefono *</label>
            <input
              type="tel"
              required
              value={userForm.telefono}
              onChange={e => setUserForm(prev => ({ ...prev, telefono: e.target.value }))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+39 123 456 7890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={userForm.password}
                onChange={e => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showPassword ? 
                  <EyeOff className="h-5 w-5 text-gray-400" /> : 
                  <Eye className="h-5 w-5 text-gray-400" />
                }
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              La password deve contenere almeno 8 caratteri
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Conferma Password *</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={loading || userForm.password !== confirmPassword}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Caricamento...' : 'Continua'}
            </button>
          </div>

          <p className="mt-4 text-center text-sm text-gray-500">
            Hai già un account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-500">
              Accedi qui
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleCompanySubmit} className="space-y-4">
          <h2 className="text-xl font-bold mb-6">Dati Aziendali</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Ragione Sociale *</label>
            <input
              type="text"
              required
              value={companyForm.company_name}
              onChange={e => setCompanyForm(prev => ({ ...prev, company_name: e.target.value }))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nome Azienda S.r.l."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Partita IVA *</label>
            <input
              type="text"
              required
              value={companyForm.vat_number}
              onChange={e => setCompanyForm(prev => ({ ...prev, vat_number: e.target.value }))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="IT12345678901"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo Attività *</label>
            <select
              required
              value={companyForm.business}
              onChange={e => setCompanyForm(prev => ({ 
                ...prev, 
                business: e.target.value as BusinessType 
              }))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {businessOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Paese *</label>
            <select
              required
              value={companyForm.country}
              onChange={e => setCompanyForm(prev => ({ ...prev, country: e.target.value }))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleziona paese</option>
              {countries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Indirizzo *</label>
            <input
              type="text"
              required
              value={companyForm.address}
              onChange={e => setCompanyForm(prev => ({ ...prev, address: e.target.value }))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Via Roma, 123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Città *</label>
            <input
              type="text"
              required
              value={companyForm.city}
              onChange={e => setCompanyForm(prev => ({ ...prev, city: e.target.value }))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Milano"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">CAP *</label>
            <input
              type="text"
              required
              value={companyForm.zip_code}
              onChange={e => setCompanyForm(prev => ({ ...prev, zip_code: e.target.value }))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="20100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email Aziendale *</label>
            <input
              type="email"
              required
              value={companyForm.company_email}
              onChange={e => setCompanyForm(prev => ({ ...prev, company_email: e.target.value }))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="info@azienda.it"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Telefono Aziendale *</label>
            <input
              type="tel"
              required
              value={companyForm.company_phone}
              onChange={e => setCompanyForm(prev => ({ ...prev, company_phone: e.target.value }))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+39 02 1234567"
            />
          </div>

          {companyForm.country === 'IT' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">PEC</label>
                <input
                  type="email"
                  value={companyForm.pec || ''}
                  onChange={e => setCompanyForm(prev => ({ ...prev, pec: e.target.value }))}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="pec@azienda.it"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Codice SDI</label>
                <input
                  type="text"
                  maxLength={7}
                  value={companyForm.sdi || ''}
                  onChange={e => setCompanyForm(prev => ({ ...prev, sdi: e.target.value }))}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0000000"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Codice di 7 caratteri per la fatturazione elettronica
                </p>
              </div>
            </>
          )}

          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-2 px-4 border rounded-md hover:bg-gray-50"
            >
              Indietro
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Registrazione...' : 'Completa Registrazione'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
} 