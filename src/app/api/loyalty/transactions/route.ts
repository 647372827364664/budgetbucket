import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, QueryConstraint, limit, orderBy } from 'firebase/firestore'

interface PointsTransaction {
  id: string
  userId: string
  type: 'earn' | 'redeem' | 'expire' | 'admin'
  amount: number
  points: number
  reason: string
  orderId?: string
  timestamp: string
  balanceBefore: number
  balanceAfter: number
}

/**
 * POST - Earn points on purchase
 * Body: { userId, points, reason, orderId, balanceBefore }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, points, reason, orderId, balanceBefore } = body

    if (!userId || !points || points <= 0) {
      return NextResponse.json({ error: 'Invalid points data' }, { status: 400 })
    }

    const loyaltyRef = doc(db, 'users', userId, 'loyalty', 'profile')
    const loyaltySnap = await getDoc(loyaltyRef)

    if (!loyaltySnap.exists()) {
      return NextResponse.json({ error: 'User loyalty profile not found' }, { status: 404 })
    }

    const loyaltyData = loyaltySnap.data()
    const newBalance = (loyaltyData.availablePoints || 0) + points

    // Update loyalty profile
    await updateDoc(loyaltyRef, {
      totalPoints: (loyaltyData.totalPoints || 0) + points,
      availablePoints: newBalance,
      lastActivityDate: new Date().toISOString(),
    })

    // Create transaction record
    const txnRef = collection(db, 'users', userId, 'loyalty', 'transactions')
    const newTxn: Omit<PointsTransaction, 'id'> = {
      userId,
      type: 'earn',
      amount: points,
      points,
      reason,
      orderId,
      timestamp: new Date().toISOString(),
      balanceBefore: balanceBefore || 0,
      balanceAfter: newBalance,
    }

    const docRef = await addDoc(txnRef, newTxn)

    return NextResponse.json({ success: true, transactionId: docRef.id, newBalance }, { status: 201 })
  } catch (error) {
    console.error('Error earning points:', error)
    return NextResponse.json({ error: 'Failed to earn points' }, { status: 500 })
  }
}

/**
 * GET - Get points transactions for user
 * Query: ?userId=xxx&limit=10&type=earn
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const pageLimit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') as 'earn' | 'redeem' | 'expire' | 'admin' | undefined

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const constraints: QueryConstraint[] = []

    if (type) {
      constraints.push(where('type', '==', type))
    }

    constraints.push(orderBy('timestamp', 'desc'))
    constraints.push(limit(pageLimit))

    const txnRef = collection(db, 'users', userId, 'loyalty', 'transactions')
    const q = query(txnRef, ...constraints)
    const snapshot = await getDocs(q)

    const transactions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
