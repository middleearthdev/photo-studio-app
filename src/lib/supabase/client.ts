import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    // Debug: Log environment variables (remove in production)
    if (typeof window !== 'undefined') {
        console.log('Supabase client config:', {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
            key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
        })
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    }
    
    if (!supabaseKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
    }
    
    return createBrowserClient(supabaseUrl, supabaseKey)
}