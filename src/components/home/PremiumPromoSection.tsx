'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'

export function PremiumPromoSection() {
  return (
    <section className="py-12 md:py-20 px-4 md:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 auto-rows-[320px] md:auto-rows-[360px]">
          {/* Large Promo - Left */}
          <Link href="/flash-sale" className="group md:row-span-2">
            <div className="relative h-full rounded-3xl overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 hover:shadow-2xl transition-all duration-500 border border-white/20 hover:border-white/40">
              {/* Animated Background Elements */}
              <div className="absolute inset-0 opacity-25">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
              </div>

              {/* Content */}
              <div className="relative h-full flex flex-col justify-between p-8 md:p-10 group-hover:scale-105 transition-transform duration-500">
                <div>
                  <div className="inline-block bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-6 group-hover:bg-white/30 transition-colors">
                    <span className="text-white text-xs md:text-sm font-bold flex items-center gap-2">
                      <Zap className="w-4 h-4 animate-pulse" />
                      Limited Time Offer
                    </span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">Flash Sale</h2>
                  <p className="text-2xl md:text-3xl font-bold text-yellow-300 drop-shadow-lg">Up to 70% OFF</p>
                </div>
                <button className="w-fit bg-white text-purple-600 px-8 py-4 rounded-full font-bold hover:scale-110 transform transition-all duration-300 active:scale-95 shadow-lg hover:shadow-2xl">
                  Shop Now
                </button>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
            </div>
          </Link>

          {/* Right Side - Two Stacked Promos */}
          <div className="flex flex-col gap-8">
            {/* Promo 2 - Fashion */}
            <Link href="/fashion" className="group">
              <div className="relative h-full rounded-3xl overflow-hidden bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 hover:shadow-2xl transition-all duration-500 border border-white/20 hover:border-white/40 group-hover:scale-105">
                {/* Animated overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Content */}
                <div className="relative h-full flex flex-col justify-between p-6 md:p-8">
                  <div className="text-white/80 text-xs font-bold uppercase tracking-wider">New Collection</div>
                  <div>
                    <h3 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">Fashion Week</h3>
                    <p className="text-sm md:text-base text-white/90 font-semibold">Trending Now</p>
                  </div>
                </div>

                {/* Hover overlay icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="text-white text-4xl">→</div>
                </div>
              </div>
            </Link>

            {/* Promo 3 - Electronics */}
            <Link href="/electronics" className="group">
              <div className="relative h-full rounded-3xl overflow-hidden bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 hover:shadow-2xl transition-all duration-500 border border-white/20 hover:border-white/40 group-hover:scale-105">
                {/* Animated overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Content */}
                <div className="relative h-full flex flex-col justify-between p-6 md:p-8">
                  <div className="text-white/80 text-xs font-bold uppercase tracking-wider">Top Picks</div>
                  <div>
                    <h3 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">Tech Gadgets</h3>
                    <p className="text-sm md:text-base text-white/90 font-semibold">Innovation & Quality</p>
                  </div>
                </div>

                {/* Hover overlay icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="text-white text-4xl">→</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
