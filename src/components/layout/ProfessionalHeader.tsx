'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useUIStore } from '@/store/uiStore'
import {
  Menu,
  X,
  ShoppingCart,
  Heart,
  Search,
  User,
  Zap,
  Gift,
  LogOut,
  ChevronDown,
  Home,
  Grid3X3,
  TrendingUp,
  HelpCircle,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function ProfessionalHeader() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const itemCount = useCartStore((state) => state.itemCount)
  const { isMobileMenuOpen, toggleMobileMenu, closeAll } = useUIStore()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchRef = useRef<HTMLFormElement>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput)}`)
      setSearchInput('')
      closeAll()
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      {/* Promotional Bar */}
      <div className="hidden sm:block bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white text-sm py-2.5 animate-gradient">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2 font-semibold">
            <Zap className="w-5 h-5 animate-bounce-soft" />
            <span>Limited Time: 50% OFF on Select Items!</span>
          </div>
          <div className="hidden lg:flex gap-6 text-xs font-medium">
            <Link href="/track-order" className="hover:opacity-80 transition-opacity flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Track Order
            </Link>
            <div className="w-px bg-white/30" />
            <Link href="/help" className="hover:opacity-80 transition-opacity flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              Help Center
            </Link>
            <div className="w-px bg-white/30" />
            <Link href="/loyalty" className="hover:opacity-80 transition-opacity flex items-center gap-1.5">
              <Gift className="w-4 h-4" />
              Loyalty Program
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow transform group-hover:scale-105">
              <span className="text-white font-black text-lg md:text-xl">BB</span>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-300 to-yellow-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-black text-lg md:text-xl text-gray-900">Budget</span>
              <span className="text-xs font-bold text-purple-600">Bucket</span>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md" ref={searchRef}>
            <div
              className={`w-full relative transition-all duration-300 ${
                isSearchFocused ? 'ring-2 ring-purple-600' : ''
              }`}
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search products, brands..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:bg-white transition-all duration-300 text-sm"
              />
            </div>
          </form>

          {/* Action Icons */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search Mobile */}
            <button className="md:hidden p-2.5 hover:bg-purple-50 rounded-lg transition-colors">
              <Search className="w-5 h-5 text-gray-700" />
            </button>

            {/* Wishlist */}
            <Link href="/wishlist" className="relative p-2.5 hover:bg-purple-50 rounded-lg transition-colors group">
              <Heart className="w-5 h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-red-500 transition-colors" />
              <div className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                2
              </div>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2.5 hover:bg-purple-50 rounded-lg transition-colors group"
            >
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-purple-600 transition-colors" />
              {itemCount > 0 && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full text-xs font-bold flex items-center justify-center animate-pulse-soft">
                  {itemCount}
                </div>
              )}
            </Link>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="p-2.5 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-2 group"
              >
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                  <User className="w-3 h-3 md:w-4 md:h-4 text-white" />
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-700 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-gray-100 rounded-xl shadow-2xl py-2 animate-scaleIn">
                  {user ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-bold text-gray-900">{user.name || 'User'}</p>
                        <p className="text-xs text-gray-500">{user.phone}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-3 hover:bg-purple-50 transition-colors flex items-center gap-3 text-gray-700 font-medium"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="w-5 h-5 text-purple-600" />
                        My Profile
                      </Link>
                      <Link
                        href="/orders"
                        className="block px-4 py-3 hover:bg-purple-50 transition-colors flex items-center gap-3 text-gray-700 font-medium"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        My Orders
                      </Link>
                      <Link
                        href="/loyalty"
                        className="block px-4 py-3 hover:bg-purple-50 transition-colors flex items-center gap-3 text-gray-700 font-medium"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Gift className="w-5 h-5 text-amber-600" />
                        Loyalty Points
                      </Link>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false)
                          // Handle logout
                        }}
                        className="w-full px-4 py-3 hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600 font-medium"
                      >
                        <LogOut className="w-5 h-5" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block px-4 py-3 hover:bg-purple-50 transition-colors font-medium text-gray-700"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        className="block px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg mx-2 text-center transition-all hover:shadow-lg"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2.5 hover:bg-purple-50 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Navigation */}
      <div className="hidden md:block border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8 text-sm font-semibold">
              <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors">
                <Home className="w-4 h-4" />
                Home
              </Link>
              <Link href="/products" className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors">
                <Grid3X3 className="w-4 h-4" />
                Categories
              </Link>
              <Link href="/deals" className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors">
                <Zap className="w-4 h-4" />
                Deals
              </Link>
              <Link href="/brands" className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors">
                <TrendingUp className="w-4 h-4" />
                Brands
              </Link>
            </div>
            <Link href="/signup" className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold text-sm transition-all hover:shadow-lg active:scale-95">
              Join Now
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-slideDown">
          <div className="px-4 py-4 space-y-3">
            <Link href="/" className="block px-4 py-2 hover:bg-purple-50 rounded-lg text-gray-700 font-medium transition-colors">
              Home
            </Link>
            <Link href="/products" className="block px-4 py-2 hover:bg-purple-50 rounded-lg text-gray-700 font-medium transition-colors">
              Categories
            </Link>
            <Link href="/deals" className="block px-4 py-2 hover:bg-purple-50 rounded-lg text-gray-700 font-medium transition-colors">
              Deals
            </Link>
            <Link href="/loyalty" className="block px-4 py-2 hover:bg-purple-50 rounded-lg text-gray-700 font-medium transition-colors">
              Loyalty Program
            </Link>
            <Link href="/help" className="block px-4 py-2 hover:bg-purple-50 rounded-lg text-gray-700 font-medium transition-colors">
              Help & Support
            </Link>
            {!user && (
              <>
                <Link href="/login" className="block px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold text-center transition-all hover:shadow-lg">
                  Login
                </Link>
                <Link href="/signup" className="block px-4 py-2 border-2 border-purple-600 text-purple-600 rounded-lg font-bold text-center transition-all hover:bg-purple-50">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
