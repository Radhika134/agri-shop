import { useEffect, useState } from 'react'
import { Loader2, MessageCircle, Printer, X } from 'lucide-react'
import toast from 'react-hot-toast'
import ReceiptCard from '../Billing/ReceiptCard'
import { supabase } from '../../lib/supabase'
import { formatINR } from '../../utils/format'
import { shareBillOnWhatsApp } from '../../utils/whatsapp'

export default function BillDetailModal({ isOpen, billId, onClose }) {
  const [bill, setBill] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !billId) {
      setBill(null)
      return undefined
    }

    let mounted = true

    async function fetchBill() {
      setLoading(true)
      try {
        let result = await supabase
          .from('bills')
          .select('*, bill_items(*)')
          .eq('id', billId)
          .single()

        if (result.error) {
          const billResult = await supabase.from('bills').select('*').eq('id', billId).single()
          if (billResult.error) throw billResult.error

          const itemsResult = await supabase
            .from('bill_items')
            .select('*')
            .eq('bill_id', billId)

          if (itemsResult.error) throw itemsResult.error
          result = { data: { ...billResult.data, bill_items: itemsResult.data ?? [] } }
        }

        if (mounted) setBill(result.data)
      } catch (error) {
        if (mounted) {
          toast.error(error.message || 'Failed to load bill details')
          onClose()
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchBill()

    return () => {
      mounted = false
    }
  }, [isOpen, billId])

  const handlePrint = () => {
    window.print()
  }

  const handleWhatsAppShare = () => {
    if (bill) shareBillOnWhatsApp(bill)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-forest/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto animate-modal-slide-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white border border-[#D8E4C8] text-forest/60 hover:text-forest transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="bg-white border border-[#D8E4C8] rounded-xl p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : bill ? (
          <>
            <ReceiptCard bill={bill} printId="bill-history-receipt" />

            <div className="mt-4 p-4 bg-white border border-[#D8E4C8] rounded-xl text-sm space-y-1">
              <p className="text-forest">
                <span className="text-forest/60">Payment Mode:</span> {bill.payment_mode}
              </p>
              <p className="text-forest">
                <span className="text-forest/60">Amount Paid:</span>{' '}
                {formatINR(bill.amount_paid, 2)}
              </p>
              {bill.payment_mode === 'Udhar' && (
                <p className="text-danger font-medium">
                  <span className="text-forest/60 font-normal">Amount Due:</span>{' '}
                  {formatINR(bill.amount_due, 2)}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary/20 text-forest font-medium hover:bg-cream transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Share on WhatsApp
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white border border-[#D8E4C8] rounded-xl p-8 text-center text-forest/60">
            Bill not found
          </div>
        )}
      </div>
    </div>
  )
}
