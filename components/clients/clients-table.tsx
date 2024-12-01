'use client'

import { useState, useEffect } from 'react'
import { BUSINESS_TYPES, COUNTRIES } from '@/lib/constants/variants'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Search, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Badge } from "@/components/ui/badge"
import { EditClientDialog } from './edit-client-dialog'

// Importazione dinamica di react-select
const Select = dynamic(() => import('react-select'), {
  ssr: false,
  loading: () => null
})

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
  user: {
    id: string
    nome: string
    cognome: string
    email: string
    attivo: boolean
  }
}

interface ClientsTableProps {
  clients: Client[]
  isLoading?: boolean
  onDelete: (clientId: string) => void
  onRowClick: (client: Client) => void
  refreshData: () => Promise<void>
  onUpdate?: (updatedClient: Client) => void
}

export function ClientsTable({ 
  clients, 
  isLoading,
  onDelete, 
  onRowClick,
  refreshData,
  onUpdate
}: ClientsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [countryFilters, setCountryFilters] = useState<string[]>([])
  const [filteredClients, setFilteredClients] = useState(clients)
  const [localClients, setLocalClients] = useState(clients)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const STATUS_OPTIONS = [
    { value: 'attivo', label: 'Attivo' },
    { value: 'inattivo', label: 'Inattivo' },
    { value: 'in_attesa_di_attivazione', label: 'In attesa' },
    { value: 'eliminata', label: 'Eliminata' }
  ]

  const COUNTRY_OPTIONS = COUNTRIES.map(country => ({
    value: country.value,
    label: country.label
  }))

  // Aggiorna i dati quando cambiano i clients
  useEffect(() => {
    setLocalClients(clients)
    // Applica i filtri correnti ai nuovi dati
    let result = clients

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(client => 
        client.codice.toLowerCase().includes(searchLower) ||
        client.company_name.toLowerCase().includes(searchLower) ||
        client.vat_number.toLowerCase().includes(searchLower) ||
        client.user?.email?.toLowerCase().includes(searchLower) || false
      )
    }

    if (statusFilters.length > 0) {
      result = result.filter(client => statusFilters.includes(client.stato))
    }

    if (countryFilters.length > 0) {
      result = result.filter(client => countryFilters.includes(client.country))
    }

    setFilteredClients(result)
  }, [clients, searchTerm, statusFilters, countryFilters])

  // Funzione per aggiornare localmente un cliente
  const updateLocalClient = (updatedClient: Client) => {
    setLocalClients(prevClients => 
      prevClients.map(client => 
        client.id === updatedClient.id ? updatedClient : client
      )
    )
    // Forza l'aggiornamento dei filtri
    setFilteredClients(prevFiltered => 
      prevFiltered.map(client => 
        client.id === updatedClient.id ? updatedClient : client
      )
    )
  }

  // Funzione per rimuovere localmente un cliente
  const removeLocalClient = (clientId: string) => {
    setLocalClients(prevClients => 
      prevClients.filter(client => client.id !== clientId)
    )
  }

  // Gestione del click sulla riga con aggiornamento locale
  const handleRowClick = async (client: Client) => {
    onRowClick(client)
  }

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: it })
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleClientUpdate = async (updatedClient: Client) => {
    // Aggiorna sia localClients che filteredClients
    setLocalClients(prevClients => 
      prevClients.map(client => 
        client.id === updatedClient.id ? updatedClient : client
      )
    )
    setFilteredClients(prevClients => 
      prevClients.map(client => 
        client.id === updatedClient.id ? updatedClient : client
      )
    )
    // Chiama anche onUpdate se esiste
    if (onUpdate) {
      await onUpdate(updatedClient)
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra di ricerca e filtri */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
        {/* Campo di ricerca */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Cerca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Multiselect per Stato */}
        {isMounted && (
          <>
            <div className="min-w-[200px]">
              <Select
                isMulti
                options={STATUS_OPTIONS}
                placeholder="Seleziona stati"
                value={STATUS_OPTIONS.filter(option => 
                  statusFilters.includes(option.value)
                )}
                onChange={(selectedOptions: any) => {
                  setStatusFilters(
                    selectedOptions
                      ? selectedOptions.map((option: any) => option.value)
                      : []
                  )
                }}
                isClearable={true}
                classNames={{
                  control: () => "py-1",
                  option: ({ isSelected }) =>
                    isSelected ? "bg-blue-500 text-white" : "",
                }}
                theme={(theme) => ({
                  ...theme,
                  colors: {
                    ...theme.colors,
                    primary: '#2563eb',
                    primary25: '#dbeafe',
                    primary50: '#bfdbfe',
                    primary75: '#93c5fd',
                  },
                })}
              />
            </div>
            <div className="min-w-[200px]">
              <Select
                isMulti
                options={COUNTRY_OPTIONS}
                placeholder="Seleziona paesi"
                value={COUNTRY_OPTIONS.filter(option => 
                  countryFilters.includes(option.value)
                )}
                onChange={(selectedOptions: any) => {
                  setCountryFilters(
                    selectedOptions
                      ? selectedOptions.map((option: any) => option.value)
                      : []
                  )
                }}
                isClearable={true}
                classNames={{
                  control: () => "py-1",
                  option: ({ isSelected }) =>
                    isSelected ? "bg-blue-500 text-white" : "",
                }}
                theme={(theme) => ({
                  ...theme,
                  colors: {
                    ...theme.colors,
                    primary: '#2563eb',
                    primary25: '#dbeafe',
                    primary50: '#bfdbfe',
                    primary75: '#93c5fd',
                  },
                })}
              />
            </div>
          </>
        )}
      </div>

      {/* Tabella */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Codice
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azienda
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paese
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                P.IVA
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Creazione
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stato
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredClients.map((client) => (
              <tr 
                key={client.id}
                onClick={() => handleRowClick(client)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {client.codice}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {client.company_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {COUNTRIES.find(c => c.value === client.country)?.label || client.country}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {client.vat_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{client.user?.email}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      client.user?.attivo 
                        ? 'bg-green-500' 
                        : 'bg-red-500'
                    }`} />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(client.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    client.stato === 'attivo' 
                      ? 'bg-green-100 text-green-800' 
                      : client.stato === 'in_attesa_di_attivazione'
                        ? 'bg-yellow-100 text-yellow-800'
                        : client.stato === 'eliminata'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                  }`}>
                    {client.stato === 'in_attesa_di_attivazione' 
                      ? 'In attesa' 
                      : client.stato === 'eliminata'
                        ? 'Eliminata'
                        : client.stato}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditClientDialog 
        client={selectedClient} 
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        onSave={handleClientUpdate}
      />
    </div>
  )
} 