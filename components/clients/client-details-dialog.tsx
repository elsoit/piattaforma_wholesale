import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { Trash2, RefreshCw, Ban, Check, X } from 'lucide-react'
import { BUSINESS_TYPES } from '@/lib/constants/variants'
import countries from 'i18n-iso-countries'
import enLocale from 'i18n-iso-countries/langs/en.json'
import { z } from 'zod'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

// Inizializza la libreria con la lingua inglese
countries.registerLocale(enLocale)

// Crea la lista dei paesi (escludi IL come nel register)
const COUNTRY_OPTIONS = Object.entries(countries.getNames('en'))
  .map(([code, name]) => ({
    value: code,
    label: name as string
  }))
  .filter(country => country.value !== 'IL')
  .sort((a, b) => a.label.localeCompare(b.label))

interface ClientDetailsDialogProps {
  client: Client
  isOpen: boolean
  onClose: () => void
  onSave: (client: Client) => Promise<void>
}

interface ApiError {
  success: false;
  message: string;
}

interface Client {
  id: string
  codice: string
  company_name: string
  vat_number: string
  business: string
  country: string
  city: string
  stato: 'attivo' | 'inattivo' | 'in_attesa_di_attivazione' | 'eliminata'
  created_at: string
  user?: {
    id: string
    nome: string
    cognome: string
    email: string
    attivo: boolean
    email_verified?: boolean
    email_verified_at?: string
  }
  company_email: string
  company_phone: string
  address: string
  zip_code: string
  pec?: string
  sdi?: string
  brands?: Brand[]
  province: string
  region: string
}

interface Brand {
  id: string
  name: string
}

interface ApiResponse {
  message: string
  success: boolean
  data?: Client
}

interface BrandsResponse {
  data: Brand[]
}

// Aggiungi interfaccia per le verifiche
interface EmailVerification {
  id: number
  status: 'pending' | 'completed' | 'expired'
  created_at: string
  verified_at: string | null
  expires_at: string
  ip_address: string
  user_agent: string
}

