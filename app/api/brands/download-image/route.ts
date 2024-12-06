import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL immagine non fornito' },
        { status: 400 }
      )
    }

    // Download dell'immagine
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error('Errore nel download dell\'immagine')
    }

    const buffer = await imageResponse.arrayBuffer()
    const fileExtension = path.extname(imageUrl) || '.jpg'
    const fileName = `${uuidv4()}${fileExtension}`
    
    // Assicurati che la directory esista
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const filePath = path.join(uploadDir, fileName)
    fs.writeFileSync(filePath, Buffer.from(buffer))

    return NextResponse.json({ 
      fileUrl: `/uploads/${fileName}` 
    })

  } catch (error) {
    console.error('Errore nel download dell\'immagine:', error)
    return NextResponse.json(
      { error: 'Errore nel download dell\'immagine' },
      { status: 500 }
    )
  }
} 