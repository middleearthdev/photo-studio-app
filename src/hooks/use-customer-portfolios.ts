'use client'

import { useQuery } from '@tanstack/react-query'
import {
  getPublicPortfolios,
  getPublicPortfolioCategories,
  getPublicPortfolioCategoriesWithCovers,
  getFeaturedPortfolios,
  getPublicPortfolioById,
  type Portfolio,
  type PortfolioCategory
} from '@/actions/customer-portfolios'

// Extended type for portfolio categories with covers
type PortfolioCategoryWithCover = PortfolioCategory & {
  cover_image?: string;
  portfolios_count?: number;
}

// Query keys
export const customerPortfolioKeys = {
  all: ['customer-portfolios'] as const,
  lists: () => [...customerPortfolioKeys.all, 'list'] as const,
  featured: () => [...customerPortfolioKeys.all, 'featured'] as const,
  details: () => [...customerPortfolioKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerPortfolioKeys.details(), id] as const,
  categories: () => ['customer-portfolio-categories'] as const,
  categoriesWithCovers: () => ['customer-portfolio-categories-with-covers'] as const,
}

// Get all public portfolios
export function usePublicPortfolios() {
  return useQuery({
    queryKey: customerPortfolioKeys.lists(),
    queryFn: getPublicPortfolios,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get all public portfolio categories
export function usePublicPortfolioCategories() {
  return useQuery({
    queryKey: customerPortfolioKeys.categories(),
    queryFn: getPublicPortfolioCategories,
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Get all public portfolio categories with cover images
export function usePublicPortfolioCategoriesWithCovers() {
  return useQuery({
    queryKey: customerPortfolioKeys.categoriesWithCovers(),
    queryFn: getPublicPortfolioCategoriesWithCovers,
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Get featured portfolios
export function useFeaturedPortfolios() {
  return useQuery({
    queryKey: customerPortfolioKeys.featured(),
    queryFn: getFeaturedPortfolios,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get portfolio by ID (public)
export function usePublicPortfolio(id?: string) {
  return useQuery({
    queryKey: customerPortfolioKeys.detail(id!),
    queryFn: () => getPublicPortfolioById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Export types for convenience
export type { Portfolio, PortfolioCategory, PortfolioCategoryWithCover }