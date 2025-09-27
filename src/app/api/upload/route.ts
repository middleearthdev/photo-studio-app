import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    // Check API key if configured
    const apiKey = process.env.UPLOAD_API_KEY
    if (apiKey) {
      const providedKey = request.headers.get('X-API-Key')
      if (providedKey !== apiKey) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const studioId = formData.get('studioId') as string
    const fileName = formData.get('fileName') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!studioId) {
      return NextResponse.json({ error: 'Studio ID required' }, { status: 400 })
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', studioId)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const uniqueFileName = fileName || `${timestamp}.${extension}`
    const filePath = join(uploadDir, uniqueFileName)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Generate public URL
    const publicUrl = `/uploads/${studioId}/${uniqueFileName}`

    console.log(`[SERVER-UPLOAD] File saved:`, {
      path: filePath,
      size: file.size,
      type: file.type,
      url: publicUrl
    })

    return NextResponse.json({
      success: true,
      url: publicUrl,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('[SERVER-UPLOAD] Error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check API key if configured
    const apiKey = process.env.UPLOAD_API_KEY
    if (apiKey) {
      const providedKey = request.headers.get('X-API-Key')
      if (providedKey !== apiKey) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { url } = await request.json()

    if (!url || !url.startsWith('/uploads/')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Extract file path
    const filePath = join(process.cwd(), 'public', url)
    
    // Check if file exists and delete
    if (existsSync(filePath)) {
      const { unlink } = await import('fs/promises')
      await unlink(filePath)
      console.log(`[SERVER-DELETE] File deleted:`, filePath)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[SERVER-DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    )
  }
}