import { formatDateTime, formatINR } from '../../utils/format'

function getPaymentLabel(bill) {
  if (bill.payment_mode === 'Udhar') {
    return `Udhar — Paid: ${formatINR(bill.amount_paid, 2)}, Due: ${formatINR(bill.amount_due, 2)}`
  }
  return bill.payment_mode
}

function normalizeItems(bill) {
  if (bill.items?.length) {
    return bill.items.map((item) => ({
      id: item.product_id ?? item.productId ?? item.id,
      productName: item.product_name ?? item.productName,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    }))
  }

  if (bill.bill_items?.length) {
    return bill.bill_items.map((item) => ({
      id: item.product_id ?? item.id,
      productName: item.product_name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    }))
  }

  return []
}

export default function ReceiptCard({ bill, printId = 'receipt-print' }) {
  const items = normalizeItems(bill)
  const customerName = bill.customer_name ?? bill.customers?.name ?? 'Walk-in Customer'
  const customerPhone = bill.customer_phone ?? bill.customers?.phone

  return (
    <div
      id={printId}
      className="bg-white border-2 border-dashed border-[#D8E4C8] rounded-xl p-6 sm:p-8 shadow-sm"
    >
      <div className="text-center mb-6">
        <h1 className="font-serif text-3xl text-primary">Kisan Khad Bhandar</h1>
        <p className="text-forest/50 text-sm mt-1">{formatDateTime(bill.created_at)}</p>
      </div>

      <div className="mb-5 text-sm">
        <p className="text-forest">
          <span className="text-forest/60">Customer:</span> {customerName}
        </p>
        {customerPhone && (
          <p className="text-forest mt-1">
            <span className="text-forest/60">Phone:</span> {customerPhone}
          </p>
        )}
      </div>

      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="border-b border-[#D8E4C8] text-forest/60">
            <th className="text-left py-2 font-medium">Product</th>
            <th className="text-center py-2 font-medium">Qty</th>
            <th className="text-right py-2 font-medium">Price</th>
            <th className="text-right py-2 font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D8E4C8]/60">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="py-2 text-forest pr-2">{item.productName}</td>
              <td className="py-2 text-center text-forest">{item.quantity}</td>
              <td className="py-2 text-right text-forest">{formatINR(item.price, 2)}</td>
              <td className="py-2 text-right text-forest font-medium">
                {formatINR(item.subtotal, 2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-[#D8E4C8] pt-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-forest/60">Total Amount</span>
          <span className="text-2xl font-bold text-forest">
            {formatINR(bill.total_amount, 2)}
          </span>
        </div>
        <p className="text-sm text-forest/70">
          <span className="text-forest/60">Payment:</span> {getPaymentLabel(bill)}
        </p>
      </div>

      <div className="border-t border-dashed border-[#D8E4C8] pt-4 mt-6 text-center text-xs text-forest/60 space-y-1">
        <p className="font-bold text-forest text-sm">Kisan Khad Bhandar</p>
        <p>Owner: Sachin Aggarwal</p>
        <p className="font-semibold text-primary mt-1">Thank you for your purchase! 🙏</p>
        <p className="text-[10px] mt-1 text-forest/40">📍 Near Ramlela Bhavan · 📞 8126896746, 9412556628</p>
      </div>
    </div>
  )
}
