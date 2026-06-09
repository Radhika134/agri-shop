import { useCallback, useEffect, useState } from 'react'
import {
  Calendar,
  Eye,
  Filter,
  Loader2,
  Receipt,
  Search,
} from 'lucide-react'
import toast from 'react-hot-toast'
import BillDetailModal from '../components/BillHistory/BillDetailModal'
import { supabase } from '../lib/supabase'
import { formatDateTime, formatINR } from '../utils/format'

const PAYMENT_MODES = ['All', 'Cash', 'UPI', 'Udhar']

const PAYMENT_BADGE = {
  Cash: 'bg-success/15 text-success',
  UPI: 'bg-teal/15 text-teal',
  Udhar: 'bg-danger/15 text-danger',
}

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border border-primary/20 bg-white text-forest placeholder:text-forest/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors'

function toStartOfDay(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toISOString()
}

function toEndOfDay(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()
}

export default function BillHistoryPage() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [paymentMode, setPaymentMode] = useState('All')
  const [selectedBillId, setSelectedBillId] = useState(null)

  const fetchBills = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false })

      if (paymentMode !== 'All') {
        query = query.eq('payment_mode', paymentMode)
      }

      const fromIso = toStartOfDay(dateFrom)
      const toIso = toEndOfDay(dateTo)

      if (fromIso) query = query.gte('created_at', fromIso)
      if (toIso) query = query.lte('created_at', toIso)

      if (search.trim()) {
        query = query.ilike('customer_name', `%${search.trim()}%`)
      }

      const { data, error } = await query
      if (error) throw error
      setBills(data ?? [])
    } catch (error) {
      toast.error(error.message || 'Failed to load bills')
    } finally {
      setLoading(false)
    }
  }, [search, dateFrom, dateTo, paymentMode])

  useEffect(() => {
    const timer = setTimeout(fetchBills, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchBills, search])

  return (
    <div className="min-h-screen bg-cream p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-serif text-3xl text-forest mb-6">Bill History</h1>

        <div className="bg-white border border-[#D8E4C8] rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label htmlFor="bill-search" className="block text-sm font-medium text-forest mb-1.5">
                Customer Name
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/40" />
                <input
                  id="bill-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customer…"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-forest mb-1.5">
                From
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/40 pointer-events-none" />
                <input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-forest mb-1.5">
                To
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/40 pointer-events-none" />
                <input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="payment-filter" className="block text-sm font-medium text-forest mb-1.5">
                Payment Mode
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/40 pointer-events-none" />
                <select
                  id="payment-filter"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className={`${inputClass} pl-10 appearance-none`}
                >
                  {PAYMENT_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#D8E4C8] rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Receipt className="w-7 h-7 text-primary" strokeWidth={1.75} />
              </div>
              <p className="text-forest/60">No bills found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-[#D8E4C8] bg-cream/60">
                    <th className="px-4 py-3 text-xs font-semibold text-forest/60 uppercase tracking-wide">
                      Date / Time
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-forest/60 uppercase tracking-wide">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-forest/60 uppercase tracking-wide">
                      Payment Mode
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-forest/60 uppercase tracking-wide">
                      Total
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-forest/60 uppercase tracking-wide">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E4C8]/60">
                  {bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-cream/40 transition-colors">
                      <td className="px-4 py-3 text-sm text-forest whitespace-nowrap">
                        {formatDateTime(bill.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium text-forest">
                        {bill.customer_name ?? 'Walk-in Customer'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                            PAYMENT_BADGE[bill.payment_mode] ?? 'bg-forest/10 text-forest/60'
                          }`}
                        >
                          {bill.payment_mode}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-forest">
                        {formatINR(bill.total_amount, 2)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setSelectedBillId(bill.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 text-forest text-sm hover:bg-cream transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <BillDetailModal
        isOpen={Boolean(selectedBillId)}
        billId={selectedBillId}
        onClose={() => setSelectedBillId(null)}
      />
    </div>
  )
}
