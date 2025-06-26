# 🔧 Vercel Environment Variables Setup

## 🎯 Problém
Shopify aplikace se nezměnila, protože environment proměnné na Vercel nejsou správně nastavené.

## ✅ Řešení
Musíme nastavit environment proměnné na Vercel dashboard.

### 1. Přístup k Vercel Dashboard
1. Jděte na: https://vercel.com/dashboard
2. Najděte projekt "bargin-hunter2" nebo podobný
3. Klikněte na projekt
4. Jděte na záložku "Settings"
5. V levém menu klikněte na "Environment Variables"

### 2. Environment proměnné k nastavení

#### Shopify Configuration
```
SHOPIFY_API_KEY = b33e93da065728ab025c58bfc6609d5e
SHOPIFY_API_SECRET = 0db70f04a5477a00ead823d66f3f11d2
SHOPIFY_WEBHOOK_SECRET = BargainHunterWebhookSecret2024_SuperSecure_RandomKey_12345
SHOPIFY_SCOPES = read_products,write_discounts,read_customers,write_script_tags,read_orders
```

#### Application URLs
```
NEXT_PUBLIC_APP_URL = https://bargin-hunter2.vercel.app
NEXT_PUBLIC_WIDGET_URL = https://bargin-hunter2.vercel.app/widget
NEXT_PUBLIC_API_BASE = https://bargin-hunter2.vercel.app/api
NEXT_PUBLIC_SHOPIFY_API_KEY = b33e93da065728ab025c58bfc6609d5e
HOST = bargin-hunter2.vercel.app
```

#### Firebase Configuration
```
FIREBASE_PROJECT_ID = bargain-hunter-prod
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-fbsvc@bargain-hunter-prod.iam.gserviceaccount.com
```

