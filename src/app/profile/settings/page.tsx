'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import {
  ArrowLeft,
  Bell,
  Shield,
  Lock,
  Smartphone,
  Mail,
  Globe,
  Trash2,
  AlertTriangle,
  Check,
  Settings,
  User,
  Loader2,
  Save,
  RotateCcw,
  Phone,
  MapPin,
  CreditCard,
  HelpCircle,
  FileText,
  ChevronDown
} from 'lucide-react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth'
import { toast } from 'react-hot-toast'

interface NotificationSettings {
  orderUpdates: boolean
  shippingAlerts: boolean
  promotions: boolean
  newsletter: boolean
  smsNotifications: boolean
  emailNotifications: boolean
  pushNotifications: boolean
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends'
  showOrderHistory: boolean
  showWishlist: boolean
  allowDataCollection: boolean
  showActivityStatus: boolean
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  loginAlerts: boolean
  trustedDevices: string[]
}

interface PreferenceSettings {
  language: string
  currency: string
  timezone: string
  dateFormat: string
}

interface UserSettings {
  notifications: NotificationSettings
  privacy: PrivacySettings
  security: SecuritySettings
  preferences: PreferenceSettings
}

const defaultSettings: UserSettings = {
  notifications: {
    orderUpdates: true,
    shippingAlerts: true,
    promotions: false,
    newsletter: false,
    smsNotifications: true,
    emailNotifications: true,
    pushNotifications: true
  },
  privacy: {
    profileVisibility: 'private',
    showOrderHistory: false,
    showWishlist: false,
    allowDataCollection: true,
    showActivityStatus: false
  },
  security: {
    twoFactorEnabled: false,
    loginAlerts: true,
    trustedDevices: []
  },
  preferences: {
    language: 'en',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY'
  }
}

