import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { Trash2, RefreshCw, Ban, Check, X } from 'lucide-react'
import { BUSINESS_TYPES, COUNTRIES } from '@/lib/constants/variants'

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
  user: {
    id: string
    nome: string
    cognome: string
    email: string
    attivo: boolean
  }
  company_email: string
  company_phone: string
  address: string
  zip_code: string
  pec?: string
  sdi?: string
  brands?: Brand[]
}

interface Brand {
  id: string
  name: string
}

const renderSelectField = (
  label: string, 
  field: string, 
  value: string, 
  options: readonly { readonly value: string, readonly label: string }[], 
  onChange: (field: string, value: string) => void
) => {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full mt-1 text-sm border rounded-md px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

const renderInputField = (
  label: string, 
  field: string, 
  value: string, 
  onChange: (field: string, value: string) => void,
  type: string = "text"
) => {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full mt-1 text-sm border rounded-md px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  )
}

const fetchBrands = async (clientId: string) => {
  try {
    const [brandsResponse, clientBrandsResponse] = await Promise.all([
      fetch('/api/brands'),
      fetch(`/api/clients/${clientId}/brands`)
    ])
    
    const { data: allBrands } = await brandsResponse.json()
    const { data: clientBrands } = await clientBrandsResponse.json()
    
    return { allBrands, clientBrands }
  } catch (error) {
    console.error('Errore nel caricamento dei brand:', error)
    throw error
  }
}

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

  // Effect per il mounting
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Effect per aggiornare i dati locali quando il client cambia
  useEffect(() => {
    setFormData(client)
    setLocalClient(client)
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

  // Non renderizzare nulla finché non siamo sul client
  if (!mounted) {
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
      
      const apiUrl = `/api/clients/${client.id}`
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Errore durante il salvataggio')
      }

      const result = await response.json()
      
      if (result.success) {
        // Aggiorna i dati locali con la risposta del server
        setLocalClient(result.data)
        setFormData(result.data)
        toast.success('Cliente aggiornato con successo')
        setIsEditing(false)
      } else {
        throw new Error(result.message || 'Errore durante il salvataggio')
      }

    } catch (error) {
      console.error('Errore salvataggio:', error)
      toast.error(error instanceof Error ? error.message : 'Errore durante il salvataggio')
    } finally {
      setIsLoading(false)
    }
  }

  // Funzione per renderizzare i campi in modalità visualizzazione
  const renderField = (label: string, field: string, value: string) => {
    // Gestione speciale per i campi con mapping
    const getDisplayValue = (field: string, value: string) => {
      if (field === 'business') {
        return BUSINESS_TYPES.find(type => type.value === value)?.label || value
      }
      if (field === 'country') {
        return COUNTRIES.find(country => country.value === value)?.label || value
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
    try {
      setIsLoading(true)
      const response = await fetch(`/api/clients/${client.id}/activate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Errore durante l\'attivazione')
      }

      const updatedClient = {
        ...client,
        stato: 'attivo',
        user: {
          ...client.user,
          attivo: true
        }
      }

      setLocalClient(updatedClient)
      setFormData(updatedClient)
      await onSave(updatedClient)

      toast.success(data.message)
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

      const data = await response.json()

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
    try {
      setIsLoading(true)
      const response = await fetch(`/api/clients/${client.id}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Errore durante il blocco')
      }

      // Aggiorna lo stato locale immediatamente
      const updatedClient = {
        ...client,
        stato: 'inattivo',
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
        toast.error('Errore durante il blocco del cliente')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateBrands = async (updatedBrands: Brand[]) => {
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
    
    return (
      <div>
        <h3 className="text-lg font-medium mb-4">Brand Associati</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={() => setOpenBrandSelector(!openBrandSelector)}
            >
              {selectedList.length > 0
                ? `${selectedList.length} brand selezionati`
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
                          handleUpdateBrands(updatedBrands);
                          setOpenBrandSelector(false);
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
            {localClient.stato === 'in_attesa_di_attivazione' && (
              <button
                onClick={handleActivate}
                disabled={isLoading}
                className="px-2 py-0.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Attivazione...' : 'Abilita Cliente'}
              </button>
            )}
            {localClient.stato === 'inattivo' && (
              <button
                onClick={handleActivate}
                disabled={isLoading}
                className="px-2 py-0.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Attivazione...' : 'Attiva Cliente'}
              </button>
            )}
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
                    {renderInputField('Ragione Sociale', 'company_name', formData.company_name, handleChange)}
                    {renderInputField('Partita IVA', 'vat_number', formData.vat_number, handleChange)}
                    {renderSelectField('Tipo Business', 'business', formData.business, BUSINESS_TYPES, handleChange)}
                    {renderSelectField('Paese', 'country', formData.country, COUNTRIES, handleChange)}
                    {renderInputField('Email Aziendale', 'company_email', formData.company_email, handleChange, 'email')}
                    {renderInputField('Telefono', 'company_phone', formData.company_phone, handleChange, 'tel')}
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
                  <div className="col-span-2">
                    {isEditing ? (
                      renderInputField('Indirizzo', 'address', formData.address, handleChange)
                    ) : (
                      renderField('Indirizzo', 'address', localClient.address)
                    )}
                  </div>
                  {isEditing ? (
                    <>
                      {renderInputField('Città', 'city', formData.city, handleChange)}
                      {renderInputField('CAP', 'zip_code', formData.zip_code, handleChange)}
                    </>
                  ) : (
                    <>
                      {renderField('Città', 'city', localClient.city)}
                      {renderField('CAP', 'zip_code', localClient.zip_code)}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Campi PEC e SDI per aziende italiane */}
            {isEditing && formData.country === 'IT' && (
              <div>
                <h3 className="text-lg font-medium mb-4">Dati Fatturazione Elettronica</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    {renderInputField('PEC', 'pec', formData.pec ?? '', handleChange, 'email')}
                    {renderInputField('Codice SDI', 'sdi', formData.sdi ?? '', handleChange)}
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
          </div>
        </div>

        {/* Footer con pulsanti */}
        <div className="px-6 py-4 border-t bg-white flex justify-between items-center gap-3">
          <div className="flex gap-2">
            {/* Pulsante Elimina/Riattiva */}
            {localClient.stato === 'eliminata' ? (
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
            ) : (
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
      </DialogContent>
    </Dialog>
  )
}