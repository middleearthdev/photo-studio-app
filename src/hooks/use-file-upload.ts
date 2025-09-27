"use client"

import { useState, useCallback } from 'react'
import { UploadProviderFactory } from '@/lib/upload/factory'
import { generateFileName } from '@/lib/upload/types'
import { toast } from 'sonner'

export interface FileUploadState {
  isUploading: boolean
  progress: number
  file: File | null
  url: string | null
  error: string | null
}

export interface UseFileUploadOptions {
  bucket?: string
  studioId: string
  onSuccess?: (url: string) => void
  onError?: (error: string) => void
  showToast?: boolean
}

export const useFileUpload = ({
  bucket = 'portfolio-images',
  studioId,
  onSuccess,
  onError,
  showToast = true
}: UseFileUploadOptions) => {
  const [state, setState] = useState<FileUploadState>({
    isUploading: false,
    progress: 0,
    file: null,
    url: null,
    error: null
  })

  const upload = useCallback(async (file: File) => {
    const uploadId = Math.random().toString(36).substring(2, 8)
    console.log(`[HOOK-${uploadId}] Starting multi-provider upload`)
    console.log(`[HOOK-${uploadId}] File:`, {
      name: file.name,
      type: file.type,
      size: file.size
    })
    console.log(`[HOOK-${uploadId}] Config:`, { bucket, studioId })
    
    setState(prev => ({
      ...prev,
      isUploading: true,
      progress: 0,
      file,
      error: null
    }))

    try {
      const path = generateFileName(studioId, file.name)
      console.log(`[HOOK-${uploadId}] Generated path:`, path)
      
      console.log(`[HOOK-${uploadId}] Using upload factory with fallbacks...`)
      const result = await UploadProviderFactory.uploadWithFallback({
        file,
        studioId,
        path,
        bucket,
        onProgress: (progress) => {
          console.log(`[HOOK-${uploadId}] Progress: ${progress}%`)
          setState(prev => ({ ...prev, progress }))
        }
      })
      
      console.log(`[HOOK-${uploadId}] Upload result:`, result)

      if (!result.success || !result.url) {
        throw new Error(result.error || 'Upload failed')
      }

      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        url: result.url!,
        error: null
      }))

      if (showToast) {
        toast.success(`File uploaded successfully via ${result.provider}`)
      }

      onSuccess?.(result.url)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      console.error(`[HOOK-${uploadId}] Upload failed:`, error)
      
      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 0,
        error: errorMessage
      }))

      if (showToast) {
        toast.error(errorMessage)
      }

      onError?.(errorMessage)
    }
  }, [bucket, studioId, onSuccess, onError, showToast])

  const remove = useCallback(async (url?: string) => {
    const targetUrl = url || state.url
    if (!targetUrl) return

    try {
      // Try to determine provider from URL and delete accordingly
      let deleteResult: { success: boolean; error?: string } = { success: false, error: 'Unknown provider' }
      
      if (targetUrl.includes('supabase')) {
        const provider = UploadProviderFactory.getProvider('supabase')
        if (provider?.delete) {
          deleteResult = await provider.delete(targetUrl)
        }
      } else if (targetUrl.includes('ucarecdn.com')) {
        const provider = UploadProviderFactory.getProvider('uploadcare')
        if (provider?.delete) {
          deleteResult = await provider.delete(targetUrl)
        }
      } else if (targetUrl.startsWith('/uploads/')) {
        const provider = UploadProviderFactory.getProvider('server')
        if (provider?.delete) {
          deleteResult = await provider.delete(targetUrl)
        }
      }
      
      if (!deleteResult.success) {
        throw new Error(deleteResult.error || 'Delete failed')
      }

      setState(prev => ({
        ...prev,
        url: null,
        file: null
      }))

      if (showToast) {
        toast.success('File removed successfully')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed'
      
      if (showToast) {
        toast.error(errorMessage)
      }
    }
  }, [state.url, showToast])

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      file: null,
      url: null,
      error: null
    })
  }, [])

  const setUrl = useCallback((url: string) => {
    setState(prev => ({
      ...prev,
      url,
      error: null
    }))
  }, [])

  return {
    ...state,
    upload,
    remove,
    reset,
    setUrl
  }
}