import { useNavigate } from 'react-router-dom'
import ReceiptCard from './ReceiptCard'

export default function BillSuccess({ bill, onCreateAnother }) {
  const navigate = useNavigate()

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-lg mx-auto">
      <ReceiptCard bill={bill} />

      <div className="flex flex-col sm:flex-row gap-3 mt-6 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 px-4 py-2.5 rounded-lg border border-primary/20 text-forest font-medium hover:bg-cream transition-colors"
        >
          Print Receipt
        </button>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex-1 px-4 py-2.5 rounded-lg border border-primary/20 text-forest font-medium hover:bg-cream transition-colors"
        >
          Back to Dashboard
        </button>
        <button
          type="button"
          onClick={onCreateAnother}
          className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
        >
          Create Another Bill
        </button>
      </div>
    </div>
  )
}
