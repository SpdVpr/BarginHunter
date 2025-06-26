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
FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDYCdlCLbPRQhPC\nzPZUaG/4mNZKmyuUuD4WFanZhv86dwwBUU/Wm8QSkH2I2VJakd2w0bgNx4+orijK\ntI3WklRJ66kEX1m/BzNm/GPFtJiAMHI9t9G09/JhoXscsCIxKW/HENv1zFeARzkZ\nLUajZuTh71AA5Uq3rHpbZmL1EXYEXC1fr2LVDq6G1aa2CgNmIqNWLgUgs1v8MS2p\nU8nBMJ7ejLBNG0G40Zb1fUt+a9VV583E0K5ht8wNB/vVqlxQc52yhSQfJVkyiamJ\nluoWoNb0fbmYH/2vR/AFKH/k0cvno8tohx4bRJw0XN20W7S/lxs/ttFCgclORYLw\nf4qGsrzLAgMBAAECggEABLqOdVrfvTxXh2OKHsXccZIS2rYzyYEQ5tXZjmfcjVCO\nxDad60IklA1ymfy7xzy7IAQvJaoRFG2fefRiyGgSjT2pyO03Xy2Oq/npSyoNTn0A\n+yXbYr0sooNw2OtoDDBugGp3jhVHcwjcEJeDnM8DQojE9QgPzx5o3ThMATY9IZJC\npOaX2/3K21wi3BVnUF8b88RuTNxdhNy3T5sJ31SyqVeaTzwrpditOErhPffkqVnr\nmhQspHkjrjzyjym/sneRsUzwLzjvEFxyC5C9a82Y0Ta9bvaq9CwguS6wTRJ1rZq7\n1EjXXFT+tVjKnYHjyt2qMsCoudmq2HBxfEcwRojkEQKBgQDzRjOY7i6ybMzSjfGb\nc+N8JsD+oDAePR0x5ZBEuBGOTI1vS3IJM+3J7nPKk03ggF6WC36QMvIMtt2xCehj\nMuBTyJ6ziFBR9XS5Lcn94sXFDW5nvhSUgyF8QSPxbykLVJ4TY2rg67S7j7soK5Pu\nk0MJzyzsp35LFYfkUga9nnTZEQKBgQDjVuui5LTTHjrCF879AAB0v3amcFUhglwj\nrqSmbkuXenuGGWZRxKGUo8vAHsHCSVdvlPR5+UYIQlVWSW1ohl9q87EsHxCVJoFH\nzT/xMRYeVtq8tmyB6uiid3lzSYh+48p7bgOV8DwVZ/ScOp0/TSwrxvA+R5pYdV2I\nXIAEuaJYGwKBgBIeS197dcziH4sa+UCbq/imJj+QjKTj5lW+BDWqA9y2RN5iHxci\nX/ZnJQaUW/t5dBH2vzFcKfzabb5uv3kL4/s5eOBkKZ9BCbV0/JNFHXeknXFqjbvV\n3FuVumiT39mxLqjBAcfIpkhF1ymRvU3Kd/a2EGF7xAMxklJl7YyXzZoRAoGBAJiz\nJYtAe4Ti5SzBuTKO8b95a0TYZxYe7ay5/bYcl4Gjr5yfKu75WF7ytkTRY+wQPz6f\nmqbjHHsnsxJGN8rhlu3LydGM/CJyvptv7ecfxW+Tf1EKZ0/MbX3TKiyZ06kHcFX/\ny0DHIFRwgwj9Beoi9+xfr7bleXK5Qp35I7QIzFbJAoGAGIEdaFfk0IHVUZ6xgJGo\nfJv7kYtzaVpQNX/cbYrJ0im/MKouvEb47JddqfNhK+oG+nH7enxDul1Kn6MuUcAW\n5on3cm6g6gBOym8my6zjpVCHS8Gsr7iUWjPdbh3p7muIpuKnUK4wS9a7PWgJd3WU\n4hjyl5DlmPnS/BZrKn8QcyY=\n-----END PRIVATE KEY-----\n"
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
