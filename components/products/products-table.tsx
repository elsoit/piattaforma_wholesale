'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Search, Plus, Trash2, Copy, AlertCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProductDialog } from './product-dialog'
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Rinominiamo l'import di react-select per evitare conflitti
const ReactSelect = dynamic(() => import('react-select'), {
  ssr: false,
  loading: () => null
})

interface Product {
  id: number
  article_code: string
  variant_code: string
  brand_name: string
  size_name: string | null
  wholesale_price: number
  retail_price: number
  status: 'active' | 'inactive'
  size_group_id: number
  brand_id: number
}

interface ProductsTableProps {
  products: Product[]
  isLoading?: boolean
  onDelete: (id: number) => void
  onRowClick: (product: Product) => void
}

const VIEW_PREFERENCE_KEY = 'products-view-preference'

export function ProductsTable({ 
  products: initialProducts, 
  isLoading,
  onDelete, 
  onRowClick,
}: ProductsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [brandFilters, setBrandFilters] = useState<string[]>([])
  const [filteredProducts, setFilteredProducts] = useState(initialProducts)
  const [localProducts, setLocalProducts] = useState(initialProducts)
  const [isMounted, setIsMounted] = useState(false)
  const [pageSize, setPageSize] = useState<number>(30)
  const [currentPage, setCurrentPage] = useState(1)
  const [products, setProducts] = useState(initialProducts)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isGroupedView, setIsGroupedView] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [productToDelete, setProductToDelete] = useState<any>(null)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [productToDuplicate, setProductToDuplicate] = useState<any>(null)

  const STATUS_OPTIONS = [
    { value: 'active', label: 'Attivo' },
    { value: 'inactive', label: 'Inattivo' }
  ]

  // Crea opzioni uniche per i brand dai prodotti
  const BRAND_OPTIONS = Array.from(new Set(products.map(p => p.brand_name)))
    .map(brand => ({
      value: brand,
      label: brand
    }))

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilters.length && { status: statusFilters.join(',') }),
        ...(brandFilters.length && { brand: brandFilters.join(',') })
      })

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()

      setProducts(data.data)
      setTotal(data.pagination.total)
      setTotalPages(data.pagination.totalPages)
      setFilteredProducts(data.data)
    } catch (error) {
      console.error('Errore nel caricamento dei prodotti:', error)
      toast.error('Errore nel caricamento dei prodotti')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [currentPage, pageSize, searchTerm, statusFilters, brandFilters])

  useEffect(() => {
    const savedPreference = localStorage.getItem(VIEW_PREFERENCE_KEY)
    if (savedPreference) {
      setIsGroupedView(savedPreference === 'true')
    }
    setIsMounted(true)
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  // Funzione per gestire il click sulla riga
  const handleRowClick = (product: Product) => {
    setSelectedProduct(product)
    setIsDialogOpen(true)
  }

  // Aggiungiamo la funzione di ordinamento taglie
  const sortSizes = (sizes: any[]) => {
    // Ordine personalizzato per le taglie lettera
    const sizeOrder = {
      'XXXS': 1, 'XXS': 2, 'XS': 3, 'S': 4, 'M': 5, 'L': 6, 
      'XL': 7, 'XXL': 8, 'XXXL': 9, 'XXXXL': 10
    }

    return [...sizes].sort((a, b) => {
      const aName = a.name.toUpperCase()
      const bName = b.name.toUpperCase()

      // Se entrambi sono numeri
      if (!isNaN(aName) && !isNaN(bName)) {
        return Number(aName) - Number(bName)
      }

      // Se entrambi sono taglie lettera conosciute
      if (sizeOrder[aName] && sizeOrder[bName]) {
        return sizeOrder[aName] - sizeOrder[bName]
      }

      // Se solo uno è un numero, metti i numeri prima
      if (!isNaN(aName)) return -1
      if (!isNaN(bName)) return 1

      // Per qualsiasi altra stringa, usa l'ordine alfabetico
      return aName.localeCompare(bName)
    })
  }

  const groupProducts = (products: any[]) => {
    const groups = new Map()

    products.forEach(product => {
      // Includiamo lo stato nella chiave di raggruppamento
      const key = `${product.article_code}-${product.variant_code}-${product.brand_id}-${product.size_group_id}-${product.status}-${product.wholesale_price}-${product.retail_price}`

      if (!groups.has(key)) {
        groups.set(key, {
          ...product,
          // Creiamo un ID univoco per il gruppo usando un timestamp e un numero random
          groupId: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sizes: [{ id: product.size_id, name: product.size_name }],
          isGrouped: true
        })
      } else {
        const group = groups.get(key)
        group.sizes.push({ id: product.size_id, name: product.size_name })
      }
    })

    return Array.from(groups.values())
  }

  // Prodotti da visualizzare in base alla vista selezionata
  const displayedProducts = isGroupedView ? groupProducts(products) : products

  // Funzione per verificare se i prodotti sono in ordini
  const checkProductsInOrders = async (productIds: number[]) => {
    try {
      const response = await fetch('/api/products/check-in-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds })
      })

      if (!response.ok) {
        throw new Error('Errore durante il controllo dei prodotti negli ordini')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Errore:', error)
      throw error
    }
  }

  // Funzione per gestire la cancellazione
  const handleDelete = async (product: any) => {
    try {
      if (isGroupedView) {
        // Ottieni prima tutti i prodotti del gruppo
        const response = await fetch('/api/products/by-group', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            article_code: product.article_code,
            variant_code: product.variant_code,
            size_group_id: product.size_group_id,
            brand_id: product.brand_id,
            status: product.status
          })
        })

        if (!response.ok) {
          throw new Error('Errore nel recupero dei prodotti del gruppo')
        }

        const groupProducts = await response.json()
        const productIds = groupProducts.map((p: any) => p.id)

        // Verifica se qualche prodotto è presente negli ordini
        const orderCheck = await checkProductsInOrders(productIds)
        
        if (!orderCheck.canDelete) {
          toast.error('Non è possibile eliminare questi prodotti perché sono presenti in uno o più ordini')
          return
        }

        // Procedi con l'eliminazione del gruppo
        const deleteResponse = await fetch('/api/products/group-delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            article_code: product.article_code,
            variant_code: product.variant_code,
            size_group_id: product.size_group_id,
            brand_id: product.brand_id,
            status: product.status
          })
        })

        if (!deleteResponse.ok) {
          const error = await deleteResponse.json()
          throw new Error(error.message || 'Errore nella cancellazione del gruppo')
        }
        
        const result = await deleteResponse.json()
        toast.success(`${result.deletedCount} prodotti eliminati con successo`)
      } else {
        // Verifica se il prodotto singolo è presente negli ordini
        const orderCheck = await checkProductsInOrders([product.id])
        
        if (!orderCheck.canDelete) {
          toast.error('Non è possibile eliminare questo prodotto perché è presente in uno o più ordini')
          return
        }

        // Procedi con l'eliminazione del singolo prodotto
        const deleteResponse = await fetch(`/api/products/${product.id}`, {
          method: 'DELETE'
        })

        if (!deleteResponse.ok) {
          const error = await deleteResponse.json()
          throw new Error(error.message || 'Errore nella cancellazione')
        }
        toast.success('Prodotto eliminato con successo')
      }

      // Aggiorniamo i dati dopo la cancellazione
      await fetchProducts()
    } catch (error) {
      console.error('Errore:', error)
      toast.error(error instanceof Error ? error.message : 'Errore durante la cancellazione')
    }
  }

  // Funzione per gestire la duplicazione
  const handleDuplicate = (product: any) => {
    setProductToDuplicate(product)
    setIsDuplicating(true)
    setIsDialogOpen(true)
  }

  // Aggiorniamo localStorage quando cambia la vista
  const handleViewChange = (value: boolean) => {
    setIsGroupedView(value)
    localStorage.setItem(VIEW_PREFERENCE_KEY, value.toString())
  }

  return (
    <div className="space-y-4">
      {/* Barra di ricerca e filtri */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-1 flex-wrap gap-4 items-center">
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

          {/* Multiselect per Stato e Brand */}
          {isMounted && (
            <>
              <div className="min-w-[200px]">
                <ReactSelect
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
                <ReactSelect
                  isMulti
                  options={BRAND_OPTIONS}
                  placeholder="Seleziona brand"
                  value={BRAND_OPTIONS.filter(option => 
                    brandFilters.includes(option.value)
                  )}
                  onChange={(selectedOptions: any) => {
                    setBrandFilters(
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

        {/* Modifica il pulsante Nuovo Prodotto */}
        <Button 
          onClick={() => {
            setSelectedProduct(null)  // Reset del prodotto selezionato
            setProductToDuplicate(null)  // Reset del prodotto da duplicare
            setIsDuplicating(false)  // Reset dello stato di duplicazione
            setIsDialogOpen(true)
          }}
          className="whitespace-nowrap"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Prodotto
        </Button>
      </div>

      {/* Aggiungi lo switch sopra la tabella */}
      <div className="flex items-center justify-end space-x-2 bg-white p-4 rounded-lg">
        <span className="text-sm text-gray-700">Vista Raggruppata</span>
        {isMounted && (
          <Switch
            checked={isGroupedView}
            onCheckedChange={handleViewChange}
          />
        )}
      </div>

      {/* Tabella */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Codice Articolo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Codice Variante
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Taglie
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prezzo Ingrosso
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prezzo Dettaglio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayedProducts.map((product: any, index: number) => (
              <tr 
                key={isGroupedView ? product.groupId : product.id}
                onClick={() => handleRowClick(product)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.article_code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.variant_code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.brand_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {isGroupedView ? (
                    <div className="flex flex-wrap gap-1">
                      {product.sizes.map((size: any) => (
                        <span
                          key={size.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {size.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    product.size_name || '-'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatPrice(product.wholesale_price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatPrice(product.retail_price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    product.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.status === 'active' ? 'Attivo' : 'Inattivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation() // Previene l'apertura del dialog di modifica
                      handleDuplicate(product)
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setProductToDelete(product)
                      setShowDeleteDialog(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer con paginazione e selettore righe */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Mostrati {products.length} di {total} prodotti
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Righe per pagina:</span>
            <Select
              defaultValue="30"
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(parseInt(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="60">60</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="-1">Tutti</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Precedente
          </Button>
          <span className="text-sm text-gray-600">
            Pagina {currentPage} di {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Successivo
          </Button>
        </div>
      </div>

      {/* Dialog di conferma eliminazione */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {isGroupedView ? (
                <div className="space-y-4">
                  <div>Stai per eliminare i seguenti prodotti:</div>
                  <div className="bg-gray-50 p-4 rounded-md space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Codice Articolo:</span>
                        <span className="block">{productToDelete?.article_code}</span>
                      </div>
                      <div>
                        <span className="font-medium">Codice Variante:</span>
                        <span className="block">{productToDelete?.variant_code}</span>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Brand:</span>
                      <span className="block">{productToDelete?.brand_name}</span>
                    </div>
                    <div>
                      <span className="font-medium">Taglie da eliminare:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {productToDelete?.sizes?.map((size: any) => (
                          <span
                            key={size.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"
                          >
                            {size.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-red-600 font-medium">
                    Questa azione eliminerà {productToDelete?.sizes?.length} prodotti e non può essere annullata.
                  </div>
                </div>
              ) : (
                <div>Sei sicuro di voler eliminare questo prodotto?</div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleDelete(productToDelete)
                setShowDeleteDialog(false)
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              {isGroupedView ? `Elimina ${productToDelete?.sizes?.length} prodotti` : 'Elimina'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ProductDialog modificato per la duplicazione */}
      <ProductDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setSelectedProduct(null)
          setProductToDuplicate(null)
          setIsDuplicating(false)
        }}
        onSave={() => {}}
        refreshData={fetchProducts}
        product={isDuplicating ? productToDuplicate : selectedProduct}
        isGroupedView={isGroupedView}
        isDuplicating={isDuplicating}
      />
    </div>
  )
} 