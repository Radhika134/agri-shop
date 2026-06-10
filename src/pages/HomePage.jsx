import { LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      toast.error(error.message || 'Failed to sign out')
    }
  }

  return (
    <div className="min-h-screen bg-cream p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-primary/20 rounded-2xl shadow-sm p-8">
          <h1 className="font-serif text-3xl text-forest">Welcome to Kisan Khad Bhandar</h1>
          <p className="text-forest/60 mt-2">Signed in as {user?.email}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 text-forest hover:bg-primary/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
