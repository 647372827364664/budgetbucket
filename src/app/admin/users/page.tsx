'use client'

import { useState, useEffect } from 'react'
import { 
  Lock, 
  Unlock, 
  Trash2, 
  Search, 
  Shield, 
  ShieldOff,
  User as UserIcon,
  Crown,
  Edit2,
  X,
  Check,
  RefreshCw,
  Phone,
  Mail,
  ShoppingBag,
  Award,
  Users,
  UserCheck,
  UserX,
  ChevronDown,
  Filter
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { db } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore'

interface User {
  id: string
  name?: string
  displayName?: string
  phone?: string
  email?: string
  isAdmin: boolean
  isBlocked: boolean
  createdAt: Timestamp | Date | string
  photoURL?: string
  loyaltyPoints?: number
  totalOrders?: number
  totalSpent?: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const usersRef = collection(db, 'users')
      const q = query(usersRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      const usersData: User[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isAdmin: doc.data().isAdmin || false,
        isBlocked: doc.data().isBlocked || false
      } as User))
      
      setUsers(usersData)
    } catch (err) {
      console.error('Error fetching users:', err)
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: Timestamp | Date | string | undefined) => {
    if (!date) return 'N/A'
    try {
      let d: Date
      if (date instanceof Timestamp) d = date.toDate()
      else if (date instanceof Date) d = date
      else d = new Date(date)
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch { return 'N/A' }
  }

  const handleToggleAdmin = async (user: User) => {
    const newStatus = !user.isAdmin
    if (!confirm(`${newStatus ? 'Grant admin access to' : 'Remove admin access from'} ${user.name || user.phone}?`)) return

    try {
      setIsUpdating(true)
      await updateDoc(doc(db, 'users', user.id), { isAdmin: newStatus, updatedAt: Timestamp.now() })
      setUsers(users.map(u => u.id === user.id ? { ...u, isAdmin: newStatus } : u))
      toast.success(newStatus ? 'Admin access granted!' : 'Admin access removed!')
    } catch (err) {
      toast.error('Failed to update user')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleBlock = async (user: User) => {
    const newStatus = !user.isBlocked
    if (!confirm(`${newStatus ? 'Block' : 'Unblock'} ${user.name || user.phone}?`)) return

    try {
      setIsUpdating(true)
      await updateDoc(doc(db, 'users', user.id), { isBlocked: newStatus, updatedAt: Timestamp.now() })
      setUsers(users.map(u => u.id === user.id ? { ...u, isBlocked: newStatus } : u))
      toast.success(newStatus ? 'User blocked!' : 'User unblocked!')
    } catch (err) {
      toast.error('Failed to update user')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Delete ${user.name || user.phone}? This cannot be undone!`)) return

    try {
      setIsUpdating(true)
      await deleteDoc(doc(db, 'users', user.id))
      setUsers(users.filter(u => u.id !== user.id))
      toast.success('User deleted!')
    } catch (err) {
      toast.error('Failed to delete user')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSaveUser = async () => {
    if (!editingUser) return
    try {
      setIsUpdating(true)
      await updateDoc(doc(db, 'users', editingUser.id), {
        name: editingUser.name || '',
        displayName: editingUser.displayName || editingUser.name || '',
        email: editingUser.email || '',
        isAdmin: editingUser.isAdmin,
        isBlocked: editingUser.isBlocked,
        loyaltyPoints: editingUser.loyaltyPoints || 0,
        updatedAt: Timestamp.now()
      })
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u))
      toast.success('User updated!')
      setShowEditModal(false)
    } catch (err) {
      toast.error('Failed to update user')
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase()
    const matchesSearch = 
      (user.name || '').toLowerCase().includes(search) ||
      (user.displayName || '').toLowerCase().includes(search) ||
      (user.phone || '').includes(search) ||
      (user.email || '').toLowerCase().includes(search)
    
    const matchesRole = roleFilter === 'all' || (roleFilter === 'admin' ? user.isAdmin : !user.isAdmin)
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? !user.isBlocked : user.isBlocked)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const stats = {
    total: users.length,
    admins: users.filter(u => u.isAdmin).length,
    active: users.filter(u => !u.isBlocked).length,
    blocked: users.filter(u => u.isBlocked).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
                User Management
              </h1>
              <p className="text-slate-400">Manage platform users and access permissions</p>
            </div>
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-2xl font-medium shadow-xl shadow-purple-500/20 transition-all duration-300 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 transition-transform group-hover:rotate-180 duration-500 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/10 p-6 hover:border-blue-500/20 transition-all duration-300">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-blue-500/20 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <p className="text-4xl font-bold text-white mb-1">{stats.total}</p>
              <p className="text-sm text-slate-400">Total Users</p>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-colors" />
          </div>

          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent border border-violet-500/10 p-6 hover:border-violet-500/20 transition-all duration-300">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-violet-500/20 group-hover:scale-110 transition-transform">
                  <Crown className="w-5 h-5 text-violet-400" />
                </div>
              </div>
              <p className="text-4xl font-bold text-white mb-1">{stats.admins}</p>
              <p className="text-sm text-slate-400">Administrators</p>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-violet-500/10 blur-3xl group-hover:bg-violet-500/20 transition-colors" />
          </div>

          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/10 p-6 hover:border-emerald-500/20 transition-all duration-300">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <p className="text-4xl font-bold text-white mb-1">{stats.active}</p>
              <p className="text-sm text-slate-400">Active Users</p>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/20 transition-colors" />
          </div>

          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/10 p-6 hover:border-rose-500/20 transition-all duration-300">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-rose-500/20 group-hover:scale-110 transition-transform">
                  <UserX className="w-5 h-5 text-rose-400" />
                </div>
              </div>
              <p className="text-4xl font-bold text-white mb-1">{stats.blocked}</p>
              <p className="text-sm text-slate-400">Blocked</p>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-rose-500/10 blur-3xl group-hover:bg-rose-500/20 transition-colors" />
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-slate-800/30 backdrop-blur-2xl rounded-3xl border border-white/5 p-5 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
              <input
                type="text"
                placeholder="Search users by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-white/5 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 transition-all"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl border font-medium transition-all ${
                showFilters 
                  ? 'bg-violet-500/20 border-violet-500/30 text-violet-300' 
                  : 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {showFilters && (
            <div className="flex flex-wrap gap-4 mt-5 pt-5 border-t border-white/5">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 font-medium">Role:</span>
                <div className="flex gap-2">
                  {['all', 'admin', 'user'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={`px-4 py-2 text-sm rounded-xl font-medium capitalize transition-all ${
                        roleFilter === role
                          ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                          : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      {role === 'all' ? 'All' : role}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-px h-10 bg-white/5 hidden sm:block" />
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 font-medium">Status:</span>
                <div className="flex gap-2">
                  {['all', 'active', 'blocked'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 text-sm rounded-xl font-medium capitalize transition-all ${
                        statusFilter === status
                          ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                          : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      {status === 'all' ? 'All' : status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="bg-slate-800/30 backdrop-blur-2xl rounded-3xl border border-white/5 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mb-6" />
              <p className="text-slate-400 font-medium">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
                <Users className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-xl text-white font-semibold mb-2">No users found</p>
              <p className="text-slate-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredUsers.map((user, index) => (
                <div 
                  key={user.id} 
                  className="p-5 md:p-6 hover:bg-white/[0.02] transition-all duration-300 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden shadow-xl shadow-violet-500/20 group-hover:shadow-violet-500/30 transition-shadow">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (user.name || user.displayName || 'U')[0].toUpperCase()
                        )}
                      </div>
                      {user.isAdmin && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                          <Crown className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {user.name || user.displayName || 'Unnamed User'}
                        </h3>
                        {user.isBlocked && (
                          <span className="px-2.5 py-1 text-xs font-semibold bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20">
                            Blocked
                          </span>
                        )}
                        {user.isAdmin && (
                          <span className="px-2.5 py-1 text-xs font-semibold bg-violet-500/20 text-violet-400 rounded-lg border border-violet-500/20">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        {user.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            {user.phone}
                          </span>
                        )}
                        {user.email && (
                          <span className="flex items-center gap-1.5 hidden sm:flex">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[200px]">{user.email}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden xl:flex items-center gap-8">
                      <div className="text-center px-4">
                        <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                          <ShoppingBag className="w-4 h-4" />
                          <span className="text-xl font-bold text-white">{user.totalOrders || 0}</span>
                        </div>
                        <p className="text-xs text-slate-500">Orders</p>
                      </div>
                      <div className="text-center px-4">
                        <div className="flex items-center gap-1.5 text-amber-400 mb-0.5">
                          <Award className="w-4 h-4" />
                          <span className="text-xl font-bold">{user.loyaltyPoints || 0}</span>
                        </div>
                        <p className="text-xs text-slate-500">Points</p>
                      </div>
                      <div className="text-center px-4">
                        <p className="text-sm font-medium text-slate-300">{formatDate(user.createdAt)}</p>
                        <p className="text-xs text-slate-500">Joined</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleAdmin(user)}
                        disabled={isUpdating}
                        title={user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                        className={`p-3 rounded-xl transition-all duration-200 ${
                          user.isAdmin
                            ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 shadow-lg shadow-violet-500/10'
                            : 'bg-slate-800/50 text-slate-400 hover:text-violet-400 hover:bg-violet-500/20'
                        }`}
                      >
                        {user.isAdmin ? <ShieldOff className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                      </button>
                      
                      <button
                        onClick={() => handleToggleBlock(user)}
                        disabled={isUpdating}
                        title={user.isBlocked ? 'Unblock' : 'Block'}
                        className={`p-3 rounded-xl transition-all duration-200 ${
                          user.isBlocked
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-slate-800/50 text-slate-400 hover:text-amber-400 hover:bg-amber-500/20'
                        }`}
                      >
                        {user.isBlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </button>
                      
                      <button
                        onClick={() => { setEditingUser({...user}); setShowEditModal(true) }}
                        title="Edit"
                        className="p-3 rounded-xl bg-slate-800/50 text-slate-400 hover:text-blue-400 hover:bg-blue-500/20 transition-all duration-200"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteUser(user)}
                        disabled={isUpdating}
                        title="Delete"
                        className="p-3 rounded-xl bg-slate-800/50 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all duration-200"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-500">
          Showing <span className="text-white font-medium">{filteredUsers.length}</span> of <span className="text-white font-medium">{users.length}</span> users
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl w-full max-w-lg border border-white/10 shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xl font-bold shadow-xl shadow-violet-500/30">
                  {(editingUser.name || editingUser.displayName || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Edit User</h2>
                  <p className="text-sm text-slate-400">{editingUser.phone || 'No phone'}</p>
                </div>
              </div>
              <button
                onClick={() => { setShowEditModal(false); setEditingUser(null) }}
                className="p-2.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 transition-all"
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 transition-all"
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Loyalty Points</label>
                <input
                  type="number"
                  value={editingUser.loyaltyPoints || 0}
                  onChange={(e) => setEditingUser({ ...editingUser, loyaltyPoints: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3.5 bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 transition-all"
                  min="0"
                />
              </div>
              
              {/* Toggle Cards */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser({ ...editingUser, isAdmin: !editingUser.isAdmin })}
                  className={`p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
                    editingUser.isAdmin
                      ? 'bg-violet-500/15 border-violet-500/50 shadow-lg shadow-violet-500/10'
                      : 'bg-slate-900/50 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl w-fit mb-3 ${editingUser.isAdmin ? 'bg-violet-500/30' : 'bg-slate-800'}`}>
                    <Crown className={`w-5 h-5 ${editingUser.isAdmin ? 'text-violet-400' : 'text-slate-500'}`} />
                  </div>
                  <p className="font-semibold text-white">Admin Access</p>
                  <p className={`text-sm mt-1 ${editingUser.isAdmin ? 'text-violet-400' : 'text-slate-500'}`}>
                    {editingUser.isAdmin ? 'Enabled' : 'Disabled'}
                  </p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setEditingUser({ ...editingUser, isBlocked: !editingUser.isBlocked })}
                  className={`p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
                    editingUser.isBlocked
                      ? 'bg-rose-500/15 border-rose-500/50 shadow-lg shadow-rose-500/10'
                      : 'bg-slate-900/50 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl w-fit mb-3 ${editingUser.isBlocked ? 'bg-rose-500/30' : 'bg-slate-800'}`}>
                    <Lock className={`w-5 h-5 ${editingUser.isBlocked ? 'text-rose-400' : 'text-slate-500'}`} />
                  </div>
                  <p className="font-semibold text-white">Block User</p>
                  <p className={`text-sm mt-1 ${editingUser.isBlocked ? 'text-rose-400' : 'text-slate-500'}`}>
                    {editingUser.isBlocked ? 'Blocked' : 'Active'}
                  </p>
                </button>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-white/5">
              <button
                onClick={() => { setShowEditModal(false); setEditingUser(null) }}
                className="flex-1 px-6 py-3.5 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-2xl font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={isUpdating}
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-2xl font-medium shadow-xl shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Changes
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