const renderSelectField = (
  label: string, 
  field: string, 
  value: string, 
  options: readonly { readonly value: string, readonly label: string }[], 
  onChange: (field: string, value: string) => void,
  fieldErrors: Record<string, boolean>,
  setFieldErrors: (value: React.SetStateAction<Record<string, boolean>>) => void
) => {
  const selectOptions = field === 'country' ? COUNTRY_OPTIONS : options
  const placeholder = field === 'country' ? 'Seleziona paese' : `Seleziona ${label.toLowerCase()}`
  const hasError = fieldErrors[field]

  return (
    <div>
      <label className={`text-xs ${hasError ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => {
          setFieldErrors(prev => ({ ...prev, [field]: false }))
          onChange(field, e.target.value)
        }}
        className={`w-full mt-1 text-sm border rounded-md px-2 py-1 focus:ring-1 transition-colors
          ${hasError 
            ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500 text-red-900' 
            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
          }`}
        aria-invalid={hasError}
      >
        <option value="">{placeholder}</option>
        {selectOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hasError && (
        <p className="mt-1 text-xs text-red-500">
          {`Seleziona un ${label.toLowerCase()}`}
        </p>
      )}
    </div>
  )
}

const renderInputField = (
  label: string, 
  field: string, 
  value: string, 
  onChange: (field: string, value: string) => void,
  type: string = "text",
  fieldErrors: Record<string, boolean>,
  setFieldErrors: (value: React.SetStateAction<Record<string, boolean>>) => void
) => {
  const hasError = fieldErrors[field]
  
  return (
    <div>
      <label className={`text-xs ${hasError ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value || ''}
          onChange={(e) => {
            setFieldErrors(prev => ({ ...prev, [field]: false }))
            onChange(field, e.target.value)
          }}
          className={`w-full mt-1 text-sm border rounded-md px-2 py-1 focus:ring-1 transition-colors
            ${hasError 
              ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500 text-red-900 placeholder-red-300' 
              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
            }`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${field}-error` : undefined}
        />
        {hasError && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-red-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        )}
      </div>
      {hasError && (
        <p className="mt-1 text-xs text-red-500" id={`${field}-error`}>
          {`${label} non valido`}
        </p>
      )}
    </div>
  )
}

const fetchBrands = async (clientId: string) => {
  const [brandsResponse, clientBrandsResponse] = await Promise.all([
    fetch('/api/brands'),
    fetch(`/api/clients/${clientId}/brands`)
  ])
    
  const { data: allBrands } = await brandsResponse.json() as BrandsResponse
  const { data: clientBrands } = await clientBrandsResponse.json() as BrandsResponse
    
  return { allBrands, clientBrands }
}

// Schema di validazione
const clientSchema = z.object({
  company_name: z.string().min(1, 'Ragione sociale obbligatoria'),
  vat_number: z.string()
    .refine(val => {
      if (formData.country === 'IT') {
        return /^[0-9]{11}$/.test(val)
      }
      return val.length >= 5
    }, {
      message: (val) => formData.country === 'IT' 
        ? 'La partita IVA deve essere di 11 numeri'
        : 'Partita IVA non valida'
    }),
  company_email: z.string().email('Email aziendale non valida'),
  company_phone: z.string()
    .refine(val => !val || /^\+?[1-9]\d{1,14}$/.test(val.replace(/\s/g, '')), {
      message: 'Numero di telefono non valido'
    }),
  country: z.string().min(1, 'Seleziona il paese'),
  address: z.string().min(1, 'Indirizzo obbligatorio'),
  city: z.string().min(1, 'Città obbligatoria'),
  zip_code: z.string().min(1, 'CAP obbligatorio'),
  pec: z.string().email('PEC non valida').optional().nullable(),
  sdi: z.string()
    .refine(val => !val || /^[A-Z0-9]{7}$/.test(val), {
      message: 'Il codice SDI deve essere di 7 caratteri alfanumerici maiuscoli'
    })
    .optional()
    .nullable()
})

export function ClientDetailsDialog({ client, isOpen, onClose, onSave }: ClientDetailsDialogProps) {
  // Inizializza gli stati con array vuoti
  const [mounted, setMounted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(client)
  const [isLoading, setIsLoading] = useState(false)
  const [localClient, setLocalClient] = useState(client)
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrands, setSelectedBrands] = useState<Brand[]>([])
  const [openBrandSelector, setOpenBrandSelector] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})
  const [verifications, setVerifications] = useState<EmailVerification[]>([])
  const [isResendingVerification, setIsResendingVerification] = useState(false)

  // Effect per il mounting
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Effect per aggiornare i dati locali quando il client cambia
  useEffect(() => {
    if (client) {
      setLocalClient(client)
      setFormData(client)
    }
  }, [client])

  // Effect per caricare i brand
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const { allBrands, clientBrands } = await fetchBrands(client.id)
        setBrands(allBrands || [])  // Fallback a array vuoto
        setSelectedBrands(clientBrands || [])  // Fallback a array vuoto
      } catch (error) {
        console.error('Errore nel caricamento dei brand:', error)
        toast.error('Errore nel caricamento dei brand')
        setBrands([])
        setSelectedBrands([])
      }
    }

    if (client?.id) {
      loadBrands()
    }
  }, [client?.id])

  // Aggiungi all'useEffect esistente o creane uno nuovo
  useEffect(() => {
    if (isOpen && localClient?.user?.id) {
      loadVerifications()
    }
  }, [isOpen, localClient?.user?.id])

  // Aggiorna la funzione loadVerifications per gestire i tipi
  const loadVerifications = async () => {
    if (!localClient?.user?.id) return

    try {
      const response = await fetch(`/api/users/${localClient.user.id}/email-verifications`)
      if (!response.ok) throw new Error('Errore nel caricamento delle verifiche')
      
      const data = await response.json() as EmailVerification[]
      setVerifications(data)

      // Se c'è almeno una verifica completata, aggiorna lo stato del client
      const hasCompletedVerification = data.some(v => v.status === 'completed')
      if (hasCompletedVerification && localClient) {
        const updatedClient: Client = {
          ...localClient,
          user: {
            ...localClient.user,
            email_verified: true,
            email_verified_at: data.find(v => v.status === 'completed')?.verified_at || new Date().toISOString()
          }
        }
        setLocalClient(updatedClient)
        setFormData(updatedClient)
      }
    } catch (error) {
      console.error('Errore nel caricamento delle verifiche:', error)
      toast.error('Impossibile caricare lo storico delle verifiche')
    }
  }

  // Funzione per reinviare la verifica
  const handleResendVerification = async () => {
    if (!localClient?.user?.id) return

    try {
      setIsResendingVerification(true)
      const response = await fetch(`/api/users/${localClient.user.id}/resend-verification`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Errore nel reinvio della verifica')
      }

      await loadVerifications()
      toast.success('Email di verifica inviata con successo')
    } catch (error) {
      console.error('Errore nel reinvio della verifica:', error)
      toast.error('Impossibile inviare l\'email di verifica')
    } finally {
      setIsResendingVerification(false)
    }
  }

  // Non renderizzare nulla finché non siamo sul client
  if (!mounted || !localClient) {
    return null
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      // Reset tutti gli errori
      setFieldErrors({})

      // Validazioni base
      const errors: Record<string, boolean> = {}
      let hasErrors = false

      // Validazione campi obbligatori
      if (!formData.company_name.trim()) {
        errors.company_name = true
        toast.error('Inserisci la Ragione Sociale')
        hasErrors = true
      }

      // Validazione email
      if (!formData.company_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.company_email)) {
        errors.company_email = true
        toast.error('Email aziendale non valida')
        hasErrors = true
      }

      // Validazione Partita IVA
      if (formData.country === 'IT' && !/^[0-9]{11}$/.test(formData.vat_number)) {
        errors.vat_number = true
        toast.error('La partita IVA deve essere di 11 numeri')
        hasErrors = true
      }

      // Validazione telefono
      if (formData.company_phone && !/^\+?[1-9]\d{1,14}$/.test(formData.company_phone.replace(/\s/g, ''))) {
        errors.company_phone = true
        toast.error('Numero di telefono non valido')
        hasErrors = true
      }

      // Validazione paese
      if (!formData.country) {
        errors.country = true
        toast.error('Seleziona il paese')
        hasErrors = true
      }

      // Validazione indirizzo
      if (!formData.address.trim()) {
        errors.address = true
        toast.error('Inserisci l\'indirizzo')
        hasErrors = true
      }

      // Validazione città
      if (!formData.city.trim()) {
        errors.city = true
        toast.error('Inserisci la città')
        hasErrors = true
      }

      // Validazione CAP
      if (!formData.zip_code.trim()) {
        errors.zip_code = true
        toast.error('Inserisci il CAP')
        hasErrors = true
      }

      // Validazioni specifiche per l'Italia
      if (formData.country === 'IT') {
        if (!formData.pec && !formData.sdi) {
          errors.pec = true
          errors.sdi = true
          toast.error('Per le aziende italiane è necessario specificare almeno PEC o codice SDI')
          hasErrors = true
        }

        if (formData.sdi && !/^[A-Z0-9]{7}$/.test(formData.sdi)) {
          errors.sdi = true
          toast.error('Il codice SDI deve essere di 7 caratteri alfanumerici maiuscoli')
          hasErrors = true
        }

        if (formData.pec && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.pec)) {
          errors.pec = true
          toast.error('PEC non valida')
          hasErrors = true
        }
      }

      // Se ci sono errori, imposta gli stati e termina
      if (hasErrors) {
        setFieldErrors(errors)
        setIsLoading(false)
        return
      }

      // Continua con il salvataggio se non ci sono errori
      // ... resto del codice per il salvataggio
    } catch (error) {
      console.error('Errore salvataggio:', error)
      toast.error(error instanceof Error ? error.message : 'Errore durante il salvataggio')
    } finally {
      setIsLoading(false)
    }
  }

  // Funzione per renderizzare i campi in modalità visualizzazione
  const renderField = (label: string, field: string, value: string) => {
    const getDisplayValue = (field: string, value: string) => {
      if (field === 'business') {
        return BUSINESS_TYPES.find(type => type.value === value)?.label || value
      }
      if (field === 'country') {
        return COUNTRY_OPTIONS.find(country => country.value === value)?.label || value
      }
      return value
    }

    return (
      <div>
        <label className="text-xs text-gray-500">{label}</label>
        <p className="mt-1 text-sm">{getDisplayValue(field, value)}</p>
      </div>
    )
  }

  const handleActivate = async () => {
    if (!localClient?.user) return;

    // Verifica se l'email non è verificata
    if (!localClient.user.email_verified) {
      const confirmActivation = window.confirm(
        'L\'email dell\'utente non è stata verificata. Vuoi procedere comunque con l\'attivazione?'
      )
      if (!confirmActivation) {
        return;
      }
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/clients/${localClient.id}/activate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isFirstActivation: localClient.stato === 'in_attesa_di_attivazione'
        })
      })

      const data = await response.json() as { message: string, success: boolean }

      if (!response.ok) {
        throw new Error(data.message || 'Errore durante l\'attivazione')
      }

      const shouldActivateUser = localClient.stato === 'in_attesa_di_attivazione'

      const updatedClient: Client = {
        ...localClient,
        stato: 'attivo' as const,
        user: localClient.user ? {
          ...localClient.user,
          attivo: shouldActivateUser ? true : localClient.user.attivo
        } : undefined
      }

      setLocalClient(updatedClient)
      setFormData(updatedClient)
      await onSave(updatedClient)

      toast.success(data.message || 'Cliente attivato con successo')
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Errore durante l\'attivazione del cliente')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/clients/${client.id}/delete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json() as ApiResponse

      if (!response.ok) {
        throw new Error(data.message || 'Errore durante l\'eliminazione')
      }

      // Aggiorna lo stato locale immediatamente
      const updatedClient = {
        ...client,
        stato: 'eliminata',
        user: {
          ...client.user,
          attivo: false
        }
      }
      setLocalClient(updatedClient as Client)
      setFormData(updatedClient as Client)

      toast.success(data.message)
      await onSave(updatedClient as Client)
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Errore durante l\'eliminazione del cliente')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBlock = async () => {
    if (!localClient?.user) return;

    try {
      setIsLoading(true)
      const response = await fetch(`/api/clients/${localClient.id}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        // Aggiungiamo esplicitamente il payload per indicare che vogliamo bloccare solo il cliente
        body: JSON.stringify({
          blockOnlyClient: true,  // Flag esplicito per il backend
          updatedStatus: 'inattivo'
        })
      })

      const data = await response.json() as { message: string, success: boolean }

      if (!response.ok) {
        throw new Error(data.message || 'Errore durante il blocco')
      }

      // Creiamo un nuovo oggetto cliente mantenendo TUTTI i dati dell'utente esattamente come sono
      const updatedClient: Client = {
        ...localClient,
        stato: 'inattivo' as const,  // Modifichiamo SOLO lo stato del cliente
        user: localClient.user ? { ...localClient.user } : undefined
      }
      
      setLocalClient(updatedClient)
      setFormData(updatedClient)
      await onSave(updatedClient)

      toast.success(data.message || 'Cliente bloccato con successo')
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Errore durante il blocco del cliente')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateBrands = async (updatedBrands: Brand[]) => {
    // Verifica se il cliente è attivo
    if (localClient.stato !== 'attivo') {
      toast.error('Non è possibile associare brand a un cliente non attivo')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/clients/${client.id}/brands`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          brandIds: updatedBrands.map(b => b.id) 
        })
      })

      if (!response.ok) throw new Error('Errore nell\'aggiornamento dei brand')

      setSelectedBrands(updatedBrands)
      toast.success('Brand aggiornati con successo')
    } catch (error) {
      console.error('Errore:', error)
      toast.error('Errore nell\'aggiornamento dei brand')
    } finally {
      setIsLoading(false)
    }
  }

  const renderBrandSelector = () => {
    const brandsList = brands || [];
    const selectedList = selectedBrands || [];
    
    // Disabilita il selettore se il cliente non è attivo
    const isDisabled = localClient.stato !== 'attivo';
    
    return (
      <div>
        <h3 className="text-lg font-medium mb-4">Brand Associati</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={() => !isDisabled && setOpenBrandSelector(!openBrandSelector)}
              disabled={isDisabled}
            >
              {selectedList.length > 0
                ? `${selectedList.length} brand selezionati`
                : isDisabled 
                  ? "Cliente non attivo"
                  : "Seleziona brand"}
            </Button>

            {openBrandSelector && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border">
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Cerca brand..."
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    onChange={(e) => {
                      // Implementa la ricerca se necessario
                    }}
                  />
                </div>
                <div className="max-h-60 overflow-auto">
                  {brandsList.map((brand) => {
                    if (!brand?.id) return null;
                    const isSelected = selectedList.some(
                      (selectedBrand) => selectedBrand.id === brand.id
                    );
                    return (
                      <div
                        key={brand.id}
                        className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          const updatedBrands = isSelected
                            ? selectedList.filter((b) => b.id !== brand.id)
                            : [...selectedList, brand];
                          setSelectedBrands(updatedBrands);
                        }}
                      >
                        {isSelected ? (
                          <Check className="w-4 h-4 text-blue-600" />
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                        <span>{brand.name}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="p-2 border-t flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenBrandSelector(false)}
                  >
                    Annulla
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      handleUpdateBrands(selectedList);
                      setOpenBrandSelector(false);
                    }}
                  >
                    Salva
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {selectedList.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedList.map((brand) => (
                <div
                  key={brand.id}
                  className="bg-blue-100 text-blue-800 text-sm rounded-full px-3 py-1"
                >
                  {brand.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={onClose}
    >
      <DialogContent 
        className="sm:max-w-[700px] h-[85vh] flex flex-col p-0"
        style={{ overflow: 'hidden' }}
      >
        {localClient && (
          <>
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="text-2xl font-semibold">
                {localClient.company_name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-sm font-bold text-gray-900">Cod: {localClient.codice}</p>
                <p className="text-sm text-gray-500">P.IVA: {localClient.vat_number}</p>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  localClient.stato === 'attivo' 
                    ? 'bg-green-100 text-green-800' 
                    : localClient.stato === 'in_attesa_di_attivazione'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}>
                  {localClient.stato === 'in_attesa_di_attivazione' ? 'In attesa' : localClient.stato}
                </span>

                {localClient.stato === 'attivo' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2 py-1 h-8 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm('Sei sicuro di voler bloccare questo cliente?')) {
                        handleBlock()
                      }
                    }}
                    disabled={isLoading}
                  >
                    <Ban className="w-3 h-3 mr-1" />
                    {isLoading ? 'Blocco...' : 'Blocca'}
                  </Button>
                )}

                {(localClient.stato === 'in_attesa_di_attivazione' || localClient.stato === 'inattivo') && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleActivate()
                    }}
                    disabled={isLoading}
                    className="px-2 py-0.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Attivazione...' : localClient.stato === 'in_attesa_di_attivazione' ? 'Abilita Cliente' : 'Attiva Cliente'}
                  </button>
                )}

                {localClient.stato === 'eliminata' && (
                  <Button
                    variant="ghost"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm('Sei sicuro di voler riattivare questo cliente?')) {
                        handleActivate()
                      }
                    }}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Riattivazione...' : 'Riattiva'}
                  </Button>
                )}
              </div>
            </DialogHeader>

            {/* Contenuto principale */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                {/* Informazioni Aziendali */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Informazioni Aziendali</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    {isEditing ? (
                      <>
                        {renderInputField('Ragione Sociale', 'company_name', formData.company_name, handleChange, 'text', fieldErrors, setFieldErrors)}
                        {renderInputField('Partita IVA', 'vat_number', formData.vat_number, handleChange, 'text', fieldErrors, setFieldErrors)}
                        {renderSelectField('Tipo Business', 'business', formData.business, BUSINESS_TYPES, handleChange, fieldErrors, setFieldErrors)}
                        {renderSelectField('Paese', 'country', formData.country, COUNTRY_OPTIONS, handleChange, fieldErrors, setFieldErrors)}
                        {renderInputField('Email Aziendale', 'company_email', formData.company_email, handleChange, 'email', fieldErrors, setFieldErrors)}
                        {renderInputField('Telefono', 'company_phone', formData.company_phone, handleChange, 'tel', fieldErrors, setFieldErrors)}
                      </>
                    ) : (
                      <>
                        {renderField('Ragione Sociale', 'company_name', localClient.company_name)}
                        {renderField('Partita IVA', 'vat_number', localClient.vat_number)}
                        {renderField('Email Aziendale', 'company_email', localClient.company_email)}
                        {renderField('Telefono', 'company_phone', localClient.company_phone)}
                        {renderField('Tipo Business', 'business', localClient.business)}
                        {renderField('Paese', 'country', localClient.country)}
                      </>
                    )}
                  </div>
                </div>

                {/* Sede Legale */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Sede Legale</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Indirizzo completo */}
                      <div className="col-span-2">
                        {isEditing ? (
                          renderInputField('Indirizzo', 'address', formData.address, handleChange, 'text', fieldErrors, setFieldErrors)
                        ) : (
                          renderField('Indirizzo', 'address', localClient.address)
                        )}
                      </div>

                      {/* Città e CAP */}
                      <div>
                        {isEditing ? (
                          renderInputField('Città', 'city', formData.city, handleChange, 'text', fieldErrors, setFieldErrors)
                        ) : (
                          renderField('Città', 'city', localClient.city)
                        )}
                      </div>
                      <div>
                        {isEditing ? (
                          renderInputField('CAP', 'zip_code', formData.zip_code, handleChange, 'text', fieldErrors, setFieldErrors)
                        ) : (
                          renderField('CAP', 'zip_code', localClient.zip_code)
                        )}
                      </div>

                      {/* Provincia e Regione */}
                      <div>
                        {isEditing ? (
                          renderInputField('Provincia', 'province', formData.province, handleChange, 'text', fieldErrors, setFieldErrors)
                        ) : (
                          renderField('Provincia', 'province', localClient.province || '-')
                        )}
                      </div>
                      <div>
                        {isEditing ? (
                          renderInputField('Regione', 'region', formData.region, handleChange, 'text', fieldErrors, setFieldErrors)
                        ) : (
                          renderField('Regione', 'region', localClient.region || '-')
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campi PEC e SDI per aziende italiane */}
                {isEditing && formData.country === 'IT' && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Dati Fatturazione Elettronica</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        {renderInputField('PEC', 'pec', formData.pec ?? '', handleChange, 'email', fieldErrors, setFieldErrors)}
                        {renderInputField('Codice SDI', 'sdi', formData.sdi ?? '', handleChange, 'text', fieldErrors, setFieldErrors)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Utente Associato - senza pallini di stato */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Utente Associato</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {client.user?.nome?.[0]}{client.user?.cognome?.[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {client.user?.nome} {client.user?.cognome}
                        </p>
                        <p className="text-sm text-gray-500">
                          {client.user?.email}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full
                        ${client.user?.attivo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'}`}
                      >
                        {client.user?.attivo ? 'Attivo' : 'Non attivo'}
                      </span>
                    </div>
                  </div>
                </div>

                {renderBrandSelector()}

                {/* Verifica Email */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Verifica Email</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          Stato: {' '}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                            ${localClient?.user?.email_verified 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {localClient?.user?.email_verified ? 'Verificata' : 'Non verificata'}
                          </span>
                        </p>
                        {localClient?.user?.email_verified && localClient?.user?.email_verified_at && (
                          <p className="text-sm text-gray-500 mt-1">
                            Verificata il: {format(new Date(localClient.user.email_verified_at), 'PPP', { locale: it })}
                          </p>
                        )}
                      </div>
                      
                      {/* Mostra il pulsante solo se l'email non è verificata */}
                      {localClient?.user && !localClient.user.email_verified && (
                        <Button
                          size="sm"
                          onClick={handleResendVerification}
                          disabled={isResendingVerification}
                        >
                          {isResendingVerification ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Invio in corso...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reinvia verifica
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Storico verifiche */}
                    {verifications.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Storico verifiche</h4>
                        <div className="space-y-2">
                          {verifications.map((verification) => (
                            <div 
                              key={verification.id}
                              className="text-xs bg-white p-3 rounded border"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                    ${verification.status === 'completed' 
                                      ? 'bg-green-100 text-green-800'
                                      : verification.status === 'expired'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {verification.status === 'completed' 
                                      ? 'Completata'
                                      : verification.status === 'expired'
                                        ? 'Scaduta'
                                        : 'In attesa'
                                    }
                                  </span>
                                  <p className="mt-1 text-gray-500">
                                    Inviata: {format(new Date(verification.created_at), 'Pp', { locale: it })}
                                  </p>
                                  {verification.verified_at && (
                                    <p className="text-gray-500">
                                      Verificata: {format(new Date(verification.verified_at), 'Pp', { locale: it })}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right text-gray-500">
                                  <p>IP: {verification.ip_address}</p>
                                  <p className="truncate max-w-[200px]" title={verification.user_agent}>
                                    {verification.user_agent}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer con pulsanti */}
            <div className="px-6 py-4 border-t bg-white flex justify-between items-center gap-3">
              <div className="flex gap-2">
                {localClient.stato !== 'eliminata' && (
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm('Sei sicuro di voler eliminare questo cliente?')) {
                        handleDelete()
                      }
                    }}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isLoading ? 'Eliminazione...' : 'Elimina'}
                  </Button>
                )}
              </div>

              {/* Pulsanti di destra */}
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        setFormData(localClient)
                      }}
                      disabled={isLoading}
                    >
                      Annulla
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Salvataggio...' : 'Salva'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      Modifica
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={onClose}
                    >
                      Chiudi
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}