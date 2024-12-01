'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FileUploader } from './file-uploader'
import { CoverUploader } from './cover-uploader'
import { RichTextEditor } from '@/components/rich-text-editor'

const tipiCatalogo = [
  'Preordine',
  'Disponibile',
  'Riassortimento',
  'Stock',
  'Rimanenze'
] as const

const stagioniCatalogo = [
  'PRE FALL-WINTER',
  'MAIN FALL-WINTER',
  'PRE SPRING-SUMMER',
  'MAIN SPRING-SUMMER',
  'OTHER'
] as const

const formSchema = z.object({
  nome: z.string().optional(),
  codice: z.string(),
  brand_id: z.string().min(1, 'Seleziona un brand'),
  tipo: z.string().min(1, 'Seleziona un tipo'),
  stagione: z.string().min(1, 'Seleziona una stagione'),
  anno: z.number().min(2000).max(2100),
  data_consegna: z.string().optional(),
  data_inizio_ordini: z.string().optional(),
  data_fine_ordini: z.string().optional(),
  note: z.string().optional(),
  condizioni: z.string().optional(),
  cover_url: z.string().optional(),
  stato: z.enum(['bozza', 'pubblicato', 'archiviato']),
})

interface Brand {
  id: string
  name: string
}

interface CatalogoFormProps {
  catalogo?: any
  brands: Brand[]
  onClose: () => void
}

// Funzione per generare la lista degli anni (da 5 anni fa a 5 anni avanti)
const getYearsList = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear - 7; i <= currentYear + 7; i++) {
    years.push(i)
  }
  return years
}

export function CatalogoForm({ catalogo, brands = [], onClose }: CatalogoFormProps) {
  const [files, setFiles] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const brandsList = Array.isArray(brands) ? brands : []

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: catalogo ? {
      codice: catalogo.codice || '',
      brand_id: catalogo.brand_id || '',
      tipo: catalogo.tipo || '',
      stagione: catalogo.stagione || '',
      anno: catalogo.anno || new Date().getFullYear(),
      data_consegna: catalogo.data_consegna || '',
      data_inizio_ordini: catalogo.data_inizio_ordini || '',
      data_fine_ordini: catalogo.data_fine_ordini || '',
      note: catalogo.note || '',
      condizioni: catalogo.condizioni || '',
      cover_url: catalogo.cover_url || '',
      stato: catalogo.stato || 'bozza',
      nome: catalogo.nome || ''
    } : {
      codice: '',
      brand_id: '',
      tipo: '',
      stagione: '',
      anno: new Date().getFullYear(),
      data_consegna: '',
      data_inizio_ordini: '',
      data_fine_ordini: '',
      note: '',
      condizioni: '',
      cover_url: '',
      stato: 'bozza',
      nome: ''
    }
  })

  // Recupera il codice automatico quando si apre il form per un nuovo catalogo
  useEffect(() => {
    const fetchNextCode = async () => {
      if (!catalogo) { // Solo per nuovi cataloghi
        try {
          const response = await fetch('/api/admin/cataloghi/last-code')
          const data = await response.json()
          if (data.code) {
            form.setValue('codice', data.code)
          }
        } catch (error) {
          console.error('Errore nel recupero del codice:', error)
        }
      }
    }

    fetchNextCode()
  }, [catalogo, form])

  const fetchFiles = async () => {
    if (!catalogo?.id) return
    
    try {
      const response = await fetch(`/api/admin/cataloghi/${catalogo.id}/files`)
      if (!response.ok) throw new Error('Errore nel caricamento dei file')
      const data = await response.json()
      setFiles(data)
    } catch (error) {
      console.error('Errore:', error)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setSaving(true)
      setError(null)

      // Debug del payload
      console.log('Payload being sent:', {
        ...values,
        cover_url: values.cover_url || null // Assicuriamoci che non sia undefined
      })

      const response = await fetch('/api/admin/cataloghi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          cover_url: values.cover_url || null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Errore nel salvataggio')
      }

      const data = await response.json()
      console.log('Response from server:', data) // Debug della risposta

      onClose()
    } catch (err) {
      console.error('Error details:', err)
      setError(err instanceof Error ? err.message : 'Errore nel salvataggio')
    } finally {
      setSaving(false)
    }
  }

  // Recupera i file solo se è in modalità modifica
  useEffect(() => {
    if (catalogo?.id) {
      fetchFiles()
    }
  }, [catalogo?.id])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Catalogo</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} placeholder="Nome del catalogo" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="codice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Codice</FormLabel>
                <FormControl>
                  <Input {...field} disabled readOnly className="bg-muted" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="brand_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {brandsList.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tipiCatalogo.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stagione"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stagione</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona stagione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {stagioniCatalogo.map((stagione) => (
                      <SelectItem key={stagione} value={stagione}>
                        {stagione}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="anno"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anno</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona anno" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getYearsList().map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="data_consegna"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Consegna</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="es: 3 settimane o luglio 2025" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_inizio_ordini"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Inizio Ordini</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_fine_ordini"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Fine Ordini</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <RichTextEditor 
                    value={field.value || ''} 
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="condizioni"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condizioni</FormLabel>
                <FormControl>
                  <RichTextEditor 
                    value={field.value || ''} 
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4 items-start">
          <FormField
            control={form.control}
            name="cover_url"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Cover</FormLabel>
                <FormControl>
                  <CoverUploader 
                    value={field.value} 
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stato"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Stato</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona stato" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="bozza">Bozza</SelectItem>
                    <SelectItem value="pubblicato">Pubblicato</SelectItem>
                    <SelectItem value="archiviato">Archiviato</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvataggio...' : catalogo ? 'Aggiorna' : 'Salva'}
          </Button>
        </div>
      </form>
    </Form>
  )
} 