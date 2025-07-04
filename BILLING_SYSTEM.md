# 💳 Bargain Hunter - Billing System Documentation

## 📊 Cenové kategorie

### 🆓 FREE TIER - $0/měsíc
- **100 discount codes/měsíc**
- Všechny funkce aplikace
- Unlimited game sessions
- Advanced analytics & reporting
- Custom branding & themes
- A/B testing capabilities
- Priority support
- Webhook integrations
- Multiple game types
- Advanced fraud protection

### 💼 STARTER - $19/měsíc
- **1,000 discount codes/měsíc**
- Všechny funkce aplikace (stejné jako Free)
- 14 dní trial zdarma

### 🚀 PRO - $39/měsíc
- **10,000 discount codes/měsíc**
- Všechny funkce aplikace (stejné jako Free)
- 14 dní trial zdarma

### 🏢 ENTERPRISE - $99/měsíc
- **100,000 discount codes/měsíc**
- Všechny funkce aplikace (stejné jako Free)
- 14 dní trial zdarma

## 🔧 Technická implementace

### Databázová struktura

#### Subscriptions Collection
```typescript
interface SubscriptionDocument {
  id: string;
  shopDomain: string;
  shopifyChargeId?: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  billingCycle: 'monthly' | 'yearly';
  price: number;
  currency: string;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  planLimits: {
    maxGameSessions: number; // Always -1 (unlimited)
    maxDiscountCodes: number; // Varies by plan
    // All other features always true/unlimited
  };
}
```

#### Usage Tracking Collection
```typescript
interface UsageTrackingDocument {
  id: string;
  shopDomain: string;
  month: string; // YYYY-MM
  usage: {
    gameSessions: number; // Tracked but unlimited
    discountCodesGenerated: number; // Only limited resource
    analyticsRequests: number; // Tracked but unlimited
  };
  limits: {
    maxGameSessions: -1; // Always unlimited
    maxDiscountCodes: number; // Only this varies
    maxAnalyticsRequests: -1; // Always unlimited
  };
}
```

### API Endpoints

#### Billing Management
- `POST /api/billing/subscribe` - Create subscription
- `GET /api/billing/activate` - Activate subscription
- `GET /api/billing/status` - Get billing status

#### Usage Tracking
- `GET /api/usage/check-limits` - Check usage limits
- `GET /api/game/check-discount-limit` - Check discount code limit

#### Notifications
- `GET /api/notifications` - Get notifications
- `POST /api/notifications/mark-read` - Mark as read

#### Upgrade Recommendations
- `GET /api/upgrade/recommendations` - Get upgrade suggestions

### Shopify Integration

#### Required Scopes
```javascript
scopes: [
  'read_products',
  'write_discounts',
  'read_customers',
  'write_script_tags',
  'read_orders',
  'write_recurring_application_charges' // For billing
]
```

#### Webhooks
- `app_subscriptions/update` - Billing status changes
- `orders/create` - Track discount usage
- `app/uninstalled` - Cleanup

## 🔄 Usage Tracking Flow

### 1. Game Session Completion
```typescript
// In finish-session.ts
if (discountEarned > 0) {
  // Check limits BEFORE creating discount
  const limitCheck = await UsageTrackingService.incrementUsage(
    shopDomain, 
    'discountCodesGenerated', 
    1
  );
  
  if (limitCheck.limitReached) {
    // Don't create discount, show upgrade message
    discountEarned = 0;
    message = "Upgrade for more discount codes";
  } else {
    // Create discount code
    discountCode = generateDiscountCode();
  }
}
```

### 2. Automatic Warnings
- **80% usage**: Warning notification
- **95% usage**: Urgent warning
- **100% usage**: Limit reached, no more codes

### 3. Upgrade Recommendations
- Automatic suggestions based on usage patterns
- Personalized messages
- Smart plan recommendations

## 📈 Dashboard Features

### Billing Dashboard (`/dashboard/billing`)
- Current plan overview
- Usage statistics (only discount codes have limits)
- Upgrade options
- Billing history
- Plan comparison

### Notifications
- Usage warnings
- Upgrade suggestions
- Payment reminders
- Billing status updates

## 🧪 Testing

### Test API Endpoint
```bash
POST /api/test/billing-system
{
  "shop": "test-shop.myshopify.com",
  "testType": "full_system"
}
```

### Test Types
- `subscription_creation` - Test subscription management
- `usage_tracking` - Test usage limits
- `billing_history` - Test billing records
- `notifications` - Test notification system
- `upgrade_recommendations` - Test upgrade logic
- `plan_limits` - Test plan configurations
- `full_system` - Complete system test

## 🔐 Security

### Webhook Verification
```typescript
const hmac = req.headers['x-shopify-hmac-sha256'];
const hash = crypto
  .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET!)
  .update(body, 'utf8')
  .digest('base64');

if (hash !== hmac) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### Rate Limiting
- Usage tracking prevents abuse
- Automatic limit enforcement
- Graceful degradation when limits reached

## 📊 Analytics & Monitoring

### Key Metrics
- Monthly recurring revenue (MRR)
- Plan distribution
- Usage patterns
- Upgrade conversion rates
- Churn analysis

### Alerts
- Failed payments
- High usage patterns
- Upgrade opportunities
- System errors

## 🚀 Deployment Checklist

### Environment Variables
```bash
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
FIREBASE_SERVICE_ACCOUNT_KEY=your_firebase_key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Shopify App Configuration
1. Add billing scopes
2. Configure webhooks
3. Set up recurring charges
4. Test in development mode

### Database Setup
1. Initialize Firebase collections
2. Set up indexes for performance
3. Configure security rules
4. Test data flow

## 📞 Support

### Customer Support Flow
1. Check current plan and usage
2. Review billing history
3. Analyze usage patterns
4. Provide upgrade recommendations
5. Handle billing issues

### Common Issues
- Payment failures → Update payment method
- Usage limit reached → Upgrade plan
- Billing disputes → Review usage data
- Technical issues → Check logs and metrics

## 🔄 Future Enhancements

### Planned Features
- Annual billing discounts
- Custom enterprise plans
- Usage-based pricing tiers
- Advanced analytics dashboard
- Multi-currency support
- Automated dunning management

### Optimization Opportunities
- Predictive usage modeling
- Smart upgrade timing
- Personalized pricing
- Advanced fraud detection
- Performance monitoring
