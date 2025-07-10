import {
  db,
  collections,
  StoreDocument,
  GameConfigDocument,
  GameSessionDocument,
  GameScoreDocument,
  DiscountCodeDocument,
  AnalyticsDocument,
  CustomerDocument,
  SubscriptionDocument,
  UsageTrackingDocument,
  BillingHistoryDocument,
  NotificationDocument,
  AdminAnalyticsDocument,
  AdminUserDocument
} from './firebase';
import { Timestamp } from 'firebase-admin/firestore';

// Helper function to remove undefined values from objects
function removeUndefinedValues(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefinedValues);

  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = removeUndefinedValues(value);
    }
  }
  return cleaned;
}

// Store operations
export class StoreService {
  static async createStore(storeData: Omit<StoreDocument, 'id' | 'installedAt' | 'updatedAt'>): Promise<string> {
    const docRef = db.collection(collections.stores).doc();
    const store: StoreDocument = {
      ...storeData,
      id: docRef.id,
      installedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await docRef.set(store);
    return docRef.id;
  }

  static async createOrUpdateStore(storeData: Omit<StoreDocument, 'id' | 'installedAt' | 'updatedAt'>): Promise<string> {
    const existing = await this.getStore(storeData.shopDomain);

    if (existing) {
      console.log('🔄 Updating existing store:', existing.id);
      // Update existing store but preserve installedAt
      await db.collection(collections.stores).doc(existing.id).update({
        ...storeData,
        updatedAt: Timestamp.now(),
      });
      return existing.id;
    } else {
      console.log('🔄 Creating new store');
      return await this.createStore(storeData);
    }
  }

  static async getStore(shopDomain: string): Promise<StoreDocument | null> {
    const snapshot = await db.collection(collections.stores)
      .where('shopDomain', '==', shopDomain)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as StoreDocument;
  }

  static async updateStore(shopDomain: string, updates: Partial<StoreDocument>): Promise<void> {
    const store = await this.getStore(shopDomain);
    if (!store) throw new Error('Store not found');

    await db.collection(collections.stores).doc(store.id).update({
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  static async deactivateStore(shopDomain: string): Promise<void> {
    await this.updateStore(shopDomain, { isActive: false });
  }

  static async deleteStore(shopDomain: string): Promise<void> {
    const store = await this.getStore(shopDomain);
    if (!store) return; // Store doesn't exist, nothing to delete

    await db.collection(collections.stores).doc(store.id).delete();
  }
}

// Game configuration operations
export class GameConfigService {
  static async createOrUpdateConfig(configData: Omit<GameConfigDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    console.log('🔄 createOrUpdateConfig called for shop:', configData.shopDomain);
    console.log('🔄 Config data to save:', JSON.stringify(configData, null, 2));

    const existing = await this.getConfig(configData.shopDomain);

    if (existing) {
      console.log('🔄 Updating existing config with ID:', existing.id);
      // Clean undefined values before update
      const cleanedData = removeUndefinedValues({
        ...configData,
        updatedAt: Timestamp.now(),
      });

      console.log('🔄 Cleaned data for update:', JSON.stringify(cleanedData, null, 2));
      await db.collection(collections.gameConfigs).doc(existing.id).update(cleanedData);
      console.log('🔄 Config updated successfully');
      return existing.id;
    } else {
      console.log('🔄 Creating new config');
      const docRef = db.collection(collections.gameConfigs).doc();
      const config: GameConfigDocument = {
        ...configData,
        id: docRef.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      console.log('🔄 New config to create:', JSON.stringify(config, null, 2));
      await docRef.set(config);
      console.log('🔄 Config created successfully with ID:', docRef.id);
      return docRef.id;
    }
  }

  static async getConfig(shopDomain: string): Promise<GameConfigDocument | null> {
    console.log('🔍 GameConfigService.getConfig called for shop:', shopDomain);
    const snapshot = await db.collection(collections.gameConfigs)
      .where('shopDomain', '==', shopDomain)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log('🔍 No config found for shop:', shopDomain);
      return null;
    }

    const config = snapshot.docs[0].data() as GameConfigDocument;
    console.log('🔍 Config loaded from database:', JSON.stringify(config, null, 2));
    return config;
  }

  static async updateConfig(shopDomain: string, updates: Partial<GameConfigDocument>): Promise<void> {
    const config = await this.getConfig(shopDomain);
    if (!config) throw new Error('Game config not found');

    await db.collection(collections.gameConfigs).doc(config.id).update({
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }
}

// Game session operations
export class GameSessionService {
  static async createSession(sessionData: Omit<GameSessionDocument, 'id' | 'startedAt'>): Promise<string> {
    // Use the provided sessionId as the document ID
    const sessionId = (sessionData as any).sessionId;
    if (!sessionId) {
      throw new Error('sessionId is required in sessionData');
    }

    const docRef = db.collection(collections.gameSessions).doc(sessionId);
    const session: GameSessionDocument = {
      ...sessionData,
      id: sessionId,
      startedAt: Timestamp.now(),
    };

    console.log('🎮 Creating session in Firestore:', sessionId);
    await docRef.set(session);
    console.log('🎮 Session created successfully in Firestore');
    return sessionId;
  }

  static async getSession(sessionId: string): Promise<GameSessionDocument | null> {
    const doc = await db.collection(collections.gameSessions).doc(sessionId).get();
    if (!doc.exists) return null;
    return doc.data() as GameSessionDocument;
  }

  static async completeSession(
    sessionId: string,
    finalScore: number,
    discountEarned: number,
    discountCode?: string
  ): Promise<void> {
    console.log('🎮 completeSession called for:', sessionId);
    console.log('🎮 Updating session with completed: true, discountCode:', discountCode);

    // Use set with merge to handle cases where document might not exist
    const updateData: any = {
      endedAt: Timestamp.now(),
      finalScore,
      discountEarned,
      completed: true,
    };

    // Only add discountCode if it's not undefined (Firestore doesn't like undefined values)
    if (discountCode !== undefined) {
      updateData.discountCode = discountCode;
    }

    await db.collection(collections.gameSessions).doc(sessionId).set(updateData, { merge: true });

    console.log('🎮 Session update completed successfully');
  }

  static async getSessionsByShop(shopDomain: string, limit = 100): Promise<GameSessionDocument[]> {
    // Keep orderBy since this works (index exists) - but add fallback
    try {
      const snapshot = await db.collection(collections.gameSessions)
        .where('shopDomain', '==', shopDomain)
        .orderBy('startedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameSessionDocument));
    } catch (error: any) {
      if (error.code === 9) {
        // Fallback without orderBy if index missing
        const snapshot = await db.collection(collections.gameSessions)
          .where('shopDomain', '==', shopDomain)
          .limit(limit)
          .get();

        const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameSessionDocument));
        return sessions.sort((a, b) => {
          const dateA = a.startedAt.toDate();
          const dateB = b.startedAt.toDate();
          return dateB.getTime() - dateA.getTime();
        });
      }
      throw error;
    }
  }

  static async getSessionsByCustomer(shopDomain: string, customerId: string): Promise<GameSessionDocument[]> {
    // Remove orderBy to avoid potential index issues
    const snapshot = await db.collection(collections.gameSessions)
      .where('shopDomain', '==', shopDomain)
      .where('customerId', '==', customerId)
      .get();

    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameSessionDocument));
    return sessions.sort((a, b) => {
      const dateA = a.startedAt.toDate();
      const dateB = b.startedAt.toDate();
      return dateB.getTime() - dateA.getTime();
    });
  }

  static async deleteSession(sessionId: string): Promise<void> {
    await db.collection(collections.gameSessions).doc(sessionId).delete();
  }


}

// Game score operations
export class GameScoreService {
  static async recordScore(scoreData: Omit<GameScoreDocument, 'id' | 'achievedAt'>): Promise<string> {
    const docRef = db.collection(collections.gameScores).doc();
    const score: GameScoreDocument = {
      ...scoreData,
      id: docRef.id,
      achievedAt: Timestamp.now(),
    };
    
    await docRef.set(score);
    return docRef.id;
  }

  static async getTopScores(shopDomain: string, limit = 10): Promise<GameScoreDocument[]> {
    const snapshot = await db.collection(collections.gameScores)
      .where('shopDomain', '==', shopDomain)
      .orderBy('score', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => doc.data() as GameScoreDocument);
  }

  static async getCustomerScores(shopDomain: string, customerId: string): Promise<GameScoreDocument[]> {
    // Remove orderBy to avoid index requirement - sort in memory instead
    const snapshot = await db.collection(collections.gameScores)
      .where('shopDomain', '==', shopDomain)
      .where('customerId', '==', customerId)
      .get();

    const scores = snapshot.docs.map(doc => doc.data() as GameScoreDocument);

    // Sort in memory by achievedAt desc
    return scores.sort((a, b) => {
      const dateA = a.achievedAt.toDate();
      const dateB = b.achievedAt.toDate();
      return dateB.getTime() - dateA.getTime();
    });
  }

  static async getScoresByShop(shopDomain: string, limit = 100): Promise<GameScoreDocument[]> {
    // Remove orderBy to avoid index requirement - sort in memory instead
    const snapshot = await db.collection(collections.gameScores)
      .where('shopDomain', '==', shopDomain)
      .limit(limit)
      .get();

    const scores = snapshot.docs.map(doc => doc.data() as GameScoreDocument);

    // Sort in memory by achievedAt desc
    return scores.sort((a, b) => {
      const dateA = a.achievedAt.toDate();
      const dateB = b.achievedAt.toDate();
      return dateB.getTime() - dateA.getTime();
    });
  }
}

// Discount code operations
export class DiscountService {
  static async createDiscountRecord(discountData: Omit<DiscountCodeDocument, 'id' | 'createdAt'>): Promise<string> {
    const docRef = db.collection(collections.discountCodes).doc();
    const discount: DiscountCodeDocument = {
      ...discountData,
      id: docRef.id,
      createdAt: Timestamp.now(),
    };
    
    await docRef.set(discount);
    return docRef.id;
  }

  static async markDiscountUsed(
    discountCode: string,
    orderId: string,
    orderData?: {
      orderValue: number;
      discountAmount: number;
      currency: string;
      customerEmail?: string;
      orderDate: Date;
      shopDomain: string;
    }
  ): Promise<void> {
    const snapshot = await db.collection(collections.discountCodes)
      .where('code', '==', discountCode)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const updateData: any = {
        isUsed: true,
        usedAt: Timestamp.now(),
        orderId,
      };

      // Add order data if provided
      if (orderData) {
        updateData.orderValue = orderData.orderValue;
        updateData.discountAmount = orderData.discountAmount;
        updateData.currency = orderData.currency;
        updateData.actualRevenue = orderData.orderValue - orderData.discountAmount;
        if (orderData.customerEmail) {
          updateData.orderCustomerEmail = orderData.customerEmail;
        }
        updateData.orderDate = Timestamp.fromDate(orderData.orderDate);
      }

      await snapshot.docs[0].ref.update(updateData);
    }
  }

  static async getDiscountsByShop(shopDomain: string, limit = 100): Promise<DiscountCodeDocument[]> {
    const snapshot = await db.collection(collections.discountCodes)
      .where('shopDomain', '==', shopDomain)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => doc.data() as DiscountCodeDocument);
  }
}

// Customer operations
export class CustomerService {
  static async createOrUpdateCustomer(customerData: Omit<CustomerDocument, 'id' | 'firstPlayedAt' | 'lastPlayedAt'>): Promise<string> {
    const existing = await this.getCustomer(customerData.shopDomain, customerData.customerId || customerData.email!);
    
    if (existing) {
      await db.collection(collections.customers).doc(existing.id).update({
        ...customerData,
        lastPlayedAt: Timestamp.now(),
      });
      return existing.id;
    } else {
      const docRef = db.collection(collections.customers).doc();
      const customer: CustomerDocument = {
        ...customerData,
        id: docRef.id,
        firstPlayedAt: Timestamp.now(),
        lastPlayedAt: Timestamp.now(),
      };
      
      await docRef.set(customer);
      return docRef.id;
    }
  }

