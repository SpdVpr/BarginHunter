# 🚀 Bargain Hunter Deployment Guide

This guide covers deploying the Bargain Hunter Shopify app to production.

## 📋 Prerequisites

- Shopify Partner Account
- Vercel Account (recommended) or other hosting platform
- Domain name (optional but recommended)
- Firebase project (for database)

## 🏗️ Production Setup

### 1. Shopify Partner Dashboard

1. **Create a new app** in your Shopify Partner dashboard
2. **Set app URLs**:
   - App URL: `https://your-domain.vercel.app`
   - Allowed redirection URLs: `https://your-domain.vercel.app/api/auth/callback`
3. **Configure app settings**:
   - App name: "Bargain Hunter"
   - App handle: "bargain-hunter"
   - Contact email: your-email@domain.com
4. **Set required scopes**:
   - `read_products`
   - `write_discounts`
   - `read_customers`
   - `write_script_tags`
   - `read_orders`

### 2. Environment Variables

Create production environment variables:

```env
# Shopify Configuration
SHOPIFY_API_KEY=your_production_api_key
SHOPIFY_API_SECRET=your_production_api_secret
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
SHOPIFY_SCOPES=read_products,write_discounts,read_customers,write_script_tags,read_orders

# Application URLs
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_WIDGET_URL=https://your-domain.vercel.app/widget
NEXT_PUBLIC_API_BASE=https://your-domain.vercel.app/api
NEXT_PUBLIC_SHOPIFY_API_KEY=your_production_api_key

# Firebase Configuration
FIREBASE_PROJECT_ID=bargain-hunter-prod
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=bargain-hunter-prod.firebaseapp.com
FIREBASE_DATABASE_URL=https://bargain-hunter-prod.firebaseio.com
FIREBASE_STORAGE_BUCKET=bargain-hunter-prod.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Security
JWT_SECRET=your_secure_jwt_secret_min_32_chars
ENCRYPTION_KEY=your_encryption_key_32_chars
RATE_LIMIT_SECRET=your_rate_limit_secret

# External Services
SENTRY_DSN=your_sentry_dsn_for_error_tracking
VERCEL_ANALYTICS_ID=your_vercel_analytics_id
```

### 3. Firebase Setup

1. **Create Firebase project**:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

2. **Configure Firestore database**:
   - Enable Firestore in Firebase Console
   - Set up security rules
   - Create initial collections

3. **Firestore Security Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Shop settings - only accessible by authenticated shop owners
       match /shops/{shopId} {
         allow read, write: if request.auth != null && request.auth.uid == shopId;
       }
       
       // Game sessions - read/write for game functionality
       match /gameSessions/{sessionId} {
         allow read, write: if true; // Public for game functionality
       }
       
       // Discount codes - read only for validation
       match /discountCodes/{codeId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
       
       // Analytics - shop owners only
       match /analytics/{shopId} {
         allow read, write: if request.auth != null && request.auth.uid == shopId;
       }
     }
   }
   ```

## 🌐 Vercel Deployment

### 1. Connect Repository

1. **Import project** in Vercel dashboard
2. **Connect GitHub repository**
3. **Configure build settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### 2. Environment Variables

Add all production environment variables in Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add each variable from the list above
- Set environment to "Production"

### 3. Domain Configuration

1. **Add custom domain** (optional):
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS records

2. **Update Shopify app URLs** with your final domain

### 4. Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch for automatic deployment
git push origin main
```

## 🔧 Database Migration

### Initial Database Setup

Run these commands to set up your production database:

```bash
# Install Firebase Admin SDK
npm install firebase-admin

# Run database initialization script
node scripts/init-database.js
```

### Database Schema

The application uses these Firestore collections:

```
shops/
├── {shopDomain}/
    ├── settings: GameConfiguration
    ├── analytics: DailyAnalytics[]
    └── discountCodes: DiscountCode[]

gameSessions/
├── {sessionId}: GameSession

analytics/
├── daily/
    └── {date}: DailyAnalytics
```

## 🔒 Security Configuration

### 1. CORS Settings

Update `next.config.js` for production:

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://*.myshopify.com' },
        // ... other headers
      ]
    }
  ]
}
```

### 2. Rate Limiting

Configure rate limiting for production:

```javascript
// In API routes
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
};
```

### 3. Webhook Verification

Ensure webhook verification is enabled:

```javascript
// Verify Shopify webhooks
const hmac = req.headers['x-shopify-hmac-sha256'];
const body = JSON.stringify(req.body);
const hash = crypto
  .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
  .update(body, 'utf8')
  .digest('base64');

if (hash !== hmac) {
  return res.status(401).send('Unauthorized');
}
```

## 📊 Monitoring & Analytics

### 1. Error Tracking

Set up Sentry for error monitoring:

```bash
npm install @sentry/nextjs
```

Configure in `next.config.js`:

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: "your-org",
  project: "bargain-hunter",
});
```

### 2. Performance Monitoring

- Enable Vercel Analytics
- Set up custom metrics tracking
- Monitor API response times
- Track game performance metrics

### 3. Logging

Configure structured logging:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});
```

## 🧪 Testing in Production

### 1. Smoke Tests

Run these tests after deployment:

```bash
# Test API endpoints
curl https://your-domain.vercel.app/api/health
curl https://your-domain.vercel.app/api/game/config/test-shop.myshopify.com

# Test widget embed
curl https://your-domain.vercel.app/widget/embed.js?shop=test-shop.myshopify.com
```

### 2. Game Testing

1. **Install app** on a development store
2. **Test game functionality**:
   - Game loads correctly
   - Controls work on desktop/mobile
   - Scoring system functions
   - Discount codes generate
3. **Test widget integration**:
   - Embed script loads
   - Widget displays correctly
   - Game opens in iframe

### 3. Load Testing

Use tools like Artillery or k6 to test under load:

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build application
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 📈 Post-Deployment

### 1. App Store Submission

1. **Complete app listing**:
   - App description and screenshots
   - Pricing information
   - Support contact details
2. **Submit for review**
3. **Address any feedback**
4. **Publish to Shopify App Store**

### 2. Marketing Setup

1. **Create landing page**
2. **Set up analytics tracking**
3. **Prepare marketing materials**
4. **Plan launch strategy**

### 3. Support Infrastructure

1. **Set up support email**
2. **Create documentation site**
3. **Prepare FAQ and troubleshooting guides**
4. **Set up monitoring alerts**

## 🆘 Troubleshooting

### Common Issues

1. **App installation fails**:
   - Check OAuth configuration
   - Verify redirect URLs
   - Ensure scopes are correct

2. **Game doesn't load**:
   - Check CORS settings
   - Verify API endpoints
   - Test embed script

3. **Discounts not working**:
   - Verify Shopify API permissions
   - Check discount code creation
   - Test webhook handling

### Support Checklist

- [ ] All environment variables set
- [ ] Database properly configured
- [ ] Shopify app settings correct
- [ ] Domain and SSL configured
- [ ] Monitoring and alerts active
- [ ] Backup and recovery tested

---

🎉 **Congratulations!** Your Bargain Hunter app is now live in production!
