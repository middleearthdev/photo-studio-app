import { NextRequest, NextResponse } from 'next/server'
import { DigitalOceanSpacesProvider } from '@/lib/upload/providers/digitalocean'

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
    const path = formData.get('path') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!studioId) {
      return NextResponse.json({ error: 'Studio ID required' }, { status: 400 })
    }

    // Initialize Digital Ocean provider
    const provider = new DigitalOceanSpacesProvider()

    if (!provider.isConfigured()) {
      return NextResponse.json({ 
        error: 'Digital Ocean Spaces not configured. Check DO_SPACES_* environment variables' 
      }, { status: 500 })
    }

    // Upload using the provider
    const result = await provider.upload({
      file,
      studioId,
      path,
      onProgress: () => {} // Progress not supported in API route
    })

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Digital Ocean Spaces upload failed' 
      }, { status: 500 })
    }

    console.log(`[DO-SPACES-API] File uploaded successfully:`, {
      studioId,
      path,
      url: result.url,
      size: file.size,
      type: file.type
    })

    return NextResponse.json({
      success: true,
      url: result.url,
      size: file.size,
      type: file.type,
      metadata: result.metadata
    })

  } catch (error) {
    console.error('[DO-SPACES-API] Error:', error)
    return NextResponse.json(
      { error: 'Digital Ocean Spaces upload failed' },
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

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    // Initialize Digital Ocean provider
    const provider = new DigitalOceanSpacesProvider()

    if (!provider.isConfigured()) {
      return NextResponse.json({ 
        error: 'Digital Ocean Spaces not configured' 
      }, { status: 500 })
    }

    const result = await provider.delete(url)

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Delete failed' 
      }, { status: 500 })
    }

    console.log(`[DO-SPACES-API] File deleted successfully:`, url)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[DO-SPACES-API] Delete error:', error)
    return NextResponse.json(
      { error: 'Digital Ocean Spaces delete failed' },
      { status: 500 }
    )
  }
}