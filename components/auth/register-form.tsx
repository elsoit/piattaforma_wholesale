import { useState, useMemo, useEffect } from 'react'
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
import { CountryCode, isValidPhoneNumber } from 'libphonenumber-js'
import countries from 'i18n-iso-countries'
import enLocale from 'i18n-iso-countries/langs/en.json'
import { AddressAutocomplete } from '@/components/ui/address-autocomplete'

type BusinessType = 
  | 'online_boutique' 
  | 'physical_boutique' 
  | 'hybrid_stores'
  | 'outlet' 
  | 'wholeseller' 
  | 'distributer' 

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
  acceptPrivacy: boolean;
  acceptNewsletter: boolean;
  province: string;
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

interface CheckEmailResponse {
  error?: string
}

// Aggiungi le funzioni di validazione
const validateName = (name: string) => {
  const nameRegex = /^[A-Za-z\s]{2,}$/
  return nameRegex.test(name)
}

// Modifica la regex dell'email per essere più precisa
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Aggiungi una funzione di validazione email più completa
const validateEmail = (email: string): boolean => {
  // Controlla il formato base con regex
  if (!emailRegex.test(email)) return false;
  
  // Controlli aggiuntivi
  if (email.endsWith('.')) return false;
  if (email.includes('..')) return false;
  
  return true;
};

// Aggiungi questa funzione per la validazione della partita IVA
const validateVatNumber = (vat: string, country: string): { isValid: boolean; message: string } => {
  const cleanVat = vat.replace(/\s/g, '').toUpperCase();

  const vatRules: { [key: string]: { regex: RegExp; length: number } } = {
    'IT': { 
      regex: /^\d{11}$/, 
      length: 11 
    },
    'FR': { 
      regex: /^[A-Z0-9]{2}\d{9}$/, 
      length: 11 
    },
    'DE': { 
      regex: /^\d{9}$/, 
      length: 9 
    },
    'ES': { 
      regex: /^[A-Z0-9]\d{7}[A-Z0-9]$/, 
      length: 9 
    },
    'GB': { 
      regex: /^\d{9}$|^\d{12}$/, 
      length: 9 
    }
  };

  // Se il paese non è nella lista, verifica solo che ci siano almeno 8 caratteri alfanumerici
  if (!vatRules[country]) {
    return {
      isValid: /^[A-Z0-9]{8,}$/.test(cleanVat),
      message: 'VAT number must be at least 8 alphanumeric characters'
    };
  }

  const rule = vatRules[country];

  if (cleanVat.length !== rule.length) {
    return {
      isValid: false,
      message: `VAT number for ${country} must be ${rule.length} characters`
    };
  }

  if (!rule.regex.test(cleanVat)) {
    return {
      isValid: false,
      message: `Invalid VAT number format for ${country}`
    };
  }

  return {
    isValid: true,
    message: ''
  };
};

// Modifica l'interfaccia degli errori di validazione
interface ValidationErrors {
  nome: string;
  cognome: string;
  email: string;
  password: string;
  telefono: string;
  // Campi aziendali
  company_name: string;
  vat_number: string;
  address: string;
  city: string;
  zip_code: string;
  company_email: string;
  company_phone: string;
  sdi: string;
}

