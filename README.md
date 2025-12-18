# Budget Bucket - Premium E-commerce Platform

A fully-featured Next.js e-commerce platform with modern UI, Firebase backend, and comprehensive features for both customers and admins.

## 🚀 Features

### Core Features
- ✅ Fully branded responsive UI (mobile + desktop)
- ✅ SEO-friendly product pages
- ✅ Lightning-fast performance with Next.js
- ✅ Product search, filtering, and sorting
- ✅ Dynamic product pages
- ✅ Category management

### Product Management
- ✅ Product listing (grid + list views)
- ✅ Individual product pages with images gallery
- ✅ Product specifications and tags
- ✅ Related products recommendations
- ✅ Recently viewed section
- ✅ New arrivals and trending sections

### User Features
- ✅ Firebase Phone OTP authentication (Phase 2)
- ✅ Phone login page with formatting
- ✅ OTP verification with 6-digit input
- ✅ Auto-complete OTP input component
- ✅ User profile creation on first login
- ✅ User profile management
- 📍 Saved addresses for checkout
- ❤️ Wishlist functionality
- 🛒 Shopping cart with device sync

### Shopping & Checkout
- 🛍️ Add/remove from cart
- 💳 Razorpay payment integration (UPI, Cards, Wallets, Netbanking)
- 📦 Shiprocket shipping integration
- 🎫 Automatic invoice generation
- ✅ Order creation on payment success

### Shipping & Tracking
- 📦 Auto-create shipments via Shiprocket
- 🚚 Real-time tracking with AWB number
- 📍 Live shipment status updates
- 🔔 Webhook-based status notifications
- 📊 Full delivery timeline

### Admin Dashboard
- 📊 Revenue analytics and KPIs
- 📦 Product management (CRUD operations)
- 📋 Order management and tracking
- 👥 User management
- ⚙️ Site settings and configuration
- 💰 Payment and shipping settings

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework
- **React 19** - UI library
- **Tailwind CSS 4** - Styling
- **ShadCN UI** - Component library
- **Zustand** - State management
- **Framer Motion** - Animations
- **Lucide React** - Icons

### Backend
- **Firebase** - Authentication & Database
  - Firebase Auth (Phone OTP)
  - Firestore (Database)
  - Cloud Storage (Image hosting)
- **Cloud Functions** - Serverless backend
- **Node.js 18+** - Runtime

### External Services
- **Razorpay** - Payment processing
- **Shiprocket** - Shipping & Logistics

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Firebase account
- Razorpay account
- Shiprocket account

## 🚀 Getting Started

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Environment Setup

Create `.env.local` file:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (for Cloud Functions)
FIREBASE_SERVICE_ACCOUNT_KEY=your_service_account_key

# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_SECRET_KEY=your_razorpay_secret_key

# Shiprocket Configuration
NEXT_PUBLIC_SHIPROCKET_API_KEY=your_shiprocket_api_key
SHIPROCKET_SECRET_KEY=your_shiprocket_secret_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── providers.tsx      # Auth provider
│   ├── api/               # API routes
│   ├── (auth)/            # Auth routes
│   ├── products/          # Product routes
│   ├── checkout/          # Checkout flow
│   ├── orders/            # Order management
│   ├── admin/             # Admin panel
│   └── globals.css        # Global styles
├── components/
│   ├── layout/            # Header, Footer
│   ├── home/              # Homepage sections
│   ├── products/          # Product components
│   ├── auth/              # Auth components
│   ├── cart/              # Cart components
│   └── common/            # Reusable components
├── store/                 # Zustand stores
│   ├── authStore.ts       # Auth state
│   ├── cartStore.ts       # Cart state
│   ├── wishlistStore.ts   # Wishlist state
│   └── uiStore.ts         # UI state
├── lib/
│   ├── firebase.ts        # Firebase config
│   └── utils.ts           # Utility functions
├── types/
│   └── index.ts           # TypeScript types
├── hooks/                 # Custom React hooks
├── services/              # API services
└── utils/                 # Utility functions
```

## 🔐 Security Features

- ✅ Firebase security rules (role-based)
- ✅ Admin access controlled via custom claims
- ✅ Sensitive operations on secure backend
- ✅ Payment verification on backend
- ✅ Secure API keys management
- ✅ Rate-limited APIs
- ✅ Protected Cloud Functions

## 📱 Responsive Design

- 📱 Mobile-first approach
- 💻 Tablet optimized
- 🖥️ Desktop responsive
- ⚡ Touch-friendly UI
- 🎯 Fast performance

## 🚀 Performance Optimization

- 📦 Image optimization with Next.js Image
- 🗜️ Code splitting
- 💾 Static generation where possible
- ⚙️ Server-side rendering
- 🔄 Automatic cache management
- ⚡ Tailwind CSS purging

## 📝 API Documentation

### Authentication
- `POST /api/auth/login` - Phone OTP login
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `GET /api/products/search?q=query` - Search products
- `GET /api/categories` - Get categories

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/user/:userId` - Get user orders

### Payment
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment

### Shipping
- `POST /api/shipments/create` - Create shipment
- `GET /api/shipments/:shipmentId` - Get shipment details

## 🗄️ Database Schema (Firestore)

### Collections
- `users` - User profiles
- `products` - Product catalog
- `categories` - Product categories
- `orders` - Customer orders
- `cart` - Shopping carts
- `wishlist` - User wishlists
- `reviews` - Product reviews
- `shipments` - Shipping information

## 🧪 Testing

```bash
npm run type-check    # TypeScript type checking
npm run lint          # ESLint checking
```

## 📝 Code Style

This project uses:
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety

## 🤝 Contributing

Contributions are welcome! Please follow the existing code style and submit pull requests.

## 📄 License

ISC

## 📞 Support

For support, email support@budgetbucket.com or visit our help center.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Firebase for the backend infrastructure
- Tailwind CSS for the utility-first CSS
- All contributors and maintainers

---

**Budget Bucket** - Your One-Stop E-commerce Destination! 🛍️
