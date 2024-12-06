'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PlusIcon, Pencil, Trash2, ImageIcon, Search } from 'lucide-react'
import { Brand } from '@/types/brand'
import { BrandDialog } from './brand-dialog'
import { Input } from "@/components/ui/input"

export function BrandsTable() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands
    
    const query = searchQuery.toLowerCase()
    return brands.filter(brand => 
      brand.name?.toLowerCase().includes(query) ||
      brand.description?.toLowerCase().includes(query)
    )
  }, [brands, searchQuery])

  const fetchBrands = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/brands?limit=-1')
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento')
      }

      const { data } = await response.json()
      
      setBrands(Array.isArray(data) ? data : [])
      
    } catch (error) {
      console.error('Errore nel caricamento dei brands:', error)
      toast.error('Errore nel caricamento dei brands')
      setBrands([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo brand?')) return

    try {
      const response = await fetch(`/api/brands/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore nella cancellazione')
      }

      toast.success('Brand eliminato con successo')
      await fetchBrands()
    } catch (error) {
      console.error('Errore durante l\'eliminazione:', error)
      toast.error('Errore durante l\'eliminazione del brand')
    }
  }

  const handleSave = async (brandData: Partial<Brand>) => {
    try {
      const isEditing = !!selectedBrand
      const url = isEditing ? `/api/brands/${selectedBrand.id}` : '/api/brands'
      const method = isEditing ? 'PUT' : 'POST'

      let finalBrandData = { ...brandData }
      
      if (brandData.logo && brandData.logo.startsWith('http')) {
        try {
          const response = await fetch('/api/brands/download-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageUrl: brandData.logo })
          })

          if (!response.ok) {
            throw new Error('Errore nel download dell\'immagine')
          }

          const { fileUrl } = await response.json()
          finalBrandData.logo = fileUrl
        } catch (error) {
          toast.error('Errore nel download dell\'immagine')
          return
        }
      }

      if (finalBrandData.name) {
        finalBrandData.name = finalBrandData.name.trim()
      }
      if (finalBrandData.description) {
        finalBrandData.description = finalBrandData.description.trim()
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...finalBrandData,
          id: selectedBrand?.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400) {
          toast.error(data.error || 'Nome brand duplicato', {
            duration: 4000,
            position: 'top-center',
          })
          return
        }
        throw new Error(data.error || 'Errore nel salvataggio')
      }

      await fetchBrands()
      setIsDialogOpen(false)
      toast.success(isEditing ? 'Brand aggiornato' : 'Brand creato')
    } catch (error) {
      console.error('Errore durante il salvataggio:', error)
      toast.error(error instanceof Error ? error.message : 'Errore durante il salvataggio')
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-4">Caricamento...</div>
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Brands</h2>
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cerca brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            onClick={() => {
              setSelectedBrand(null)
              setIsDialogOpen(true)
            }}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuovo Brand
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>Logo</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead className="w-[100px]">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="overflow-auto">
            {!filteredBrands || filteredBrands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  {brands.length === 0 ? 'Nessun brand trovato' : 'Nessun risultato per la ricerca'}
                </TableCell>
              </TableRow>
            ) : (
              filteredBrands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    <div className="relative w-[50px] h-[50px] rounded-md overflow-hidden border border-gray-200">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name?.replace(/'/g, "'")}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                          <ImageIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{brand.name?.replace(/'/g, "'")}</TableCell>
                  <TableCell>{brand.description?.replace(/'/g, "'")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedBrand(brand)
                          setIsDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(brand.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <BrandDialog
        brand={selectedBrand}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}