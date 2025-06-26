#!/bin/bash

# Quick Vercel Environment Setup Script
# This script sets up all necessary environment variables for Bargain Hunter

echo "🚀 Setting up Vercel environment variables..."

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login check
echo "🔐 Checking Vercel authentication..."
vercel whoami || {
    echo "Please login to Vercel first:"
    vercel login
    exit 1
}

echo "📝 Setting environment variables..."

# Set all environment variables
echo "Setting SHOPIFY_API_KEY..."
echo "b33e93da065728ab025c58bfc6609d5e" | vercel env add SHOPIFY_API_KEY production,preview,development

echo "Setting SHOPIFY_API_SECRET..."
echo "0db70f04a5477a00ead823d66f3f11d2" | vercel env add SHOPIFY_API_SECRET production,preview,development

echo "Setting SHOPIFY_WEBHOOK_SECRET..."
echo "BargainHunterWebhookSecret2024_SuperSecure_RandomKey_12345" | vercel env add SHOPIFY_WEBHOOK_SECRET production,preview,development

echo "Setting SHOPIFY_SCOPES..."
echo "read_products,write_discounts,read_customers,write_script_tags,read_orders" | vercel env add SHOPIFY_SCOPES production,preview,development

echo "Setting NEXT_PUBLIC_APP_URL..."
echo "https://bargin-hunter2.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production,preview,development

echo "Setting NEXT_PUBLIC_WIDGET_URL..."
echo "https://bargin-hunter2.vercel.app/widget" | vercel env add NEXT_PUBLIC_WIDGET_URL production,preview,development

echo "Setting NEXT_PUBLIC_API_BASE..."
echo "https://bargin-hunter2.vercel.app/api" | vercel env add NEXT_PUBLIC_API_BASE production,preview,development

echo "Setting NEXT_PUBLIC_SHOPIFY_API_KEY..."
echo "b33e93da065728ab025c58bfc6609d5e" | vercel env add NEXT_PUBLIC_SHOPIFY_API_KEY production,preview,development

echo "Setting HOST..."
echo "bargin-hunter2.vercel.app" | vercel env add HOST production,preview,development

echo "Setting FIREBASE_PROJECT_ID..."
echo "bargain-hunter-prod" | vercel env add FIREBASE_PROJECT_ID production,preview,development

echo "Setting FIREBASE_CLIENT_EMAIL..."
echo "firebase-adminsdk-fbsvc@bargain-hunter-prod.iam.gserviceaccount.com" | vercel env add FIREBASE_CLIENT_EMAIL production,preview,development

echo "Setting NEXT_PUBLIC_FIREBASE_API_KEY..."
echo "AIzaSyDxyUM_wdnLZHLfz5HtdVvI-rjk7j6CEPM" | vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production,preview,development

echo "Setting NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN..."
echo "bargain-hunter-prod.firebaseapp.com" | vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production,preview,development

echo "Setting NEXT_PUBLIC_FIREBASE_PROJECT_ID..."
echo "bargain-hunter-prod" | vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production,preview,development

echo "Setting NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET..."
echo "bargain-hunter-prod.firebasestorage.app" | vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production,preview,development

echo "Setting NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID..."
echo "177710003337" | vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production,preview,development

echo "Setting NEXT_PUBLIC_FIREBASE_APP_ID..."
echo "1:177710003337:web:b92ad78db4e339f41e0258" | vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production,preview,development

echo "Setting NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID..."
echo "G-F7T278Y4FR" | vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production,preview,development

echo "Setting NODE_ENV..."
echo "production" | vercel env add NODE_ENV production,preview,development