#### Firebase Client Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY = AIzaSyDxyUM_wdnLZHLfz5HtdVvI-rjk7j6CEPM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = bargain-hunter-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = bargain-hunter-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = bargain-hunter-prod.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 177710003337
NEXT_PUBLIC_FIREBASE_APP_ID = 1:177710003337:web:b92ad78db4e339f41e0258
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = G-F7T278Y4FR
```

#### Firebase Private Key
```
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCOXGqWzX8zFXxZ
//Hsp9BuH+qArA2T5vlN4N9oaiIDkx+otTjVvHSLYWCo0kPo0hVying58g4hJ9Fr
1QiskuNeO4GbOLZAIRd4CELxgvPuX6VB4n/RWrMBzhyPoLgfG+q+v1BUF/K/MXtR
FsMWIL+ZD2vokzoA2JmDKQk2PDSKL2j5AzmSL4GyQgOOYPAUGhBShIeeeTHujnHG
tAyTbrIUeNrKhCTCpfLL0c0TitEwNyLmoFCLO9X7JoUPMF7PHQYxvkOHVZ8ppD7T
hBVTt3Tr27oxsC/o5qa0fAbgBic7jLD1UhxcE6mhoHL+DvxPrZdQEhLjMqQxbPSc
2CmUVRz9AgMBAAECggEAD6i1NcDFXtBcdQbc7MfZup9Km1wxgyULI6iaUmEoPCXs
+9DxPztjQ2iS6gb03tFq+AYoqtEIAlgfpkGQ2nCuz1Dy1OjUTTIGo5afDHM30y7U
ne5k2lmkaoyqIhdO4Wcf91rSYmme8y5lbto228J+6L5kQ3kcTncEzcNQBtXw/okF
+qC90UUGnHEkd/4StRgvzTfwCt0mo1iUQqKL0+4LSx9jRBOwTKuxQDp4jJ21wJc3
GhHWx3yGZzPAcvCTdq3MHE5Frp/ecm2EpzRN88+282XPUnnNelXpsHIDvsyzyOSU
6OY3lQi+Ixex7HJEghc11XpGNp2sO6vfLWQufxNqEQKBgQDERV5OaFaZEudHshlN
c1p9us3XAj8etZpcSjLje5EMa+Jwo4cRSDNsg0O+9BC2NK7n+brbXjU88DDacT5y
zCPAi0bVWjHENp1+9EL2iNay2Nz82ybRQ5hqs86JImESemj5d5bwTUQ/StqN5Sea
HD+K/3xjP6DybDsS96lMiCaaEQKBgQC5rycnRI7lbXEOeatWje42hW8a+hjV3bSc
Ub7fnnHQjTW+t6rucaG25NG/6+vo2JtbC4utyfG6tZmfMWQ/puqT0XnoZVq4Kcvt
4R7Kv4+zW/R1t5ZpzPNAMHPP8NsHwOeQ1ilQgJ2sl9r/YVwvfD/JeUl1+IBFpkKD
9owGfYOILQKBgQCpynTeEacwv0izHmCDPxJ+iDcAFOJz95i01D+XydLeUwpOdTko
ezR5YEkgDVXTulnBNqoukh4uPH+WybbDatRXAmXhtigtXS38oOS5EAHkMHVkjVXU
XMyjKi+3NLWTXbAoeAtskPtEYcYWULJkwKE75u89kNL0RSsJqpScL4BtcQKBgQCK
ttWaGTZjILon5S7hj1AY/N++mH17L5Agg1UDezttYEB5RH52eP8lQZWMObPYFBEj
F+H2J3nlUIr+CQjqIEj3urLGsQjvsZG+GMJHFopEpHpggpDkYw6JsmiiPD10cmDL
q6HbmOmxqRQaWmJiuwBwA6KkdctlvMnOCZ4bryJW1QKBgQCoQBvEatzpg8qo4uui
/6E19OccCijZE+zXcc4LJZiBA5t0//K9StjUVRph/5Sb2DLgu9ftlcPZYOnW3z6n
LRIB+PKz3nUoCPwrVlI3ZdJVzEBfxkIu+Hb/v3RQxJygtR+sgg8fMTARK1r1c8Eg
yiLqeO6xznta/GgPoZnWazTXCQ==
-----END PRIVATE KEY-----
```

#### Environment
```
NODE_ENV = production
```

### 3. Jak nastavit proměnné
1. Pro každou proměnnou klikněte "Add New"
2. Zadejte "Name" (název proměnné)
3. Zadejte "Value" (hodnotu)
4. Vyberte "Production", "Preview" a "Development"
5. Klikněte "Save"

### 4. Po nastavení všech proměnných
1. Jděte na záložku "Deployments"
2. Klikněte na nejnovější deployment
3. Klikněte "Redeploy" (nebo počkejte na automatický redeploy z GitHub)

### 5. Testování
Po redeploymentu zkuste:
1. https://bargin-hunter2.vercel.app/dashboard?shop=demo-store.myshopify.com
2. Měli byste vidět nové admin rozhraní s ovládacími prvky

## 🚨 Důležité poznámky

### Firebase Private Key
- Při vkládání Firebase private key zachovejte formát s `\n` pro nové řádky
- Nebo použijte multiline formát v Vercel interface

### URL konzistence
- Všechny URL musí používat `https://bargin-hunter2.vercel.app`
- Žádné localhost odkazy v produkci

### Shopify App nastavení
Vaše Shopify app má správně nastavené:
- Application URL: `https://bargin-hunter2.vercel.app/`
- Redirect URLs: `https://bargin-hunter2.vercel.app/api/auth/callback`

## 🔍 Troubleshooting

### Pokud se aplikace stále nenačítá:
1. Zkontrolujte Vercel Function Logs
2. Otevřte browser console pro JavaScript chyby
3. Ověřte, že všechny environment proměnné jsou nastavené
4. Zkuste hard refresh (Ctrl+F5)

### Pokud Shopify hlásí chyby:
1. Zkontrolujte, že redirect URLs jsou správné
2. Ověřte SHOPIFY_API_KEY a SHOPIFY_API_SECRET
3. Zkontrolujte webhook secret

## ✅ Po dokončení
Shopify aplikace by měla zobrazovat nové admin rozhraní s:
- Quick Controls sekcí
- Rozšířenými nastaveními
- Targeting možnostmi
- Test módem
