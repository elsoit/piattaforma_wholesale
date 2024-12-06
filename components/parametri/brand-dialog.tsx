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
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface BrandDialogProps {
  brand: Brand | null
  isOpen: boolean
  onClose: () => void
  onSave: (brand: Partial<Brand>) => Promise<void>
}

export function BrandDialog({ brand, isOpen, onClose, onSave }: BrandDialogProps) {
  const [formData, setFormData] = useState<Partial<Brand>>({
    name: '',
    description: '',
    logo: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string>('')

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

  const handlePreviewImage = () => {
    if (imageUrl) {
      setPreviewUrl(imageUrl)
      setFormData(prev => ({ ...prev, logo: imageUrl }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Errore durante il salvataggio:', error)
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
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Inserisci URL immagine"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <Button 
                  type="button"
                  variant="secondary"
                  onClick={handlePreviewImage}
                  disabled={!imageUrl}
                >
                  Anteprima
                </Button>
              </div>

              {previewUrl && (
                <div className="relative w-full h-40 border rounded-md overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Anteprima logo"
                    className="w-full h-full object-contain"
                    onError={() => {
                      setPreviewUrl('')
                      toast.error('Errore nel caricamento dell\'immagine')
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setPreviewUrl('')
                      setImageUrl('')
                      setFormData(prev => ({ ...prev, logo: '' }))
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="text-center text-sm text-muted-foreground">
                oppure
              </div>

              <ImageUpload
                value={formData.logo || ''}
                onChange={(url) => {
                  setFormData(prev => ({ ...prev, logo: url }))
                  setPreviewUrl('')
                  setImageUrl('')
                }}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nome
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={isLoading}
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