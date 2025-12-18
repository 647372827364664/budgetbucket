'use client'

import Link from 'next/link'
import { Facebook, Twitter, Instagram, Linkedin, Phone, Mail, MapPin, MessageCircle } from 'lucide-react'

export function Footer() {
  const whatsappNumber = '919217023668';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hi, I need help with my order.`;

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-lg text-white mb-4">Budget Bucket</h3>
            <p className="text-sm mb-4">
              Your one-stop destination for quality products at unbeatable prices.
            </p>
            {/* Contact Info */}
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span>D-191, Shop No 1, West Vinod Nagar, Delhi - 110092</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-purple-400" />
                <a href="tel:+919217023668" className="hover:text-purple-400">+91 92170 23668</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-400" />
                <a href="mailto:sale.raghavinfratech@gmail.com" className="hover:text-purple-400">sale.raghavinfratech@gmail.com</a>
              </div>
            </div>
            {/* Social & WhatsApp */}
            <div className="flex gap-4">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition" title="Chat on WhatsApp">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary-500 transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary-500 transition">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary-500 transition">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-white mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/categories/electronics" className="hover:text-primary-500">
                  Electronics
                </Link>
              </li>
              <li>
                <Link href="/categories/fashion" className="hover:text-primary-500">
                  Fashion
                </Link>
              </li>
              <li>
                <Link href="/categories/home" className="hover:text-primary-500">
                  Home & Living
                </Link>
              </li>
              <li>
                <Link href="/categories/books" className="hover:text-primary-500">
                  Books
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-white mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="hover:text-primary-500">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-primary-500">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-primary-500">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary-500">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-primary-500">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-primary-500">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary-500">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/press" className="hover:text-primary-500">
                  Press
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-primary-500">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary-500">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-primary-500">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-primary-500">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © 2025 Budget Bucket. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-gray-400">
            <span>💳 Secure Payments</span>
            <span>🚚 Fast Shipping</span>
            <span>📞 24/7 Support</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
