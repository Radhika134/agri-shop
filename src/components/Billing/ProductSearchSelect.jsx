import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'

export default function ProductSearchSelect({ products, selectedProduct, onSelect }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)

  const availableProducts = products.filter((p) => p.stock_quantity > 0)
  const filtered = availableProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase().trim()),
  )

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (product) => {
    onSelect(product)
    setSearch('')
    setOpen(false)
  }

  const displayLabel = selectedProduct
    ? `${selectedProduct.name} (${selectedProduct.stock_quantity} ${selectedProduct.unit ?? 'kg'} left)`
    : 'Select a product…'

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg border border-primary/20 bg-white text-left text-forest focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <span className={selectedProduct ? 'text-forest' : 'text-forest/40 truncate'}>
          {displayLabel}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-forest/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-[#D8E4C8] rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-[#D8E4C8]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-primary/20 bg-cream/50 text-forest placeholder:text-forest/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-forest/50">No products in stock</li>
            ) : (
              filtered.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(product)}
                    className="w-full text-left px-4 py-2.5 text-sm text-forest hover:bg-cream transition-colors"
                  >
                    {product.name}{' '}
                    <span className="text-forest/50">
                      ({product.stock_quantity} {product.unit ?? 'kg'} left)
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
