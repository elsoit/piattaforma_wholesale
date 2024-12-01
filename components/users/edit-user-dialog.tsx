import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'

interface EditUserDialogProps {
  user: {
    id: string
    nome: string
    cognome: string
    email: string
    telefono?: string
    ruolo: string
    attivo: boolean
  }
  isOpen: boolean
  onClose: () => void
  onSave: (updatedUser: any) => Promise<void>
}

export function EditUserDialog({ user, isOpen, onClose, onSave }: EditUserDialogProps) {
  const [formData, setFormData] = useState({
    nome: user.nome,
    cognome: user.cognome,
    email: user.email,
    telefono: user.telefono || '',
    ruolo: user.ruolo,
    attivo: user.attivo
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({ ...formData, id: user.id })
      onClose()
    } catch (error) {
      console.error('Errore durante il salvataggio:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifica Utente</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="nome" className="text-sm font-medium">Nome</label>
            <input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="cognome" className="text-sm font-medium">Cognome</label>
            <input
              id="cognome"
              value={formData.cognome}
              onChange={(e) => setFormData(prev => ({ ...prev, cognome: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="telefono" className="text-sm font-medium">Telefono</label>
            <input
              id="telefono"
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              className="w-full p-2 border rounded"
              placeholder="+39 XXX XXXXXXX"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="ruolo" className="text-sm font-medium">Ruolo</label>
            <select
              id="ruolo"
              value={formData.ruolo}
              onChange={(e) => setFormData(prev => ({ ...prev, ruolo: e.target.value }))}
              className="w-full p-2 border rounded"
            >
              <option value="cliente">Cliente</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="attivo" className="text-sm font-medium">Stato</label>
            <select
              id="attivo"
              value={formData.attivo.toString()}
              onChange={(e) => setFormData(prev => ({ ...prev, attivo: e.target.value === 'true' }))}
              className="w-full p-2 border rounded"
            >
              <option value="true">Attivo</option>
              <option value="false">Inattivo</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 