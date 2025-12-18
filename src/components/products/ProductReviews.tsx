'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Star, Trash2, ThumbsUp, Send } from 'lucide-react'

interface Review {
  id: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: string
  helpful?: number
  verified?: boolean
}

interface ProductReviewsProps {
  productId: string
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { user } = useAuthStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
  })

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews)
        setAverageRating(data.averageRating)
        setTotalReviews(data.totalReviews)
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      alert('Please login to submit a review')
      return
    }

    if (!formData.comment.trim()) {
      alert('Please write a review')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: (user as any).id || (user as any).uid,
          userName: (user as any).name || (user as any).displayName || 'Anonymous',
          userEmail: (user as any).email || '',
          rating: formData.rating,
          comment: formData.comment,
        }),
      })

      if (response.ok) {
        alert('Review submitted successfully!')
        setFormData({ rating: 5, comment: '' })
        setShowReviewForm(false)
        fetchReviews()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Error submitting review')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return
    if (!confirm('Are you sure you want to delete this review?')) return

    try {
      const response = await fetch(`/api/products/${productId}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: (user as any).id || (user as any).uid }),
      })

      if (response.ok) {
        alert('Review deleted successfully')
        fetchReviews()
      } else {
        alert('Failed to delete review')
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Error deleting review')
    }
  }

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: (user as any)?.id || (user as any)?.uid || 'anonymous',
          action: 'markHelpful',
        }),
      })

      if (response.ok) {
        fetchReviews()
      }
    } catch (error) {
      console.error('Error marking review helpful:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="card p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="mt-4 text-slate-600">Loading reviews...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="card p-6 bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-slate-900 mb-2">{averageRating}</div>
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  className={
                    i < Math.round(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-slate-300'
                  }
                />
              ))}
            </div>
            <p className="text-slate-600 text-sm">Based on {totalReviews} reviews</p>
          </div>

          {user && !showReviewForm && (
            <div className="flex flex-col justify-center">
              <button
                onClick={() => setShowReviewForm(true)}
                className="btn-primary py-3"
              >
                Write a Review
              </button>
              <p className="text-xs text-slate-500 mt-3 text-center">
                Share your experience with this product
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="card p-6 border-2 border-purple-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Share Your Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                    className="transition transform hover:scale-110"
                  >
                    <Star
                      size={28}
                      className={
                        star <= formData.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Your Review
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, comment: e.target.value }))
                }
                placeholder="Share your experience with this product..."
                className="input-field w-full h-24 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-slate-500 mt-1">
                {formData.comment.length}/500 characters
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={18} />
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Customer Reviews ({totalReviews})
          </h3>
          {reviews.map((review) => (
            <div key={review.id} className="card p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{review.userName}</p>
                    {review.verified && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i < review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300'
                        }
                      />
                    ))}
                  </div>
                </div>
                {user?.id === review.userId && (
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <p className="text-slate-700 mb-3">{review.comment}</p>

              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
                <button
                  onClick={() => handleMarkHelpful(review.id)}
                  className="flex items-center gap-1 text-sm text-slate-600 hover:text-purple-600 transition"
                >
                  <ThumbsUp size={14} />
                  Helpful {review.helpful ? `(${review.helpful})` : ''}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-slate-600 mb-4">No reviews yet. Be the first to review!</p>
          {user && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="btn-primary mx-auto"
            >
              Write the First Review
            </button>
          )}
        </div>
      )}
    </div>
  )
}
