'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  BarChart3, 
  BoxIcon,
  Bell,
  Search,
  Image
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check admin access on mount
  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!user.isAdmin) {
      router.push('/')
      return
    }

    setIsLoading(false)
  }, [user, router])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!user.isAdmin) {
    return null
  }

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      href: '/admin',
      active: pathname === '/admin'
    },
    { 
      icon: Package, 
      label: 'Products', 
      href: '/admin/products',
      active: pathname === '/admin/products'
    },
    { 
      icon: ShoppingCart, 
      label: 'Orders', 
      href: '/admin/orders',
      active: pathname === '/admin/orders'
    },
    { 
      icon: Image, 
      label: 'Banners', 
      href: '/admin/banners',
      active: pathname === '/admin/banners'
    },
    { 
      icon: Users, 
      label: 'Users', 
      href: '/admin/users',
      active: pathname === '/admin/users'
    },
    { 
      icon: BoxIcon, 
      label: 'Inventory', 
      href: '/admin/inventory',
      active: pathname === '/admin/inventory'
    },
    { 
      icon: BarChart3, 
      label: 'Reports', 
      href: '/admin/reports',
      active: pathname === '/admin/reports'
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      href: '/admin/settings',
      active: pathname === '/admin/settings'
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 fixed w-full top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsSidebarOpen(!isSidebarOpen)
                setIsMobileMenuOpen(false)
              }}
              className="p-2 rounded-lg hover:bg-slate-100 transition hidden lg:block"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 transition lg:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-600" />
              ) : (
                <Menu className="w-5 h-5 text-slate-600" />
              )}
            </button>

            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BB</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-900">Budget Bucket</h1>
                <p className="text-xs text-slate-500">Admin Panel</p>
              </div>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-slate-100 transition relative">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user.name || 'Admin'}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user.name?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 transition-all duration-300 z-40
          ${isSidebarOpen ? 'w-64' : 'w-20'} 
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition group
                    ${item.active 
                      ? 'bg-purple-50 text-purple-600' 
                      : 'text-slate-600 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${item.active ? 'text-purple-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className={`font-medium ${isSidebarOpen ? 'block' : 'hidden'}`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-3 border-t border-slate-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition group"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className={`font-medium ${isSidebarOpen ? 'block' : 'hidden'}`}>
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 pt-16 min-h-screen bg-slate-50
          ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}
        `}
      >
        <div className="min-h-[calc(100vh-4rem)] w-full p-4 md:p-6 lg:p-8 max-w-[2000px]">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
