'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, File, Image, Trash2, Download, FileSpreadsheet, FileArchive, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface FileListProps {
  id: number
  type: 'all' | 'images' | 'documents'
  onUpdate: () => void
}

interface CatalogoFile {
  id: number
  nome: string
  file_url: string
  tipo: string
  description: string
  created_at: string
  catalogo_id: number
}

interface FileDetailsFormProps {
  file: File
  onSubmit: (details: { nome: string; description: string }) => void
  onCancel: () => void
}

function FileDetailsForm({ file, onSubmit, onCancel }: FileDetailsFormProps) {
  const [nome, setNome] = useState(file.name)
  const [description, setDescription] = useState('')

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome file</Label>
        <Input
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome del file"
        />
      </div>
      
      <div>
        <Label htmlFor="description">Descrizione</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrizione del file"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Annulla
        </Button>
        <Button onClick={() => onSubmit({ nome, description })}>
          Carica
        </Button>
      </div>
    </div>
  )
}

const getFileIcon = (nome: string | undefined, tipo: string) => {
  console.log('getFileIcon chiamata con:', { nome, tipo })
  
  if (tipo === 'image') {
    return <Image className="h-5 w-5 text-blue-500" />
  }
  
  if (!nome) {
    return <File className="h-5 w-5 text-gray-500" />
  }
  
  const extension = nome.toLowerCase().split('.').pop()
  
  switch (extension) {
    case 'pdf':
      return <FileText className="h-5 w-5 text-red-500" />
    case 'xlsx':
    case 'xls':
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />
    case 'zip':
    case 'rar':
    case '7z':
      return <FileArchive className="h-5 w-5 text-yellow-500" />
    default:
      return <File className="h-5 w-5 text-gray-500" />
  }
}

export function FileList({ id, type, onUpdate }: FileListProps) {
  const [files, setFiles] = useState<CatalogoFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  const fetchFiles = async () => {
    if (!id) return
    
    try {
      const response = await fetch(`/api/admin/cataloghi/${id}/files?type=${type}`)
      const data = await response.json()
      setFiles(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Errore dettagliato:', err)
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei file')
    }
  }

  useEffect(() => {
    console.log('FileList mounted/updated:', { id, type })
    fetchFiles()
  }, [id, type])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log('File selected:', file.name)
      setSelectedFile(file)
      setShowDetailsDialog(true)
    }
  }

  const handleFileUpload = async (details: { nome: string; description: string }) => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);

      // 1. Carica il file su Cloudflare R2
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('nome', details.nome);
      formData.append('description', details.description);

      const uploadResponse = await fetch('/api/admin/cataloghi/files/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Errore nel caricamento del file');
      }

      const { url, key } = await uploadResponse.json();

      // 2. Salva il riferimento nel database
      const dbFormData = new FormData();
      dbFormData.append('nome', details.nome);
      dbFormData.append('description', details.description);
      dbFormData.append('file_url', url);
      dbFormData.append('key', key);
      dbFormData.append('tipo', selectedFile.type.startsWith('image/') ? 'image' : 'document');

      const dbResponse = await fetch(`/api/admin/cataloghi/${id}/files`, {
        method: 'POST',
        body: dbFormData
      });

      if (!dbResponse.ok) {
        throw new Error('Errore nel salvataggio del riferimento file');
      }

      setShowDetailsDialog(false);
      setSelectedFile(null);
      await fetchFiles();
      onUpdate();
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Errore nel caricamento');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo file?')) return;

    try {
      setError(null);
      
      // 1. Ottieni i dettagli del file per avere la key R2
      const fileResponse = await fetch(`/api/admin/cataloghi/${id}/files/${fileId}`);
      const fileDetails = await fileResponse.json();

      // 2. Elimina da R2
      if (fileDetails.key) {
        const r2Response = await fetch(`${fileDetails.file_url}`, {
          method: 'DELETE',
        });
        
        if (!r2Response.ok) {
          throw new Error('Failed to delete from R2');
        }
      }

      // 3. Elimina dal database
      const dbResponse = await fetch(`/api/admin/cataloghi/${id}/files/${fileId}`, {
        method: 'DELETE'
      });

      if (!dbResponse.ok) {
        throw new Error('Failed to delete file reference');
      }

      await fetchFiles();
      onUpdate();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione del file');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          {uploading ? 'Caricamento...' : 'Carica File'}
          <Upload className="ml-2 h-4 w-4" />
        </Button>
        <Input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dettagli del file</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <FileDetailsForm
              file={selectedFile}
              onSubmit={handleFileUpload}
              onCancel={() => {
                setSelectedFile(null)
                setShowDetailsDialog(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {files.map((file) => (
          <div 
            key={file.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              {getFileIcon(file.nome, file.tipo)}
              <div>
                <span className="text-sm font-medium">{file.nome}</span>
                {file.description && (
                  <p className="text-xs text-gray-500">{file.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => window.open(file.file_url, '_blank')}
              >
                <Download className="h-4 w-4 text-gray-500" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(file.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}

        {files.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-md">
            Nessun file caricato
          </div>
        )}
      </div>
    </div>
  )
} 