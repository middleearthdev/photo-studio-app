import { IUploadProvider, UploadProvider, UploadProviderConfig } from './types'
import { ServerUploadProvider } from './providers/server'
import { UploadCareProvider } from './providers/uploadcare'

export class UploadProviderFactory {
  private static providers: Map<UploadProvider, IUploadProvider> = new Map()

  static initialize() {
    // Initialize all providers
    this.providers.set('server', new ServerUploadProvider())
    this.providers.set('uploadcare', new UploadCareProvider())
  }

  static getProvider(name: UploadProvider): IUploadProvider | null {
    if (this.providers.size === 0) {
      this.initialize()
    }
    
    const provider = this.providers.get(name)
    return provider || null
  }

  static getConfiguredProvider(): IUploadProvider | null {
    if (this.providers.size === 0) {
      this.initialize()
    }

    // Check environment variable for preferred provider
    const preferredProvider = process.env.NEXT_PUBLIC_UPLOAD_PROVIDER as UploadProvider
    
    if (preferredProvider) {
      const provider = this.getProvider(preferredProvider)
      if (provider?.isConfigured()) {
        return provider
      } else {
        console.warn(`[UPLOAD-FACTORY] Preferred provider '${preferredProvider}' not configured, falling back...`)
      }
    }

    // Fallback order: uploadcare -> server
    const fallbackOrder: UploadProvider[] = ['uploadcare', 'server']
    
    for (const providerName of fallbackOrder) {
      const provider = this.getProvider(providerName)
      if (provider?.isConfigured()) {
        return provider
      }
    }

    console.error('[UPLOAD-FACTORY] No upload providers configured!')
    return null
  }

  static getProviderConfig(): UploadProviderConfig | null {
    const provider = this.getConfiguredProvider()
    if (!provider) return null

    return {
      provider: provider.name,
      fallbacks: this.getAvailableFallbacks(provider.name),
      options: this.getProviderOptions(provider.name)
    }
  }

  private static getAvailableFallbacks(currentProvider: UploadProvider): UploadProvider[] {
    const allProviders: UploadProvider[] = ['uploadcare', 'server']
    return allProviders
      .filter(name => name !== currentProvider)
      .filter(name => {
        const provider = this.getProvider(name)
        return provider?.isConfigured() || false
      })
  }

  private static getProviderOptions(providerName: UploadProvider): Record<string, any> {
    switch (providerName) {
      case 'server':
        return {
          endpoint: process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT || '/api/upload',
          maxRetries: 2
        }
      case 'uploadcare':
        return {
          store: true,
          maxRetries: 3
        }
      default:
        return {}
    }
  }

  static listConfiguredProviders(): UploadProvider[] {
    if (this.providers.size === 0) {
      this.initialize()
    }

    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.isConfigured())
      .map(([name, _]) => name)
  }

  static async uploadWithFallback(
    options: {
      file: File
      studioId: string
      path?: string
      onProgress?: (progress: number) => void
      bucket?: string
    }
  ) {
    const config = this.getProviderConfig()
    if (!config) {
      return {
        success: false,
        error: 'No upload providers available',
        provider: undefined
      }
    }

    // Try primary provider
    const primaryProvider = this.getProvider(config.provider)
    if (primaryProvider) {
      const result = await primaryProvider.upload(options)
      
      if (result.success) {
        return result
      }
      
      console.warn(`[UPLOAD-FACTORY] ${config.provider} failed: ${result.error}`)
    }

    // Try fallback providers
    for (const fallbackName of config.fallbacks || []) {
      const fallbackProvider = this.getProvider(fallbackName)
      if (!fallbackProvider) continue

      
      // Reset progress for fallback attempt
      if (options.onProgress) {
        options.onProgress(0)
      }
      
      const result = await fallbackProvider.upload(options)
      
      if (result.success) {
        return result
      }
      
      console.warn(`[UPLOAD-FACTORY] Fallback ${fallbackName} failed: ${result.error}`)
    }

    return {
      success: false,
      error: 'All upload providers failed',
      provider: undefined
    }
  }
}