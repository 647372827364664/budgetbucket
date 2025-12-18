'use client'

import { useState, useEffect } from 'react'
import { 
  Package, 
  AlertTriangle, 
  Edit2, 
  Search, 
  Download, 
  RefreshCw,
  X,
  CheckCircle,
  BoxIcon,
  DollarSign,
  Calendar,
  Save,
  Minus,
  Plus,
  History
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore'

interface InventoryItem {
  id: string
  name: string
  category: string
  stock: number
  minStockLevel: number
  price: number
  sku: string
  images: string[]
  lastRestocked: string
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
}

interface StockAdjustment {
  quantity: number
  type: 'add' | 'remove' | 'set'
  reason: string
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [adjustment, setAdjustment] = useState<StockAdjustment>({
    quantity: 0,
    type: 'add',
    reason: ''
  })

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setIsLoading(true)
      const productsRef = collection(db, 'products')
      const snapshot = await getDocs(productsRef)
      
      const items: InventoryItem[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data()
        const stock = typeof data.stock === 'number' ? data.stock : 0
        const minStockLevel = typeof data.minStockLevel === 'number' ? data.minStockLevel : 10
        
        return {
          id: docSnap.id,
          name: data.name || 'Unnamed Product',
          category: data.category || 'Uncategorized',
          stock: stock,
          minStockLevel: minStockLevel,
          price: typeof data.price === 'number' ? data.price : 0,
          sku: data.sku || `SKU-${docSnap.id.slice(0, 8).toUpperCase()}`,
          images: Array.isArray(data.images) ? data.images : [],
          lastRestocked: data.lastRestocked instanceof Timestamp 
            ? data.lastRestocked.toDate().toISOString() 
            : (typeof data.lastRestocked === 'string' ? data.lastRestocked : ''),
          status: getStockStatus(stock, minStockLevel)
        }
      })
      
      setInventory(items)
      if (items.length > 0) {
        toast.success(`Loaded ${items.length} products from Firebase`)
      }
    } catch (err) {
      console.error('Error fetching inventory:', err)
      toast.error('Failed to load inventory')
      setInventory([])
    } finally {
      setIsLoading(false)
    }
  }

  const getStockStatus = (stock: number, minLevel: number): 'in-stock' | 'low-stock' | 'out-of-stock' => {
    if (stock === 0) return 'out-of-stock'
    if (stock <= minLevel) return 'low-stock'
    return 'in-stock'
  }

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item)
    setAdjustment({
      quantity: 0,
      type: 'add',
      reason: ''
    })
    setShowAdjustModal(true)
  }

  const handleStockAdjustment = async () => {
    if (!selectedItem) return

    if (adjustment.quantity <= 0 && adjustment.type !== 'set') {
      toast.error('Please enter a valid quantity')
      return
    }

    if (!adjustment.reason.trim()) {
      toast.error('Please provide a reason for adjustment')
      return
    }

    try {
      setIsUpdating(true)
      let newStock = selectedItem.stock
      
      switch (adjustment.type) {
        case 'add':
          newStock += adjustment.quantity
          break
        case 'remove':
          newStock = Math.max(0, selectedItem.stock - adjustment.quantity)
          break
        case 'set':
          newStock = Math.max(0, adjustment.quantity)
          break
      }

      const productRef = doc(db, 'products', selectedItem.id)
      await updateDoc(productRef, {
        stock: newStock,
        lastRestocked: adjustment.type === 'add' ? Timestamp.now() : selectedItem.lastRestocked || null,
        updatedAt: Timestamp.now()
      })

      setInventory(inventory.map((item: any) => 
        item.id === selectedItem.id 
          ? { 
              ...item, 
              stock: newStock, 
              status: getStockStatus(newStock, item.minStockLevel),
              lastRestocked: adjustment.type === 'add' ? new Date().toISOString() : item.lastRestocked
            }
          : item
      ))

      const actionText = adjustment.type === 'add' ? 'increased' : adjustment.type === 'remove' ? 'decreased' : 'set to'
      toast.success(`Stock ${actionText} ${newStock} units!`)
      setShowAdjustModal(false)
      setSelectedItem(null)
    } catch (err) {
      console.error('Error adjusting stock:', err)
      toast.error('Failed to update stock')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleQuickAdjust = async (item: InventoryItem, change: number) => {
    const newStock = Math.max(0, item.stock + change)
    
    try {
      const productRef = doc(db, 'products', item.id)
      await updateDoc(productRef, {
        stock: newStock,
        updatedAt: Timestamp.now()
      })

      setInventory(inventory.map(inv => 
        inv.id === item.id 
          ? { ...inv, stock: newStock, status: getStockStatus(newStock, inv.minStockLevel) }
          : inv
      ))
      
      toast.success(`Stock updated to ${newStock}`)
    } catch (err) {
      console.error('Quick adjust error:', err)
      toast.error('Failed to update')
    }
  }

  const handleExportCSV = () => {
    const headers = ['SKU', 'Product Name', 'Category', 'Stock', 'Min Level', 'Price', 'Status', 'Stock Value', 'Last Restocked']
    const rows = inventory.map((item: any) => [
      item.sku,
      item.name,
      item.category,
      item.stock,
      item.minStockLevel,
      item.price,
      item.status.replace('-', ' '),
      item.price * item.stock,
      item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : 'N/A'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.success('Inventory report exported!')
  }

  // Get unique categories
  const categories = [...new Set(inventory.map((item: any) => item.category))].filter(Boolean)

  const filteredInventory = inventory.filter((item) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      (item.name || '').toLowerCase().includes(searchLower) ||
      (item.category || '').toLowerCase().includes(searchLower) ||
      (item.sku || '').toLowerCase().includes(searchLower)

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const inventoryStats = {
    total: inventory.length,
    totalValue: inventory.reduce((sum: number, item: any) => sum + (item.price * item.stock), 0),
    inStock: inventory.filter(i => i.status === 'in-stock').length,
    lowStock: inventory.filter(i => i.status === 'low-stock').length,
    outOfStock: inventory.filter(i => i.status === 'out-of-stock').length,
    totalItems: inventory.reduce((sum: number, item: any) => sum + item.stock, 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Never'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
              <Package className="w-7 h-7" />
            </div>
            Inventory Management
          </h1>
          <p className="text-slate-400 mt-2">Track and manage product stock levels in real-time</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchInventory}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            disabled={inventory.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all duration-200 shadow-lg shadow-violet-500/25"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {/* Total Products */}
        <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50 overflow-hidden group hover:border-slate-600/50 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <BoxIcon className="w-5 h-5 text-slate-400" />
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Products</p>
            </div>
            <p className="text-3xl font-bold text-white">{inventoryStats.total}</p>
          </div>
        </div>

        {/* Total Units */}
        <div className="relative bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-xl rounded-2xl p-5 border border-blue-500/30 overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-blue-400" />
              <p className="text-xs font-medium text-blue-300 uppercase tracking-wider">Total Units</p>
            </div>
            <p className="text-3xl font-bold text-white">{inventoryStats.totalItems.toLocaleString()}</p>
          </div>
        </div>

        {/* In Stock */}
        <div className="relative bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 backdrop-blur-xl rounded-2xl p-5 border border-emerald-500/30 overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <p className="text-xs font-medium text-emerald-300 uppercase tracking-wider">In Stock</p>
            </div>
            <p className="text-3xl font-bold text-white">{inventoryStats.inStock}</p>
          </div>
        </div>

        {/* Low Stock */}
        <div className="relative bg-gradient-to-br from-amber-600/20 to-orange-800/20 backdrop-blur-xl rounded-2xl p-5 border border-amber-500/30 overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <p className="text-xs font-medium text-amber-300 uppercase tracking-wider">Low Stock</p>
            </div>
            <p className="text-3xl font-bold text-white">{inventoryStats.lowStock}</p>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="relative bg-gradient-to-br from-red-600/20 to-red-800/20 backdrop-blur-xl rounded-2xl p-5 border border-red-500/30 overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-500/20 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <X className="w-5 h-5 text-red-400" />
              <p className="text-xs font-medium text-red-300 uppercase tracking-wider">Out of Stock</p>
            </div>
            <p className="text-3xl font-bold text-white">{inventoryStats.outOfStock}</p>
          </div>
        </div>

        {/* Total Value */}
        <div className="relative bg-gradient-to-br from-violet-600/20 to-purple-800/20 backdrop-blur-xl rounded-2xl p-5 border border-violet-500/30 overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/20 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-violet-400" />
              <p className="text-xs font-medium text-violet-300 uppercase tracking-wider">Total Value</p>
            </div>
            <p className="text-xl font-bold text-white">{formatCurrency(inventoryStats.totalValue)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, category, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
          >
            <option value="all">All Status</option>
            <option value="in-stock">✓ In Stock</option>
            <option value="low-stock">⚠ Low Stock</option>
            <option value="out-of-stock">✕ Out of Stock</option>
          </select>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Showing <span className="text-white font-semibold">{filteredInventory.length}</span> of <span className="text-white font-semibold">{inventory.length}</span> items
          </span>
          {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCategoryFilter('all') }}
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
              <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-slate-400 text-lg">Loading inventory from Firebase...</p>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-slate-500" />
            </div>
            <p className="text-white text-xl font-semibold mb-2">No inventory items found</p>
            <p className="text-slate-400">Add products to see inventory or adjust your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/50 border-b border-slate-700/50">
                <tr>
                  <th className="text-left py-4 px-5 font-semibold text-slate-300 uppercase tracking-wider text-xs">Product</th>
                  <th className="text-left py-4 px-5 font-semibold text-slate-300 uppercase tracking-wider text-xs">Category</th>
                  <th className="text-left py-4 px-5 font-semibold text-slate-300 uppercase tracking-wider text-xs">SKU</th>
                  <th className="text-center py-4 px-5 font-semibold text-slate-300 uppercase tracking-wider text-xs">Stock</th>
                  <th className="text-center py-4 px-5 font-semibold text-slate-300 uppercase tracking-wider text-xs">Status</th>
                  <th className="text-left py-4 px-5 font-semibold text-slate-300 uppercase tracking-wider text-xs">Price</th>
                  <th className="text-left py-4 px-5 font-semibold text-slate-300 uppercase tracking-wider text-xs">Last Updated</th>
                  <th className="text-center py-4 px-5 font-semibold text-slate-300 uppercase tracking-wider text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-700/20 transition-colors">
                    {/* Product */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-700/50 rounded-xl overflow-hidden relative flex-shrink-0 ring-1 ring-slate-600/50">
                          {item.images && item.images[0] ? (
                            <Image 
                              src={item.images[0]} 
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-slate-500" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-[200px]">{item.name}</p>
                          <p className="text-xs text-slate-500 font-mono">ID: {item.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    
                    {/* Category */}
                    <td className="py-4 px-5">
                      <span className="px-3 py-1.5 bg-slate-700/50 text-slate-300 rounded-lg text-xs font-medium">
                        {item.category}
                      </span>
                    </td>
                    
                    {/* SKU */}
                    <td className="py-4 px-5">
                      <span className="text-xs text-slate-400 font-mono bg-slate-800/50 px-2 py-1 rounded">
                        {item.sku}
                      </span>
                    </td>
                    
                    {/* Stock with Quick Adjust */}
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleQuickAdjust(item, -1)}
                          disabled={item.stock === 0}
                          className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className={`text-xl font-bold min-w-[50px] text-center ${
                          item.stock === 0 ? 'text-red-400' : 
                          item.stock <= item.minStockLevel ? 'text-amber-400' : 
                          'text-emerald-400'
                        }`}>
                          {item.stock}
                        </span>
                        <button
                          onClick={() => handleQuickAdjust(item, 1)}
                          className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 text-center mt-1">Min: {item.minStockLevel}</p>
                    </td>
                    
                    {/* Status */}
                    <td className="py-4 px-5">
                      <div className="flex justify-center">
                        {item.status === 'in-stock' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle className="w-3.5 h-3.5" />
                            In Stock
                          </span>
                        )}
                        {item.status === 'low-stock' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Low Stock
                          </span>
                        )}
                        {item.status === 'out-of-stock' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                            <X className="w-3.5 h-3.5" />
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </td>
                    
                    {/* Price */}
                    <td className="py-4 px-5">
                      <div>
                        <p className="font-bold text-white">{formatCurrency(item.price)}</p>
                        <p className="text-xs text-slate-500">{formatCurrency(item.price * item.stock)} total</p>
                      </div>
                    </td>
                    
                    {/* Last Restocked */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{formatDate(item.lastRestocked)}</span>
                      </div>
                    </td>
                    
                    {/* Actions */}
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openAdjustModal(item)}
                          className="p-2 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-all"
                          title="Adjust stock"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 w-full max-w-md overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-500/20 rounded-xl">
                    <History className="w-5 h-5 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Adjust Stock</h3>
                </div>
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Product Info */}
            <div className="px-6 py-4 bg-slate-900/30">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-700/50 rounded-xl overflow-hidden relative ring-1 ring-slate-600/50">
                  {selectedItem.images && selectedItem.images[0] ? (
                    <Image 
                      src={selectedItem.images[0]} 
                      alt={selectedItem.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-slate-500" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white">{selectedItem.name}</p>
                  <p className="text-sm text-slate-400">Current stock: <span className="text-white font-bold">{selectedItem.stock}</span></p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Adjustment Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Adjustment Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'add', label: 'Add Stock', icon: Plus, color: 'emerald' },
                    { type: 'remove', label: 'Remove', icon: Minus, color: 'red' },
                    { type: 'set', label: 'Set Value', icon: Edit2, color: 'violet' }
                  ].map(({ type, label, icon: Icon, color }) => (
                    <button
                      key={type}
                      onClick={() => setAdjustment({ ...adjustment, type: type as 'add' | 'remove' | 'set' })}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        adjustment.type === type
                          ? `border-${color}-500 bg-${color}-500/20 text-${color}-400`
                          : 'border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                      style={{
                        borderColor: adjustment.type === type 
                          ? (color === 'emerald' ? '#10b981' : color === 'red' ? '#ef4444' : '#8b5cf6')
                          : undefined,
                        backgroundColor: adjustment.type === type
                          ? (color === 'emerald' ? 'rgba(16,185,129,0.2)' : color === 'red' ? 'rgba(239,68,68,0.2)' : 'rgba(139,92,246,0.2)')
                          : undefined,
                        color: adjustment.type === type
                          ? (color === 'emerald' ? '#34d399' : color === 'red' ? '#f87171' : '#a78bfa')
                          : undefined
                      }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {adjustment.type === 'set' ? 'New Stock Value' : 'Quantity'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjustment.quantity}
                  onChange={(e) => setAdjustment({ ...adjustment, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-lg font-bold focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                  placeholder="0"
                />
                {adjustment.type !== 'set' && adjustment.quantity > 0 && (
                  <p className="mt-2 text-sm text-slate-400">
                    New stock will be: <span className="font-bold text-white">
                      {adjustment.type === 'add' 
                        ? selectedItem.stock + adjustment.quantity 
                        : Math.max(0, selectedItem.stock - adjustment.quantity)}
                    </span>
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Reason for Adjustment</label>
                <textarea
                  value={adjustment.reason}
                  onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all resize-none"
                  placeholder="e.g., New shipment received, Damaged goods, Inventory count correction..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/30 flex gap-3">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 px-4 py-3 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleStockAdjustment}
                disabled={isUpdating || !adjustment.reason.trim() || (adjustment.quantity <= 0 && adjustment.type !== 'set')}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Stock
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
