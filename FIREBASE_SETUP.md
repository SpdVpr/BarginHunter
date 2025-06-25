# 🔥 Firebase Setup Instructions

## Krok 1: Vytvoření Firebase projektu

1. **Jděte na Firebase Console**
   - Otevřete https://console.firebase.google.com
   - Klikněte na "Add project" nebo "Vytvořit projekt"

2. **Nastavte projekt**
   - Název projektu: `bargain-hunter-prod` (nebo jiný název)
   - Povolte Google Analytics (volitelné)
   - Klikněte "Create project"

## Krok 2: Povolení Firestore Database

1. **V Firebase Console**
   - Jděte do "Firestore Database"
   - Klikněte "Create database"
   - Vyberte "Start in test mode" (později změníme pravidla)
   - Vyberte lokaci (nejlépe europe-west3 pro Evropu)

## Krok 3: Vytvoření Service Account

1. **Jděte do Project Settings**
   - Klikněte na ikonu ozubeného kola → "Project settings"
   - Přejděte na záložku "Service accounts"

2. **Vygenerujte nový klíč**
   - Klikněte "Generate new private key"
   - Stáhne se JSON soubor - ULOŽTE SI HO BEZPEČNĚ!

3. **Zkopírujte údaje z JSON souboru**
   ```json
   {
     "type": "service_account",
     "project_id": "your-project-id",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
     "client_id": "...",
     "auth_uri": "...",
     "token_uri": "...",
     "auth_provider_x509_cert_url": "...",
     "client_x509_cert_url": "..."
   }
   ```

## Krok 4: Nastavení Web App

1. **Přidejte Web App**
   - V Project Overview klikněte na ikonu "</>"
   - Název: "Bargain Hunter Web"
   - Zaškrtněte "Also set up Firebase Hosting" (volitelné)

2. **Zkopírujte Firebase Config**
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

## Krok 5: Nastavení Firestore pravidel

V Firestore Database → Rules, nastavte:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for all documents (pro development)
    // V produkci nastavte přísnější pravidla
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Krok 6: Aktualizace .env.local

Použijte údaje z kroků výše:

```env
# Firebase Admin (ze service account JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVÁŠ_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# Firebase Client (z web app config)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## ✅ Hotovo!

Firebase je nyní připraven k použití.
