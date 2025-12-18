import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

interface LoyaltyData {
  userId: string
  totalPoints: number
  currentTier: 'bronze' | 'silver' | 'gold' | 'platinum'
  tierProgress: number // percentage to next tier
  availablePoints: number
  redeemedPoints: number
  joinedDate: string
  lastActivityDate: string
}

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 500,
  gold: 1500,
  platinum: 3500,
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    const loyaltyRef = doc(db, 'users', userId, 'loyalty', 'profile')
    const loyaltySnap = await getDoc(loyaltyRef)

    if (!loyaltySnap.exists()) {
      // Create initial loyalty profile
      const initialLoyalty: LoyaltyData = {
        userId,
        totalPoints: 0,
        currentTier: 'bronze',
        tierProgress: 0,
        availablePoints: 0,
        redeemedPoints: 0,
        joinedDate: new Date().toISOString(),
        lastActivityDate: new Date().toISOString(),
      }

      await setDoc(loyaltyRef, initialLoyalty)
      return NextResponse.json(initialLoyalty)
    }

    const loyaltyData = loyaltySnap.data() as LoyaltyData

    // Calculate tier progress
    const currentTierThreshold = TIER_THRESHOLDS[loyaltyData.currentTier]
    const tierKeys = Object.keys(TIER_THRESHOLDS) as Array<keyof typeof TIER_THRESHOLDS>
    const tierIndex = tierKeys.indexOf(loyaltyData.currentTier)
    const nextTierThreshold = tierKeys[tierIndex + 1] ? TIER_THRESHOLDS[tierKeys[tierIndex + 1]] : currentTierThreshold + 2000

    loyaltyData.tierProgress = Math.round(((loyaltyData.totalPoints - currentTierThreshold) / (nextTierThreshold - currentTierThreshold)) * 100)

    return NextResponse.json(loyaltyData)
  } catch (error) {
    console.error('Error fetching loyalty data:', error)
    return NextResponse.json({ error: 'Failed to fetch loyalty data' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const body = await request.json()
    const { totalPoints, availablePoints, redeemedPoints } = body

    const loyaltyRef = doc(db, 'users', userId, 'loyalty', 'profile')

    // Determine tier based on total points
    let newTier: keyof typeof TIER_THRESHOLDS = 'bronze'
    if (totalPoints >= TIER_THRESHOLDS.platinum) {
      newTier = 'platinum'
    } else if (totalPoints >= TIER_THRESHOLDS.gold) {
      newTier = 'gold'
    } else if (totalPoints >= TIER_THRESHOLDS.silver) {
      newTier = 'silver'
    } else {
      newTier = 'bronze'
    }

    const updateData: Partial<LoyaltyData> = {
      lastActivityDate: new Date().toISOString(),
    }

    if (totalPoints !== undefined) updateData.totalPoints = totalPoints
    if (availablePoints !== undefined) updateData.availablePoints = availablePoints
    if (redeemedPoints !== undefined) updateData.redeemedPoints = redeemedPoints
    updateData.currentTier = newTier

    await updateDoc(loyaltyRef, updateData)

    const updatedSnap = await getDoc(loyaltyRef)
    return NextResponse.json(updatedSnap.data())
  } catch (error) {
    console.error('Error updating loyalty data:', error)
    return NextResponse.json({ error: 'Failed to update loyalty data' }, { status: 500 })
  }
}
