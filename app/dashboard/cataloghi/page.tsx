'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PlusCircle, Pencil, Search, FileIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CatalogoForm } from './catalogo-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Image from 'next/image'
import { EditCatalogoDialog } from './edit-catalogo-dialog'
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import dynamic from 'next/dynamic'

const Select = dynamic(() => import('react-select'), {
  ssr: false,
  loading: () => null
})

interface Brand {
  id: string
  name: string
}

interface Catalogo {
  id: number
  codice: string
  nome: string | null
  brand_id: string
  tipo: string
  stagione: string
  anno: number
  data_consegna: string | null
  data_inizio_ordini: string | null
  data_fine_ordini: string | null
  note: string | null
  condizioni: string | null
  cover_url: string | null
  stato: 'bozza' | 'pubblicato' | 'archiviato'
}

export default function CataloghiPage() {
  const [cataloghi, setCataloghi] = useState<Catalogo[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCatalogo, setSelectedCatalogo] = useState<Catalogo | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedStati, setSelectedStati] = useState<string[]>([])
  const [filteredCataloghi, setFilteredCataloghi] = useState<Catalogo[]>([])
  const [isMounted, setIsMounted] = useState(false)

  const STATI_OPTIONS = [
    { value: 'bozza', label: 'Bozza' },
    { value: 'pubblicato', label: 'Pubblicato' },
    { value: 'archiviato', label: 'Archiviato' }
  ]

  const BRAND_OPTIONS = brands.map(brand => ({
    value: brand.id,
    label: brand.name
  }))

  useEffect(() => {
    const fetchData = async () => {
      try {
        const brandsResponse = await fetch('/api/admin/brands')
        const brandsData = await brandsResponse.json()
        setBrands(brandsData)

        const cataloghiResponse = await fetch('/api/admin/cataloghi')
        const cataloghiData = await cataloghiResponse.json()
        setCataloghi(cataloghiData)
        setFilteredCataloghi(cataloghiData)
      } catch (err) {
        console.error('Errore nel caricamento:', err)
        setError('Errore nel caricamento dei dati')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleCloseModal = () => {
    setSelectedCatalogo(null)
    setIsModalOpen(false)
  }

  const getStatoBadgeProps = (stato: string) => {
    switch (stato) {
      case 'pubblicato':
        return {
          variant: 'success' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-100/80'
        }
      case 'archiviato':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 hover:bg-red-100/80'
        }
      default:
        return {
          variant: 'default' as const,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80'
        }
    }
  }

  const fetchCataloghi = async () => {
    try {
      const response = await fetch('/api/admin/cataloghi')
      const data = await response.json()
      setCataloghi(data)
      setFilteredCataloghi(data)
    } catch (err) {
      console.error('Errore nel caricamento:', err)
      setError('Errore nel caricamento dei dati')
    }
  }



  useEffect(() => {
    let filtered = cataloghi

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(catalogo => 
        catalogo.codice.toLowerCase().includes(searchLower) ||
        catalogo.tipo.toLowerCase().includes(searchLower) ||
        catalogo.stagione.toLowerCase().includes(searchLower) ||
        catalogo.anno.toString().includes(searchLower) ||
        brands.find(b => b.id === catalogo.brand_id)?.name.toLowerCase().includes(searchLower)
      )
    }

    if (selectedBrands.length > 0) {
      filtered = filtered.filter(catalogo => 
        selectedBrands.includes(catalogo.brand_id)
      )
    }

    if (selectedStati.length > 0) {
      filtered = filtered.filter(catalogo => 
        selectedStati.includes(catalogo.stato)
      )
    }

    setFilteredCataloghi(filtered)
  }, [cataloghi, searchTerm, selectedBrands, selectedStati, brands])

  const handleEditClick = (catalogo: Catalogo) => {
    console.log('Catalogo selezionato per modifica:', catalogo)
    setSelectedCatalogo(catalogo)
    setIsEditDialogOpen(true)
  }

  if (loading) {
    return <div className="p-8">Caricamento...</div>
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cataloghi</h1>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedCatalogo(null)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuovo Catalogo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuovo Catalogo</DialogTitle>
            </DialogHeader>
            <CatalogoForm 
              brands={brands} 
              onClose={handleCloseModal}
            />
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow-sm mb-6">
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

        {isMounted && (
          <>
            <div className="min-w-[200px]">
              <Select
                isMulti
                options={BRAND_OPTIONS}
                placeholder="Seleziona brand"
                value={BRAND_OPTIONS.filter(option => 
                  selectedBrands.includes(option.value)
                )}
                onChange={(selectedOptions: any) => {
                  setSelectedBrands(
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
                options={STATI_OPTIONS}
                placeholder="Seleziona stati"
                value={STATI_OPTIONS.filter(option => 
                  selectedStati.includes(option.value)
                )}
                onChange={(selectedOptions: any) => {
                  setSelectedStati(
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Cover</TableHead>
              <TableHead>Codice</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Stagione</TableHead>
              <TableHead>Anno</TableHead>
              <TableHead>Consegna</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Data Creazione</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCataloghi.map((catalogo) => (
              <TableRow key={catalogo.id}>
                <TableCell>
                  {catalogo.cover_url ? (
                    <div className="relative w-[50px] h-[50px]">
                      <Image
                        src={catalogo.cover_url.replace('https://https://', 'https://')}
                        alt={`Cover ${catalogo.codice}`}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                  ) : (
                    <div className="w-[50px] h-[50px] bg-gray-100 rounded-md flex items-center justify-center">
                      <FileIcon className="text-gray-400 w-6 h-6" />
                    </div>
                  )}
                </TableCell>
                <TableCell>{catalogo.codice}</TableCell>
                <TableCell>
                  {brands.find(b => b.id === catalogo.brand_id)?.name}
                </TableCell>
                <TableCell>{catalogo.tipo}</TableCell>
                <TableCell>{catalogo.stagione}</TableCell>
                <TableCell>{catalogo.anno}</TableCell>
                <TableCell>{catalogo.data_consegna}</TableCell>
                <TableCell>
                  <Badge
                    {...getStatoBadgeProps(catalogo.stato)}
                  >
                    {catalogo.stato.charAt(0).toUpperCase() + catalogo.stato.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(catalogo.created_at).toLocaleDateString('it-IT')}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(catalogo)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedCatalogo && (
        <EditCatalogoDialog
          catalogo={selectedCatalogo}
          brands={brands}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false)
            setSelectedCatalogo(null)
          }}
          onUpdate={() => {
            fetchCataloghi()
            setIsEditDialogOpen(false)
            setSelectedCatalogo(null)
          }}
        />
      )}
    </div>
  )
} 