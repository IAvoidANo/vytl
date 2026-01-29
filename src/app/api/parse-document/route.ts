import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()
    let content = ''

    console.log(`[parse-document] Processing: ${file.name} (${file.size} bytes)`)

    if (fileName.endsWith('.pdf')) {
      try {
        // Dynamic import pdf-parse - use require for CommonJS compatibility
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string; numpages: number }>
        const buffer = Buffer.from(await file.arrayBuffer())
        console.log(`[parse-document] PDF buffer created: ${buffer.length} bytes`)
        const pdfData = await pdfParse(buffer)
        content = pdfData.text
        console.log(`[parse-document] PDF parsed: ${content.length} chars, ${pdfData.numpages} pages`)
      } catch (pdfError) {
        console.error('[parse-document] PDF parse error:', pdfError)
        const errMsg = pdfError instanceof Error ? pdfError.message : 'Unknown PDF error'
        return NextResponse.json({ error: `PDF parsing failed: ${errMsg}` }, { status: 500 })
      }
    } else if (fileName.endsWith('.docx')) {
      try {
        // Dynamic import mammoth
        const mammoth = await import('mammoth')
        const buffer = Buffer.from(await file.arrayBuffer())
        console.log(`[parse-document] DOCX buffer created: ${buffer.length} bytes`)
        const result = await mammoth.extractRawText({ buffer })
        content = result.value
        console.log(`[parse-document] DOCX parsed: ${content.length} chars`)
      } catch (docxError) {
        console.error('[parse-document] DOCX parse error:', docxError)
        const errMsg = docxError instanceof Error ? docxError.message : 'Unknown DOCX error'
        return NextResponse.json({ error: `Word document parsing failed: ${errMsg}` }, { status: 500 })
      }
    } else if (fileName.endsWith('.txt')) {
      content = await file.text()
      console.log(`[parse-document] TXT read: ${content.length} chars`)
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    // Check if content was extracted
    if (!content || content.trim().length === 0) {
      console.warn('[parse-document] No text content extracted from file')
      return NextResponse.json({
        error: 'No text content could be extracted from this file. It may be image-based or encrypted.'
      }, { status: 400 })
    }

    // Truncate if too long (Claude has context limits)
    const maxLength = 50000
    if (content.length > maxLength) {
      content = content.substring(0, maxLength) + '\n\n[Content truncated...]'
      console.log(`[parse-document] Content truncated to ${maxLength} chars`)
    }

    return NextResponse.json({
      success: true,
      content,
      fileName: file.name,
      fileType: fileName.endsWith('.pdf') ? 'pdf' : fileName.endsWith('.docx') ? 'docx' : 'txt',
      charCount: content.length,
    })
  } catch (error) {
    console.error('[parse-document] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to parse document: ${errorMessage}` }, { status: 500 })
  }
}
