'use client'

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Brand } from '@/types/brand'
import { ImageUpload } from '@/components/ui/image-upload'

interface BrandDialogProps {
  brand: Brand | null
  isOpen: boolean
  onClose: () => void
  onSave: (brand: Brand) => Promise<void>
}

export function BrandDialog({ brand, isOpen, onClose, onSave }: BrandDialogProps) {
  const [formData, setFormData] = useState<Partial<Brand>>({
    name: '',
    description: '',
    logo: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name,
        description: brand.description || '',
        logo: brand.logo || ''
      })
    } else {
      setFormData({
        name: '',
        description: '',
        logo: ''
      })
    }
  }, [brand])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSave({
        id: brand?.id || '',
        ...formData,
        created_at: brand?.created_at || new Date(),
        updated_at: new Date()
      } as Brand)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {brand ? 'Modifica Brand' : 'Nuovo Brand'}
          </DialogTitle>
          <DialogDescription>
            {brand ? 'Modifica i dettagli del brand' : 'Inserisci i dettagli del nuovo brand'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Logo
            </label>
            <ImageUpload
              value={formData.logo || ''}
              onChange={(url) => setFormData({ ...formData, logo: url })}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nome
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descrizione
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3">
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
      </DialogContent>
    </Dialog>
  )
}