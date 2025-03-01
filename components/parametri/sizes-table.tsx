'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Pencil, Plus, Save, X, Trash2 } from 'lucide-react'
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

export function SizesTable() {
  const [sizes, setSizes] = useState<Size[]>([])
  const [loading, setLoading] = useState(true)
  const [newSize, setNewSize] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  const fetchSizes = async () => {
    try {
      const response = await fetch('/api/sizes')
      const data = await response.json() as Size[]
      setSizes(data)
    } catch (error) {
      toast.error('Errore nel caricamento delle taglie')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSizes()
  }, [])

  const handleAdd = async () => {
    try {
      // Dividi la stringa in un array di taglie, rimuovi gli spazi e unisci le parti
      const sizeNames = newSize
        .split(',')
        .map(size => size.trim().replace(/\s+/g, '')) // Rimuove tutti gli spazi
        .filter(size => size.length > 0) // Rimuovi elementi vuoti

      if (sizeNames.length === 0) return

      // Crea un array di promesse per ogni taglia
      const promises = sizeNames.map(name =>
        fetch('/api/sizes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        })
      )

      // Esegui tutte le richieste in parallelo
      const responses = await Promise.all(promises)
      
      // Controlla gli errori e raccoglie i messaggi
      const results = await Promise.all(
        responses.map(async (response, index) => {
          const data = await response.json() as { error?: string }
          return {
            name: sizeNames[index],
            success: response.ok,
            error: !response.ok ? data.error : null
          }
        })
      )

      // Gestisci i risultati
      const successes = results.filter(r => r.success)
      const failures = results.filter(r => !r.success)

      if (successes.length > 0) {
        toast.success(`${successes.length} ${successes.length === 1 ? 'taglia aggiunta' : 'taglie aggiunte'} con successo`)
      }

      if (failures.length > 0) {
        failures.forEach(failure => {
          // Usa l'errore specifico restituito dal server
          toast.error(failure.error || `Errore per la taglia "${failure.name}"`)
        })
      }

      await fetchSizes()
      setNewSize('')
    } catch (error) {
      toast.error('Errore nell\'aggiunta delle taglie')
    }
  }

  const handleEdit = async (id: number) => {
    try {
      const response = await fetch(`/api/sizes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: editName.trim().replace(/\s+/g, '') // Rimuove tutti gli spazi anche in modifica
        })
      })

      const data = await response.json() as { error?: string }

      if (!response.ok) {
        // Usa l'errore specifico restituito dal server
        throw new Error(data.error || 'Errore nella modifica della taglia')
      }

      await fetchSizes()
      setEditingId(null)
      setEditName('')
      toast.success('Taglia modificata con successo')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore nella modifica della taglia')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/sizes/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json() as { error?: string }

      if (!response.ok) {
        // Usa l'errore specifico restituito dal server
        throw new Error(data.error || 'Errore nell\'eliminazione della taglia')
      }

      await fetchSizes()
      toast.success('Taglia eliminata con successo')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore nell\'eliminazione della taglia')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Inserisci le taglie separate da virgola (es: S, M, L, XL)..."
          value={newSize}
          onChange={(e) => setNewSize(e.target.value)}
        />
        <Button onClick={handleAdd} disabled={!newSize.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi
        </Button>
      </div>

      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {sizes.map((size) => (
              <tr key={size.id} className="border-b last:border-0">
                <td className="px-4 py-2">
                  {editingId === size.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="max-w-[200px]"
                    />
                  ) : (
                    size.name
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  {editingId === size.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEdit(size.id)}
                        disabled={!editName.trim()}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(null)
                          setEditName('')
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(size.id)
                          setEditName(size.name)
                        }}
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
                              Sei sicuro di voler eliminare questa taglia? L'azione non può essere annullata.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(size.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Elimina
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 