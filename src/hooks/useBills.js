import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

async function resolveCustomer({
  customerName,
  customerPhone,
  paymentMode,
  amountDue,
  existingCustomerId,
}) {
  const phone = customerPhone?.trim() || null

  if (paymentMode === 'Udhar' && !phone) {
    throw new Error('Phone number is required for Udhar payments')
  }

  const applyUdharPending = async (customerId, currentPending = 0) => {
    if (paymentMode !== 'Udhar' || amountDue <= 0) return

    const { error } = await supabase
      .from('customers')
      .update({
        name: customerName,
        total_pending: (currentPending ?? 0) + amountDue,
      })
      .eq('id', customerId)

    if (error) throw error
  }

  if (existingCustomerId) {
    if (paymentMode === 'Udhar') {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('total_pending')
        .eq('id', existingCustomerId)
        .single()

      if (error) throw error
      await applyUdharPending(existingCustomerId, customer?.total_pending)
    }
    return existingCustomerId
  }

  if (phone) {
    const { data: existingCustomer, error: lookupError } = await supabase
      .from('customers')
      .select('id, total_pending')
      .eq('phone', phone)
      .eq('name', customerName)
      .maybeSingle()

    if (lookupError) throw lookupError

    if (existingCustomer) {
      await applyUdharPending(existingCustomer.id, existingCustomer.total_pending)
      return existingCustomer.id
    }
  }

  const { data: newCustomer, error: insertError } = await supabase
    .from('customers')
    .insert({
      name: customerName,
      phone,
      total_pending: paymentMode === 'Udhar' ? amountDue : 0,
    })
    .select('id')
    .single()

  if (insertError) throw insertError
  return newCustomer.id
}

function buildBillItems(billId, items) {
  return items.map((item) => {
    const productId = item.product_id ?? item.productId

    if (!productId) {
      throw new Error(
        `Missing product_id for "${item.product_name ?? item.productName ?? 'unknown product'}"`,
      )
    }

    return {
      bill_id: billId,
      product_id: productId,
      product_name: item.product_name ?? item.productName,
      quantity: Number(item.quantity),
      price: Number(item.price),
      subtotal: Number(item.subtotal),
    }
  })
}

export function useBills() {
  const createBill = async ({
    customerName,
    customerPhone,
    items,
    paymentMode,
    amountPaid,
    existingCustomerId = null,
  }) => {
    try {
      const totalAmount = items.reduce((sum, item) => sum + Number(item.subtotal), 0)
      const paidNow = paymentMode === 'Udhar' ? Number(amountPaid) || 0 : totalAmount
      const amountDue = paymentMode === 'Udhar' ? Math.max(totalAmount - paidNow, 0) : 0

      const customerId = await resolveCustomer({
        customerName,
        customerPhone,
        paymentMode,
        amountDue,
        existingCustomerId,
      })

      const { data: bill, error: billError } = await supabase
        .from('bills')
        .insert({
          customer_id: customerId,
          customer_name: customerName,
          customer_phone: customerPhone?.trim() || null,
          total_amount: totalAmount,
          item_count: items.length,
          payment_mode: paymentMode,
          amount_paid: paidNow,
          amount_due: amountDue,
        })
        .select('*')
        .single()

      if (billError) throw billError

      const billItems = buildBillItems(bill.id, items)

      const { error: itemsError } = await supabase.from('bill_items').insert(billItems)
      if (itemsError) throw itemsError

      const createdBill = {
        ...bill,
        items: billItems.map((item) => ({
          product_id: item.product_id,
          productId: item.product_id,
          product_name: item.product_name,
          productName: item.product_name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
      }

      toast.success('Bill generated successfully')
      return { success: true, bill: createdBill }
    } catch (error) {
      toast.error(error.message || 'Failed to create bill')
      return { success: false, bill: null }
    }
  }

  return { createBill }
}
