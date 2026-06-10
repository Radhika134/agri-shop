import { useEffect, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  IndianRupee,
  Loader2,
  MessageCircle,
  RotateCcw,
  ShoppingBag,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { formatDateTime, formatINR } from '../../utils/format'
import { sendUdharReminder } from '../../utils/whatsapp'

// ── Timeline entry config ───────────────────────────────────────────────────
const TYPE_CONFIG = {
  bill: {
    icon: ShoppingBag,
    dotClass: 'bg-danger/10 text-danger',
    cardClass: 'bg-danger/[0.025] border-danger/15 hover:bg-danger/[0.04]',
    labelClass: 'text-danger',
    label: 'Purchase',
  },
  payment: {
    icon: IndianRupee,
    dotClass: 'bg-success/10 text-success',
    cardClass: 'bg-success/[0.025] border-success/15 hover:bg-success/[0.04]',
    labelClass: 'text-success',
    label: 'Payment',
  },
  return: {
    icon: RotateCcw,
    dotClass: 'bg-accent/10 text-accent',
    cardClass: 'bg-accent/[0.025] border-accent/15 hover:bg-accent/[0.04]',
    labelClass: 'text-accent',
    label: 'Return',
  },
}

// ── Collapsible Bill Items ──────────────────────────────────────────────────
function BillItemsToggle({ billId }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  const toggle = async () => {
    if (!open && !fetched) {
      setLoading(true)
      const { data, error } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', billId)
      setLoading(false)
      setFetched(true)
      if (!error) setItems(data ?? [])
    }
    setOpen((prev) => !prev)
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors font-medium"
      >
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {open ? 'Hide items' : 'View items'}
      </button>
      {open && (
        <div className="mt-2 rounded-lg overflow-hidden border border-[#D8E4C8]/50">
          {loading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-xs text-forest/40 px-3 py-2">No items found</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-cream/60 border-b border-[#D8E4C8]/50">
                <tr>
                  <th className="px-3 py-1.5 text-left text-forest/50 font-semibold">Product</th>
                  <th className="px-3 py-1.5 text-center text-forest/50 font-semibold">Qty</th>
                  <th className="px-3 py-1.5 text-right text-forest/50 font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E4C8]/40 bg-white/60">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-1.5 text-forest/80">{item.product_name}</td>
                    <td className="px-3 py-1.5 text-center text-forest/60">{item.quantity}</td>
                    <td className="px-3 py-1.5 text-right font-medium text-forest">
                      {formatINR(item.subtotal, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Modal ──────────────────────────────────────────────────────────────
export default function CustomerLedgerModal({ isOpen, customer, onClose }) {
  const [timelineItems, setTimelineItems] = useState([])
  const [totals, setTotals] = useState({ totalPurchases: 0, totalPayments: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !customer?.id) return
    let mounted = true

    async function fetchLedgerData() {
      setLoading(true)
      try {
        // Fetch all bills for this customer (all modes, not just Udhar)
        const { data: billsData, error: billsErr } = await supabase
          .from('bills')
          .select('*')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false })
        if (billsErr) throw billsErr

        const billIds = (billsData ?? []).map((b) => b.id)

        // Parallel fetch: payments + returns keyed to those bills
        const [paymentsRes, returnsRes] = await Promise.all([
          supabase
            .from('payments')
            .select('*')
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: false }),
          billIds.length > 0
            ? supabase
                .from('returns')
                .select('*')
                .in('bill_id', billIds)
                .order('created_at', { ascending: false })
            : Promise.resolve({ data: [], error: null }),
        ])

        if (paymentsRes.error) throw paymentsRes.error
        if (returnsRes.error) throw returnsRes.error

        const bills = (billsData ?? []).map((b) => ({ ...b, type: 'bill' }))
        const payments = (paymentsRes.data ?? []).map((p) => ({ ...p, type: 'payment' }))
        const returns_ = (returnsRes.data ?? []).map((r) => ({ ...r, type: 'return' }))

        const merged = [...bills, ...payments, ...returns_].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        )

        const totalPurchases = bills.reduce((s, b) => s + (Number(b.total_amount) || 0), 0)
        const totalPayments = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)

        if (mounted) {
          setTimelineItems(merged)
          setTotals({ totalPurchases, totalPayments })
        }
      } catch (err) {
        toast.error(err.message || 'Failed to fetch customer ledger')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchLedgerData()
    return () => { mounted = false }
  }, [isOpen, customer])

  if (!isOpen || !customer) return null

  const hasPending = Number(customer.total_pending) > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-forest/40 backdrop-blur-sm cursor-default"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white border border-[#D8E4C8] rounded-xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#D8E4C8] flex items-center justify-between bg-cream/35 shrink-0">
          <div>
            <h2 className="font-serif text-2xl text-forest">{customer.name}</h2>
            <p className="text-sm text-forest/55 mt-0.5">
              {customer.phone ?? 'No phone'} · Customer Ledger
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#D8E4C8] text-forest/60 hover:text-forest transition-colors bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Summary Cards */}
        <div className="p-4 bg-cream/15 grid grid-cols-3 gap-3 border-b border-[#D8E4C8]/65 shrink-0 text-center">
          <div className="p-2.5 bg-white border border-[#D8E4C8] rounded-lg">
            <span className="text-[11px] text-forest/50 block font-medium">Total Purchases</span>
            <span className="text-sm font-bold text-forest mt-1 block">
              {formatINR(totals.totalPurchases, 0)}
            </span>
          </div>
          <div className="p-2.5 bg-white border border-[#D8E4C8] rounded-lg">
            <span className="text-[11px] text-forest/50 block font-medium">Total Payments</span>
            <span className="text-sm font-bold text-success mt-1 block">
              {formatINR(totals.totalPayments, 0)}
            </span>
          </div>
          <div className={`p-2.5 bg-white border rounded-lg ${hasPending ? 'border-danger/25' : 'border-success/25'}`}>
            <span className="text-[11px] text-forest/50 block font-medium">Balance Due</span>
            <span className={`text-sm font-black mt-1 block ${hasPending ? 'text-danger' : 'text-success'}`}>
              {hasPending ? formatINR(customer.total_pending, 0) : '✓ Clear'}
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-5 overflow-y-auto flex-1">
          <h3 className="font-serif text-lg text-forest mb-4">Financial History</h3>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : timelineItems.length === 0 ? (
            <p className="text-sm text-forest/50 text-center py-8">
              No transactions found for this customer.
            </p>
          ) : (
            <div className="relative pl-6 border-l-2 border-[#D8E4C8] ml-2 space-y-5">
              {timelineItems.map((item) => {
                const cfg = TYPE_CONFIG[item.type]
                const Icon = cfg.icon
                return (
                  <div key={`${item.type}-${item.id}`} className="relative">
                    {/* Icon dot on timeline line */}
                    <span
                      className={`absolute -left-[34px] top-2 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${cfg.dotClass}`}
                    >
                      <Icon className="w-3 h-3" strokeWidth={2.5} />
                    </span>

                    <div className={`p-3.5 border rounded-lg transition-colors ${cfg.cardClass}`}>
                      {/* Row: label + amount */}
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold uppercase tracking-wide ${cfg.labelClass}`}>
                            {cfg.label}
                          </p>

                          {item.type === 'bill' && (
                            <p className="text-sm text-forest/80 mt-1 leading-snug">
                              Purchased items ·{' '}
                              <span className="font-mono font-semibold text-forest/60">
                                Bill #{item.id.slice(0, 8).toUpperCase()}
                              </span>
                              <br />
                              <span className="text-xs">
                                Total:{' '}
                                <span className="font-semibold text-forest">
                                  {formatINR(item.total_amount, 0)}
                                </span>{' '}
                                · Paid:{' '}
                                <span className="font-semibold text-success">
                                  {formatINR(item.amount_paid, 0)}
                                </span>{' '}
                                ({item.payment_mode})
                                {Number(item.amount_due) > 0 && (
                                  <>
                                    {' '}· Due:{' '}
                                    <span className="font-bold text-danger">
                                      {formatINR(item.amount_due, 0)}
                                    </span>
                                  </>
                                )}
                              </span>
                            </p>
                          )}

                          {item.type === 'payment' && (
                            <p className="text-sm text-forest/80 mt-1">
                              Payment Recorded ·{' '}
                              <span className="font-semibold text-success">
                                {formatINR(item.amount, 0)}
                              </span>{' '}
                              via {item.payment_mode ?? 'Cash'}
                            </p>
                          )}

                          {item.type === 'return' && (
                            <p className="text-sm text-forest/80 mt-1">
                              Item Returned ·{' '}
                              <span className="font-semibold">{item.product_name}</span>{' '}
                              × {item.quantity}
                              <br />
                              <span className="text-xs">
                                Refund:{' '}
                                <span className="font-bold text-accent">
                                  {formatINR(item.refund_amount, 0)}
                                </span>{' '}
                                · Reason:{' '}
                                <span className="font-medium">{item.reason}</span>
                              </span>
                            </p>
                          )}
                        </div>

                        {/* Amount chip */}
                        {item.type === 'bill' && (
                          <span className="text-sm font-black text-danger shrink-0">
                            {formatINR(item.total_amount, 0)}
                          </span>
                        )}
                        {item.type === 'payment' && (
                          <span className="text-sm font-black text-success shrink-0">
                            +{formatINR(item.amount, 0)}
                          </span>
                        )}
                        {item.type === 'return' && (
                          <span className="text-sm font-black text-accent shrink-0">
                            ↩ {formatINR(item.refund_amount, 0)}
                          </span>
                        )}
                      </div>

                      {/* Collapsible items for bills */}
                      {item.type === 'bill' && <BillItemsToggle billId={item.id} />}

                      <p className="text-[10px] text-forest/35 mt-2 font-medium">
                        {formatDateTime(item.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#D8E4C8] bg-cream/20 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-primary/20 rounded-lg text-forest text-sm font-medium hover:bg-white transition-colors"
          >
            Close
          </button>
          {hasPending && (
            <button
              type="button"
              onClick={() => sendUdharReminder(customer)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Send WhatsApp Reminder
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
