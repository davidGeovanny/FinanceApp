import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1923] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#3D8BFF] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#8899AA] text-sm">Cargando...</span>
        </div>
      </div>
    )
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export function PublicRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1923] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#3D8BFF] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />
}