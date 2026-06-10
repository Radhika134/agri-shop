import { useNavigate } from 'react-router-dom'
import { MessageCircle, Printer } from 'lucide-react'
import ReceiptCard from './ReceiptCard'
import { shareBillOnWhatsApp } from '../../utils/whatsapp'

export default function BillSuccess({ bill, onCreateAnother }) {
  const navigate = useNavigate()

  const handlePrint = () => {
    window.print()
  }

  const handleWhatsApp = () => {
    shareBillOnWhatsApp(bill)
  }

  return (
    <div className="max-w-lg mx-auto">
      <div id="print-area" className="print-area">
        <ReceiptCard bill={bill} printId="print-area" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6 no-print">
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary/20 text-forest font-medium hover:bg-cream transition-colors no-print"
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </button>

        <button
          type="button"
          onClick={handleWhatsApp}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-success text-white font-medium hover:bg-success/90 transition-colors no-print"
        >
          <MessageCircle className="w-4 h-4" />
          Share on WhatsApp
        </button>

        <button
          type="button"
          onClick={onCreateAnother}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors no-print"
        >
          New Bill
        </button>
      </div>

      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="w-full mt-3 px-4 py-2 rounded-lg border border-primary/20 text-forest/70 font-medium hover:bg-cream text-sm transition-colors no-print"
      >
        Back to Dashboard
      </button>
    </div>
  )
}
