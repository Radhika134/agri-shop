import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border border-primary/20 bg-white text-forest placeholder:text-forest/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors'

export default function CustomerNameInput({
  name,
  selectedCustomerId,
  onNameChange,
  onCustomerSelect,
  onCustomerClear,
}) {
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searching, setSearching] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!name.trim() || name.trim().length < 2) {
      setSuggestions([])
      return undefined
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, name, phone')
          .ilike('name', `%${name.trim()}%`)
          .order('name')
          .limit(6)

        if (error) throw error
        setSuggestions(data ?? [])
        setShowSuggestions(true)
      } catch (error) {
        toast.error(error.message || 'Failed to search customers')
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [name])

  const handleNameChange = (value) => {
    onNameChange(value)
    if (selectedCustomerId) onCustomerClear()
    setShowSuggestions(true)
  }

  const handleSelect = (customer) => {
    onCustomerSelect(customer)
    setShowSuggestions(false)
    setSuggestions([])
  }

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor="customer-name" className="block text-sm font-medium text-forest mb-1.5">
        Name <span className="text-danger">*</span>
      </label>
      <input
        id="customer-name"
        type="text"
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        className={inputClass}
        placeholder="Customer name"
        autoComplete="off"
      />

      {showSuggestions && name.trim().length >= 2 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-[#D8E4C8] rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {searching ? (
            <li className="px-4 py-3 text-sm text-forest/50">Searching…</li>
          ) : suggestions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-forest/50">No matching customers</li>
          ) : (
            suggestions.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(customer)}
                  className="w-full text-left px-4 py-2.5 hover:bg-cream transition-colors"
                >
                  <p className="text-sm font-medium text-forest">{customer.name}</p>
                  {customer.phone && (
                    <p className="text-xs text-forest/50 mt-0.5">{customer.phone}</p>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
