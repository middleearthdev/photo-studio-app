import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'

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
    const filename = formData.get('filename') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!filename) {
      return NextResponse.json({ error: 'Filename required' }, { status: 400 })
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

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    })

    console.log(`[VERCEL-UPLOAD] File uploaded:`, {
      filename,
      size: file.size,
      type: file.type,
      url: blob.url
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
      size: file.size,
      type: file.type,
      filename
    })

  } catch (error) {
    console.error('[VERCEL-UPLOAD] Error:', error)
    return NextResponse.json(
      { error: 'Vercel Blob upload failed' },
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

    if (!url || !url.includes('blob.vercel-storage.com')) {
      return NextResponse.json({ error: 'Invalid Vercel Blob URL' }, { status: 400 })
    }

    // Delete from Vercel Blob
    await del(url)
    
    console.log(`[VERCEL-DELETE] File deleted:`, url)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[VERCEL-DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    )
  }
}