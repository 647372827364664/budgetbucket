'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'react-hot-toast'

interface PaymentOptions {
  amount: number
  orderId: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  onSuccess?: (response: RazorpayResponse) => void
  onFailure?: (error: any) => void
}

interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface UseRazorpayReturn {
  isLoading: boolean
  processPayment: (options: PaymentOptions) => Promise<boolean>
  isScriptLoaded: boolean
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export function useRazorpay(): UseRazorpayReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  // Load Razorpay script on mount
  useEffect(() => {
    const loadScript = () => {
      // Check if already loaded
      if (typeof window !== 'undefined' && window.Razorpay) {
        setIsScriptLoaded(true)
        return
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
      if (existingScript) {
        existingScript.addEventListener('load', () => setIsScriptLoaded(true))
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => {
        console.log('Razorpay script loaded successfully')
        setIsScriptLoaded(true)
      }
      script.onerror = () => {
        console.error('Failed to load Razorpay script')
        setIsScriptLoaded(false)
      }
      document.body.appendChild(script)
    }

    loadScript()
  }, [])

  // Process payment using Razorpay
  const processPayment = useCallback(async (options: PaymentOptions): Promise<boolean> => {
    console.log('Starting Razorpay payment process...')
    
    try {
      setIsLoading(true)
      
      // Wait for script to load if not ready
      if (!isScriptLoaded && typeof window !== 'undefined' && !window.Razorpay) {
        console.log('Waiting for Razorpay script...')
        await new Promise<void>((resolve, reject) => {
          let attempts = 0
          const checkScript = setInterval(() => {
            attempts++
            if (window.Razorpay) {
              clearInterval(checkScript)
              resolve()
            } else if (attempts > 50) { // 5 seconds timeout
              clearInterval(checkScript)
              reject(new Error('Razorpay script failed to load'))
            }
          }, 100)
        })
      }

      if (!window.Razorpay) {
        toast.error('Payment gateway failed to load. Please refresh the page.')
        setIsLoading(false)
        return false
      }

      console.log('Creating Razorpay order...')
      
      // Create Razorpay order via API
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: options.amount,
          currency: 'INR',
          orderId: options.orderId,
          notes: {
            customerName: options.customerName,
            customerPhone: options.customerPhone,
          }
        }),
      })

      const orderData = await orderResponse.json()
      
      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create payment order')
      }

      console.log('Razorpay order created:', orderData)

      // Get Razorpay key
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      
      if (!razorpayKey) {
        toast.error('Payment gateway not configured')
        setIsLoading(false)
        return false
      }

      console.log('Opening Razorpay modal with key:', razorpayKey.substring(0, 10) + '...')

      // Open Razorpay checkout
      return new Promise((resolve) => {
        const razorpayOptions = {
          key: razorpayKey,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'Budget Bucket',
          description: `Order #${options.orderId}`,
          order_id: orderData.id,
          prefill: {
            name: options.customerName,
            contact: options.customerPhone,
            email: options.customerEmail || '',
          },
          theme: {
            color: '#8b5cf6',
          },
          handler: async function (response: RazorpayResponse) {
            console.log('Payment successful:', response)
            try {
              // Verify payment on server
              const verifyResponse = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: options.orderId,
                }),
              })

              if (verifyResponse.ok) {
                toast.success('Payment successful!')
                options.onSuccess?.(response)
                resolve(true)
              } else {
                const error = await verifyResponse.json()
                toast.error(error.error || 'Payment verification failed')
                options.onFailure?.(error)
                resolve(false)
              }
            } catch (error) {
              console.error('Payment verification error:', error)
              toast.error('Payment verification failed')
              options.onFailure?.(error)
              resolve(false)
            } finally {
              setIsLoading(false)
            }
          },
          modal: {
            ondismiss: function () {
              console.log('Razorpay modal closed by user')
              setIsLoading(false)
              toast.error('Payment cancelled')
              options.onFailure?.({ message: 'Payment cancelled by user' })
              resolve(false)
            },
            escape: true,
            backdropclose: false,
          },
        }

        try {
          console.log('Initializing Razorpay...')
          const razorpay = new window.Razorpay(razorpayOptions)
          
          razorpay.on('payment.failed', function (response: any) {
            console.error('Payment failed:', response.error)
            toast.error(response.error?.description || 'Payment failed')
            options.onFailure?.(response.error)
            setIsLoading(false)
            resolve(false)
          })
          
          console.log('Opening Razorpay modal...')
          razorpay.open()
        } catch (error) {
          console.error('Razorpay initialization error:', error)
          toast.error('Failed to open payment gateway')
          setIsLoading(false)
          options.onFailure?.(error)
          resolve(false)
        }
      })
    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error instanceof Error ? error.message : 'Payment failed')
      setIsLoading(false)
      return false
    }
  }, [isScriptLoaded])

  return {
    isLoading,
    processPayment,
    isScriptLoaded,
  }
}
