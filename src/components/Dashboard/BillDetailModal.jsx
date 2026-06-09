import { Loader2, X } from 'lucide-react'
import ReceiptCard from '../Billing/ReceiptCard'

export default function BillDetailModal({ isOpen, bill, loading, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          <ReceiptCard bill={bill} printId="bill-detail-receipt" />
        ) : (
          <div className="bg-white border border-[#D8E4C8] rounded-xl p-8 text-center text-forest/60">
            Bill not found
          </div>
        )}
      </div>
    </div>
  )
}
