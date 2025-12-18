import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'

export async function GET(_request: NextRequest, context: any) {
  try {
    const rawParams = context?.params
    const params = rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams || {}
    const productId = params.id
    const reviewsRef = collection(db, 'products', productId, 'reviews')
    const q = query(reviewsRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)

    const reviews: any[] = []
    let total = 0
    snapshot.forEach(doc => {
      const data: any = doc.data()
      const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate().toISOString()
        : (data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString())
      reviews.push({ id: doc.id, ...data, createdAt })
      total += typeof data.rating === 'number' ? data.rating : 0
    })

    const totalReviews = reviews.length
    const averageRating = totalReviews > 0 ? Math.round((total / totalReviews) * 10) / 10 : 0

    return NextResponse.json({ success: true, reviews, totalReviews, averageRating })
  } catch (error) {
    console.error('Failed to fetch reviews', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: any) {
  try {
    const rawParams = context?.params
    const params = rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams || {}
    const productId = params.id
    const body = await request.json()
    const { userId, userName, userEmail, rating, comment } = body

    if (!userId || !rating || !comment) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const reviewsRef = collection(db, 'products', productId, 'reviews')
    const docRef = await addDoc(reviewsRef, {
      userId,
      userName: userName || 'Anonymous',
      userEmail: userEmail || '',
      rating: Number(rating),
      comment: String(comment),
      helpful: 0,
      verified: false,
      createdAt: serverTimestamp()
    })

    return NextResponse.json({ success: true, id: docRef.id })
  } catch (error) {
    console.error('Failed to submit review', error)
    return NextResponse.json({ success: false, error: 'Failed to submit review' }, { status: 500 })
  }
}
