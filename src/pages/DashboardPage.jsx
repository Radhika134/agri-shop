import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Banknote,
  Clock,
  Package,
  Plus,
  Receipt,
  RotateCcw,
  ShoppingCart,
  Smartphone,
  TrendingUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import BillDetailModal from '../components/Dashboard/BillDetailModal'
import { supabase } from '../lib/supabase'
import {
  calculateRevenueBreakdown,
  formatINR,
  formatRelativeTime,
  getTodayBounds,
} from '../utils/format'

function StatCard({ label, value, icon: Icon, iconColor, iconBg, loading }) {
  return (
    <div className="bg-white border border-[#D8E4C8] rounded-xl p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {loading ? (
            <div className="h-9 w-20 bg-forest/10 rounded animate-pulse mb-2" />
          ) : (
            <p className="text-3xl font-bold text-forest">{value}</p>
          )}
          <p className="text-sm text-forest/60 mt-1">{label}</p>
        </div>
        <div className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  )
}

function SectionCard({ title, action, children, className = '' }) {
  return (
    <div className={`bg-white border border-[#D8E4C8] rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-serif text-xl text-forest">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function SkeletonRows({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-14 bg-forest/5 rounded-lg animate-pulse" />
      ))}
    </div>
  )
}

function RevenueBreakdown({ breakdown, todayReturns, loading }) {
  const { totalRevenue, totalCash, totalUpi, totalUdharDue, totalUdharSales } = breakdown
  const netRevenue = Math.max(0, totalRevenue - todayReturns)

  const cashPct = totalRevenue > 0 ? (totalCash / totalRevenue) * 100 : 0
  const upiPct = totalRevenue > 0 ? (totalUpi / totalRevenue) * 100 : 0
  const udharPct = totalRevenue > 0 ? (totalUdharSales / totalRevenue) * 100 : 0

  const modeItems = [
    { label: 'Cash', value: formatINR(totalCash), icon: Banknote, valueClass: 'text-success', sub: totalRevenue > 0 ? `${cashPct.toFixed(0)}%` : null },
    { label: 'UPI', value: formatINR(totalUpi), icon: Smartphone, valueClass: 'text-teal', sub: totalRevenue > 0 ? `${upiPct.toFixed(0)}%` : null },
    { label: 'Udhar / Baaki', value: formatINR(totalUdharDue), icon: Clock, valueClass: 'text-danger', sub: totalRevenue > 0 ? `${udharPct.toFixed(0)}% sales` : null },
  ]

  return (
    <div className="bg-white border border-[#D8E4C8] rounded-xl p-5 sm:p-6 shadow-sm">
      <h2 className="font-serif text-2xl sm:text-3xl text-forest mb-5">Aaj ki Kamai</h2>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-forest/5 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-forest/5 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="h-3 bg-forest/5 rounded-full animate-pulse mt-4" />
        </div>
      ) : (
        <>
          {/* ── Top 3 summary tiles ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Total Sales */}
            <div className="rounded-xl p-4 bg-cream/50 border border-[#D8E4C8]/60">
              <div className="flex items-center gap-2 mb-1.5">
                <Receipt className="w-4 h-4 text-forest/50" strokeWidth={1.75} />
                <p className="text-sm text-forest/60">Total Sales</p>
              </div>
              <p className="text-2xl font-bold text-forest">{formatINR(totalRevenue)}</p>
            </div>

            {/* Total Returns */}
            <div className="rounded-xl p-4 bg-danger/[0.04] border border-danger/15">
              <div className="flex items-center gap-2 mb-1.5">
                <RotateCcw className="w-4 h-4 text-danger" strokeWidth={1.75} />
                <p className="text-sm text-danger/70">Total Returns</p>
              </div>
              <p className="text-2xl font-bold text-danger">− {formatINR(todayReturns)}</p>
            </div>

            {/* Net Revenue */}
            <div className="rounded-xl p-4 bg-success/[0.06] border border-success/20">
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp className="w-4 h-4 text-success" strokeWidth={1.75} />
                <p className="text-sm text-success/70 font-medium">Net Revenue</p>
              </div>
              <p className="text-2xl font-black text-success">{formatINR(netRevenue)}</p>
            </div>
          </div>

          {/* ── Mode Breakdown ── */}
          <p className="text-xs font-semibold text-forest/40 uppercase tracking-widest mb-3">Payment Mode Breakdown</p>
          <div className="grid grid-cols-3 gap-3">
            {modeItems.map((item) => (
              <div key={item.label} className="rounded-lg p-3 bg-cream/50 border border-[#D8E4C8]/60">
                <div className="flex items-center gap-1.5 mb-1">
                  <item.icon className={`w-3.5 h-3.5 ${item.valueClass}`} strokeWidth={1.75} />
                  <p className="text-xs text-forest/55">{item.label}</p>
                </div>
                <p className={`text-lg font-bold ${item.valueClass}`}>{item.value}</p>
                {item.sub && <p className="text-xs text-forest/40 mt-0.5">{item.sub}</p>}
              </div>
            ))}
          </div>

          {/* ── Stacked bar ── */}
          {totalRevenue > 0 && (
            <div className="mt-5">
              <div className="flex h-2.5 rounded-full overflow-hidden bg-forest/5">
                {cashPct > 0 && <div className="bg-success transition-all" style={{ width: `${cashPct}%` }} title={`Cash ${cashPct.toFixed(0)}%`} />}
                {upiPct > 0 && <div className="bg-teal transition-all" style={{ width: `${upiPct}%` }} title={`UPI ${upiPct.toFixed(0)}%`} />}
                {udharPct > 0 && <div className="bg-danger/70 transition-all" style={{ width: `${udharPct}%` }} title={`Udhar ${udharPct.toFixed(0)}%`} />}
              </div>
              <div className="flex flex-wrap gap-4 mt-2.5 text-xs text-forest/55">
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success" />Cash {cashPct.toFixed(0)}%</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal" />UPI {upiPct.toFixed(0)}%</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-danger/70" />Udhar {udharPct.toFixed(0)}%</span>
              </div>
            </div>
          )}

          {totalRevenue === 0 && (
            <p className="mt-4 text-sm text-forest/50 text-center py-2">No sales recorded today yet</p>
          )}
        </>
      )}
    </div>
  )
}

function getCustomerName(bill) {
  if (bill.customers?.name) return bill.customers.name
  if (bill.customer_name) return bill.customer_name
  return 'Walk-in Customer'
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    todayBillsCount: 0,
  })
  const [revenueBreakdown, setRevenueBreakdown] = useState({
    totalRevenue: 0,
    totalCash: 0,
    totalUpi: 0,
    totalUdharDue: 0,
    totalUdharSales: 0,
  })
  const [todayReturns, setTodayReturns] = useState(0)
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [recentBills, setRecentBills] = useState([])
  const [selectedBillId, setSelectedBillId] = useState(null)
  const [billDetail, setBillDetail] = useState(null)
  const [billDetailLoading, setBillDetailLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    async function fetchDashboardData() {
      setLoading(true)

      try {
        const { start, end } = getTodayBounds()

        const [productsResult, todayBillsResult, todayReturnsResult] = await Promise.all([
          supabase
            .from('products')
            .select('id, name, stock_quantity, low_stock_threshold, category'),
          supabase
            .from('bills')
            .select('total_amount, payment_mode, amount_due')
            .gte('created_at', start)
            .lte('created_at', end),
          supabase
            .from('returns')
            .select('refund_amount')
            .gte('created_at', start)
            .lte('created_at', end),
        ])

        if (productsResult.error) throw productsResult.error
        if (todayBillsResult.error) throw todayBillsResult.error
        if (todayReturnsResult.error) throw todayReturnsResult.error

        let recentBillsResult = await supabase
          .from('bills')
          .select('id, total_amount, created_at, customer_name, customers(name)')
          .order('created_at', { ascending: false })
          .limit(5)

        if (recentBillsResult.error) {
          recentBillsResult = await supabase
            .from('bills')
            .select('id, total_amount, created_at, customer_name')
            .order('created_at', { ascending: false })
            .limit(5)
        }

        if (recentBillsResult.error) throw recentBillsResult.error

        if (!mounted) return

        const products = productsResult.data ?? []
        const lowStock = products.filter(
          (p) => p.stock_quantity < p.low_stock_threshold,
        )
        const todayBills = todayBillsResult.data ?? []

        const returnsTotal = (todayReturnsResult.data ?? []).reduce(
          (s, r) => s + (Number(r.refund_amount) || 0),
          0,
        )

        setStats({
          totalProducts: products.length,
          lowStockCount: lowStock.length,
          todayBillsCount: todayBills.length,
        })
        setRevenueBreakdown(calculateRevenueBreakdown(todayBills))
        setTodayReturns(returnsTotal)

        setLowStockProducts(
          [...lowStock].sort((a, b) => a.stock_quantity - b.stock_quantity),
        )
        setRecentBills(recentBillsResult.data ?? [])
      } catch (error) {
        if (mounted) {
          toast.error(error.message || 'Failed to load dashboard data')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchDashboardData()

    return () => {
      mounted = false
    }
  }, [])

  const handleBillClick = async (billId) => {
    setSelectedBillId(billId)
    setBillDetail(null)
    setBillDetailLoading(true)

    try {
      let result = await supabase
        .from('bills')
        .select('*, bill_items(*)')
        .eq('id', billId)
        .single()

      if (result.error) {
        result = await supabase
          .from('bills')
          .select('*')
          .eq('id', billId)
          .single()

        if (!result.error && result.data) {
          const itemsResult = await supabase
            .from('bill_items')
            .select('*')
            .eq('bill_id', billId)

          if (itemsResult.error) throw itemsResult.error
          result.data.bill_items = itemsResult.data ?? []
        }
      }

      if (result.error) throw result.error
      setBillDetail(result.data)
    } catch (error) {
      toast.error(error.message || 'Failed to load bill details')
      setSelectedBillId(null)
    } finally {
      setBillDetailLoading(false)
    }
  }

  const closeBillModal = () => {
    setSelectedBillId(null)
    setBillDetail(null)
  }

  return (
    <div className="min-h-screen bg-cream p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-forest">Kisan Khad Bhandar Dashboard</h1>
            <p className="text-forest/60 mt-1 text-sm font-sans">Welcome, Sachin Aggarwal</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary/20 text-forest font-medium hover:bg-white transition-colors"
          >
            <Package className="w-4 h-4" />
            Manage Inventory
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Products"
            value={stats.totalProducts}
            icon={Package}
            iconColor="text-primary"
            iconBg="bg-primary/10"
            loading={loading}
          />
          <StatCard
            label="Low Stock Items"
            value={stats.lowStockCount}
            icon={AlertTriangle}
            iconColor="text-danger"
            iconBg="bg-danger/10"
            loading={loading}
          />
          <StatCard
            label="Today's Bills"
            value={stats.todayBillsCount}
            icon={Receipt}
            iconColor="text-accent"
            iconBg="bg-accent/10"
            loading={loading}
          />
        </div>

        <RevenueBreakdown breakdown={revenueBreakdown} todayReturns={todayReturns} loading={loading} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SectionCard title="Low Stock Alerts" className="lg:col-span-2">
            {loading ? (
              <SkeletonRows count={4} />
            ) : lowStockProducts.length === 0 ? (
              <p className="text-success text-sm font-medium py-6 text-center">
                All products well-stocked!
              </p>
            ) : (
              <ul className="space-y-3">
                {lowStockProducts.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[#D8E4C8]/60 bg-cream/40"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-forest truncate">{product.name}</p>
                      {product.category && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {product.category}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-danger/10 text-danger">
                      {product.stock_quantity} left
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Recent Bills"
            action={
              <button
                type="button"
                onClick={() => navigate('/transactions')}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                View all →
              </button>
            }
          >
            {loading ? (
              <SkeletonRows count={5} />
            ) : recentBills.length === 0 ? (
              <p className="text-forest/50 text-sm py-6 text-center">No bills yet</p>
            ) : (
              <ul className="space-y-3">
                {recentBills.map((bill) => (
                  <li key={bill.id}>
                    <button
                      type="button"
                      onClick={() => handleBillClick(bill.id)}
                      className="w-full text-left p-3 rounded-lg border border-[#D8E4C8]/60 bg-cream/40 hover:bg-cream hover:border-primary/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-forest truncate">
                          {getCustomerName(bill)}
                        </p>
                        <p className="shrink-0 font-semibold text-forest">
                          {formatINR(bill.total_amount)}
                        </p>
                      </div>
                      <p className="text-xs text-forest/50 mt-1">
                        {formatRelativeTime(bill.created_at)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Quick Actions">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-primary/20 text-forest font-medium hover:bg-cream transition-colors"
            >
              <Package className="w-4 h-4" />
              Manage Inventory
            </button>
            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Product
            </button>
            <button
              type="button"
              onClick={() => navigate('/billing')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Create New Bill
            </button>
            <button
              type="button"
              onClick={() => navigate('/transactions')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-primary/20 text-forest font-medium hover:bg-cream transition-colors"
            >
              <Receipt className="w-4 h-4" />
              Shop Diary
            </button>
          </div>
        </SectionCard>
      </div>

      <BillDetailModal
        isOpen={Boolean(selectedBillId)}
        bill={billDetail}
        loading={billDetailLoading}
        onClose={closeBillModal}
      />
    </div>
  )
}
