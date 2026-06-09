import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { History, LayoutDashboard, LogOut, Package, ShoppingCart, Sprout } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/billing', label: 'Billing', icon: ShoppingCart },
  { to: '/bill-history', label: 'Bill History', icon: History },
]

const navLinkClass = ({ isActive }) =>
  `inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary text-white'
      : 'text-forest/70 hover:text-forest hover:bg-white'
  }`

export default function AppLayout() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      toast.error(error.message || 'Failed to sign out')
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-[#D8E4C8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <NavLink to="/dashboard" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Sprout className="w-5 h-5 text-primary" strokeWidth={1.75} />
              </div>
              <span className="font-serif text-xl text-forest hidden sm:block">AgriShop</span>
            </NavLink>

            <nav className="flex items-center gap-1 overflow-x-auto">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={navLinkClass}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden md:inline">{label}</span>
                </NavLink>
              ))}
            </nav>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-forest/60 hover:text-forest hover:bg-white transition-colors shrink-0"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}
