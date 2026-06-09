import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthContextProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import InventoryPage from './pages/InventoryPage'
import BillingPage from './pages/BillingPage'
import BillHistoryPage from './pages/BillHistoryPage'

export default function App() {
  return (
    <AuthContextProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#FAFDF6',
              color: '#1A2E0A',
              border: '1px solid rgba(45, 90, 26, 0.2)',
            },
            success: {
              iconTheme: { primary: '#2D5A1A', secondary: '#FAFDF6' },
            },
            error: {
              iconTheme: { primary: '#D4870E', secondary: '#FAFDF6' },
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/bill-history" element={<BillHistoryPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContextProvider>
  )
}
