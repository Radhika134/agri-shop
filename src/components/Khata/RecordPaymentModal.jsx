import { useEffect, useRef, useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { formatINR } from '../../utils/format'

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border border-primary/20 bg-white text-forest placeholder:text-forest/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors'

export default function RecordPaymentModal({ isOpen, onClose, onSuccess }) {
  const [customers, setCustomers] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [amount, setAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [submitting, setSubmitting] = useState(false)

  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    let mounted = true

    async function fetchDebtors() {
      setLoadingCustomers(true)
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, name, phone, total_pending')
          .gt('total_pending', 0)
          .order('name')

        if (error) throw error
        if (mounted) setCustomers(data ?? [])
      } catch (error) {
        toast.error('Failed to load customers: ' + error.message)
      } finally {
        if (mounted) setLoadingCustomers(false)
      }
    }

    fetchDebtors()

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      mounted = false
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (!isOpen) return null

  // Filter customers locally by search query
  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase().trim()),
  )

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer)
    setSearch(customer.name)
    setShowDropdown(false)
    // Pre-fill amount with pending balance if empty or reset
    setAmount(customer.total_pending.toString())
  }

  const handleClearCustomer = () => {
    setSelectedCustomer(null)
    setSearch('')
    setAmount('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedCustomer) {
      toast.error('Please select a customer')
      return
    }

    const payAmount = Number(amount)
    if (isNaN(payAmount) || payAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0')
      return
    }

    if (payAmount > selectedCustomer.total_pending) {
      toast.error(
        `Paying amount cannot exceed pending balance of ${formatINR(selectedCustomer.total_pending, 2)}`,
      )
      return
    }

    setSubmitting(true)
    try {
      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          customer_id: selectedCustomer.id,
          amount: payAmount,
          payment_mode: paymentMode,
          created_at: new Date(date).toISOString(),
        })

      if (insertError) throw insertError

      toast.success(`Payment of ₹${payAmount} recorded successfully!`)
      onSuccess()
    } catch (error) {
      toast.error(error.message || 'Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-forest/40 backdrop-blur-sm cursor-default"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white border border-[#D8E4C8] rounded-xl shadow-xl overflow-hidden animate-modal-slide-in">
        {/* Header */}
        <div className="p-5 border-b border-[#D8E4C8] flex items-center justify-between bg-cream/35">
          <h2 className="font-serif text-2xl text-forest">Record Payment</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#D8E4C8] text-forest/60 hover:text-forest transition-colors bg-white"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Customer Searchable Dropdown */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-medium text-forest mb-1.5">
              Customer <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setSelectedCustomer(null)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder={loadingCustomers ? 'Loading customers…' : 'Search customer by name…'}
                disabled={loadingCustomers}
                className={`${inputClass} pr-10`}
                autoComplete="off"
              />
              {selectedCustomer ? (
                <button
                  type="button"
                  onClick={handleClearCustomer}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-forest/40 hover:text-forest transition-colors"
                  aria-label="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/40" />
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showDropdown && (
              <ul className="absolute z-20 mt-1 w-full bg-white border border-[#D8E4C8] rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                {filteredCustomers.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-forest/50">
                    {search.trim() ? 'No customers with pending dues found' : 'No customers found'}
                  </li>
                ) : (
                  filteredCustomers.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectCustomer(c)}
                        className="w-full text-left px-4 py-2.5 hover:bg-cream transition-colors flex justify-between items-center gap-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-forest">{c.name}</p>
                          {c.phone && <p className="text-xs text-forest/50 mt-0.5">{c.phone}</p>}
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-danger/10 text-danger shrink-0">
                          {formatINR(c.total_pending, 2)}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}

            {/* Selected Customer Info Badge */}
            {selectedCustomer && (
              <div className="mt-2 text-xs font-medium text-danger bg-danger/5 border border-danger/10 px-3 py-1.5 rounded-lg flex justify-between items-center">
                <span>Current Pending Udhar:</span>
                <span className="font-bold">{formatINR(selectedCustomer.total_pending, 2)}</span>
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <label htmlFor="payment-amount" className="block text-sm font-medium text-forest mb-1.5">
              Amount Paying Now (₹) <span className="text-danger">*</span>
            </label>
            <input
              id="payment-amount"
              type="number"
              min="0.01"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1500"
              className={inputClass}
            />
          </div>

          {/* Payment Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-forest mb-1.5">Payment Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {['Cash', 'UPI'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2.5 rounded-lg font-medium text-sm transition-colors border ${
                    paymentMode === mode
                      ? 'bg-primary text-white border-primary'
                      : 'border-primary/20 text-forest hover:bg-cream bg-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label htmlFor="payment-date" className="block text-sm font-medium text-forest mb-1.5">
              Payment Date
            </label>
            <input
              id="payment-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Submit/Cancel Buttons */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-primary/20 rounded-lg text-forest text-sm font-medium hover:bg-cream transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedCustomer}
              className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording…
                </>
              ) : (
                'Record Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
