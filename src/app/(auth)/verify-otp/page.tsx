'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, CheckCircle } from 'lucide-react'
import { OTPInput } from '@/components/auth/OTPInput'
import { verifyPhoneOTP } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'

function OTPVerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phoneNumber = searchParams.get('phone') || ''

  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  const setUser = useAuthStore((state) => state.setUser)
  const setLoading = useAuthStore((state) => state.setLoading)
  const setAuthError = useAuthStore((state) => state.setError)

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    try {
      setIsLoading(true)
      setLoading(true)
      setError(null)

      const result = await verifyPhoneOTP(otp)

      // Update auth store
      setUser(result.user)
      setIsSuccess(true)

      // Wait for success animation then redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify OTP'
      setError(errorMessage)
      setAuthError(errorMessage)
      console.error('OTP verification error:', err)
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendCountdown > 0) return

    try {
      setIsLoading(true)
      setError(null)

      // Resend OTP
      // Note: You'd need to implement this in authService
      setResendCountdown(60)

      const countdown = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdown)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend OTP'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Successful!</h2>
          <p className="text-gray-600">Welcome to Budget Bucket. Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-4 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      {/* OTP Card */}
      <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Number</h2>
        <p className="text-gray-600 mb-6">
          We've sent a 6-digit OTP to <br />
          <span className="font-semibold text-gray-900">{phoneNumber}</span>
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleVerifyOTP} className="space-y-6">
          {/* OTP Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">Enter OTP</label>
            <OTPInput
              value={otp}
              onChange={setOtp}
              onComplete={() => handleVerifyOTP()}
              disabled={isLoading}
              length={6}
              autoFocus
            />
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify OTP'
            )}
          </button>
        </form>

        {/* Resend OTP */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Didn't receive the OTP?{' '}
            <button
              onClick={handleResendOTP}
              disabled={resendCountdown > 0 || isLoading}
              className="text-primary-600 hover:text-primary-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
            </button>
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>OTP expires in 10 minutes.</strong> Make sure to enter it before the timer runs out.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-6 text-sm text-gray-600">
        <p>
          <Link href="/login" className="text-primary-600 hover:underline font-medium">
            Try another number
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div className="text-center text-gray-600">Loading...</div>}>
      <OTPVerifyContent />
    </Suspense>
  )
}
