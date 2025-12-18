'use client'

import { useState, useEffect } from 'react'
import { 
  Save, 
  RefreshCw,
  Store,
  Truck,
  Mail,
  Phone,
  Shield,
  Bell,
  CreditCard,
  Eye,
  EyeOff,
  Settings,
  MapPin,
  Percent,
  AlertTriangle,
  Zap,
  Database,
  Trash2,
  Download
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'

interface StoreSettings {
  storeName: string
  storeDescription: string
  storeTagline: string
  contactEmail: string
  supportPhone: string
  address: string
  city: string
  state: string
  pincode: string
  country: string
  logoUrl: string
  currency: string
  timezone: string
}

interface ShippingSettings {
  defaultShippingCost: number
  freeShippingThreshold: number
  expressShippingCost: number
  processingTime: string
  shippingZones: string[]
  codEnabled: boolean
  codCharges: number
}

interface TaxSettings {
  taxEnabled: boolean
  taxRate: number
  taxName: string
  taxIncluded: boolean
  taxNumber: string
}

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  orderConfirmation: boolean
  shippingUpdates: boolean
  lowStockAlerts: boolean
  newCustomerAlerts: boolean
  dailyReportEmail: boolean
  lowStockThreshold: number
}

interface SecuritySettings {
  maintenanceMode: boolean
  requireEmailVerification: boolean
  maxLoginAttempts: number
  sessionTimeout: number
  twoFactorEnabled: boolean
}

interface PaymentSettings {
  razorpayEnabled: boolean
  razorpayKeyId: string
  codEnabled: boolean
  minOrderValue: number
  maxOrderValue: number
}

