import { useState } from 'react'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import PreferencesPage, { type PlanPreferences } from './pages/PreferencesPage'

type Page = 'dashboard' | 'preferences'

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [page, setPage] = useState<Page>('dashboard')

  function handleSignOut() {
    localStorage.removeItem('token')
    setToken(null)
    setPage('dashboard')
  }

  function handlePlanSubmit(prefs: PlanPreferences) {
    // TODO: call POST /api/recommend and navigate to results page
    console.log('Plan preferences submitted:', prefs)
  }

  if (!token) {
    return <AuthPage onSuccess={setToken} />
  }

  if (page === 'preferences') {
    return (
      <PreferencesPage
        onBack={() => setPage('dashboard')}
        onSubmit={handlePlanSubmit}
      />
    )
  }

  return (
    <DashboardPage
      onSignOut={handleSignOut}
      onCreatePlan={() => setPage('preferences')}
    />
  )
}
