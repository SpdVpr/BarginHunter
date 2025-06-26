import { 
  db, 
  collections, 
  StoreDocument, 
  GameConfigDocument, 
  GameSessionDocument,
  GameScoreDocument,
  DiscountCodeDocument,
  AnalyticsDocument,
  CustomerDocument 
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
}

// Game configuration operations
export class GameConfigService {
  static async createOrUpdateConfig(configData: Omit<GameConfigDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const existing = await this.getConfig(configData.shopDomain);

    if (existing) {
      // Clean undefined values before update
      const cleanedData = removeUndefinedValues({
        ...configData,
        updatedAt: Timestamp.now(),
      });

      await db.collection(collections.gameConfigs).doc(existing.id).update(cleanedData);
      return existing.id;
    } else {
      const docRef = db.collection(collections.gameConfigs).doc();
      const config: GameConfigDocument = {
        ...configData,
        id: docRef.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      await docRef.set(config);
      return docRef.id;
    }
  }

  static async getConfig(shopDomain: string): Promise<GameConfigDocument | null> {
    const snapshot = await db.collection(collections.gameConfigs)
      .where('shopDomain', '==', shopDomain)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as GameConfigDocument;
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
    const docRef = db.collection(collections.gameSessions).doc();
    const session: GameSessionDocument = {
      ...sessionData,
      id: docRef.id,
      startedAt: Timestamp.now(),
    };
    
    await docRef.set(session);
    return docRef.id;
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
    await db.collection(collections.gameSessions).doc(sessionId).update({
      endedAt: Timestamp.now(),
      finalScore,
      discountEarned,
      discountCode,
      completed: true,
    });
  }

  static async getSessionsByShop(shopDomain: string, limit = 100): Promise<GameSessionDocument[]> {
    const snapshot = await db.collection(collections.gameSessions)
      .where('shopDomain', '==', shopDomain)
      .orderBy('startedAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => doc.data() as GameSessionDocument);
  }

  static async getSessionsByCustomer(shopDomain: string, customerId: string): Promise<GameSessionDocument[]> {
    const snapshot = await db.collection(collections.gameSessions)
      .where('shopDomain', '==', shopDomain)
      .where('customerId', '==', customerId)
      .orderBy('startedAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data() as GameSessionDocument);
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
    const snapshot = await db.collection(collections.gameScores)
      .where('shopDomain', '==', shopDomain)
      .where('customerId', '==', customerId)
      .orderBy('achievedAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data() as GameScoreDocument);
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

  static async markDiscountUsed(discountCode: string, orderId: string): Promise<void> {
    const snapshot = await db.collection(collections.discountCodes)
      .where('code', '==', discountCode)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        isUsed: true,
        usedAt: Timestamp.now(),
        orderId,
      });
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
