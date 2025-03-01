'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface ProductDialogProps {
  product?: any
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  refreshData: () => Promise<void>
  isGroupedView?: boolean
  isDuplicating?: boolean
}

// All'inizio del file, aggiungiamo l'enum per gli stati
const STATUS_OPTIONS = [
  { value: 'active', label: 'Attivo' },
  { value: 'inactive', label: 'Inattivo' }
] as const

export function ProductDialog({
  product,
  isOpen,
  onClose,
  onSave,
  refreshData,
  isGroupedView,
  isDuplicating
}: ProductDialogProps) {
  const [formData, setFormData] = useState({
    article_codes: [],
    variant_codes: [],
    size_ids: [],
    size_group_id: null as number | null,
    brand_id: '' as string,
    wholesale_price: '',
    retail_price: '',
    status: 'active' as 'active' | 'inactive'  // Tipizzazione corretta
  })
  const [variantInput, setVariantInput] = useState('')
  const [brands, setBrands] = useState([])
  const [sizeGroups, setSizeGroups] = useState([])
  const [availableSizes, setAvailableSizes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [articleInput, setArticleInput] = useState('')
  const [newSizeIds, setNewSizeIds] = useState<number[]>([])

  useEffect(() => {
    if (product?.id) {
      setFormData({
        article_codes: [product.article_code] || [],
        variant_codes: [product.variant_code] || [],
        size_ids: isGroupedView 
          ? (product.sizes?.map((s: any) => s.id) || [])
          : [product.size_id] || [],
        size_group_id: product.size_group_id || null,
        brand_id: product.brand_id || '',
        wholesale_price: product.wholesale_price?.toString() || '',
        retail_price: product.retail_price?.toString() || '',
        status: product.status || 'active'  // Usa lo stato del prodotto
      })
      setArticleInput(product.article_code || '')
      setVariantInput(product.variant_code || '')
    } else {
      setFormData({
        article_codes: [],
        variant_codes: [],
        size_ids: [],
        size_group_id: null,
        brand_id: '',
        wholesale_price: '',
        retail_price: '',
        status: 'active'
      })
      setArticleInput('')
      setVariantInput('')
    }
  }, [product, isGroupedView])

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Carica brands
        const brandsResponse = await fetch('/api/brands?limit=-1')
        const brandsData = await brandsResponse.json()
        setBrands(brandsData.data)

        // Carica size groups
        const sizeGroupsResponse = await fetch('/api/size-groups')
        const sizeGroupsData = await sizeGroupsResponse.json()
        setSizeGroups(sizeGroupsData)
      } catch (error) {
        console.error('Errore nel caricamento delle opzioni:', error)
        toast.error('Errore nel caricamento delle opzioni')
      }
    }

    fetchOptions()
  }, [])

  // Aggiungiamo una funzione di utility per l'ordinamento delle taglie
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

  // Aggiorna le taglie disponibili quando cambia il gruppo taglie
  useEffect(() => {
    const fetchSizes = async () => {
      if (!formData.size_group_id) {
        setAvailableSizes([])
        return
      }

      try {
        const response = await fetch(`/api/size-groups/${formData.size_group_id}`)
        const data = await response.json()
        // Ordiniamo le taglie prima di salvarle nello state
        setAvailableSizes(sortSizes(data.sizes || []))
      } catch (error) {
        console.error('Errore nel caricamento delle taglie:', error)
        toast.error('Errore nel caricamento delle taglie')
      }
    }

    fetchSizes()
  }, [formData.size_group_id])

  // Funzione per normalizzare i codici
  const normalizeCode = (code: string) => {
    return code.trim().toUpperCase().replace(/\s+/g, '')
  }

  // Modifica la gestione dell'input del codice articolo
  const handleArticleInput = (value: string) => {
    const normalizedValue = normalizeCode(value)
    setArticleInput(value) // Manteniamo il valore originale nell'input
    const articles = value
      .split(',')
      .map(v => normalizeCode(v))
      .filter(Boolean)
    
    setFormData(prev => ({
      ...prev,
      article_codes: articles
    }))
  }

  // Modifica la gestione dell'input del codice variante
  const handleVariantInput = (value: string) => {
    const normalizedValue = normalizeCode(value)
    setVariantInput(value) // Manteniamo il valore originale nell'input
    const variants = value
      .split(',')
      .map(v => normalizeCode(v))
      .filter(Boolean)
    
    setFormData(prev => ({
      ...prev,
      variant_codes: variants
    }))
  }

  // Modifica la gestione della selezione delle taglie
  const handleSizeSelection = (sizeId: string) => {
    const id = parseInt(sizeId)
    
    if (product?.id) {
      if (isGroupedView && !isDuplicating) {
        // In modalità modifica raggruppata
        const isExistingSize = product.sizes.some((s: any) => s.id === id)
        
        if (isExistingSize) {
          // Non permettiamo di deselezionare le taglie esistenti
          return
        } else {
          // Gestione delle nuove taglie
          if (newSizeIds.includes(id)) {
            setNewSizeIds(prev => prev.filter(sizeId => sizeId !== id))
            setFormData(prev => ({
              ...prev,
              size_ids: prev.size_ids.filter(sizeId => sizeId !== id)
            }))
          } else {
            setNewSizeIds(prev => [...prev, id])
            setFormData(prev => ({
              ...prev,
              size_ids: [...prev.size_ids, id]
            }))
          }
        }
      } else if (isDuplicating) {
        if (isGroupedView) {
          // In modalità duplicazione raggruppata - permetti selezione multipla
          setFormData(prev => ({
            ...prev,
            size_ids: prev.size_ids.includes(id)
              ? prev.size_ids.filter(s => s !== id)
              : [...prev.size_ids, id]
          }))
        } else {
          // In modalità duplicazione singola - permetti una sola taglia
          setFormData(prev => ({
            ...prev,
            size_ids: [id]
          }))
        }
      } else {
        // In modalità modifica singola
        setFormData(prev => ({
          ...prev,
          size_ids: [id]
        }))
      }
    } else {
      // In modalità creazione
      setFormData(prev => ({
        ...prev,
        size_ids: prev.size_ids.includes(id)
          ? prev.size_ids.filter(s => s !== id)
          : [...prev.size_ids, id]
      }))
    }
  }

  // Funzione di utilità per formattare il codice articolo
  const formatArticleCode = (code: string) => {
    return code
      .replace(/[./'\s]/g, '-')  // Sostituisce . / ' e spazi con -
      .replace(/-+/g, '-')       // Rimuove trattini multipli consecutivi
      .toUpperCase()             // Converte in maiuscolo
      .trim()                    // Rimuove spazi iniziali e finali
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isDuplicating) {
        if (isGroupedView) {
          // Duplicazione raggruppata - crea un prodotto per ogni taglia selezionata
          const productsToCreate = formData.size_ids.map(sizeId => ({
            article_code: formData.article_codes[0],
            variant_code: formData.variant_codes[0],
            size_id: sizeId,
            size_group_id: formData.size_group_id,
            brand_id: formData.brand_id,
            wholesale_price: Number(formData.wholesale_price),
            retail_price: formData.retail_price === '' ? null : Number(formData.retail_price),
            status: formData.status
          }))

          await fetch('/api/products/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: productsToCreate })
          })
        } else {
          // Duplicazione singola - crea un solo nuovo prodotto
          await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              article_code: formData.article_codes[0],
              variant_code: formData.variant_codes[0],
              size_id: formData.size_ids[0],
              size_group_id: formData.size_group_id,
              brand_id: formData.brand_id,
              wholesale_price: Number(formData.wholesale_price),
              retail_price: formData.retail_price === '' ? null : Number(formData.retail_price),
              status: formData.status
            })
          })
        }
      } else if (product?.id) {
        if (isGroupedView) {
          // Modalità modifica raggruppata
          const updateData = {
            article_code: formData.article_codes[0],
            variant_code: formData.variant_codes[0],
            brand_id: formData.brand_id,
            wholesale_price: Number(formData.wholesale_price),
            retail_price: formData.retail_price === '' ? null : Number(formData.retail_price),
            status: formData.status
          }

          await fetch(`/api/products/group-update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              article_code: product.article_code,
              variant_code: product.variant_code,
              size_group_id: product.size_group_id,
              brand_id: product.brand_id,
              updates: updateData
            })
          })

          // Gestione nuove taglie in modalità raggruppata
          if (newSizeIds.length > 0) {
            const newProducts = newSizeIds.map(sizeId => ({
              article_code: formData.article_codes[0],
              variant_code: formData.variant_codes[0],
              size_id: sizeId,
              size_group_id: product.size_group_id,
              brand_id: formData.brand_id,
              wholesale_price: Number(formData.wholesale_price),
              retail_price: formData.retail_price === '' ? null : Number(formData.retail_price),
              status: formData.status
            }))

            await fetch('/api/products/bulk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ products: newProducts })
            })
          }
        } else {
          // Modalità modifica singola - aggiorna il prodotto esistente
          await fetch(`/api/products/${product.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              article_code: formData.article_codes[0],
              variant_code: formData.variant_codes[0],
              size_id: formData.size_ids[0],  // Permette di cambiare la taglia
              size_group_id: formData.size_group_id,
              brand_id: formData.brand_id,
              wholesale_price: Number(formData.wholesale_price),
              retail_price: formData.retail_price === '' ? null : Number(formData.retail_price),
              status: formData.status
            })
          })
        }
      } else {
        // Creazione nuovo prodotto multiplo
        const productsToCreate = [];

        // Per ogni combinazione di codice articolo e variante
        for (const articleCode of formData.article_codes) {
          for (const variantCode of formData.variant_codes) {
            // Per ogni taglia selezionata
            for (const sizeId of formData.size_ids) {
              productsToCreate.push({
                article_code: articleCode,
                variant_code: variantCode,
                size_id: sizeId,
                size_group_id: formData.size_group_id,
                brand_id: formData.brand_id,
                wholesale_price: Number(formData.wholesale_price),
                retail_price: formData.retail_price === '' ? null : Number(formData.retail_price),
                status: formData.status
              });
            }
          }
        }

        // Verifica che ci siano prodotti da creare
        if (productsToCreate.length === 0) {
          throw new Error('Nessun prodotto da creare. Seleziona almeno un codice articolo, un codice variante e una taglia.');
        }

        // Invia la richiesta per creare i prodotti in bulk
        await fetch('/api/products/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: productsToCreate })
        });
      }

      await refreshData()
      onClose()
      toast.success('Prodotto salvato con successo')
    } catch (error) {
      console.error('Errore nel salvataggio:', error)
      toast.error('Errore nel salvataggio del prodotto')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isDuplicating 
              ? 'Duplica Prodotto' 
              : product?.id 
                ? 'Modifica Prodotto' 
                : 'Nuovo Prodotto Multiplo'
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="article_code">
              {product?.id ? 'Codice Articolo' : 'Codici Articolo (separati da virgola)'}
            </Label>
            <Input
              id="article_code"
              value={articleInput}
              onChange={(e) => {
                if (product?.id) {
                  const normalizedValue = normalizeCode(e.target.value)
                  setArticleInput(e.target.value)
                  setFormData(prev => ({
                    ...prev,
                    article_codes: [normalizedValue]
                  }))
                } else {
                  handleArticleInput(e.target.value)
                }
              }}
              onBlur={(e) => {
                // Normalizziamo il valore visualizzato quando l'input perde il focus
                const normalizedValue = normalizeCode(e.target.value)
                setArticleInput(product?.id ? normalizedValue : e.target.value)
              }}
              placeholder={product?.id ? "Inserisci codice articolo" : "es: ART1, ART2, ART3"}
              required
            />
            {!product?.id && formData.article_codes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.article_codes.map((code, index) => (
                  <Badge key={index} variant="secondary">
                    {code}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="variant_code">
              {product?.id ? 'Codice Variante' : 'Codici Variante (separati da virgola)'}
            </Label>
            <Input
              id="variant_code"
              value={variantInput}
              onChange={(e) => {
                if (product?.id) {
                  const normalizedValue = normalizeCode(e.target.value)
                  setVariantInput(e.target.value)
                  setFormData(prev => ({
                    ...prev,
                    variant_codes: [normalizedValue]
                  }))
                } else {
                  handleVariantInput(e.target.value)
                }
              }}
              onBlur={(e) => {
                // Normalizziamo il valore visualizzato quando l'input perde il focus
                const normalizedValue = normalizeCode(e.target.value)
                setVariantInput(product?.id ? normalizedValue : e.target.value)
              }}
              placeholder={product?.id ? "Inserisci codice variante" : "es: 001, 002, 003"}
              required
            />
            {!product?.id && formData.variant_codes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.variant_codes.map((code, index) => (
                  <Badge key={index} variant="secondary">
                    {code}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Brand</Label>
            <Select
              value={formData.brand_id || ""}
              onValueChange={(value) => {
                console.log('Brand selezionato:', value)
                setFormData(prev => ({
                  ...prev,
                  brand_id: value
                }))
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {brands.find((b: any) => b.id === formData.brand_id)?.name || "Seleziona brand"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand: any) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Gruppo Taglie</Label>
            <Select
              value={formData.size_group_id?.toString() || ""}
              onValueChange={(value) => {
                console.log('Gruppo taglie selezionato:', value)
                setFormData(prev => ({
                  ...prev,
                  size_group_id: Number(value),
                  size_ids: [] // Reset size when size group changes
                }))
              }}
              disabled={!!product?.id && isGroupedView}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {sizeGroups.find((g: any) => g.id === Number(formData.size_group_id))?.name || "Seleziona gruppo taglie"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sizeGroups.map((group: any) => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {product?.id && isGroupedView && (
              <p className="text-sm text-gray-500 mt-1">
                Il gruppo taglie non può essere modificato in vista raggruppata
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Taglie</Label>
            <div className="grid grid-cols-3 gap-2">
              {availableSizes.map((size: any) => (
                <Button
                  key={size.id}
                  type="button"
                  variant={formData.size_ids.includes(size.id) ? "default" : "outline"}
                  className={`w-full ${
                    product?.id && 
                    isGroupedView && 
                    !isDuplicating && 
                    product.sizes?.some((s: any) => s.id === size.id)
                      ? 'opacity-50'  // Stile per taglie esistenti in vista raggruppata
                      : newSizeIds.includes(size.id)
                      ? 'ring-2 ring-blue-500'  // Stile per nuove taglie
                      : ''
                  }`}
                  onClick={() => handleSizeSelection(size.id.toString())}
                  disabled={
                    !formData.size_group_id || 
                    (isGroupedView && 
                     product?.id && 
                     !isDuplicating && 
                     product.sizes?.some((s: any) => s.id === size.id))
                  }
                >
                  {size.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wholesale_price">Prezzo Ingrosso</Label>
              <Input
                id="wholesale_price"
                type="number"
                value={formData.wholesale_price}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  wholesale_price: e.target.value
                }))}
                required
                step="0.01"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retail_price">
                Prezzo Dettaglio
                <span className="text-gray-400 text-sm ml-1">(*)</span>
              </Label>
              <Input
                id="retail_price"
                type="number"
                value={formData.retail_price}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  retail_price: e.target.value === '' ? '' : e.target.value
                }))}
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Stato</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({
                ...prev,
                status: value
              }))}
            >
              <SelectTrigger>
                <SelectValue>
                  {STATUS_OPTIONS.find(option => option.value === formData.status)?.label || 'Seleziona stato'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={
                isLoading || 
                formData.variant_codes.length === 0 || 
                (product?.id ? false : formData.size_ids.length === 0)
              }
            >
              {isLoading ? 'Salvataggio...' : 'Salva'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 