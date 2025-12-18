import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const user = (request as any).user
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const usersRef = collection(db, 'users')
    const usersSnapshot = await getDocs(usersRef)

    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    const stats = {
      total: users.length,
      active: users.filter((u) => !(u as any).isBlocked).length,
      blocked: users.filter((u) => (u as any).isBlocked).length,
      admins: users.filter((u) => (u as any).isAdmin).length,
    }

    return NextResponse.json({ users, stats })
  } catch (error: any) {
    console.error('Users API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check admin authorization
    const user = (request as any).user
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const { userId, action, data } = await request.json()

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId and action are required' },
        { status: 400 }
      )
    }

    const userRef = doc(db, 'users', userId)

    switch (action) {
      case 'block':
        await updateDoc(userRef, { isBlocked: true })
        break
      case 'unblock':
        await updateDoc(userRef, { isBlocked: false })
        break
      case 'makeAdmin':
        await updateDoc(userRef, { isAdmin: true })
        break
      case 'removeAdmin':
        await updateDoc(userRef, { isAdmin: false })
        break
      case 'update':
        await updateDoc(userRef, data)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('User update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check admin authorization
    const user = (request as any).user
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const userRef = doc(db, 'users', userId)
    await deleteDoc(userRef)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('User delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    )
  }
}
