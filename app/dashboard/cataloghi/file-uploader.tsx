'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Upload, File, Edit2, Image } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Progress } from "@/components/ui/progress"

interface FileData {
  id: number;
  nome: string;
  description: string | null;
  tipo: string;
  file_url: string;
  key: string;
  created_at: string;
  updated_at: string;
  catalogo_nome: string;
}

interface ApiResponse {
  success: boolean;
  data: FileData[];
}

interface FileUploaderProps {
  catalogoId: number
  files: any[]
  onUpdate: () => void
}

// Aggiungi questa funzione per troncare il nome del file
const truncateFileName = (fileName: string, maxLength: number = 30) => {
  if (fileName.length <= maxLength) return fileName;
  
  const extension = fileName.slice(fileName.lastIndexOf('.'));
  const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.'));
  
  const truncatedName = nameWithoutExt.slice(0, maxLength - extension.length - 3) + '...';
  return truncatedName + extension;
}

export function FileUploader({ catalogoId, files, onUpdate }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [existingFiles, setExistingFiles] = useState<FileData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingFile, setEditingFile] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({ nome: '', description: '' })
  const [activeTab, setActiveTab] = useState('all')
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [overallProgress, setOverallProgress] = useState(0)

  useEffect(() => {
    console.log('FileUploader mounted with catalogoId:', catalogoId)
  }, [catalogoId])

  useEffect(() => {
    if (catalogoId) {
      fetchExistingFiles()
    }
  }, [catalogoId])

  const fetchExistingFiles = async () => {
    try {
      const response = await fetch(`/api/admin/cataloghi/${catalogoId}/files`)
      const result: ApiResponse = await response.json()
      
      if (result.success) {
        setExistingFiles(result.data)
      } else {
        console.error('Errore nel caricamento dei file:', result.error)
      }
    } catch (error) {
      console.error('Errore nel caricamento dei file:', error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles(Array.from(e.target.files))
      setError(null)
      setSuccess(null)
    }
  }

  const uploadFiles = async () => {
    if (newFiles.length === 0) return;

    try {
      setUploading(true);
      setError(null);
      setUploadProgress({});
      setOverallProgress(0);

      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        console.log('Iniziando upload per:', file.name);

        // Aggiorna il progresso per questo file
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 0
        }));

        // 1. Carica il file su Cloudflare R2
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('/api/admin/cataloghi/files/upload', {
          method: 'POST',
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error('Errore nel caricamento del file');
        }

        // Aggiorna il progresso per questo file
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 50
        }));

        const { url, key } = await uploadResponse.json();

        // 2. Salva il riferimento nel database
        const dbFormData = new FormData();
        dbFormData.append('nome', file.name);
        dbFormData.append('file_url', url);
        dbFormData.append('key', key);
        dbFormData.append('tipo', file.type.startsWith('image/') ? 'image' : 'document');

        const dbResponse = await fetch(`/api/admin/cataloghi/${catalogoId}/files`, {
          method: 'POST',
          body: dbFormData
        });

        if (!dbResponse.ok) {
          throw new Error('Errore nel salvataggio del riferimento file');
        }

        // Completa il progresso per questo file
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 100
        }));

        // Aggiorna il progresso complessivo
        setOverallProgress(((i + 1) / newFiles.length) * 100);

        console.log('File caricato con successo:', file.name);
      }

      setSuccess('File caricati con successo');
      setNewFiles([]);
      fetchExistingFiles();

    } catch (error) {
      console.error('Errore nel caricamento:', error);
      setError(error instanceof Error ? error.message : 'Errore nel caricamento');
    } finally {
      setUploading(false);
      setUploadProgress({});
      setOverallProgress(0);
    }
  };

  const deleteFile = async (fileId: number) => {
    try {
      const dbResponse = await fetch(`/api/admin/cataloghi/${catalogoId}/files/${fileId}`, {
        method: 'DELETE'
      });

      if (!dbResponse.ok) {
        const error = await dbResponse.json();
        throw new Error(error.error || 'Errore nell\'eliminazione del file');
      }

      setSuccess('File eliminato con successo');
      fetchExistingFiles();
    } catch (error) {
      console.error('Errore nell\'eliminazione del file:', error);
      setError(error instanceof Error ? error.message : 'Errore nell\'eliminazione del file');
    }
  };

  const handleEdit = (file: any) => {
    setEditingFile(file)
    setEditForm({
      nome: file.nome || '',
      description: file.description || ''
    })
    setIsEditDialogOpen(true)
  }

  const saveFileEdit = async () => {
    try {
      const response = await fetch(`/api/admin/cataloghi/${catalogoId}/files/${editingFile.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) throw new Error('Errore nell\'aggiornamento del file')

      setSuccess('File aggiornato con successo')
      setIsEditDialogOpen(false)
      fetchExistingFiles()
    } catch (error) {
      console.error('Errore nell\'aggiornamento del file:', error)
      setError('Errore nell\'aggiornamento del file')
    }
  }

  // Funzione per determinare se un file è un'immagine
  const isImage = (fileName: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return imageExtensions.includes(ext)
  }

  // Filtra i file in base al tab attivo
  const filteredFiles = existingFiles.filter(file => {
    if (activeTab === 'all') return true
    if (activeTab === 'images') return isImage(file.nome)
    if (activeTab === 'documents') return !isImage(file.nome)
    return true
  })

  const renderFileList = () => (
    <div className="space-y-2">
      {filteredFiles.map((file) => (
        <div key={file.id} className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isImage(file.nome) ? (
              <Image className="h-4 w-4 flex-shrink-0" />
            ) : (
              <File className="h-4 w-4 flex-shrink-0" />
            )}
            <a 
              href={file.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm hover:underline truncate"
              title={file.nome}
            >
              {truncateFileName(file.nome)}
            </a>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(file)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteFile(file.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )

  console.log('CatalogoId nel FileUploader:', catalogoId)
  console.log('Tipo di catalogoId:', typeof catalogoId)

  return (
    <div className="space-y-4">
      

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Tutti i File</TabsTrigger>
          <TabsTrigger value="images">Immagini</TabsTrigger>
          <TabsTrigger value="documents">Documenti</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="flex-1"
                />
                <Button
                  onClick={uploadFiles}
                  disabled={newFiles.length === 0 || uploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? 'Caricamento...' : 'Carica'}
                </Button>
              </div>
              
              {newFiles.length > 0 && (
                <div className="border rounded-md p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">File selezionati ({newFiles.length})</h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setNewFiles([])}
                      disabled={uploading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {newFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {file.type.startsWith('image/') ? (
                            <Image className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <File className="h-4 w-4 flex-shrink-0" />
                          )}
                          <span className="truncate" title={file.name}>
                            {truncateFileName(file.name)}
                          </span>
                          <span className="text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          {uploading && uploadProgress[file.name] !== undefined && (
                            <div className="w-24">
                              <Progress value={uploadProgress[file.name]} className="h-2" />
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newFileList = [...newFiles];
                              newFileList.splice(index, 1);
                              setNewFiles(newFileList);
                            }}
                            disabled={uploading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {uploading && (
                    <div className="pt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progresso totale</span>
                        <span>{Math.round(overallProgress)}%</span>
                      </div>
                      <Progress value={overallProgress} className="h-2" />
                    </div>
                  )}
                </div>
              )}
            </div>
            {filteredFiles.length > 0 && renderFileList()}
          </div>
        </TabsContent>

        <TabsContent value="images" className="mt-4">
          <div className="space-y-4">
            {filteredFiles.length > 0 && renderFileList()}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <div className="space-y-4">
            {filteredFiles.length > 0 && renderFileList()}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={editForm.nome}
                onChange={(e) => setEditForm(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={saveFileEdit}>
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
    </div>
  )
} 