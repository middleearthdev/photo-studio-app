# 🐛 Upload Stuck Debug Guide - Supabase API Call Issue

## Problem: Upload mentok di `supabase.storage.upload()` call

Implementasi baru mentok di line yang melakukan actual upload ke Supabase:
```typescript
const { data, error } = await supabase.storage
  .from(bucket)
  .upload(path, fileToUpload, {
    cacheControl: '3600',
    upsert: false
  })
```

## 🔍 Debug Tools yang Telah Ditambahkan

### 1. **Enhanced Logging** (`src/lib/storage.ts`)
- ✅ Detailed step-by-step logging dengan prefix `[STORAGE]`
- ✅ Environment variables validation
- ✅ Bucket existence check
- ✅ Upload timing measurement
- ✅ Specific error messages based on error type
- ✅ 30-second timeout to prevent infinite hanging

### 2. **Hook-level Debugging** (`src/hooks/use-file-upload.ts`)
- ✅ Upload ID tracking untuk follow logs
- ✅ Detailed file information logging
- ✅ Progress tracking logs
- ✅ Error cascade debugging

### 3. **Debug Scripts**

#### **A. Console Debug Script** (`debug-upload-stuck.js`)
```javascript
// Paste di browser console untuk comprehensive testing
debugUploadStuck()
testUploadScenario(yourFile)  // Test specific file
```

#### **B. Simple Upload Test** (`src/lib/simple-upload-test.ts`)
```typescript
// Direct test tanpa kompleksitas
import { testDirectUpload, minimalUpload } from '@/lib/simple-upload-test'

// Browser console
window.testDirectUpload(file)
window.minimalUpload(file, studioId)
```

## 🎯 Debugging Step-by-Step

### Step 1: Run Debug Script
```javascript
// Di browser console
debugUploadStuck()
```
**Look for:**
- ❌ Environment variables missing
- ❌ Authentication issues  
- ❌ Bucket access problems
- ❌ RLS policy blocks

### Step 2: Check Browser Console Logs
```
[STORAGE] Starting upload to bucket: portfolio-images, path: studio123/...
[STORAGE] File details: { name, type, size }
[STORAGE] Environment check: { url: 'Present', key: 'Present' }
[STORAGE] Available buckets: [...]
[STORAGE] Target bucket found: { id: 'portfolio-images', ... }
[STORAGE] Attempting upload with 30s timeout...
```

**If stuck at "Attempting upload":**
- Network/CORS issue
- RLS policy blocking
- Bucket permission problem

### Step 3: Test Different Upload Approaches
```javascript
// 1. Test minimal upload (no preprocessing)
await window.minimalUpload(file, 'studio123')

// 2. Test direct upload (with checks)
await window.testDirectUpload(file)

// 3. Test browser fetch directly
fetch(`${supabaseUrl}/storage/v1/object/portfolio-images/test.txt`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${supabaseKey}` },
  body: file
})
```

## 🚨 Common Issues & Solutions

### Issue 1: Environment Variables
**Symptoms:** Upload stuck immediately
**Check:**
```javascript
console.log({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
})
```
**Solution:** Verify `.env.local` file

### Issue 2: Bucket Not Found
**Symptoms:** `[STORAGE] Bucket 'portfolio-images' not found`
**Solution:** Create bucket di Supabase Dashboard:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true);
```

### Issue 3: RLS Policy Blocking
**Symptoms:** Upload hangs atau 403 error
**Solution:** Add upload policy:
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'portfolio-images');
```

### Issue 4: CORS Issues
**Symptoms:** Network errors in browser
**Solution:** Check Supabase project settings → API → CORS

### Issue 5: File Size/Type Issues
**Symptoms:** Upload fails with validation
**Solution:** Check file meets requirements:
- Max size: 10MB
- Types: JPEG, PNG, WebP, GIF

### Issue 6: Authentication Problems
**Symptoms:** `Authentication required` error
**Solution:** 
```javascript
// Check auth status
const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user)
```

## 🔧 Advanced Debugging

### Network Level Debug:
1. Open Browser DevTools → Network tab
2. Look for requests to Supabase storage endpoints
3. Check for:
   - Hanging requests (spinning)
   - 403/401 errors
   - CORS preflight failures
   - Timeout errors

### Supabase Dashboard Check:
1. Go to Storage → Buckets
2. Verify `portfolio-images` exists and is public
3. Check RLS policies are not too restrictive
4. Verify user has proper access

### Database Level Check:
```sql
-- Check user studios access
SELECT us.*, s.name 
FROM user_studios us 
JOIN studios s ON s.id = us.studio_id 
WHERE us.user_id = auth.uid();

-- Check storage policies
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

## 📊 Expected Log Flow (Normal Operation)

```
[HOOK-abc123] Starting upload process
[HOOK-abc123] File: { name: 'image.jpg', type: 'image/jpeg', size: 1024000 }
[STORAGE] Starting upload to bucket: portfolio-images
[STORAGE] Environment check: { url: 'Present', key: 'Present' }
[STORAGE] Available buckets: [{ id: 'portfolio-images', public: true }]
[STORAGE] Target bucket found: { id: 'portfolio-images' }
[STORAGE] Attempting upload with 30s timeout...
[STORAGE] Upload completed in 1250ms
[STORAGE] Upload result: { data: { path: '...' }, error: null }
[STORAGE] Upload successful, generating public URL...
[STORAGE] Public URL generated: https://...
[HOOK-abc123] Upload result: { success: true, publicUrl: '...' }
```

## 🎯 Quick Actions

### If Upload is Currently Stuck:
1. **Check Console:** Look for error patterns above
2. **Run Debug Script:** `debugUploadStuck()` in console
3. **Test Simple Upload:** `window.testDirectUpload(file)`
4. **Check Network Tab:** Look for hanging requests
5. **Verify Environment:** Restart dev server if needed

### Prevention:
1. **Monitor Console Logs:** Watch for [STORAGE] messages
2. **Use Timeout:** 30s timeout now prevents infinite hangs
3. **Test Environment:** Verify Supabase setup before upload
4. **User Feedback:** Show clear progress and error states

## ✅ Implementation Improvements

Dengan debugging tools ini:
- ✅ **Comprehensive Logging:** Detailed step-by-step tracking
- ✅ **Timeout Protection:** 30s limit prevents infinite hangs  
- ✅ **Multiple Test Approaches:** Different ways to isolate issues
- ✅ **Clear Error Messages:** Specific solutions for each problem
- ✅ **Browser Debug Tools:** Direct console testing capabilities

Upload sekarang memiliki full observability untuk debug issues yang terjadi di Supabase API level.