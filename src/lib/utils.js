export function formatIndianDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return ''

  // Convert to Indian Standard Time (IST) and format
  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }

  const formatter = new Intl.DateTimeFormat('en-IN', options)
  const parts = formatter.formatToParts(date)

  const day = parts.find((p) => p.type === 'day')?.value || ''
  const month = parts.find((p) => p.type === 'month')?.value || ''
  const year = parts.find((p) => p.type === 'year')?.value || ''
  const hour = parts.find((p) => p.type === 'hour')?.value || ''
  const minute = parts.find((p) => p.type === 'minute')?.value || ''
  let dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value || ''

  // Normalize AM/PM to uppercase
  dayPeriod = dayPeriod.toUpperCase()

  return `${day} ${month} ${year}, ${hour}:${minute} ${dayPeriod}`
}
