import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nessun file caricato' },
        { status: 400 }
      )
    }

    // Verifica il tipo di file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Il file deve essere un\'immagine' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = Date.now() + '_' + file.name.replace(/\s+/g, '-')
    
    // Salva il file nella cartella public/uploads
    const uploadDir = path.join(process.cwd(), 'public/uploads')
    await writeFile(path.join(uploadDir, filename), buffer)
    
    // Restituisci l'URL relativo
    const fileUrl = `/uploads/${filename}`
    
    return NextResponse.json({ url: fileUrl })
  } catch (error) {
    console.error('Errore nel caricamento del file:', error)
    return NextResponse.json(
      { error: 'Errore nel caricamento del file' },
      { status: 500 }
    )
  }
} 