import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import BillSuccess from '../components/Billing/BillSuccess'
import CustomerNameInput from '../components/Billing/CustomerNameInput'
import ProductSearchSelect from '../components/Billing/ProductSearchSelect'
import { useBills } from '../hooks/useBills'
import { useProducts } from '../hooks/useProducts'
import { formatINR } from '../utils/format'

const PAYMENT_MODES = ['Cash', 'UPI', 'Udhar']

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border border-primary/20 bg-white text-forest placeholder:text-forest/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors'

const INITIAL_FORM = {
  customerName: '',
  customerPhone: '',
  selectedCustomerId: null,
  paymentMode: 'Cash',
  amountPaid: '0',
  selectedProduct: null,
  quantity: '1',
  price: '',
}

export default function BillingPage() {
  const { products, loading: productsLoading, refresh: refreshProducts } = useProducts()
  const { createBill } = useBills()

  const [form, setForm] = useState(INITIAL_FORM)
  const [lineItems, setLineItems] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [createdBill, setCreatedBill] = useState(null)

  const totalAmount = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.subtotal, 0),
    [lineItems],
  )

  const amountDue = useMemo(() => {
    if (form.paymentMode !== 'Udhar') return 0
    const paid = Number(form.amountPaid) || 0
    return Math.max(totalAmount - paid, 0)
  }, [form.paymentMode, form.amountPaid, totalAmount])

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleProductSelect = (product) => {
    setForm((prev) => ({
      ...prev,
      selectedProduct: product,
      quantity: '1',
      price: product.price?.toString() ?? '',
    }))
  }

  const handleAddItem = () => {
    if (!form.selectedProduct) {
      toast.error('Please select a product')
      return
    }

    if (lineItems.some((item) => item.productId === form.selectedProduct.id)) {
      toast('This product is already in the bill', { icon: '⚠️' })
      return
    }

    const quantity = Number(form.quantity)
    const price = Number(form.price)
    const maxStock = form.selectedProduct.stock_quantity

    if (!quantity || quantity < 1) {
      toast.error('Quantity must be at least 1')
      return
    }

    if (quantity > maxStock) {
      toast.error(`Only ${maxStock} ${form.selectedProduct.unit ?? 'kg'} available in stock`)
      return
    }

    if (price < 0 || form.price === '') {
      toast.error('Please enter a valid price')
      return
    }

    const subtotal = quantity * price

    setLineItems((prev) => [
      ...prev,
      {
        product_id: form.selectedProduct.id,
        productId: form.selectedProduct.id,
        product_name: form.selectedProduct.name,
        productName: form.selectedProduct.name,
        quantity,
        price,
        subtotal,
        unit: form.selectedProduct.unit ?? 'kg',
      },
    ])

    setForm((prev) => ({
      ...prev,
      selectedProduct: null,
      quantity: '1',
      price: '',
    }))
  }

  const handleRemoveItem = (productId) => {
    setLineItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  const handleGenerateBill = async () => {
    if (!form.customerName.trim()) {
      toast.error('Customer name is required')
      return
    }

    if (lineItems.length === 0) {
      toast.error('Add at least one item to the bill')
      return
    }

    if (form.paymentMode === 'Udhar' && !form.customerPhone.trim()) {
      toast.error('Phone number is required for Udhar payments')
      return
    }

    setSubmitting(true)
    const result = await createBill({
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      existingCustomerId: form.selectedCustomerId,
      items: lineItems,
      paymentMode: form.paymentMode,
      amountPaid: Number(form.amountPaid) || 0,
    })
    setSubmitting(false)

    if (result.success) {
      setCreatedBill(result.bill)
      await refreshProducts()
    }
  }

  const handleCreateAnother = () => {
    setCreatedBill(null)
    setForm(INITIAL_FORM)
    setLineItems([])
  }

  const maxQuantity = form.selectedProduct?.stock_quantity ?? 1

  if (createdBill) {
    return (
      <div className="min-h-screen bg-cream p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <BillSuccess bill={createdBill} onCreateAnother={handleCreateAnother} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-forest/60 hover:text-forest mb-6 transition-colors print:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="font-serif text-3xl text-forest mb-6">Billing</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white border border-[#D8E4C8] rounded-xl p-5">
              <h2 className="font-serif text-xl text-forest mb-4">Customer Info</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CustomerNameInput
                  name={form.customerName}
                  selectedCustomerId={form.selectedCustomerId}
                  onNameChange={(value) => setField('customerName', value)}
                  onCustomerSelect={(customer) => {
                    setForm((prev) => ({
                      ...prev,
                      customerName: customer.name,
                      customerPhone: customer.phone ?? '',
                      selectedCustomerId: customer.id,
                    }))
                  }}
                  onCustomerClear={() => setField('selectedCustomerId', null)}
                />
                <div>
                  <label htmlFor="customer-phone" className="block text-sm font-medium text-forest mb-1.5">
                    Phone
                  </label>
                  <input
                    id="customer-phone"
                    type="tel"
                    value={form.customerPhone}
                    onChange={(e) => setField('customerPhone', e.target.value)}
                    className={inputClass}
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white border border-[#D8E4C8] rounded-xl p-5">
              <h2 className="font-serif text-xl text-forest mb-4">Payment Mode</h2>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setField('paymentMode', mode)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      form.paymentMode === mode
                        ? 'bg-primary text-white'
                        : 'border border-primary/20 text-forest hover:bg-cream'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {form.paymentMode === 'Udhar' && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="amount-paid" className="block text-sm font-medium text-forest mb-1.5">
                      Amount Paid Now
                    </label>
                    <input
                      id="amount-paid"
                      type="number"
                      min="0"
                      max={totalAmount}
                      value={form.amountPaid}
                      onChange={(e) => setField('amountPaid', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <p className="text-sm text-forest/60 mb-1">Amount Due</p>
                    <p className="text-xl font-bold text-danger">{formatINR(amountDue, 2)}</p>
                  </div>
                </div>
              )}
            </section>

            <section className="bg-white border border-[#D8E4C8] rounded-xl p-5">
              <h2 className="font-serif text-xl text-forest mb-4">Add Item</h2>
              {productsLoading ? (
                <div className="h-24 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-forest mb-1.5">Product</label>
                    <ProductSearchSelect
                      products={products}
                      selectedProduct={form.selectedProduct}
                      onSelect={handleProductSelect}
                    />
                  </div>
                  <div>
                    <label htmlFor="item-qty" className="block text-sm font-medium text-forest mb-1.5">
                      Quantity
                    </label>
                    <input
                      id="item-qty"
                      type="number"
                      min="1"
                      max={maxQuantity}
                      value={form.quantity}
                      onChange={(e) => setField('quantity', e.target.value)}
                      disabled={!form.selectedProduct}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="item-price" className="block text-sm font-medium text-forest mb-1.5">
                      Price (₹)
                    </label>
                    <input
                      id="item-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setField('price', e.target.value)}
                      disabled={!form.selectedProduct}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section className="bg-white border border-[#D8E4C8] rounded-xl p-5">
              <h2 className="font-serif text-xl text-forest mb-4">Items</h2>
              {lineItems.length === 0 ? (
                <p className="text-forest/50 text-sm py-4 text-center">No items added yet</p>
              ) : (
                <div className="space-y-2">
                  {lineItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[#D8E4C8]/60 bg-cream/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-forest truncate">{item.productName}</p>
                        <p className="text-sm text-forest/60">
                          Qty: {item.quantity} × {formatINR(item.price, 2)}
                        </p>
                      </div>
                      <p className="font-semibold text-forest shrink-0">
                        {formatINR(item.subtotal, 2)}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.productId)}
                        className="shrink-0 p-1.5 rounded-lg text-forest/50 hover:text-danger hover:bg-danger/5 transition-colors"
                        aria-label={`Remove ${item.productName}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-[#D8E4C8] rounded-xl p-5 shadow-sm lg:sticky lg:top-6">
              <h2 className="font-serif text-xl text-forest mb-4">Bill Summary</h2>

              <p className="text-sm text-forest/60 mb-3">
                {lineItems.length} item{lineItems.length === 1 ? '' : 's'}
              </p>

              {lineItems.length > 0 ? (
                <ul className="space-y-2 mb-4">
                  {lineItems.map((item) => (
                    <li key={item.productId} className="flex justify-between text-sm gap-2">
                      <span className="text-forest truncate">
                        {item.productName} × {item.quantity}
                      </span>
                      <span className="text-forest shrink-0">{formatINR(item.subtotal, 2)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-forest/50 text-sm mb-4">No items added yet</p>
              )}

              <div className="border-t border-[#D8E4C8] pt-4 mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-forest/60">Total Amount</span>
                  <span className="text-2xl font-bold text-forest">{formatINR(totalAmount, 2)}</span>
                </div>
                {form.paymentMode === 'Udhar' && (
                  <p className="text-sm text-danger mt-2">Due: {formatINR(amountDue, 2)}</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleGenerateBill}
                disabled={submitting || lineItems.length === 0 || !form.customerName.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  'Generate Bill'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
