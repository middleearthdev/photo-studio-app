import { createClient } from '@/lib/supabase/client'

/**
 * Simplified upload test to isolate the issue
 * This bypasses all the complex logic and tests direct Supabase upload
 */

export interface SimpleUploadResult {
  success: boolean
  url?: string
  error?: string
  details?: any
}

export const testDirectUpload = async (file: File): Promise<SimpleUploadResult> => {
  console.log('🧪 [SIMPLE-TEST] Starting direct upload test...')
  
  try {
    // Step 1: Create client
    console.log('📱 [SIMPLE-TEST] Creating Supabase client...')
    const supabase = createClient()
    
    // Step 2: Check environment
    console.log('🔧 [SIMPLE-TEST] Environment check...')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        success: false,
        error: 'Missing environment variables',
        details: { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey }
      }
    }
    
    // Step 3: Check auth
    console.log('🔐 [SIMPLE-TEST] Checking auth...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required',
        details: authError
      }
    }
    
    // Step 4: Check bucket exists
    console.log('🪣 [SIMPLE-TEST] Checking bucket...')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    if (bucketError) {
      return {
        success: false,
        error: 'Cannot access storage buckets',
        details: bucketError
      }
    }
    
    const portfolioBucket = buckets?.find(b => b.id === 'portfolio-images')
    if (!portfolioBucket) {
      return {
        success: false,
        error: 'portfolio-images bucket not found',
        details: { availableBuckets: buckets?.map(b => b.id) }
      }
    }
    
    // Step 5: Simple upload test
    console.log('📤 [SIMPLE-TEST] Testing upload...')
    const testPath = `simple-test/${Date.now()}_${file.name}`
    
    const uploadStartTime = Date.now()
    const { data, error } = await supabase.storage
      .from('portfolio-images')
      .upload(testPath, file, {
        cacheControl: '3600',
        upsert: false
      })
    const uploadDuration = Date.now() - uploadStartTime
    
    console.log(`📊 [SIMPLE-TEST] Upload took ${uploadDuration}ms`)
    
    if (error) {
      return {
        success: false,
        error: error.message,
        details: { error, duration: uploadDuration }
      }
    }
    
    // Step 6: Get URL
    console.log('🔗 [SIMPLE-TEST] Getting public URL...')
    const { data: urlData } = supabase.storage
      .from('portfolio-images')
      .getPublicUrl(testPath)
    
    // Step 7: Cleanup
    console.log('🧹 [SIMPLE-TEST] Cleaning up...')
    await supabase.storage
      .from('portfolio-images')
      .remove([testPath])
    
    console.log('✅ [SIMPLE-TEST] Test completed successfully!')
    
    return {
      success: true,
      url: urlData.publicUrl,
      details: {
        uploadDuration,
        path: testPath,
        data
      }
    }
    
  } catch (error) {
    console.error('💥 [SIMPLE-TEST] Test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }
  }
}

// Minimal upload function without any preprocessing
export const minimalUpload = async (file: File, studioId: string): Promise<SimpleUploadResult> => {
  console.log('🚀 [MINIMAL] Starting minimal upload...')
  
  try {
    const supabase = createClient()
    const path = `${studioId}/${Date.now()}_${file.name}`
    
    console.log('📤 [MINIMAL] Direct upload to:', path)
    
    const { data, error } = await supabase.storage
      .from('portfolio-images')
      .upload(path, file)
    
    if (error) {
      console.error('❌ [MINIMAL] Upload failed:', error)
      return {
        success: false,
        error: error.message,
        details: error
      }
    }
    
    const { data: urlData } = supabase.storage
      .from('portfolio-images')
      .getPublicUrl(path)
    
    console.log('✅ [MINIMAL] Upload successful!')
    
    return {
      success: true,
      url: urlData.publicUrl,
      details: { data, path }
    }
    
  } catch (error) {
    console.error('💥 [MINIMAL] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }
  }
}

// Browser console helpers
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.testDirectUpload = testDirectUpload
  // @ts-ignore 
  window.minimalUpload = minimalUpload
}