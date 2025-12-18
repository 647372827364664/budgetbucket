'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useUIStore } from '@/store/uiStore'
import { Menu, X, ShoppingCart, Heart, Search, User, Zap, TrendingUp, Gift, LogOut } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const itemCount = useCartStore((state) => state.itemCount)
  const { isMobileMenuOpen, toggleMobileMenu, closeAll } = useUIStore()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput)}`)
      setSearchInput('')
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white">
      {/* Promotional Bar */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white text-xs md:text-sm py-2 md:py-3 animate-gradient">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 md:w-5 md:h-5 animate-bounce-soft" />
            <p className="font-semibold hidden sm:block">Limited Time: 50% OFF on Select Items!</p>
            <p className="font-semibold sm:hidden">50% OFF Now!</p>
          </div>
          <div className="hidden md:flex gap-4 text-xs">
            <Link href="/track-order" className="hover:opacity-80 transition-opacity flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Track
            </Link>
            <div className="w-px bg-white/30" />
            <Link href="/help" className="hover:opacity-80 transition-opacity">
              Help
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            {/* Logo - Image */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
              <div className="relative w-11 h-11 md:w-12 md:h-12 rounded-xl overflow-hidden flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <img src="/logo.svg" alt="Budget Bucket" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-black text-base md:text-lg text-gray-900 leading-tight">Budget Bucket</span>
                <p className="text-xs text-gray-500 font-medium">Premium Shopping</p>
              </div>
            </Link>

            {/* Search Bar - Mobile Optimized */}
            <div className="flex-1 max-w-sm md:max-w-md">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative w-full group">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full px-3 py-2.5 md:px-4 md:py-3 pl-9 md:pl-10 text-sm md:text-base border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all group-hover:border-purple-300 placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                    aria-label="Search"
                  >
                    <Search className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="p-2 md:p-2.5 hover:bg-purple-50 rounded-lg relative group transition-all duration-200"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-red-500 transition-colors" />
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="p-2 md:p-2.5 hover:bg-purple-50 rounded-lg relative group transition-all duration-200"
                aria-label="Shopping Cart"
              >
                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-purple-600 transition-colors" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-pulse-soft">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>

              {/* User Account */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="p-2 md:p-2.5 hover:bg-purple-50 rounded-lg transition-all duration-200"
                  aria-label="Account"
                >
                  <User className="w-5 h-5 md:w-6 md:h-6 text-gray-700 hover:text-purple-600 transition-colors" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 md:w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl animate-slideUp z-50">
                    {user ? (
                      <>
                        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-2xl">
                          <p className="font-bold text-gray-900 truncate">{user.name || user.phone}</p>
                          {user.isAdmin && (
                            <span className="inline-block mt-2 text-xs bg-purple-600 text-white px-3 py-1 rounded-full font-medium">
                              Admin
                            </span>
                          )}
                        </div>
                        <Link
                          href="/profile"
                          className="block px-5 py-3 hover:bg-purple-50 transition-colors text-gray-700 font-medium flex items-center gap-3"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <Link
                          href="/orders"
                          className="block px-5 py-3 hover:bg-purple-50 transition-colors text-gray-700 font-medium flex items-center gap-3"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          My Orders
                        </Link>
                        <Link
                          href="/loyalty"
                          className="block px-5 py-3 hover:bg-purple-50 transition-colors text-gray-700 font-medium flex items-center gap-3"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Gift className="w-4 h-4" />
                          Loyalty Points
                        </Link>
                        {user.isAdmin && (
                          <Link
                            href="/admin"
                            className="block px-5 py-3 hover:bg-purple-50 transition-colors text-gray-700 font-medium flex items-center gap-3 border-t border-gray-100"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <Zap className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={async () => {
                            try {
                              await useAuthStore.getState().logout()
                              setIsProfileOpen(false)
                              router.push('/')
                            } catch (error) {
                              console.error('Logout failed:', error)
                            }
                          }}
                          className="w-full text-left px-5 py-3 hover:bg-red-50 transition-colors text-red-600 font-medium flex items-center gap-3 border-t border-gray-100 rounded-b-2xl"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="block px-5 py-3 hover:bg-purple-50 border-b border-gray-100 text-purple-600 font-bold transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Login
                        </Link>
                        <div className="px-5 py-3 text-xs text-gray-600">
                          Login to access your account, wishlists, and orders.
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 hover:bg-purple-50 rounded-lg transition-colors"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-gray-200 animate-slideDown">
              <nav className="flex flex-col gap-2">
                <Link
                  href="/products"
                  className="px-3 py-2 text-gray-700 hover:text-purple-600 font-medium hover:bg-purple-50 rounded-lg transition-all flex items-center gap-2"
                  onClick={closeAll}
                >
                  <ShoppingCart className="w-4 h-4" />
                  All Products
                </Link>
                <Link
                  href="/deals"
                  className="px-3 py-2 text-gray-700 hover:text-purple-600 font-medium hover:bg-purple-50 rounded-lg transition-all flex items-center gap-2"
                  onClick={closeAll}
                >
                  <Zap className="w-4 h-4" />
                  Hot Deals
                </Link>
                <Link
                  href="/loyalty"
                  className="px-3 py-2 text-gray-700 hover:text-purple-600 font-medium hover:bg-purple-50 rounded-lg transition-all flex items-center gap-2"
                  onClick={closeAll}
                >
                  <Gift className="w-4 h-4" />
                  Loyalty
                </Link>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:block border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <nav className="flex gap-8">
            <Link href="/products" className="text-gray-700 hover:text-purple-600 font-semibold text-sm transition-colors flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              All Products
            </Link>
            <Link href="/deals" className="text-gray-700 hover:text-purple-600 font-semibold text-sm transition-colors flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Hot Deals
            </Link>
            <Link href="/loyalty" className="text-gray-700 hover:text-purple-600 font-semibold text-sm transition-colors flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Loyalty
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
