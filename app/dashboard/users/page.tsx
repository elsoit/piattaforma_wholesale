'use client'

import { useState, useEffect } from 'react'
import { CreateUserDialog } from '@/components/users/create-user-dialog'
import { EditUserDialog } from '@/components/users/edit-user-dialog'
import { UsersTable } from '@/components/users/users-table'

interface User {
  id: string
  nome: string
  cognome: string
  email: string
  ruolo: string
  attivo: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]) // In produzione, questo dovrebbe essere caricato da un'API
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Carica gli utenti all'avvio
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Errore nel caricamento degli utenti')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Errore durante il caricamento degli utenti:', error)
    }
  }

  const handleCreateUser = async (userData: any) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) throw new Error('Errore nella creazione dell\'utente')
      
      // Ricarica la lista degli utenti dopo la creazione
      await fetchUsers()
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Errore durante la creazione:', error)
    }
  }

  const handleEditUser = async (updatedUser: any) => {
    try {
      const response = await fetch(`/api/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser),
      })

      if (!response.ok) throw new Error('Errore nell\'aggiornamento dell\'utente')
      
      // Ricarica la lista degli utenti dopo l'aggiornamento
      await fetchUsers()
      setIsEditDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Errore durante l\'aggiornamento:', error)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestione Utenti</h1>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Nuovo Utente
        </button>
      </div>

      <UsersTable
        users={users}
        onEdit={(user) => {
          setSelectedUser(user)
          setIsEditDialogOpen(true)
        }}
        onAdd={() => setIsCreateDialogOpen(true)}
      />

      {isCreateDialogOpen && (
        <CreateUserDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onSave={handleCreateUser}
        />
      )}

      {isEditDialogOpen && selectedUser && (
        <EditUserDialog
          user={selectedUser}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false)
            setSelectedUser(null)
          }}
          onSave={handleEditUser}
        />
      )}
    </div>
  )
}
