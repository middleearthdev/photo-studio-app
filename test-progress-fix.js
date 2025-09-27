/**
 * Test Script untuk Verify Progress Fix
 * 
 * Paste di browser console untuk test progress tidak stuck di 90%
 */

async function testProgressFix() {
  console.log('🧪 Testing Progress Fix...')
  
  try {
    // Create test file
    const testContent = 'x'.repeat(1024 * 100) // 100KB test file
    const testFile = new File([testContent], 'progress-test.txt', { type: 'text/plain' })
    
    console.log('📄 Test file created:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    })
    
    // Import upload function
    const { uploadFile, STORAGE_BUCKETS } = await import('./src/lib/storage.js')
    
    // Test upload with progress tracking
    const progressUpdates = []
    const startTime = Date.now()
    
    console.log('📤 Starting upload with progress tracking...')
    
    const result = await uploadFile({
      bucket: STORAGE_BUCKETS.PORTFOLIO,
      path: `progress-test/${Date.now()}_test.txt`,
      file: testFile,
      onProgress: (progress) => {
        progressUpdates.push({
          progress,
          timestamp: Date.now() - startTime
        })
        console.log(`📊 Progress: ${progress}% (${Date.now() - startTime}ms)`)
      }
    })
    
    const totalTime = Date.now() - startTime
    
    console.log('✅ Upload completed!')
    console.log('📊 Progress updates:', progressUpdates)
    console.log('⏱️ Total time:', totalTime + 'ms')
    console.log('🔗 Result:', result)
    
    // Analyze progress pattern
    const finalProgress = progressUpdates[progressUpdates.length - 1]?.progress
    if (finalProgress === 100) {
      console.log('✅ Progress completed successfully (100%)')
    } else {
      console.warn(`⚠️ Progress stuck at ${finalProgress}%`)
    }
    
    // Check for stuck patterns
    const stuck90Count = progressUpdates.filter(p => p.progress === 90).length
    if (stuck90Count > 3) {
      console.warn(`⚠️ Progress stuck at 90% for ${stuck90Count} updates`)
    }
    
    // Cleanup if successful
    if (result.success && result.publicUrl) {
      console.log('🧹 Cleaning up test file...')
      const { deleteFile } = await import('./src/lib/storage.js')
      const path = result.publicUrl.split('/').pop()
      if (path) {
        await deleteFile(STORAGE_BUCKETS.PORTFOLIO, `progress-test/${path}`)
        console.log('✅ Test file cleaned up')
      }
    }
    
    return {
      success: result.success,
      progressUpdates,
      totalTime,
      finalProgress,
      stuck90Count
    }
    
  } catch (error) {
    console.error('💥 Progress test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Test different scenarios
window.testProgressScenarios = async function() {
  console.log('🔬 Testing Multiple Progress Scenarios...')
  
  const scenarios = [
    { name: 'Small File (1KB)', size: 1024 },
    { name: 'Medium File (100KB)', size: 1024 * 100 },
    { name: 'Large File (1MB)', size: 1024 * 1024 }
  ]
  
  for (const scenario of scenarios) {
    console.log(`\n📋 Testing ${scenario.name}...`)
    
    const testContent = 'x'.repeat(scenario.size)
    const testFile = new File([testContent], `test-${scenario.size}.txt`, { type: 'text/plain' })
    
    const result = await testProgressFix()
    console.log(`📊 ${scenario.name} Result:`, {
      success: result.success,
      finalProgress: result.finalProgress,
      stuck90: result.stuck90Count > 0
    })
  }
}

// Auto-run basic test
testProgressFix()

/*
EXPECTED RESULTS AFTER FIX:

✅ Progress should flow: 10% → 20% → ... → 80% → 90% → 95% → 100%
✅ Should NOT get stuck at 90%
✅ Each progress step should have reasonable timing
✅ Final progress should always be 100% on success

DEBUGGING:
- If stuck at 90%: Check public URL generation
- If stuck at 80%: Check upload completion
- If stuck at any %: Check interval clearing

USAGE:
1. testProgressFix() - Test single upload
2. testProgressScenarios() - Test multiple file sizes
*/