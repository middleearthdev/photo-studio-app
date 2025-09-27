"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getRevenueAnalytics, getDashboardAnalytics } from '@/actions/analytics'
import { createClient } from '@/lib/supabase/client'

export function DatabaseTestComponent() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testDatabaseConnection = async () => {
    setIsLoading(true)
    setTestResults(null)

    try {
      const supabase = createClient()
      
      // Test 1: Check auth
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('Auth test:', { user: !!user, error: authError })

      if (!user) {
        setTestResults({ error: 'No authenticated user' })
        return
      }

      // Test 2: Check user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      console.log('Profile test:', { profile, error: profileError })

      // Test 3: Check reservations count
      const { data: reservations, error: reservationError, count } = await supabase
        .from('reservations')
        .select('*', { count: 'exact' })
        .eq('studio_id', profile?.studio_id)

      console.log('Reservations test:', { count, error: reservationError, sampleData: reservations?.slice(0, 2) })

      // Test 4: Test analytics functions
      const revenueData = await getRevenueAnalytics(profile?.studio_id || '', 'last-6-months')
      const dashboardData = await getDashboardAnalytics(profile?.studio_id || '', 'last-6-months')

      console.log('Analytics test:', { revenueData, dashboardData })

      setTestResults({
        auth: { user: !!user, error: authError },
        profile: { profile, error: profileError },
        reservations: { count, error: reservationError },
        analytics: { revenueData, dashboardData }
      })

    } catch (error) {
      console.error('Test error:', error)
      setTestResults({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Database Connection Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={testDatabaseConnection} disabled={isLoading}>
            {isLoading ? 'Testing...' : 'Test Database Connection'}
          </Button>
          
          {testResults && (
            <div className="mt-4">
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}