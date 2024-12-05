'use client'

import { useState, useEffect, useRef } from 'react'
import { FileIcon, DownloadIcon, DownloadCloudIcon, ChevronLeft, ChevronRight, FileSpreadsheet, FileArchive, FileImage, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { read, utils } from 'xlsx'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CatalogoFile {
  id: number
  filename: string
  file_url: string
  file_type: string
  description?: string
  created_at: string
}

interface CatalogoFilesProps {
  catalogoId: number
  hasNotesOrConditions?: boolean
}

interface ExcelData {
  headers: string[]
  rows: any[][]
  images?: {
    src: string
    position: string
  }[]
}

interface PreviewResponse {
  success: boolean
  previewUrl: string | null
}

export function CatalogoFiles({ catalogoId, hasNotesOrConditions = false }: CatalogoFilesProps) {
  const [files, setFiles] = useState<CatalogoFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<CatalogoFile | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0)
  const [excelData, setExcelData] = useState<ExcelData | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [accordionHeight, setAccordionHeight] = useState(0)

  const accordionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (hasNotesOrConditions && accordionRef.current) {
      const updateHeight = () => {
        const height = accordionRef.current?.offsetHeight || 0
        setAccordionHeight(height)
      }

      const resizeObserver = new ResizeObserver(updateHeight)
      resizeObserver.observe(accordionRef.current)

      return () => {
        if (accordionRef.current) {
          resizeObserver.unobserve(accordionRef.current)
        }
      }
    }
  }, [hasNotesOrConditions])

  const handlePrevious = async () => {
    try {
      if (currentFileIndex > 0) {
        const newIndex = currentFileIndex - 1
        setCurrentFileIndex(newIndex)
        const newFile = files[newIndex]
        setSelectedFile(newFile)
        
        // Se il file non è visualizzabile, non richiedere l'anteprima
        if (!isPreviewable(newFile.filename)) {
          setPreviewUrl(null)
          return
        }
        
        // Richiedi l'anteprima solo per PDF e immagini
        const preview = await getPreview(newFile.id)
        if (preview) {
          setPreviewUrl(preview)
        }
      }
    } catch (err) {
      console.error('Errore nella navigazione:', err)
      setError(err instanceof Error ? err.message : 'Errore nella navigazione')
    }
  }

  const handleNext = async () => {
    try {
      if (currentFileIndex < files.length - 1) {
        const newIndex = currentFileIndex + 1
        setCurrentFileIndex(newIndex)
        const newFile = files[newIndex]
        setSelectedFile(newFile)
        
        // Se il file non è visualizzabile, non richiedere l'anteprima
        if (!isPreviewable(newFile.filename)) {
          setPreviewUrl(null)
          return
        }
        
        // Richiedi l'anteprima solo per PDF e immagini
        const preview = await getPreview(newFile.id)
        if (preview) {
          setPreviewUrl(preview)
        }
      }
    } catch (err) {
      console.error('Errore nella navigazione:', err)
      setError(err instanceof Error ? err.message : 'Errore nella navigazione')
    }
  }

  // Aggiungiamo la navigazione con tastiera
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!viewerOpen) return
      
      if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewerOpen, currentFileIndex, files.length])

  const isExcel = (filename: string) => {
    const ext = filename.toLowerCase()
    return ext.endsWith('.xlsx') || ext.endsWith('.xls')
  }

  const isPDF = (filename: string) => {
    return filename.toLowerCase().endsWith('.pdf')
  }

  const isImage = (filename: string) => {
    const ext = filename.toLowerCase()
    return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || 
           ext.endsWith('.png') || ext.endsWith('.gif')
  }

  const loadFile = async (file: CatalogoFile) => {
    if (!file) return
    
    if (isExcel(file.filename)) {
      try {
        setExcelData(null) // Reset dei dati Excel precedenti
        
        // Richiedi URL firmato
        const previewResponse = await fetch(`/api/files/${file.id}/preview`, {
          method: 'POST'
        })
        
        if (!previewResponse.ok) {
          throw new Error('Errore nel recupero del file temporaneo')
        }
        
        const data = await previewResponse.json() as PreviewResponse
        if (!data.success || !data.previewUrl) {
          throw new Error('Risposta preview non valida')
        }

        // Scarica il file Excel
        const response = await fetch(data.previewUrl)
        if (!response.ok) {
          throw new Error('Errore nel download del file Excel')
        }
        
        const blob = await response.blob()
        const buffer = await blob.arrayBuffer()
        
        // Leggi il file Excel
        const workbook = read(buffer, { 
          type: 'buffer',
          cellDates: true,
          cellNF: false,
          cellText: false
        })
        
        if (!workbook.SheetNames.length) {
          throw new Error('Il file Excel non contiene fogli')
        }
        
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = utils.sheet_to_json(firstSheet, { 
          header: 1,
          raw: true,
          dateNF: 'DD/MM/YYYY'
        })
        
        if (!Array.isArray(jsonData) || !jsonData.length) {
          throw new Error('Nessun dato trovato nel file Excel')
        }
        
        setExcelData({
          headers: jsonData[0] as string[],
          rows: jsonData.slice(1) as any[][],
          images: undefined
        })

      } catch (error) {
        console.error('Errore nel caricamento del file Excel:', error)
        setError(error instanceof Error ? error.message : 'Errore nel caricamento del file Excel')
      }
    }
  }

  const getPreview = async (fileId: number): Promise<string | null> => {
    try {
      const response = await fetch(`/api/files/${fileId}/preview`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Errore nel recupero dell\'anteprima')
      
      const data = await response.json() as PreviewResponse
      return data.previewUrl || null
    } catch (err) {
      console.error('Errore nel recupero dell\'anteprima:', err)
      setError('Errore nel caricamento dell\'anteprima')
      return null
    }
  }

  const isPreviewable = (filename: string) => {
    const ext = filename.toLowerCase()
    return ext.endsWith('.pdf') || ext.endsWith('.jpg') || ext.endsWith('.jpeg') || 
           ext.endsWith('.png') || ext.endsWith('.gif')
  }

  const getCorrectUrl = (url: string) => {
    // Rimuovi eventuali doppi https//
    return url.replace('https//https//', 'https://')
              .replace('https//', 'https://')
              .replace(/([^:]\/)\/+/g, "$1") // Rimuove slash doppi eccetto dopo il colon
  }

  const handleFileClick = async (file: CatalogoFile) => {
    try {
      setError(null)
      const index = files.findIndex(f => f.id === file.id)
      setCurrentFileIndex(index)
      setSelectedFile(file)
      setViewerOpen(true)
      
      // Se il file non è visualizzabile, non richiedere l'anteprima
      if (!isPreviewable(file.filename)) {
        setPreviewUrl(null)
        return
      }
      
      // Richiedi l'anteprima solo per PDF e immagini
      const preview = await getPreview(file.id)
      if (preview) {
        setPreviewUrl(getCorrectUrl(preview))
      }
    } catch (err) {
      console.error('Errore nel caricamento del file:', err)
      setError(err instanceof Error ? err.message : 'Errore nel caricamento del file')
    }
  }

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch(`/api/cataloghi/${catalogoId}/files`)
        if (!response.ok) throw new Error('Errore nel recupero dei file')
        
        const data = await response.json()
        if (!Array.isArray(data)) throw new Error('Formato dati non valido')
        
        setFiles(data as CatalogoFile[])
      } catch (err) {
        console.error('Errore:', err)
        setError(err instanceof Error ? err.message : 'Errore nel caricamento dei file')
      } finally {
        setLoading(false)
      }
    }

    fetchFiles()
  }, [catalogoId])

  const handleDownloadAll = async () => {
    try {
      setDownloading(true)
      setError(null)
      
      const response = await fetch(`/api/cataloghi/${catalogoId}/download-all`, {
        method: 'GET',
      })
      
      // Controlla se la risposta è un JSON (errore) o un blob (file zip)
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        const errorData = await response.json() as { error: string }
        throw new Error(errorData.error || 'Errore nel download dei file')
      }
      
      if (!response.ok) {
        throw new Error('Errore nel download dei file')
      }

      const blob = await response.blob()
      
      // Ottieni il nome del file dall'header Content-Disposition
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `catalogo-${catalogoId}-files.zip`
      if (contentDisposition) {
        const matches = /filename="(.+)"/.exec(contentDisposition)
        if (matches && matches[1]) {
          filename = matches[1]
        }
      }

      // Crea un link temporaneo per il download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Errore nel download:', err)
      setError(err instanceof Error ? err.message : 'Errore nel download dei file')
    } finally {
      setDownloading(false)
    }
  }

  const handleDownload = async (file: CatalogoFile, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(`/api/files/${file.id}/preview`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Errore nel recupero del link di download')
      }
      
      const data = await response.json() as PreviewResponse
      if (data.success && data.previewUrl) {
        // Apri in una nuova scheda
        window.open(data.previewUrl, '_blank')
      } else {
        throw new Error('Link di download non valido')
      }
    } catch (err) {
      console.error('Errore nel download:', err)
      setError(err instanceof Error ? err.message : 'Errore nel download del file')
    }
  }

  const renderFilePreview = () => {
    if (!selectedFile) return null
    if (previewLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )
    }

    if (!isPreviewable(selectedFile.filename)) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          {isExcel(selectedFile.filename) ? (
            <FileSpreadsheet className="h-24 w-24 text-gray-400 mb-4" />
          ) : (
            <FileArchive className="h-24 w-24 text-gray-400 mb-4" />
          )}
          <p className="text-gray-500 mb-4">File non disponibile per l'anteprima</p>
          <Button
            onClick={(e) => handleDownload(selectedFile, e)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            <DownloadIcon className="h-4 w-4" />
            <span>Download</span>
          </Button>
        </div>
      )
    }

    if (isPDF(selectedFile.filename)) {
      const url = previewUrl ? getCorrectUrl(previewUrl) : getCorrectUrl(selectedFile.file_url)
      return (
        <iframe
          src={`${url}#toolbar=1&navpanes=1`}
          className="w-full h-full"
          title={selectedFile.filename}
        />
      )
    }

    if (isImage(selectedFile.filename)) {
      return (
        <div className="flex items-center justify-center h-full">
          <img 
            src={previewUrl ? getCorrectUrl(previewUrl) : getCorrectUrl(selectedFile.file_url)} 
            alt={selectedFile.filename}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )
    }
  }

  // Reset previewUrl quando si chiude il viewer
  useEffect(() => {
    if (!viewerOpen) {
      setPreviewUrl(null)
    }
  }, [viewerOpen])

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase()
    
    if (ext.endsWith('.pdf')) {
      return <File className="h-4 w-4 flex-shrink-0 text-gray-500" />
    }
    
    if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) {
      return <FileSpreadsheet className="h-4 w-4 flex-shrink-0 text-gray-500" />
    }
    
    if (ext.endsWith('.zip') || ext.endsWith('.rar') || ext.endsWith('.7z')) {
      return <FileArchive className="h-4 w-4 flex-shrink-0 text-gray-500" />
    }
    
    if (ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || ext.endsWith('.gif')) {
      return <FileImage className="h-4 w-4 flex-shrink-0 text-gray-500" />
    }
    
    return <FileIcon className="h-4 w-4 flex-shrink-0 text-gray-500" />
  }

  if (loading) return <div className="text-sm text-gray-500">Caricamento file...</div>
  if (error) return <div className="text-sm text-red-500">{error}</div>
  if (files.length === 0) return <div className="text-sm text-gray-500">Nessun file disponibile</div>

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h4 className="text-sm font-medium text-gray-700">
          File disponibili: ({files.length})
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadAll}
          disabled={downloading}
          className="ml-2"
        >
          {downloading ? (
            <DownloadCloudIcon className="h-4 w-4 animate-bounce" />
          ) : (
            <DownloadCloudIcon className="h-4 w-4" />
          )}
          <span className="ml-1 text-xs">Scarica tutti</span>
        </Button>
      </div>

      <div 
        className="space-y-2 overflow-y-auto pr-2 md:max-h-[500px]"
      
      >
        {files.map((file) => (
          <div 
            key={file.id} 
            className="flex items-center justify-between p-2 bg-gray-50 rounded-md text-sm hover:bg-gray-100 cursor-pointer group"
            onClick={() => handleFileClick(file)}
          >
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              {getFileIcon(file.filename)}
              <span className="truncate" title={file.filename}>
                {file.filename}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleDownload(file, e)}
              title={file.description || 'Scarica file'}
              className="flex-shrink-0 ml-2"
            >
              <DownloadIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] sm:h-[90vh] p-2 sm:p-4 rounded-t-lg sm:rounded-lg flex flex-col">
          <DialogHeader className="mb-1 sm:mb-2 flex flex-row items-center justify-between flex-shrink-0">
            <DialogTitle className="text-lg sm:text-xl truncate max-w-[calc(100%-200px)]">
              {selectedFile?.filename}
            </DialogTitle>
            <div className="flex items-center gap-4 mr-8 md:mr-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => selectedFile && handleDownload(selectedFile, e)}
                className="flex items-center gap-2"
              >
                <DownloadIcon className="h-4 w-4" />
                <span>Download</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="relative flex-1 min-h-0 overflow-hidden">
            <div className="relative h-full w-full overflow-hidden">
              {renderFilePreview()}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 py-2 px-4 bg-black/20 backdrop-blur-sm rounded-full">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevious}
                  disabled={currentFileIndex === 0}
                  className="h-8 w-8 bg-white/70"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-500">
                  {currentFileIndex + 1} / {files.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNext}
                  disabled={currentFileIndex === files.length - 1}
                  className="h-8 w-8 bg-white/70"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 