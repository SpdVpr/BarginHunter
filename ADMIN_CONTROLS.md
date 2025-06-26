# 🎛️ Bargain Hunter - Admin Controls & Widget Targeting

This document describes the enhanced administrative controls and widget targeting features for the Bargain Hunter Shopify app.

## 🎯 New Features Overview

### 1. User Percentage Targeting
Control what percentage of your store visitors see the widget:
- **Range**: 0-100%
- **Use Cases**: 
  - A/B testing (50% see widget, 50% don't)
  - Gradual rollout (start with 10%, increase to 100%)
  - Limited campaigns (only 25% of users)
- **Implementation**: Uses consistent user hashing for reliable targeting

### 2. Test Mode
Enable test mode for debugging and preview:
- **Function**: Shows widget to all users regardless of percentage settings
- **Use Cases**:
  - Testing widget appearance and functionality
  - Demonstrating to stakeholders
  - Debugging configuration issues
- **Safety**: Clearly marked in admin interface

### 3. Device Targeting
Target specific device types:
- **Options**: All devices, Desktop only, Mobile only, Tablet only
- **Use Cases**:
  - Mobile-optimized campaigns
  - Desktop-specific promotions
  - Device-appropriate experiences
- **Detection**: Uses user agent analysis

### 4. Page Load Triggers
Control when the widget appears:
- **Immediate**: Shows right after page load
- **After Delay**: Shows after specified seconds
- **On Scroll**: Shows when user scrolls down
- **On Exit Intent**: Shows when user moves mouse to leave page

### 5. Time-Based Rules
Schedule when the widget is active:
- **Time Range**: Set start and end times (HH:MM format)
- **Days of Week**: Choose specific days (Sunday=0 to Saturday=6)
- **Timezone Support**: Respects user's local timezone
- **Use Cases**: Business hours only, weekend promotions, flash sales

## 🎮 Admin Dashboard Enhancements

### Quick Controls Section
New dashboard section with immediate access to:
- **Widget Settings**: Direct link to configuration
- **Test Widget**: Opens widget in test mode
- **View Analytics**: Access to performance data

### Enhanced Settings Page
Reorganized settings with new sections:
- **Game Settings**: Core game configuration
- **Widget Settings**: Display and trigger options
- **Targeting & Display Rules**: New advanced targeting options
- **Appearance**: Visual customization
- **Business Rules**: Discount and usage rules

## 🔧 Technical Implementation

### Database Schema Updates
New fields added to `widgetSettings`:
```typescript
{
  userPercentage: number;        // 0-100
  testMode: boolean;             // true/false
  showDelay: number;             // seconds
  pageLoadTrigger: string;       // trigger type
  deviceTargeting: string;       // device type
  geoTargeting: string[];        // country codes
  timeBasedRules: {
    enabled: boolean;
    startTime?: string;          // HH:MM
    endTime?: string;            // HH:MM
    timezone?: string;
    daysOfWeek?: number[];       // 0-6
  };
}
```

### Widget Embed Script Updates
Enhanced targeting logic:
- User percentage calculation with consistent hashing
- Device detection and filtering
- Time-based rule evaluation
- Multiple trigger type support

### API Endpoints Updated
- `POST /api/dashboard/settings` - Saves new configuration options
- `GET /api/game/config/[shop]` - Returns enhanced configuration
- Widget embed script includes new targeting logic

## 📊 Usage Examples

### A/B Testing Campaign
```
User Percentage: 50%
Test Mode: false
Device Targeting: All devices
Page Load Trigger: Immediate
```

### Mobile Flash Sale
```
User Percentage: 100%
Device Targeting: Mobile only
Time Rules: Enabled (12:00-14:00, weekdays only)
Page Load Trigger: On scroll
```

### Exit Intent Recovery
```
User Percentage: 75%
Device Targeting: Desktop only
Page Load Trigger: On exit intent
Show Delay: 0 seconds
```

## 🚀 Deployment Process

### Automatic Deployment
Changes are automatically deployed via Vercel when pushed to GitHub:

1. **Commit Changes**: All updates are committed to repository
2. **Version Bump**: Package version is automatically incremented
3. **GitHub Push**: Changes are pushed to main branch
4. **Vercel Deploy**: Automatic deployment triggered
5. **Live Updates**: Changes appear in production

### Manual Deployment
Use the deployment script:
```bash
node scripts/deploy-updates.js
```

## 🎛️ Admin Interface Guide

### Accessing Settings
1. Log into Shopify admin
2. Go to Apps → Bargain Hunter
3. Click "Configure Widget" or "Settings"

### Configuring Targeting
1. Navigate to "Targeting & Display Rules" section
2. Set user percentage (0-100%)
3. Enable test mode if needed
4. Choose device targeting
5. Configure page load trigger
6. Set time-based rules if desired
7. Save settings

### Testing Configuration
1. Enable "Test Mode" in settings
2. Visit your store in new browser/incognito
3. Verify widget appears as expected
4. Disable test mode when satisfied

## 🔍 Monitoring & Analytics

### Dashboard Metrics
- Total game sessions
- Completion rates
- Discount generation and usage
- Device and timing analytics

### Performance Tracking
- Widget load times
- Conversion rates by device
- Time-based performance data
- A/B testing results

## 🛠️ Troubleshooting

### Widget Not Appearing
1. Check if game is enabled in settings
2. Verify user percentage > 0%
3. Confirm device targeting matches your device
4. Check time-based rules if enabled
5. Enable test mode for debugging

### Settings Not Saving
1. Verify all required fields are filled
2. Check browser console for errors
3. Ensure valid time format (HH:MM)
4. Confirm percentage is 0-100

### Performance Issues
1. Monitor widget load times
2. Check targeting complexity
3. Optimize time-based rules
4. Consider reducing user percentage during high traffic

## 📞 Support

For technical support or feature requests:
- Check documentation first
- Review troubleshooting section
- Contact development team with specific error messages
- Include browser console logs if applicable
