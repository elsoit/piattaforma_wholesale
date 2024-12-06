'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ExternalLink, Search, PackageOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { RequestBrandsDialog } from '@/components/vetrina/request-brands-dialog'

interface Brand {
  id: string
  name: string
  description?: string
  logo?: string
  created_at?: string
  updated_at?: string
}

interface GroupedBrands {
  [key: string]: Brand[]
}

const MotionCard = motion(Card)

interface BrandCardProps {
  brand: Brand
  onClick: () => void
  index: number
}

const BrandCard = ({ brand, onClick, index }: BrandCardProps) => {
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [needsGradient, setNeedsGradient] = useState(false);

  useEffect(() => {
    if (descriptionRef.current) {
      const isOverflowing = descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight;
      setNeedsGradient(isOverflowing);
    }
  }, [brand.description]);

  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer bg-[#f8f8f8] border-0 flex flex-col h-full"
      onClick={onClick}
    >
      <CardHeader className="p-6 pb-4">
        {brand.logo ? (
          <div className="h-32 flex items-center justify-center mb-4 bg-white rounded-lg p-4 group-hover:bg-gray-50 transition-colors">
            <img
              src={brand.logo}
              alt={`${brand.name} Logo`}
              className="max-h-full max-w-full object-contain transform group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center mb-4 bg-white rounded-lg">
            <span className="text-xl font-bold text-gray-400">
              {brand.name.charAt(0)}
            </span>
          </div>
        )}
        <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
          {brand.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 flex-1 flex flex-col">
        {brand.description && (
          <div className="mb-4 flex-1">
            <div className="relative">
              <div 
                ref={descriptionRef}
                className="text-sm text-muted-foreground h-[5em] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
              >
                {brand.description}
              </div>
              {needsGradient && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#f8f8f8] to-transparent" />
              )}
            </div>
          </div>
        )}
        <Button
          variant="outline"
          className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
        >
          View Catalogs
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </MotionCard>
  )
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 pt-20">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded-md mb-2" />
            <div className="h-4 w-72 bg-gray-100 rounded-md" />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="h-9 w-36 bg-gray-200 rounded-md animate-pulse" />
            <div className="relative w-full md:w-72">
              <div className="h-9 w-full bg-gray-100 rounded-md animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i} 
            className="rounded-lg border border-gray-100 bg-white p-6"
          >
            <div className="h-32 bg-gray-50 rounded-lg mb-4 flex items-center justify-center">
              <div className="h-16 w-16 bg-gray-200 rounded-full" />
            </div>
            
            <div className="space-y-3">
              <div className="h-6 w-3/4 bg-gray-200 rounded-md" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-100 rounded-md" />
                <div className="h-4 w-5/6 bg-gray-100 rounded-md" />
                <div className="h-4 w-4/6 bg-gray-100 rounded-md" />
              </div>
            </div>

            <div className="mt-4 h-9 w-full bg-gray-200 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [currentLetter, setCurrentLetter] = useState<string>('')
  const router = useRouter()
  const headerRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  
  const headerHeight = useTransform(scrollY, [0, 100], [120, 60])
  const headerPadding = useTransform(scrollY, [0, 100], [24, 12])
  const subtitleOpacity = useTransform(scrollY, [0, 60], [1, 0])
  const subtitleHeight = useTransform(scrollY, [0, 60], [20, 0])
  const titleMargin = useTransform(scrollY, [0, 60], [8, 0])
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const lettersContainerRef = useRef<HTMLDivElement>(null);

  // Funzione per centrare la lettera attiva
  const centerActiveLetter = (letter: string) => {
    if (!lettersContainerRef.current) return;
    
    const container = lettersContainerRef.current;
    const letterButton = container.querySelector(`[data-letter-button="${letter}"]`) as HTMLElement;
    
    if (!letterButton) return;

    const containerWidth = container.offsetWidth;
    const letterButtonLeft = letterButton.offsetLeft;
    const letterButtonWidth = letterButton.offsetWidth;
    
    // Calcola la posizione di scroll necessaria per centrare la lettera
    const scrollLeft = letterButtonLeft - (containerWidth / 2) + (letterButtonWidth / 2);
    
    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const updateScroll = () => {
      setIsScrolled(window.scrollY > 0);
      
      // Trova la lettera corrente in base allo scroll
      const sections = document.querySelectorAll('[data-letter]');
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom >= 150) {
          const letter = section.getAttribute('data-letter') || '';
          setCurrentLetter(letter);
          centerActiveLetter(letter);
        }
      });
    };

    window.addEventListener('scroll', updateScroll);
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

  const scrollToLetter = (letter: string) => {
    const element = document.querySelector(`[data-letter="${letter}"]`)
    if (element) {
      const offset = element.getBoundingClientRect().top + window.pageYOffset - 150
      window.scrollTo({ top: offset, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch('/api/vetrina/brands')
        if (!response.ok) {
          throw new Error('Error loading brands')
        }
        const data = await response.json()
        
        if (!Array.isArray(data)) {
          throw new Error('Data received is not in the correct format')
        }
        
        const validBrands = data.filter((item): item is Brand => {
          return typeof item === 'object' && item !== null && 
                 typeof item.id === 'string' && 
                 typeof item.name === 'string'
        })
        
        setBrands(validBrands)
      } catch (err) {
        console.error('Error loading brands:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchBrands()
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const filteredBrands = brands.filter(brand => {
    if (!searchQuery.trim()) return true
    
    const searchLower = searchQuery.toLowerCase().trim()
    return (
      brand.name.toLowerCase().includes(searchLower) ||
      (brand.description?.toLowerCase() || '').includes(searchLower)
    )
  })

  const groupBrandsByAlphabet = (brands: Brand[]): GroupedBrands => {
    return brands.reduce((groups: GroupedBrands, brand) => {
      const firstLetter = brand.name.charAt(0).toUpperCase()
      if (!groups[firstLetter]) {
        groups[firstLetter] = []
      }
      groups[firstLetter].push(brand)
      return groups
    }, {})
  }

  const sortedGroupedBrands = (brands: Brand[]): [string, Brand[]][] => {
    const grouped = groupBrandsByAlphabet(brands)
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (brands.length === 0) {
    return (
      <>
        <div className="container mx-auto px-4 pt-20">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-6">
              <PackageOpen className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              No Active Brands
            </h2>
            <p className="text-gray-500 mb-8 max-w-md">
              You don't have any active brands yet. Request access to start exploring our catalogs.
            </p>
            <Button
              onClick={() => setIsRequestDialogOpen(true)}
              className="bg-gray-900 text-white hover:bg-gray-800"
              size="lg"
            >
              Request Brand Access
            </Button>
          </div>
        </div>

        <RequestBrandsDialog
          isOpen={isRequestDialogOpen}
          onClose={() => setIsRequestDialogOpen(false)}
          activeBrands={brands}
        />
      </>
    )
  }

  const handleBrandClick = (brandId: string) => {
    router.push(`/vetrina/brands/${brandId}`)
  }

  const groupedAndSortedBrands = sortedGroupedBrands(filteredBrands)

  return (
    <div className="container mx-auto px-2 sm:px-4">
      <motion.div 
        ref={headerRef}
        style={{
          height: headerHeight,
          paddingTop: headerPadding,
          paddingBottom: headerPadding
        }}
        className="sticky top-16 z-20 bg-white -mx-2 sm:-mx-4 px-2 sm:px-4"
      >
        <div className="flex flex-col md:flex-row gap-3 h-full">
          {/* Header principale */}
          <div className="flex items-center justify-between flex-1">
            {isScrolled ? (
              <div className="flex items-center gap-4">
                <span className="text-3xl md:text-4xl font-bold text-primary shrink-0">
                  {currentLetter}
                </span>
                <div 
                  ref={lettersContainerRef}
                  className="flex gap-2 items-center overflow-x-auto scrollbar-none max-w-[200px] sm:max-w-none scroll-smooth"
                >
                  {groupedAndSortedBrands.map(([letter]) => (
                    <button
                      key={letter}
                      data-letter-button={letter}
                      onClick={() => {
                        scrollToLetter(letter);
                        centerActiveLetter(letter);
                      }}
                      className={`
                        transition-all shrink-0 w-8 h-8 
                        flex items-center justify-center
                        ${currentLetter === letter 
                          ? 'text-gray-900 font-bold text-base' // Lettera attiva: più grande e in grassetto
                          : 'text-gray-500 font-normal text-sm hover:text-gray-900' // Lettere inattive: più piccole e grigie
                        }
                      `}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                  Active Brands
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Browse and access our brand catalogs
                </p>
              </div>
            )}

            {/* Pulsante Request e Search su desktop */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                onClick={() => setIsRequestDialogOpen(true)}
                variant="outline"
                size="sm"
                className="whitespace-nowrap shrink-0"
              >
                Request New Brand
              </Button>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search brands..."
                  className="pl-10 bg-white border-gray-200"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Solo pulsante Request su mobile */}
            <div className="md:hidden">
              <Button
                onClick={() => setIsRequestDialogOpen(true)}
                variant="outline"
                size="sm"
                className="whitespace-nowrap shrink-0"
              >
                Request New Brand
              </Button>
            </div>
          </div>

          {/* Barra di ricerca solo su mobile */}
          <div className="md:hidden w-full bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search brands..."
                className="pl-10 bg-white border-gray-200"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="pt-4">
        {filteredBrands.length === 0 ? (
          <Alert>
            <AlertDescription>
              No brands found matching your search criteria. Please try a different search term.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-8">
            {groupedAndSortedBrands.map(([letter, brands]) => (
              <div key={letter} className="relative space-y-4 pt-14" data-letter={letter}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {brands.map((brand, index) => (
                    <BrandCard
                      key={brand.id}
                      brand={brand}
                      onClick={() => handleBrandClick(brand.id)}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <RequestBrandsDialog
        isOpen={isRequestDialogOpen}
        onClose={() => setIsRequestDialogOpen(false)}
        activeBrands={brands}
      />
    </div>
  )
} 