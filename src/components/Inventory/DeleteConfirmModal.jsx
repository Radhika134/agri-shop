import { AlertTriangle } from 'lucide-react'

export default function DeleteConfirmModal({ isOpen, productName, onConfirm, onCancel, deleting }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-forest/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md bg-white border border-[#D8E4C8] rounded-2xl shadow-xl p-6 animate-modal-slide-in">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-danger" />
          </div>
          <div>
            <h2 className="font-serif text-xl text-forest">Delete Product</h2>
            <p className="text-forest/70 mt-2 text-sm leading-relaxed">
              Are you sure you want to delete <strong>{productName}</strong>? This cannot be
              undone.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg border border-primary/20 text-forest hover:bg-cream transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2.5 rounded-lg bg-danger text-white font-medium hover:bg-danger/90 disabled:opacity-60 transition-colors"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
