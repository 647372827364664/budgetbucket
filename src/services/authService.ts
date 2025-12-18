import {
  signInWithPhoneNumber,
  ConfirmationResult,
  signOut,
  RecaptchaVerifier,
} from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore'
import { User } from '@/types'

let confirmationResult: ConfirmationResult | null = null
let recaptchaVerifier: RecaptchaVerifier | null = null

declare global {
  interface Window {
    recaptchaVerifier?: any
  }
}

/**
 * Initialize reCAPTCHA verifier
 * Must be called before sending OTP
 */
export async function initializeRecaptcha() {
  try {
    // Clean up old verifier if it exists
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear()
      } catch (e) {
        // Ignore cleanup errors
      }
      recaptchaVerifier = null
    }

    // Create recaptcha container if needed
    let containerElement = document.getElementById('recaptcha-container')
    if (!containerElement) {
      containerElement = document.createElement('div')
      containerElement.id = 'recaptcha-container'
      containerElement.style.display = 'none'
      document.body.appendChild(containerElement)
    }

    // Initialize new verifier
    recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA verified')
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired')
        recaptchaVerifier = null
      },
    })

    // Store in window for backup
    window.recaptchaVerifier = recaptchaVerifier

    return recaptchaVerifier
  } catch (error) {
    console.error('Error initializing reCAPTCHA:', error)
    recaptchaVerifier = null
    throw new Error('Failed to initialize reCAPTCHA. Please try again.')
  }
}

/**
 * Send OTP to phone number
 * @param phoneNumber - Phone number in international format (e.g., +91XXXXXXXXXX)
 * @returns Promise with confirmation result for OTP verification
 */
export async function sendPhoneOTP(phoneNumber: string) {
  try {
    if (!phoneNumber.startsWith('+')) {
      throw new Error('Phone number must be in international format (e.g., +91XXXXXXXXXX)')
    }

    // Initialize reCAPTCHA if not already done
    if (!recaptchaVerifier) {
      await initializeRecaptcha()
    }

    // Double-check verifier exists
    if (!recaptchaVerifier) {
      throw new Error('reCAPTCHA failed to initialize. Please try again.')
    }

    // Send OTP using the properly initialized verifier
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)

    return {
      success: true,
      message: `OTP sent to ${phoneNumber}`,
    }
  } catch (error) {
    console.error('Error sending OTP:', error)
    // Reset verifier on error
    recaptchaVerifier = null
    throw error instanceof Error ? error : new Error('Failed to send OTP')
  }
}

/**
 * Verify OTP code
 * @param otp - 6-digit OTP code
 * @returns User data after successful verification
 */
export async function verifyPhoneOTP(otp: string) {
  try {
    if (!confirmationResult) {
      throw new Error('OTP session expired. Please try again.')
    }

    if (otp.length !== 6) {
      throw new Error('OTP must be 6 digits')
    }

    const result = await confirmationResult.confirm(otp)
    const firebaseUser = result.user

    // Check if user exists in Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid)
    const userDoc = await getDoc(userDocRef)

    let userData: User

    if (userDoc.exists()) {
      // Existing user - update last login
      userData = userDoc.data() as User
      await setDoc(
        userDocRef,
        {
          lastLogin: Timestamp.now(),
        },
        { merge: true }
      )
    } else {
      // New user - create profile
      userData = {
        id: firebaseUser.uid,
        phone: firebaseUser.phoneNumber || '',
        name: firebaseUser.displayName || undefined,
        email: firebaseUser.email || undefined,
        profileImage: firebaseUser.photoURL || undefined,
        addresses: [],
        isAdmin: false,
        isBlocked: false,
        createdAt: new Date(firebaseUser.metadata?.creationTime || new Date()),
        updatedAt: new Date(),
      }

      await setDoc(userDocRef, {
        ...userData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
      })
    }

    // Reset confirmation result
    confirmationResult = null

    return {
      success: true,
      user: userData,
      firebaseUser,
    }
  } catch (error) {
    console.error('Error verifying OTP:', error)
    throw error instanceof Error ? error : new Error('Invalid OTP. Please try again.')
  }
}

/**
 * Logout user
 */
export async function logoutUser() {
  try {
    await signOut(auth)
    confirmationResult = null
    return {
      success: true,
      message: 'Logged out successfully',
    }
  } catch (error) {
    console.error('Error logging out:', error)
    throw error instanceof Error ? error : new Error('Failed to logout')
  }
}

/**
 * Update user profile
 * @param userId - User ID
 * @param userData - Partial user data to update
 */
export async function updateUserProfile(userId: string, userData: Partial<User>) {
  try {
    const userDocRef = doc(db, 'users', userId)
    await setDoc(
      userDocRef,
      {
        ...userData,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    )

    const updatedDoc = await getDoc(userDocRef)
    return updatedDoc.data() as User
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error instanceof Error ? error : new Error('Failed to update profile')
  }
}

/**
 * Get user profile by ID
 * @param userId - User ID
 */
export async function getUserProfile(userId: string) {
  try {
    const userDocRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      throw new Error('User not found')
    }

    return userDoc.data() as User
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw error instanceof Error ? error : new Error('Failed to fetch user profile')
  }
}

/**
 * Add or update user address
 * @param userId - User ID
 * @param address - Address data
 */
export async function addUserAddress(
  userId: string,
  address: Omit<{
    id?: string
    name: string
    phone: string
    city: string
    state: string
    postalCode: string
    street: string
    country: string
    isDefault?: boolean
  }, 'id'>
) {
  try {
    const userDocRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      throw new Error('User not found')
    }

    const user = userDoc.data() as User
    const addressId = `addr_${Date.now()}`

    const updatedAddresses = user.addresses || []

    updatedAddresses.push({
      ...address,
      id: addressId,
      isDefault: address.isDefault ?? false,
    })

    await setDoc(
      userDocRef,
      {
        addresses: updatedAddresses,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    )

    return updatedAddresses
  } catch (error) {
    console.error('Error adding address:', error)
    throw error instanceof Error ? error : new Error('Failed to add address')
  }
}
