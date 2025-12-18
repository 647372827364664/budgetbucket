'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Plus, Edit2, Trash2, MapPin, Phone, User, Check, AlertCircle } from 'lucide-react'
import { db } from '@/lib/firebase'
import { doc, collection, getDocs, setDoc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore'
import Link from 'next/link'

interface Address {
  id: string
  name: string
  phone: string
  street: string
  city: string
  state: string
  postalCode: string
  isDefault: boolean
  createdAt?: any
  updatedAt?: any
}

export default function AddressesPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    isDefault: false,
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const fetchAddresses = async () => {
      try {
        setIsLoading(true)
        setError('')

        // Fetch addresses from Firestore subcollection
        const addressesRef = collection(db, 'users', user.id, 'addresses')
        const snapshot = await getDocs(addressesRef)

        const addressesList: Address[] = []
        snapshot.forEach((doc) => {
          addressesList.push({
            id: doc.id,
            ...doc.data(),
          } as Address)
        })

        setAddresses(addressesList)
      } catch (err) {
        console.error('Failed to fetch addresses:', err)
        setError('Failed to load addresses. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAddresses()
  }, [user?.id]) // Only depend on user.id to prevent infinite loops

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Name is required')
      return false
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required')
      return false
    }
    if (!formData.street.trim()) {
      setError('Street address is required')
      return false
    }
    if (!formData.city.trim()) {
      setError('City is required')
      return false
    }
    if (!formData.state.trim()) {
      setError('State is required')
      return false
    }
    if (!formData.postalCode.trim()) {
      setError('Postal code is required')
      return false
    }
    return true
  }

  const handleAddAddress = async () => {
    setError('')
    setSuccessMessage('')

    if (!validateForm() || !user) {
      return
    }

    setIsSaving(true)
    try {
      // If setting as default, unset other defaults
      if (formData.isDefault) {
        for (const addr of addresses) {
          if (addr.isDefault) {
            const addrRef = doc(db, 'users', user.id, 'addresses', addr.id)
            await updateDoc(addrRef, { isDefault: false })
          }
        }
      }

      // Generate new address ID
      const addressId = Date.now().toString()
      const addressRef = doc(db, 'users', user.id, 'addresses', addressId)

      const newAddress = {
        ...formData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      await setDoc(addressRef, newAddress)

      setAddresses([...addresses, { id: addressId, ...newAddress } as Address])
      setFormData({
        name: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        isDefault: false,
      })
      setShowForm(false)
      setSuccessMessage('✓ Address added successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Error adding address:', err)
      setError('Failed to add address. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateAddress = async () => {
    setError('')
    setSuccessMessage('')

    if (!validateForm() || !user || !editingId) {
      return
    }

    setIsSaving(true)
    try {
      // If setting as default, unset other defaults
      if (formData.isDefault) {
        for (const addr of addresses) {
          if (addr.isDefault && addr.id !== editingId) {
            const addrRef = doc(db, 'users', user.id, 'addresses', addr.id)
            await updateDoc(addrRef, { isDefault: false })
          }
        }
      }

      const addressRef = doc(db, 'users', user.id, 'addresses', editingId)
      const updateData = {
        ...formData,
        updatedAt: Timestamp.now(),
      }

      await updateDoc(addressRef, updateData)

      setAddresses(
        addresses.map((a) =>
          a.id === editingId ? { id: editingId, ...updateData } : a
        ) as Address[]
      )

      setEditingId(null)
      setFormData({
        name: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        isDefault: false,
      })
      setShowForm(false)
      setSuccessMessage('✓ Address updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Error updating address:', err)
      setError('Failed to update address. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    if (!user) return

    try {
      const addressRef = doc(db, 'users', user.id, 'addresses', id)
      await deleteDoc(addressRef)
      setAddresses(addresses.filter((a) => a.id !== id))
      setSuccessMessage('✓ Address deleted successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Error deleting address:', err)
      setError('Failed to delete address. Please try again.')
    }
  }

  const handleEditAddress = (address: Address) => {
    setEditingId(address.id)
    setFormData({
      name: address.name,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 pt-20 pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading addresses...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 pt-20 pb-10">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/profile" className="text-purple-600 hover:text-purple-700 font-semibold transition-colors">
            ← Back to Profile
          </Link>
          <h1 className="text-2xl font-black text-gray-900">My Addresses</h1>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg text-green-700 flex items-start gap-3">
            <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900">My Delivery Addresses</h2>
            <p className="text-gray-600 mt-2">{addresses.length} address{addresses.length !== 1 ? 'es' : ''} saved</p>
          </div>
          {!showForm && (
            <button
              onClick={() => {
                setEditingId(null)
                setFormData({
                  name: '',
                  phone: '',
                  street: '',
                  city: '',
                  state: '',
                  postalCode: '',
                  isDefault: false,
                })
                setError('')
                setShowForm(true)
              }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <Plus size={20} />
              Add New Address
            </button>
          )}
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-8">
            <h3 className="text-2xl font-black text-gray-900 mb-6">
              {editingId ? '✏️ Edit Address' : '➕ Add New Address'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-100 font-medium"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-100 font-medium"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-2">Street Address *</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-100 font-medium"
                  placeholder="House no., Street name, Area"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-100 font-medium"
                  placeholder="Mumbai"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">State *</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-100 font-medium"
                  placeholder="Maharashtra"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Postal Code *</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-100 font-medium"
                  placeholder="400001"
                />
              </div>
            </div>
            <div className="flex items-center mb-8 bg-purple-50 p-4 rounded-lg border border-purple-200">
              <input
                type="checkbox"
                id="isDefault"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleInputChange}
                className="h-5 w-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
              />
              <label htmlFor="isDefault" className="ml-3 text-sm font-semibold text-gray-900 cursor-pointer">
                Set as default delivery address
              </label>
            </div>
            <div className="flex gap-4">
              <button
                onClick={editingId ? handleUpdateAddress : handleAddAddress}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : editingId ? 'Update Address' : 'Add Address'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setError('')
                }}
                className="flex-1 border-2 border-gray-300 text-gray-900 font-bold py-3 px-6 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Addresses Grid */}
        {addresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="bg-white rounded-2xl border-2 border-gray-200 p-6 hover:shadow-lg hover:border-purple-300 transition-all duration-300 relative group"
              >
                {/* Default Badge */}
                {address.isDefault && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
                    <Check size={14} />
                    Default
                  </div>
                )}

                {/* Content */}
                <div className="space-y-4 pr-4">
                  {/* Name */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Name</p>
                      <p className="font-bold text-gray-900 mt-0.5">{address.name}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Phone</p>
                      <p className="font-semibold text-gray-700 mt-0.5">{address.phone}</p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Address</p>
                      <p className="text-gray-700 mt-0.5 text-sm leading-relaxed">{address.street}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => handleEditAddress(address)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(address.id)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-6">
              <MapPin size={40} className="text-purple-600" />
            </div>
            <p className="text-gray-600 font-semibold mb-2 text-lg">No addresses added yet</p>
            <p className="text-gray-500 mb-6">Add your first delivery address to get started with orders</p>
            <button
              onClick={() => {
                setFormData({
                  name: '',
                  phone: '',
                  street: '',
                  city: '',
                  state: '',
                  postalCode: '',
                  isDefault: false,
                })
                setShowForm(true)
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <Plus size={20} />
              Add Your First Address
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
