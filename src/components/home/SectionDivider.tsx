'use client'

interface SectionDividerProps {
  variant?: 'gradient' | 'dots' | 'wave' | 'simple'
  className?: string
}

export function SectionDivider({ variant = 'gradient', className = '' }: SectionDividerProps) {
  if (variant === 'gradient') {
    return (
      <div className={`relative h-1 my-8 md:my-12 overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-30 blur-sm"></div>
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div className={`flex justify-center items-center gap-3 my-8 md:my-12 ${className}`}>
        <div className="h-1 w-12 bg-gradient-to-r from-purple-600 to-transparent"></div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600"
            ></div>
          ))}
        </div>
        <div className="h-1 w-12 bg-gradient-to-l from-purple-600 to-transparent"></div>
      </div>
    )
  }

  if (variant === 'wave') {
    return (
      <div className={`my-8 md:my-12 ${className}`}>
        <svg
          viewBox="0 0 1440 120"
          className="w-full h-20 text-gray-50"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.1 }} />
              <stop offset="50%" style={{ stopColor: '#6366f1', stopOpacity: 0.05 }} />
              <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.1 }} />
            </linearGradient>
          </defs>
          <path
            d="M0,60 Q360,10 720,60 T1440,60 L1440,120 L0,120 Z"
            fill="url(#wave-gradient)"
          ></path>
        </svg>
      </div>
    )
  }

  return (
    <div className={`h-px my-8 md:my-12 bg-gradient-to-r from-transparent via-gray-300 to-transparent ${className}`}></div>
  )
}
