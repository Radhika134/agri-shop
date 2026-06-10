import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Banknote,
  Calendar,
  Clock,
  Eye,
  Filter,
  Loader2,
  Receipt,
  RotateCcw,
  Search,
  Smartphone,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import TransactionDetailModal from '../components/TransactionHistory/TransactionDetailModal'
import { supabase } from '../lib/supabase'
import { formatDateTime, formatINR } from '../utils/format'

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border border-primary/20 bg-white text-forest placeholder:text-forest/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors'

const TYPE_BADGE = {
  bill: 'bg-danger/12 text-danger',
  payment: 'bg-success/15 text-success',
  return: 'bg-accent/15 text-accent',
}
const TYPE_ICON = {
  bill: Receipt,
  payment: Banknote,
  return: RotateCcw,
}
const TYPE_LABEL = { bill: 'Bill', payment: 'Payment', return: 'Return' }

const MODE_BADGE = {
  Cash: 'bg-success/15 text-success',
  UPI: 'bg-teal/15 text-teal',
  Udhar: 'bg-danger/15 text-danger',
}
const MODE_ICON = { Cash: Banknote, UPI: Smartphone, Udhar: Clock }

function toStartOfDay(s) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d).toISOString()
}
function toEndOfDay(s) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()
}

export default function TransactionHistoryPage() {
  const [bills, setBills] = useState([])
  const [payments, setPayments] = useState([])
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [selectedTx, setSelectedTx] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const from = toStartOfDay(dateFrom)
      const to = toEndOfDay(dateTo)

      // Bills
      let billsQ = supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false })
      if (from) billsQ = billsQ.gte('created_at', from)
      if (to) billsQ = billsQ.lte('created_at', to)
      if (search.trim()) billsQ = billsQ.ilike('customer_name', `%${search.trim()}%`)

      // Payments (join customer name)
      let paymentsQ = supabase
        .from('payments')
        .select('*, customers(name)')
        .order('created_at', { ascending: false })
      if (from) paymentsQ = paymentsQ.gte('created_at', from)
      if (to) paymentsQ = paymentsQ.lte('created_at', to)

      // Returns (join customer name via bills)
      let returnsQ = supabase
        .from('returns')
        .select('*, bills(customer_name)')
        .order('created_at', { ascending: false })
      if (from) returnsQ = returnsQ.gte('created_at', from)
      if (to) returnsQ = returnsQ.lte('created_at', to)

      const [bRes, pRes, rRes] = await Promise.all([billsQ, paymentsQ, returnsQ])
      if (bRes.error) throw bRes.error
      if (pRes.error) throw pRes.error
      if (rRes.error) throw rRes.error

      setBills(
        (bRes.data ?? []).map((b) => ({
          ...b,
          type: 'bill',
          displayAmount: Number(b.total_amount),
          customerDisplay: b.customer_name ?? 'Walk-in Customer',
        })),
      )
      setPayments(
        (pRes.data ?? []).map((p) => ({
          ...p,
          type: 'payment',
          displayAmount: Number(p.amount),
          payment_mode: p.payment_mode ?? 'Cash',
          customerDisplay: p.customers?.name ?? 'Unknown',
          customer_name: p.customers?.name ?? 'Unknown',
        })),
      )
      setReturns(
        (rRes.data ?? []).map((r) => ({
          ...r,
          type: 'return',
          displayAmount: Number(r.refund_amount),
          customerDisplay: r.bills?.customer_name ?? 'Unknown',
          customer_name: r.bills?.customer_name ?? 'Unknown',
        })),
      )
    } catch (err) {
      toast.error(err.message || 'Failed to load diary entries')
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, search])

  useEffect(() => {
    const t = setTimeout(fetchData, search ? 350 : 0)
    return () => clearTimeout(t)
  }, [fetchData])

  // Merge + client-side type filter
  const transactions = useMemo(() => {
    const term = search.trim().toLowerCase()
    let merged = []
    if (typeFilter !== 'Payments' && typeFilter !== 'Returns') merged = [...merged, ...bills]
    if (typeFilter !== 'Bills' && typeFilter !== 'Returns') {
      const filteredPayments = term
        ? payments.filter((p) => p.customerDisplay.toLowerCase().includes(term))
        : payments
      merged = [...merged, ...filteredPayments]
    }
    if (typeFilter !== 'Bills' && typeFilter !== 'Payments') {
      const filteredReturns = term
        ? returns.filter((r) => r.customerDisplay.toLowerCase().includes(term))
        : returns
      merged = [...merged, ...filteredReturns]
    }
    return merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [bills, payments, returns, typeFilter, search])

  // Stats
  const stats = useMemo(() => ({
    totalBilled: bills.reduce((s, b) => s + b.displayAmount, 0),
    totalReceived: payments.reduce((s, p) => s + p.displayAmount, 0),
    totalRefunded: returns.reduce((s, r) => s + r.displayAmount, 0),
  }), [bills, payments, returns])

  return (
    <div className="min-h-screen bg-cream p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <header>
          <h1 className="font-serif text-3xl text-forest">Shop Diary</h1>
          <p className="text-forest/60 mt-1">Complete log of all bills, payments, and returns</p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Billed', value: stats.totalBilled, color: 'text-forest', bg: 'bg-danger/10', Icon: Receipt, iconColor: 'text-danger' },
            { label: 'Payments Received', value: stats.totalReceived, color: 'text-success', bg: 'bg-success/10', Icon: TrendingDown, iconColor: 'text-success' },
            { label: 'Refunds Issued', value: stats.totalRefunded, color: 'text-accent', bg: 'bg-accent/10', Icon: TrendingUp, iconColor: 'text-accent' },
          ].map(({ label, value, color, bg, Icon, iconColor }) => (
            <div key={label} className="bg-white border border-[#D8E4C8] rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm text-forest/60">{label}</p>
                <p className={`text-xl font-bold mt-0.5 ${color}`}>{formatINR(value, 0)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white border border-[#D8E4C8] rounded-xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label htmlFor="diary-search" className="block text-sm font-medium text-forest mb-1.5">Customer Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/40" />
                <input
                  id="diary-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customer…"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
            {/* From */}
            <div>
              <label htmlFor="diary-from" className="block text-sm font-medium text-forest mb-1.5">From</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/40 pointer-events-none" />
                <input id="diary-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`${inputClass} pl-10`} />
              </div>
            </div>
            {/* To */}
            <div>
              <label htmlFor="diary-to" className="block text-sm font-medium text-forest mb-1.5">To</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/40 pointer-events-none" />
                <input id="diary-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`${inputClass} pl-10`} />
              </div>
            </div>
            {/* Type */}
            <div>
              <label htmlFor="diary-type" className="block text-sm font-medium text-forest mb-1.5">Type</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/40 pointer-events-none" />
                <select
                  id="diary-type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={`${inputClass} pl-10 appearance-none`}
                >
                  {['All', 'Bills', 'Payments', 'Returns'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#D8E4C8] rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Receipt className="w-7 h-7 text-primary" strokeWidth={1.75} />
              </div>
              <p className="text-forest/60">No entries found</p>
              {(search || dateFrom || dateTo || typeFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setTypeFilter('All') }}
                  className="mt-3 text-sm text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead>
                  <tr className="border-b border-[#D8E4C8] bg-cream/60">
                    {['Date / Time', 'Customer', 'Type', 'Mode', 'Amount (₹)', 'Action'].map((col) => (
                      <th
                        key={col}
                        className={`px-5 py-3.5 text-xs font-semibold text-forest/60 uppercase tracking-wide ${col === 'Amount (₹)' ? 'text-right' : ''}`}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E4C8]/50">
                  {transactions.map((tx) => {
                    const TypeIcon = TYPE_ICON[tx.type]
                    const ModeIcon = MODE_ICON[tx.payment_mode] ?? Banknote
                    return (
                      <tr key={`${tx.type}-${tx.id}`} className="hover:bg-cream/40 transition-colors">
                        <td className="px-5 py-3.5 text-sm text-forest/70 whitespace-nowrap">
                          {formatDateTime(tx.created_at)}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-forest">
                          {tx.customerDisplay}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_BADGE[tx.type]}`}>
                            <TypeIcon className="w-3 h-3" />
                            {TYPE_LABEL[tx.type]}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {tx.payment_mode ? (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${MODE_BADGE[tx.payment_mode] ?? 'bg-forest/10 text-forest/60'}`}>
                              <ModeIcon className="w-3 h-3" />
                              {tx.payment_mode}
                            </span>
                          ) : (
                            tx.type === 'return' ? (
                              <span className="text-forest/30 text-sm">—</span>
                            ) : (
                              <span className="text-forest/30 text-sm">—</span>
                            )
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <p className={`font-bold text-sm ${tx.type === 'payment' ? 'text-success' : tx.type === 'return' ? 'text-accent' : 'text-forest'}`}>
                            {tx.type === 'payment' ? '+ ' : tx.type === 'return' ? '↩ ' : ''}
                            {formatINR(tx.displayAmount, 2)}
                          </p>
                          {tx.type === 'bill' && Number(tx.amount_due) > 0 && (
                            <p className="text-xs text-danger font-semibold mt-0.5">
                              Due: {formatINR(tx.amount_due, 2)}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() => setSelectedTx(tx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 text-forest text-sm hover:bg-cream transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </button>
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

      <TransactionDetailModal
        isOpen={Boolean(selectedTx)}
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  )
}
