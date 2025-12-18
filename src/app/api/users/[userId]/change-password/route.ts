import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current and new password are required' },
        { status: 400 }
      )
    }

    // Get current user from Firebase Auth
    const user = (auth as any)?.currentUser

    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    if ((user as any)?.uid !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot change another user password' },
        { status: 403 }
      )
    }

    try {
      // For email/password auth
      if ((user as any)?.email) {
        // In demo mode, we just simulate the password change
        // In production, implement actual reauthentication
        return NextResponse.json({ 
          success: true, 
          message: 'Password changed successfully (demo mode)' 
        })
      } else {
        // For phone OTP auth, just update without reauthentication
        // In production, you should implement phone reauthentication
        return NextResponse.json({ 
          success: true, 
          message: 'Password changed successfully (demo mode)' 
        })
      }
    } catch (authError: any) {
      if (authError.code === 'auth/wrong-password') {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        )
      }
      throw authError
    }
  } catch (error: any) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to change password' },
      { status: 500 }
    )
  }
}
