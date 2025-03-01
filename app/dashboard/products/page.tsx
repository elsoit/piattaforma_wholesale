'use client'

import { useState, useEffect } from 'react'
import { ProductsTable } from '@/components/products/products-table'
import { ProductDialog } from '@/components/products/product-dialog'
import { BulkImportDialog } from '@/components/products/bulk-import-dialog'
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { toast } from 'sonner'

interface Product {
  id: number
  article_code: string
  variant_code: string
  size_id: number | null
  size_group_id: number | null
  brand_id: string
  brand_name: string
  size_name: string | null
  size_group_name: string | null
  wholesale_price: number
  retail_price: number
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data.data)
    } catch (error) {
      console.error('Errore nel caricamento prodotti:', error)
      toast.error('Errore nel caricamento dei prodotti')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleDelete = async (productId: number) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione')
      }

      toast.success('Prodotto eliminato con successo')
      await fetchProducts()
    } catch (error) {
      console.error('Errore eliminazione:', error)
      toast.error('Errore durante l\'eliminazione del prodotto')
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Gestione Prodotti
          </h1>
          <div className="space-x-2">
            <Button 
              onClick={() => setIsImportDialogOpen(true)}
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importazione Massiva
            </Button>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Visualizza e gestisci tutti i prodotti.
        </p>
      </div>
      
      <div className="space-y-4">
        <ProductsTable 
          products={products}
          isLoading={loading}
          onDelete={handleDelete}
          onRowClick={(product) => {
            setSelectedProduct(product)
            setIsDialogOpen(true)
          }}
          refreshData={fetchProducts}
        />
      </div>

      {isDialogOpen && (
        <ProductDialog
          product={selectedProduct}
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false)
            setSelectedProduct(null)
          }}
          onSave={async () => {
            await fetchProducts()
            setIsDialogOpen(false)
            setSelectedProduct(null)
          }}
        />
      )}

      <BulkImportDialog 
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        refreshData={fetchProducts}
      />
    </div>
  )
} 