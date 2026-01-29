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

    if (fileName.endsWith('.pdf')) {
      // Dynamic import pdf-parse
      const pdfParse = (await import('pdf-parse')).default
      const buffer = Buffer.from(await file.arrayBuffer())
      const pdfData = await pdfParse(buffer)
      content = pdfData.text
    } else if (fileName.endsWith('.docx')) {
      // Dynamic import mammoth
      const mammoth = await import('mammoth')
      const buffer = Buffer.from(await file.arrayBuffer())
      const result = await mammoth.extractRawText({ buffer })
      content = result.value
    } else if (fileName.endsWith('.txt')) {
      content = await file.text()
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    // Truncate if too long (Claude has context limits)
    const maxLength = 50000
    if (content.length > maxLength) {
      content = content.substring(0, maxLength) + '\n\n[Content truncated...]'
    }

    return NextResponse.json({
      success: true,
      content,
      fileName: file.name,
      fileType: fileName.endsWith('.pdf') ? 'pdf' : fileName.endsWith('.docx') ? 'docx' : 'txt',
      charCount: content.length,
    })
  } catch (error) {
    console.error('Document parsing error:', error)
    return NextResponse.json({ error: 'Failed to parse document' }, { status: 500 })
  }
}
