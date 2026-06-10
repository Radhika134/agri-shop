import { formatIndianDate } from '../lib/utils'

export function formatINR(amount, fractionDigits = 0) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount ?? 0)
}

export function formatDateTime(dateString) {
  return formatIndianDate(dateString)
}

export function formatRelativeTime(dateString) {
  const date = new Date(dateString)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffHours < 24) {
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  }

  return formatIndianDate(dateString)
}

export function calculateRevenueBreakdown(bills) {
  const breakdown = {
    totalRevenue: 0,
    totalCash: 0,
    totalUpi: 0,
    totalUdharDue: 0,
    totalUdharSales: 0,
  }

  for (const bill of bills) {
    const amount = Number(bill.total_amount) || 0
    breakdown.totalRevenue += amount

    switch (bill.payment_mode) {
      case 'Cash':
        breakdown.totalCash += amount
        break
      case 'UPI':
        breakdown.totalUpi += amount
        break
      case 'Udhar':
        breakdown.totalUdharDue += Number(bill.amount_due) || 0
        breakdown.totalUdharSales += amount
        break
      default:
        break
    }
  }

  return breakdown
}

export function getTodayBounds() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}
