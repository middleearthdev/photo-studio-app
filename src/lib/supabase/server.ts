import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    // Debug: Check if environment variables exist
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.error('Missing NEXT_PUBLIC_SUPABASE_URL')
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY')
    }

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Server component menggunakan setAll mungkin gagal
                        // Ini normal saat pre-rendering
                    }
                },
            },
        }
    )
}



