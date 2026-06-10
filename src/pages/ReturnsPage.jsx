import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import ReturnModal from '../components/Returns/ReturnModal'
import { supabase } from '../lib/supabase'
import { formatDateTime, formatINR } from '../utils/format'

const REASON_BADGE = {
  Expired: 'bg-danger/10 text-danger',
  Damaged: 'bg-accent/10 text-accent',
  'Wrong Item': 'bg-teal/10 text-teal',
  'Not Needed': 'bg-forest/10 text-forest/60',
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchReturns = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('returns')
        .select('*, bills(customer_name, payment_mode)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setReturns(data ?? [])
    } catch (err) {
      toast.error(err.message || 'Failed to load returns')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReturns()
  }, [fetchReturns])

  return (
    <div className="min-h-screen bg-cream p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-forest">Item Returns</h1>
            <p className="text-forest/60 mt-1">Track returned products and refunds</p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Process New Return
          </button>
        </header>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#D8E4C8] rounded-xl p-5">
            <p className="text-sm text-forest/60">Total Returns</p>
            <p className="text-2xl font-bold text-forest mt-1">{returns.length}</p>
          </div>
          <div className="bg-white border border-[#D8E4C8] rounded-xl p-5">
            <p className="text-sm text-forest/60">Total Refunded</p>
            <p className="text-2xl font-bold text-accent mt-1">
              {formatINR(returns.reduce((s, r) => s + (Number(r.refund_amount) || 0), 0), 2)}
            </p>
          </div>
          <div className="hidden sm:block bg-white border border-[#D8E4C8] rounded-xl p-5">
            <p className="text-sm text-forest/60">Stock Restored</p>
            <p className="text-2xl font-bold text-success mt-1">
              {returns.reduce((s, r) => s + (Number(r.quantity) || 0), 0)} units
            </p>
          </div>
        </div>

        {/* Returns Table */}
        <div className="bg-white border border-[#D8E4C8] rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : returns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <RotateCcw className="w-7 h-7 text-accent" strokeWidth={1.75} />
              </div>
              <p className="font-serif text-lg text-forest">No returns processed yet.</p>
              <p className="text-sm text-forest/50 mt-1">
                Click "Process New Return" to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead>
                  <tr className="border-b border-[#D8E4C8] bg-cream/60">
                    {['Date / Time', 'Bill #', 'Customer', 'Product', 'Qty', 'Refund Amount', 'Reason'].map(
                      (col) => (
                        <th
                          key={col}
                          className="px-5 py-3.5 text-xs font-semibold text-forest/60 uppercase tracking-wide whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E4C8]/50">
                  {returns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-cream/40 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-forest/70 whitespace-nowrap">
                        {formatDateTime(ret.created_at)}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-sm font-semibold text-primary">
                        #{(ret.bill_id ?? '').slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-forest">
                        {ret.bills?.customer_name ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-forest">{ret.product_name}</td>
                      <td className="px-5 py-3.5 text-center font-bold text-forest">
                        {ret.quantity}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-accent">
                        {formatINR(ret.refund_amount, 2)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                            REASON_BADGE[ret.reason] ?? 'bg-forest/10 text-forest/60'
                          }`}
                        >
                          {ret.reason}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Return Modal */}
      {isModalOpen && (
        <ReturnModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false)
            fetchReturns()
          }}
        />
      )}
    </div>
  )
}
