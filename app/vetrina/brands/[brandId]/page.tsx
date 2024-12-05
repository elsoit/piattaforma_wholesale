'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft, Truck, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CatalogoFiles } from './catalogo-files'
import { Badge } from "@/components/ui/badge"
import { format, isPast, isWithinInterval, parseISO, isBefore, isAfter } from 'date-fns'
import { it } from 'date-fns/locale'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface Brand {
  id: string
  name: string
  description?: string
  logo?: string
}

interface Catalogo {
  id: number
  nome: string
  codice: string
  tipo: string
  stagione: string
  anno: number
  cover_url: string
  stato: string
  data_inizio_ordini: string | null
  data_fine_ordini: string | null
  data_consegna: string | null
  created_at: string
  updated_at: string
  note: string | null
  condizioni: string | null
}

interface CataloghiGruppo {
  [key: string]: Catalogo[]
}

function CatalogoCard({ catalogo }: { catalogo: Catalogo }) {
  const accordionRef = useRef<HTMLDivElement>(null)
  const noteRef = useRef<HTMLDivElement>(null)
  const condizioniRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [noteHeight, setNoteHeight] = useState<string>('h-[100px]')
  const [condizioniHeight, setCondizioniHeight] = useState<string>('h-[100px]')

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  useEffect(() => {
    const calculateHeights = () => {
      if (noteRef.current) {
        const lineHeight = parseInt(window.getComputedStyle(noteRef.current).lineHeight)
        const contentHeight = noteRef.current.scrollHeight
        const lines = contentHeight / lineHeight
        setNoteHeight(lines <= 5 ? 'h-auto' : 'h-[100px]')
      }

      if (condizioniRef.current) {
        const lineHeight = parseInt(window.getComputedStyle(condizioniRef.current).lineHeight)
        const contentHeight = condizioniRef.current.scrollHeight
        const lines = contentHeight / lineHeight
        setCondizioniHeight(lines <= 5 ? 'h-auto' : 'h-[100px]')
      }
    }

    // Calcoliamo le altezze dopo un breve delay per assicurarci che il contenuto sia renderizzato
    const timer = setTimeout(calculateHeights, 100)

    // Aggiungiamo un observer per ricalcolare quando il contenuto cambia
    const resizeObserver = new ResizeObserver(calculateHeights)
    if (noteRef.current) resizeObserver.observe(noteRef.current)
    if (condizioniRef.current) resizeObserver.observe(condizioniRef.current)

    return () => {
      clearTimeout(timer)
      resizeObserver.disconnect()
    }
  }, [catalogo.note, catalogo.condizioni])

  const getStatus = () => {
    if (!catalogo.data_inizio_ordini || !catalogo.data_fine_ordini) return null;
    
    const now = new Date();
    const startDate = parseISO(catalogo.data_inizio_ordini);
    const endDate = parseISO(catalogo.data_fine_ordini);

    if (isWithinInterval(now, { start: startDate, end: endDate })) {
      return { text: 'Attivo', color: 'bg-green-500 hover:bg-green-600' };
    } else if (isBefore(now, startDate)) {
      return { text: 'Opening Soon', color: 'bg-orange-500 hover:bg-orange-600' };
    } else {
      return { text: 'Closed', color: 'bg-red-500 hover:bg-red-600' };
    }
  };

  const status = getStatus();

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden lg:ml-2 border border-gray-200/50">
      <div className="flex flex-col md:flex-row h-full">
        <div className="md:w-1/2 flex flex-col">
          <div className="relative h-48 md:h-[200px]">
            <Image 
              src={catalogo.cover_url}
              alt={catalogo.nome || `Catalogo ${catalogo.tipo}`}
              fill
              className="object-cover"
            />
            {status && (
              <div className="absolute top-2 right-2">
                <Badge className={`font-medium ${status.color}`}>
                  {status.text}
                </Badge>
              </div>
            )}
          </div>
          <div className="p-4 flex flex-col gap-2 flex-grow bg-gray-50">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-800">
                {catalogo.nome || `Catalogo ${catalogo.tipo}`}
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-900">
                  {catalogo.stagione} {catalogo.anno}
                </span>
                <span className="text-sm text-gray-900 font-semibold">
                  {catalogo.tipo}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 items-center">
              {catalogo.data_fine_ordini && (
                <p className="flex gap-1 items-center text-sm">
                  <Timer className="w-4 h-4 text-gray-900" /> 
                  {format(parseISO(catalogo.data_fine_ordini), 'dd/MM/yyyy', { locale: it })}
                </p>
              )}
              <span className="flex gap-1 text-sm items-center justify-end">
                <Truck className="w-4 h-4 text-gray-900" /> 
                <div className="font-semibold text-gray-700">
                  {catalogo.data_consegna}
                </div>
              </span>
            </div>

            {(catalogo.note || catalogo.condizioni) && (
              <div ref={accordionRef}>
                {isMobile ? (
                  <Accordion 
                    type="multiple"
                    defaultValue={["note", "condizioni"]}
                    className="w-full mt-2"
                  >
                    {catalogo.note && (
                      <AccordionItem value="note">
                        <AccordionTrigger className="text-sm">Note</AccordionTrigger>
                        <AccordionContent>
                          <div 
                            ref={noteRef}
                            className={`text-sm prose prose-sm max-w-none overflow-y-auto pr-2 ${noteHeight}`}
                            dangerouslySetInnerHTML={{ __html: catalogo.note }} 
                          />
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    {catalogo.condizioni && (
                      <AccordionItem value="condizioni" className="border-b-0">
                        <AccordionTrigger className="text-sm">Condizioni</AccordionTrigger>
                        <AccordionContent>
                          <div 
                            ref={condizioniRef}
                            className={`text-sm prose prose-sm max-w-none overflow-y-auto pr-2 ${condizioniHeight}`}
                            dangerouslySetInnerHTML={{ __html: catalogo.condizioni }} 
                          />
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                ) : (
                  <Accordion 
                    type="single"
                    collapsible={true}
                    defaultValue="note"
                    className="w-full mt-2"
                  >
                    {catalogo.note && (
                      <AccordionItem value="note">
                        <AccordionTrigger className="text-sm">Note</AccordionTrigger>
                        <AccordionContent>
                          <div 
                            ref={noteRef}
                            className={`text-sm prose prose-sm max-w-none overflow-y-auto pr-2 ${noteHeight}`}
                            dangerouslySetInnerHTML={{ __html: catalogo.note }} 
                          />
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    {catalogo.condizioni && (
                      <AccordionItem value="condizioni" className="border-b-0">
                        <AccordionTrigger className="text-sm">Condizioni</AccordionTrigger>
                        <AccordionContent>
                          <div 
                            ref={condizioniRef}
                            className={`text-sm prose prose-sm max-w-none overflow-y-auto pr-2 ${condizioniHeight}`}
                            dangerouslySetInnerHTML={{ __html: catalogo.condizioni }} 
                          />
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="md:w-1/2 p-4 border-t md:border-t-0 md:border-l border-gray-200">
          <CatalogoFiles 
            catalogoId={catalogo.id} 
            hasNotesOrConditions={!!(catalogo.note || catalogo.condizioni)} 
          />
        </div>
      </div>
    </div>
  )
}

export default function BrandPage() {
  const params = useParams()
  const router = useRouter()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [cataloghi, setCataloghi] = useState<Catalogo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBrandAndCataloghi = async () => {
      try {
        setLoading(true)
        
        const [brandResponse, cataloghiResponse] = await Promise.all([
          fetch(`/api/vetrina/brands/${params.brandId}`),
          fetch(`/api/vetrina/brands/${params.brandId}/cataloghi`)
        ])

        if (!brandResponse.ok) throw new Error('Errore nel recupero del brand')
        if (!cataloghiResponse.ok) throw new Error('Errore nel recupero dei cataloghi')

        const brandData = await brandResponse.json()
        const cataloghiData = await cataloghiResponse.json()
        
        console.log('Cataloghi ricevuti:', cataloghiData)

        setBrand(brandData as Brand)
        setCataloghi(cataloghiData as Catalogo[])
      } catch (err) {
        console.error('Errore:', err)
        setError(err instanceof Error ? err.message : 'Errore sconosciuto')
      } finally {
        setLoading(false)
      }
    }

    fetchBrandAndCataloghi()
  }, [params.brandId])

  // Funzione per assegnare priorità alle stagioni
  const getStagionePriority = (stagione: string): number => {
    const priorities: { [key: string]: number } = {
      'PRE FALL-WINTER': 1,
      'MAIN FALL-WINTER': 0,
      'PRE SPRING-SUMMER': 3,
      'MAIN SPRING-SUMMER': 2,
      'OTHER': 4
    };
    return priorities[stagione.toUpperCase()] ?? -1;
  };

  // Raggruppa i cataloghi per stagione + anno
  const cataloghiGruppati = cataloghi.reduce((acc: CataloghiGruppo, catalogo) => {
    const key = `${catalogo.stagione} ${catalogo.anno}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(catalogo);
    return acc;
  }, {});

  // Ordina i gruppi per anno e stagione
  const gruppiOrdinati = Object.entries(cataloghiGruppati).sort(([keyA], [keyB]) => {
    const [stagioneA, annoA] = keyA.split(/(\d+)/).filter(Boolean);
    const [stagioneB, annoB] = keyB.split(/(\d+)/).filter(Boolean);
    
    // Prima confronta gli anni (decrescente)
    const confrontoAnni = parseInt(annoB) - parseInt(annoA);
    if (confrontoAnni !== 0) {
      return confrontoAnni;
    }
    
    // Solo se gli anni sono uguali, confronta le stagioni
    return getStagionePriority(stagioneA.trim()) - getStagionePriority(stagioneB.trim());
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !brand) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Brand non trovato'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/vetrina/brands')}
              className="flex items-center gap-1 px-3 max-h-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {brand && (
              <h1 className="text-2xl font-bold">{brand.name}</h1>
            )}
          </div>

          {brand?.logo && (
            <Image 
              src={brand.logo}
              alt={`${brand.name} logo`}
              width={60}
              height={60}
              className="object-contain md:max-h-full max-h-8"
            />
          )}
        </div>

      <Accordion 
        type="single" 
        collapsible 
        className="w-full space-y-4"
        defaultValue={gruppiOrdinati[0]?.[0]}
      >
        {gruppiOrdinati.map(([gruppo, cataloghiGruppo]) => (
          <AccordionItem key={gruppo} value={gruppo}>
            <AccordionTrigger className="text-xl font-semibold text-gray-800">
              {gruppo}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                {cataloghiGruppo.map((catalogo) => (
                  <CatalogoCard key={catalogo.id} catalogo={catalogo} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {cataloghi.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500">Nessun catalogo disponibile</p>
        </div>
      )}
    </div>
  )
} 