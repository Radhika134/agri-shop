import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const CATEGORIES = ['Pesticide', 'Fertilizer', 'Seed', 'Tool', 'Other']

const EMPTY_FORM = {
  name: '',
  category: 'Pesticide',
  price: '',
  stock_quantity: '',
  unit: 'kg',
  low_stock_threshold: '5',
}

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border border-primary/20 bg-cream/50 text-forest placeholder:text-forest/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors'

export default function ProductModal({ isOpen, onClose, mode, productData, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    if (mode === 'edit' && productData) {
      setForm({
        name: productData.name ?? '',
        category: productData.category ?? 'Pesticide',
        price: productData.price?.toString() ?? '',
        stock_quantity: productData.stock_quantity?.toString() ?? '',
        unit: productData.unit ?? 'kg',
        low_stock_threshold: productData.low_stock_threshold?.toString() ?? '5',
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setErrors({})
  }, [isOpen, mode, productData])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Name is required'
    if (form.price === '' || Number(form.price) < 0) nextErrors.price = 'Price is required'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    const payload = {
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      stock_quantity: Number(form.stock_quantity) || 0,
      unit: form.unit.trim() || 'kg',
      low_stock_threshold: Number(form.low_stock_threshold) || 5,
    }

    const success = await onSave(payload)
    setSaving(false)
    if (success) onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-forest/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white border border-[#D8E4C8] rounded-2xl shadow-xl animate-modal-slide-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8E4C8]">
          <h2 className="font-serif text-2xl text-forest">
            {mode === 'edit' ? 'Edit Product' : 'Add Product'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-forest/60 hover:text-forest hover:bg-cream transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="product-name" className="block text-sm font-medium text-forest mb-1.5">
              Name <span className="text-danger">*</span>
            </label>
            <input
              id="product-name"
              type="text"
              value={form.name}
              onChange={handleChange('name')}
              className={inputClass}
              placeholder="Product name"
            />
            {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="product-category" className="block text-sm font-medium text-forest mb-1.5">
              Category
            </label>
            <select
              id="product-category"
              value={form.category}
              onChange={handleChange('category')}
              className={inputClass}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-price" className="block text-sm font-medium text-forest mb-1.5">
                Price (₹) <span className="text-danger">*</span>
              </label>
              <input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange('price')}
                className={inputClass}
                placeholder="0"
              />
              {errors.price && <p className="text-danger text-xs mt-1">{errors.price}</p>}
            </div>

            <div>
              <label htmlFor="product-stock" className="block text-sm font-medium text-forest mb-1.5">
                Stock Quantity
              </label>
              <input
                id="product-stock"
                type="number"
                min="0"
                value={form.stock_quantity}
                onChange={handleChange('stock_quantity')}
                className={inputClass}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-unit" className="block text-sm font-medium text-forest mb-1.5">
                Unit
              </label>
              <input
                id="product-unit"
                type="text"
                value={form.unit}
                onChange={handleChange('unit')}
                className={inputClass}
                placeholder="kg"
              />
            </div>

            <div>
              <label htmlFor="product-threshold" className="block text-sm font-medium text-forest mb-1.5">
                Low Stock Threshold
              </label>
              <input
                id="product-threshold"
                type="number"
                min="0"
                value={form.low_stock_threshold}
                onChange={handleChange('low_stock_threshold')}
                className={inputClass}
                placeholder="5"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-primary/20 text-forest hover:bg-cream transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
