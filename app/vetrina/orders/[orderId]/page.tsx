'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import Image from 'next/image'
import { format } from 'date-fns'
import { Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { X } from 'lucide-react'
import { Save } from 'lucide-react'
import { CheckCircle } from 'lucide-react'

interface OrderDetails {
  id: number
  order_number: string
  order_type: string
  status: string
  created_at: string
  catalog: {
    id: number
    nome: string
    tipo: string
    stagione: string
    anno: number
    brand: {
      id: string
      name: string
      logo?: string
    }
  }
}

interface SizeQuantity {
  size_id: number
  size_name: string
  product_id: number
  quantity: number
}

interface OrderLine {
  article_code: string
  variant_code: string
  size_group_id: number | null
  size_group_name: string | null
  sizes_quantities: SizeQuantity[]
  price: number | null
  total_quantity?: number
  total_amount?: number
  available_sizes?: Array<{ id: number, name: string, product_id: number }>
  isFromDb?: boolean
}

interface SizeGroup {
  id: number
  name: string
  sizes: Array<{
    id: number
    name: string
  }>
}

interface Product {
  id: number
  article_code: string
  variant_code: string
  size_group_id: number | null
  brand_id: string | null
  wholesale_price: number
  retail_price: number | null
  sizes: Array<{
    id: number
    name: string
    product_id: number
  }>
}

export default function OrderPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [lines, setLines] = useState<OrderLine[]>([])
  const [sizeGroups, setSizeGroups] = useState<SizeGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>()
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null)
  const [activeField, setActiveField] = useState<'article' | 'variant' | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [shakeRowIndex, setShakeRowIndex] = useState<number | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Carica l'ordine dalla cache al mount
  useEffect(() => {
    const loadFromCache = async () => {
      if (!params.orderId) return;
      
      try {
        // Carica l'indice degli ordini modificati
        const ordersIndex = JSON.parse(localStorage.getItem('modified_orders_index') || '[]');
        
        // Se questo ordine è nell'indice, carica i suoi dati
        if (ordersIndex.includes(params.orderId)) {
          const cachedOrder = localStorage.getItem(`order_${params.orderId}`);
          if (cachedOrder) {
            const { lines: cachedLines, timestamp } = JSON.parse(cachedOrder);
            // Se la cache è più vecchia di 24 ore, la rimuoviamo
            if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
              setLines(cachedLines);
              setHasUnsavedChanges(true);
            } else {
              // Rimuovi l'ordine scaduto dall'indice e dalla cache
              removeFromCache(params.orderId);
            }
          }
        }
      } catch (error) {
        console.error('Errore nel caricamento della cache:', error);
      }
    };

    loadFromCache();
  }, [params.orderId]);

  // Salva in cache quando le righe cambiano
  useEffect(() => {
    if (!params.orderId || !lines.length) return;
    
    try {
      // Aggiorna l'indice degli ordini modificati
      const ordersIndex = JSON.parse(localStorage.getItem('modified_orders_index') || '[]');
      if (!ordersIndex.includes(params.orderId)) {
        ordersIndex.push(params.orderId);
        localStorage.setItem('modified_orders_index', JSON.stringify(ordersIndex));
      }
      
      // Salva i dati dell'ordine
      localStorage.setItem(`order_${params.orderId}`, JSON.stringify({
        lines,
        timestamp: Date.now()
      }));
      
      // Verifica le modifiche
      if (order?.lines) {
        const originalLines = order.lines;
        const hasChanges = lines.some((line, index) => {
          const originalLine = originalLines[index];
          if (!originalLine) {
            return line.article_code || line.variant_code || line.size_group_id || 
                   line.sizes_quantities.some(sq => sq.quantity > 0);
          }
          return line.article_code !== originalLine.article_code ||
                 line.variant_code !== originalLine.variant_code ||
                 line.size_group_id !== originalLine.size_group_id ||
                 line.price !== originalLine.price ||
                 JSON.stringify(line.sizes_quantities.filter(sq => sq.quantity > 0)) !== 
                 JSON.stringify(originalLine.sizes_quantities.filter(sq => sq.quantity > 0));
        }) || (lines.length < originalLines.length);
        
        setHasUnsavedChanges(hasChanges);
      } else {
        const hasChanges = lines.some(line => 
          line.article_code || line.variant_code || line.size_group_id || 
          line.sizes_quantities.some(sq => sq.quantity > 0)
        );
        setHasUnsavedChanges(hasChanges);
      }
    } catch (error) {
      console.error('Errore nel salvataggio della cache:', error);
    }
  }, [lines, order?.lines, params.orderId]);

  // Funzione per rimuovere un ordine dalla cache
  const removeFromCache = (orderId: string) => {
    try {
      // Rimuovi dall'indice
      const ordersIndex = JSON.parse(localStorage.getItem('modified_orders_index') || '[]');
      const updatedIndex = ordersIndex.filter(id => id !== orderId);
      localStorage.setItem('modified_orders_index', JSON.stringify(updatedIndex));
      
      // Rimuovi i dati dell'ordine
      localStorage.removeItem(`order_${orderId}`);
    } catch (error) {
      console.error('Errore nella rimozione dalla cache:', error);
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm('Ci sono modifiche non salvate. Sei sicuro di voler annullare?')) {
        // Reset delle righe all'ordine originale
        if (order?.lines) {
          setLines(order.lines.map(line => ({
            article_code: line.article_code,
            variant_code: line.variant_code,
            size_group_id: line.size_group_id,
            sizes_quantities: line.sizes_quantities || [],
            price: line.price,
            total_quantity: line.total_quantity,
            total_amount: line.total_amount
          })));
        } else {
          setLines([{ 
            article_code: '', 
            variant_code: '', 
            size_group_id: null,
            sizes_quantities: [],
            price: null
          }]);
        }
        // Rimuovi solo questo ordine dalla cache
        if (params.orderId) {
          removeFromCache(params.orderId);
        }
        setHasUnsavedChanges(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      if (!order?.catalog?.brand?.id) {
        toast.error('Brand non trovato');
        return;
      }

      // Array per tenere traccia di tutti i prodotti e quantità
      const orderProducts = [];

      // Per ogni riga dell'ordine
      for (const line of lines) {
        console.log('Processando riga:', line);
        
        // Salta righe senza dati essenziali
        if (!line.article_code?.trim() || !line.variant_code?.trim() || !line.size_group_id) {
          console.log('Riga saltata: dati mancanti', { 
            article_code: line.article_code, 
            variant_code: line.variant_code,
            size_group_id: line.size_group_id 
          });
          continue;
        }

        // Formatta il codice articolo
        const formattedArticleCode = line.article_code
          .replace(/[./'\\s]/g, '-')
          .replace(/-+/g, '-')
          .toUpperCase()
          .trim();

        // Crea un mapping delle quantità per taglia
        const sizeQuantityMap = line.sizes_quantities.reduce((acc, sq) => {
          acc[sq.size_id] = sq.quantity || 0;
          return acc;
        }, {});

        // Per ogni taglia disponibile nel gruppo taglie
        for (const size of line.available_sizes || []) {
          try {
            // Aggiungi all'array dei prodotti dell'ordine
            orderProducts.push({
              article_code: formattedArticleCode,
              variant_code: line.variant_code.trim(),
              size_id: size.id,
              size_group_id: line.size_group_id,
              brand_id: order.catalog.brand.id,
              quantity: sizeQuantityMap[size.id] || 0,
              price: parseFloat(line.price) || 0
            });
          } catch (error) {
            console.error('Errore nel processare il prodotto:', error);
            toast.error(`Errore nel processare ${formattedArticleCode} - ${line.variant_code}`);
          }
        }
      }

      console.log('Prodotti da salvare:', orderProducts);

      // Salva tutte le quantità in una volta sola
      if (orderProducts.length > 0) {
        try {
          const saveResponse = await fetch(`/api/orders/${params.orderId}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: orderProducts })
          });

          if (!saveResponse.ok) {
            const errorData = await saveResponse.json();
            throw new Error(errorData.error || 'Errore nel salvataggio dei prodotti');
          }

          const result = await saveResponse.json();
          console.log('Prodotti salvati:', result);

          // Ricarica i dati dell'ordine
          await loadOrderDetails();
          toast.success('Ordine salvato con successo');
        } catch (error) {
          console.error('Errore nel salvataggio:', error);
          toast.error(error instanceof Error ? error.message : 'Errore nel salvataggio dell\'ordine');
        }
      } else {
        toast.warning('Nessun prodotto valido da salvare');
      }

      // Rimuovi la cache
      if (params.orderId) {
        removeFromCache(params.orderId);
      }
      setHasUnsavedChanges(false);
      toast.success('Ordine salvato con successo');
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      toast.error(error instanceof Error ? error.message : 'Errore nel salvataggio dell\'ordine');
    }
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true)
      
      // Prima verifichiamo che orderId esista
      if (!params.orderId) {
        toast.error('ID ordine non valido')
        router.push('/vetrina/brands')
        return
      }

      try {
        // Fetch dell'ordine
        const orderRes = await fetch(`/api/orders/${params.orderId}`, { 
          credentials: 'include'
        })

        // Fetch dei gruppi taglie
        const sizeGroupsRes = await fetch('/api/size-groups', { 
          credentials: 'include'
        })

        // Verifica delle risposte
        if (!orderRes.ok) {
          const errorData = await orderRes.json()
          if (orderRes.status === 404) {
            toast.error(errorData.error || 'Ordine non trovato')
            router.push('/vetrina/brands')
            return
          }
          if (orderRes.status === 401) {
            toast.error('Sessione scaduta')
            router.push('/login')
            return
          }
          throw new Error(errorData.error || 'Errore nel caricamento dell\'ordine')
        }

        if (!sizeGroupsRes.ok) {
          const errorData = await sizeGroupsRes.json()
          throw new Error(errorData.error || 'Errore nel caricamento dei gruppi taglie')
        }

        // Attendiamo entrambe le risposte
        const [orderData, sizeGroupsData] = await Promise.all([
          orderRes.json(),
          sizeGroupsRes.json()
        ])

        // Verifichiamo che i dati siano nel formato corretto
        if (!orderData || !orderData.id || !orderData.order_number) {
          throw new Error('Dati ordine non validi')
        }

        setOrder(orderData)
        setSizeGroups(sizeGroupsData)

        // Carica i prodotti all'avvio
        const productsRes = await fetch(`/api/orders/${params.orderId}/products`)
        const productsData = await productsRes.json()
        
        console.log('Prodotti caricati:', productsData)
        
        if (productsData.lines) {
          // Per ogni riga, se ha un size_group_id, carica le taglie disponibili
          const linesWithSizes = await Promise.all(productsData.lines.map(async (line: OrderLine) => {
            if (line.size_group_id) {
              try {
                const sizeGroupRes = await fetch(`/api/size-groups/${line.size_group_id}`)
                const sizeGroupData = await sizeGroupRes.json()
                const sortedSizes = sortSizes(sizeGroupData.sizes || [])
                
                return {
                  ...line,
                  isFromDb: true,
                  size_group_name: sizeGroupData.name,
                  available_sizes: sortedSizes,
                  sizes_quantities: line.sizes_quantities.map(sq => ({
                    ...sq,
                    size_name: sortedSizes.find(s => s.id === sq.size_id)?.name || ''
                  }))
                }
              } catch (error) {
                console.error('Errore nel caricamento delle taglie per la riga:', error)
                return { ...line, isFromDb: true }
              }
            }
            return { ...line, isFromDb: true }
          }))
          
          console.log('Righe con taglie:', linesWithSizes)
          setLines(linesWithSizes)
        }

      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error)
        toast.error(error instanceof Error ? error.message : 'Errore nel caricamento dei dati')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [params.orderId, router])

  // Funzione per gestire il cambio del gruppo taglie
  const handleSizeGroupChange = async (rowIndex: number, value: string) => {
    const sizeGroupId = parseInt(value)
    
    // Controlla se ci sono quantità inserite
    const currentLine = lines[rowIndex];
    const hasQuantities = currentLine.sizes_quantities?.some(sq => sq.quantity > 0);

    if (hasQuantities && currentLine.size_group_id !== sizeGroupId) {
      if (!confirm('Cambiando gruppo taglie verranno azzerate tutte le quantità. Vuoi continuare?')) {
        return;
      }
    }
    
    try {
      const response = await fetch(`/api/size-groups/${sizeGroupId}`)
      if (!response.ok) {
        throw new Error('Errore nel caricamento delle taglie')
      }
      const data = await response.json()
      
      // Ordina le taglie
      const sortedSizes = sortSizes(data.sizes || []);

      // Inizializza le quantità per ogni taglia a 0
      const sizes_quantities = sortedSizes.map(size => ({
        size_id: size.id,
        size_name: size.name,
        product_id: size.product_id,
        quantity: 0
      }));

      // Aggiorna la riga con il nuovo gruppo taglie e le taglie disponibili
      setLines(prev => prev.map((line, i) => 
        i === rowIndex ? {
          ...line,
          size_group_id: sizeGroupId,
          size_group_name: data.name,
          sizes_quantities,
          available_sizes: sortedSizes,
          total_quantity: 0,
          total_amount: 0,
          isFromDb: false
        } : line
      ));
    } catch (error) {
      console.error('Errore nel caricamento delle taglie:', error)
      toast.error('Errore nel caricamento delle taglie')
    }
  }

  // Funzione per gestire il cambio di quantità per una taglia
  const handleQuantityChange = (rowIndex: number, sizeId: number, quantity: number, productId: number) => {
    setLines(prev => prev.map((line, i) => {
      if (i === rowIndex) {
        // Aggiorna la quantità per la taglia specifica
        const updatedSizesQuantities = line.sizes_quantities.map(sq =>
          sq.size_id === sizeId ? { ...sq, quantity, product_id: productId } : sq
        );

        // Calcola i nuovi totali
        const totalQuantity = updatedSizesQuantities.reduce((sum, sq) => sum + (sq.quantity || 0), 0);
        const totalAmount = totalQuantity * (line.price || 0);

        return {
          ...line,
          sizes_quantities: updatedSizesQuantities,
          total_quantity: totalQuantity,
          total_amount: totalAmount
        };
      }
      return line;
    }));
  }

  const handleLineChange = (rowIndex: number, field: keyof OrderLine, value: any) => {
    setLines(prev => prev.map((line, i) => {
      if (i !== rowIndex) return line

      const updatedLine = { ...line, [field]: value }

      // Se il campo modificato è il prezzo, ricalcola il total_amount
      if (field === 'price') {
        const totalQuantity = line.sizes_quantities.reduce((sum, sq) => sum + (sq.quantity || 0), 0);
        updatedLine.total_quantity = totalQuantity;
        updatedLine.total_amount = totalQuantity * (value || 0);
      }

      return updatedLine
    }))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number) => {
    if (activeRowIndex === rowIndex && searchResults.length > 0) {
      const filteredResults = searchResults.filter(product => !lines.some(
        line => line.article_code === product.article_code && line.variant_code === product.variant_code
      ));

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev < filteredResults.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < filteredResults.length) {
            handleProductSelect(rowIndex, filteredResults[selectedSuggestionIndex]);
          } else if (rowIndex === lines.length - 1) {
            handleAddLine();
          }
          break;
        case 'Escape':
          e.preventDefault();
          setActiveRowIndex(null);
          setActiveField(null);
          setSearchResults([]);
          setSelectedSuggestionIndex(-1);
          break;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (rowIndex === lines.length - 1) {
        handleAddLine();
      }
    }
  };

  // Resetta l'indice selezionato quando cambia il focus o i risultati
  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [activeRowIndex, activeField, searchResults]);

  const handleSaveLine = async (line: OrderLine, rowIndex: number) => {
    try {
      const response = await fetch(`/api/orders/${params.orderId}/lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(line)
      })

      if (!response.ok) throw new Error('Errore nel salvataggio')

      const savedLine = await response.json()
      
      // Aggiorna la riga con l'ID se è una nuova riga
      setLines(prev => prev.map((l, i) => 
        i === rowIndex ? { ...l, id: savedLine.id } : l
      ))

      toast.success('Riga salvata con successo')
    } catch (error) {
      console.error('Errore:', error)
      toast.error('Errore nel salvataggio della riga')
    }
  }

  // Funzione per cercare i prodotti
  const searchProducts = async (query: string) => {
    if (!order?.catalog?.brand?.id) {
      toast.error('Seleziona prima un catalogo')
      return
    }

    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&brand_id=${encodeURIComponent(order.catalog.brand.id)}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Errore nella ricerca')
      const data = await response.json()
      setSearchResults(data)
      setShowResults(true)
    } catch (error) {
      console.error('Errore nella ricerca prodotti:', error)
      toast.error('Errore nella ricerca prodotti')
    }
  }

  // Gestisce il cambio del codice articolo con debounce
  const handleArticleCodeChange = (rowIndex: number, value: string) => {
    setLines(prev => prev.map((line, i) => 
      i === rowIndex ? { ...line, article_code: value } : line
    ))

    // Aggiungi una nuova riga se è l'ultima e il valore non è vuoto
    if (rowIndex === lines.length - 1 && value.trim()) {
      addNewEmptyRow();
    }

    handleArticleSearch(rowIndex, value)
  }

  const handleArticleSearch = async (rowIndex: number, value: string) => {
    setActiveRowIndex(rowIndex)
    setActiveField('article')
    
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    if (value.length < 2 || !order?.catalog?.brand?.id) {
      setSearchResults([])
      return
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(value)}&brand_id=${encodeURIComponent(order.catalog.brand.id)}`)
        if (!response.ok) {
          throw new Error('Errore nella ricerca')
        }
        const data = await response.json()
        setSearchResults(data)
      } catch (error) {
        console.error('Errore nella ricerca:', error)
        toast.error('Errore nella ricerca dei prodotti')
      }
    }, 300)

    setSearchTimeout(timeout)
  }

  const handleVariantSearch = async (rowIndex: number, value: string) => {
    setActiveRowIndex(rowIndex)
    setActiveField('variant')
    
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    const line = lines[rowIndex]
    if (!line.article_code || value.length < 1 || !order?.catalog?.brand?.id) {
      setSearchResults([])
      return
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(line.article_code)}&brand_id=${encodeURIComponent(order.catalog.brand.id)}`)
        if (!response.ok) {
          throw new Error('Errore nella ricerca')
        }
        const data = await response.json()
        const filteredResults = data.filter(product => 
          product.variant_code.toLowerCase().includes(value.toLowerCase())
        )
        setSearchResults(filteredResults)
      } catch (error) {
        console.error('Errore nella ricerca:', error)
        toast.error('Errore nella ricerca dei prodotti')
      }
    }, 300)

    setSearchTimeout(timeout)
  }

  const handleVariantChange = (rowIndex: number, value: string) => {
    setLines(prev => prev.map((line, i) => 
      i === rowIndex ? {
        ...line,
        variant_code: value
      } : line
    ))
    handleVariantSearch(rowIndex, value)
  }

  const addNewEmptyRow = () => {
    setLines(prev => [...prev, { 
      article_code: '', 
      variant_code: '', 
      size_group_id: null,
      size_group_name: null,
      sizes_quantities: [],
      price: null,
      isFromDb: false
    }]);
  }

  const handleProductSelect = async (rowIndex: number, selectedProduct: Product) => {
    try {
      // Se il prodotto ha un gruppo taglie, caricalo
      if (selectedProduct.size_group_id) {
        const response = await fetch(`/api/size-groups/${selectedProduct.size_group_id}`)
        if (!response.ok) {
          throw new Error('Errore nel caricamento delle taglie')
        }
        const data = await response.json()
        const sortedSizes = sortSizes(data.sizes || []);

        // Aggiorna la riga con i dati del prodotto e le taglie
        setLines(prev => prev.map((line, i) => 
          i === rowIndex ? {
            ...line,
            isFromDb: true,
            article_code: selectedProduct.article_code,
            variant_code: selectedProduct.variant_code,
            price: selectedProduct.wholesale_price,
            size_group_id: selectedProduct.size_group_id,
            size_group_name: data.name,
            available_sizes: sortedSizes,
            sizes_quantities: sortedSizes.map((size: any) => ({
              size_id: size.id,
              size_name: size.name,
              product_id: size.product_id,
              quantity: 0
            }))
          } : line
        ))
      } else {
        // Se il prodotto non ha un gruppo taglie, aggiorna solo i dati base
        setLines(prev => prev.map((line, i) => 
          i === rowIndex ? {
            ...line,
            isFromDb: true,
            article_code: selectedProduct.article_code,
            variant_code: selectedProduct.variant_code,
            price: selectedProduct.wholesale_price,
            size_group_id: null,
            size_group_name: null,
            available_sizes: [],
            sizes_quantities: []
          } : line
        ))
      }

      // Resetta lo stato della ricerca
      setActiveRowIndex(null)
      setActiveField(null)
      setSearchResults([])
      setSelectedSuggestionIndex(-1)
    } catch (error) {
      console.error('Errore nella selezione del prodotto:', error)
      toast.error('Errore nel caricamento delle taglie')
    }
  }

  // Funzione per gestire il cambio del prezzo
  const handlePriceChange = (rowIndex: number, value: string) => {
    setLines(prev => prev.map((line, i) => {
      if (i === rowIndex) {
        return {
          ...line,
          price: value === '' ? null : parseFloat(value)
        }
      }
      return line
    }))
  }

  // Funzione per gestire il focus degli input
  const handleInputFocus = (rowIndex: number, field: 'article' | 'variant') => {
    setActiveRowIndex(rowIndex)
    setActiveField(field)
    
    // Calcola la posizione del dropdown
    const input = document.activeElement as HTMLElement;
    if (input) {
      const rect = input.getBoundingClientRect();
      document.documentElement.style.setProperty('--x', `${rect.left}px`);
      document.documentElement.style.setProperty('--y', `${rect.top}px`);
    }
  }

  // Funzione per gestire il cambio del codice variante
  const handleVariantCodeChange = (rowIndex: number, value: string) => {
    // Aggiorna il valore nel campo
    setLines(prev => prev.map((line, i) => 
      i === rowIndex ? {
        ...line,
        variant_code: value
      } : line
    ))
  }

  // Funzione per rimuovere una riga
  const handleRemoveLine = (rowIndex: number) => {
    const line = lines[rowIndex];
    const hasQuantities = line.sizes_quantities?.some(sq => sq.quantity > 0);

    if (hasQuantities) {
      const confirm = window.confirm('Ci sono delle quantità inserite. Sei sicuro di voler eliminare questa riga?');
      if (!confirm) return;
    }

    setLines(prev => prev.filter((_, i) => i !== rowIndex));
  };

  // Funzione di utility per l'ordinamento delle taglie
  const sortSizes = (sizes: any[]) => {
    // Ordine personalizzato per le taglie lettera
    const sizeOrder = {
      'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 
      'XXL': 6, 'XXXL': 7, 'XXXXL': 8
    };

    return [...sizes].sort((a, b) => {
      const aName = a.name.toUpperCase();
      const bName = b.name.toUpperCase();

      // Se entrambi sono nel sizeOrder
      if (sizeOrder[aName] && sizeOrder[bName]) {
        return sizeOrder[aName] - sizeOrder[bName];
      }

      // Se solo uno è nel sizeOrder, metti le taglie lettera prima
      if (sizeOrder[aName]) return -1;
      if (sizeOrder[bName]) return 1;

      // Se sono numeri, ordina numericamente
      const aNum = parseInt(aName);
      const bNum = parseInt(bName);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }

      // Altrimenti ordine alfabetico
      return aName.localeCompare(bName);
    });
  };

  // Funzione per calcolare il totale di una riga
  const calculateRowTotal = (line: OrderLine): number => {
    if (!line.price || !line.sizes_quantities) return 0;
    const totalQuantity = line.sizes_quantities.reduce((sum, sq) => sum + (sq.quantity || 0), 0);
    return totalQuantity * line.price;
  };

  // Funzione per ottenere la quantità di una taglia
  const getSizeQuantity = (line: OrderLine, sizeId: number): number => {
    return line.sizes_quantities.find(sq => sq.size_id === sizeId)?.quantity || 0;
  };

  // Funzione per evidenziare il testo cercato
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? <strong key={i}>{part}</strong> : part
    );
  };

  // Funzione per gestire la perdita del focus
  const handleBlur = () => {
    // Piccolo delay per permettere il click sul dropdown
    setTimeout(() => {
      setActiveRowIndex(null);
      setActiveField(null);
    }, 200);
  };

  // Funzione per calcolare il totale dell'ordine
  const calculateOrderTotal = () => {
    return lines.reduce((total, line) => total + calculateRowTotal(line), 0);
  };

  const handleAddLine = () => {
    // Se non ci sono righe o è la prima riga (indice 0), aggiungi sempre
    if (lines.length === 0) {
      setLines(prev => [...prev, { 
        article_code: '', 
        variant_code: '', 
        size_group_id: null,
        size_group_name: null,
        sizes_quantities: [],
        price: null,
        isFromDb: false
      }]);
      return;
    }

    // Dalla seconda riga in poi (indice >= 1), valida
    const lastLine = lines[lines.length - 1];
    if (!lastLine.article_code) {
      setShakeRowIndex(lines.length - 1);
      setTimeout(() => setShakeRowIndex(null), 500);
      return;
    }

    setLines(prev => [...prev, { 
      article_code: '', 
      variant_code: '', 
      size_group_id: null,
      size_group_name: null,
      sizes_quantities: [],
      price: null,
      isFromDb: false
    }]);
  };

  const loadOrderDetails = async () => {
    setLoading(true)
    
    // Prima verifichiamo che orderId esista
    if (!params.orderId) {
      toast.error('ID ordine non valido')
      router.push('/vetrina/brands')
      return
    }

    try {
      // Fetch dell'ordine
      const orderRes = await fetch(`/api/orders/${params.orderId}`, { 
        credentials: 'include'
      })

      // Fetch dei gruppi taglie
      const sizeGroupsRes = await fetch('/api/size-groups', { 
        credentials: 'include'
      })

      // Verifica delle risposte
      if (!orderRes.ok) {
        const errorData = await orderRes.json()
        if (orderRes.status === 404) {
          toast.error(errorData.error || 'Ordine non trovato')
          router.push('/vetrina/brands')
          return
        }
        if (orderRes.status === 401) {
          toast.error('Sessione scaduta')
          router.push('/login')
          return
        }
        throw new Error(errorData.error || 'Errore nel caricamento dell\'ordine')
      }

      if (!sizeGroupsRes.ok) {
        const errorData = await sizeGroupsRes.json()
        throw new Error(errorData.error || 'Errore nel caricamento dei gruppi taglie')
      }

      // Attendiamo entrambe le risposte
      const [orderData, sizeGroupsData] = await Promise.all([
        orderRes.json(),
        sizeGroupsRes.json()
      ])

      // Verifichiamo che i dati siano nel formato corretto
      if (!orderData || !orderData.id || !orderData.order_number) {
        throw new Error('Dati ordine non validi')
      }

      setOrder(orderData)
      setSizeGroups(sizeGroupsData)

      // Carica i prodotti all'avvio
      const productsRes = await fetch(`/api/orders/${params.orderId}/products`)
      const productsData = await productsRes.json()
      
      console.log('Prodotti caricati:', productsData)
      
      if (productsData.lines) {
        // Per ogni riga, se ha un size_group_id, carica le taglie disponibili
        const linesWithSizes = await Promise.all(productsData.lines.map(async (line: OrderLine) => {
          if (line.size_group_id) {
            try {
              const sizeGroupRes = await fetch(`/api/size-groups/${line.size_group_id}`)
              const sizeGroupData = await sizeGroupRes.json()
              const sortedSizes = sortSizes(sizeGroupData.sizes || [])
              
              return {
                ...line,
                isFromDb: true,
                size_group_name: sizeGroupData.name,
                available_sizes: sortedSizes,
                sizes_quantities: line.sizes_quantities.map(sq => ({
                  ...sq,
                  size_name: sortedSizes.find(s => s.id === sq.size_id)?.name || ''
                }))
              }
            } catch (error) {
              console.error('Errore nel caricamento delle taglie per la riga:', error)
              return { ...line, isFromDb: true }
            }
          }
          return { ...line, isFromDb: true }
        }))
        
        console.log('Righe con taglie:', linesWithSizes)
        setLines(linesWithSizes)
      }

    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error)
      toast.error(error instanceof Error ? error.message : 'Errore nel caricamento dei dati')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-4">
        <div className="space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto py-4">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Ordine non trovato</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 h-[calc(100vh-64px)] pt-16">
      <div className="flex flex-col h-full space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleNavigation('/vetrina/orders')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Ordini
              </Button>
              <h2 className="text-2xl font-bold tracking-tight">Ordine #{order.order_number}</h2>
            </div>
            <p className="text-muted-foreground md:ml-24">
              {order.catalog.brand.name} - {order.catalog.nome} ({order.catalog.stagione} {order.catalog.anno})
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={order.status === 'bozza' ? 'secondary' : 'default'}>
              {order.status === 'bozza' ? 'Bozza' : 'Inviato'}
            </Badge>
            <Badge variant="outline">
              {order.order_type === 'preorder' ? 'Pre-Order' : 'Pronta Consegna'}
            </Badge>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <Table className="border-collapse">
              <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                <TableRow className="border-b hover:bg-transparent">
                  <TableHead className="w-[200px]">Articolo</TableHead>
                  <TableHead>Variante</TableHead>
                  <TableHead>Gruppo Taglie</TableHead>
                  <TableHead>Taglie e Quantità</TableHead>
                  <TableHead className="w-[100px] text-right">Prezzo</TableHead>
                  <TableHead className="w-[100px] text-right">Totale</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="overflow-y-auto">
                {lines.map((line, rowIndex) => (
                  <TableRow 
                    key={rowIndex} 
                    className={`text-xs ${shakeRowIndex === rowIndex ? 'animate-shake' : ''}`}
                  >
                    <TableCell className="relative">
                      <div className="relative w-[225px]">
                        <Input
                          type="text"
                          value={line.article_code || ''}
                          onChange={(e) => handleArticleCodeChange(rowIndex, e.target.value)}
                          onFocus={() => handleInputFocus(rowIndex, 'article')}
                          onBlur={handleBlur}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex)}
                          placeholder="Articolo"
                          className={`w-full text-xs ${line.isFromDb ? 'bg-muted' : ''}`}
                          disabled={line.isFromDb}
                        />
                        {activeRowIndex === rowIndex && activeField === 'article' && searchResults.length > 0 && !line.isFromDb && (
                          <div className="fixed transform -translate-y-full" style={{ left: 'var(--x)', top: 'var(--y)', zIndex: 9999 }}>
                            <Card className="w-[300px] overflow-hidden p-2 shadow-lg">
                              <div className="space-y-1">
                                {searchResults
                                  .filter(product => !lines.some(
                                    line => line.article_code === product.article_code && line.variant_code === product.variant_code
                                  ))
                                  .map((product, index) => (
                                    <div
                                      key={`${product.article_code}-${product.variant_code}`}
                                      className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-sm text-xs ${
                                        index === selectedSuggestionIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
                                      }`}
                                      onClick={() => handleProductSelect(rowIndex, product)}
                                    >
                                      <span>{highlightText(product.article_code, line.article_code || '')} - {product.variant_code}</span>
                                      <span className="ml-auto">€ {product.wholesale_price}</span>
                                    </div>
                                  ))}
                              </div>
                            </Card>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="relative">
                      <Input
                        type="text"
                        value={line.variant_code || ''}
                        onChange={(e) => setLines(prev => prev.map((line, i) => 
                          i === rowIndex ? {
                            ...line,
                            variant_code: e.target.value
                          } : line
                        ))}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex)}
                        placeholder="Variante"
                        className={`w-full text-xs ${line.isFromDb ? 'bg-muted' : ''}`}
                        disabled={line.isFromDb}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={line.size_group_id?.toString() || ''}
                        onValueChange={(value) => handleSizeGroupChange(rowIndex, value)}
                        disabled={line.isFromDb}
                      >
                        <SelectTrigger className={`w-full text-xs ${line.isFromDb ? 'bg-muted' : ''}`}>
                          <SelectValue placeholder="Seleziona gruppo" />
                        </SelectTrigger>
                        <SelectContent>
                          {sizeGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id.toString()} className="text-xs">
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {line.size_group_id && line.available_sizes ? (
                        <div className="flex gap-2 items-end">
                          {line.available_sizes.map((size) => (
                            <div key={size.id} className="flex flex-col items-center min-w-[60px]">
                              <span className="text-xs mb-1">{size.name}</span>
                              <Input
                                type="number"
                                value={getSizeQuantity(line, size.id)}
                                onChange={(e) => handleQuantityChange(rowIndex, size.id, parseInt(e.target.value) || 0, size.product_id)}
                                className="w-[60px] text-xs text-center"
                                min="0"
                              />
                            </div>
                          ))}
                          <div className="flex flex-col items-center min-w-[60px] bg-muted rounded-sm">
                            <span className="text-xs mb-1">Tot.</span>
                            <div className="w-[60px] h-9 flex items-center justify-center text-xs font-medium">
                              {line.sizes_quantities.reduce((sum, sq) => sum + (sq.quantity || 0), 0)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {line.size_group_id ? 'Caricamento taglie...' : 'Seleziona prima un gruppo taglie'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={line.price || ''}
                        onChange={(e) => handlePriceChange(rowIndex, e.target.value)}
                        className="w-full text-xs text-right"
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      € {calculateRowTotal(line).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveLine(rowIndex)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="p-4 space-y-4">
            <Button
              onClick={handleAddLine}
              variant="outline"
              className="w-full"
            >
              + Aggiungi Prodotto
            </Button>
          </div>
        </div>
      </div>

      {/* Footer fisso con totali e pulsanti */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="container mx-auto p-4">
          <div className="flex items-center gap-4">
            <div className="text-xl font-semibold flex-shrink-0">
              Totale ordine: €{calculateOrderTotal().toFixed(2)}
            </div>
            {hasUnsavedChanges && (
              <div className="text-yellow-600 text-sm font-medium">
                Modifiche non salvate
              </div>
            )}
            <div className="flex-grow"></div>
            <Button 
              variant="ghost" 
              onClick={handleCancel}
              disabled={!hasUnsavedChanges}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Annulla
            </Button>
            <Button 
              variant="outline"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Salva per dopo
            </Button>
            <Button 
              variant="default"
              onClick={() => {
                // TODO: Implementare la conferma ordine
              }}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Conferma Ordine
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 