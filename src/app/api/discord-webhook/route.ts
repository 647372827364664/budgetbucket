import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL
    console.log('[discord-webhook] incoming body:', JSON.stringify(body))
    console.log('[discord-webhook] webhookUrl is', !!webhookUrl)
    if (!webhookUrl) {
      console.warn('[discord-webhook] no webhook configured')
      return NextResponse.json({ success: false, error: 'Webhook not configured' }, { status: 500 })
    }

    let {
      orderId,
      userId,
      customerName,
      customerPhone,
      customerEmail,
      paymentMethod,
      subtotal,
      tax,
      shipping,
      total,
      items,
      address,
    } = body

    // If some customer data is missing, try to fetch from Firestore `users` doc
    try {
      if (userId && (!customerPhone || !customerEmail || !customerName)) {
        const userRef = doc(db, 'users', userId)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          const udata: any = userSnap.data()
          customerName = customerName || udata.name || udata.displayName || customerName
          customerPhone = customerPhone || udata.phone || udata.phoneNumber || customerPhone
          customerEmail = customerEmail || udata.email || customerEmail
        }
      }
    } catch (e) {
      console.warn('[discord-webhook] could not fetch user data', e)
    }

    // If subtotal or totals missing, compute from items
    try {
      if ((!subtotal || Number(subtotal) === 0) && Array.isArray(items) && items.length > 0) {
        const computed = items.reduce((s: number, it: any) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0)
        subtotal = computed
        // If tax or shipping missing, leave as-is; compute total if missing
        total = total || subtotal + (Number(tax || 0)) + (Number(shipping || 0))
      }
    } catch (e) {
      console.warn('[discord-webhook] could not compute subtotal from items', e)
    }

    // If address missing, try to load order doc by orderId
    try {
      if (!address && orderId) {
        const orderRef = doc(db, 'orders', orderId)
        const orderSnap = await getDoc(orderRef)
        if (orderSnap.exists()) {
          const odata: any = orderSnap.data()
          address = address || odata.address || null
          subtotal = subtotal || odata.subtotal
          tax = tax || odata.taxAmount || odata.tax
          shipping = shipping || odata.shippingCost || odata.shipping
          total = total || odata.total
          paymentMethod = paymentMethod || odata.paymentMethod || odata.payment
        }
      }
    } catch (e) {
      console.warn('[discord-webhook] could not fetch order doc', e)
    }

    const itemsText = (items || [])
      .map((it: any) => `• ${it.name || it.productId} x ${it.quantity} @ ₹${it.price}`)
      .join('\n') || 'No items'

    const addressText = address
      ? `${address.name || ''}\n${address.street || ''}\n${address.city || ''} ${address.postalCode || ''}\n${address.state || ''}\n${address.country || ''}`.trim()
      : 'No address'

    const embed: any = {
      title: `New order received: ${orderId || 'N/A'}`,
      color: 7506394,
      fields: [
        { name: 'Customer', value: `${customerName || 'Guest'} (${userId || 'N/A'})`, inline: true },
        { name: 'Phone', value: customerPhone || 'N/A', inline: true },
        { name: 'Email', value: customerEmail || 'N/A', inline: true },
        { name: 'Payment Method', value: paymentMethod || 'N/A', inline: true },
        { name: 'Shipping (cost)', value: `₹${Number(shipping || 0).toFixed(2)}`, inline: true },
        { name: 'Subtotal', value: `₹${Number(subtotal || 0).toFixed(2)}`, inline: true },
        { name: 'Tax', value: `₹${Number(tax || 0).toFixed(2)}`, inline: true },
        { name: 'Total', value: `₹${Number(total || 0).toFixed(2)}`, inline: true },
        { name: 'Address', value: addressText || 'N/A' },
        { name: 'Items', value: itemsText },
      ],
      timestamp: new Date().toISOString(),
    }

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      })
      const text = await res.text().catch(() => '')
      console.log('[discord-webhook] discord response status', res.status, 'body:', text)
    } catch (err) {
      console.warn('[discord-webhook] forward error', err)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Discord webhook error:', error)
    return NextResponse.json({ success: false, error: 'Failed to send webhook' }, { status: 500 })
  }
}