// Aggiungi una funzione di validazione SDI
const validateSdiField = (sdi: string | undefined, country: string): boolean => {
  // Se non è Italia, non serve validare
  if (country !== 'IT') return true;
  
  // Per l'Italia, deve essere presente almeno PEC o SDI
  // Se c'è SDI, deve essere esattamente 7 caratteri alfanumerici
  if (sdi) {
    return /^[A-Z0-9]{7}$/.test(sdi.toUpperCase());
  }
  
  // Se non c'è SDI, deve esserci almeno la PEC
  return !!companyForm.pec;
};

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
    business: 'online_boutique',
    country: '',
    address: '',
    city: '',
    zip_code: '',
    company_email: '',
    company_phone: '',
    pec: '',
    sdi: '',
    province: '',
    acceptPrivacy: false,
    acceptNewsletter: false
  })

  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const businessOptions = [
    { value: 'online_boutique', label: 'Online Boutique' },
    { value: 'physical_boutique', label: 'Physical Boutique' },
    { value: 'hybrid_stores', label: 'Physical and Online Stores' },
    { value: 'outlet', label: 'Outlet' },
    { value: 'wholeseller', label: 'Wholesaler' },
    { value: 'distributer', label: 'Distributor' },
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

  // Funzione per controllare l'email
  const checkEmail = async (email: string) => {
    if (!validateEmail(email)) {
      setValidationErrors(prev => ({
        ...prev,
        email: 'Please enter a valid email address'
      }));
      return;
    }

    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setIsEmailAvailable(false);
      } else {
        setIsEmailAvailable(true);
        setValidationErrors(prev => ({ ...prev, email: '' }));
      }
    } catch (error) {
      console.error('Error checking email:', error);
    }
  };

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

      const data = await response.json() as CheckEmailResponse

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

    const formData = {
      user: userForm,
      client: {
        ...companyForm,
        acceptPrivacy: Boolean(companyForm.acceptPrivacy),
        acceptNewsletter: Boolean(companyForm.acceptNewsletter)
      }
    }

    try {
      const response = await fetch('/api/auth/register-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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

  // Aggiungi checkbox per usare i dati personali
  const [usePersonalData, setUsePersonalData] = useState(false)

  // Effetto per copiare i dati personali quando la checkbox è selezionata
  useEffect(() => {
    if (usePersonalData) {
      setCompanyForm(prev => ({
        ...prev,
        company_email: userForm.email,
        company_phone: userForm.telefono
      }))
    }
  }, [usePersonalData, userForm.email, userForm.telefono])

  // Aggiungi stati per gli errori di validazione
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    nome: '',
    cognome: '',
    email: '',
    password: '',
    telefono: '',
    company_name: '',
    vat_number: '',
    address: '',
    city: '',
    zip_code: '',
    company_email: '',
    company_phone: '',
    sdi: ''
  });

  // Aggiorna la funzione validateField per includere i campi aziendali
  const validateField = (field: keyof ValidationErrors, value: string) => {
    switch (field) {
      case 'nome':
      case 'cognome':
        if (!validateName(value)) {
          setValidationErrors(prev => ({
            ...prev,
            [field]: `${field === 'nome' ? 'Name' : 'Last name'} must be at least 2 characters and contain only letters`
          }));
          return false;
        }
        break;

      case 'company_name':
        if (value.trim().length < 2) {
          setValidationErrors(prev => ({
            ...prev,
            company_name: 'Company name must be at least 2 characters'
          }));
          return false;
        }
        break;

      case 'vat_number':
        const vatValidation = validateVatNumber(value, companyForm.country);
        if (!vatValidation.isValid) {
          setValidationErrors(prev => ({
            ...prev,
            vat_number: vatValidation.message
          }));
          return false;
        }
        break;

      case 'address':
        if (value.trim().length < 5) {
          setValidationErrors(prev => ({
            ...prev,
            address: 'Please enter a valid address'
          }));
          return false;
        }
        break;

      case 'city':
        if (value.trim().length < 2) {
          setValidationErrors(prev => ({
            ...prev,
            city: 'Please enter a valid city name'
          }));
          return false;
        }
        break;

      case 'zip_code':
        if (value.trim().length < 3) {
          setValidationErrors(prev => ({
            ...prev,
            zip_code: 'Please enter a valid ZIP code'
          }));
          return false;
        }
        break;

      case 'company_email':
        if (!validateEmail(value)) {
          setValidationErrors(prev => ({
            ...prev,
            company_email: 'Please enter a valid email address'
          }));
          return false;
        }
        break;

      case 'company_phone':
        if (!validatePhoneNumber(value)) {
          setValidationErrors(prev => ({
            ...prev,
            company_phone: 'Please enter a valid phone number'
          }));
          return false;
        }
        break;

      case 'email':
        if (!validateEmail(value)) {
          setValidationErrors(prev => ({
            ...prev,
            email: 'Please enter a valid email address'
          }));
          return false;
        }
        break;

      case 'password':
        if (value.length < 8) {
          setValidationErrors(prev => ({
            ...prev,
            password: 'Password must be at least 8 characters'
          }));
          return false;
        }
        break;

      case 'telefono':
        if (!validatePhoneNumber(value)) {
          setValidationErrors(prev => ({
            ...prev,
            telefono: 'Please enter a valid phone number'
          }));
          return false;
        }
        break;

      case 'sdi':
        if (!validateSdi(value)) {
          setValidationErrors(prev => ({
            ...prev,
            sdi: 'SDI must be 7 alphanumeric characters'
          }));
          return false;
        }
        break;
    }

    setValidationErrors(prev => ({ ...prev, [field]: '' }));
    return true;
  };

  // Validazione nome azienda
  const validateCompanyName = (name: string) => {
    return name.trim().length >= 2;
  };

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
                    onChange={e => {
                      const value = e.target.value;
                      setUserForm(prev => ({ ...prev, nome: value }));
                      // Rimuovi errori durante la digitazione
                      setValidationErrors(prev => ({ ...prev, nome: '' }));
                    }}
                    onBlur={e => validateField('nome', e.target.value)}
                    placeholder="Enter your first name"
                    className={`h-12 px-4 bg-white placeholder:text-muted-foreground/50 
                      ${validationErrors.nome ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {validationErrors.nome && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.nome}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-gray-900">Last Name *</Label>
                  <Input
                    id="cognome"
                    type="text"
                    required
                    value={userForm.cognome}
                    onChange={e => {
                      const value = e.target.value;
                      setUserForm(prev => ({ ...prev, cognome: value }));
                      setValidationErrors(prev => ({ ...prev, cognome: '' }));
                    }}
                    onBlur={e => validateField('cognome', e.target.value)}
                    placeholder="Enter your last name"
                    className={`h-12 px-4 bg-white placeholder:text-muted-foreground/50
                      ${validationErrors.cognome ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {validationErrors.cognome && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.cognome}</p>
                  )}
                </div>
              </div>

              {/* Email e Telefono */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium text-gray-900">
                    Email * 
                    <span className="ml-1 text-sm text-gray-500">
                      (This will be your login email)
                    </span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={userForm.email}
                    onChange={e => {
                      const value = e.target.value;
                      setUserForm(prev => ({ ...prev, email: value }));
                      // Rimuovi errori durante la digitazione
                      setValidationErrors(prev => ({ ...prev, email: '' }));
                      setIsEmailAvailable(true);
                    }}
                    onBlur={async (e) => {
                      const value = e.target.value;
                      if (value && validateField('email', value)) {
                        await checkEmail(value);
                      }
                    }}
                    placeholder="Enter your email address"
                    className={`h-12 px-4 bg-white placeholder:text-muted-foreground/50
                      ${(validationErrors.email || !isEmailAvailable) ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {validationErrors.email && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.email}</p>
                  )}
                  {!isEmailAvailable && userForm.email && !validationErrors.email && (
                    <p className="text-xs text-red-500 mt-1">This email is already registered</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-gray-900">Phone *</Label>
                  <PhoneInput
                    international
                    defaultCountry="IT"
                    value={userForm.telefono}
                    onChange={(value) => {
                      setUserForm(prev => ({ ...prev, telefono: value || '' }));
                      setValidationErrors(prev => ({ ...prev, telefono: '' }));
                    }}
                    onBlur={() => {
                      if (userForm.telefono) {
                        validateField('telefono', userForm.telefono);
                      }
                    }}
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
                        const value = e.target.value;
                        setUserForm(prev => ({ ...prev, password: value }));
                        setValidationErrors(prev => ({ ...prev, password: '' }));
                      }}
                      onBlur={e => validateField('password', e.target.value)}
                      placeholder="Create a secure password (min. 8 characters)"
                      className={`h-12 px-4 bg-white placeholder:text-muted-foreground/50 pr-10
                        ${validationErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {userForm.password.length >= 8 && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? 
                          <EyeOff className="h-5 w-5 text-gray-500" /> : 
                          <Eye className="h-5 w-5 text-gray-500" />
                        }
                      </button>
                    )}
                    {validationErrors.password && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.password}</p>
                    )}
                  </div>
                </div>

                {/* Mostra il campo conferma password solo se la password è valida */}
                {userForm.password.length >= 8 && !validationErrors.password && (
                  <div className="space-y-2">
                    <Label className="font-medium text-gray-900">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className={`h-12 px-4 bg-white placeholder:text-muted-foreground/50
                          ${confirmPassword && confirmPassword !== userForm.password ? 'border-red-500' : ''}`}
                      />
                      {confirmPassword && confirmPassword !== userForm.password && (
                        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-12 bg-black hover:bg-black/90 text-white"
                disabled={
                  loading || 
                  // Password checks
                  (userForm.password.length >= 8 && userForm.password !== confirmPassword) ||
                  // Email check
                  !isEmailAvailable ||
                  // Required fields
                  !userForm.nome ||
                  !userForm.cognome ||
                  !userForm.email ||
                  !userForm.telefono ||
                  // Validation errors
                  Object.values(validationErrors).some(error => error !== '') ||
                  // Phone validation
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
              {/* Company Name */}
              <div className="space-y-2">
                <Label className="font-medium text-gray-900">Company Name *</Label>
                <Input
                  id="company_name"
                  required
                  value={companyForm.company_name}
                  onChange={e => {
                    const value = e.target.value;
                    setCompanyForm(prev => ({ ...prev, company_name: value }));
                    setValidationErrors(prev => ({ ...prev, company_name: '' }));
                  }}
                  onBlur={e => validateField('company_name', e.target.value)}
                  placeholder="Company Name Ltd."
                  className={`h-12 px-4 bg-white placeholder:text-muted-foreground/50 
                    ${validationErrors.company_name ? 'border-red-500' : ''}`}
                />
                {validationErrors.company_name && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.company_name}</p>
                )}
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label className="font-medium text-gray-900">Country *</Label>
                <Select 
                  value={companyForm.country} 
                  onValueChange={(value) => {
                    setCompanyForm(prev => ({ 
                      ...prev, 
                      country: value,
                      company_phone: !companyForm.company_phone ? '' : prev.company_phone,
                      // Reset VAT number when country changes
                      vat_number: ''
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* VAT Number */}
                <div className="space-y-2">
                  <Label className="font-medium text-gray-900">VAT Number *</Label>
                  <Input
                    id="vat_number"
                    required
                    value={companyForm.vat_number}
                    onChange={e => {
                      const value = e.target.value;
                      setCompanyForm(prev => ({ ...prev, vat_number: value }));
                      setValidationErrors(prev => ({ ...prev, vat_number: '' }));
                    }}
                    onBlur={e => {
                      if (companyForm.country && e.target.value) {
                        const validation = validateVatNumber(e.target.value, companyForm.country);
                        if (!validation.isValid) {
                          setValidationErrors(prev => ({
                            ...prev,
                            vat_number: validation.message
                          }));
                        }
                      }
                    }}
                    placeholder={companyForm.country === 'IT' ? "11 digits (e.g. 12345678901)" : 
                                companyForm.country ? `VAT number for ${companyForm.country}` : 
                                "Select country first"}
                    className={`h-12 px-4 bg-white placeholder:text-muted-foreground/50
                      ${validationErrors.vat_number || 
                        (companyForm.vat_number && companyForm.country && 
                         !validateVatNumber(companyForm.vat_number, companyForm.country).isValid) 
                         ? 'border-red-500 focus:border-red-500' : ''}`}
                    disabled={!companyForm.country}
                  />
                  {validationErrors.vat_number && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.vat_number}</p>
                  )}
                  {!validationErrors.vat_number && companyForm.vat_number && companyForm.country && 
                   !validateVatNumber(companyForm.vat_number, companyForm.country).isValid && (
                    <p className="text-xs text-red-500 mt-1">
                      {validateVatNumber(companyForm.vat_number, companyForm.country).message}
                    </p>
                  )}
                </div>

                {/* Business Type */}
                <div className="space-y-2">
                  <Label className="font-medium text-gray-900">Company business *</Label>
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

              {/* Address Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium text-gray-900">Address *</Label>
                  <AddressAutocomplete
                    onAddressSelect={({ street_address, city, postal_code, country, province }) => {
                      setCompanyForm(prev => ({
                        ...prev,
                        address: street_address,
                        city,
                        zip_code: postal_code,
                        province,
                        country: country || prev.country
                      }))
                      setValidationErrors(prev => ({
                        ...prev,
                        address: '',
                        city: '',
                        zip_code: ''
                      }))
                    }}
                    error={validationErrors.address}
                    country={companyForm.country}
                  />
                  {validationErrors.address && (
                    <p className="text-xs text-red-500">{validationErrors.address}</p>
                  )}
                </div>
              </div>

              {/* Company Contacts */}
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium text-gray-900">Company Email *</Label>
                    <button
                      type="button"
                      onClick={() => {
                        const emailToUse = userForm.email;
                        setCompanyForm(prev => ({
                          ...prev,
                          company_email: emailToUse
                        }));
                        // Valida l'email immediatamente dopo averla copiata
                        validateField('company_email', emailToUse);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Use account email
                    </button>
                  </div>
                  <Input
                    type="email"
                    required
                    value={companyForm.company_email}
                    onChange={e => {
                      const value = e.target.value;
                      setCompanyForm(prev => ({ ...prev, company_email: value }));
                      setValidationErrors(prev => ({ ...prev, company_email: '' }));
                    }}
                    onBlur={e => validateField('company_email', e.target.value)}
                    placeholder="company@example.com"
                    className={`h-12 ${validationErrors.company_email ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.company_email && (
                    <p className="text-xs text-red-500">{validationErrors.company_email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium text-gray-900">Company Phone *</Label>
                    <button
                      type="button"
                      onClick={() => {
                        const phoneToUse = userForm.telefono;
                        setCompanyForm(prev => ({
                          ...prev,
                          company_phone: phoneToUse
                        }));
                        // Valida il telefono immediatamente dopo averlo copiato
                        validateField('company_phone', phoneToUse);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Use account phone
                    </button>
                  </div>
                  <PhoneInput
                    international
                    defaultCountry={companyForm.country as CountryCode || "IT"}
                    value={companyForm.company_phone}
                    onChange={(value) => {
                      setCompanyForm(prev => ({ ...prev, company_phone: value || '' }));
                      setValidationErrors(prev => ({ ...prev, company_phone: '' }));
                    }}
                    onBlur={() => {
                      if (companyForm.company_phone) {
                        validateField('company_phone', companyForm.company_phone);
                      }
                    }}
                    className={`[&_.PhoneInputInput]:h-12 [&_.PhoneInputInput]:px-4 [&_.PhoneInputInput]:bg-white [&_.PhoneInputCountry]:h-12 [&_.PhoneInput]:flex [&_.PhoneInput]:items-center [&_.PhoneInput]:h-12 [&_.PhoneInput]:border [&_.PhoneInput]:border-input [&_.PhoneInput]:rounded-md [&_.PhoneInput]:p-0 [&_.PhoneInputCountry]:p-0 [&_.PhoneInputCountry]:pl-3 ${
                      validationErrors.company_phone ? '[&_.PhoneInput]:border-red-500' : ''
                    }`}
                  />
                  {validationErrors.company_phone && (
                    <p className="text-xs text-red-500">{validationErrors.company_phone}</p>
                  )}
                </div>
              </div>

              {/* Italian Fields */}
              {companyForm.country === 'IT' && (
                <div className="space-y-4 border-t pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medium text-gray-900">PEC</Label>
                      <Input
                        type="email"
                        value={companyForm.pec || ''}
                        onChange={e => setCompanyForm(prev => ({ ...prev, pec: e.target.value }))}
                        placeholder="pec@company.com"
                        className={`h-12 ${
                          companyForm.country === 'IT' && 
                          !companyForm.pec && 
                          !companyForm.sdi ? 'border-red-500' : ''
                        }`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-gray-900">SDI Code</Label>
                      <Input
                        maxLength={7}
                        value={companyForm.sdi || ''}
                        onChange={e => {
                          const value = e.target.value.toUpperCase();
                          if (value.length <= 7 && value.split('').every(validateSdiChar)) {
                            setCompanyForm(prev => ({ ...prev, sdi: value }))
                          }
                        }}
                        onBlur={() => {
                          if (companyForm.sdi && !validateSdiField(companyForm.sdi, companyForm.country)) {
                            setValidationErrors(prev => ({
                              ...prev,
                              sdi: 'SDI code must be 7 alphanumeric characters'
                            }));
                          } else {
                            setValidationErrors(prev => ({ ...prev, sdi: '' }));
                          }
                        }}
                        placeholder="0000000"
                        className={`h-12 ${
                          (companyForm.country === 'IT' && 
                           !companyForm.pec && 
                           !companyForm.sdi) ||
                          (companyForm.sdi && !validateSdiField(companyForm.sdi, companyForm.country))
                            ? 'border-red-500 focus:border-red-500'
                            : ''
                        }`}
                      />
                      {companyForm.sdi && !validateSdiField(companyForm.sdi, companyForm.country) && (
                        <p className="text-xs text-red-500 mt-1">
                          SDI code must be 7 alphanumeric characters
                        </p>
                      )}
                      {companyForm.country === 'IT' && !companyForm.pec && !companyForm.sdi && (
                        <p className="text-xs text-red-500 mt-1">
                          Either PEC or SDI is required for Italian companies
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="privacy"
                  required
                  checked={companyForm.acceptPrivacy}
                  onChange={e => setCompanyForm(prev => ({
                    ...prev,
                    acceptPrivacy: e.target.checked
                  }))}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="privacy" className="text-sm text-gray-600">
                  I have read and accept the <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link> and agree to the processing of my personal data *
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="newsletter"
                  checked={companyForm.acceptNewsletter}
                  onChange={e => setCompanyForm(prev => ({
                    ...prev,
                    acceptNewsletter: e.target.checked
                  }))}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="newsletter" className="text-sm text-gray-600">
                  I want to receive newsletters about new products and special offers
                </label>
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
                disabled={
                  loading ||
                  // Campi obbligatori
                  !companyForm.company_name ||
                  !companyForm.vat_number ||
                  !companyForm.business ||
                  !companyForm.country ||
                  !companyForm.address ||
                  !companyForm.company_email ||
                  !companyForm.company_phone ||
                  // Validazioni specifiche
                  !validateVatNumber(companyForm.vat_number, companyForm.country).isValid ||
                  !validateEmail(companyForm.company_email) ||
                  !validatePhoneNumber(companyForm.company_phone) ||
                  // Validazione lunghezza minima
                  companyForm.company_name.trim().length < 2 ||
                  companyForm.address.trim().length < 5 ||
                  // Privacy obbligatoria
                  !companyForm.acceptPrivacy ||
                  // Errori di validazione
                  Object.values(validationErrors).some(error => error !== '') ||
                  // Validazione SDI per l'Italia
                  !validateSdiField(companyForm.sdi, companyForm.country) ||
                  // Requisiti specifici per l'Italia
                  (companyForm.country === 'IT' && !companyForm.pec && !companyForm.sdi)
                }
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