'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { ClientsTable } from '@/components/clients/clients-table'
import type { Client } from '@/types/clients'
import { ClientDetailsDialog } from '@/components/clients/client-details-dialog'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchClients = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/clients')
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error('Errore nel caricamento clienti:', error)
      toast.error('Errore nel caricamento dei clienti')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleDelete = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/delete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Errore durante l\'eliminazione')
      }

      // Aggiorna lo stato locale
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === clientId 
            ? { ...client, stato: 'eliminata', user: { ...client.user, attivo: false } }
            : client
        )
      )

      toast.success(data.message)
    } catch (error) {
      console.error('Errore durante l\'eliminazione:', error)
      toast.error('Errore durante l\'eliminazione del cliente')
    }
  }

  const handleUpdate = async (updatedClient: Client) => {
    try {
      const response = await fetch(`/api/clients/${updatedClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedClient)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Errore durante l\'aggiornamento')
      }

      // Aggiorna lo stato locale
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === updatedClient.id ? updatedClient : client
        )
      )

      toast.success(data.message)
    } catch (error) {
      console.error('Errore durante l\'aggiornamento:', error)
      toast.error('Errore durante l\'aggiornamento del cliente')
    }
  }

  const handleActivate = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/activate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Errore durante l\'attivazione')
      }

      // Aggiorna lo stato locale
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === clientId 
            ? { ...client, stato: 'attivo', user: { ...client.user, attivo: true } }
            : client
        )
      )

      toast.success(data.message)
    } catch (error) {
      console.error('Errore durante l\'attivazione:', error)
      toast.error('Errore durante l\'attivazione del cliente')
    }
  }

  return (
    <ClientDetailsDialog
      client={selectedClient}
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      refreshData={fetchClients}
    />
  )
} 