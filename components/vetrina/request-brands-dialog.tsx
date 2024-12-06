'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

interface Brand {
  id: string
  name: string
  description?: string
  logo?: string
}

interface RequestBrandsDialogProps {
  isOpen: boolean
  onClose: () => void
  activeBrands: Brand[]
}

export function RequestBrandsDialog({ isOpen, onClose, activeBrands }: RequestBrandsDialogProps) {
  const [brands, setBrands] = useState<Brand[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [requestedBrands, setRequestedBrands] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())
  const [activeIds] = useState<Set<string>>(new Set(activeBrands.map(b => b.id)))

  useEffect(() => {
    const fetchAllBrands = async () => {
      try {
        const response = await fetch('/api/brands/all?limit=-1')
        if (!response.ok) throw new Error('Errore nel caricamento dei brand')
        const { data } = await response.json()
        setBrands(data)
      } catch (error) {
        console.error('Errore:', error)
        toast.error('Errore nel caricamento dei brand')
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      fetchAllBrands()
      fetchRequestedBrands()
    }
  }, [isOpen])

  const fetchRequestedBrands = async () => {
    try {
      const response = await fetch('/api/clients/current/brands/requested')
      if (!response.ok) throw new Error('Errore nel caricamento delle richieste')
      const { data } = await response.json()
      setRequestedBrands(new Set(data.map((b: any) => b.brand_id)))
    } catch (error) {
      console.error('Errore:', error)
    }
  }

  const handleRequestBrand = async (brandId: string) => {
    try {
      const response = await fetch('/api/clients/current/brands/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId })
      })

      if (!response.ok) throw new Error('Errore nella richiesta del brand')

      setRequestedBrands(prev => new Set([...prev, brandId]))
      toast.success('Richiesta inviata con successo')
    } catch (error) {
      console.error('Errore:', error)
      toast.error('Errore nell\'invio della richiesta')
    }
  }

  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleDescription = (brandId: string) => {
    setExpandedDescriptions(prev => {
      const next = new Set(prev)
      if (next.has(brandId)) {
        next.delete(brandId)
      } else {
        next.add(brandId)
      }
      return next
    })
  }

  const getBrandStatus = (brandId: string) => {
    if (activeIds.has(brandId)) {
      return { status: 'active', label: 'Active', className: 'text-green-600 bg-green-100' }
    }
    if (requestedBrands.has(brandId)) {
      return { status: 'requested', label: 'Requested', className: 'text-blue-600 bg-blue-100' }
    }
    return { status: 'none', label: 'Activate now', className: '' }
  }

  // Calcola il numero di brand richiesti ma non attivi
  const pendingRequestsCount = useMemo(() => {
    const activeIds = new Set(activeBrands.map(b => b.id))
    return Array.from(requestedBrands).filter(id => !activeIds.has(id)).length
  }, [requestedBrands, activeBrands])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] w-[95vw] p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl sm:text-2xl">
              Request Brand Access
            </DialogTitle>
            {pendingRequestsCount > 0 && (
              <div className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-1 mr-3 rounded-full">
                {pendingRequestsCount} pending {pendingRequestsCount === 1 ? 'request' : 'requests'}
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Select the brands you want to access
          </p>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search brands..."
            className="pl-10 bg-gray-50/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="max-h-[60vh] sm:max-h-[500px] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading brands...</p>
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Search className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No brands found matching your search criteria
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBrands.map((brand) => {
                const { status, label, className } = getBrandStatus(brand.id)
                const isExpanded = expandedDescriptions.has(brand.id)

                return (
                  <div
                    key={brand.id}
                    className="group rounded-lg border border-gray-100 bg-white p-3 sm:p-4 transition-all hover:border-gray-200 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        {brand.logo ? (
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded bg-gray-50 p-1 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded flex items-center justify-center shrink-0">
                            <span className="text-base sm:text-lg font-medium text-gray-400">
                              {brand.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-0.5 truncate">{brand.name}</h4>
                          {brand.description && (
                            <div className="relative">
                              <p 
                                className={`
                                  text-sm text-gray-500 cursor-pointer hover:text-gray-700
                                  ${!isExpanded ? 'line-clamp-1' : ''}
                                `}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleDescription(brand.id)
                                }}
                              >
                                {brand.description}
                                {brand.description.length > 50 && (
                                  <span className="inline-flex items-center text-xs text-gray-400 hover:text-gray-600 ml-1">
                                    {isExpanded ? (
                                      <ChevronUp className="h-3 w-3" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3" />
                                    )}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {status === 'active' || status === 'requested' ? (
                        <div className={`flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shrink-0 ${className}`}>
                          <Check className="w-4 h-4 mr-1.5" />
                          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{label}</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="transition-all hover:bg-primary hover:text-white shrink-0"
                          onClick={() => handleRequestBrand(brand.id)}
                        >
                          {label}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 