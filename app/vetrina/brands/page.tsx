'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ExternalLink, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Input } from '@/components/ui/input'

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
                {needsGradient && (
                  <div className="sticky bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#f8f8f8] to-transparent pointer-events-none" />
                )}
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200">
          <Badge variant="outline" className="bg-white">
            Available Catalogs
          </Badge>
          <Button 
            variant="ghost" 
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View
          </Button>
        </div>
      </CardContent>
    </MotionCard>
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

  useEffect(() => {
    const updateScroll = () => {
      setIsScrolled(window.scrollY > 0)
      
      // Trova la lettera corrente in base allo scroll
      const sections = document.querySelectorAll('[data-letter]')
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect()
        if (rect.top <= 150 && rect.bottom >= 150) {
          setCurrentLetter(section.getAttribute('data-letter') || '')
        }
      })
    }

    window.addEventListener('scroll', updateScroll)
    return () => window.removeEventListener('scroll', updateScroll)
  }, [])

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
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Your Brands</h1>
              <p className="text-muted-foreground mt-2">
                Select a brand to view available catalogs
              </p>
            </div>
            
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search brands..."
                className="pl-10"
                value=""
                onChange={() => {}}
                disabled
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
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
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleBrandClick = (brandId: string) => {
    router.push(`/vetrina/brands/${brandId}`)
  }

  const groupedAndSortedBrands = sortedGroupedBrands(filteredBrands)

  return (
    <div className="container  mx-auto px-4 ">
      <motion.div 
        ref={headerRef}
        style={{
          height: headerHeight,
          paddingTop: headerPadding,
          paddingBottom: headerPadding
        }}
        className="sticky top-16 z-20 bg-white -mx-4 px-4"
      >
        <div className="flex flex-col md:flex-row bg-white md:items-center md:justify-between gap-4  h-full ">
          <div>
            {isScrolled ? (
              <div className="flex items-center gap-6">
                <span className="text-4xl font-bold text-primary">{currentLetter}</span>
                <div className="flex gap-3 items-center text-sm font-medium">
                  {groupedAndSortedBrands.map(([letter]) => (
                    <button
                      key={letter}
                      onClick={() => scrollToLetter(letter)}
                      className={`hover:text-primary transition-colors ${
                        currentLetter === letter ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Your Brands
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a brand to view available catalogs
                </p>
              </div>
            )}
            
          </div>
          
          <div className="relative w-full bg-white md:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search brands..."
              className="pl-10"
              value={searchQuery}
              onChange={handleSearchChange}
            />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    </div>
  )
} 