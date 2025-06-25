# 🛍️ Shopify App Setup Instructions

## Krok 1: Shopify Partner Account

1. **Registrace Partner Account**
   - Jděte na https://partners.shopify.com
   - Zaregistrujte se jako Shopify Partner (zdarma)
   - Ověřte email a dokončete registraci

## Krok 2: Vytvoření Development Store

1. **V Partner Dashboard**
   - Klikněte "Stores" → "Add store"
   - Vyberte "Development store"
   - Název: "Bargain Hunter Test Store"
   - Password: něco bezpečného
   - Store purpose: "Test an app or theme"

2. **Poznamenejte si URL**
   - Vaše store URL bude: `your-store-name.myshopify.com`

## Krok 3: Vytvoření Shopify App

1. **V Partner Dashboard**
   - Klikněte "Apps" → "Create app"
   - Vyberte "Create app manually"
   - App name: "Bargain Hunter"
   - App type: "Public app"

2. **Základní nastavení**
   - App URL: `http://localhost:3000/app` (pro development)
   - Allowed redirection URLs:
     ```
     http://localhost:3000/api/auth/callback
     http://localhost:3000/api/auth/shopify/callback
     ```

## Krok 4: Konfigurace App Permissions

1. **V App Settings → App setup**
   - Scopes (oprávnění):
     ```
     read_products
     write_discounts
     read_customers
     write_script_tags
     read_orders
     ```

2. **Webhook endpoints** (zatím necháme prázdné, nastavíme později)

## Krok 5: Získání API klíčů

1. **V App Settings**
   - Zkopírujte "Client ID" (to je váš API key)
   - Zkopírujte "Client secret" (to je váš API secret)

2. **Vygenerujte Webhook Secret**
   - V terminálu spusťte: `openssl rand -base64 32`
   - Nebo použijte online generátor

## Krok 6: Aktualizace .env.local

```env
# Shopify Configuration
SHOPIFY_API_KEY=your_client_id_from_app_settings
SHOPIFY_API_SECRET=your_client_secret_from_app_settings
SHOPIFY_WEBHOOK_SECRET=your_generated_webhook_secret
SHOPIFY_SCOPES=read_products,write_discounts,read_customers,write_script_tags,read_orders

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WIDGET_URL=http://localhost:3000/widget
NEXT_PUBLIC_API_BASE=http://localhost:3000/api
NEXT_PUBLIC_SHOPIFY_API_KEY=your_client_id_from_app_settings
HOST=localhost:3000
```

## Krok 7: Test instalace (po spuštění aplikace)

1. **Spusťte aplikaci**
   ```bash
   npm run dev
   ```

2. **Otevřete instalační URL**
   ```
   http://localhost:3000/app?shop=your-store-name.myshopify.com
   ```

3. **Postupujte OAuth flow**
   - Budete přesměrováni na Shopify
   - Povolte oprávnění
   - Budete přesměrováni zpět do aplikace

## Krok 8: Nastavení Webhooks (po úspěšné instalaci)

V Shopify App Settings → Webhooks:

1. **Order creation**
   - Endpoint: `http://localhost:3000/api/webhooks/orders/create`
   - Format: JSON

2. **App uninstalled**
   - Endpoint: `http://localhost:3000/api/webhooks/app/uninstalled`
   - Format: JSON

3. **Customer creation**
   - Endpoint: `http://localhost:3000/api/webhooks/customers/create`
   - Format: JSON

## 🔧 Pro produkci

Když budete ready pro produkci:

1. **Aktualizujte App URLs**
   - App URL: `https://your-domain.vercel.app/app`
   - Redirect URLs: `https://your-domain.vercel.app/api/auth/callback`

2. **Aktualizujte Webhook URLs**
   - `https://your-domain.vercel.app/api/webhooks/...`

3. **Publikujte app**
   - V Partner Dashboard můžete app publikovat do App Store

## ✅ Hotovo!

Shopify app je připraven k testování!
