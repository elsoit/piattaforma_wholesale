'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface Brand {
  id: string
  name: string
  description?: string
  logo?: string
  created_at?: string
  updated_at?: string
}

export default function BrandsPage() {
  const router = useRouter()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch('/api/vetrina/brands')
        if (!response.ok) {
          throw new Error('Errore nel recupero dei brand')
        }
        const data = await response.json()
        console.log('Brand ricevuti:', data)

        if (Array.isArray(data)) {
          setBrands(data)
        } else {
          throw new Error('I dati ricevuti non sono un array')
        }
      } catch (err) {
        console.error('Errore:', err)
        setError(err instanceof Error ? err.message : 'Errore sconosciuto')
      } finally {
        setLoading(false)
      }
    }

    if (mounted) {
      fetchBrands()
    }
  }, [mounted])

  // Non renderizzare nulla finché il componente non è montato
  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-6">
                <Skeleton className="h-24 sm:h-32 w-full mb-3 sm:mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (brands.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Alert>
          <AlertDescription>
            Non ci sono brand associati al tuo account.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleBrandClick = (brandId: string) => {
    router.push(`/vetrina/brands/${brandId}`)
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        I Tuoi Brand
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {brands.map((brand) => (
          <Card 
            key={brand.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleBrandClick(brand.id)}
          >
            <CardContent className="p-4 sm:p-6">
              {brand.logo && (
                <div className="mb-3 sm:mb-4 h-24 sm:h-32 flex items-center justify-center">
                  <img
                    src={brand.logo}
                    alt={`Logo ${brand.name}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
              <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">
                {brand.name}
              </h2>
              {brand.description && (
                <p className="text-sm sm:text-base text-gray-600 line-clamp-2">
                  {brand.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 