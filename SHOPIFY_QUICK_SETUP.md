# 🛍️ Shopify Quick Setup - Získání API klíčů

## Krok 1: Shopify Partner Account (2 minuty)

1. **Jděte na:** https://partners.shopify.com
2. **Klikněte:** "Join now" nebo "Sign up"
3. **Vyplňte registraci** (email, heslo, základní info)
4. **Ověřte email** a dokončete registraci

## Krok 2: Vytvoření Development Store (3 minuty)

1. **V Partner Dashboard:**
   - Klikněte "Stores" → "Add store"
   - Vyberte "Development store"

2. **Vyplňte údaje:**
   - Store name: `bargain-hunter-test`
   - Password: `test123456` (nebo jiné bezpečné)
   - Store purpose: "Test an app or theme"
   - Klikněte "Save"

3. **Poznamenejte si URL:**
   - Vaše store URL: `bargain-hunter-test.myshopify.com`

## Krok 3: Vytvoření Shopify App (5 minut)

1. **V Partner Dashboard:**
   - Klikněte "Apps" → "Create app"
   - Vyberte "Create app manually"

2. **Základní info:**
   - App name: `Bargain Hunter`
   - App type: "Public app"
   - Klikněte "Create app"

3. **App setup:**
   - App URL: `http://localhost:3000/app`
   - Allowed redirection URLs: `http://localhost:3000/api/auth/callback`

4. **Scopes (oprávnění):**
   ```
   read_products
   write_discounts
   read_customers
   write_script_tags
   read_orders
   ```

5. **Uložte změny**

## Krok 4: Získání API klíčů (1 minuta)

1. **V App Settings:**
   - Zkopírujte "Client ID" → to je váš `SHOPIFY_API_KEY`
   - Zkopírujte "Client secret" → to je váš `SHOPIFY_API_SECRET`

2. **Vygenerujte webhook secret:**
   - Otevřete terminál a spusťte: `openssl rand -base64 32`
   - Nebo použijte online generátor: https://generate-secret.vercel.app/32

## ✅ Výsledek

Budete mít tyto údaje:

```
SHOPIFY_API_KEY=your_client_id_zde
SHOPIFY_API_SECRET=your_client_secret_zde  
SHOPIFY_WEBHOOK_SECRET=your_generated_secret_zde
```

## 🚀 Další krok

Aktualizujte `.env.local` s těmito hodnotami a spusťte:

```bash
npm run dev
```

Pak otevřete: `http://localhost:3000/app?shop=bargain-hunter-test.myshopify.com`

---

**💡 Tip:** Celý proces trvá ~10 minut. Shopify Partner account je zdarma a development store také!
