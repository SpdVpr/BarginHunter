#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnvironment() {
  console.log('🚀 Bargain Hunter - Automatické nastavení prostředí\n');
  
  console.log('Tento script vám pomůže nastavit všechny potřebné environment variables.');
  console.log('Budete potřebovat:');
  console.log('1. Firebase projekt (vytvořený podle FIREBASE_SETUP.md)');
  console.log('2. Shopify App (vytvořenou podle SHOPIFY_SETUP.md)\n');
  
  const proceed = await question('Máte připravené Firebase a Shopify? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('\n📚 Nejdříve si přečtěte:');
    console.log('- FIREBASE_SETUP.md pro nastavení Firebase');
    console.log('- SHOPIFY_SETUP.md pro nastavení Shopify App');
    process.exit(0);
  }

  console.log('\n🔥 FIREBASE KONFIGURACE');
  console.log('Tyto údaje najdete v Firebase Console → Project Settings');
  
  const firebaseProjectId = await question('Firebase Project ID: ');
  const firebaseClientEmail = await question('Firebase Client Email (service account): ');
  
  console.log('\nPrivate Key (vložte celý klíč včetně -----BEGIN/END PRIVATE KEY-----):');
  const firebasePrivateKey = await question('Firebase Private Key: ');
  
  console.log('\nWeb App konfigurace (Firebase Console → Project Settings → Your apps):');
  const firebaseApiKey = await question('Firebase API Key: ');
  const firebaseAuthDomain = await question('Firebase Auth Domain: ');
  const firebaseStorageBucket = await question('Firebase Storage Bucket: ');
  const firebaseMessagingSenderId = await question('Firebase Messaging Sender ID: ');
  const firebaseAppId = await question('Firebase App ID: ');

  console.log('\n🛍️ SHOPIFY KONFIGURACE');
  console.log('Tyto údaje najdete v Shopify Partner Dashboard → Your App → App setup');
  
  const shopifyApiKey = await question('Shopify API Key (Client ID): ');
  const shopifyApiSecret = await question('Shopify API Secret (Client Secret): ');
  const shopifyWebhookSecret = await question('Shopify Webhook Secret (vygenerujte si vlastní): ');

  // Vytvoření .env.local souboru
  const envContent = `# ========================================
# SHOPIFY CONFIGURATION
# ========================================
SHOPIFY_API_KEY=${shopifyApiKey}
SHOPIFY_API_SECRET=${shopifyApiSecret}
SHOPIFY_WEBHOOK_SECRET=${shopifyWebhookSecret}
SHOPIFY_SCOPES=read_products,write_discounts,read_customers,write_script_tags,read_orders

# ========================================
# APPLICATION URLS
# ========================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WIDGET_URL=http://localhost:3000/widget
NEXT_PUBLIC_API_BASE=http://localhost:3000/api
NEXT_PUBLIC_SHOPIFY_API_KEY=${shopifyApiKey}
HOST=localhost:3000

# ========================================
# FIREBASE CONFIGURATION
# ========================================
FIREBASE_PROJECT_ID=${firebaseProjectId}
FIREBASE_CLIENT_EMAIL=${firebaseClientEmail}
FIREBASE_PRIVATE_KEY="${firebasePrivateKey.replace(/\n/g, '\\n')}"

NEXT_PUBLIC_FIREBASE_API_KEY=${firebaseApiKey}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${firebaseAuthDomain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${firebaseProjectId}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${firebaseStorageBucket}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${firebaseMessagingSenderId}
NEXT_PUBLIC_FIREBASE_APP_ID=${firebaseAppId}

# ========================================
# DEVELOPMENT SETTINGS
# ========================================
NODE_ENV=development
`;

  // Uložení souboru
  const envPath = path.join(process.cwd(), '.env.local');
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Konfigurace byla úspěšně uložena do .env.local');
  
  console.log('\n🚀 DALŠÍ KROKY:');
  console.log('1. Spusťte: npm install');
  console.log('2. Spusťte: npm run dev');
  console.log('3. Otevřete: http://localhost:3000/test pro testování');
  console.log('4. Pro instalaci do Shopify: http://localhost:3000/app?shop=your-store.myshopify.com');
  
  console.log('\n📝 POZNÁMKY:');
  console.log('- Ujistěte se, že máte správně nastavené Firestore pravidla');
  console.log('- V Shopify App nastavte správné redirect URLs');
  console.log('- Pro produkci aktualizujte URLs v .env.local');

  rl.close();
}

setupEnvironment().catch(console.error);
