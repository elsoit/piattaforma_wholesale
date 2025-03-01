'use client'

import { useState, useEffect } from 'react'
import { SizeGroupDialog } from './size-group-dialog'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Size {
  id: number
  name: string
}

interface SizeGroup {
  id: number
  name: string
  description: string | null
  sizes: Size[]
}

export function SizeGroupsTable() {
  const [sizeGroups, setSizeGroups] = useState<SizeGroup[]>([])
  const [sizes, setSizes] = useState<Size[]>([])
  const [loading, setLoading] = useState(true)
  const [editingGroup, setEditingGroup] = useState<SizeGroup | null>(null)

  const fetchSizes = async () => {
    try {
      const response = await fetch('/api/sizes')
      const data = await response.json() as Size[]
      setSizes(data)
    } catch (error) {
      toast.error('Errore nel caricamento delle taglie')
    }
  }

  const fetchSizeGroups = async () => {
    try {
      const response = await fetch('/api/size-groups')
      const data = await response.json() as SizeGroup[]
      setSizeGroups(data)
    } catch (error) {
      toast.error('Errore nel caricamento dei gruppi taglie')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/size-groups/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json() as { error: string }
        throw new Error(data.error)
      }

      await fetchSizeGroups()
      toast.success('Gruppo taglie eliminato con successo')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore nell\'eliminazione del gruppo taglie')
    }
  }

  useEffect(() => {
    fetchSizes()
    fetchSizeGroups()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Gruppi Taglie</h2>
        <SizeGroupDialog 
          sizes={sizes} 
          onSave={fetchSizeGroups}
          editingGroup={editingGroup}
          onClose={() => setEditingGroup(null)}
        />
      </div>

      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-left">Descrizione</th>
              <th className="px-4 py-2 text-left">Taglie</th>
              <th className="px-4 py-2 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {sizeGroups.map((group) => (
              <tr key={group.id} className="border-b last:border-0">
                <td className="px-4 py-2">{group.name}</td>
                <td className="px-4 py-2">{group.description}</td>
                <td className="px-4 py-2">
                  {group.sizes.map(size => size.name).join(', ')}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingGroup(group)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                          <AlertDialogDescription>
                            Sei sicuro di voler eliminare questo gruppo taglie? L'azione non può essere annullata.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annulla</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(group.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Elimina
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 