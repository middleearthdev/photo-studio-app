# Simple Upload Destination Implementation

## Overview
Deleted all complex multi-provider upload code and implemented a simple, clean solution using `NEXT_PUBLIC_UPLOAD_DESTINATION` environment variable.

## Implementation

### Environment Variable
Set `NEXT_PUBLIC_UPLOAD_DESTINATION` in your `.env.local`:
- `server` - Upload to local server at `/public/uploads/`
- `supabase` - Upload to Supabase Storage

### Code Changes

#### Portfolio Dialog (`src/app/(dashboard)/admin/_components/portfolio-dialog.tsx`)
- **Removed**: Complex FileUpload component
- **Added**: Simple `ImageUploadComponent` that checks environment variable
- **Features**:
  - Drag & drop upload
  - Progress indicator
  - Manual URL input option
  - Shows upload destination in UI

#### Upload Logic
```typescript
const uploadToDestination = async (file: File): Promise<string> => {
  const destination = process.env.NEXT_PUBLIC_UPLOAD_DESTINATION || 'server'
  
  if (destination === 'supabase') {
    // Upload to Supabase Storage
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    
    const fileName = `${studioId}/${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage
      .from('portfolio-images')
      .upload(fileName, file)
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('portfolio-images')
      .getPublicUrl(fileName)
    
    return publicUrl
  } else {
    // Upload to server
    const formData = new FormData()
    formData.append('file', file)
    formData.append('studioId', studioId)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Upload failed')
    }
    
    const result = await response.json()
    return result.url
  }
}
```

### Environment Configuration

#### .env.local
```bash
# Upload to local server
NEXT_PUBLIC_UPLOAD_DESTINATION=server

# OR upload to Supabase
NEXT_PUBLIC_UPLOAD_DESTINATION=supabase
```

#### .env.example
Updated with simple configuration options instead of complex multi-provider setup.

## Benefits

1. **Simplicity**: Only two options, easy to understand
2. **Direct Control**: Environment variable directly controls behavior
3. **No Fallbacks**: Clear, predictable behavior
4. **Clean Code**: Removed complex factory pattern and multiple providers
5. **Easy Debugging**: Simple upload flow with clear error messages

## Usage

1. Set `NEXT_PUBLIC_UPLOAD_DESTINATION=server` in `.env.local`
2. Go to Admin → Portfolio
3. Add/Edit portfolio item
4. Upload image - will go to `/public/uploads/{studioId}/`

OR

1. Set `NEXT_PUBLIC_UPLOAD_DESTINATION=supabase` in `.env.local`
2. Configure Supabase credentials
3. Upload image - will go to Supabase Storage bucket `portfolio-images`

## File Structure

### Server Upload
- Files saved to: `/public/uploads/{studioId}/{timestamp}-{filename}`
- Accessible via: `/uploads/{studioId}/{timestamp}-{filename}`

### Supabase Upload
- Files saved to: `portfolio-images/{studioId}/{timestamp}-{filename}`
- Accessible via: Supabase CDN URL

## Error Handling

- Invalid file types rejected
- File size validation
- Network error handling
- Clear error messages shown to user
- Console logging for debugging

## UI Features

- Shows upload destination in interface
- Progress bar during upload
- Drag and drop support
- Manual URL input fallback
- Image preview
- Upload status indicators

This implementation is much cleaner and easier to maintain than the previous complex multi-provider system.