import { useEffect, useState } from 'react'
import {
  Banknote,
  Clock,
  Loader2,
  MessageCircle,
  Printer,
  Receipt,
  RotateCcw,
  Smartphone,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { formatDateTime, formatINR } from '../../utils/format'
import { shareBillOnWhatsApp } from '../../utils/whatsapp'

const MODE_ICON = { Cash: Banknote, UPI: Smartphone, Udhar: Clock }
const MODE_COLOR = {
  Cash: 'text-success bg-success/10',
  UPI: 'text-teal bg-teal/10',
  Udhar: 'text-danger bg-danger/10',
}

export default function TransactionDetailModal({ isOpen, transaction, onClose }) {
  const [billItems, setBillItems] = useState([])
  const [resolvedName, setResolvedName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !transaction) {
      setBillItems([])
      setResolvedName('')
      return
    }
    let mounted = true

    async function fetchDetails() {
      setLoading(true)
      try {
        if (transaction.type === 'bill') {
          const { data, error } = await supabase
            .from('bill_items')
            .select('*')
            .eq('bill_id', transaction.id)
          if (error) throw error
          if (mounted) {
            setBillItems(data ?? [])
            setResolvedName(transaction.customer_name ?? 'Walk-in Customer')
          }
        } else if (transaction.type === 'payment' && transaction.customer_id) {
          const { data, error } = await supabase
            .from('customers')
            .select('name')
            .eq('id', transaction.customer_id)
            .single()
          if (!error && data && mounted) setResolvedName(data.name)
        } else if (transaction.type === 'return') {
          // Customer name is already joined via bills in the parent
          if (mounted) setResolvedName(transaction.customer_name ?? transaction.bills?.customer_name ?? '—')
        }
      } catch (err) {
        toast.error(err.message || 'Failed to load details')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchDetails()
    return () => { mounted = false }
  }, [isOpen, transaction])

  if (!isOpen || !transaction) return null

  const isBill = transaction.type === 'bill'
  const isPayment = transaction.type === 'payment'
  const isReturn = transaction.type === 'return'

  const ModeIcon = MODE_ICON[transaction.payment_mode] ?? Banknote
  const modeColor = MODE_COLOR[transaction.payment_mode] ?? 'text-forest bg-forest/10'

  // Header colour per type
  const headerBg = isBill
    ? 'bg-danger/[0.03]'
    : isPayment
    ? 'bg-success/[0.03]'
    : 'bg-accent/[0.03]'
  const typeIcon = isBill ? Receipt : isPayment ? Banknote : RotateCcw
  const typeIconBg = isBill ? 'bg-danger/10' : isPayment ? 'bg-success/10' : 'bg-accent/10'
  const typeIconColor = isBill ? 'text-danger' : isPayment ? 'text-success' : 'text-accent'
  const TypeIcon = typeIcon

  const handlePrint = () => {
    if (!isBill) return
    const printContent = document.getElementById('bill-print-area')?.innerHTML
    if (!printContent) return
    const win = window.open('', '_blank', 'width=420,height=600')
    win.document.write(`
      <html>
        <head>
          <title>Kisan Khad Bhandar Bill</title>
          <style>
            body { font-family: sans-serif; padding: 24px; max-width: 380px; margin: 0 auto; }
            h2 { text-align:center; color: #2D5A1A; margin-bottom:4px; }
            .sub { text-align:center; color:#666; font-size:12px; margin-bottom:16px; }
            table { width:100%; border-collapse:collapse; font-size:13px; }
            th { text-align:left; border-bottom:1px solid #ccc; padding:4px 0; font-size:11px; text-transform:uppercase; color:#666; }
            td { padding:5px 0; vertical-align:top; }
            .right { text-align:right; }
            .center { text-align:center; }
            .divider { border:none; border-top:1px dashed #ccc; margin:12px 0; }
            .total-row { font-weight:bold; }
            .danger { color:#C0392B; }
            .success { color:#2D5A1A; }
            .footer { text-align:center; font-size:11px; color:#888; margin-top:20px; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  const handleWhatsApp = () => {
    const billForWa = {
      ...transaction,
      bill_items: billItems,
      customer_phone: transaction.customer_phone ?? '',
    }
    shareBillOnWhatsApp(billForWa)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-forest/40 backdrop-blur-sm cursor-default no-print"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white border border-[#D8E4C8] rounded-xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className={`p-5 border-b border-[#D8E4C8] flex items-center justify-between shrink-0 no-print ${headerBg}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${typeIconBg}`}>
              <TypeIcon className={`w-5 h-5 ${typeIconColor}`} />
            </div>
            <div>
              <h2 className="font-serif text-xl text-forest">
                {isBill ? 'Bill Receipt' : isPayment ? 'Payment Details' : 'Return Details'}
              </h2>
              <p className="text-xs text-forest/50 mt-0.5">{formatDateTime(transaction.created_at)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#D8E4C8] text-forest/60 hover:text-forest transition-colors bg-white no-print"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <>
              {/* Customer + Mode */}
              <div className="grid grid-cols-2 gap-3 no-print">
                <div className="p-3 rounded-lg border border-[#D8E4C8] bg-cream/40">
                  <p className="text-xs text-forest/50 font-medium">Customer</p>
                  <p className="text-sm font-semibold text-forest mt-1 truncate">
                    {resolvedName || transaction.customer_name || 'Walk-in Customer'}
                  </p>
                </div>
                {(isBill || isPayment) && transaction.payment_mode && (
                  <div className="p-3 rounded-lg border border-[#D8E4C8] bg-cream/40">
                    <p className="text-xs text-forest/50 font-medium">Payment Mode</p>
                    <span className={`inline-flex items-center gap-1.5 mt-1 text-xs font-semibold px-2.5 py-1 rounded-full ${modeColor}`}>
                      <ModeIcon className="w-3.5 h-3.5" />
                      {transaction.payment_mode}
                    </span>
                  </div>
                )}
                {isReturn && (
                  <div className="p-3 rounded-lg border border-[#D8E4C8] bg-cream/40">
                    <p className="text-xs text-forest/50 font-medium">Reason</p>
                    <p className="text-sm font-semibold text-accent mt-1">{transaction.reason}</p>
                  </div>
                )}
              </div>

              {/* ── BILL: Full Receipt ──────────────────────────────────── */}
              {isBill && (
                <div id="print-area" className="print-area space-y-5">
                  {/* Hidden print area */}
                  <div id="bill-print-area" className="hidden">
                    <h2>🌾 Kisan Khad Bhandar</h2>
                    <p className="sub">Bill Receipt · {formatDateTime(transaction.created_at)}</p>
                    <p style={{textAlign:'center',marginBottom:'12px'}}>Customer: <strong>{resolvedName || transaction.customer_name}</strong></p>
                    <hr className="divider" />
                    <table>
                      <thead><tr><th>Product</th><th className="center">Qty</th><th className="right">Price</th><th className="right">Total</th></tr></thead>
                      <tbody>
                        {billItems.map((item) => (
                          <tr key={item.id}>
                            <td>{item.product_name}</td>
                            <td className="center">{item.quantity}</td>
                            <td className="right">₹{item.price}</td>
                            <td className="right">₹{item.subtotal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <hr className="divider" />
                    <table>
                      <tbody>
                        <tr className="total-row"><td>Total</td><td className="right">₹{transaction.total_amount}</td></tr>
                        <tr><td>Paid</td><td className="right success">₹{transaction.amount_paid} ({transaction.payment_mode})</td></tr>
                        {Number(transaction.amount_due) > 0 && (
                          <tr><td>Due (Udhar)</td><td className="right danger">₹{transaction.amount_due}</td></tr>
                        )}
                      </tbody>
                    </table>
                    <p className="footer">
                      <strong>Kisan Khad Bhandar</strong><br/>
                      Owner: Sachin Aggarwal<br/>
                      Thank you for your purchase! 🙏<br/>
                      <span style="font-size:10px;color:#666;">📍 Near Ramlela Bhavan · 📞 8126896746, 9412556628</span>
                    </p>
                  </div>

                  {/* Visible items table */}
                  {billItems.length > 0 && (
                    <div>
                      <h3 className="font-serif text-base text-forest mb-3">Items Purchased</h3>
                      <div className="border border-[#D8E4C8] rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-cream/60 border-b border-[#D8E4C8]">
                            <tr>
                              {['Product', 'Qty', 'Price', 'Subtotal'].map((h, i) => (
                                <th key={h} className={`px-3 py-2.5 text-xs font-semibold text-forest/60 uppercase tracking-wide ${i > 1 ? 'text-right' : i === 1 ? 'text-center' : ''}`}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#D8E4C8]/60">
                            {billItems.map((item) => (
                              <tr key={item.id} className="hover:bg-cream/30">
                                <td className="px-3 py-2.5 font-medium text-forest">{item.product_name}</td>
                                <td className="px-3 py-2.5 text-center text-forest/70">{item.quantity}</td>
                                <td className="px-3 py-2.5 text-right text-forest/70">{formatINR(item.price, 2)}</td>
                                <td className="px-3 py-2.5 text-right font-semibold text-forest">{formatINR(item.subtotal, 2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="border border-[#D8E4C8] rounded-lg p-4 space-y-2.5 bg-cream/30">
                    <div className="flex justify-between text-sm">
                      <span className="text-forest/60">Total Amount</span>
                      <span className="font-black text-forest text-base">{formatINR(transaction.total_amount, 2)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-[#D8E4C8] pt-2.5">
                      <span className="text-forest/60">Amount Paid</span>
                      <span className="font-semibold text-success">{formatINR(transaction.amount_paid, 2)}</span>
                    </div>
                    {Number(transaction.amount_due) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-danger/80 font-medium">Amount Due (Udhar)</span>
                        <span className="font-black text-danger">{formatINR(transaction.amount_due, 2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Signature Footer */}
                  <div className="border-t border-dashed border-[#D8E4C8] pt-4 mt-4 text-center text-xs text-forest/60 space-y-1">
                    <p className="font-bold text-forest text-sm">Kisan Khad Bhandar</p>
                    <p>Owner: Sachin Aggarwal</p>
                    <p className="font-semibold text-primary">Thank you for your purchase! 🙏</p>
                    <p className="text-[10px] text-forest/40">📍 Near Ramlela Bhavan · 📞 8126896746, 9412556628</p>
                  </div>
                </div>
              )}

              {/* ── PAYMENT ──────────────────────────────────────────────── */}
              {isPayment && (
                <div className="border border-[#D8E4C8] rounded-lg p-4 bg-success/[0.03]">
                  <div className="flex justify-between items-center">
                    <span className="text-forest/60 text-sm">Payment Received</span>
                    <span className="font-black text-2xl text-success">{formatINR(transaction.amount, 2)}</span>
                  </div>
                  <p className="text-xs text-forest/40 mt-2">Recorded on {formatDateTime(transaction.created_at)}</p>
                </div>
              )}

              {/* ── RETURN ───────────────────────────────────────────────── */}
              {isReturn && (
                <div className="border border-[#D8E4C8] rounded-lg p-4 bg-accent/[0.03] space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-forest/50 font-medium">Product</p>
                      <p className="text-sm font-semibold text-forest mt-0.5">{transaction.product_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-forest/50 font-medium">Qty Returned</p>
                      <p className="text-sm font-bold text-forest mt-0.5">{transaction.quantity}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#D8E4C8]">
                    <span className="text-forest/60 text-sm">Refund Amount</span>
                    <span className="font-black text-2xl text-accent">{formatINR(transaction.refund_amount, 2)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#D8E4C8] bg-cream/20 flex justify-between items-center gap-3 shrink-0 no-print">
          {isBill ? (
            <div className="flex gap-2 no-print">
              <button
                type="button"
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-success text-white text-sm font-medium hover:bg-success/90 transition-colors no-print"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary/20 text-forest text-sm font-medium hover:bg-cream transition-colors no-print"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors no-print"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
