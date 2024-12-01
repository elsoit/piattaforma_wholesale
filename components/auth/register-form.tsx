import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowLeft, Info } from 'lucide-react'
import Link from 'next/link'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import PhoneInput from 'react-phone-number-input'
import ReactCountryFlag from 'react-country-flag'
import 'react-phone-number-input/style.css'
import { isValidPhoneNumber } from 'libphonenumber-js'
import countries from 'i18n-iso-countries'
import enLocale from 'i18n-iso-countries/langs/en.json'
import type { CountryCode } from 'libphonenumber-js/types'

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

// Inizializza la libreria con la lingua inglese
countries.registerLocale(enLocale)

// Aggiungi questa interfaccia per i paesi
interface Country {
  code: string;
  name: string;
}

// Modifica la creazione della lista dei paesi
const allCountries = Object.entries(countries.getNames('en'))
  .map(([code, name]): Country => ({
    code,
    name: name as string
  }))
  .filter(country => country.code !== 'IL')
  .sort((a, b) => a.name.localeCompare(b.name))

// Aggiungi questa interfaccia per la risposta API
interface ApiResponse {
  error?: string;
}

// Prima creiamo una lista di tutti i codici paese che vogliamo includere (tutti tranne IL)
const allowedPhoneCountries: CountryCode[] = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AR", "AS", "AT", "AU", "AW", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BM", "BN", "BO", "BR",
  "BS", "BT", "BW", "BY", "BZ", "CA", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM",
  "CN", "CO", "CR", "CU", "CV", "CW", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ",
  "EC", "EE", "EG", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB",
  "GD", "GE", "GF", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GT", "GU", "GW",
  "GY", "HK", "HN", "HR", "HT", "HU", "ID", "IE", "IN", "IQ", "IR", "IS", "IT",
  "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ",
  "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME",
  "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MQ", "MR", "MS", "MT", "MU", "MV",
  "MW", "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU",
  "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PR", "PS", "PT", "PW",
  "PY", "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI",
  "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD",
  "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA",
  "UG", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI", "VN", "VU", "WF", "WS", "YE", "YT",
  "ZA", "ZM", "ZW"
] as CountryCode[]

// Aggiungi una funzione di validazione per l'SDI
const validateSdi = (sdi: string | undefined): boolean => {
  if (!sdi) return true; // SDI è opzionale
  return sdi.length === 7;
};

// Aggiungi una funzione per validare i caratteri SDI
const validateSdiChar = (char: string): boolean => {
  return /^[A-Z0-9]$/.test(char);
};

interface RegisterFormProps {
  StepsIndicator: React.ComponentType<{ currentStep: number }>;
}

