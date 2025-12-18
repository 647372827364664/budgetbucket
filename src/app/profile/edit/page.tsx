'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/store/authStore'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Camera,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { db, storage } from '@/lib/firebase'
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { toast } from 'react-hot-toast'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  profileImage: string
  createdAt?: any
}

export default function EditProfilePage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    profileImage: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/profile/edit')
      return
    }
    fetchProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // Only depend on user.id to prevent infinite loops

  const fetchProfile = async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      const userRef = doc(db, 'users', user.id)
      const userDoc = await getDoc(userRef)

      let profileData: UserProfile = {
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        profileImage: user.profileImage || ''
      }

      if (userDoc.exists()) {
        const data = userDoc.data()
        profileData = {
          id: user.id,
          name: data.name || user.name || '',
          email: data.email || user.email || '',
          phone: data.phone || user.phone || '',
          profileImage: data.profileImage || user.profileImage || '',
          createdAt: data.createdAt
        }
      }

      setProfile(profileData)
      setOriginalProfile(profileData)
    } catch (err) {
      console.error('Error fetching profile:', err)
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    try {
      setIsUploadingImage(true)
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, `profile-images/${user.id}/${Date.now()}-${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      setProfile(prev => ({ ...prev, profileImage: downloadURL }))
      setHasChanges(true)
      toast.success('Image uploaded successfully!')
    } catch (err) {
      console.error('Error uploading image:', err)
      toast.error('Failed to upload image')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSave = async () => {
    if (!user?.id) return

    // Validate
    if (!profile.name.trim()) {
      toast.error('Name is required')
      return
    }

    try {
      setIsSaving(true)

      const userRef = doc(db, 'users', user.id)
      await updateDoc(userRef, {
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        profileImage: profile.profileImage,
        updatedAt: Timestamp.now()
      })

      // Update auth store
      setUser({
        ...user,
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        profileImage: profile.profileImage
      })

      setOriginalProfile(profile)
      setHasChanges(false)
      toast.success('Profile updated successfully!')
      
      // Redirect to profile
      setTimeout(() => {
        router.push('/profile')
      }, 1000)
    } catch (err) {
      console.error('Error saving profile:', err)
      toast.error('Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (originalProfile) {
      setProfile(originalProfile)
      setHasChanges(false)
    }
  }

  if (!user) return null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
            <User className="absolute inset-0 m-auto w-8 h-8 text-purple-600" />
          </div>
          <p className="text-slate-600 font-medium text-lg">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20">
        <div className="container-custom py-5">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Profile
              </Link>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent mt-3">
                Edit Profile
              </h1>
            </div>
            {hasChanges && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  disabled={isSaving}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
                >
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25 font-semibold disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="max-w-2xl mx-auto">
          {/* Profile Photo Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8 mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Camera className="w-5 h-5 text-purple-600" />
              Profile Photo
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Current Photo */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-200 shadow-xl">
                  {profile.profileImage ? (
                    <Image
                      src={profile.profileImage}
                      alt={profile.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-5xl font-bold text-white">
                        {profile.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1 text-center sm:text-left">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-all font-semibold disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                  {isUploadingImage ? 'Uploading...' : 'Upload New Photo'}
                </button>
                <p className="text-slate-500 text-sm mt-3">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Personal Info Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Personal Information
            </h2>

            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all placeholder:text-slate-400"
                  />
                </div>
                <p className="text-slate-500 text-sm mt-2">
                  This is the phone number linked to your account
                </p>
              </div>
            </div>

            {/* Save Button (Mobile) */}
            <div className="mt-8 pt-6 border-t border-slate-100 sm:hidden">
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25 font-semibold disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {hasChanges ? 'Save Changes' : 'No Changes'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tips Card */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Profile Tips</h3>
                <ul className="text-slate-600 text-sm space-y-1">
                  <li>• Keep your contact information up to date for order updates</li>
                  <li>• A profile photo helps personalize your account</li>
                  <li>• Your email is used for order confirmations and receipts</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="mt-6 bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Account Information</h3>
                <p className="text-slate-600 text-sm">
                  Account ID: <span className="font-mono text-slate-500">{profile.id.slice(0, 12)}...</span>
                </p>
                {profile.createdAt && (
                  <p className="text-slate-600 text-sm mt-1">
                    Member since: {new Date(profile.createdAt?.toMillis?.() || profile.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
