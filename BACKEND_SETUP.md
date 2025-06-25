# 🚀 Bargain Hunter - Backend & Shopify Integration Setup

This guide covers the complete setup of the Shopify backend integration, dashboard, and database for the Bargain Hunter application.

## 🎯 What We've Built

### ✅ Completed Features

1. **Shopify API Integration**
   - OAuth authentication flow
   - Session management
   - Product and discount management
   - Script tag installation/removal
   - Webhook handling

2. **Database Architecture**
   - Firebase/Firestore integration
   - Complete data models for stores, games, sessions, scores, discounts
   - Database operations and services

3. **Admin Dashboard**
   - Store management interface
   - Game configuration settings
   - Analytics and reporting
   - Real-time statistics

4. **API Endpoints**
   - Authentication (`/api/auth/*`)
   - Dashboard APIs (`/api/dashboard/*`)
   - Store management (`/api/stores/*`)
   - Game session handling (`/api/game/*`)
   - Webhook handlers (`/api/webhooks/*`)

5. **Analytics & Reporting**
   - Session tracking and completion rates
   - Discount generation and usage analytics
   - Customer behavior insights
   - Revenue impact tracking

## 🛠 Setup Instructions

### 1. Environment Configuration

Create `.env.local` with the following variables:

```env
# Shopify Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
SHOPIFY_SCOPES=read_products,write_discounts,read_customers,write_script_tags,read_orders

# Application URLs
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_WIDGET_URL=https://your-domain.vercel.app/widget
NEXT_PUBLIC_API_BASE=https://your-domain.vercel.app/api
HOST=your-domain.vercel.app

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Firestore Database

2. **Generate Service Account**
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Extract `project_id`, `client_email`, and `private_key` for your `.env.local`

3. **Configure Firestore Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow read/write access to authenticated users
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

### 3. Shopify App Configuration

1. **Create Shopify App**
   - Go to [Shopify Partners](https://partners.shopify.com)
   - Create a new app
   - Set app URL to your deployment URL

2. **Configure OAuth**
   - App URL: `https://your-domain.vercel.app/app`
   - Allowed redirection URLs:
     - `https://your-domain.vercel.app/api/auth/callback`
     - `https://your-domain.vercel.app/api/auth/shopify/callback`

3. **Set Required Scopes**
   ```
   read_products
   write_discounts
   read_customers
   write_script_tags
   read_orders
   ```

4. **Configure Webhooks**
   - Order creation: `https://your-domain.vercel.app/api/webhooks/orders/create`
   - App uninstalled: `https://your-domain.vercel.app/api/webhooks/app/uninstalled`
   - Customer creation: `https://your-domain.vercel.app/api/webhooks/customers/create`

### 4. Database Schema

The application uses the following Firestore collections:

- **stores**: Store installation data and access tokens
- **gameConfigs**: Game settings and configurations per store
- **gameSessions**: Individual game session records
- **gameScores**: High scores and achievements
- **discountCodes**: Generated discount codes and usage tracking
- **customers**: Customer profiles and statistics
- **analytics**: Aggregated analytics data

## 🎮 Usage Flow

### 1. App Installation
1. Merchant visits installation URL: `/app?shop=store.myshopify.com`
2. OAuth flow redirects to Shopify for authorization
3. Callback creates store record and installs script tag
4. Default game configuration is created
5. Merchant is redirected to dashboard

### 2. Game Session
1. Customer visits store with installed script tag
2. Widget loads and checks game configuration
3. Customer starts game session via `/api/game/start-session`
4. Game completion calls `/api/game/finish-session`
5. Discount code is generated if score qualifies
6. Session data is stored for analytics

### 3. Dashboard Management
1. Merchant accesses dashboard at `/dashboard?shop=store.myshopify.com`
2. View analytics at `/dashboard/analytics`
3. Configure settings at `/dashboard/settings`
4. Monitor customer activity and discount usage

## 📊 API Endpoints

### Authentication
- `GET /api/auth/install` - Start OAuth flow
- `GET /api/auth/callback` - Handle OAuth callback

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/sessions` - Get game sessions
- `POST /api/dashboard/settings` - Update game settings

### Store Management
- `GET /api/stores/[shop]` - Get store information
- `PUT /api/stores/[shop]` - Update store settings
- `GET /api/stores/[shop]/analytics` - Get detailed analytics

### Game Management
- `GET /api/game/config/[shop]` - Get game configuration
- `POST /api/game/start-session` - Start new game session
- `POST /api/game/finish-session` - Complete game session

### Webhooks
- `POST /api/webhooks/orders/create` - Handle order creation
- `POST /api/webhooks/app/uninstalled` - Handle app uninstallation
- `POST /api/webhooks/customers/create` - Handle customer creation

## 🔧 Development

### Running the Application
```bash
npm install
npm run dev
```

### Testing
```bash
npm test                 # Unit tests
npm run test:e2e        # End-to-end tests
npm run test:coverage   # Coverage report
```

### Code Quality
```bash
npm run lint            # ESLint
npm run type-check      # TypeScript
```

## 🚀 Deployment

1. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Add all environment variables in Vercel dashboard
   - Ensure webhook URLs point to production domain

3. **Update Shopify App Settings**
   - Update app URL to production domain
   - Update OAuth redirect URLs
   - Configure webhook endpoints

## 🔐 Security Considerations

- All webhooks are verified using HMAC signatures
- OAuth tokens are securely stored in Firebase
- API endpoints include proper authentication
- Rate limiting is implemented for game sessions
- Customer data handling follows GDPR guidelines

## 📈 Next Steps

1. **Testing**: Test the complete flow with a development store
2. **Monitoring**: Set up error tracking (Sentry, LogRocket)
3. **Performance**: Monitor API response times and database queries
4. **Scaling**: Consider caching strategies for high-traffic stores
5. **Features**: Add more game types and advanced analytics

## 🆘 Troubleshooting

### Common Issues

1. **Firebase Connection Issues**
   - Verify service account credentials
   - Check Firestore rules
   - Ensure project ID is correct

2. **Shopify OAuth Errors**
   - Verify API credentials
   - Check redirect URLs
   - Ensure scopes are correctly set

3. **Webhook Verification Failures**
   - Verify webhook secret
   - Check HMAC signature calculation
   - Ensure raw body is used for verification

### Debug Mode
Set `NODE_ENV=development` to enable detailed logging.

## 📞 Support

For technical support or questions about the backend implementation, please refer to the main README or create an issue in the repository.
