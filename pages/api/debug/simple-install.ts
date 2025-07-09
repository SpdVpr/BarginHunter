import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const shop = 'bleblehoho.myshopify.com'; // Hardcoded for testing

  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Simple Install Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
        .button { 
            display: inline-block; 
            background: #5c6ac4; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 10px;
            font-size: 16px;
        }
        .button:hover { background: #4c5aa0; }
        .info { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>🔧 Simple Install Test</h1>
    
    <div class="info">
        <p><strong>Shop:</strong> ${shop}</p>
        <p><strong>Current URL:</strong> ${req.headers.host}${req.url}</p>
    </div>

    <h2>Test Links:</h2>
    
    <a href="/oauth?shop=${shop}" class="button">1. Test OAuth Page</a><br>
    <a href="/api/auth/install?shop=${shop}" class="button">2. Test Install API</a><br>
    <a href="/app?shop=${shop}" class="button">3. Test App Page</a><br>
    
    <h2>Manual OAuth URL:</h2>
    <div class="info">
        <p>If all else fails, try this direct OAuth URL:</p>
        <a href="https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=read_products,write_discounts,read_customers,write_script_tags,read_orders&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`)}&state=manual_test" class="button">
            🚀 Direct Shopify OAuth
        </a>
    </div>

    <h2>Debug Info:</h2>
    <div class="info">
        <p><strong>SHOPIFY_API_KEY:</strong> ${process.env.SHOPIFY_API_KEY ? 'SET' : 'NOT SET'}</p>
        <p><strong>NEXT_PUBLIC_APP_URL:</strong> ${process.env.NEXT_PUBLIC_APP_URL}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
    </div>

    <script>
        console.log('🔍 Simple install test loaded');
        console.log('🔍 Shop:', '${shop}');
        console.log('🔍 Current URL:', window.location.href);
        
        // Test URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        console.log('🔍 URL Parameters:', Object.fromEntries(urlParams));
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
