import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './components/auth/AuthProvider.tsx'
import { RequireAuth } from './components/auth/RequireAuth.tsx'
import { AdminLayout } from './components/layout/Chrome.tsx'
import { DashboardPage } from './pages/admin/DashboardPage.tsx'
import { EventEditorPage } from './pages/admin/EventEditorPage.tsx'
import { EventsAdminPage } from './pages/admin/EventsAdminPage.tsx'
import { EventDetailPage } from './pages/EventDetailPage.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="events" element={<EventsAdminPage />} />
          <Route path="events/new" element={<EventEditorPage />} />
          <Route path="events/:id" element={<EventEditorPage />} />
        </Route>
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