  static async getCustomer(shopDomain: string, identifier: string): Promise<CustomerDocument | null> {
    let snapshot = await db.collection(collections.customers)
      .where('shopDomain', '==', shopDomain)
      .where('customerId', '==', identifier)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      snapshot = await db.collection(collections.customers)
        .where('shopDomain', '==', shopDomain)
        .where('email', '==', identifier)
        .limit(1)
        .get();
    }
    
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as CustomerDocument;
  }

  static async getCustomersByShop(shopDomain: string, limit = 100): Promise<CustomerDocument[]> {
    // Remove orderBy to avoid index requirement - sort in memory instead
    const snapshot = await db.collection(collections.customers)
      .where('shopDomain', '==', shopDomain)
      .limit(limit)
      .get();

    const customers = snapshot.docs.map(doc => doc.data() as CustomerDocument);

    // Sort in memory by lastPlayedAt desc (handle null values)
    return customers.sort((a, b) => {
      const dateA = a.lastPlayedAt ? a.lastPlayedAt.toDate() : new Date(0);
      const dateB = b.lastPlayedAt ? b.lastPlayedAt.toDate() : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }

  static async updateCustomerStats(
    shopDomain: string,
    identifier: string,
    score: number,
    discountEarned: number
  ): Promise<void> {
    const customer = await this.getCustomer(shopDomain, identifier);
    if (!customer) return;

    const updates = {
      totalSessions: customer.totalSessions + 1,
      totalScore: customer.totalScore + score,
      bestScore: Math.max(customer.bestScore, score),
      totalDiscountsEarned: customer.totalDiscountsEarned + discountEarned,
      lastPlayedAt: Timestamp.now(),
    };

    await db.collection(collections.customers).doc(customer.id).update(updates);
  }
}

// Subscription management service
export class SubscriptionService {
  static async createSubscription(subscriptionData: Omit<SubscriptionDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = db.collection(collections.subscriptions).doc();
    const subscription: SubscriptionDocument = {
      ...subscriptionData,
      id: docRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await docRef.set(subscription);
    return docRef.id;
  }

  static async getSubscription(shopDomain: string): Promise<SubscriptionDocument | null> {
    const snapshot = await db.collection(collections.subscriptions)
      .where('shopDomain', '==', shopDomain)
      .where('status', 'in', ['active', 'trialing', 'past_due'])
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as SubscriptionDocument;
  }

  static async updateSubscription(shopDomain: string, updates: Partial<SubscriptionDocument>): Promise<void> {
    const subscription = await this.getSubscription(shopDomain);
    if (!subscription) throw new Error('Subscription not found');

    await db.collection(collections.subscriptions).doc(subscription.id).update({
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  static async cancelSubscription(shopDomain: string, cancelAtPeriodEnd: boolean = true): Promise<void> {
    await this.updateSubscription(shopDomain, {
      cancelAtPeriodEnd,
      status: cancelAtPeriodEnd ? 'active' : 'cancelled',
    });
  }

  static async getDefaultPlanLimits(plan: 'free' | 'starter' | 'pro' | 'enterprise') {
    const planLimits = {
      free: {
        maxGameSessions: -1, // unlimited
        maxDiscountCodes: 100,
        analyticsRetentionDays: -1, // unlimited
        customBranding: true,
        advancedAnalytics: true,
        prioritySupport: true,
        webhookIntegrations: true,
        abTesting: true,
        multipleGameTypes: true,
        fraudProtection: true,
      },
      starter: {
        maxGameSessions: -1, // unlimited
        maxDiscountCodes: 1000,
        analyticsRetentionDays: -1, // unlimited
        customBranding: true,
        advancedAnalytics: true,
        prioritySupport: true,
        webhookIntegrations: true,
        abTesting: true,
        multipleGameTypes: true,
        fraudProtection: true,
      },
      pro: {
        maxGameSessions: -1, // unlimited
        maxDiscountCodes: 10000,
        analyticsRetentionDays: -1, // unlimited
        customBranding: true,
        advancedAnalytics: true,
        prioritySupport: true,
        webhookIntegrations: true,
        abTesting: true,
        multipleGameTypes: true,
        fraudProtection: true,
      },
      enterprise: {
        maxGameSessions: -1, // unlimited
        maxDiscountCodes: 100000,
        analyticsRetentionDays: -1, // unlimited
        customBranding: true,
        advancedAnalytics: true,
        prioritySupport: true,
        webhookIntegrations: true,
        abTesting: true,
        multipleGameTypes: true,
        fraudProtection: true,
      },
    };

    return planLimits[plan];
  }
}

// Usage tracking service
export class UsageTrackingService {
  static async getCurrentUsage(shopDomain: string): Promise<UsageTrackingDocument | null> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const currentYear = new Date().getFullYear();

    const snapshot = await db.collection(collections.usageTracking)
      .where('shopDomain', '==', shopDomain)
      .where('month', '==', currentMonth)
      .where('year', '==', currentYear)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as UsageTrackingDocument;
  }

  static async initializeUsageTracking(shopDomain: string, planLimits: any): Promise<string> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentYear = new Date().getFullYear();

    const docRef = db.collection(collections.usageTracking).doc();
    const usage: UsageTrackingDocument = {
      id: docRef.id,
      shopDomain,
      month: currentMonth,
      year: currentYear,
      usage: {
        gameSessions: 0, // Track but no limits (always unlimited)
        discountCodesGenerated: 0, // This is the only limited resource
        analyticsRequests: 0, // Track but no limits (always unlimited)
        webhookCalls: 0, // Track but no limits (always unlimited)
        abTestVariants: 0, // Track but no limits (always unlimited)
      },
      limits: {
        maxGameSessions: -1, // Always unlimited for all plans
        maxDiscountCodes: planLimits.maxDiscountCodes, // Only this varies by plan
        maxAnalyticsRequests: -1, // Always unlimited for all plans
        maxWebhookCalls: -1, // Always unlimited for all plans
        maxAbTestVariants: -1, // Always unlimited for all plans
      },
      warnings: {
        gameSessionsWarning80: false, // Not used since unlimited
        gameSessionsWarning95: false, // Not used since unlimited
        discountCodesWarning80: false, // Only discount codes have warnings
        discountCodesWarning95: false, // Only discount codes have warnings
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await docRef.set(usage);
    return docRef.id;
  }

  static async incrementUsage(
    shopDomain: string,
    usageType: 'gameSessions' | 'discountCodesGenerated' | 'analyticsRequests' | 'webhookCalls' | 'abTestVariants',
    amount: number = 1
  ): Promise<{ success: boolean; limitReached: boolean; warningTriggered?: boolean }> {
    let usage = await this.getCurrentUsage(shopDomain);

    if (!usage) {
      // Initialize usage tracking if it doesn't exist
      const subscription = await SubscriptionService.getSubscription(shopDomain);
      const planLimits = await SubscriptionService.getDefaultPlanLimits(subscription?.plan || 'free');
      await this.initializeUsageTracking(shopDomain, planLimits);
      usage = await this.getCurrentUsage(shopDomain);
      if (!usage) throw new Error('Failed to initialize usage tracking');
    }

    const currentUsage = usage.usage[usageType];
    const limit = usage.limits[`max${usageType.charAt(0).toUpperCase() + usageType.slice(1)}` as keyof typeof usage.limits];

    // Only check limits for discount codes - all other features are unlimited
    if (usageType === 'discountCodesGenerated' && limit !== -1 && currentUsage + amount > limit) {
      return { success: false, limitReached: true };
    }

    // Update usage
    const newUsage = currentUsage + amount;
    const updates: any = {
      [`usage.${usageType}`]: newUsage,
      updatedAt: Timestamp.now(),
    };

    // Check for warning thresholds - only for discount codes
    let warningTriggered = false;
    if (usageType === 'discountCodesGenerated' && limit !== -1) {
      const percentage = (newUsage / limit) * 100;

      if (percentage >= 80 && !usage.warnings[`${usageType}Warning80` as keyof typeof usage.warnings]) {
        updates[`warnings.${usageType}Warning80`] = true;
        warningTriggered = true;
        // Trigger 80% warning notification
        await NotificationService.createUsageWarning(shopDomain, usageType, newUsage, limit, 80);
      }

      if (percentage >= 95 && !usage.warnings[`${usageType}Warning95` as keyof typeof usage.warnings]) {
        updates[`warnings.${usageType}Warning95`] = true;
        warningTriggered = true;
        // Trigger 95% warning notification
        await NotificationService.createUsageWarning(shopDomain, usageType, newUsage, limit, 95);
      }
    }

    await db.collection(collections.usageTracking).doc(usage.id).update(updates);

    return { success: true, limitReached: false, warningTriggered };
  }
}

// Billing history service
export class BillingHistoryService {
  static async createBillingRecord(billingData: Omit<BillingHistoryDocument, 'id' | 'createdAt'>): Promise<string> {
    const docRef = db.collection(collections.billingHistory).doc();
    const billing: BillingHistoryDocument = {
      ...billingData,
      id: docRef.id,
      createdAt: Timestamp.now(),
    };

    await docRef.set(billing);
    return docRef.id;
  }

  static async getBillingHistory(shopDomain: string, limit: number = 50): Promise<BillingHistoryDocument[]> {
    const snapshot = await db.collection(collections.billingHistory)
      .where('shopDomain', '==', shopDomain)
      .orderBy('billingDate', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as BillingHistoryDocument);
  }

  static async updateBillingRecord(billingId: string, updates: Partial<BillingHistoryDocument>): Promise<void> {
    await db.collection(collections.billingHistory).doc(billingId).update(updates);
  }
}

// Notification service
export class NotificationService {
  static async createNotification(notificationData: Omit<NotificationDocument, 'id' | 'createdAt'>): Promise<string> {
    const docRef = db.collection(collections.notifications).doc();
    const notification: NotificationDocument = {
      ...notificationData,
      id: docRef.id,
      createdAt: Timestamp.now(),
    };

    await docRef.set(notification);
    return docRef.id;
  }

  static async getNotifications(shopDomain: string, unreadOnly: boolean = false): Promise<NotificationDocument[]> {
    let query = db.collection(collections.notifications)
      .where('shopDomain', '==', shopDomain);

    if (unreadOnly) {
      query = query.where('isRead', '==', false);
    }

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return snapshot.docs.map(doc => doc.data() as NotificationDocument);
  }

  static async markAsRead(notificationId: string): Promise<void> {
    await db.collection(collections.notifications).doc(notificationId).update({
      isRead: true,
      readAt: Timestamp.now(),
    });
  }

  static async createUsageWarning(
    shopDomain: string,
    usageType: string,
    currentUsage: number,
    limit: number,
    percentage: number
  ): Promise<string> {
    const title = `${percentage}% Usage Warning`;
    const message = `You've used ${currentUsage} of ${limit} ${usageType} (${percentage}%). Consider upgrading to avoid service interruption.`;

    return this.createNotification({
      shopDomain,
      type: 'usage_warning',
      title,
      message,
      priority: percentage >= 95 ? 'high' : 'medium',
      isRead: false,
      actionRequired: percentage >= 95,
      actionUrl: '/dashboard/billing',
      actionText: 'Upgrade Plan',
      metadata: {
        usageType,
        currentUsage,
        limit,
        suggestedPlan: 'pro',
      },
    });
  }

  static async createUpgradeSuggestion(shopDomain: string, reason: string): Promise<string> {
    return this.createNotification({
      shopDomain,
      type: 'upgrade_suggestion',
      title: 'Upgrade Recommended',
      message: `Based on your usage patterns, we recommend upgrading to Pro plan. ${reason}`,
      priority: 'medium',
      isRead: false,
      actionRequired: false,
      actionUrl: '/dashboard/billing',
      actionText: 'View Plans',
      metadata: {
        suggestedPlan: 'pro',
        reason,
      },
    });
  }
}

// Admin analytics service for business intelligence
export class AdminAnalyticsService {
  static async generateDailyAnalytics(date: string = new Date().toISOString().slice(0, 10)): Promise<string> {
    console.log('📊 Generating admin analytics for date:', date);

    try {
      // Get all subscriptions
      const subscriptionsSnapshot = await db.collection(collections.subscriptions).get();
      const subscriptions = subscriptionsSnapshot.docs.map(doc => doc.data() as SubscriptionDocument);

      // Get all usage tracking for the month
      const currentMonth = date.slice(0, 7); // YYYY-MM
      const usageSnapshot = await db.collection(collections.usageTracking)
        .where('month', '==', currentMonth)
        .get();
      const usageData = usageSnapshot.docs.map(doc => doc.data() as UsageTrackingDocument);

      // Get billing history for the month
      const startOfMonth = new Date(date.slice(0, 7) + '-01');
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

      const billingSnapshot = await db.collection(collections.billingHistory)
        .where('billingDate', '>=', Timestamp.fromDate(startOfMonth))
        .where('billingDate', '<=', Timestamp.fromDate(endOfMonth))
        .get();
      const billingData = billingSnapshot.docs.map(doc => doc.data() as BillingHistoryDocument);

      // Calculate metrics
      const metrics = this.calculateMetrics(subscriptions, usageData, billingData);

      // Create analytics document
      const docRef = db.collection(collections.adminAnalytics).doc();
      const analytics: AdminAnalyticsDocument = {
        id: docRef.id,
        date,
        metrics,
        planMetrics: this.calculatePlanMetrics(subscriptions, usageData),
        topCountries: [], // TODO: Implement geographic tracking
        systemMetrics: {
          apiCalls: 0, // TODO: Implement API tracking
          errorRate: 0,
          averageResponseTime: 0,
          uptime: 99.9
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await docRef.set(analytics);
      console.log('✅ Admin analytics generated:', docRef.id);
      return docRef.id;

    } catch (error) {
      console.error('❌ Failed to generate admin analytics:', error);
      throw error;
    }
  }

  private static calculateMetrics(
    subscriptions: SubscriptionDocument[],
    usageData: UsageTrackingDocument[],
    billingData: BillingHistoryDocument[]
  ) {
    const activeShops = subscriptions.filter(s => s.status === 'active').length;
    const totalRevenue = billingData
      .filter(b => b.status === 'accepted')
      .reduce((sum, b) => sum + b.amount, 0);

    const planDistribution = {
      free: subscriptions.filter(s => s.plan === 'free').length,
      starter: subscriptions.filter(s => s.plan === 'starter').length,
      pro: subscriptions.filter(s => s.plan === 'pro').length,
      enterprise: subscriptions.filter(s => s.plan === 'enterprise').length,
    };

    const totalGameSessions = usageData.reduce((sum, u) => sum + u.usage.gameSessions, 0);
    const totalDiscountCodes = usageData.reduce((sum, u) => sum + u.usage.discountCodesGenerated, 0);

    return {
      totalRevenue,
      monthlyRecurringRevenue: totalRevenue, // Simplified for now
      newRevenue: totalRevenue, // TODO: Calculate properly
      churnedRevenue: 0, // TODO: Calculate properly

      totalShops: subscriptions.length,
      activeShops,
      newShops: 0, // TODO: Calculate new shops this period
      churnedShops: 0, // TODO: Calculate churned shops

      planDistribution,

      totalGameSessions,
      totalDiscountCodes,
      averageDiscountCodesPerShop: activeShops > 0 ? totalDiscountCodes / activeShops : 0,

      freeToStarterConversion: 0, // TODO: Calculate conversion rates
      starterToProConversion: 0,
      proToEnterpriseConversion: 0,

      totalNotifications: 0, // TODO: Count notifications
      upgradeRecommendations: 0,
      limitWarnings: 0,
    };
  }

  private static calculatePlanMetrics(subscriptions: SubscriptionDocument[], usageData: UsageTrackingDocument[]) {
    const plans = ['free', 'starter', 'pro', 'enterprise'];
    const planMetrics: { [key: string]: any } = {};

    plans.forEach(plan => {
      const planSubs = subscriptions.filter(s => s.plan === plan);
      const planUsage = usageData.filter(u => {
        const sub = subscriptions.find(s => s.shopDomain === u.shopDomain);
        return sub?.plan === plan;
      });

      planMetrics[plan] = {
        count: planSubs.length,
        revenue: planSubs.reduce((sum, s) => sum + s.price, 0),
        averageUsage: planUsage.length > 0
          ? planUsage.reduce((sum, u) => sum + u.usage.discountCodesGenerated, 0) / planUsage.length
          : 0,
        churnRate: 0, // TODO: Calculate churn rate
      };
    });

    return planMetrics;
  }

  static async getAnalytics(startDate: string, endDate: string): Promise<AdminAnalyticsDocument[]> {
    const snapshot = await db.collection(collections.adminAnalytics)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as AdminAnalyticsDocument);
  }

  static async getLatestAnalytics(): Promise<AdminAnalyticsDocument | null> {
    const snapshot = await db.collection(collections.adminAnalytics)
      .orderBy('date', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as AdminAnalyticsDocument;
  }
}

// Admin user management service
export class AdminUserService {
  static async createAdminUser(userData: Omit<AdminUserDocument, 'id' | 'createdAt'>): Promise<string> {
    const docRef = db.collection(collections.adminUsers).doc();
    const adminUser: AdminUserDocument = {
      ...userData,
      id: docRef.id,
      createdAt: Timestamp.now(),
    };

    await docRef.set(adminUser);
    return docRef.id;
  }

  static async getAdminUser(email: string): Promise<AdminUserDocument | null> {
    const snapshot = await db.collection(collections.adminUsers)
      .where('email', '==', email)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as AdminUserDocument;
  }

  static async updateLastLogin(email: string): Promise<void> {
    const user = await this.getAdminUser(email);
    if (!user) return;

    await db.collection(collections.adminUsers).doc(user.id).update({
      lastLoginAt: Timestamp.now(),
    });
  }

  static async hasPermission(email: string, permission: keyof AdminUserDocument['permissions']): Promise<boolean> {
    const user = await this.getAdminUser(email);
    if (!user) return false;

    return user.permissions[permission] || false;
  }
}
