// Test script to verify Supabase storage upload
// Run this in browser console to debug upload issues

async function testSupabaseUpload() {
  try {
    console.log('🧪 Testing Supabase upload...')
    
    // Import Supabase client (adjust path as needed)
    const { createClient } = await import('./src/lib/supabase/client.js')
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('👤 User:', user ? `${user.email} (${user.id})` : 'Not authenticated')
    
    if (authError) {
      console.error('❌ Auth error:', authError)
      return
    }
    
    // Check bucket access
    console.log('🪣 Checking bucket access...')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    console.log('📦 Available buckets:', buckets?.map(b => b.id))
    
    if (bucketError) {
      console.error('❌ Bucket error:', bucketError)
    }
    
    // Test simple upload
    console.log('📤 Testing upload...')
    const testFile = new File(['Hello world'], 'test.txt', { type: 'text/plain' })
    
    const { data, error } = await supabase.storage
      .from('portfolio-images')
      .upload(`test/${Date.now()}_test.txt`, testFile)
    
    if (error) {
      console.error('❌ Upload error:', error)
      
      // Try to create bucket if it doesn't exist
      if (error.message.includes('Bucket not found')) {
        console.log('🏗️ Bucket not found, this needs to be created in Supabase dashboard')
        console.log('Go to: Supabase Dashboard > Storage > Create bucket "portfolio-images"')
      }
    } else {
      console.log('✅ Upload successful:', data)
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(data.path)
      
      console.log('🔗 Public URL:', urlData.publicUrl)
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

// Run the test
testSupabaseUpload()

/* 
TROUBLESHOOTING:

1. If "Bucket not found":
   - Go to Supabase Dashboard > Storage
   - Create bucket named "portfolio-images"
   - Make it public
   - Run setup-storage.sql for policies

2. If "Unauthorized":
   - Check if user is logged in
   - Verify RLS policies
   - Check user_studios table

3. If "CORS errors":
   - Check NEXT_PUBLIC_SUPABASE_URL
   - Restart dev server
   - Clear browser cache

4. If upload stalls:
   - Check network tab for failed requests
   - Verify file size < 50MB (Supabase limit)
   - Try smaller test file first
*/