echo "Setting FIREBASE_PRIVATE_KEY..."
echo "-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDYCdlCLbPRQhPC
zPZUaG/4mNZKmyuUuD4WFanZhv86dwwBUU/Wm8QSkH2I2VJakd2w0bgNx4+orijK
tI3WklRJ66kEX1m/BzNm/GPFtJiAMHI9t9G09/JhoXscsCIxKW/HENv1zFeARzkZ
LUajZuTh71AA5Uq3rHpbZmL1EXYEXC1fr2LVDq6G1aa2CgNmIqNWLgUgs1v8MS2p
U8nBMJ7ejLBNG0G40Zb1fUt+a9VV583E0K5ht8wNB/vVqlxQc52yhSQfJVkyiamJ
luoWoNb0fbmYH/2vR/AFKH/k0cvno8tohx4bRJw0XN20W7S/lxs/ttFCgclORYLw
f4qGsrzLAgMBAAECggEABLqOdVrfvTxXh2OKHsXccZIS2rYzyYEQ5tXZjmfcjVCO
xDad60IklA1ymfy7xzy7IAQvJaoRFG2fefRiyGgSjT2pyO03Xy2Oq/npSyoNTn0A
+yXbYr0sooNw2OtoDDBugGp3jhVHcwjcEJeDnM8DQojE9QgPzx5o3ThMATY9IZJC
pOaX2/3K21wi3BVnUF8b88RuTNxdhNy3T5sJ31SyqVeaTzwrpditOErhPffkqVnr
mhQspHkjrjzyjym/sneRsUzwLzjvEFxyC5C9a82Y0Ta9bvaq9CwguS6wTRJ1rZq7
1EjXXFT+tVjKnYHjyt2qMsCoudmq2HBxfEcwRojkEQKBgQDzRjOY7i6ybMzSjfGb
c+N8JsD+oDAePR0x5ZBEuBGOTI1vS3IJM+3J7nPKk03ggF6WC36QMvIMtt2xCehj
MuBTyJ6ziFBR9XS5Lcn94sXFDW5nvhSUgyF8QSPxbykLVJ4TY2rg67S7j7soK5Pu
k0MJzyzsp35LFYfkUga9nnTZEQKBgQDjVuui5LTTHjrCF879AAB0v3amcFUhglwj
rqSmbkuXenuGGWZRxKGUo8vAHsHCSVdvlPR5+UYIQlVWSW1ohl9q87EsHxCVJoFH
zT/xMRYeVtq8tmyB6uiid3lzSYh+48p7bgOV8DwVZ/ScOp0/TSwrxvA+R5pYdV2I
XIAEuaJYGwKBgBIeS197dcziH4sa+UCbq/imJj+QjKTj5lW+BDWqA9y2RN5iHxci
X/ZnJQaUW/t5dBH2vzFcKfzabb5uv3kL4/s5eOBkKZ9BCbV0/JNFHXeknXFqjbvV
3FuVumiT39mxLqjBAcfIpkhF1ymRvU3Kd/a2EGF7xAMxklJl7YyXzZoRAoGBAJiz
JYtAe4Ti5SzBuTKO8b95a0TYZxYe7ay5/bYcl4Gjr5yfKu75WF7ytkTRY+wQPz6f
mqbjHHsnsxJGN8rhlu3LydGM/CJyvptv7ecfxW+Tf1EKZ0/MbX3TKiyZ06kHcFX/
y0DHIFRwgwj9Beoi9+xfr7bleXK5Qp35I7QIzFbJAoGAGIEdaFfk0IHVUZ6xgJGo
fJv7kYtzaVpQNX/cbYrJ0im/MKouvEb47JddqfNhK+oG+nH7enxDul1Kn6MuUcAW
5on3cm6g6gBOym8my6zjpVCHS8Gsr7iUWjPdbh3p7muIpuKnUK4wS9a7PWgJd3WU
4hjyl5DlmPnS/BZrKn8QcyY=
-----END PRIVATE KEY-----" | vercel env add FIREBASE_PRIVATE_KEY production,preview,development

echo "🎉 All environment variables set!"
echo "🚀 Triggering new deployment..."

vercel --prod

echo "✅ Setup complete! Your app should be available at:"
echo "🔗 https://bargin-hunter2.vercel.app"
echo ""
echo "Test the dashboard at:"
echo "🔗 https://bargin-hunter2.vercel.app/dashboard?shop=demo-store.myshopify.com"
