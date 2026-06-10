import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      toast.error(error.message || 'Failed to sign out')
    }
  }

  return (
    <div className="flex min-h-screen bg-cream">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-forest/40 backdrop-blur-sm lg:hidden no-print"
        />
      )}

      {/* Navigation Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSignOut={handleSignOut}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen lg:pl-64">
        {/* Mobile Header Bar */}
        <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-[#D8E4C8] flex items-center justify-between h-16 px-4 lg:hidden no-print shrink-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-forest hover:bg-white cursor-pointer"
            title="Open Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-serif text-lg text-forest font-bold">
            Kisan Khad Bhandar
          </span>
          <div className="w-10" /> {/* Spacer */}
        </header>

        {/* Content Area */}
        <main className="flex-1 min-h-0">
          <Outlet />
        </main>

        {/* Sticky Footer */}
        <footer className="border-t border-[#D8E4C8] py-4 bg-white/50 text-center text-xs text-forest/60 no-print shrink-0">
          © 2024 Kisan Khad Bhandar | Owned by Sachin Aggarwal
        </footer>
      </div>
    </div>
  )
}
