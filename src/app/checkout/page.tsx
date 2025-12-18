'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Plus,
  CheckCircle2,
  ShieldCheck,
  Package,
  Truck,
  Phone
} from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'react-hot-toast'
import { db } from '@/lib/firebase'
import { 
  doc, 
  setDoc,
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore'
import { sendOrderNotification } from '@/services/whatsappService'

interface Address {
  id: string
  name: string
  phone: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
  addressType: 'home' | 'work' | 'other'
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { items, clearCart } = useCartStore()
  
  const [step, setStep] = useState<'address' | 'payment' | 'review'>('address')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay')
  const [orderProcessing, setOrderProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [taxRate, setTaxRate] = useState(0.18)
  
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    addressType: 'home' as 'home' | 'work' | 'other'
  })

  // Calculate totals
  const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
  const tax = Math.round(subtotal * taxRate)
  const shipping = subtotal >= 500 ? 0 : 50
  const total = subtotal + tax + shipping

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      if (window.Razorpay) {
        setRazorpayLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => {
        console.log('Razorpay script loaded')
        setRazorpayLoaded(true)
      }
      script.onerror = () => {
        console.error('Failed to load Razorpay')
      }
      document.body.appendChild(script)
    }

    loadRazorpay()
  }, [])

  useEffect(() => {
    let mounted = true
    const loadTax = async () => {
      try {
        const svc = await import('@/services/cartService')
        const rate = await svc.getTaxRateFromSettings()
        if (mounted) setTaxRate(rate)
      } catch (err) {
        console.warn('Failed to load tax rate:', err)
      }
    }
    loadTax()
    return () => { mounted = false }
  }, [])

  // Fetch user addresses
  useEffect(() => {
    if (user?.id) {
      fetchAddresses()
    }
    setIsLoading(false)
  }, [user])

  const fetchAddresses = async () => {
    if (!user?.id) return

    try {
      const q = query(collection(db, 'addresses'), where('userId', '==', user.id))
      const snapshot = await getDocs(q)
      const userAddresses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Address[]

      setAddresses(userAddresses)
      
      const defaultAddress = userAddresses.find(a => a.isDefault)
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id)
      } else if (userAddresses.length > 0) {
        setSelectedAddressId(userAddresses[0].id)
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    }
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) {
      toast.error('Please login to add address')
      return
    }

    try {
      const addressData = {
        ...newAddress,
        userId: user.id,
        isDefault: addresses.length === 0,
        createdAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'addresses'), addressData)
      
      const newAddr = { id: docRef.id, ...addressData, isDefault: addresses.length === 0 } as Address
      setAddresses([...addresses, newAddr])
      setSelectedAddressId(docRef.id)
      setShowNewAddress(false)
      setNewAddress({
        name: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        addressType: 'home'
      })
      toast.success('Address added successfully!')
    } catch (error) {
      console.error('Error adding address:', error)
      toast.error('Failed to add address')
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address')
      return
    }

    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    const selectedAddress = addresses.find(a => a.id === selectedAddressId)
    if (!selectedAddress) {
      toast.error('Address not found')
      return
    }

    setOrderProcessing(true)

    try {
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

      const orderData = {
        orderId,
        userId: user?.id || 'guest',
        customerInfo: {
          name: user?.name || selectedAddress.name,
          email: user?.email,
          phone: user?.phone || selectedAddress.phone
        },
        items: items.map((item: any) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          category: item.category
        })),
        address: selectedAddress,
        paymentMethod,
        summary: { subtotal, tax, shipping, total },
        orderDate: new Date().toISOString(),
        status: 'pending',
        paymentStatus: paymentMethod === 'cod' ? 'pending_cod' : 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      console.log('Creating order:', orderId, 'Payment method:', paymentMethod)

      if (paymentMethod === 'cod') {
        await handleCODOrder(orderData, orderId)
      } else {
        await handleRazorpayPayment(orderData, orderId, selectedAddress)
      }
    } catch (error) {
      console.error('Order error:', error)
      toast.error('Failed to place order')
      setOrderProcessing(false)
    }
  }

  const handleCODOrder = async (orderData: any, orderId: string) => {
    const orderRef = doc(db, 'orders', orderId)
    await setDoc(orderRef, {
      ...orderData,
      status: 'confirmed',
      paymentStatus: 'pending_cod'
    })

    const selectedAddress = addresses.find(a => a.id === selectedAddressId)

    // Send WhatsApp notification to business owner
    try {
      await sendOrderNotification({
        orderId,
        orderNumber: orderId,
        customerName: user?.name || selectedAddress?.name || 'Customer',
        customerPhone: user?.phone || selectedAddress?.phone || '',
        customerEmail: user?.email,
        items: items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total,
        subtotal,
        shipping,
        paymentMethod: 'cod',
        shippingAddress: {
          name: selectedAddress?.name,
          street: selectedAddress?.street,
          city: selectedAddress?.city || '',
          state: selectedAddress?.state || '',
          pincode: selectedAddress?.postalCode || '',
        },
        createdAt: new Date(),
      })
      console.log('✅ WhatsApp notification sent for order:', orderId)
    } catch (error) {
      console.error('WhatsApp notification error:', error)
    }

    // Send Discord webhook notification (server-side)
    try {
      await fetch('/api/discord-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          userId: user?.id || 'guest',
          customerName: user?.name || selectedAddress?.name || 'Customer',
          customerPhone: user?.phone || selectedAddress?.phone || '',
          customerEmail: user?.email || '',
          paymentMethod: 'cod',
          subtotal,
          tax,
          shipping,
          total,
          address: selectedAddress,
          items: items.map((item: any) => ({ name: item.name, quantity: item.quantity, price: item.price })),
        }),
      })
      console.log('✅ Discord webhook requested for order:', orderId)
    } catch (err) {
      console.warn('Discord webhook error:', err)
    }

    clearCart()
    toast.success('Order placed successfully!')
    router.push(`/order-confirmation/${orderId}`)
  }

  const handleRazorpayPayment = async (orderData: any, orderId: string, address: Address) => {
    console.log('=== STARTING RAZORPAY PAYMENT ===')
    console.log('Amount:', total, 'Order ID:', orderId)

    if (!razorpayLoaded || !window.Razorpay) {
      toast.error('Payment gateway not loaded. Please refresh.')
      setOrderProcessing(false)
      return
    }

    try {
      // Create Razorpay order
      console.log('Creating Razorpay order via API...')
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: 'INR',
          orderId: orderId
        })
      })

      const razorpayOrder = await response.json()
      console.log('Razorpay order response:', razorpayOrder)

      if (!response.ok) {
        throw new Error(razorpayOrder.error || 'Failed to create payment order')
      }

      // Save order to Firebase first (pending payment)
      const orderRef = doc(db, 'orders', orderId)
      await setDoc(orderRef, {
        ...orderData,
        razorpayOrderId: razorpayOrder.id,
        status: 'pending_payment',
        paymentStatus: 'pending'
      })

      console.log('Order saved to Firebase, opening Razorpay...')

      // Open Razorpay checkout
      const razorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'Budget Bucket',
        description: `Order #${orderId}`,
        order_id: razorpayOrder.id,
        prefill: {
          name: address.name,
          contact: address.phone,
          email: user?.email || ''
        },
        theme: { color: '#8b5cf6' },
        handler: async (response: any) => {
          console.log('Payment success handler called:', response)
          try {
            // Verify payment
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderId
              })
            })

            if (verifyRes.ok) {
              // Send WhatsApp notification to business owner
              try {
                await sendOrderNotification({
                  orderId,
                  orderNumber: orderId,
                  customerName: user?.name || address.name || 'Customer',
                  customerPhone: user?.phone || address.phone || '',
                  customerEmail: user?.email,
                  items: items.map((item: any) => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                  })),
                  total,
                  subtotal,
                  shipping,
                  paymentMethod: 'razorpay',
                  shippingAddress: {
                    name: address.name,
                    street: address.street,
                    city: address.city || '',
                    state: address.state || '',
                    pincode: address.postalCode || '',
                  },
                  createdAt: new Date(),
                })
                console.log('✅ WhatsApp notification sent for order:', orderId)
              } catch (error) {
                console.error('WhatsApp notification error:', error)
              }

                // Send Discord webhook notification (server-side)
                try {
                  await fetch('/api/discord-webhook', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      orderId,
                      userId: user?.id || 'guest',
                      customerName: user?.name || address.name || 'Customer',
                      customerPhone: user?.phone || address.phone || '',
                      customerEmail: user?.email || '',
                      paymentMethod: 'razorpay',
                      subtotal,
                      tax,
                      shipping,
                      total,
                      address: address,
                      items: items.map((item: any) => ({ name: item.name, quantity: item.quantity, price: item.price })),
                    }),
                  })
                  console.log('✅ Discord webhook requested for order:', orderId)
                } catch (err) {
                  console.warn('Discord webhook error:', err)
                }

              clearCart()
              toast.success('Payment successful!')
              router.push(`/order-confirmation/${orderId}`)
            } else {
              toast.error('Payment verification failed')
              setOrderProcessing(false)
            }
          } catch (err) {
            console.error('Verification error:', err)
            toast.error('Payment verification failed')
            setOrderProcessing(false)
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Razorpay modal dismissed')
            toast.error('Payment cancelled')
            setOrderProcessing(false)
            // Update order status
            updateDoc(doc(db, 'orders', orderId), {
              status: 'payment_cancelled',
              paymentStatus: 'cancelled'
            })
          }
        }
      }

      console.log('Opening Razorpay with options:', { ...razorpayOptions, key: '***' })
      const razorpay = new window.Razorpay(razorpayOptions)
      
      razorpay.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response.error)
        toast.error(response.error?.description || 'Payment failed')
        setOrderProcessing(false)
        updateDoc(doc(db, 'orders', orderId), {
          status: 'payment_failed',
          paymentStatus: 'failed',
          paymentError: response.error?.description
        })
      })

      razorpay.open()
    } catch (error) {
      console.error('Razorpay error:', error)
      toast.error('Payment initialization failed')
      setOrderProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md text-center shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Please Login</h2>
          <p className="text-slate-600 mb-6">You need to login to proceed with checkout</p>
          <Link href="/login" className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium">
            Login to Continue
          </Link>
        </div>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md text-center shadow-lg">
          <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
          <p className="text-slate-600 mb-6">Add some items to proceed with checkout</p>
          <Link href="/products" className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium">
            Browse Products
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/cart" className="flex items-center gap-2 text-purple-600 font-medium">
              <ArrowLeft className="w-5 h-5" />
              Back to Cart
            </Link>
            <h1 className="text-xl font-bold">Checkout</h1>
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <ShieldCheck className="w-4 h-4" />
              Secure
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {['address', 'payment', 'review'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                step === s ? 'bg-purple-600 text-white' :
                ['address', 'payment', 'review'].indexOf(step) > i ? 'bg-green-500 text-white' :
                'bg-slate-200 text-slate-500'
              }`}>
                {i + 1}
              </div>
              <span className={`capitalize ${step === s ? 'text-purple-600 font-medium' : 'text-slate-500'}`}>
                {s}
              </span>
              {i < 2 && <div className="w-12 h-0.5 bg-slate-200 ml-2" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Address Step */}
            {step === 'address' && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  Delivery Address
                </h2>

                {addresses.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {addresses.map(addr => (
                      <label
                        key={addr.id}
                        className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                          selectedAddressId === addr.id ? 'border-purple-600 bg-purple-50' : 'border-slate-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="sr-only"
                        />
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{addr.name}</p>
                            <p className="text-sm text-slate-600">{addr.street}</p>
                            <p className="text-sm text-slate-600">{addr.city}, {addr.state} - {addr.postalCode}</p>
                            <p className="text-sm text-slate-500 mt-1">
                              <Phone className="w-3 h-3 inline mr-1" />
                              {addr.phone}
                            </p>
                          </div>
                          {selectedAddressId === addr.id && (
                            <CheckCircle2 className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setShowNewAddress(!showNewAddress)}
                  className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-purple-400 hover:text-purple-600 transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add New Address
                </button>

                {showNewAddress && (
                  <form onSubmit={handleAddAddress} className="mt-4 space-y-4 p-4 bg-slate-50 rounded-lg">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Full Name"
                        required
                        value={newAddress.name}
                        onChange={e => setNewAddress({ ...newAddress, name: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        required
                        value={newAddress.phone}
                        onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Street Address"
                      required
                      value={newAddress.street}
                      onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    <div className="grid sm:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="City"
                        required
                        value={newAddress.city}
                        onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        required
                        value={newAddress.state}
                        onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="PIN Code"
                        required
                        value={newAddress.postalCode}
                        onChange={e => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
                    >
                      Save Address
                    </button>
                  </form>
                )}

                <button
                  onClick={() => selectedAddressId && setStep('payment')}
                  disabled={!selectedAddressId}
                  className="w-full mt-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {/* Payment Step */}
            {step === 'payment' && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  Payment Method
                </h2>

                <div className="space-y-3">
                  <label className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                    paymentMethod === 'razorpay' ? 'border-purple-600 bg-purple-50' : 'border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      onChange={() => setPaymentMethod('razorpay')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Pay Online (Razorpay)</p>
                          <p className="text-sm text-slate-500">Cards, UPI, Net Banking, Wallets</p>
                        </div>
                      </div>
                      {paymentMethod === 'razorpay' && <CheckCircle2 className="w-5 h-5 text-purple-600" />}
                    </div>
                  </label>

                  <label className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                    paymentMethod === 'cod' ? 'border-orange-500 bg-orange-50' : 'border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Truck className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">Cash on Delivery</p>
                          <p className="text-sm text-slate-500">Pay when you receive</p>
                        </div>
                      </div>
                      {paymentMethod === 'cod' && <CheckCircle2 className="w-5 h-5 text-orange-500" />}
                    </div>
                  </label>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setStep('address')}
                    className="flex-1 py-3 border border-slate-300 rounded-lg font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('review')}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {/* Review Step */}
            {step === 'review' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold mb-4">Order Review</h2>
                  
                  {/* Selected Address */}
                  <div className="p-4 bg-slate-50 rounded-lg mb-4">
                    <p className="text-sm text-slate-500 mb-1">Delivering to:</p>
                    {addresses.find(a => a.id === selectedAddressId) && (
                      <div>
                        <p className="font-medium">{addresses.find(a => a.id === selectedAddressId)?.name}</p>
                        <p className="text-sm text-slate-600">
                          {addresses.find(a => a.id === selectedAddressId)?.street}, 
                          {addresses.find(a => a.id === selectedAddressId)?.city}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div className="space-y-3">
                    {items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4 py-3 border-b last:border-0">
                        <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden relative">
                          {item.image && (
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep('payment')}
                    className="flex-1 py-3 border border-slate-300 rounded-lg font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={orderProcessing}
                    className="flex-1 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {orderProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Place Order - ₹{total.toLocaleString()}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <h3 className="font-bold text-lg mb-4">Order Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal ({items.length} items)</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">GST (18%)</span>
                  <span>₹{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600' : ''}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-purple-600">₹{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Secure checkout with SSL encryption
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
