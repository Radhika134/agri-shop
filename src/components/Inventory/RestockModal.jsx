import { useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border border-primary/20 bg-cream/50 text-forest placeholder:text-forest/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors'

export default function RestockModal({ isOpen, product, onClose, onSuccess }) {
  const [addedQuantity, setAddedQuantity] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen || !product) return null

  const currentStock = Number(product.stock_quantity) || 0
  const unit = product.unit || 'kg'

  const handleSubmit = async (e) => {
    e.preventDefault()

    const qty = Number(addedQuantity)
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity greater than 0')
      return
    }

    setSubmitting(true)
    try {
      const newStock = currentStock + qty
      const { error } = await supabase
        .from('products')
        .update({
          stock_quantity: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)

      if (error) throw error

      toast.success(`Restocked successfully! Added ${qty} ${unit}.`)
      onSuccess()
    } catch (error) {
      toast.error(error.message || 'Failed to restock product')
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
        className="absolute inset-0 bg-forest/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white border border-[#D8E4C8] rounded-2xl shadow-xl animate-modal-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8E4C8]">
          <h2 className="font-serif text-2xl text-forest">Restock Product</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-forest/60 hover:text-forest hover:bg-cream transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest mb-1.5">
              Product Name
            </label>
            <input
              type="text"
              value={product.name}
              readOnly
              className="w-full px-4 py-2.5 rounded-lg border border-primary/10 bg-cream/20 text-forest/60 focus:outline-none cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="added-qty" className="block text-sm font-medium text-forest mb-1.5">
              Quantity to Add ({unit}) <span className="text-danger">*</span>
            </label>
            <input
              id="added-qty"
              type="number"
              min="1"
              required
              value={addedQuantity}
              onChange={(e) => setAddedQuantity(e.target.value)}
              placeholder="e.g., 50"
              className={inputClass}
              autoFocus
            />
            <p className="text-[11px] text-forest/50 mt-1">
              Current Stock: {currentStock} {unit} → New Stock: {currentStock + (Number(addedQuantity) || 0)} {unit}
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#D8E4C8] mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-primary/20 rounded-lg text-forest text-sm font-medium hover:bg-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Updating...' : 'Add Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
