/**
 * Portfolio Upload Test Script
 * 
 * Run this in the browser console on the admin portfolio page
 * to test the upload functionality after implementing the fixes.
 */

async function testPortfolioUpload() {
  console.log('🧪 Starting Portfolio Upload Test...')
  
  try {
    // Test 1: Check if required modules are available
    console.log('📦 Checking required modules...')
    
    if (typeof window.supabase === 'undefined') {
      console.log('⚠️ Creating Supabase client...')
      // Import the client (adjust path as needed)
      const { createClient } = await import('./src/lib/supabase/client.js')
      window.supabase = createClient()
    }
    
    const supabase = window.supabase
    console.log('✅ Supabase client available')
    
    // Test 2: Check authentication
    console.log('🔐 Checking authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      console.log('💡 Please ensure you are logged in to the admin panel')
      return
    }
    
    console.log('✅ User authenticated:', user.email)
    
    // Test 3: Check available studios
    console.log('🏢 Checking studio access...')
    const { data: studios, error: studioError } = await supabase
      .from('user_studios')
      .select(`
        studio_id,
        studios(id, name)
      `)
      .eq('user_id', user.id)
    
    if (studioError || !studios?.length) {
      console.error('❌ No studio access:', studioError)
      console.log('💡 Please ensure your user has access to at least one studio')
      return
    }
    
    const firstStudio = studios[0].studios
    console.log('✅ Studio access confirmed:', firstStudio.name)
    
    // Test 4: Check storage bucket
    console.log('🪣 Checking storage bucket...')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('❌ Bucket check failed:', bucketError)
      return
    }
    
    const portfolioBucket = buckets?.find(b => b.id === 'portfolio-images')
    if (!portfolioBucket) {
      console.error('❌ Portfolio images bucket not found')
      console.log('💡 Available buckets:', buckets?.map(b => b.id))
      console.log('🔧 Please run the setup-storage.sql script in Supabase')
      return
    }
    
    console.log('✅ Portfolio images bucket found:', portfolioBucket)
    
    // Test 5: Test file upload
    console.log('📤 Testing file upload...')
    const testFile = new File(['test content'], 'test-upload.txt', { type: 'text/plain' })
    const testPath = `${firstStudio.id}/test/${Date.now()}_test.txt`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('portfolio-images')
      .upload(testPath, testFile)
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError)
      console.log('💡 Common solutions:')
      console.log('   - Check RLS policies in Supabase Dashboard')
      console.log('   - Verify bucket permissions')
      console.log('   - Ensure user has upload rights')
      return
    }
    
    console.log('✅ Upload test successful:', uploadData)
    
    // Test 6: Get public URL
    console.log('🔗 Testing public URL generation...')
    const { data: urlData } = supabase.storage
      .from('portfolio-images')
      .getPublicUrl(testPath)
    
    if (!urlData.publicUrl) {
      console.error('❌ Public URL generation failed')
      return
    }
    
    console.log('✅ Public URL generated:', urlData.publicUrl)
    
    // Test 7: Clean up test file
    console.log('🧹 Cleaning up test file...')
    await supabase.storage
      .from('portfolio-images')
      .remove([testPath])
    
    console.log('✅ Test cleanup completed')
    
    // Final result
    console.log('\n🎉 ALL TESTS PASSED!')
    console.log('Portfolio upload functionality should work correctly.')
    console.log('\n📋 Summary:')
    console.log('✅ Authentication: Working')
    console.log('✅ Studio Access: Working')
    console.log('✅ Storage Bucket: Available')
    console.log('✅ File Upload: Working')
    console.log('✅ Public URLs: Working')
    
  } catch (error) {
    console.error('💥 Test failed with error:', error)
    console.log('\n🔧 Troubleshooting suggestions:')
    console.log('1. Ensure you are on the admin portfolio page')
    console.log('2. Check that you are logged in')
    console.log('3. Verify environment variables are set')
    console.log('4. Run setup-storage.sql in Supabase')
    console.log('5. Check browser console for additional errors')
  }
}

// Auto-run the test
testPortfolioUpload()

/* 
USAGE INSTRUCTIONS:

1. Navigate to: /admin/portfolio
2. Open browser console (F12)
3. Paste and run this script
4. Check the results and follow any troubleshooting suggestions

EXPECTED OUTPUT (when working):
🧪 Starting Portfolio Upload Test...
📦 Checking required modules...
✅ Supabase client available
🔐 Checking authentication...
✅ User authenticated: admin@example.com
🏢 Checking studio access...
✅ Studio access confirmed: My Studio
🪣 Checking storage bucket...
✅ Portfolio images bucket found: {id: 'portfolio-images', name: 'portfolio-images', public: true}
📤 Testing file upload...
✅ Upload test successful: {path: 'studio-id/test/123456_test.txt'}
🔗 Testing public URL generation...
✅ Public URL generated: https://...
🧹 Cleaning up test file...
✅ Test cleanup completed

🎉 ALL TESTS PASSED!
*/