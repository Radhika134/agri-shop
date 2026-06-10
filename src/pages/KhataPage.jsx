import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Loader2,
  MessageCircle,
  Phone,
  Search,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { formatINR } from '../utils/format'
import { sendUdharReminder } from '../utils/whatsapp'
import CustomerLedgerModal from '../components/Khata/CustomerLedgerModal'
import RecordPaymentModal from '../components/Khata/RecordPaymentModal'

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border border-primary/20 bg-white text-forest placeholder:text-forest/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors'

const FILTERS = ['All Customers', 'Pending Udhar Only']

export default function KhataPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All Customers')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isLedgerOpen, setIsLedgerOpen] = useState(false)
  const [isRecordOpen, setIsRecordOpen] = useState(false)

  const fetchAllCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('total_pending', { ascending: false })

      if (error) throw error
      setCustomers(data ?? [])
    } catch (error) {
      toast.error(error.message || 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllCustomers()
  }, [fetchAllCustomers])

  // Stats
  const totalPendingUdhar = useMemo(
    () => customers.reduce((sum, c) => sum + (Number(c.total_pending) || 0), 0),
    [customers],
  )

  // Filter + search
  const filteredCustomers = useMemo(() => {
    const term = search.toLowerCase().trim()
    return customers.filter((c) => {
      const matchesSearch =
        !term ||
        c.name?.toLowerCase().includes(term) ||
        c.phone?.includes(term)
      const matchesFilter =
        activeFilter === 'All Customers' || Number(c.total_pending) > 0
      return matchesSearch && matchesFilter
    })
  }, [customers, search, activeFilter])

  const openLedger = (customer) => {
    setSelectedCustomer(customer)
    setIsLedgerOpen(true)
  }

  return (
    <div className="min-h-screen bg-cream p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-forest">Customer Khata</h1>
            <p className="text-forest/60 mt-1">Complete directory of all customers and credit ledger</p>
          </div>
          <button
            type="button"
            onClick={() => setIsRecordOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors shrink-0"
          >
            Record Payment
          </button>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-[#D8E4C8] rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-primary" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm text-forest/60">Total Customers</p>
              <p className="text-3xl font-bold text-forest mt-0.5">{customers.length}</p>
            </div>
          </div>
          <div className="bg-white border-l-4 border-l-danger border-y border-r border-[#D8E4C8] rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-danger" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm text-forest/60">Total Pending Udhar</p>
              <p className="text-3xl font-bold text-danger mt-0.5">
                {formatINR(totalPendingUdhar, 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Search + Filter Toggles */}
        <div className="bg-white border border-[#D8E4C8] rounded-xl p-5 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/40" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone…"
              className={`${inputClass} pl-10`}
            />
          </div>
          {/* Toggle Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === f
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-primary/20 text-forest/70 hover:bg-cream'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#D8E4C8] rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-7 h-7 text-success" strokeWidth={1.75} />
              </div>
              <p className="font-serif text-lg text-forest">
                {search || activeFilter !== 'All Customers'
                  ? 'No customers match your filters.'
                  : 'No customers yet. Add one through Billing!'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-b border-[#D8E4C8] bg-cream/60">
                    {['Customer Name', 'Phone', 'Total Udhar', 'Actions'].map((col) => (
                      <th
                        key={col}
                        className="px-6 py-4 text-xs font-semibold text-forest/60 uppercase tracking-wide"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E4C8]/60">
                  {filteredCustomers.map((customer) => {
                    const pending = Number(customer.total_pending) || 0
                    const hasPending = pending > 0
                    return (
                      <tr key={customer.id} className="hover:bg-cream/40 transition-colors">
                        <td className="px-6 py-4 font-semibold text-forest">{customer.name}</td>
                        <td className="px-6 py-4 text-forest/70">
                          {customer.phone ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-forest/40" />
                              {customer.phone}
                            </span>
                          ) : (
                            <span className="text-forest/30">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-bold text-base ${
                              hasPending ? 'text-danger' : 'text-success'
                            }`}
                          >
                            {hasPending ? formatINR(pending, 0) : '✓ Clear'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => openLedger(customer)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 text-forest text-sm hover:bg-cream transition-colors"
                            >
                              <BookOpen className="w-4 h-4 text-primary" />
                              View Ledger
                            </button>
                            {hasPending && (
                              <button
                                type="button"
                                onClick={() => sendUdharReminder(customer)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-success/25 text-success text-sm hover:bg-success/5 transition-colors"
                              >
                                <MessageCircle className="w-4 h-4" />
                                WhatsApp
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Ledger Modal */}
      {isLedgerOpen && (
        <CustomerLedgerModal
          isOpen={isLedgerOpen}
          customer={selectedCustomer}
          onClose={() => {
            setIsLedgerOpen(false)
            setSelectedCustomer(null)
          }}
        />
      )}

      {/* Record Payment Modal */}
      {isRecordOpen && (
        <RecordPaymentModal
          isOpen={isRecordOpen}
          onClose={() => setIsRecordOpen(false)}
          onSuccess={() => {
            setIsRecordOpen(false)
            fetchAllCustomers()
          }}
        />
      )}
    </div>
  )
}
