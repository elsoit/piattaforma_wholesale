import { useState } from 'react';
import { Progress } from '@/components/ui/progress'; // Assumendo che usi shadcn/ui

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export function FileUploader() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      setProgress({ loaded: 0, total: file.size, percentage: 0 });

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!response.ok) throw new Error('Failed to get upload URL');
      
      const { uploadUrl, key } = await response.json();

      // Upload diretto al Worker
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      const result = await uploadResponse.json();
      return result;

    } catch (error) {
      console.error('Errore upload:', error);
      throw error;
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
          file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700
          hover:file:bg-violet-100"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            try {
              const result = await handleUpload(file);
              console.log('File caricato:', result);
            } catch (error) {
              console.error('Errore:', error);
            }
          }
        }}
        disabled={uploading}
      />
      
      {progress && (
        <div className="w-full space-y-2">
          <Progress value={progress.percentage} className="w-full" />
          <div className="text-sm text-gray-500">
            {Math.round(progress.loaded / 1024 / 1024)}MB / {Math.round(progress.total / 1024 / 1024)}MB
          </div>
        </div>
      )}
    </div>
  );
} 