export function RegisterForm({ StepsIndicator }: RegisterFormProps) {
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
    { value: 'wholeseller', label: 'Wholesaler' },
    { value: 'distributer', label: 'Distributor' },
    { value: 'outlet', label: 'Outlet' },
    { value: 'online_boutique', label: 'Online Boutique' },
    { value: 'physical_boutique', label: 'Physical Boutique' },
    { value: 'hybrid_stores', label: 'Hybrid Stores' }
  ]

  // Validazione numero di telefono
  const validatePhoneNumber = (phone: string) => {
    try {
      return isValidPhoneNumber(phone)
    } catch (error) {
      return false
    }
  }

  // Aggiungi questi stati per la validazione
  const [isEmailValid, setIsEmailValid] = useState(false)
  const [isPasswordValid, setIsPasswordValid] = useState(false)
  const [isEmailAvailable, setIsEmailAvailable] = useState(true)

  // All'inizio del componente, dopo gli stati
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Modifica la funzione checkEmail
  const checkEmail = async (email: string) => {
    if (!email || !emailRegex.test(email)) {
      setIsEmailValid(false)
      setIsEmailAvailable(true) // Reset dello stato
      setError('')
      return
    }
    
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      
      if (!response.ok) {
        setIsEmailAvailable(false)
        setIsEmailValid(false)
        setError('Email already registered')
      } else {
        setIsEmailAvailable(true)
        setIsEmailValid(true)
        setError('')
      }
    } catch (error) {
      console.error('Error checking email:', error)
      setIsEmailValid(false)
      setError('Error checking email availability')
    }
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Validazione campi obbligatori
    if (!userForm.nome || !userForm.cognome || !userForm.email || 
        !userForm.telefono || !userForm.password) {
      setError('Compila tutti i campi obbligatori')
      setLoading(false)
      return
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userForm.email)) {
      setError('Inserisci un indirizzo email valido')
      setLoading(false)
      return
    }

    // Validazione password
    if (userForm.password.length < 8) {
      setError('La password deve contenere almeno 8 caratteri')
      setLoading(false)
      return
    }

    // Verifica conferma password
    if (userForm.password !== confirmPassword) {
      setError('Le password non coincidono')
      setLoading(false)
      return
    }

    // Validazione numero di telefono
    if (!validatePhoneNumber(userForm.telefono)) {
      setError('Please enter a valid phone number')
      setLoading(false)
      return
    }

    try {
      // Controlla se l'email è già registrata
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userForm.email })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error checking email')
        setLoading(false)
        return
      }

      // Se tutto ok, procedi al prossimo step
      setError('')
      setStep(2)
    } catch (error) {
      console.error('Error checking email:', error)
      setError('Si è verificato un errore. Riprova più tardi.')
    } finally {
      setLoading(false)
    }
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
    if (companyForm.country === 'IT') {
      if (!companyForm.pec && !companyForm.sdi) {
        setError('Per le aziende italiane è necessario specificare almeno PEC o SDI')
        setLoading(false)
        return
      }
      
      // Validazione lunghezza SDI
      if (companyForm.sdi && !validateSdi(companyForm.sdi)) {
        setError('Il codice SDI deve essere di 7 caratteri')
        setLoading(false)
        return
      }
    }

    // Validazione numero di telefono aziendale
    if (!validatePhoneNumber(companyForm.company_phone)) {
      setError('Please enter a valid company phone number')
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

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        if (data.error === 'Email already registered') {
          setError('Email already registered')
          setStep(1)
        } else if (data.error === 'Company already registered') {
          setError('Company already registered in the system')
        } else {
          setError(data.error || 'Registration error')
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

  // Funzione per validare la password in tempo reale
  const validatePassword = (password: string) => {
    const isValid = password.length >= 8
    setIsPasswordValid(isValid)
    return isValid
  }

  return (
    <div className="w-full">
      <StepsIndicator currentStep={step} />
      
      <div className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <div className={`transition-all duration-300 ${step === 1 ? 'opacity-100' : 'opacity-0 hidden'}`}>
          <form onSubmit={handleUserSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Nome e Cognome */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium text-gray-900">Name *</Label>
                  <Input
                    id="nome"
                    type="text"
                    required
                    value={userForm.nome}
                    onChange={e => setUserForm(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="John"
                    className="h-12 px-4 bg-white placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-gray-900">Last Name *</Label>
                  <Input
                    id="cognome"
                    type="text"
                    required
                    value={userForm.cognome}
                    onChange={e => setUserForm(prev => ({ ...prev, cognome: e.target.value }))}
                    placeholder="Doe"
                    className="h-12 px-4 bg-white placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              {/* Email e Telefono */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium text-gray-900">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={userForm.email}
                    onChange={async (e) => {
                      const value = e.target.value
                      setUserForm(prev => ({ ...prev, email: value }))
                      // Debounce la chiamata di checkEmail
                      clearTimeout((window as any).emailCheckTimeout)
                      ;(window as any).emailCheckTimeout = setTimeout(() => {
                        checkEmail(value)
                      }, 500)
                    }}
                    onBlur={() => checkEmail(userForm.email)} // Controlla anche al blur
                    placeholder="john.doe@example.com"
                    className={`h-12 px-4 bg-white placeholder:text-muted-foreground/50 
                      ${!isEmailAvailable && userForm.email ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {!isEmailAvailable && userForm.email && (
                    <p className="text-xs text-red-500 mt-1">
                      This email is already registered
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-gray-900">Phone *</Label>
                  <PhoneInput
                    international
                    defaultCountry="IT"
                    value={userForm.telefono}
                    onChange={(value) => setUserForm(prev => ({ ...prev, telefono: value || '' }))}
                    className="[&_.PhoneInputInput]:h-12 [&_.PhoneInputInput]:px-4 [&_.PhoneInputInput]:bg-white [&_.PhoneInputCountry]:h-12 [&_.PhoneInput]:flex [&_.PhoneInput]:items-center [&_.PhoneInput]:h-12 [&_.PhoneInput]:border [&_.PhoneInput]:border-input [&_.PhoneInput]:rounded-md [&_.PhoneInput]:p-0 [&_.PhoneInputCountry]:p-0 [&_.PhoneInputCountry]:pl-3"
                    error={userForm.telefono ? (validatePhoneNumber(userForm.telefono) ? undefined : 'Invalid phone number') : undefined}
                    countries={allowedPhoneCountries}
                  />
                </div>
              </div>

              {/* Password Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium text-gray-900">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={userForm.password}
                      onChange={e => {
                        const value = e.target.value
                        setUserForm(prev => ({ ...prev, password: value }))
                        validatePassword(value)
                      }}
                      placeholder="••••••••"
                      minLength={8}
                      className={`h-12 px-4 bg-white placeholder:text-muted-foreground/50
                        ${userForm.password && !isPasswordValid ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 
                        <EyeOff className="h-4 w-4" /> : 
                        <Eye className="h-4 w-4" />
                      }
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    The password must contain at least 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-gray-900">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 px-4 bg-white placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-12 bg-black hover:bg-black/90 text-white"
                disabled={loading || 
                  userForm.password !== confirmPassword ||
                  !isEmailValid ||
                  !isPasswordValid ||
                  !userForm.nome ||
                  !userForm.cognome ||
                  !userForm.telefono ||
                  !validatePhoneNumber(userForm.telefono)
                }
              >
                {loading ? 'Loading...' : 'Continue'}
              </Button>
            </div>
          </form>
        </div>

        <div className={`transition-all duration-300 ${step === 2 ? 'opacity-100' : 'opacity-0 hidden'}`}>
          <form onSubmit={handleCompanySubmit} className="space-y-6">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium text-gray-900">Company Name *</Label>
                <Input
                  id="company_name"
                  required
                  value={companyForm.company_name}
                  onChange={e => setCompanyForm(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="Company Name Ltd."
                  className="h-12 px-4 bg-white placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium text-gray-900">VAT Number *</Label>
                  <Input
                    id="vat_number"
                    required
                    value={companyForm.vat_number}
                    onChange={e => setCompanyForm(prev => ({ ...prev, vat_number: e.target.value }))}
                    placeholder="IT12345678901"
                    className="h-12 px-4 bg-white placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-gray-900">Business Type *</Label>
                  <Select 
                    value={companyForm.business} 
                    onValueChange={(value: BusinessType) => 
                      setCompanyForm(prev => ({ ...prev, business: value }))
                    }
                  >
                    <SelectTrigger className="h-12 px-4 bg-white">
                      <SelectValue placeholder={<span className="text-muted-foreground/50">Select business type</span>} />
                    </SelectTrigger>
                    <SelectContent>
                      {businessOptions.map(option => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          className="py-2.5"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium text-gray-900">Country *</Label>
                  <Select 
                    value={companyForm.country} 
                    onValueChange={(value) => {
                      setCompanyForm(prev => ({ 
                        ...prev, 
                        country: value,
                        company_phone: !companyForm.company_phone ? '' : prev.company_phone 
                      }))
                    }}
                  >
                    <SelectTrigger className="h-12 px-4 bg-white">
                      <SelectValue placeholder={<span className="text-muted-foreground/50">Select country</span>} />
                    </SelectTrigger>
                    <SelectContent>
                      {allCountries.map(country => (
                        <SelectItem key={country.code} value={country.code}>
                          <div className="flex items-center gap-2">
                            <ReactCountryFlag 
                              countryCode={country.code} 
                              svg 
                              style={{
                                width: '1.2em',
                                height: '1.2em',
                              }}
                            />
                            {country.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-gray-900">Address *</Label>
                  <Input
                    id="address"
                    required
                    value={companyForm.address}
                    onChange={e => setCompanyForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Business Street"
                    className="h-12 px-4 bg-white placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium text-gray-900">City *</Label>
                    <Input
                      id="city"
                      required
                      value={companyForm.city}
                      onChange={e => setCompanyForm(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="New York"
                      className="h-12 px-4 bg-white placeholder:text-muted-foreground/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-medium text-gray-900">ZIP Code *</Label>
                    <Input
                      id="zip_code"
                      required
                      value={companyForm.zip_code}
                      onChange={e => setCompanyForm(prev => ({ ...prev, zip_code: e.target.value }))}
                      placeholder="10001"
                      className="h-12 px-4 bg-white placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-gray-900">Company Email *</Label>
                  <Input
                    id="company_email"
                    type="email"
                    required
                    value={companyForm.company_email}
                    onChange={e => setCompanyForm(prev => ({ ...prev, company_email: e.target.value }))}
                    placeholder="info@company.com"
                    className="h-12 px-4 bg-white placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-gray-900">Company Phone *</Label>
                  <PhoneInput
                    international
                    defaultCountry={companyForm.country as CountryCode || "IT"}
                    value={companyForm.company_phone}
                    onChange={(value) => setCompanyForm(prev => ({ ...prev, company_phone: value || '' }))}
                    className="[&_.PhoneInputInput]:h-12 [&_.PhoneInputInput]:px-4 [&_.PhoneInputInput]:bg-white [&_.PhoneInputCountry]:h-12 [&_.PhoneInput]:flex [&_.PhoneInput]:items-center [&_.PhoneInput]:h-12 [&_.PhoneInput]:border [&_.PhoneInput]:border-input [&_.PhoneInput]:rounded-md [&_.PhoneInput]:p-0 [&_.PhoneInputCountry]:p-0 [&_.PhoneInputCountry]:pl-3"
                    error={companyForm.company_phone ? (validatePhoneNumber(companyForm.company_phone) ? undefined : 'Invalid phone number') : undefined}
                    countries={allowedPhoneCountries}
                  />
                </div>

                {/* Campi specifici per l'Italia */}
                {companyForm.country === 'IT' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medium text-gray-900">PEC</Label>
                      <Input
                        id="pec"
                        type="email"
                        value={companyForm.pec || ''}
                        onChange={e => setCompanyForm(prev => ({ ...prev, pec: e.target.value }))}
                        placeholder="pec@company.com"
                        className="h-12 px-4 bg-white placeholder:text-muted-foreground/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-gray-900">SDI Code</Label>
                      <div className="relative">
                        <Input
                          id="sdi"
                          maxLength={7}
                          minLength={7}
                          value={companyForm.sdi || ''}
                          onChange={e => {
                            const value = e.target.value.toUpperCase();
                            if (value.length <= 7 && value.split('').every(validateSdiChar)) {
                              setCompanyForm(prev => ({ ...prev, sdi: value }))
                            }
                          }}
                          placeholder="0000000"
                          className="pr-8 h-12 px-4 bg-white placeholder:text-muted-foreground/50"
                        />
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="absolute right-0 top-0 h-full flex items-center pr-2 cursor-pointer">
                                <Info className="h-4 w-4 text-muted-foreground/70" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="end">
                              <p className="text-xs">
                                Il codice SDI deve essere di 7 caratteri alfanumerici
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      {companyForm.sdi && !validateSdi(companyForm.sdi) && (
                        <p className="text-xs text-red-500">
                          Il codice SDI deve essere di 7 caratteri
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="h-12 border-2 border-gray-200 hover:bg-gray-50 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 bg-black hover:bg-black/90 text-white"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </div>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
} 