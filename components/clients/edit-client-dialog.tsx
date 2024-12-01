'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Client } from '@/types/client'

interface EditClientDialogProps {
  client: Client | null
  isOpen: boolean
  onClose: () => void
  onSave: (client: Client) => Promise<void>
}

export function EditClientDialog({ client, isOpen, onClose, onSave }: EditClientDialogProps) {
  const [formData, setFormData] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (client) {
      setFormData(client)
    }
  }, [client])

  if (!client || !formData) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSave(formData)
      toast.success('Cliente aggiornato con successo')
      onClose()
    } catch (error) {
      console.error('Errore durante il salvataggio:', error)
      toast.error('Errore durante il salvataggio')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null)
  }

  const renderInputField = (label: string, name: string, value: string, onChange: (field: string, value: string) => void, type: string = 'text') => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <Input
        type={type}
        id={name}
        name={name}
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full"
      />
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium">Modifica Cliente</h2>
            <p className="text-sm text-gray-500">
              Modifica i dettagli del cliente
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {renderInputField('Codice', 'codice', formData.codice, handleChange)}
              {renderInputField('Ragione Sociale', 'company_name', formData.company_name, handleChange)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {renderInputField('Partita IVA', 'vat_number', formData.vat_number, handleChange)}
              {renderInputField('Codice Fiscale', 'fiscal_code', formData.fiscal_code || '', handleChange)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {renderInputField('Indirizzo', 'address', formData.address || '', handleChange)}
              {renderInputField('CAP', 'postal_code', formData.postal_code || '', handleChange)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {renderInputField('Città', 'city', formData.city || '', handleChange)}
              {renderInputField('Provincia', 'province', formData.province || '', handleChange)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {renderInputField('Telefono', 'phone', formData.phone || '', handleChange, 'tel')}
              {renderInputField('Email', 'email', formData.email || '', handleChange, 'email')}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {renderInputField('PEC', 'pec', formData.pec || '', handleChange, 'email')}
              {renderInputField('Codice SDI', 'sdi', formData.sdi || '', handleChange)}
            </div>

            {/* Sezione Utente Associato */}
            <div>
              <h3 className="text-lg font-medium mb-4">Utente Associato</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {formData.user ? (
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {formData.user.nome?.[0]}{formData.user.cognome?.[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {formData.user.nome} {formData.user.cognome}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formData.user.email}
                      </p>
                    </div>
                    <span 
                      className={`px-2 py-1 text-xs rounded-full ${
                        formData.user.attivo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {formData.user.attivo ? 'Attivo' : 'Non attivo'}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nessun utente associato</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Salvataggio...' : 'Salva'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
} 