"use client"

import { useQuery } from "@tanstack/react-query"
import {
  getRevenueAnalytics,
  getPackagePerformance,
  getFacilityUsage,
  getCustomerAnalytics,
  getTimeSlotAnalysis,
  getDashboardAnalytics,
  AnalyticsTimeRange
} from "@/actions/analytics"

export function useRevenueAnalytics(studioId: string, timeRange: AnalyticsTimeRange = "last-6-months") {
  return useQuery({
    queryKey: ["analytics", "revenue", studioId, timeRange],
    queryFn: () => getRevenueAnalytics(studioId, timeRange),
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function usePackagePerformance(studioId: string, timeRange: AnalyticsTimeRange = "last-6-months") {
  return useQuery({
    queryKey: ["analytics", "packages", studioId, timeRange],
    queryFn: () => getPackagePerformance(studioId, timeRange),
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useFacilityUsage(studioId: string, timeRange: AnalyticsTimeRange = "last-6-months") {
  return useQuery({
    queryKey: ["analytics", "facilities", studioId, timeRange],
    queryFn: () => getFacilityUsage(studioId, timeRange),
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useCustomerAnalytics(studioId: string, timeRange: AnalyticsTimeRange = "last-6-months") {
  return useQuery({
    queryKey: ["analytics", "customers", studioId, timeRange],
    queryFn: () => getCustomerAnalytics(studioId, timeRange),
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useTimeSlotAnalytics(studioId: string, timeRange: AnalyticsTimeRange = "last-6-months") {
  return useQuery({
    queryKey: ["analytics", "timeslots", studioId, timeRange],
    queryFn: () => getTimeSlotAnalysis(studioId, timeRange),
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useDashboardAnalytics(studioId: string, timeRange: AnalyticsTimeRange = "last-6-months") {
  return useQuery({
    queryKey: ["analytics", "dashboard", studioId, timeRange],
    queryFn: () => getDashboardAnalytics(studioId, timeRange),
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}