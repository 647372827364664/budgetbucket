import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore'

/**
 * POST /api/loyalty/redeem
 * Redeem loyalty points for discount
 * Body: { userId, pointsToRedeem, reason }
 * Returns: { success, redeemId, discountAmount, pointsRemaining }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, pointsToRedeem, reason } = body

    if (!userId || !pointsToRedeem || pointsToRedeem <= 0) {
      return NextResponse.json({ error: 'Invalid redemption data' }, { status: 400 })
    }

    const loyaltyRef = doc(db, 'users', userId, 'loyalty', 'profile')
    const loyaltySnap = await getDoc(loyaltyRef)

    if (!loyaltySnap.exists()) {
      return NextResponse.json({ error: 'User loyalty profile not found' }, { status: 404 })
    }

    const loyaltyData = loyaltySnap.data()
    const availablePoints = loyaltyData.availablePoints || 0

    if (availablePoints < pointsToRedeem) {
      return NextResponse.json(
        { error: 'Insufficient points', available: availablePoints, needed: pointsToRedeem },
        { status: 400 }
      )
    }

    // 1 point = ₹1 discount
    const discountAmount = pointsToRedeem

    // Update loyalty profile
    const newAvailablePoints = availablePoints - pointsToRedeem
    const newRedeemedPoints = (loyaltyData.redeemedPoints || 0) + pointsToRedeem

    await updateDoc(loyaltyRef, {
      availablePoints: newAvailablePoints,
      redeemedPoints: newRedeemedPoints,
      lastActivityDate: new Date().toISOString(),
    })

    // Create redemption transaction
    const txnRef = collection(db, 'users', userId, 'loyalty', 'transactions')
    const redemptionTxn = {
      userId,
      type: 'redeem',
      amount: discountAmount,
      points: pointsToRedeem,
      reason: reason || 'Discount redemption',
      timestamp: new Date().toISOString(),
      balanceBefore: availablePoints,
      balanceAfter: newAvailablePoints,
    }

    const docRef = await addDoc(txnRef, redemptionTxn)

    return NextResponse.json(
      {
        success: true,
        redeemId: docRef.id,
        pointsRedeemed: pointsToRedeem,
        discountAmount,
        pointsRemaining: newAvailablePoints,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error redeeming points:', error)
    return NextResponse.json({ error: 'Failed to redeem points' }, { status: 500 })
  }
}
