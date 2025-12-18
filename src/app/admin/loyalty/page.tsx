'use client'

import { useState, useEffect } from 'react'
import { Award, Users, Zap, TrendingUp, Settings } from 'lucide-react'
import Link from 'next/link'

interface TierStats {
  bronze: number
  silver: number
  gold: number
  platinum: number
}

interface LoyaltyStats {
  totalUsers: number
  totalPointsEarned: number
  totalPointsRedeemed: number
  totalDiscountsGiven: number
  averagePointsPerUser: number
  tierStats: TierStats
}

const TIER_COLORS: Record<string, string> = {
  bronze: 'from-amber-600 to-amber-700',
  silver: 'from-slate-400 to-slate-500',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-slate-200 to-slate-300',
}

export default function AdminLoyaltyPage() {
  const [stats, setStats] = useState<LoyaltyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showBonusModal, setShowBonusModal] = useState(false)
  const [bonusForm, setBonusForm] = useState({
    userId: '',
    points: '',
    reason: 'admin-adjustment',
  })

  useEffect(() => {
    fetchLoyaltyStats()
  }, [])

  const fetchLoyaltyStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/loyalty/tiers')
      if (response.ok) {
        // For demo, show mock stats
        const mockStats: LoyaltyStats = {
          totalUsers: 1250,
          totalPointsEarned: 450000,
          totalPointsRedeemed: 180000,
          totalDiscountsGiven: 180000,
          averagePointsPerUser: 360,
          tierStats: {
            bronze: 850,
            silver: 250,
            gold: 100,
            platinum: 50,
          },
        }
        setStats(mockStats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBonusSubmit = async () => {
    if (!bonusForm.userId || !bonusForm.points) return

    try {
      const response = await fetch('/api/loyalty/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: bonusForm.userId,
          points: parseInt(bonusForm.points),
          reason: bonusForm.reason,
        }),
      })

      if (response.ok) {
        setBonusForm({ userId: '', points: '', reason: 'admin-adjustment' })
        setShowBonusModal(false)
        // Show success notification
      }
    } catch (error) {
      console.error('Error adding bonus:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Loyalty Management</h1>
              <p className="text-gray-600">Manage customer loyalty tiers, points, and rewards</p>
            </div>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              ← Back to Admin
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers.toLocaleString()}</p>
              </div>
              <Users size={32} className="text-purple-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Points Earned</p>
                <p className="text-3xl font-bold text-green-600">{(stats?.totalPointsEarned || 0).toLocaleString()}</p>
              </div>
              <Zap size={32} className="text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Points Redeemed</p>
                <p className="text-3xl font-bold text-orange-600">{(stats?.totalPointsRedeemed || 0).toLocaleString()}</p>
              </div>
              <TrendingUp size={32} className="text-orange-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Discounts Given</p>
                <p className="text-3xl font-bold text-red-600">₹{(stats?.totalDiscountsGiven || 0).toLocaleString()}</p>
              </div>
              <Award size={32} className="text-red-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Avg Points/User</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.averagePointsPerUser}</p>
              </div>
              <Settings size={32} className="text-blue-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Tier Distribution */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-6">User Distribution by Tier</h3>
            <div className="space-y-4">
              {Object.entries(stats?.tierStats || {}).map(([tier, count]) => {
                const total = stats?.totalUsers || 1
                const percentage = (count / total) * 100
                return (
                  <div key={tier} className="flex items-center gap-4">
                    <div className="w-20 text-sm font-medium text-gray-700 capitalize">{tier}</div>
                    <div className="flex-1">
                      <div className={`h-8 rounded-lg bg-gradient-to-r ${TIER_COLORS[tier]} flex items-center justify-center text-white text-sm font-semibold`}>
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm font-semibold text-gray-700">{count}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowBonusModal(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Zap size={18} />
                Award Bonus Points
              </button>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2">
                <TrendingUp size={18} />
                Generate Campaign
              </button>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2">
                <Award size={18} />
                Tier Promotions
              </button>
            </div>
          </div>
        </div>

        {/* Tier Benefits */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Tier Configuration</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Tier</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Min Points</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Discount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Points Multiplier</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Birthday Bonus</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Free Shipping</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">🥉 Bronze</td>
                  <td className="py-3 px-4">0</td>
                  <td className="py-3 px-4">0%</td>
                  <td className="py-3 px-4">1x</td>
                  <td className="py-3 px-4">50 pts</td>
                  <td className="py-3 px-4">❌</td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">🥈 Silver</td>
                  <td className="py-3 px-4">500</td>
                  <td className="py-3 px-4">3%</td>
                  <td className="py-3 px-4">1.1x</td>
                  <td className="py-3 px-4">100 pts</td>
                  <td className="py-3 px-4">❌</td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">🥇 Gold</td>
                  <td className="py-3 px-4">1,500</td>
                  <td className="py-3 px-4">5%</td>
                  <td className="py-3 px-4">1.2x</td>
                  <td className="py-3 px-4">200 pts</td>
                  <td className="py-3 px-4">❌</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-4">✨ Platinum</td>
                  <td className="py-3 px-4">3,500</td>
                  <td className="py-3 px-4">8%</td>
                  <td className="py-3 px-4">1.5x</td>
                  <td className="py-3 px-4">500 pts</td>
                  <td className="py-3 px-4">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bonus Modal */}
      {showBonusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Award Bonus Points</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input
                  type="text"
                  value={bonusForm.userId}
                  onChange={(e) => setBonusForm({ ...bonusForm, userId: e.target.value })}
                  placeholder="Enter user ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                <input
                  type="number"
                  value={bonusForm.points}
                  onChange={(e) => setBonusForm({ ...bonusForm, points: e.target.value })}
                  placeholder="Enter points"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select
                  value={bonusForm.reason}
                  onChange={(e) => setBonusForm({ ...bonusForm, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="admin-adjustment">Admin Adjustment</option>
                  <option value="referral-bonus">Referral Bonus</option>
                  <option value="birthday-bonus">Birthday Bonus</option>
                  <option value="promotion">Promotion</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBonusModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBonusSubmit}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
              >
                Award
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
