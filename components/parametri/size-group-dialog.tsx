'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, Pencil } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"

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

interface SizeGroupDialogProps {
  sizes: Size[]
  onSave: () => void
  editingGroup?: SizeGroup | null
  onClose: () => void
}

export function SizeGroupDialog({ sizes, onSave, editingGroup, onClose }: SizeGroupDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedSizes, setSelectedSizes] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editingGroup) {
      setOpen(true)
      setName(editingGroup.name)
      setDescription(editingGroup.description || '')
      setSelectedSizes(editingGroup.sizes.map((s: Size) => s.id))
    }
  }, [editingGroup])

  const handleClose = () => {
    setOpen(false)
    setName('')
    setDescription('')
    setSelectedSizes([])
    onClose()
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        editingGroup 
          ? `/api/size-groups/${editingGroup.id}`
          : '/api/size-groups',
        {
          method: editingGroup ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description,
            sizes: selectedSizes
          })
        }
      )

      if (!response.ok) {
        const data = await response.json() as { error: string }
        throw new Error(data.error)
      }

      toast.success(
        editingGroup 
          ? 'Gruppo taglie modificato con successo'
          : 'Gruppo taglie creato con successo'
      )
      handleClose()
      onSave()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore nel salvataggio del gruppo taglie')
    } finally {
      setLoading(false)
    }
  }

  const toggleSize = (sizeId: number) => {
    setSelectedSizes(current => 
      current.includes(sizeId)
        ? current.filter(id => id !== sizeId)
        : [...current, sizeId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!editingGroup ? (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Gruppo
          </Button>
        </DialogTrigger>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingGroup ? 'Modifica Gruppo Taglie' : 'Nuovo Gruppo Taglie'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label>Nome</label>
            <Input
              placeholder="Nome del gruppo..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label>Descrizione</label>
            <Textarea
              placeholder="Descrizione del gruppo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label>Taglie</label>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              <div className="space-y-4">
                {sizes.map((size) => (
                  <div key={size.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`size-${size.id}`}
                      checked={selectedSizes.includes(size.id)}
                      onCheckedChange={() => toggleSize(size.id)}
                    />
                    <label
                      htmlFor={`size-${size.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {size.name}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || loading}
            >
              {loading ? 'Salvataggio...' : 'Salva'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 