type SettingsTab = 'notifications' | 'privacy' | 'security' | 'preferences' | 'account'

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications')
  
  // Phone change states
  const [showPhoneChange, setShowPhoneChange] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  
  // Delete account states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        const userDocRef = doc(db, 'users', user.id)
        const userDocSnap = await getDoc(userDocRef)

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data()
          if (userData.settings) {
            setSettings({
              notifications: { ...defaultSettings.notifications, ...userData.settings?.notifications },
              privacy: { ...defaultSettings.privacy, ...userData.settings?.privacy },
              security: { ...defaultSettings.security, ...userData.settings?.security },
              preferences: { ...defaultSettings.preferences, ...userData.settings?.preferences }
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [user?.id]) // Only depend on user.id to prevent infinite loops

  const updateNotification = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }))
    setHasChanges(true)
  }

  const updatePrivacy = (key: keyof PrivacySettings, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: value }
    }))
    setHasChanges(true)
  }

  const updateSecurity = (key: keyof SecuritySettings, value: boolean | string[]) => {
    setSettings(prev => ({
      ...prev,
      security: { ...prev.security, [key]: value }
    }))
    setHasChanges(true)
  }

  const updatePreference = (key: keyof PreferenceSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value }
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const userDocRef = doc(db, 'users', user.id)
      await updateDoc(userDocRef, {
        settings: settings,
        updatedAt: new Date()
      })
      toast.success('Settings saved successfully')
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(defaultSettings)
    setHasChanges(true)
    toast.success('Settings reset to defaults')
  }

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {}
      })
    }
  }

  const handleSendOTP = async () => {
    if (!newPhone || newPhone.length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }

    try {
      setIsVerifying(true)
      setupRecaptcha()
      const appVerifier = (window as any).recaptchaVerifier
      const formattedPhone = newPhone.startsWith('+') ? newPhone : `+91${newPhone}`
      
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier)
      setConfirmationResult(result)
      setOtpSent(true)
      toast.success('OTP sent to your phone')
    } catch (error: any) {
      console.error('OTP error:', error)
      toast.error(error.message || 'Failed to send OTP')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    if (!confirmationResult) {
      toast.error('Please request OTP first')
      return
    }

    try {
      setIsVerifying(true)
      await confirmationResult.confirm(otp)
      
      if (user) {
        const userDocRef = doc(db, 'users', user.id)
        await updateDoc(userDocRef, {
          phone: newPhone.startsWith('+') ? newPhone : `+91${newPhone}`,
          updatedAt: new Date()
        })
      }
      
      toast.success('Phone number updated successfully')
      setShowPhoneChange(false)
      setNewPhone('')
      setOtp('')
      setOtpSent(false)
    } catch (error: any) {
      console.error('Verification error:', error)
      toast.error('Invalid OTP. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    toast.error('Account deletion is disabled for this demo')
    setShowDeleteModal(false)
    setDeleteConfirmText('')
  }

  if (!user) return null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield },
    { id: 'security' as const, label: 'Security', icon: Lock },
    { id: 'preferences' as const, label: 'Preferences', icon: Settings },
    { id: 'account' as const, label: 'Account', icon: User }
  ]

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        enabled ? 'bg-purple-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div id="recaptcha-container"></div>
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">Back</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
            </div>

            <div className="flex items-center gap-3">
              {hasChanges && (
                <>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600'
                        : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Quick Links */}
            <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { label: 'Edit Profile', href: '/profile/edit', icon: User },
                  { label: 'Addresses', href: '/profile/addresses', icon: MapPin },
                  { label: 'Payment Methods', href: '/profile/payments', icon: CreditCard },
                  { label: 'Help Center', href: '/help', icon: HelpCircle },
                  { label: 'Terms of Service', href: '/terms', icon: FileText }
                ].map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{link.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
                    <p className="text-sm text-gray-500 mt-1">Choose how you want to be notified</p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Order & Shipping */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Orders & Shipping</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Order Updates</p>
                            <p className="text-sm text-gray-500">Get notified when your order status changes</p>
                          </div>
                          <Toggle
                            enabled={settings.notifications.orderUpdates}
                            onChange={() => updateNotification('orderUpdates', !settings.notifications.orderUpdates)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Shipping Alerts</p>
                            <p className="text-sm text-gray-500">Receive tracking updates for your shipments</p>
                          </div>
                          <Toggle
                            enabled={settings.notifications.shippingAlerts}
                            onChange={() => updateNotification('shippingAlerts', !settings.notifications.shippingAlerts)}
                          />
                        </div>
                      </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Marketing */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Marketing</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Promotions & Offers</p>
                            <p className="text-sm text-gray-500">Receive special deals and discount codes</p>
                          </div>
                          <Toggle
                            enabled={settings.notifications.promotions}
                            onChange={() => updateNotification('promotions', !settings.notifications.promotions)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Newsletter</p>
                            <p className="text-sm text-gray-500">Weekly updates about new products and trends</p>
                          </div>
                          <Toggle
                            enabled={settings.notifications.newsletter}
                            onChange={() => updateNotification('newsletter', !settings.notifications.newsletter)}
                          />
                        </div>
                      </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Channels */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Notification Channels</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Mail className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Email Notifications</p>
                              <p className="text-sm text-gray-500">{user.email || 'No email set'}</p>
                            </div>
                          </div>
                          <Toggle
                            enabled={settings.notifications.emailNotifications}
                            onChange={() => updateNotification('emailNotifications', !settings.notifications.emailNotifications)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Smartphone className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">SMS Notifications</p>
                              <p className="text-sm text-gray-500">{user.phone || 'No phone set'}</p>
                            </div>
                          </div>
                          <Toggle
                            enabled={settings.notifications.smsNotifications}
                            onChange={() => updateNotification('smsNotifications', !settings.notifications.smsNotifications)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Bell className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Push Notifications</p>
                              <p className="text-sm text-gray-500">Browser and mobile app notifications</p>
                            </div>
                          </div>
                          <Toggle
                            enabled={settings.notifications.pushNotifications}
                            onChange={() => updateNotification('pushNotifications', !settings.notifications.pushNotifications)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div>
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Privacy Settings</h2>
                    <p className="text-sm text-gray-500 mt-1">Control your privacy and data sharing preferences</p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Profile Visibility */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Profile Visibility</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { value: 'public', label: 'Public', desc: 'Anyone can view' },
                          { value: 'friends', label: 'Friends Only', desc: 'Only connections' },
                          { value: 'private', label: 'Private', desc: 'Only you' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => updatePrivacy('profileVisibility', option.value as 'public' | 'private' | 'friends')}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${
                              settings.privacy.profileVisibility === option.value
                                ? 'border-purple-600 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <p className={`font-semibold ${
                              settings.privacy.profileVisibility === option.value ? 'text-purple-700' : 'text-gray-900'
                            }`}>{option.label}</p>
                            <p className="text-sm text-gray-500">{option.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Data Sharing */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Data Sharing</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Show Order History</p>
                            <p className="text-sm text-gray-500">Allow others to see your purchase history</p>
                          </div>
                          <Toggle
                            enabled={settings.privacy.showOrderHistory}
                            onChange={() => updatePrivacy('showOrderHistory', !settings.privacy.showOrderHistory)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Show Wishlist</p>
                            <p className="text-sm text-gray-500">Allow others to see your wishlist items</p>
                          </div>
                          <Toggle
                            enabled={settings.privacy.showWishlist}
                            onChange={() => updatePrivacy('showWishlist', !settings.privacy.showWishlist)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Activity Status</p>
                            <p className="text-sm text-gray-500">Show when you're active on the platform</p>
                          </div>
                          <Toggle
                            enabled={settings.privacy.showActivityStatus}
                            onChange={() => updatePrivacy('showActivityStatus', !settings.privacy.showActivityStatus)}
                          />
                        </div>
                      </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Analytics */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Analytics & Personalization</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Allow Data Collection</p>
                          <p className="text-sm text-gray-500">Help us improve by sharing anonymous usage data</p>
                        </div>
                        <Toggle
                          enabled={settings.privacy.allowDataCollection}
                          onChange={() => updatePrivacy('allowDataCollection', !settings.privacy.allowDataCollection)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your account security and authentication</p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Phone Number */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Phone Authentication</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                              <Phone className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Phone Number</p>
                              <p className="text-sm text-gray-500">{user.phone || 'Not set'}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowPhoneChange(!showPhoneChange)}
                            className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-medium transition-colors"
                          >
                            Change
                          </button>
                        </div>

                        {showPhoneChange && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            {!otpSent ? (
                              <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">New Phone Number</label>
                                <div className="flex gap-3">
                                  <div className="flex items-center gap-2 px-3 bg-gray-100 rounded-lg border border-gray-300">
                                    <span className="text-gray-600">+91</span>
                                  </div>
                                  <input
                                    type="tel"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="Enter 10-digit number"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  />
                                </div>
                                <button
                                  onClick={handleSendOTP}
                                  disabled={isVerifying || newPhone.length < 10}
                                  className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {isVerifying ? (
                                    <span className="flex items-center justify-center gap-2">
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Sending OTP...
                                    </span>
                                  ) : (
                                    'Send OTP'
                                  )}
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
                                <input
                                  type="text"
                                  value={otp}
                                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                  placeholder="Enter 6-digit OTP"
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center text-lg tracking-widest"
                                  maxLength={6}
                                />
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => {
                                      setOtpSent(false)
                                      setOtp('')
                                    }}
                                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                  >
                                    Back
                                  </button>
                                  <button
                                    onClick={handleVerifyOTP}
                                    disabled={isVerifying || otp.length < 6}
                                    className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {isVerifying ? (
                                      <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Verifying...
                                      </span>
                                    ) : (
                                      'Verify & Update'
                                    )}
                                  </button>
                                </div>
                                <button
                                  onClick={handleSendOTP}
                                  disabled={isVerifying}
                                  className="w-full text-sm text-purple-600 hover:text-purple-700"
                                >
                                  Resend OTP
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Two Factor */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Additional Security</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                            <p className="text-sm text-gray-500">Add extra security with 2FA</p>
                          </div>
                          <Toggle
                            enabled={settings.security.twoFactorEnabled}
                            onChange={() => updateSecurity('twoFactorEnabled', !settings.security.twoFactorEnabled)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Login Alerts</p>
                            <p className="text-sm text-gray-500">Get notified of new login attempts</p>
                          </div>
                          <Toggle
                            enabled={settings.security.loginAlerts}
                            onChange={() => updateSecurity('loginAlerts', !settings.security.loginAlerts)}
                          />
                        </div>
                      </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Sessions */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Active Sessions</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Check className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Current Session</p>
                              <p className="text-sm text-gray-500">This device • Active now</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div>
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
                    <p className="text-sm text-gray-500 mt-1">Customize your experience</p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Language */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Language</label>
                      <select
                        value={settings.preferences.language}
                        onChange={(e) => updatePreference('language', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                      >
                        <option value="en">English</option>
                        <option value="hi">हिंदी (Hindi)</option>
                        <option value="ta">தமிழ் (Tamil)</option>
                        <option value="te">తెలుగు (Telugu)</option>
                        <option value="bn">বাংলা (Bengali)</option>
                        <option value="mr">मराठी (Marathi)</option>
                        <option value="gu">ગુજરાતી (Gujarati)</option>
                        <option value="kn">ಕನ್ನಡ (Kannada)</option>
                      </select>
                    </div>

                    {/* Currency */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Currency</label>
                      <select
                        value={settings.preferences.currency}
                        onChange={(e) => updatePreference('currency', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                      >
                        <option value="INR">₹ Indian Rupee (INR)</option>
                        <option value="USD">$ US Dollar (USD)</option>
                        <option value="EUR">€ Euro (EUR)</option>
                        <option value="GBP">£ British Pound (GBP)</option>
                        <option value="AED">د.إ UAE Dirham (AED)</option>
                      </select>
                    </div>

                    {/* Timezone */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Timezone</label>
                      <select
                        value={settings.preferences.timezone}
                        onChange={(e) => updatePreference('timezone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                      >
                        <option value="Asia/Kolkata">India Standard Time (IST)</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                        <option value="Asia/Dubai">Gulf Standard Time (GST)</option>
                        <option value="Asia/Singapore">Singapore Time (SGT)</option>
                      </select>
                    </div>

                    {/* Date Format */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Date Format</label>
                      <select
                        value={settings.preferences.dateFormat}
                        onChange={(e) => updatePreference('dateFormat', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div>
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Account Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your account data and settings</p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Account Info */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Account Information</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">User ID</span>
                          <span className="font-mono text-sm text-gray-900">{user.id.slice(0, 12)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name</span>
                          <span className="text-gray-900">{user.name || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email</span>
                          <span className="text-gray-900">{user.email || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone</span>
                          <span className="text-gray-900">{user.phone || 'Not set'}</span>
                        </div>
                      </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Data Export */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Data Export</h3>
                      <p className="text-sm text-gray-500 mb-4">Download a copy of your data including orders, profile, and preferences.</p>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                        Request Data Export
                      </button>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Danger Zone */}
                    <div>
                      <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-4">Danger Zone</h3>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-red-900">Delete Account</p>
                            <p className="text-sm text-red-700 mt-1">
                              Once you delete your account, all your data will be permanently removed. This action cannot be undone.
                            </p>
                            <button
                              onClick={() => setShowDeleteModal(true)}
                              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                            >
                              Delete My Account
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
                <p className="text-sm text-gray-500">This action is irreversible</p>
              </div>
            </div>

            <p className="text-gray-600 mb-4">
              You are about to permanently delete your account. All your orders, wishlist, addresses, and personal data will be removed.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
