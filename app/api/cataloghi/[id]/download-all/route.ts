import { NextRequest, NextResponse } from 'next/server'
import { downloadAndZipFiles } from '@/lib/file-helpers'
import { createErrorResponse } from '@/types/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const catalogoId = await params.id
    
    const { zipContent, filename } = await downloadAndZipFiles(catalogoId)

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(zipContent))
        controller.close()
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Transfer-Encoding': 'chunked'
      }
    })

  } catch (error) {
    console.error('Errore nel download dei file:', error)
    return NextResponse.json(
      createErrorResponse(error instanceof Error ? error.message : 'Errore nel download dei file'),
      { status: 500 }
    )
  }
}