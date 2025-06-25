# 🚀 Bargain Hunter - Kompletní Setup Instrukce

Tento návod vás provede kompletním nastavením Bargain Hunter aplikace s reálným Shopify a Firebase propojením.

## 📋 Přehled kroků

1. ✅ **Příprava prostředí** (5 min)
2. 🔥 **Nastavení Firebase** (10 min)
3. 🛍️ **Vytvoření Shopify App** (15 min)
4. ⚙️ **Konfigurace aplikace** (5 min)
5. 🧪 **Testování** (5 min)

**Celkový čas: ~40 minut**

---

## 1. ✅ Příprava prostředí

```bash
# Ujistěte se, že máte Node.js 18+
node --version

# Nainstalujte závislosti
npm install
```

---

## 2. 🔥 Nastavení Firebase

### Krok 2.1: Vytvoření Firebase projektu

1. **Otevřete Firebase Console**
   - Jděte na https://console.firebase.google.com
   - Klikněte "Add project"

2. **Vytvořte projekt**
   - Název: `bargain-hunter-prod` (nebo jiný)
   - Povolte Google Analytics (volitelné)
   - Klikněte "Create project"

### Krok 2.2: Povolení Firestore

1. **V Firebase Console**
   - Jděte do "Firestore Database"
   - Klikněte "Create database"
   - Vyberte "Start in test mode"
   - Vyberte lokaci (doporučeno: europe-west3)

### Krok 2.3: Service Account

1. **Project Settings → Service accounts**
   - Klikněte "Generate new private key"
   - Stáhněte JSON soubor
   - **ULOŽTE BEZPEČNĚ!**

### Krok 2.4: Web App

1. **Project Overview → Add app → Web**
   - Název: "Bargain Hunter Web"
   - Zkopírujte Firebase config

📝 **Poznamenejte si tyto údaje - budete je potřebovat!**

---

## 3. 🛍️ Vytvoření Shopify App

### Krok 3.1: Shopify Partner Account

1. **Registrace**
   - Jděte na https://partners.shopify.com
   - Zaregistrujte se (zdarma)

### Krok 3.2: Development Store

1. **Partner Dashboard → Stores → Add store**
   - Vyberte "Development store"
   - Název: "Bargain Hunter Test"
   - Poznamenejte si URL: `your-store.myshopify.com`

### Krok 3.3: Vytvoření App

1. **Partner Dashboard → Apps → Create app**
   - "Create app manually"
   - Název: "Bargain Hunter"
   - Type: "Public app"

2. **App setup**
   - App URL: `http://localhost:3000/app`
   - Redirect URLs: `http://localhost:3000/api/auth/callback`
   - Scopes: `read_products,write_discounts,read_customers,write_script_tags,read_orders`

3. **Zkopírujte API klíče**
   - Client ID (= API Key)
   - Client Secret (= API Secret)

📝 **Poznamenejte si tyto údaje!**

---

## 4. ⚙️ Konfigurace aplikace

### Automatické nastavení (doporučeno)

```bash
npm run setup
```

Tento script vás provede nastavením všech environment variables.

### Manuální nastavení

Pokud preferujete manuální nastavení, editujte `.env.local`:

```env
# Shopify
SHOPIFY_API_KEY=your_client_id
SHOPIFY_API_SECRET=your_client_secret
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="your_private_key"

# Firebase Web
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... další Firebase config
```

---

## 5. 🧪 Testování

### Krok 5.1: Spuštění aplikace

```bash
npm run dev
```

### Krok 5.2: Test Firebase připojení

1. Otevřete: http://localhost:3000/test
2. Klikněte "Run All Tests"
3. První test (Firebase) by měl být ✅ zelený

### Krok 5.3: Vytvoření test store

1. Na test stránce klikněte "Create Test Store"
2. Znovu spusťte "Run All Tests"
3. Většina testů by měla být ✅ zelená

### Krok 5.4: Test Shopify OAuth

1. Otevřete: `http://localhost:3000/app?shop=your-store.myshopify.com`
2. Měli byste být přesměrováni na Shopify OAuth
3. Po povolení oprávnění budete přesměrováni zpět
4. Měli byste vidět dashboard

### Krok 5.5: Test dashboardu

1. Dashboard: `http://localhost:3000/dashboard?shop=your-store.myshopify.com`
2. Settings: `http://localhost:3000/dashboard/settings?shop=your-store.myshopify.com`
3. Analytics: `http://localhost:3000/dashboard/analytics?shop=your-store.myshopify.com`

### Krok 5.6: Test game widget

1. Otevřete: `http://localhost:3000/widget/game?shop=your-store.myshopify.com`
2. Zahrajte si hru
3. Zkontrolujte, že se data ukládají v dashboardu

---

## 🎉 Hotovo!

Pokud všechny testy prošly, máte plně funkční Bargain Hunter aplikaci!

## 🔧 Řešení problémů

### Firebase chyby
- Zkontrolujte, že máte správný project ID
- Ověřte, že private key je správně formátovaný
- Ujistěte se, že Firestore je povolen

### Shopify chyby
- Zkontrolujte API klíče
- Ověřte redirect URLs v app nastavení
- Ujistěte se, že máte správné scopes

### Obecné chyby
- Zkontrolujte console v browseru
- Podívejte se na logy v terminálu
- Ověřte, že všechny environment variables jsou nastavené

## 📞 Podpora

Pokud narazíte na problémy:

1. Zkontrolujte logy v terminálu
2. Otevřte browser console (F12)
3. Zkuste test stránku: http://localhost:3000/test
4. Zkontrolujte, že máte všechny environment variables

## 🚀 Další kroky

Po úspěšném nastavení můžete:

1. **Přizpůsobit hru** - upravte nastavení v dashboardu
2. **Testovat s reálnými zákazníky** - nainstalujte do development store
3. **Připravit produkci** - nasaďte na Vercel
4. **Publikovat app** - odešlete do Shopify App Store

---

**🎯 Úspěch!** Máte nyní plně funkční gamifikovaný discount systém pro Shopify!
