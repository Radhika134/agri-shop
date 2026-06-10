import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import DeleteConfirmModal from '../components/Inventory/DeleteConfirmModal'
import ProductModal from '../components/Inventory/ProductModal'
import { useProducts } from '../hooks/useProducts'
import { formatINR } from '../utils/format'

const CATEGORIES = ['All', 'Pesticide', 'Fertilizer', 'Seed', 'Tool', 'Other']

const CATEGORY_BADGE = {
  Pesticide: 'bg-accent/15 text-accent',
  Fertilizer: 'bg-primary/15 text-primary',
  Seed: 'bg-success/15 text-success',
  Tool: 'bg-forest/10 text-forest/70',
  Other: 'bg-forest/10 text-forest/60',
}

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border border-primary/20 bg-white text-forest placeholder:text-forest/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors'

export default function InventoryPage() {
  const { products, loading, addProduct, updateProduct, deleteProduct, seedProducts } = useProducts()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase().trim())
      const matchesCategory =
        categoryFilter === 'All' || product.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [products, search, categoryFilter])

  const openAddModal = () => {
    setModalMode('add')
    setSelectedProduct(null)
    setModalOpen(true)
  }

  const openEditModal = (product) => {
    setModalMode('edit')
    setSelectedProduct(product)
    setModalOpen(true)
  }

  const handleSave = async (data) => {
    if (modalMode === 'edit' && selectedProduct) {
      return updateProduct(selectedProduct.id, data)
    }
    return addProduct(data)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const success = await deleteProduct(deleteTarget.id)
    setDeleting(false)
    if (success) setDeleteTarget(null)
  }

  const isLowStock = (product) => product.stock_quantity < product.low_stock_threshold

  return (
    <div className="min-h-screen bg-cream p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-forest/60 hover:text-forest mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h1 className="font-serif text-3xl text-forest">Inventory</h1>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/40" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className={`${inputClass} pl-10 sm:w-56`}
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`${inputClass} sm:w-40`}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {products.length === 0 && (
              <button
                type="button"
                onClick={seedProducts}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary/20 text-forest font-medium hover:bg-cream transition-colors whitespace-nowrap"
              >
                Seed Sample Products
              </button>
            )}

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#D8E4C8] rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-forest/5 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Package className="w-7 h-7 text-primary" strokeWidth={1.75} />
              </div>
              <p className="text-forest/60">
                {products.length === 0
                  ? 'No products found. Add your first product!'
                  : 'No products match your search.'}
              </p>
              {products.length === 0 && (
                <button
                  type="button"
                  onClick={seedProducts}
                  className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
                >
                  Seed Sample Products
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-[#D8E4C8] bg-cream/60">
                    <th className="px-4 py-3 text-xs font-semibold text-forest/60 uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-forest/60 uppercase tracking-wide">
                      Category
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-forest/60 uppercase tracking-wide">
                      Price
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-forest/60 uppercase tracking-wide">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-forest/60 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-forest/60 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E4C8]/60">
                  {filteredProducts.map((product) => {
                    const lowStock = isLowStock(product)
                    return (
                      <tr
                        key={product.id}
                        className={`hover:bg-cream/40 transition-colors ${
                          lowStock ? 'border-l-4 border-l-red-400' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-forest">{product.name}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                              CATEGORY_BADGE[product.category] ?? CATEGORY_BADGE.Other
                            }`}
                          >
                            {product.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-forest">{formatINR(product.price)}</td>
                        <td className="px-4 py-3 text-forest">
                          {product.stock_quantity}{' '}
                          <span className="text-forest/50 text-sm">{product.unit}</span>
                        </td>
                        <td className="px-4 py-3">
                          {lowStock ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-danger/10 text-danger">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-success/10 text-success">
                              <CheckCircle className="w-3.5 h-3.5" />
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(product)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary/20 text-forest text-sm hover:bg-cream transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(product)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-danger/30 text-danger text-sm hover:bg-danger/5 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        productData={selectedProduct}
        onSave={handleSave}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        productName={deleteTarget?.name ?? ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        deleting={deleting}
      />
    </div>
  )
}
