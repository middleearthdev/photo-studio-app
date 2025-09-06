import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
})
export type Json =
    | string | number | boolean | null
    | { [key: string]: Json | undefined } | Json[];

// Database types (generate with: npx supabase gen types typescript)
export interface Database {
    public: {
        Tables: {
            studios: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    address: string
                    phone: string | null
                    email: string | null
                    operating_hours: Json | null
                    is_active: boolean
                    settings: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    // Insert type definitions...
                }
                Update: {
                    // Update type definitions...
                }
            },
            user_profiles: {
                Row: {
                    id: string
                    role: 'admin' | 'cs' | 'customer'
                    is_active: boolean
                    studio_id: string | null
                    last_login: string | null
                    full_name: string | null
                    phone: string | null
                    created_at: string
                    updated_at: string
                }
            }
            // ... other table types
        }
        Views: {
            available_time_slots: {
                Row: {
                    // View type definitions...
                }
            }
            reservation_summary: {
                Row: {
                    // View type definitions...
                }
            }
        }
        Functions: {
            check_slot_availability: {
                Args: {
                    p_studio_id: string
                    p_facility_id: string
                    p_date: string
                    p_start_time: string
                    p_duration_minutes: number
                }
                Returns: boolean
            }
            create_reservation: {
                Args: {
                    p_studio_id: string
                    p_customer_id: string
                    p_package_id: string
                    p_facility_id: string
                    p_reservation_date: string
                    p_start_time: string
                    p_special_requests?: string
                    p_addon_ids?: string[]
                }
                Returns: string
            }
        }
    }
}