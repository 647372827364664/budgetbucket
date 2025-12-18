import { Shield, Eye, Lock, UserCheck, Database, Bell, Share2, Cookie } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl p-8 mb-8">
          <Shield className="w-16 h-16 mb-4" />
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-purple-100">Last updated: December 13, 2025</p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <p className="text-gray-700 leading-relaxed">
            At Budget Bucket, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our website and services.
          </p>
        </div>

        {/* Information We Collect */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-8 h-8 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
          </div>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Name, email address, and phone number</li>
                <li>Delivery address and billing information</li>
                <li>Payment information (processed securely through third-party payment gateways)</li>
                <li>Account credentials and profile information</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Automatically Collected Information</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Device information (browser type, operating system)</li>
                <li>IP address and location data</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Usage data and browsing history on our site</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How We Use Your Information */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-8 h-8 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
          </div>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>To process and fulfill your orders and deliver products</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>To communicate with you about orders, updates, and promotions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>To improve our website, products, and services</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>To personalize your shopping experience</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>To prevent fraud and ensure platform security</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>To comply with legal obligations and resolve disputes</span>
            </li>
          </ul>
        </div>

        {/* Information Sharing */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Share2 className="w-8 h-8 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Information Sharing</h2>
          </div>
          <p className="text-gray-700 mb-4">We may share your information with:</p>
          <div className="space-y-3 text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Service Providers</h3>
              <p>Third-party companies that help us operate our business (payment processors, shipping partners, etc.)</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Business Partners</h3>
              <p>Trusted partners who assist in delivering our services</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Legal Requirements</h3>
              <p>When required by law or to protect our rights and safety</p>
            </div>
            <p className="mt-4 font-medium text-gray-900">
              We do not sell your personal information to third parties for marketing purposes.
            </p>
          </div>
        </div>

        {/* Data Security */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-8 h-8 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">
            We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. This includes encryption, secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </div>

        {/* Your Rights */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <UserCheck className="w-8 h-8 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Your Rights</h2>
          </div>
          <p className="text-gray-700 mb-4">You have the right to:</p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">✓</span>
              <span>Access and review your personal information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">✓</span>
              <span>Update or correct your information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">✓</span>
              <span>Request deletion of your account and data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">✓</span>
              <span>Opt-out of marketing communications</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">✓</span>
              <span>Withdraw consent for data processing</span>
            </li>
          </ul>
          <p className="mt-4 text-gray-700">
            To exercise these rights, please contact us at{' '}
            <a href="mailto:privacy@budgetbucket.com" className="text-purple-600 hover:underline">
              privacy@budgetbucket.com
            </a>
          </p>
        </div>

        {/* Cookies */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Cookie className="w-8 h-8 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Cookies and Tracking</h2>
          </div>
          <p className="text-gray-700 mb-4">
            We use cookies and similar technologies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie preferences through your browser settings.
          </p>
          <a href="/cookie-policy" className="text-purple-600 hover:underline font-medium">
            Read our full Cookie Policy →
          </a>
        </div>

        {/* Children's Privacy */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Children&apos;s Privacy</h2>
          <p className="text-gray-700">
            Our services are not intended for children under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
          </p>
        </div>

        {/* Updates to Policy */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-8 h-8 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Updates to This Policy</h2>
          </div>
          <p className="text-gray-700">
            We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the &quot;Last Updated&quot; date. We encourage you to review this policy periodically.
          </p>
        </div>

        {/* Contact */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Questions About Privacy?</h2>
          <p className="text-purple-100 mb-6">
            If you have any questions or concerns about our Privacy Policy, please contact us:
          </p>
          <div className="space-y-2">
            <p>Email: <a href="mailto:sale.raghavinfratech@gmail.com" className="underline">sale.raghavinfratech@gmail.com</a></p>
            <p>Phone: +91 92170 23668</p>
          </div>
          <a href="/contact" className="inline-block mt-6 px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
