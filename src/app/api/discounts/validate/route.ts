import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

interface DiscountValidationRequest {
  code: string
  amount?: number
}

/**
 * POST /api/discounts/validate
 * Validate a discount code and return discount details
 */
export async function POST(request: NextRequest) {
  try {
    const body: DiscountValidationRequest = await request.json()

    if (!body.code) {
      return NextResponse.json({ error: 'Discount code required' }, { status: 400 })
    }

    const codesRef = collection(db, 'discount_codes')
    const q = query(
      codesRef,
      where('code', '==', body.code.toUpperCase()),
      where('isActive', '==', true)
    )

    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid or expired discount code' },
        { status: 404 }
      )
    }

    const codeData = snapshot.docs[0].data() as any

    // Check expiration date
    if (codeData.expiryDate) {
      const expiryTime = codeData.expiryDate.toMillis?.() || new Date(codeData.expiryDate).getTime()
      if (expiryTime < Date.now()) {
        return NextResponse.json(
          { error: 'Discount code has expired' },
          { status: 410 }
        )
      }
    }

    // Check usage limit
    if (codeData.maxUses && codeData.uses >= codeData.maxUses) {
      return NextResponse.json(
        { error: 'Discount code usage limit reached' },
        { status: 410 }
      )
    }

    // Check minimum order amount
    if (body.amount && codeData.minOrderAmount && body.amount < codeData.minOrderAmount) {
      return NextResponse.json(
        {
          error: `Minimum order amount ₹${codeData.minOrderAmount} required for this code`,
        },
        { status: 422 }
      )
    }

    return NextResponse.json({
      valid: true,
      code: codeData.code,
      discountType: codeData.discountType, // 'percentage' or 'fixed'
      discountValue: codeData.discountValue,
      minOrderAmount: codeData.minOrderAmount || 0,
      maxDiscount: codeData.maxDiscount || null,
      maxUses: codeData.maxUses || null,
      uses: codeData.uses || 0,
    })
  } catch (error) {
    console.error('Error validating discount code:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to validate discount code',
      },
      { status: 500 }
    )
  }
}
