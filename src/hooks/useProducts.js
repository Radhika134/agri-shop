import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('products').select('*').order('name')
      if (error) throw error
      setProducts(data ?? [])
    } catch (error) {
      toast.error(error.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addProduct = async (data) => {
    try {
      const { error } = await supabase.from('products').insert([data])
      if (error) throw error
      toast.success('Product added successfully')
      await refresh()
      return true
    } catch (error) {
      toast.error(error.message || 'Failed to add product')
      return false
    }
  }

  const updateProduct = async (id, data) => {
    try {
      const { error } = await supabase.from('products').update(data).eq('id', id)
      if (error) throw error
      toast.success('Product updated successfully')
      await refresh()
      return true
    } catch (error) {
      toast.error(error.message || 'Failed to update product')
      return false
    }
  }

  const deleteProduct = async (id) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      toast.success('Product deleted successfully')
      await refresh()
      return true
    } catch (error) {
      toast.error(error.message || 'Failed to delete product')
      return false
    }
  }

  const seedProducts = async () => {
    const SAMPLE_PRODUCTS = [
      { name: 'Imidacloprid', category: 'Pesticide', price: 350, stock_quantity: 20, unit: 'Litre', low_stock_threshold: 5 },
      { name: 'Chlorpyrifos', category: 'Pesticide', price: 450, stock_quantity: 15, unit: 'Litre', low_stock_threshold: 5 },
      { name: 'Cypermethrin', category: 'Pesticide', price: 280, stock_quantity: 3, unit: 'Litre', low_stock_threshold: 5 },
      { name: 'Monocrotophos', category: 'Pesticide', price: 500, stock_quantity: 0, unit: 'Litre', low_stock_threshold: 5 },
      { name: 'Urea', category: 'Fertilizer', price: 270, stock_quantity: 50, unit: 'kg', low_stock_threshold: 5 },
      { name: 'DAP', category: 'Fertilizer', price: 600, stock_quantity: 4, unit: 'kg', low_stock_threshold: 5 },
      { name: 'MOP', category: 'Fertilizer', price: 750, stock_quantity: 25, unit: 'kg', low_stock_threshold: 5 },
      { name: 'NPK 10-26-26', category: 'Fertilizer', price: 550, stock_quantity: 30, unit: 'kg', low_stock_threshold: 5 },
      { name: 'SSP', category: 'Fertilizer', price: 400, stock_quantity: 2, unit: 'kg', low_stock_threshold: 5 },
      { name: 'Wheat', category: 'Seed', price: 800, stock_quantity: 40, unit: 'kg', low_stock_threshold: 5 },
      { name: 'Rice', category: 'Seed', price: 900, stock_quantity: 35, unit: 'kg', low_stock_threshold: 5 },
      { name: 'Mustard', category: 'Seed', price: 650, stock_quantity: 10, unit: 'kg', low_stock_threshold: 5 },
      { name: 'Gram', category: 'Seed', price: 500, stock_quantity: 15, unit: 'kg', low_stock_threshold: 5 },
      { name: 'Sprayer', category: 'Tool', price: 1200, stock_quantity: 8, unit: 'pcs', low_stock_threshold: 5 },
      { name: 'Sickle', category: 'Tool', price: 250, stock_quantity: 12, unit: 'pcs', low_stock_threshold: 5 }
    ]

    try {
      setLoading(true)
      const { error } = await supabase.from('products').insert(SAMPLE_PRODUCTS)
      if (error) throw error
      toast.success('Sample agricultural products seeded successfully!')
      await refresh()
      return true
    } catch (error) {
      toast.error(error.message || 'Failed to seed sample products')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { products, loading, addProduct, updateProduct, deleteProduct, refresh, seedProducts }
}
