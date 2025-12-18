import { NextRequest, NextResponse } from 'next/server'

const TIER_INFO = {
  bronze: {
    name: 'Bronze',
    color: '#CD7F32',
    minPoints: 0,
    benefits: {
      discount: '0%',
      pointsMultiplier: '1x',
      freeShipping: false,
      birthdayBonus: '50 points',
      specialOffers: false,
    },
    description: 'Welcome to our loyalty program! Earn points on every purchase.',
  },
  silver: {
    name: 'Silver',
    color: '#C0C0C0',
    minPoints: 500,
    benefits: {
      discount: '3%',
      pointsMultiplier: '1.1x',
      freeShipping: false,
      birthdayBonus: '100 points',
      specialOffers: false,
    },
    description: 'Congratulations! You now enjoy exclusive Silver benefits.',
  },
  gold: {
    name: 'Gold',
    color: '#FFD700',
    minPoints: 1500,
    benefits: {
      discount: '5%',
      pointsMultiplier: '1.2x',
      freeShipping: false,
      birthdayBonus: '200 points',
      specialOffers: true,
    },
    description: 'You have reached Gold status! Enjoy premium benefits.',
  },
  platinum: {
    name: 'Platinum',
    color: '#E5E4E2',
    minPoints: 3500,
    benefits: {
      discount: '8%',
      pointsMultiplier: '1.5x',
      freeShipping: true,
      birthdayBonus: '500 points',
      specialOffers: true,
    },
    description: 'Elite status! Experience our premium Platinum benefits.',
  },
}

/**
 * GET /api/loyalty/tiers
 * Get all tier information and benefits
 */
export async function GET(request: NextRequest) {
  try {
    const tier = new URL(request.url).searchParams.get('tier')

    if (tier && tier in TIER_INFO) {
      return NextResponse.json(TIER_INFO[tier as keyof typeof TIER_INFO])
    }

    return NextResponse.json(TIER_INFO)
  } catch (error) {
    console.error('Error fetching tier info:', error)
    return NextResponse.json({ error: 'Failed to fetch tier information' }, { status: 500 })
  }
}
