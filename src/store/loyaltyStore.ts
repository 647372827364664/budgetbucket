import { create } from 'zustand'

export interface LoyaltyState {
  userId: string | null
  totalPoints: number
  currentTier: 'bronze' | 'silver' | 'gold' | 'platinum'
  tierProgress: number
  availablePoints: number
  redeemedPoints: number
  joinedDate: string | null
  lastActivityDate: string | null
  isLoading: boolean
  error: string | null

  // Actions
  setUserId: (userId: string) => void
  fetchLoyaltyData: (userId: string) => Promise<void>
  earnPoints: (points: number, reason: string, orderId?: string) => Promise<void>
  redeemPoints: (points: number, reason: string) => Promise<void>
  updateLoyaltyData: (data: Partial<LoyaltyState>) => void
  clearError: () => void
  reset: () => void
}

const initialState = {
  userId: null,
  totalPoints: 0,
  currentTier: 'bronze' as const,
  tierProgress: 0,
  availablePoints: 0,
  redeemedPoints: 0,
  joinedDate: null,
  lastActivityDate: null,
  isLoading: false,
  error: null,
}

export const useLoyaltyStore = create<LoyaltyState>((set, get) => ({
  ...initialState,

  setUserId: (userId: string) => {
    set({ userId })
  },

  fetchLoyaltyData: async (userId: string) => {
    try {
      set({ isLoading: true, error: null })

      const response = await fetch(`/api/loyalty/user/${userId}`)
      if (!response.ok) throw new Error('Failed to fetch loyalty data')

      const data = await response.json()
      set({
        userId,
        totalPoints: data.totalPoints,
        currentTier: data.currentTier,
        tierProgress: data.tierProgress,
        availablePoints: data.availablePoints,
        redeemedPoints: data.redeemedPoints,
        joinedDate: data.joinedDate,
        lastActivityDate: data.lastActivityDate,
        isLoading: false,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch loyalty data'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  earnPoints: async (points: number, reason: string, orderId?: string) => {
    try {
      const state = get()
      if (!state.userId) throw new Error('User ID not set')

      set({ isLoading: true, error: null })

      const response = await fetch('/api/loyalty/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: state.userId,
          points,
          reason,
          orderId,
          balanceBefore: state.availablePoints,
        }),
      })

      if (!response.ok) throw new Error('Failed to earn points')

      const data = await response.json()

      // Update local state
      set({
        totalPoints: state.totalPoints + points,
        availablePoints: data.newBalance,
        lastActivityDate: new Date().toISOString(),
        isLoading: false,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to earn points'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  redeemPoints: async (points: number, reason: string) => {
    try {
      const state = get()
      if (!state.userId) throw new Error('User ID not set')

      set({ isLoading: true, error: null })

      const response = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: state.userId,
          pointsToRedeem: points,
          reason,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to redeem points')
      }

      const data = await response.json()

      // Update local state
      set({
        availablePoints: data.pointsRemaining,
        redeemedPoints: state.redeemedPoints + points,
        lastActivityDate: new Date().toISOString(),
        isLoading: false,
      })

      return data
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to redeem points'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  updateLoyaltyData: (data: Partial<LoyaltyState>) => {
    set(data)
  },

  clearError: () => {
    set({ error: null })
  },

  reset: () => {
    set(initialState)
  },
}))
