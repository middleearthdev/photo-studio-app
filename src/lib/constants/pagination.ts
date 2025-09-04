// Pagination constants and configuration
export const DEFAULT_PAGE_SIZE = parseInt(process.env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE || '10', 10)
export const MAX_PAGE_SIZE = parseInt(process.env.NEXT_PUBLIC_MAX_PAGE_SIZE || '100', 10)

// Page size options for user selection
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100].filter(size => size <= MAX_PAGE_SIZE)

// Pagination interface for server actions
export interface PaginationParams {
  page?: number
  pageSize?: number
  search?: string
}

// Pagination result interface
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Helper function to calculate pagination values
export function calculatePagination(
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
  total: number = 0
) {
  const currentPage = Math.max(1, page)
  const currentPageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE)
  const totalPages = Math.ceil(total / currentPageSize)
  const offset = (currentPage - 1) * currentPageSize

  return {
    page: currentPage,
    pageSize: currentPageSize,
    total,
    totalPages,
    offset,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  }
}