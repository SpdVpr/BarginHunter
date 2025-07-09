import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shop, host, hmac, timestamp } = req.query;

  const debugInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-shopify-shop-domain': req.headers['x-shopify-shop-domain'],
    },
    environment: {
      SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_SHOPIFY_API_KEY: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NODE_ENV: process.env.NODE_ENV,
    },
    shopifyParams: {
      shop: shop || 'NOT PROVIDED',
      host: host || 'NOT PROVIDED',
      hmac: hmac || 'NOT PROVIDED',
      timestamp: timestamp || 'NOT PROVIDED',
    },
    urls: {
      currentUrl: `${req.headers.host}${req.url}`,
      appUrl: `https://bargin-hunter2.vercel.app/app?shop=${shop}&host=${host}`,
      dashboardUrl: `https://bargin-hunter2.vercel.app/dashboard?shop=${shop}&host=${host}`,
      installUrl: `https://bargin-hunter2.vercel.app/api/auth/install?shop=${shop}`,
    },
    appBridge: {
      scriptUrl: 'https://unpkg.com/@shopify/app-bridge@3',
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY,
      isEmbedded: true,
    }
  };

  // Return HTML page with debug info and App Bridge test
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>App Bridge Debug - ${shop}</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .debug-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .debug-section h3 { margin-top: 0; color: #333; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
        .status { padding: 5px 10px; border-radius: 3px; margin: 5px 0; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .warning { background: #fff3cd; color: #856404; }
    </style>
</head>
<body>
    <h1>🔍 Shopify App Bridge Debug</h1>
    
    <div class="debug-section">
        <h3>Debug Information</h3>
        <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
    </div>

    <div class="debug-section">
        <h3>App Bridge Test</h3>
        <div id="app-bridge-status" class="status warning">Loading App Bridge...</div>
        <div id="app-bridge-details"></div>
    </div>

    <script src="https://unpkg.com/@shopify/app-bridge@3"></script>
    <script>
        console.log('🔍 Debug: Starting App Bridge test');
        console.log('🔍 Debug info:', ${JSON.stringify(debugInfo)});

        const statusEl = document.getElementById('app-bridge-status');
        const detailsEl = document.getElementById('app-bridge-details');

        try {
            if (window.ShopifyAppBridge) {
                const { createApp } = window.ShopifyAppBridge;
                
                if (createApp && '${host}' && '${process.env.NEXT_PUBLIC_SHOPIFY_API_KEY}') {
                    const app = createApp({
                        apiKey: '${process.env.NEXT_PUBLIC_SHOPIFY_API_KEY}',
                        host: '${host}',
                        forceRedirect: true,
                    });

                    statusEl.className = 'status success';
                    statusEl.textContent = '✅ App Bridge initialized successfully';
                    
                    detailsEl.innerHTML = \`
                        <p><strong>API Key:</strong> ${process.env.NEXT_PUBLIC_SHOPIFY_API_KEY}</p>
                        <p><strong>Host:</strong> ${host}</p>
                        <p><strong>Shop:</strong> ${shop}</p>
                        <p><strong>App Instance:</strong> Created</p>
                    \`;

                    console.log('✅ App Bridge initialized:', app);
                } else {
                    throw new Error('Missing required parameters for App Bridge');
                }
            } else {
                throw new Error('ShopifyAppBridge not available');
            }
        } catch (error) {
            console.error('❌ App Bridge error:', error);
            statusEl.className = 'status error';
            statusEl.textContent = '❌ App Bridge failed: ' + error.message;
            
            detailsEl.innerHTML = \`
                <p><strong>Error:</strong> \${error.message}</p>
                <p><strong>Available:</strong> \${typeof window.ShopifyAppBridge}</p>
                <p><strong>API Key:</strong> ${process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || 'NOT SET'}</p>
                <p><strong>Host:</strong> ${host || 'NOT PROVIDED'}</p>
            \`;
        }
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
