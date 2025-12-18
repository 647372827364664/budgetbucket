'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Phone, AlertCircle, CheckCircle2, Loader } from 'lucide-react'
import { db } from '@/lib/firebase'
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { useAuthStore } from '@/store/authStore'
import { OTPInput } from '@/components/auth/OTPInput'
import { sendPhoneOTP, verifyPhoneOTP, initializeRecaptcha } from '@/services/authService'

interface GoogleSignupData {
  uid: string
  name: string
  email: string
  phone: string
  profileImage: string
}

export default function CompleteProfilePage() {
  const router = useRouter()
  const [googleData, setGoogleData] = useState<GoogleSignupData | null>(null)
  const [phone, setPhone] = useState('')
  const [formattedPhone, setFormattedPhone] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null)
  const [canResendOTP, setCanResendOTP] = useState(false)

  // Load Google signup data and initialize reCAPTCHA
  useEffect(() => {
    const data = sessionStorage.getItem('googleSignupData')
    if (!data) {
      // No Google signup data, redirect to signup
      router.push('/signup')
      return
    }

    const parsedData: GoogleSignupData = JSON.parse(data)
    setGoogleData(parsedData)
    if (parsedData.phone) {
      setPhone(parsedData.phone)
    }

    // Initialize reCAPTCHA when page loads
    initializeRecaptcha().catch((err) => {
      console.error('Failed to initialize reCAPTCHA:', err)
    })
  }, [router])

  const validatePhone = () => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit phone number')
      return false
    }
    return true
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!validatePhone()) {
      return
    }

    setIsLoading(true)
    try {
      const cleanPhone = phone.replace(/\D/g, '')
      const formatted = '+91' + cleanPhone.slice(-10)
      setFormattedPhone(formatted)

      // Send OTP
      await sendPhoneOTP(formatted)

      setSuccessMessage(`OTP sent to ${formatted}. Please check your phone.`)
      setStep('otp')
      setOtpExpiry(300) // 5 minutes

      // Start countdown
      const interval = setInterval(() => {
        setOtpExpiry((prev) => {
          if (prev === null || prev <= 0) {
            clearInterval(interval)
            setCanResendOTP(true)
            return null
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to send OTP. Please try again.'
      setError(message)
      console.error('OTP send error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP')
      return
    }

    if (!googleData) {
      setError('Session expired. Please try again.')
      return
    }

    setIsLoading(true)
    try {
      // Verify OTP
      await verifyPhoneOTP(otp)

      setSuccessMessage('Phone verified successfully!')

      // Create user document in Firestore
      const userDocRef = doc(db, 'users', googleData.uid)

      const userData = {
        id: googleData.uid,
        phone: formattedPhone,
        email: googleData.email,
        name: googleData.name,
        profileImage: googleData.profileImage,
        addresses: [],
        isAdmin: false,
        isBlocked: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
      }

      await setDoc(userDocRef, userData, { merge: true })

      // Update auth store
      useAuthStore.setState({
        user: {
          id: googleData.uid,
          phone: formattedPhone,
          email: googleData.email,
          name: googleData.name,
          profileImage: googleData.profileImage,
          addresses: [],
          isAdmin: false,
          isBlocked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isAuthenticated: true,
      })

      // Clear session data
      sessionStorage.removeItem('googleSignupData')

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify OTP. Please try again.'
      setError(message)
      console.error('OTP verify error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError('')
    setSuccessMessage('')
    setIsLoading(true)

    try {
      await sendPhoneOTP(formattedPhone)
      setSuccessMessage('OTP resent successfully!')
      setOtpExpiry(300)
      setCanResendOTP(false)
      setOtp('')

      // Restart countdown
      const interval = setInterval(() => {
        setOtpExpiry((prev) => {
          if (prev === null || prev <= 0) {
            clearInterval(interval)
            setCanResendOTP(true)
            return null
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend OTP'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!googleData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
        <Loader className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <span className="text-white font-black text-lg">BB</span>
            </div>
            <span className="font-black text-gray-900 hidden sm:block">Budget Bucket</span>
          </Link>
          <div className="text-gray-600 text-sm font-medium">
            Already have account? <Link href="/login" className="text-purple-600 font-bold hover:text-purple-700 transition-colors">Sign in</Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
        {/* Form Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
            {step === 'phone' ? 'Verify Your Phone' : 'Enter OTP'}
          </h1>
          <p className="text-gray-600 text-base">
            {step === 'phone'
              ? 'Help us secure your account by verifying your phone number'
              : `We sent a 6-digit code to ${formattedPhone}`}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          {/* User Info */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
            <div className="space-y-2">
              {googleData.profileImage && (
                <div className="flex justify-center mb-3">
                  <img
                    src={googleData.profileImage}
                    alt={googleData.name}
                    className="w-16 h-16 rounded-full border-2 border-purple-300"
                  />
                </div>
              )}
              <div className="text-center">
                <p className="font-semibold text-gray-900">{googleData.name}</p>
                <p className="text-sm text-gray-600">{googleData.email}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-5">
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">We'll verify this phone number with an OTP</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem('googleSignupData')
                  router.push('/signup')
                }}
                className="w-full border border-gray-300 hover:border-gray-400 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-all duration-300 hover:bg-gray-50"
              >
                Use Different Number
              </button>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit} className="space-y-5">
              <div>
                <label htmlFor="otp" className="block text-sm font-semibold text-gray-900 mb-3">
                  Enter 6-Digit Code
                </label>
                <OTPInput value={otp} onChange={setOtp} disabled={isLoading} />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Create Account'
                )}
              </button>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {otpExpiry !== null && otpExpiry > 0
                    ? `Expires in ${formatTime(otpExpiry)}`
                    : 'OTP Expired'}
                </span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={!canResendOTP || isLoading}
                  className="text-purple-600 font-semibold hover:text-purple-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Resend OTP
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep('phone')
                  setOtp('')
                  setError('')
                  setSuccessMessage('')
                }}
                className="w-full border border-gray-300 hover:border-gray-400 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-all duration-300 hover:bg-gray-50"
              >
                Use Different Number
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-purple-600 font-semibold hover:text-purple-700">
            Terms & Conditions
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-purple-600 font-semibold hover:text-purple-700">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
