// Safe Firebase initialization with better error handling

let firebaseApp: any = null;
let firebaseDb: any = null;
let firebaseAuth: any = null;

function getPrivateKey(): string {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY is not set');
  }

  // Try to decode from base64 if it doesn't start with -----BEGIN
  if (!privateKey.startsWith('-----BEGIN')) {
    try {
      privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
      console.log('Decoded private key from base64');
    } catch (error) {
      console.log('Failed to decode from base64, using as-is');
    }
  }

  // Replace escaped newlines with actual newlines
  privateKey = privateKey.replace(/\\n/g, '\n');

  return privateKey;
}

export async function initFirebase() {
  try {
    if (firebaseApp) {
      return { app: firebaseApp, db: firebaseDb, auth: firebaseAuth };
    }

    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    const { getAuth } = await import('firebase-admin/auth');

    if (getApps().length === 0) {
      const privateKey = getPrivateKey();

      firebaseApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      firebaseApp = getApps()[0];
    }

    firebaseDb = getFirestore(firebaseApp);
    firebaseAuth = getAuth(firebaseApp);

    return { app: firebaseApp, db: firebaseDb, auth: firebaseAuth };
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    throw error;
  }
}

export async function getFirebaseDb() {
  try {
    const { db } = await initFirebase();
    return db;
  } catch (error) {
    console.error('Failed to get Firebase DB:', error);
    return null;
  }
}

export async function getFirebaseAuth() {
  try {
    const { auth } = await initFirebase();
    return auth;
  } catch (error) {
    console.error('Failed to get Firebase Auth:', error);
    return null;
  }
}

// Mock database service for when Firebase is not available
export const mockStoreService = {
  async getStore(shop: string) {
    console.log('Mock: Getting store', shop);
    return null; // Always return null to trigger installation
  },
  
  async createStore(storeData: any) {
    console.log('Mock: Creating store', storeData);
    return { id: 'mock-id', ...storeData };
  },
  
  async updateStore(shop: string, data: any) {
    console.log('Mock: Updating store', shop, data);
    return { id: 'mock-id', shop, ...data };
  }
};
