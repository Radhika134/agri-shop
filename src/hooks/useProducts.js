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

  return { products, loading, addProduct, updateProduct, deleteProduct, refresh }
}
