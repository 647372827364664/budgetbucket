'use client'

import { useState, useEffect } from 'react'
import { Zap, Award, Gift, Target, Clock, TrendingUp, CheckCircle, Sparkles, Heart, Crown } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useLoyaltyStore } from '@/store/loyaltyStore'
import Link from 'next/link'

interface TierInfo {
  name: string
  color: string
  minPoints: number
  benefits: {
    discount: string
    pointsMultiplier: string
    freeShipping: boolean
    birthdayBonus: string
    specialOffers: boolean
  }
  description: string
}

const TIER_GRADIENTS: Record<string, string> = {
  bronze: 'from-amber-600 to-orange-600',
  silver: 'from-gray-400 to-gray-500',
  gold: 'from-yellow-500 to-yellow-600',
  platinum: 'from-purple-600 to-indigo-600',
}

export default function EnhancedLoyaltyPage() {
  const user = useAuthStore((state) => state.user)
  const loyaltyStore = useLoyaltyStore()
  const [tiers, setTiers] = useState<Record<string, TierInfo>>({})
  const [transactions, setTransactions] = useState<any[]>([])
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [redeemAmount, setRedeemAmount] = useState('')
  const [isRedeeming, setIsRedeeming] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loyaltyStore.fetchLoyaltyData(user.id)
      fetchTierInfo()
      fetchTransactions()
    }
  }, [user])

  const fetchTierInfo = async () => {
    try {
      const response = await fetch('/api/loyalty/tiers')
      if (response.ok) {
        const data = await response.json()
        setTiers(data)
      }
    } catch (error) {
      console.error('Error fetching tier info:', error)
    }
  }

  const fetchTransactions = async () => {
    if (!user?.id) return
    try {
      const response = await fetch(`/api/loyalty/transactions?userId=${user.id}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const handleRedeem = async () => {
    if (!redeemAmount || parseInt(redeemAmount) <= 0) return

    setIsRedeeming(true)
    try {
      await loyaltyStore.redeemPoints(parseInt(redeemAmount), 'Discount redemption')
      setRedeemAmount('')
      setShowRedeemModal(false)
      fetchTransactions()
    } catch (error) {
      console.error('Error redeeming points:', error)
    } finally {
      setIsRedeeming(false)
    }
  }

  const currentTierInfo = tiers[loyaltyStore.currentTier]
  const nextTiers = Object.entries(tiers)
    .filter(([_, t]) => t.minPoints > loyaltyStore.totalPoints)
    .sort((a, b) => a[1].minPoints - b[1].minPoints)
  const nextTier = nextTiers[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header Section */}
        <div className="mb-12 animate-slideDown">
          <div className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full mb-4 font-semibold text-sm">
            <Sparkles className="w-4 h-4 inline mr-2" />
            Premium Rewards Program
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-3">Your Loyalty Rewards</h1>
          <p className="text-xl text-gray-600">Earn points on every purchase and unlock exclusive benefits</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Tier Card - Large */}
          <div
            className={`md:col-span-2 rounded-3xl p-8 text-white shadow-2xl border-0 bg-gradient-to-br ${TIER_GRADIENTS[loyaltyStore.currentTier]} overflow-hidden relative group hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1`}
          >
            {/* Background Elements */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-white/80 font-semibold mb-2">Current Tier</p>
                  <div className="flex items-center gap-3">
                    <Crown className="w-10 h-10" />
                    <h2 className="text-4xl font-black">{currentTierInfo?.name}</h2>
                  </div>
                </div>
                <Award className="w-16 h-16 opacity-30" />
              </div>
              <p className="text-white/90 mb-6 text-lg">{currentTierInfo?.description}</p>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <p className="text-white/75 font-medium text-sm mb-1">Discount Benefit</p>
                  <p className="text-3xl font-black">{currentTierInfo?.benefits.discount}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <p className="text-white/75 font-medium text-sm mb-1">Points Multiplier</p>
                  <p className="text-3xl font-black">{currentTierInfo?.benefits.pointsMultiplier}</p>
                </div>
                {currentTierInfo?.benefits.freeShipping && (
                  <div className="col-span-2 bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-semibold">Free Shipping on All Orders</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Points Card */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-purple-100 hover:border-purple-300 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-gray-600 font-semibold text-sm mb-1">Available Points</p>
                <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                  {loyaltyStore.availablePoints}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <p className="text-gray-500 text-sm mb-6">
              Worth ₹{loyaltyStore.availablePoints} in discounts
            </p>

            <button
              onClick={() => setShowRedeemModal(true)}
              disabled={loyaltyStore.availablePoints === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-95"
            >
              <Gift className="w-5 h-5" />
              Redeem Points
            </button>

            {/* Quick Stats */}
            <div className="mt-6 space-y-3 pt-6 border-t-2 border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Earned</span>
                <span className="font-bold text-gray-900">{loyaltyStore.totalPoints}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-bold text-gray-900">{loyaltyStore.redeemedPoints}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tier Progress Section */}
        {nextTier && (
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-amber-100 mb-12 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl">
                <Target className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900">Next Tier Unlocked!</h3>
                <p className="text-gray-600">{nextTier[1].name} Membership</p>
              </div>
            </div>

            <p className="text-gray-600 mb-4 font-medium">
              Earn <span className="text-amber-600 font-black">{nextTier[1].minPoints - loyaltyStore.totalPoints}</span> more points to reach {nextTier[1].name} tier
            </p>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    (loyaltyStore.totalPoints / nextTier[1].minPoints) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>

            <div className="flex justify-between text-xs font-bold text-gray-600">
              <span>{loyaltyStore.totalPoints} pts</span>
              <span>{nextTier[1].minPoints} pts</span>
            </div>
          </div>
        )}

        {/* Tier Benefits Grid */}
        <div className="mb-12">
          <h3 className="text-3xl font-black text-gray-900 mb-8">All Tier Benefits</h3>
          <div className="grid md:grid-cols-4 gap-6">
            {Object.entries(tiers).map(([tierKey, tier]) => (
              <div
                key={tierKey}
                className={`rounded-3xl p-6 border-3 transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                  loyaltyStore.currentTier === tierKey
                    ? `bg-gradient-to-br ${TIER_GRADIENTS[tierKey]} text-white border-transparent shadow-xl`
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-2xl font-black ${loyaltyStore.currentTier === tierKey ? 'text-white' : 'text-gray-900'}`}>
                    {tierKey === 'bronze' && '🥉'}
                    {tierKey === 'silver' && '🥈'}
                    {tierKey === 'gold' && '🥇'}
                    {tierKey === 'platinum' && '👑'}
                    <span className="ml-2">{tier.name}</span>
                  </h4>
                  {loyaltyStore.currentTier === tierKey && (
                    <Crown className="w-5 h-5 text-yellow-300" />
                  )}
                </div>

                <p className={`text-xs mb-4 font-medium ${loyaltyStore.currentTier === tierKey ? 'text-white/80' : 'text-gray-500'}`}>
                  {tier.minPoints}+ points
                </p>

                <div className={`space-y-3 text-sm ${loyaltyStore.currentTier === tierKey ? 'text-white/90' : 'text-gray-600'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    <span><strong>{tier.benefits.discount}</strong> discount</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <span><strong>{tier.benefits.pointsMultiplier}</strong> per ₹1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎂</span>
                    <span><strong>{tier.benefits.birthdayBonus}</strong> birthday bonus</span>
                  </div>
                  {tier.benefits.freeShipping && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚚</span>
                      <span><strong>Free shipping</strong></span>
                    </div>
                  )}
                  {tier.benefits.specialOffers && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✨</span>
                      <span><strong>Special offers</strong></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900">Recent Activity</h3>
          </div>

          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((txn, idx) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-2xl border-2 border-gray-100 hover:border-purple-300 transition-all duration-300 hover:shadow-md"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{txn.reason}</p>
                    <p className="text-xs text-gray-500">{new Date(txn.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-black text-xl ${
                        txn.type === 'earn'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {txn.type === 'earn' ? '+' : '-'}{txn.points}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">{txn.type === 'earn' ? 'Earned' : 'Redeemed'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No transactions yet</p>
              <p className="text-gray-400">Start shopping to earn your first points!</p>
              <Link href="/" className="inline-block mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg transition-all">
                Start Shopping
              </Link>
            </div>
          )}
        </div>

        {/* Continue Shopping */}
        <div className="mt-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-black text-lg hover:gap-4 transition-all">
            Continue Shopping <TrendingUp className="w-6 h-6" />
          </Link>
        </div>
      </div>

      {/* Redeem Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border-2 border-purple-200 animate-scaleIn">
            <h3 className="text-3xl font-black text-gray-900 mb-2">Redeem Points</h3>
            <p className="text-gray-600 mb-6">Convert your loyalty points into discounts</p>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Points to Redeem
              </label>
              <div className="relative mb-3">
                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-600" />
                <input
                  type="number"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  max={loyaltyStore.availablePoints}
                  min="1"
                  placeholder="Enter amount"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:bg-purple-50 transition-all font-semibold"
                />
              </div>
              <p className="text-xs text-gray-500">Available: {loyaltyStore.availablePoints} points</p>
              {redeemAmount && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Discount Value</p>
                  <p className="text-3xl font-black text-green-600">₹{redeemAmount}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRedeemModal(false)
                  setRedeemAmount('')
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleRedeem}
                disabled={isRedeeming || !redeemAmount || parseInt(redeemAmount) <= 0}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-95"
              >
                {isRedeeming ? 'Redeeming...' : 'Redeem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
