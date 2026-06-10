import { NavLink as RouterNavLink } from 'react-router-dom'
import {
  BookOpen,
  BookOpenText,
  Download,
  LayoutDashboard,
  LogOut,
  Package,
  RotateCcw,
  ShoppingCart,
  Wheat,
} from 'lucide-react'
import { usePWAInstall } from '../../hooks/usePWAInstall'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/billing', label: 'Billing', icon: ShoppingCart },
  { to: '/transactions', label: 'Shop Diary', icon: BookOpenText },
  { to: '/khata', label: 'Customer Khata', icon: BookOpen },
  { to: '/returns', label: 'Returns', icon: RotateCcw },
]

export default function Sidebar({ isOpen, onClose, onSignOut }) {
  const { isInstallable, promptInstall } = usePWAInstall()

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-white/10 text-white shadow-sm'
        : 'text-white/70 hover:text-white hover:bg-white/5'
    }`

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1a2e0a] border-r border-[#2d5a1a]/30 text-white flex flex-col transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } no-print`}
    >
      {/* Logo Area */}
      <div className="p-6 border-b border-[#2d5a1a]/30 flex flex-col">
        <div className="flex items-center gap-2">
          <Wheat className="w-6 h-6 text-[#D4870E]" strokeWidth={1.75} />
          <span className="font-serif text-xl text-white font-bold tracking-tight">
            Kisan Khad Bhandar
          </span>
        </div>
        <span className="text-xs text-white/70 mt-1 font-medium font-sans">
          Sachin Aggarwal
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <RouterNavLink
            key={to}
            to={to}
            onClick={onClose}
            className={navLinkClass}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span>{label}</span>
          </RouterNavLink>
        ))}
      </nav>

      {/* Footer Area */}
      <div className="p-4 border-t border-[#2d5a1a]/30 space-y-3">
        {isInstallable && (
          <button
            type="button"
            onClick={promptInstall}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#2D5A1A] hover:bg-[#2D5A1A]/90 text-white transition-colors cursor-pointer"
          >
            <Download className="w-4.5 h-4.5" />
            <span>Install App</span>
          </button>
        )}

        <button
          type="button"
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-white/20 text-white/80 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span>Sign Out</span>
        </button>

        <div className="text-center text-[10px] text-white/50 pt-2 border-t border-white/5">
          © Kisan Khad Bhandar
        </div>
      </div>
    </aside>
  )
}
