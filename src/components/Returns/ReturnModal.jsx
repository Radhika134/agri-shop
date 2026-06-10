import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, Loader2, RotateCcw, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { formatINR } from '../../utils/format'

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border border-primary/20 bg-white text-forest placeholder:text-forest/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors'

const RETURN_REASONS = ['Expired', 'Damaged', 'Wrong Item', 'Not Needed']

export default function ReturnModal({ isOpen, onClose, onSuccess }) {
  // Step 1 — bill selection
  const [billSearch, setBillSearch] = useState('')
  const [bills, setBills] = useState([])
  const [loadingBills, setLoadingBills] = useState(false)
  const [showBillDropdown, setShowBillDropdown] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)
  const billDropdownRef = useRef(null)

  // Step 2 — item selection
  const [billItems, setBillItems] = useState([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  // Step 3 — return details
  const [returnQty, setReturnQty] = useState(1)
  const [reason, setReason] = useState(RETURN_REASONS[0])
  const [submitting, setSubmitting] = useState(false)

  // ── Fetch recent bills on open ────────────────────────────────────────────
  const fetchBills = useCallback(async (query = '') => {
    setLoadingBills(true)
    try {
      let q = supabase
        .from('bills')
        .select('id, customer_name, total_amount, payment_mode, customer_id, created_at')
        .order('created_at', { ascending: false })
        .limit(30)

      if (query.trim()) {
        q = q.ilike('customer_name', `%${query.trim()}%`)
      }

      const { data, error } = await q
      if (error) throw error
      setBills(data ?? [])
    } catch (err) {
      toast.error('Failed to load bills: ' + err.message)
    } finally {
      setLoadingBills(false)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    fetchBills()

    const handleClickOutside = (e) => {
      if (billDropdownRef.current && !billDropdownRef.current.contains(e.target)) {
        setShowBillDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, fetchBills])

  // Debounce bill search
  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(() => fetchBills(billSearch), 300)
    return () => clearTimeout(t)
  }, [billSearch, fetchBills, isOpen])

  // ── Fetch bill items when bill is selected ────────────────────────────────
  useEffect(() => {
    if (!selectedBill) {
      setBillItems([])
      setSelectedItem(null)
      return
    }
    let mounted = true
    async function fetchItems() {
      setLoadingItems(true)
      try {
        const { data, error } = await supabase
          .from('bill_items')
          .select('*')
          .eq('bill_id', selectedBill.id)
        if (error) throw error
        if (mounted) setBillItems(data ?? [])
      } catch (err) {
        toast.error('Failed to load bill items: ' + err.message)
      } finally {
        if (mounted) setLoadingItems(false)
      }
    }
    fetchItems()
    return () => { mounted = false }
  }, [selectedBill])

  if (!isOpen) return null

  // ── Computed values ───────────────────────────────────────────────────────
  const refundAmount = selectedItem ? Number(returnQty) * Number(selectedItem.price) : 0
  const maxQty = selectedItem?.quantity ?? 1

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleBillSelect = (bill) => {
    setSelectedBill(bill)
    setBillSearch(`#${bill.id.slice(0, 8).toUpperCase()} — ${bill.customer_name}`)
    setShowBillDropdown(false)
    setSelectedItem(null)
    setReturnQty(1)
  }

  const handleClearBill = () => {
    setSelectedBill(null)
    setBillSearch('')
    setBillItems([])
    setSelectedItem(null)
  }

  const handleItemSelect = (item) => {
    setSelectedItem(item)
    setReturnQty(1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedBill) { toast.error('Please select a bill'); return }
    if (!selectedItem) { toast.error('Please select an item to return'); return }
    if (returnQty < 1 || returnQty > maxQty) {
      toast.error(`Return quantity must be between 1 and ${maxQty}`)
      return
    }

    setSubmitting(true)
    try {
      // Insert into returns table.
      // The DB trigger `process_return_effects` automatically:
      //   1. Restores stock in 'products'
      //   2. Reduces customer's total_pending (if original bill was Udhar)
      const { error: returnError } = await supabase.from('returns').insert({
        bill_id: selectedBill.id,
        product_id: selectedItem.product_id,
        product_name: selectedItem.product_name,
        quantity: Number(returnQty),
        refund_amount: refundAmount,
        reason,
      })
      if (returnError) throw returnError

      toast.success('Return processed! Stock updated.')
      onSuccess()
    } catch (err) {
      toast.error(err.message || 'Failed to process return')
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

      {/* Modal card */}
      <div className="relative w-full max-w-xl bg-white border border-[#D8E4C8] rounded-xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col animate-modal-slide-in">
        {/* Header */}
        <div className="p-5 border-b border-[#D8E4C8] flex items-center justify-between bg-cream/35 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="font-serif text-xl text-forest">Process Return</h2>
              <p className="text-xs text-forest/50 mt-0.5">Select bill → item → quantity</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#D8E4C8] text-forest/60 hover:text-forest transition-colors bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-6">
          {/* ── STEP 1: Select Bill ─────────────────────────────────────── */}
          <div>
            <p className="text-xs font-bold text-forest/40 uppercase tracking-widest mb-2">
              Step 1 — Select Bill
            </p>
            <div ref={billDropdownRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/40" />
                <input
                  type="text"
                  value={billSearch}
                  onChange={(e) => {
                    setBillSearch(e.target.value)
                    setSelectedBill(null)
                    setShowBillDropdown(true)
                  }}
                  onFocus={() => setShowBillDropdown(true)}
                  placeholder="Search bill by customer name…"
                  className={`${inputClass} pl-10 pr-10`}
                  autoComplete="off"
                />
                {selectedBill ? (
                  <button
                    type="button"
                    onClick={handleClearBill}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-forest/40 hover:text-danger transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/40 pointer-events-none" />
                )}
              </div>

              {showBillDropdown && !selectedBill && (
                <ul className="absolute z-30 mt-1 w-full bg-white border border-[#D8E4C8] rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  {loadingBills ? (
                    <li className="px-4 py-3 text-sm text-forest/50 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading bills…
                    </li>
                  ) : bills.length === 0 ? (
                    <li className="px-4 py-3 text-sm text-forest/50">No bills found</li>
                  ) : (
                    bills.map((b) => (
                      <li key={b.id}>
                        <button
                          type="button"
                          onClick={() => handleBillSelect(b)}
                          className="w-full text-left px-4 py-2.5 hover:bg-cream transition-colors flex justify-between items-center gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-forest truncate">
                              #{b.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="text-xs text-forest/55 mt-0.5 truncate">
                              {b.customer_name ?? 'Walk-in'} · {b.payment_mode}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-forest shrink-0">
                            {formatINR(b.total_amount, 0)}
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            {/* Selected bill chip */}
            {selectedBill && (
              <div className="mt-2.5 px-3 py-2 bg-primary/5 border border-primary/15 rounded-lg flex justify-between items-center text-sm">
                <span className="font-medium text-primary">
                  #{selectedBill.id.slice(0, 8).toUpperCase()} · {selectedBill.customer_name}
                </span>
                <span className="font-bold text-forest">{formatINR(selectedBill.total_amount, 0)}</span>
              </div>
            )}
          </div>

          {/* ── STEP 2: Select Item ─────────────────────────────────────── */}
          {selectedBill && (
            <div>
              <p className="text-xs font-bold text-forest/40 uppercase tracking-widest mb-2">
                Step 2 — Select Item to Return
              </p>

              {loadingItems ? (
                <div className="flex items-center gap-2 py-4 text-forest/50 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading items…
                </div>
              ) : billItems.length === 0 ? (
                <p className="text-sm text-forest/50 py-2">No items found for this bill.</p>
              ) : (
                <div className="space-y-2">
                  {billItems.map((item) => {
                    const isSelected = selectedItem?.id === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemSelect(item)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          isSelected
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-[#D8E4C8] hover:bg-cream/60 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-center gap-3">
                          <div>
                            <p className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-forest'}`}>
                              {item.product_name}
                            </p>
                            <p className="text-xs text-forest/55 mt-0.5">
                              Qty: {item.quantity} · Price: {formatINR(item.price, 2)} each
                            </p>
                          </div>
                          <span className="text-sm font-bold text-forest shrink-0">
                            {formatINR(item.subtotal, 2)}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Return Details ──────────────────────────────────── */}
          {selectedItem && (
            <div>
              <p className="text-xs font-bold text-forest/40 uppercase tracking-widest mb-3">
                Step 3 — Return Details
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Return Qty */}
                <div>
                  <label htmlFor="return-qty" className="block text-sm font-medium text-forest mb-1.5">
                    Return Quantity <span className="text-danger">*</span>
                  </label>
                  <input
                    id="return-qty"
                    type="number"
                    min={1}
                    max={maxQty}
                    value={returnQty}
                    onChange={(e) => setReturnQty(Number(e.target.value))}
                    className={inputClass}
                  />
                  <p className="text-xs text-forest/45 mt-1">Max: {maxQty}</p>
                </div>

                {/* Reason */}
                <div>
                  <label htmlFor="return-reason" className="block text-sm font-medium text-forest mb-1.5">
                    Reason
                  </label>
                  <select
                    id="return-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className={`${inputClass} appearance-none`}
                  >
                    {RETURN_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Refund Amount Preview */}
              <div className="mt-4 p-4 bg-accent/5 border border-accent/20 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs text-forest/55 font-medium">Auto-Calculated Refund</p>
                  <p className="text-xs text-forest/40 mt-0.5">{returnQty} × {formatINR(selectedItem.price, 2)}</p>
                </div>
                <p className="text-2xl font-black text-accent">{formatINR(refundAmount, 2)}</p>
              </div>

              {selectedBill.payment_mode === 'Udhar' && (
                <p className="text-xs text-success mt-2 bg-success/5 border border-success/15 px-3 py-2 rounded-lg">
                  ✅ This was an Udhar bill — customer's pending balance will be reduced by {formatINR(refundAmount, 2)}.
                </p>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-[#D8E4C8] bg-cream/20 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-primary/20 rounded-lg text-forest text-sm font-medium hover:bg-cream transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form=""
            disabled={submitting || !selectedItem}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            ) : (
              <><RotateCcw className="w-4 h-4" /> Process Return</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
