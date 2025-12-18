'use client'

import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { onAuthStateChanged, auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const { setUser, user: storedUser } = useAuthStore()

  useEffect(() => {
    // Initialize auth listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
      try {
        if (firebaseUser && firebaseUser.uid) {
          // Fetch user data from Firestore to get isAdmin and other fields
          const userDocRef = doc(db, 'users', firebaseUser.uid)
          const userDoc = await getDoc(userDocRef)
          
          if (userDoc.exists()) {
            // User exists in Firestore - use their actual data
            const userData = userDoc.data()
            const user = {
              id: firebaseUser.uid,
              phone: userData.phone || firebaseUser.phoneNumber || '',
              email: userData.email || firebaseUser.email || undefined,
              profileImage: userData.profileImage || firebaseUser.photoURL || undefined,
              addresses: userData.addresses || [],
              isAdmin: userData.isAdmin === true, // Preserve isAdmin from Firestore
              createdAt: userData.createdAt?.toDate?.() || new Date(),
              updatedAt: userData.updatedAt?.toDate?.() || new Date(),
              isBlocked: userData.isBlocked || false,
              name: userData.name || firebaseUser.displayName || undefined,
            }
            setUser(user)
          } else {
            // New user - create basic profile
            const user = {
              id: firebaseUser.uid,
              phone: firebaseUser.phoneNumber || '',
              email: firebaseUser.email || undefined,
              profileImage: firebaseUser.photoURL || undefined,
              addresses: [],
              isAdmin: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              isBlocked: false,
              name: firebaseUser.displayName || undefined,
            }
            setUser(user)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        // On error, try to keep the stored user if Firebase user exists
        if (firebaseUser && storedUser && storedUser.id === firebaseUser.uid) {
          // Keep existing user data on error
          console.log('Keeping stored user data due to fetch error')
        } else {
          setUser(null)
        }
      } finally {
        setIsReady(true)
      }
    })

    return () => unsubscribe()
  }, [setUser, storedUser])

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22C55E',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  )
}
