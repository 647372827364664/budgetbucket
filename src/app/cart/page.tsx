'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  Gift
} from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function CartPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { items, removeItem, updateQuantity, clearCart, itemCount } = useCartStore()
  const [isLoading, setIsLoading] = useState(false)
  const [discountCode, setDiscountCode] = useState('')
  const [discountApplied, setDiscountApplied] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [taxRate, setTaxRate] = useState(0.18)

  // Calculate subtotal
  const subtotal = items.reduce((sum: number, item: any) => {
    return sum + item.price * item.quantity
  }, 0)

  // Calculate tax (from settings)
  const tax = (subtotal - discountAmount) * taxRate

  // Shipping cost (free for orders above 500)
  const shipping = subtotal - discountAmount >= 500 ? 0 : 50

  // Final total
  const finalTotal = subtotal + tax + shipping - discountAmount

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      return
    }

    try {
      setIsLoading(true)
      // Mock discount validation
      const validCodes: Record<string, { type: 'percentage' | 'fixed'; value: number; maxDiscount?: number }> = {
        SAVE10: { type: 'percentage', value: 10, maxDiscount: 100 },
        FLAT50: { type: 'fixed', value: 50 },
        WELCOME: { type: 'percentage', value: 15, maxDiscount: 150 }
      }

      const discount = validCodes[discountCode.toUpperCase()]
      if (!discount) {
        throw new Error('Invalid discount code')
      }

      // Calculate discount amount
      let amount = 0
      if (discount.type === 'percentage') {
        amount = (subtotal * discount.value) / 100
        if (discount.maxDiscount) {
          amount = Math.min(amount, discount.maxDiscount)
        }
      } else {
        amount = discount.value
      }

      setDiscountAmount(amount)
      setDiscountApplied(true)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Invalid discount code')
      setDiscountCode('')
      setDiscountApplied(false)
      setDiscountAmount(0)
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleProceedToCheckout = () => {
    if (!user) {
      router.push('/login')
      return
    }
    if (items.length === 0) {
      alert('Cart is empty')
      return
    }
    router.push('/checkout')
  }

  const EmptyCart = () => (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="relative">
        <ShoppingBag className="w-32 h-32 text-gray-300 mb-8" />
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">0</span>
        </div>
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
      <p className="text-gray-600 text-lg mb-8 text-center max-w-md">
        Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
      </p>
      <Link href="/products">
        <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
          Start Shopping
        </button>
      </Link>
    </div>
  )

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Shopping Cart</h1>
              <p className="text-xl text-purple-100 mb-6">
                Review your items and proceed to checkout
              </p>
              <div className="flex items-center justify-center gap-2 text-purple-100">
                <ShoppingBag className="w-5 h-5" />
                <span className="text-lg">{itemCount} {itemCount === 1 ? 'item' : 'items'} in cart</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {items.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Cart Items</h2>
                    <button
                      onClick={clearCart}
                      className="text-red-600 hover:text-red-700 font-medium flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-6">
                    {items.map((item) => (
                      <div key={item.productId} className="group relative">
                        <div className="flex gap-6 p-6 bg-gradient-to-r from-gray-50 to-purple-50 rounded-2xl hover:shadow-lg transition-all duration-300">
                          {/* Product Image */}
                          <div className="relative w-32 h-32 flex-shrink-0">
                            <Image
                              src={item.image || '/placeholder.jpg'}
                              alt={item.name}
                              fill
                              className="object-cover rounded-xl"
                            />
                          </div>

                          {/* Product Info */}
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                            <p className="text-gray-600 mb-3">{item.category}</p>
                            
                            {/* Price */}
                            <div className="flex items-center gap-3 mb-4">
                              <span className="text-2xl font-bold text-purple-600">₹{item.price}</span>
                              {item.originalPrice && item.originalPrice > item.price && (
                                <span className="text-lg text-gray-500 line-through">₹{item.originalPrice}</span>
                              )}
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm">
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  className="p-3 hover:bg-gray-50 rounded-l-xl transition-colors"
                                >
                                  <Minus className="w-4 h-4 text-gray-600" />
                                </button>
                                <span className="px-6 py-3 font-semibold text-gray-900 border-x border-gray-200">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  className="p-3 hover:bg-gray-50 rounded-r-xl transition-colors"
                                >
                                  <Plus className="w-4 h-4 text-gray-600" />
                                </button>
                              </div>
                              
                              <span className="text-lg font-semibold text-gray-600">
                                Total: ₹{(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:shadow-lg hover:bg-red-50 transition-all duration-200 group"
                          >
                            <Trash2 className="w-5 h-5 text-gray-500 group-hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Order Summary</h2>

                    {/* Discount Code */}
                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Have a coupon code?
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value)}
                          placeholder="Enter code"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <button
                          onClick={handleApplyDiscount}
                          disabled={isLoading || !discountCode.trim()}
                          className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                          {isLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                      {discountApplied && (
                        <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          Discount applied!
                        </div>
                      )}
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                      </div>
                      
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-lg text-green-600">
                          <span>Discount</span>
                          <span className="font-semibold">-₹{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-600">Tax ({(taxRate * 100).toFixed(2)}% GST)</span>
                        <span className="font-semibold">₹{tax.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-600">Shipping</span>
                        {shipping === 0 ? (
                          <span className="font-semibold text-green-600">FREE</span>
                        ) : (
                          <span className="font-semibold">₹{shipping}</span>
                        )}
                      </div>
                      
                      <hr className="border-gray-200" />
                      
                      <div className="flex justify-between text-xl font-bold text-purple-600">
                        <span>Total</span>
                        <span>₹{finalTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="mb-8 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-purple-600" />
                          <span className="text-sm text-gray-700">Secure Payment</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Truck className="w-5 h-5 text-purple-600" />
                          <span className="text-sm text-gray-700">Free shipping on orders ₹500+</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Gift className="w-5 h-5 text-purple-600" />
                          <span className="text-sm text-gray-700">Easy returns & exchanges</span>
                        </div>
                      </div>
                    </div>

                    {/* Checkout Button */}
                    <button
                      onClick={handleProceedToCheckout}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                    >
                      Proceed to Checkout
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    
                    <div className="mt-4 text-center">
                      <Link href="/products">
                        <span className="text-purple-600 hover:text-purple-700 font-medium cursor-pointer">
                          Continue Shopping
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