const SETTINGS_DOC_ID = 'store_settings'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('store')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showRazorpayKey, setShowRazorpayKey] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    storeName: 'Budget Bucket',
    storeDescription: 'Premium e-commerce platform offering quality products at affordable prices',
    storeTagline: 'Shop Smart, Save More',
    contactEmail: 'sale.raghavinfratech@gmail.com',
    supportPhone: '+91 9217023668',
    address: 'D-191, Shop No 1, West Vinod Nagar',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110092',
    country: 'India',
    logoUrl: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata'
  })

  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>({
    defaultShippingCost: 50,
    freeShippingThreshold: 500,
    expressShippingCost: 100,
    processingTime: '1-2 days',
    shippingZones: ['All India'],
    codEnabled: true,
    codCharges: 40
  })

  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    taxEnabled: true,
    taxRate: 18,
    taxName: 'GST',
    taxIncluded: true,
    taxNumber: ''
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    orderConfirmation: true,
    shippingUpdates: true,
    lowStockAlerts: true,
    newCustomerAlerts: true,
    dailyReportEmail: false,
    lowStockThreshold: 10
  })

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    maintenanceMode: false,
    requireEmailVerification: false,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    twoFactorEnabled: false
  })

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    razorpayEnabled: true,
    razorpayKeyId: '',
    codEnabled: true,
    minOrderValue: 99,
    maxOrderValue: 100000
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID)
      const settingsSnap = await getDoc(settingsRef)
      
      if (settingsSnap.exists()) {
        const data = settingsSnap.data()
        
        if (data.store) setStoreSettings(prev => ({ ...prev, ...data.store }))
        if (data.shipping) setShippingSettings(prev => ({ ...prev, ...data.shipping }))
        if (data.tax) setTaxSettings(prev => ({ ...prev, ...data.tax }))
        if (data.notifications) setNotificationSettings(prev => ({ ...prev, ...data.notifications }))
        if (data.security) setSecuritySettings(prev => ({ ...prev, ...data.security }))
        if (data.payment) setPaymentSettings(prev => ({ ...prev, ...data.payment }))
        
        toast.success('Settings loaded successfully')
      } else {
        // First time - save default settings
        await saveSettings(true)
        toast.success('Default settings initialized')
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async (silent = false) => {
    try {
      setIsSaving(true)
      const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID)
      
      await setDoc(settingsRef, {
        store: storeSettings,
        shipping: shippingSettings,
        tax: taxSettings,
        notifications: notificationSettings,
        security: securitySettings,
        payment: paymentSettings,
        updatedAt: Timestamp.now()
      }, { merge: true })

      setHasUnsavedChanges(false)
      if (!silent) toast.success('Settings saved successfully!')
    } catch (err) {
      console.error('Error saving settings:', err)
      if (!silent) toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = () => {
    setHasUnsavedChanges(true)
  }

  const handleExportSettings = () => {
    const settings = {
      store: storeSettings,
      shipping: shippingSettings,
      tax: taxSettings,
      notifications: notificationSettings,
      security: securitySettings,
      payment: { ...paymentSettings, razorpayKeyId: '***HIDDEN***' },
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `budget-bucket-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.success('Settings exported!')
  }

  const handleClearCache = async () => {
    if (!confirm('This will clear all cached data. Continue?')) return
    
    try {
      // Clear local storage cache
      localStorage.removeItem('cart')
      localStorage.removeItem('wishlist')
      toast.success('Cache cleared successfully!')
    } catch (err) {
      toast.error('Failed to clear cache')
    }
  }

  const tabs = [
    { id: 'store', label: 'Store', icon: Store },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'tax', label: 'Tax', icon: Percent },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'advanced', label: 'Advanced', icon: Zap }
  ]

  const ToggleSwitch = ({ enabled, onChange, label, description }: { 
    enabled: boolean, 
    onChange: (val: boolean) => void, 
    label: string, 
    description?: string 
  }) => (
    <div className="flex items-center justify-between p-4 bg-slate-900/30 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all">
      <div className="flex-1">
        <p className="text-white font-medium">{label}</p>
        {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
      </div>
      <button
        onClick={() => { onChange(!enabled); handleChange(); }}
        className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
          enabled ? 'bg-violet-600' : 'bg-slate-700'
        }`}
      >
        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-all duration-300 ${
          enabled ? 'left-8' : 'left-1'
        }`} />
      </button>
    </div>
  )

  const InputField = ({ 
    label, 
    value, 
    onChange, 
    type = 'text', 
    placeholder, 
    icon: Icon,
    prefix,
    suffix
  }: { 
    label: string
    value: string | number
    onChange: (val: string) => void
    type?: string
    placeholder?: string
    icon?: React.ComponentType<{ className?: string }>
    prefix?: string
    suffix?: string
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        )}
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => { onChange(e.target.value); handleChange(); }}
          placeholder={placeholder}
          className={`w-full py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all ${
            Icon ? 'pl-12 pr-4' : prefix ? 'pl-10 pr-4' : suffix ? 'pl-4 pr-12' : 'px-4'
          }`}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{suffix}</span>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
              <Settings className="w-7 h-7" />
            </div>
            Store Settings
          </h1>
          <p className="text-slate-400 mt-2">Configure your store preferences and integrations</p>
        </div>
        <div className="flex gap-3">
          {hasUnsavedChanges && (
            <span className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl text-sm border border-amber-500/30">
              <AlertTriangle className="w-4 h-4" />
              Unsaved changes
            </span>
          )}
          <button
            onClick={fetchSettings}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Reload
          </button>
          <button
            onClick={() => saveSettings()}
            disabled={isSaving || !hasUnsavedChanges}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-3 sticky top-6">
            <div className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-slate-400">Loading settings...</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              {/* Store Settings */}
              {activeTab === 'store' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-violet-500/20 rounded-xl">
                      <Store className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Store Information</h2>
                      <p className="text-sm text-slate-400">Basic details about your store</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                      label="Store Name"
                      value={storeSettings.storeName}
                      onChange={(val) => setStoreSettings(prev => ({ ...prev, storeName: val }))}
                      icon={Store}
                      placeholder="Your store name"
                    />
                    <InputField
                      label="Tagline"
                      value={storeSettings.storeTagline}
                      onChange={(val) => setStoreSettings(prev => ({ ...prev, storeTagline: val }))}
                      placeholder="Shop Smart, Save More"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Store Description</label>
                    <textarea
                      value={storeSettings.storeDescription}
                      onChange={(e) => { setStoreSettings(prev => ({ ...prev, storeDescription: e.target.value })); handleChange(); }}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all resize-none"
                      placeholder="Describe your store..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                      label="Contact Email"
                      value={storeSettings.contactEmail}
                      onChange={(val) => setStoreSettings(prev => ({ ...prev, contactEmail: val }))}
                      icon={Mail}
                      type="email"
                      placeholder="support@example.com"
                    />
                    <InputField
                      label="Support Phone"
                      value={storeSettings.supportPhone}
                      onChange={(val) => setStoreSettings(prev => ({ ...prev, supportPhone: val }))}
                      icon={Phone}
                      placeholder="+91 1234567890"
                    />
                  </div>

                  <div className="border-t border-slate-700/50 pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-violet-400" />
                      Store Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <InputField
                          label="Street Address"
                          value={storeSettings.address}
                          onChange={(val) => setStoreSettings(prev => ({ ...prev, address: val }))}
                          placeholder="123 Commerce Street"
                        />
                      </div>
                      <InputField
                        label="City"
                        value={storeSettings.city}
                        onChange={(val) => setStoreSettings(prev => ({ ...prev, city: val }))}
                        placeholder="Mumbai"
                      />
                      <InputField
                        label="State"
                        value={storeSettings.state}
                        onChange={(val) => setStoreSettings(prev => ({ ...prev, state: val }))}
                        placeholder="Maharashtra"
                      />
                      <InputField
                        label="Pincode"
                        value={storeSettings.pincode}
                        onChange={(val) => setStoreSettings(prev => ({ ...prev, pincode: val }))}
                        placeholder="400001"
                      />
                      <InputField
                        label="Country"
                        value={storeSettings.country}
                        onChange={(val) => setStoreSettings(prev => ({ ...prev, country: val }))}
                        placeholder="India"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6 border-t border-slate-700/50">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Currency</label>
                      <select
                        value={storeSettings.currency}
                        onChange={(e) => { setStoreSettings(prev => ({ ...prev, currency: e.target.value })); handleChange(); }}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                      >
                        <option value="INR">₹ INR - Indian Rupee</option>
                        <option value="USD">$ USD - US Dollar</option>
                        <option value="EUR">€ EUR - Euro</option>
                        <option value="GBP">£ GBP - British Pound</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Timezone</label>
                      <select
                        value={storeSettings.timezone}
                        onChange={(e) => { setStoreSettings(prev => ({ ...prev, timezone: e.target.value })); handleChange(); }}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Settings */}
              {activeTab === 'shipping' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                      <Truck className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Shipping Configuration</h2>
                      <p className="text-sm text-slate-400">Manage shipping rates and options</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                      label="Default Shipping Cost"
                      value={shippingSettings.defaultShippingCost}
                      onChange={(val) => setShippingSettings(prev => ({ ...prev, defaultShippingCost: Number(val) || 0 }))}
                      type="number"
                      prefix="₹"
                    />
                    <InputField
                      label="Free Shipping Above"
                      value={shippingSettings.freeShippingThreshold}
                      onChange={(val) => setShippingSettings(prev => ({ ...prev, freeShippingThreshold: Number(val) || 0 }))}
                      type="number"
                      prefix="₹"
                    />
                    <InputField
                      label="Express Shipping Cost"
                      value={shippingSettings.expressShippingCost}
                      onChange={(val) => setShippingSettings(prev => ({ ...prev, expressShippingCost: Number(val) || 0 }))}
                      type="number"
                      prefix="₹"
                    />
                    <InputField
                      label="Processing Time"
                      value={shippingSettings.processingTime}
                      onChange={(val) => setShippingSettings(prev => ({ ...prev, processingTime: val }))}
                      placeholder="1-2 days"
                    />
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-700/50">
                    <h3 className="text-lg font-semibold text-white">Cash on Delivery</h3>
                    <ToggleSwitch
                      enabled={shippingSettings.codEnabled}
                      onChange={(val) => setShippingSettings(prev => ({ ...prev, codEnabled: val }))}
                      label="Enable COD"
                      description="Allow customers to pay on delivery"
                    />
                    {shippingSettings.codEnabled && (
                      <div className="ml-4">
                        <InputField
                          label="COD Charges"
                          value={shippingSettings.codCharges}
                          onChange={(val) => setShippingSettings(prev => ({ ...prev, codCharges: Number(val) || 0 }))}
                          type="number"
                          prefix="₹"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tax Settings */}
              {activeTab === 'tax' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-500/20 rounded-xl">
                      <Percent className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Tax Settings</h2>
                      <p className="text-sm text-slate-400">Configure tax rates and rules</p>
                    </div>
                  </div>

                  <ToggleSwitch
                    enabled={taxSettings.taxEnabled}
                    onChange={(val) => setTaxSettings(prev => ({ ...prev, taxEnabled: val }))}
                    label="Enable Tax"
                    description="Apply tax to product prices"
                  />

                  {taxSettings.taxEnabled && (
                    <div className="space-y-5 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField
                          label="Tax Name"
                          value={taxSettings.taxName}
                          onChange={(val) => setTaxSettings(prev => ({ ...prev, taxName: val }))}
                          placeholder="GST"
                        />
                        <InputField
                          label="Tax Rate"
                          value={taxSettings.taxRate}
                          onChange={(val) => setTaxSettings(prev => ({ ...prev, taxRate: Number(val) || 0 }))}
                          type="number"
                          suffix="%"
                        />
                      </div>

                      <InputField
                        label="Tax Registration Number"
                        value={taxSettings.taxNumber}
                        onChange={(val) => setTaxSettings(prev => ({ ...prev, taxNumber: val }))}
                        placeholder="GSTIN / Tax ID"
                      />

                      <ToggleSwitch
                        enabled={taxSettings.taxIncluded}
                        onChange={(val) => setTaxSettings(prev => ({ ...prev, taxIncluded: val }))}
                        label="Tax Included in Price"
                        description="Prices already include tax (no additional charge)"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Payment Settings */}
              {activeTab === 'payment' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-500/20 rounded-xl">
                      <CreditCard className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Payment Gateway</h2>
                      <p className="text-sm text-slate-400">Configure payment methods</p>
                    </div>
                  </div>

                  <ToggleSwitch
                    enabled={paymentSettings.razorpayEnabled}
                    onChange={(val) => setPaymentSettings(prev => ({ ...prev, razorpayEnabled: val }))}
                    label="Razorpay"
                    description="Accept online payments via Razorpay"
                  />

                  {paymentSettings.razorpayEnabled && (
                    <div className="ml-4">
                      <label className="block text-sm font-medium text-slate-300 mb-2">Razorpay Key ID</label>
                      <div className="relative">
                        <input
                          type={showRazorpayKey ? 'text' : 'password'}
                          value={paymentSettings.razorpayKeyId}
                          onChange={(e) => { setPaymentSettings(prev => ({ ...prev, razorpayKeyId: e.target.value })); handleChange(); }}
                          placeholder="rzp_live_xxxxxxxxxx"
                          className="w-full pl-4 pr-12 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                        />
                        <button
                          onClick={() => setShowRazorpayKey(!showRazorpayKey)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showRazorpayKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <ToggleSwitch
                    enabled={paymentSettings.codEnabled}
                    onChange={(val) => setPaymentSettings(prev => ({ ...prev, codEnabled: val }))}
                    label="Cash on Delivery"
                    description="Allow customers to pay when order is delivered"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6 border-t border-slate-700/50">
                    <InputField
                      label="Minimum Order Value"
                      value={paymentSettings.minOrderValue}
                      onChange={(val) => setPaymentSettings(prev => ({ ...prev, minOrderValue: Number(val) || 0 }))}
                      type="number"
                      prefix="₹"
                    />
                    <InputField
                      label="Maximum Order Value"
                      value={paymentSettings.maxOrderValue}
                      onChange={(val) => setPaymentSettings(prev => ({ ...prev, maxOrderValue: Number(val) || 0 }))}
                      type="number"
                      prefix="₹"
                    />
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-rose-500/20 rounded-xl">
                      <Bell className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Notification Preferences</h2>
                      <p className="text-sm text-slate-400">Manage alerts and notifications</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <ToggleSwitch
                      enabled={notificationSettings.emailNotifications}
                      onChange={(val) => setNotificationSettings(prev => ({ ...prev, emailNotifications: val }))}
                      label="Email Notifications"
                      description="Receive notifications via email"
                    />
                    <ToggleSwitch
                      enabled={notificationSettings.smsNotifications}
                      onChange={(val) => setNotificationSettings(prev => ({ ...prev, smsNotifications: val }))}
                      label="SMS Notifications"
                      description="Receive notifications via SMS"
                    />
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-700/50">
                    <h3 className="text-lg font-semibold text-white">Alert Types</h3>
                    <ToggleSwitch
                      enabled={notificationSettings.orderConfirmation}
                      onChange={(val) => setNotificationSettings(prev => ({ ...prev, orderConfirmation: val }))}
                      label="Order Confirmations"
                      description="Get notified when new orders are placed"
                    />
                    <ToggleSwitch
                      enabled={notificationSettings.shippingUpdates}
                      onChange={(val) => setNotificationSettings(prev => ({ ...prev, shippingUpdates: val }))}
                      label="Shipping Updates"
                      description="Get notified about shipping status changes"
                    />
                    <ToggleSwitch
                      enabled={notificationSettings.lowStockAlerts}
                      onChange={(val) => setNotificationSettings(prev => ({ ...prev, lowStockAlerts: val }))}
                      label="Low Stock Alerts"
                      description="Get notified when products are running low"
                    />
                    {notificationSettings.lowStockAlerts && (
                      <div className="ml-4">
                        <InputField
                          label="Low Stock Threshold"
                          value={notificationSettings.lowStockThreshold}
                          onChange={(val) => setNotificationSettings(prev => ({ ...prev, lowStockThreshold: Number(val) || 10 }))}
                          type="number"
                          suffix="units"
                        />
                      </div>
                    )}
                    <ToggleSwitch
                      enabled={notificationSettings.newCustomerAlerts}
                      onChange={(val) => setNotificationSettings(prev => ({ ...prev, newCustomerAlerts: val }))}
                      label="New Customer Alerts"
                      description="Get notified when new customers register"
                    />
                    <ToggleSwitch
                      enabled={notificationSettings.dailyReportEmail}
                      onChange={(val) => setNotificationSettings(prev => ({ ...prev, dailyReportEmail: val }))}
                      label="Daily Report Email"
                      description="Receive daily summary of store activity"
                    />
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-red-500/20 rounded-xl">
                      <Shield className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Security Settings</h2>
                      <p className="text-sm text-slate-400">Protect your store and customers</p>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <ToggleSwitch
                      enabled={securitySettings.maintenanceMode}
                      onChange={(val) => setSecuritySettings(prev => ({ ...prev, maintenanceMode: val }))}
                      label="Maintenance Mode"
                      description="Temporarily disable storefront for customers"
                    />
                  </div>

                  <div className="space-y-4">
                    <ToggleSwitch
                      enabled={securitySettings.requireEmailVerification}
                      onChange={(val) => setSecuritySettings(prev => ({ ...prev, requireEmailVerification: val }))}
                      label="Require Email Verification"
                      description="New users must verify email before checkout"
                    />
                    <ToggleSwitch
                      enabled={securitySettings.twoFactorEnabled}
                      onChange={(val) => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: val }))}
                      label="Two-Factor Authentication"
                      description="Require 2FA for admin accounts"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6 border-t border-slate-700/50">
                    <InputField
                      label="Max Login Attempts"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(val) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: Number(val) || 5 }))}
                      type="number"
                      suffix="attempts"
                    />
                    <InputField
                      label="Session Timeout"
                      value={securitySettings.sessionTimeout}
                      onChange={(val) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: Number(val) || 30 }))}
                      type="number"
                      suffix="minutes"
                    />
                  </div>
                </div>
              )}

              {/* Advanced Settings */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-cyan-500/20 rounded-xl">
                      <Zap className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Advanced Settings</h2>
                      <p className="text-sm text-slate-400">Developer tools and data management</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Export Settings */}
                    <button
                      onClick={handleExportSettings}
                      className="flex items-center gap-4 p-5 bg-slate-900/30 rounded-xl border border-slate-700/30 hover:border-violet-500/50 transition-all group text-left"
                    >
                      <div className="p-3 bg-violet-500/20 rounded-xl group-hover:bg-violet-500/30 transition-colors">
                        <Download className="w-6 h-6 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Export Settings</p>
                        <p className="text-sm text-slate-400">Download settings as JSON file</p>
                      </div>
                    </button>

                    {/* Clear Cache */}
                    <button
                      onClick={handleClearCache}
                      className="flex items-center gap-4 p-5 bg-slate-900/30 rounded-xl border border-slate-700/30 hover:border-amber-500/50 transition-all group text-left"
                    >
                      <div className="p-3 bg-amber-500/20 rounded-xl group-hover:bg-amber-500/30 transition-colors">
                        <Database className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Clear Cache</p>
                        <p className="text-sm text-slate-400">Clear local storage and cache</p>
                      </div>
                    </button>
                  </div>

                  <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-red-500/20 rounded-xl">
                        <Trash2 className="w-6 h-6 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">Danger Zone</p>
                        <p className="text-sm text-slate-400 mt-1">These actions are irreversible. Be careful!</p>
                        <div className="flex gap-3 mt-4">
                          <button className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium">
                            Reset Settings
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-900/30 rounded-xl border border-slate-700/30">
                    <h3 className="text-lg font-semibold text-white mb-4">System Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Platform</p>
                        <p className="text-white font-medium">Next.js 16</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Database</p>
                        <p className="text-white font-medium">Firebase Firestore</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Image Storage</p>
                        <p className="text-white font-medium">Cloudinary</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Last Updated</p>
                        <p className="text-white font-medium">{new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
