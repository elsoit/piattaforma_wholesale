'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { CoverUploader } from './cover-uploader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileList } from './file-list'
import { FileUploader } from './file-uploader'
import { RichTextEditor } from '@/components/rich-text-editor'
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
  brand_id: z.string().min(1, 'Brand richiesto'),
  tipo: z.enum(tipiCatalogo),
  stagione: z.enum(stagioniCatalogo),
  anno: z.number().min(2000).max(2100),
  data_inizio_ordini: z.string().optional(),
  data_fine_ordini: z.string().optional(),
  data_consegna: z.string(),
  note: z.string().optional(),
  condizioni: z.string().optional(),
  cover_url: z.string().optional(),
  stato: z.enum(['bozza', 'pubblicato', 'archiviato']),
  nome: z.string().optional()
})

interface EditCatalogoDialogProps {
  catalogo: {
    id: number
    codice: string
    nome: string | null
    brand_id: string
    tipo: string
    stagione: string
    anno: number
    data_consegna: string | null
    data_inizio_ordini: string | null
    data_fine_ordini: string | null
    note: string | null
    condizioni: string | null
    cover_url: string | null
    stato: 'bozza' | 'pubblicato' | 'archiviato'
  }
  brands: any[]
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

const formatDateForInput = (dateString: string | null) => {
  if (!dateString) return ''
  return new Date(dateString).toISOString().split('T')[0]
}

export function EditCatalogoDialog({ 
  catalogo, 
  brands, 
  isOpen, 
  onClose, 
  onUpdate 
}: EditCatalogoDialogProps) {
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  
  // Mantieni i valori iniziali per il confronto
  const initialValues = useRef({
    brand_id: catalogo.brand_id,
    tipo: catalogo.tipo,
    stagione: catalogo.stagione,
    anno: catalogo.anno,
    data_consegna: catalogo.data_consegna || '',
    data_inizio_ordini: formatDateForInput(catalogo.data_inizio_ordini),
    data_fine_ordini: formatDateForInput(catalogo.data_fine_ordini),
    note: catalogo.note || '',
    condizioni: catalogo.condizioni || '',
    cover_url: catalogo.cover_url || '',
    stato: catalogo.stato || 'bozza',
    nome: catalogo.nome || ''
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brand_id: catalogo.brand_id,
      tipo: catalogo.tipo,
      stagione: catalogo.stagione,
      anno: catalogo.anno,
      data_consegna: catalogo.data_consegna,
      data_inizio_ordini: '',
      data_fine_ordini: '',
      note: catalogo.note || '',
      condizioni: catalogo.condizioni || '',
      cover_url: catalogo.cover_url || '',
      stato: catalogo.stato || 'bozza',
      nome: catalogo.nome || ''
    }
  })

  // Controlla se ci sono modifiche rispetto ai valori iniziali
  const checkForChanges = (values: any) => {
    const currentValues = {
      ...values,
      data_inizio_ordini: values.data_inizio_ordini || '',
      data_fine_ordini: values.data_fine_ordini || '',
      data_consegna: values.data_consegna || '',
      note: values.note || '',
      condizioni: values.condizioni || '',
      cover_url: values.cover_url || '',
      nome: values.nome || ''
    }

    return Object.keys(currentValues).some(key => 
      currentValues[key] !== initialValues.current[key]
    )
  }

  // Monitora i cambiamenti del form
  useEffect(() => {
    const subscription = form.watch((value) => {
      const hasActualChanges = checkForChanges(value)
      setHasChanges(hasActualChanges)
      if (hasActualChanges) {
        setSuccess(null)
        setError(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  useEffect(() => {
    setMounted(true)
    form.setValue('data_inizio_ordini', formatDateForInput(catalogo.data_inizio_ordini))
    form.setValue('data_fine_ordini', formatDateForInput(catalogo.data_fine_ordini))
  }, [catalogo])

  if (!mounted) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/admin/cataloghi/${catalogo.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form.getValues(),
          nome: form.getValues().nome || null,
          data_consegna: form.getValues().data_consegna || null,
          data_inizio_ordini: form.getValues().data_inizio_ordini || null,
          data_fine_ordini: form.getValues().data_fine_ordini || null,
          note: form.getValues().note || null,
          condizioni: form.getValues().condizioni || null,
          cover_url: form.getValues().cover_url || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante il salvataggio')
      }

      setHasChanges(false)
      setSuccess('Modifiche salvate con successo')
      onUpdate()
    } catch (err) {
      console.error('Errore dettagliato:', err)
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = (open: boolean) => {
    if (open === false) {
      const currentValues = form.getValues()
      const hasActualChanges = checkForChanges(currentValues)
      
      if (hasActualChanges && !saving) {
        setShowConfirmClose(true)
      } else if (!saving) {
        onClose()
      }
    }
  }

  return (
    <>
      <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma chiusura</AlertDialogTitle>
            <AlertDialogDescription>
              Ci sono modifiche non salvate. Sei sicuro di voler chiudere?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowConfirmClose(false)
              onClose()
            }}>
              Chiudi senza salvare
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog 
        open={isOpen} 
        onOpenChange={handleClose}
        modal={true}
      >
        <DialogContent 
          className="max-w-[1000px] p-0" 
          onInteractOutside={(e) => {
            if (saving) {
              e.preventDefault()
            }
          }}
        >
          <div className="grid grid-cols-2 divide-x h-[800px]">
            <div className="p-6 overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Modifica Catalogo {catalogo.codice}</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                      {error}
                    </div>
                  )}
                  
                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded">
                      {success}
                    </div>
                  )}

                  <div className="space-y-4 mt-5">
                    <FormField
                      control={form.control}
                      name="cover_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cover</FormLabel>
                          <div className="flex gap-4">
                            <FormControl>
                              <CoverUploader 
                                value={field.value} 
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormField
                              control={form.control}
                              name="stato"
                              render={({ field }) => (
                                <FormItem className="flex-1">
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                                {brands.map((brand) => (
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
                                {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
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

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="data_inizio_ordini"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Inizio Ordini</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field}
                                value={field.value || ''} 
                              />
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
                              <Input 
                                type="date" 
                                {...field}
                                value={field.value || ''} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
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
                    </div>

                    <div>
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

                    <div>
                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Catalogo</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => handleClose(false)}
                      disabled={saving}
                    >
                      Annulla
                    </Button>
                    <Button 
                      type="button"
                      disabled={saving || !hasChanges}
                      onClick={handleSubmit}
                    >
                      {saving ? 'Salvataggio...' : 'Aggiorna'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">File del Catalogo</h3>
              </div>
              
              <Tabs defaultValue="all" className="w-full">
             
                
                <TabsContent value="all" className="mt-4">
                  <FileUploader 
                    catalogoId={Number(catalogo.id)}
                    files={catalogo.files || []}
                    onUpdate={onUpdate}
                  />
                </TabsContent>
                
                <TabsContent value="images" className="mt-4">
                  <FileList 
                    catalogoId={Number(catalogo.id)}
                    type="images"
                    onUpdate={onUpdate}
                  />
                </TabsContent>
                
                <TabsContent value="documents" className="mt-4">
                  <FileList 
                    catalogoId={Number(catalogo.id)}
                    type="documents"
                    onUpdate={onUpdate}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 