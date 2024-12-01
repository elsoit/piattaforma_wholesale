'use client'

import { useRef, useState } from 'react'
import { Upload, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ImageUploadProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ImageUpload({
  value,
  onChange,
  disabled
}: ImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(value)

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsLoading(true)
      const file = e.target.files?.[0]
      if (!file) return

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Il file è troppo grande. Massimo 5MB.')
        return
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore nel caricamento')
      }

      onChange(data.url)
      setPreview(data.url)
      toast.success('Immagine caricata con successo')
    } catch (error) {
      console.error('Errore durante il caricamento:', error)
      toast.error('Errore durante il caricamento dell\'immagine')
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-[50px] h-[50px] rounded-md overflow-hidden border border-gray-200">
        {preview ? (
          // Usa img invece di Image per evitare problemi di idratazione
          <img
            src={preview}
            alt="Logo"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <ImageIcon className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onUpload}
        disabled={disabled || isLoading}
      />
      
      <Button
        type="button"
        variant="outline"
        disabled={disabled || isLoading}
        onClick={handleButtonClick}
      >
        {isLoading ? 'Caricamento...' : 'Carica logo'}
      </Button>
    </div>
  )
}