"use server"

import { createClient } from '@/lib/supabase/server'

export interface Portfolio {
  id: string
  studio_id: string
  category_id: string | null
  title: string
  description: string | null
  image_url: string
  alt_text: string | null
  display_order: number
  is_featured: boolean
  is_active: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  // Relations
  category?: {
    id: string
    name: string
  }
}

export interface PortfolioCategory {
  id: string
  studio_id: string
  name: string
  description: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

// Get all public portfolios (only active ones)
export async function getPublicPortfolios(): Promise<Portfolio[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('portfolios')
    .select(`
      *,
      category:portfolio_categories(id, name)
    `)
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching public portfolios:', error)
    // Return empty array as fallback instead of throwing error
    return []
  }
  
  return data || []
}

// Get all public portfolio categories with cover images
export async function getPublicPortfolioCategoriesWithCovers(): Promise<(PortfolioCategory & { cover_image?: string, portfolios_count?: number })[]> {
  const supabase = await createClient()
  
  // First get categories with counts
  const { data: categories, error: categoriesError } = await supabase
    .from('portfolio_categories')
    .select(`
      *,
      portfolios:portfolios(count)
    `)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
  
  if (categoriesError) {
    console.error('Error fetching public portfolio categories:', categoriesError)
    // Return empty array as fallback instead of throwing error
    return []
  }
  
  // Transform the data to include portfolio counts
  const categoriesWithCounts = (categories || []).map((category: any) => ({
    ...category,
    portfolios_count: category.portfolios?.[0]?.count || 0
  }))
  
  // For each category, get the first portfolio image as cover
  const categoriesWithCovers = await Promise.all(
    categoriesWithCounts.map(async (category) => {
      const { data: portfolios, error: portfoliosError } = await supabase
        .from('portfolios')
        .select('image_url')
        .eq('category_id', category.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (portfoliosError || !portfolios || portfolios.length === 0) {
        return {
          ...category,
          cover_image: undefined
        }
      }
      
      return {
        ...category,
        cover_image: portfolios[0].image_url
      }
    })
  )
  
  return categoriesWithCovers
}

// Get all public portfolio categories (only active ones) with portfolio counts
export async function getPublicPortfolioCategoriesWithCounts(): Promise<(PortfolioCategory & { portfolios_count?: number })[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('portfolio_categories')
    .select(`
      *,
      portfolios:portfolios(count)
    `)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
  
  if (error) {
    console.error('Error fetching public portfolio categories:', error)
    // Return empty array as fallback instead of throwing error
    return []
  }
  
  // Transform the data to include portfolio counts
  return (data || []).map((category: any) => ({
    ...category,
    portfolios_count: category.portfolios?.[0]?.count || 0
  }))
}

// Get featured portfolios
export async function getFeaturedPortfolios(): Promise<Portfolio[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('portfolios')
    .select(`
      *,
      category:portfolio_categories(id, name)
    `)
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching featured portfolios:', error)
    // Return empty array as fallback instead of throwing error
    return []
  }
  
  return data || []
}

// Get portfolio by ID (public)
export async function getPublicPortfolioById(id: string): Promise<Portfolio | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('portfolios')
    .select(`
      *,
      category:portfolio_categories(id, name)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching public portfolio:', error)
    // Return null as fallback instead of throwing error
    return null
  }
  
  return data
}

// Get all public portfolio categories (only active ones)
export async function getPublicPortfolioCategories(): Promise<PortfolioCategory[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('portfolio_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
  
  if (error) {
    console.error('Error fetching public portfolio categories:', error)
    // Return empty array as fallback instead of throwing error
    return []
  }
  
  return data || []
}