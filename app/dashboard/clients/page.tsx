'use client'
import { useState, useEffect } from 'react'
import { ClientsTable } from '@/components/clients/clients-table'
import { EditClientDialog } from '@/components/clients/edit-client-dialog'
import { ClientDetailsDialog } from '@/components/clients/client-details-dialog'
import { toast } from 'sonner'

interface Client {
  id: string
  codice: string
  company_name: string
  vat_number: string
  business: string
  country: string
  city: string
  stato: 'attivo' | 'inattivo' | 'in_attesa_di_attivazione'
  created_at: string
  user: {
    id: string
    nome: string
    cognome: string
    email: string
    attivo: boolean
  }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/clients')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!Array.isArray(data)) {
        console.warn('I dati ricevuti non sono un array:', data)
        setClients([])
        return
      }

      setClients(data)
    } catch (error) {
      console.error('Errore nel caricamento clienti:', error)
      toast.error('Errore nel caricamento dei clienti')
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
    // Aggiorna i dati ogni 30 secondi
    const interval = setInterval(fetchClients, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleDelete = async (clientId: string) => {
    try {
      // Aggiorna immediatamente l'UI
      setClients(prevClients => prevClients.filter(c => c.id !== clientId))
      
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        // Se l'eliminazione fallisce, ripristina lo stato precedente
        await fetchClients()
        throw new Error('Errore durante l\'eliminazione')
      }

      toast.success('Cliente eliminato con successo')
    } catch (error) {
      console.error('Errore eliminazione:', error)
      toast.error('Errore durante l\'eliminazione del cliente')
    }
  }

  const handleSave = async (updatedClient: Client & { created_at?: string }) => {
    try {
      const response = await fetch(`/api/clients/${updatedClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedClient)
      })

      if (!response.ok) {
        throw new Error('Errore nel salvataggio del cliente')
      }

      const updatedData = await response.json()
      
      // Aggiorna sia la lista dei clienti che il cliente selezionato
      setClients(prevClients =>
        prevClients.map(client =>
          client.id === updatedClient.id ? updatedData.data : client
        )
      )
      setSelectedClient(updatedData.data) // Aggiorna il cliente selezionato

      toast.success('Cliente aggiornato con successo')
    } catch (error) {
      console.error('Errore nel salvataggio del cliente:', error)
      toast.error('Errore nel salvataggio del cliente')
      // Ricarica i dati in caso di errore
      await fetchClients()
    }
  }

  const handleActivateClient = async (clientId: string) => {
    try {
      console.log('Inizio attivazione cliente:', clientId)
      
      const response = await fetch(`/api/clients/${clientId}/activate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      console.log('Risposta dal server:', data)

      if (!response.ok) {
        throw new Error(data.message || 'Errore durante l\'attivazione')
      }

      toast.success(data.message)
      await fetchClients()

    } catch (error) {
      console.error('Errore durante l\'attivazione:', error)
      toast.error('Errore durante l\'attivazione del cliente')
    }
  }

  const handleBlockClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Errore durante il blocco del cliente'
        }))
        throw new Error(errorData.message)
      }

      const data = await response.json()
      toast.success(data.message)
      await fetchClients()

    } catch (error) {
      console.error('Errore nel blocco del cliente:', error)
      toast.error(error instanceof Error ? error.message : 'Errore durante il blocco del cliente')
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestione Clienti
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Visualizza e gestisci tutti i clienti registrati.
        </p>
      </div>
      
      <div className="space-y-4">
        <ClientsTable 
          clients={clients as Client[]}
          isLoading={loading}
          onDelete={handleDelete}
          onRowClick={(client) => {
            setSelectedClient(client as Client)
            setIsDetailsDialogOpen(true)
          }}
          refreshData={fetchClients}
        />
      </div>

      {selectedClient && (
        <>
          <EditClientDialog
            client={selectedClient}
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false)
              setSelectedClient(null)
            }}
            onSave={handleSave}
          />

          <ClientDetailsDialog
            client={selectedClient}
            isOpen={isDetailsDialogOpen}
            onClose={() => {
              setIsDetailsDialogOpen(false)
              setSelectedClient(null)
            }}
            onActivate={handleActivateClient}
            onBlock={handleBlockClient}
            onSave={handleSave}
          />
        </>
      )}
    </div>
  )
}