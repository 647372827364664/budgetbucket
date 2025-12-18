'use client'

import React, { useRef, useEffect, useState } from 'react'

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''))

  useEffect(() => {
    const otpArray = value.split('').slice(0, length)
    setOtp([...otpArray, ...Array(length - otpArray.length).fill('')])
  }, [value, length])

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  const handleChange = (index: number, digit: string) => {
    // Only allow digits
    if (!/^\d*$/.test(digit)) return

    const newOtp = [...otp]
    newOtp[index] = digit

    setOtp(newOtp)
    const otpString = newOtp.join('')
    onChange(otpString)

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Trigger onComplete when all digits are filled
    if (otpString.length === length && onComplete) {
      onComplete(otpString)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = e

    if (key === 'Backspace') {
      e.preventDefault()
      const newOtp = [...otp]

      if (otp[index]) {
        // Clear current input
        newOtp[index] = ''
        setOtp(newOtp)
        onChange(newOtp.join(''))
      } else if (index > 0) {
        // Move to previous input and clear it
        newOtp[index - 1] = ''
        setOtp(newOtp)
        onChange(newOtp.join(''))
        inputRefs.current[index - 1]?.focus()
      }
    } else if (key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    } else if (key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const pastedDigits = pastedData.replace(/\D/g, '').slice(0, length)

    if (pastedDigits) {
      const newOtp = pastedDigits.split('').concat(Array(length - pastedDigits.length).fill(''))
      setOtp(newOtp.slice(0, length))
      const otpString = newOtp.slice(0, length).join('')
      onChange(otpString)

      // Focus on the next empty input or last input
      const nextIndex = Math.min(pastedDigits.length, length - 1)
      inputRefs.current[nextIndex]?.focus()

      if (otpString.length === length && onComplete) {
        onComplete(otpString)
      }
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array(length)
        .fill(null)
        .map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            maxLength={1}
            inputMode="numeric"
            value={otp[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        ))}
    </div>
  )
}
