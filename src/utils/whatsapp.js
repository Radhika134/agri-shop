import toast from 'react-hot-toast'
import { formatDateTime, formatINR } from './format'

function formatAmountPlain(amount) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount ?? 0)
}

function normalizeItems(bill) {
  if (bill.bill_items?.length) return bill.bill_items
  if (bill.items?.length) return bill.items
  return []
}

export function buildBillWhatsAppMessage(bill) {
  const items = normalizeItems(bill)
  const customerName = bill.customer_name ?? 'Customer'
  const date = formatDateTime(bill.created_at)
  const mode = bill.payment_mode ?? 'Cash'
  const paid = bill.amount_paid ?? bill.total_amount ?? 0
  const due = bill.amount_due ?? 0

  const itemLines = items
    .map((item) => {
      const name = item.product_name ?? item.productName
      const qty = item.quantity
      const subtotal = item.subtotal
      return `${name} x ${qty} = ₹${formatAmountPlain(subtotal)}`
    })
    .join('\n')

  return `🌾 AgriShop Bill 🌾
Date: ${date}
Customer: ${customerName}
──────────
${itemLines || 'No items'}
──────────
Total: ${formatINR(bill.total_amount, 2)}
Paid: ${formatINR(paid, 2)} (${mode})
Due: ${formatINR(due, 2)}
Thank you! 🙏`
}

function normalizePhoneForWhatsApp(phone) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return digits
  if (digits.length > 10) return digits
  return null
}

export async function shareBillOnWhatsApp(bill) {
  const message = buildBillWhatsAppMessage(bill)
  const phone = bill.customer_phone?.trim()

  if (phone) {
    const waPhone = normalizePhoneForWhatsApp(phone)
    if (waPhone) {
      window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`, '_blank')
      return
    }
  }

  try {
    await navigator.clipboard.writeText(message)
    toast.success('Bill text copied! You can paste it in WhatsApp')
  } catch {
    toast.error('Could not copy bill text to clipboard')
  }
}
