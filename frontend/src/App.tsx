import { useState } from 'react'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  function handleSignOut() {
    localStorage.removeItem('token')
    setToken(null)
  }

  if (token) {
    return <DashboardPage onSignOut={handleSignOut} />
  }

  return <AuthPage onSuccess={setToken} />
}
