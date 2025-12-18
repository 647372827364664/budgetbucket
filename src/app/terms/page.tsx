import { FileText, CheckCircle, XCircle, Shield, AlertTriangle } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl p-8 mb-8">
          <FileText className="w-16 h-16 mb-4" />
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-purple-100">Last updated: December 13, 2025</p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <p className="text-gray-700 leading-relaxed">
            Welcome to Budget Bucket. By accessing and using our website and services, you agree to be bound by these Terms of Service. Please read them carefully. If you do not agree with any part of these terms, you may not use our services.
          </p>
        </div>

        {/* Account Terms */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Account Terms</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>You must be at least 18 years old to create an account and use our services</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>You are responsible for maintaining the security of your account</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>You must provide accurate, complete, and current information</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>You may not use our service for any illegal or unauthorized purpose</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>One person or entity may not maintain more than one account</span>
            </li>
          </ul>
        </div>

        {/* Orders and Payments */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Orders and Payments</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Order Acceptance</h3>
              <p>All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason, including product unavailability, pricing errors, or suspected fraud.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Pricing</h3>
              <p>Prices are displayed in Indian Rupees (INR) and are subject to change without notice. We strive to keep pricing accurate but reserve the right to correct any errors.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Payment</h3>
              <p>Payment must be made at the time of purchase through our approved payment methods. We use secure third-party payment processors to handle transactions.</p>
            </div>
          </div>
        </div>

        {/* Shipping and Delivery */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Shipping and Delivery</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>Delivery times are estimates and not guaranteed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>Shipping charges are calculated based on location and order value</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>Risk of loss and title pass to you upon delivery to the carrier</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>You must provide accurate delivery information</span>
            </li>
          </ul>
        </div>

        {/* Returns and Refunds */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Returns and Refunds</h2>
          <p className="text-gray-700 mb-4">
            Our return policy allows returns within 7 days of delivery for eligible products. Please refer to our{' '}
            <a href="/returns" className="text-purple-600 hover:underline">Returns & Exchanges page</a> for complete details.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              Refunds will be processed to your original payment method within 5-7 business days after we receive and verify the returned item.
            </p>
          </div>
        </div>

        {/* Intellectual Property */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">5. Intellectual Property</h2>
          </div>
          <p className="text-gray-700 mb-4">
            All content on Budget Bucket, including text, graphics, logos, images, and software, is the property of Budget Bucket or its content suppliers and is protected by intellectual property laws.
          </p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>You may not reproduce, distribute, or create derivative works</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>You may not use our trademarks without prior written consent</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>You may view and print content for personal, non-commercial use only</span>
            </li>
          </ul>
        </div>

        {/* User Conduct */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">6. Prohibited Activities</h2>
          </div>
          <p className="text-gray-700 mb-4">You agree not to:</p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>Use the service for any unlawful purpose or to violate any laws</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>Attempt to gain unauthorized access to our systems</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>Interfere with or disrupt the service or servers</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>Engage in any fraudulent or deceptive practices</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>Upload malicious code, viruses, or harmful content</span>
            </li>
          </ul>
        </div>

        {/* Disclaimer */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Disclaimer of Warranties</h2>
          <p className="text-gray-700">
            Budget Bucket provides its services &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.
          </p>
        </div>

        {/* Limitation of Liability */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
          <p className="text-gray-700">
            Budget Bucket shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service. Our total liability shall not exceed the amount you paid for the products or services in question.
          </p>
        </div>

        {/* Termination */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h2>
          <p className="text-gray-700">
            We reserve the right to suspend or terminate your account and access to our services at any time, with or without notice, for violations of these Terms or for any other reason we deem appropriate.
          </p>
        </div>

        {/* Governing Law */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Governing Law</h2>
          <p className="text-gray-700">
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
          </p>
        </div>

        {/* Changes to Terms */}
        <div className="bg-white rounded-xl p-8 mb-6 border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
          <p className="text-gray-700">
            We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the service after changes constitutes acceptance of the modified Terms.
          </p>
        </div>

        {/* Contact */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Questions About Our Terms?</h2>
          <p className="text-purple-100 mb-6">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <div className="space-y-2 mb-6">
            <p>Email: <a href="mailto:sale.raghavinfratech@gmail.com" className="underline">sale.raghavinfratech@gmail.com</a></p>
            <p>Phone: +91 92170 23668</p>
          </div>
          <a href="/contact" className="inline-block px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
