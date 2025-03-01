'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner'
import { Loader2, X } from "lucide-react"
import * as XLSX from 'xlsx'

interface BulkImportDialogProps {
  isOpen: boolean
  onClose: () => void
  refreshData: () => Promise<void>
}

interface PreviewData {
  article_code: string
  variant_code: string
  size: {
    id?: number
    name: string
    valid: boolean
    error?: string
  }
  size_group: {
    id?: number
    name: string
    valid: boolean
    error?: string
  }
  wholesale_price: number
  retail_price?: number | null
  errors?: string[]
}

interface ErrorItem {
  field: string
  error: string
  rows: number[]
}

interface Correction {
  field: string
  error: string
  value: string
  id: number
}

interface ErrorCorrection {
  [key: string]: { [key: string]: Correction }
}

// Modifica l'interfaccia per gestire mappature multiple
interface ColumnMapping {
  [key: string]: string | { primary: string; secondary?: string }
}

export function BulkImportDialog({ isOpen, onClose, refreshData }: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isMapping, setIsMapping] = useState(false)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [fileHeaders, setFileHeaders] = useState<string[]>([])
  const [previewData, setPreviewData] = useState<PreviewData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [corrections, setCorrections] = useState<Correction[]>([])
  const [appliedCorrections, setAppliedCorrections] = useState<ErrorCorrection>({})
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [sizes, setSizes] = useState<any[]>([])
  const [sizeGroups, setSizeGroups] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [brandErrors, setBrandErrors] = useState<{[key: string]: string}>({})
  const [brandCorrections, setBrandCorrections] = useState<{[key: string]: string}>({})
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [brandSource, setBrandSource] = useState<'db' | 'excel'>('db')
  const [statuses, setStatuses] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  const productAttributes = [
    'article_code',
    'variant_code',
    'size',
    'size_group',
    'wholesale_price',
    'retail_price',
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sizesRes, sizeGroupsRes, brandsRes, statusesRes] = await Promise.all([
          fetch('/api/sizes'),
          fetch('/api/size-groups'),
          fetch('/api/admin/brands'),
          fetch('/api/products/statuses')
        ])

        const [sizesData, groupsData, brandsData, statusesData] = await Promise.all([
          sizesRes.json(),
          sizeGroupsRes.json(),
          brandsRes.json(),
          statusesRes.json()
        ])

        setSizes(sizesData)
        setSizeGroups(groupsData)
        setBrands(brandsData)
        setStatuses(statusesData)
        // Imposta lo stato di default
        setSelectedStatus(statusesData[0])
      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error)
        toast.error('Errore nel caricamento dei dati di riferimento')
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    // Carica i brand disponibili
    const fetchBrands = async () => {
      try {
        const response = await fetch('/api/brands?limit=-1')
        const data = await response.json()
        setBrands(data.data)
      } catch (error) {
        console.error('Errore nel caricamento dei brand:', error)
        toast.error('Errore nel caricamento dei brand')
      }
    }

    fetchBrands()
  }, [])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      readFileHeaders(selectedFile)
      setIsMapping(true)
    }
  }

  const readFileHeaders = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[]
      setFileHeaders(headers)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleCancel = () => {
    setFile(null)
    setIsMapping(false)
    setColumnMapping({})
    setFileHeaders([])
    setPreviewData([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleColumnMappingChange = (attribute: string, value: string, isSecondary = false) => {
    setColumnMapping(prev => {
      if (attribute === 'article_code') {
        const currentMapping = prev[attribute] as { primary: string; secondary?: string } || { primary: '' }
        return {
          ...prev,
          [attribute]: {
            ...currentMapping,
            [isSecondary ? 'secondary' : 'primary']: value === 'none' ? '' : value
          }
        }
      }
      return {
        ...prev,
        [attribute]: value === 'none' ? '' : value
      }
    })
  }

  const handlePreview = async () => {
    // Verifica campi obbligatori
    const requiredFields = ['article_code', 'variant_code', 'size', 'size_group', 'wholesale_price']
    const missingRequired = requiredFields.filter(field => !columnMapping[field])

    if (missingRequired.length > 0) {
      toast.error(`Mancano i seguenti campi obbligatori: ${missingRequired.join(', ')}`)
      return
    }

    setIsLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const rows = XLSX.utils.sheet_to_json(worksheet) as any[]

        const preview: PreviewData[] = rows.flatMap((row) => {
          // Ottieni i valori base della riga
          const articleMapping = columnMapping.article_code as { primary: string; secondary?: string }
          const primaryValue = row[articleMapping.primary]?.toString().trim() || ''
          const secondaryValue = articleMapping.secondary ? 
            row[articleMapping.secondary]?.toString().trim() || '' : ''
          const article_code = secondaryValue ? 
            `${primaryValue}-${secondaryValue}`.toUpperCase() : 
            primaryValue.toUpperCase()

          const variant_code = row[columnMapping.variant_code]?.toString().trim().toUpperCase() || ''

          // Salta la riga se manca il codice articolo o il codice variante
          if (!article_code || !variant_code) {
            return []
          }

          // Ottieni i valori base della riga
          const sizeGroupValue = row[columnMapping.size_group]?.toString().trim() || ''
          const wholesale_price = Number(row[columnMapping.wholesale_price]) || 0
          const retail_price = columnMapping.retail_price ? Number(row[columnMapping.retail_price]) || null : null

          // Verifica corrispondenza gruppo taglie
          const matchingSizeGroup = sizeGroups.find(g => 
            g.name.toLowerCase() === sizeGroupValue.toLowerCase()
          )

          // Dividi le taglie e rimuovi gli spazi
          const sizeValues = row[columnMapping.size]?.toString()
            .split(',')
            .map(s => s.trim())
            .filter(Boolean) || ['']

          // Gestione brand da Excel
          let brandError = null
          if (brandSource === 'excel') {
            const brandValue = row[columnMapping.brand]?.toString().trim() || ''
            const matchingBrand = brands.find(b => 
              b.name.toLowerCase() === brandValue.toLowerCase()
            )
            if (!matchingBrand) {
              brandError = `Brand non valido: ${brandValue}`
            }
          }

          // Crea una riga per ogni taglia
          return sizeValues.map(sizeValue => {
            // Verifica corrispondenza taglia
            const matchingSize = sizes.find(s => 
              s.name.toLowerCase() === sizeValue.toLowerCase()
            )

            const rowData: PreviewData = {
              article_code,
              variant_code,
              brand: brandSource === 'excel' ? {
                name: row[columnMapping.brand]?.toString().trim() || '',
                valid: !brandError,
                error: brandError
              } : undefined,
              size: matchingSize ? {
                id: matchingSize.id,
                name: matchingSize.name,
                valid: true
              } : {
                name: sizeValue,
                valid: false,
                error: `Taglia non valida: ${sizeValue}`
              },
              size_group: matchingSizeGroup ? {
                id: matchingSizeGroup.id,
                name: matchingSizeGroup.name,
                valid: true
              } : {
                name: sizeGroupValue,
                valid: false,
                error: `Gruppo taglie non valido: ${sizeGroupValue}`
              },
              wholesale_price,
              retail_price
            }

            // Aggiungi errori se presenti
            if (!rowData.size.valid || !rowData.size_group.valid || (rowData.brand && !rowData.brand.valid)) {
              rowData.errors = []
              if (!rowData.size.valid) rowData.errors.push(rowData.size.error!)
              if (!rowData.size_group.valid) rowData.errors.push(rowData.size_group.error!)
              if (rowData.brand && !rowData.brand.valid) rowData.errors.push(rowData.brand.error!)
            }

            return rowData
          })
        })

        setPreviewData(preview)
        setIsMapping(false)
        setIsPreviewMode(true)

        // Se ci sono errori, mostra il dialogo di correzione
        const hasErrors = preview.some(row => row.errors && row.errors.length > 0)
        if (hasErrors) {
          setIsErrorDialogOpen(true)
        }
      }
      reader.readAsArrayBuffer(file!)
    } catch (error) {
      console.error('Errore nella generazione preview:', error)
      toast.error('Errore nella generazione dell\'anteprima')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setIsPreviewMode(false)
    setIsMapping(true)
  }

  const handleCorrection = (field: string, error: string, value: string, id: number) => {
    console.log('Nuova correzione:', { field, error, value, id })
    setCorrections(prev => {
      // Rimuovi correzioni precedenti per lo stesso errore
      const filtered = prev.filter(c => !(c.field === field && c.error === error))
      // Aggiungi la nuova correzione
      return [...filtered, { field, error, value, id }]
    })
  }

  const applyCorrections = () => {
    const updatedPreviewData = previewData.map(row => {
      let updatedRow = { ...row }
      let updatedErrors = [...(row.errors || [])]

      // Applica le correzioni per ogni errore trovato
      corrections.forEach(correction => {
        // Gestione correzioni brand
        if (correction.field === 'brand' && row.brand && !row.brand.valid && row.brand.error === correction.error) {
          updatedRow.brand = {
            id: correction.id,
            name: correction.value,
            valid: true
          }
          updatedErrors = updatedErrors.filter(e => e !== correction.error)
        }
        
        // Gestione correzioni taglia
        if (correction.field === 'size' && !row.size.valid && row.size.error === correction.error) {
          updatedRow.size = {
            id: correction.id,
            name: correction.value,
            valid: true
          }
          updatedErrors = updatedErrors.filter(e => e !== correction.error)
        }
        
        // Gestione correzioni gruppo taglie
        if (correction.field === 'size_group' && !row.size_group.valid && row.size_group.error === correction.error) {
          updatedRow.size_group = {
            id: correction.id,
            name: correction.value,
            valid: true
          }
          updatedErrors = updatedErrors.filter(e => e !== correction.error)
        }
      })

      // Aggiorna o rimuovi l'array errors
      if (updatedErrors.length === 0) {
        delete updatedRow.errors
      } else {
        updatedRow.errors = updatedErrors
      }

      return updatedRow
    })

    setPreviewData(updatedPreviewData)
    setCorrections([]) // Reset delle correzioni
    setIsErrorDialogOpen(false)
    
    // Mostra toast di conferma
    toast.success('Correzioni applicate con successo')
  }

  const groupedErrors = useMemo(() => {
    return previewData.reduce((acc, row, index) => {
      // Controlla errori brand
      if (row.brand && !row.brand.valid) {
        const key = `brand-${row.brand.error}`
        if (!acc[key]) {
          acc[key] = {
            field: 'brand',
            error: row.brand.error!,
            rows: []
          }
        }
        acc[key].rows.push(index)
      }

      // Controlla errori taglia
      if (!row.size.valid) {
        const key = `size-${row.size.error}`
        if (!acc[key]) {
          acc[key] = {
            field: 'size',
            error: row.size.error!,
            rows: []
          }
        }
        acc[key].rows.push(index)
      }

      // Controlla errori gruppo taglie
      if (!row.size_group.valid) {
        const key = `size_group-${row.size_group.error}`
        if (!acc[key]) {
          acc[key] = {
            field: 'size_group',
            error: row.size_group.error!,
            rows: []
          }
        }
        acc[key].rows.push(index)
      }

      return acc
    }, {} as Record<string, ErrorItem>)
  }, [previewData])

  const cleanArticleCode = (code: string, forComparison = false) => {
    // Rimuove tutti i caratteri speciali e spazi per il confronto
    if (forComparison) {
      return code.replace(/[-\/.\\s]/g, '').toUpperCase()
    }
    // Sostituisce / e . con - per il salvataggio
    return code.replace(/[/.]/g, '-').replace(/\s+/g, '').toUpperCase()
  }

  const handleUpload = async () => {
    setIsLoading(true)
    setUploadProgress(0)

    try {
      const productsToImport = previewData.map(row => ({
        article_code: cleanArticleCode(row.article_code),
        variant_code: row.variant_code,
        size_id: row.size.id,
        size_group_id: row.size_group.id,
        brand_id: brandSource === 'excel' 
          ? (row.brand?.id || null)
          : selectedBrand,
        wholesale_price: row.wholesale_price,
        retail_price: row.retail_price || null,
        status: selectedStatus
      }))

      const response = await fetch('/api/products/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: productsToImport })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Errore durante l\'importazione')
      }

      const results = await response.json()

      // Genera il report CSV
      const csvContent = generateCSVReport(results)
      downloadCSV(csvContent, 'report_importazione.csv')

      await refreshData()
      onClose()

      // Mostra il risultato
      const successCount = results.filter((r: any) => r.status === 'success').length
      const duplicateCount = results.filter((r: any) => r.status === 'Duplicato').length
      const errorCount = results.filter((r: any) => r.status === 'error').length

      toast.success(
        `Importazione completata: ${successCount} prodotti creati, ${duplicateCount} duplicati, ${errorCount} errori`
      )
    } catch (error) {
      console.error('Errore durante l\'importazione:', error)
      toast.error('Errore durante l\'importazione')
    } finally {
      setIsLoading(false)
    }
  }

  // Funzione per generare il contenuto CSV
  const generateCSVReport = (results: any[]) => {
    const headers = ['Stato', 'Messaggio', 'Codice Articolo', 'Codice Variante', 'Taglia', 'Gruppo Taglie', 'Brand', 'Prezzo Ingrosso', 'Prezzo Dettaglio']
    const rows = results.map(r => {
      // Trova il nome della taglia
      const size = sizes.find(s => s.id === r.size)?.name || r.size
      // Trova il nome del gruppo taglie
      const sizeGroup = sizeGroups.find(g => g.id === r.size_group)?.name || r.size_group
      // Trova il nome del brand
      const brand = brands.find(b => b.id === r.brand_id)?.name || r.brand_id

      return [
        r.status,
        r.message || '',
        r.article_code,
        r.variant_code,
        size,
        sizeGroup,
        brand,
        r.wholesale_price,
        r.retail_price || ''
      ]
    })
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  // Funzione per scaricare il CSV
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleBrandCorrection = (originalBrand: string, correctedBrandId: string) => {
    setBrandCorrections(prev => ({
      ...prev,
      [originalBrand]: correctedBrandId
    }))
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose} className="max-w-full">
        <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {isPreviewMode ? 'Anteprima Importazione' : 'Importazione Massiva Prodotti'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-hidden">
            {!isPreviewMode ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Scegli File
                  </Button>
                  {file && (
                    <div className="flex items-center gap-2">
                      <span>{file.name}</span>
                      <Button variant="ghost" size="icon" onClick={handleCancel}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {isMapping && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Mappa le colonne</h3>
                    <p className="text-sm text-gray-500">
                      * I campi contrassegnati con asterisco sono obbligatori
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Brand *</Label>
                        <Select 
                          onValueChange={(value) => {
                            if (value === 'excel') {
                              setBrandSource('excel')
                            } else {
                              setBrandSource('db')
                              setSelectedBrand(value)
                            }
                          }}
                          value={brandSource === 'excel' ? 'excel' : selectedBrand}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona brand" />
                          </SelectTrigger>
                          <SelectContent>
                            {brands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="excel">Da Excel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {brandSource === 'excel' && (
                        <div>
                          <Label>Colonna Brand</Label>
                          <Select 
                            onValueChange={(value) => handleColumnMappingChange('brand', value)}
                            value={columnMapping.brand || 'none'}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona colonna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Non mappare</SelectItem>
                              {fileHeaders.map((header) => (
                                <SelectItem key={header} value={header}>{header}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div>
                        <Label>Stato Prodotti *</Label>
                        <Select 
                          onValueChange={setSelectedStatus}
                          value={selectedStatus}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona stato" />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {productAttributes.map((attribute) => {
                      const isRequired = attribute !== 'retail_price'
                      if (attribute === 'article_code') {
                        const articleMapping = columnMapping[attribute] as { primary: string; secondary?: string } || { primary: '' }
                        return (
                          <div key={attribute} className="space-y-2">
                            <Label>
                              CODICE ARTICOLO {isRequired && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm text-gray-500">Campo Primario</Label>
                                <Select 
                                  onValueChange={(value) => handleColumnMappingChange(attribute, value)}
                                  value={articleMapping.primary || 'none'}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleziona campo primario" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Non mappare</SelectItem>
                                    {fileHeaders.map((header) => (
                                      <SelectItem key={header} value={header}>{header}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-sm text-gray-500">Campo Secondario (opzionale)</Label>
                                <Select 
                                  onValueChange={(value) => handleColumnMappingChange(attribute, value, true)}
                                  value={articleMapping.secondary || 'none'}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleziona campo secondario" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Non mappare</SelectItem>
                                    {fileHeaders.map((header) => (
                                      <SelectItem key={header} value={header}>{header}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return (
                        <div key={attribute} className="grid grid-cols-2 items-center gap-4">
                          <Label htmlFor={attribute}>
                            {attribute.replace('_', ' ').toUpperCase()}
                            {isRequired && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          <Select 
                            onValueChange={(value) => handleColumnMappingChange(attribute, value)}
                            value={columnMapping[attribute] || 'none'}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Seleziona colonna per ${attribute}`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Non mappare</SelectItem>
                              {fileHeaders.map((header) => (
                                <SelectItem key={header} value={header}>{header}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )
                    })}

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                      >
                        Annulla
                      </Button>
                      <Button
                        onClick={handlePreview}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Elaborazione...
                          </>
                        ) : (
                          'Anteprima'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <ScrollArea className="flex-1 border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CODICE ARTICOLO</TableHead>
                        <TableHead>CODICE VARIANTE</TableHead>
                        <TableHead>TAGLIA</TableHead>
                        <TableHead>GRUPPO TAGLIE</TableHead>
                        <TableHead>PREZZO INGROSSO</TableHead>
                        <TableHead>PREZZO DETTAGLIO</TableHead>
                        <TableHead>STATO</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.article_code}</TableCell>
                          <TableCell>{row.variant_code}</TableCell>
                          <TableCell>
                            <span className={!row.size.valid ? "text-red-500" : ""}>
                              {row.size.name}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={!row.size_group.valid ? "text-red-500" : ""}>
                              {row.size_group.name}
                            </span>
                          </TableCell>
                          <TableCell>€ {row.wholesale_price.toFixed(2)}</TableCell>
                          <TableCell>
                            {row.retail_price ? `€ ${row.retail_price.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell>
                            {row.errors ? (
                              <div className="text-red-500">
                                {row.errors.map((error, i) => (
                                  <div key={i}>{error}</div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-green-500">Valido</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                <div className="flex justify-between items-center pt-4">
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                    >
                      Indietro
                    </Button>
                    {previewData.some(row => row.errors && row.errors.length > 0) && (
                      <Button
                        variant="secondary"
                        onClick={() => setIsErrorDialogOpen(true)}
                      >
                        Correggi Errori ({previewData.filter(row => row.errors && row.errors.length > 0).length})
                      </Button>
                    )}
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                    >
                      Annulla
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={isLoading || previewData.some(row => row.errors)}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Caricamento {uploadProgress}%
                        </>
                      ) : (
                        'Importa'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Gestione Errori</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CAMPO</TableHead>
                  <TableHead>ERRORE</TableHead>
                  <TableHead>RIGHE INTERESSATE</TableHead>
                  <TableHead>CORREZIONE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(groupedErrors).map((error, index) => (
                  <TableRow key={index}>
                    <TableCell>{error.field}</TableCell>
                    <TableCell>{error.error}</TableCell>
                    <TableCell>{error.rows.length}</TableCell>
                    <TableCell>
                      {error.field === 'brand' ? (
                        <Select 
                          onValueChange={(value) => {
                            const selectedBrand = brands.find(b => b.id === value)
                            if (selectedBrand) {
                              handleCorrection(
                                'brand', 
                                error.error, 
                                selectedBrand.name, 
                                selectedBrand.id
                              )
                            }
                          }}
                          value={corrections.find(c => 
                            c.field === 'brand' && 
                            c.error === error.error
                          )?.id?.toString() || ''}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona brand" />
                          </SelectTrigger>
                          <SelectContent>
                            {brands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id.toString()}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : error.field === 'size' ? (
                        <Select 
                          onValueChange={(value) => {
                            const selectedSize = sizes.find(s => s.name === value)
                            if (selectedSize) {
                              handleCorrection('size', error.error, selectedSize.name, selectedSize.id)
                            }
                          }}
                          value={corrections.find(c => c.field === 'size' && c.error === error.error)?.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona taglia" />
                          </SelectTrigger>
                          <SelectContent>
                            {sizes.map((size) => (
                              <SelectItem key={size.id} value={size.name}>
                                {size.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : error.field === 'size_group' ? (
                        <Select 
                          onValueChange={(value) => {
                            const selectedGroup = sizeGroups.find(g => g.name === value)
                            if (selectedGroup) {
                              handleCorrection('size_group', error.error, selectedGroup.name, selectedGroup.id)
                            }
                          }}
                          value={corrections.find(c => c.field === 'size_group' && c.error === error.error)?.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona gruppo taglie" />
                          </SelectTrigger>
                          <SelectContent>
                            {sizeGroups.map((group) => (
                              <SelectItem key={group.id} value={group.name}>
                                {group.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsErrorDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={applyCorrections}>
              Applica Correzioni
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 