import toast from 'react-hot-toast'
import { formatDateTime } from './format'

// ─── Plain number formatter (no ₹ symbol, for text messages) ─────────────────
function fmt(amount) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount ?? 0)
}

// ─── Normalize item shapes from both bill and bill_items keys ─────────────────
function normalizeItems(bill) {
  if (bill.bill_items?.length) return bill.bill_items
  if (bill.items?.length) return bill.items
  return []
}

// ─── Normalize phone to WhatsApp-compatible E.164 format ─────────────────────
export function normalizePhoneForWhatsApp(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return digits
  if (digits.length > 10) return digits
  return null
}

// ─── Build Bill Receipt message (safe emojis only) ───────────────────────────
export function buildBillWhatsAppMessage(bill) {
  const items = normalizeItems(bill)
  const customerName = bill.customer_name ?? 'Customer'
  const date = formatDateTime(bill.created_at)
  const mode = bill.payment_mode ?? 'Cash'
  const paid = Number(bill.amount_paid ?? bill.total_amount ?? 0)
  const due = Number(bill.amount_due ?? 0)

  // Build each item line
  const itemLines = items
    .map((item) => {
      const name = item.product_name ?? item.productName ?? ''
      return `  - ${name} x ${item.quantity} = Rs.${fmt(item.subtotal)}`
    })
    .join('\n')

  const dueSection =
    due > 0
      ? `\nDue (Udhar): *Rs.${fmt(due)}*\nKripya jald se jald baki raashi chuka dein. 🙏`
      : `\n✅ Fully Paid. Shukriya! 🙏`

  return (
    `🌾 *Kisan Khad Bhandar - Bill Receipt* 🌾\n` +
    `____________________________\n\n` +
    `Date: ${date}\n` +
    `Customer: *${customerName}*\n` +
    `____________________________\n\n` +
    `*Items:*\n${itemLines || '  (No items)'}\n` +
    `____________________________\n\n` +
    `*Total: Rs.${fmt(bill.total_amount)}*\n` +
    `Paid: Rs.${fmt(paid)} (${mode})` +
    dueSection +
    `\n\n*Kisan Khad Bhandar*\nOwner: *Sachin Aggarwal*\n📍 Near Ramlela Bhavan\n📞 8126896746, 9412556628`
  )
}

// ─── Build Udhar Reminder message (safe emojis only) ─────────────────────────
export function buildUdharReminderMessage(customerName, pendingAmount) {
  return (
    `🌾 *Kisan Khad Bhandar - Payment Reminder* 🌾\n` +
    `____________________________\n\n` +
    `Namaste *${customerName}* ji,\n\n` +
    `Aapka hamare yahan kuch udhar (credit) pending hai:\n\n` +
    `💰 *Balance Due: Rs.${fmt(pendingAmount)}*\n\n` +
    `Kripya yathaayogya samaapt karne ki kripa karein. 🙏\n\n` +
    `*Kisan Khad Bhandar*\nOwner: *Sachin Aggarwal*\n📍 Near Ramlela Bhavan\n📞 8126896746, 9412556628`
  )
}

// ─── Share a Bill on WhatsApp ─────────────────────────────────────────────────
// Always tries to open WhatsApp directly if phone is present (for ALL payment modes).
// Falls back to clipboard copy ONLY if no phone is available.
export async function shareBillOnWhatsApp(bill) {
  const message = buildBillWhatsAppMessage(bill)
  const rawPhone = bill.customer_phone?.trim()

  if (rawPhone) {
    const waPhone = normalizePhoneForWhatsApp(rawPhone)
    if (waPhone) {
      window.open(
        `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`,
        '_blank',
        'noopener,noreferrer',
      )
      return
    }
  }

  // Fallback: no phone — copy to clipboard
  try {
    await navigator.clipboard.writeText(message)
    toast.success('Phone number not available. Bill text copied!')
  } catch {
    toast.error('Could not copy bill text to clipboard')
  }
}

// ─── Send Udhar Reminder on WhatsApp ─────────────────────────────────────────
export function sendUdharReminder(customer) {
  const rawPhone = customer.phone?.trim()

  if (!rawPhone) {
    toast.error('Phone number not available for this customer.')
    return
  }

  const waPhone = normalizePhoneForWhatsApp(rawPhone)
  if (!waPhone) {
    toast.error('Invalid phone number for WhatsApp reminder.')
    return
  }

  const message = buildUdharReminderMessage(customer.name, customer.total_pending)
  window.open(
    `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`,
    '_blank',
    'noopener,noreferrer',
  )
}
