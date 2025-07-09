import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shop } = req.query;

  if (!shop || typeof shop !== 'string') {
    return res.status(400).json({ error: 'Shop parameter is required' });
  }

  // Generate manual OAuth URL
  const clientId = process.env.SHOPIFY_API_KEY;
  const scopes = process.env.SHOPIFY_SCOPES || 'read_products,write_discounts,read_customers,write_script_tags,read_orders';
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
  const state = 'manual_test_' + Date.now();

  const oauthUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Manual OAuth Test - ${shop}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .info-box { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .oauth-url { background: #e8f4fd; padding: 15px; border-radius: 5px; word-break: break-all; }
        .button { 
            display: inline-block; 
            background: #5c6ac4; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 10px 0;
        }
        .button:hover { background: #4c5aa0; }
        .step { margin: 20px 0; padding: 15px; border-left: 4px solid #5c6ac4; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Manual OAuth Test</h1>
        
        <div class="info-box">
            <h3>Shop Information</h3>
            <p><strong>Shop:</strong> ${shop}</p>
            <p><strong>Client ID:</strong> ${clientId}</p>
            <p><strong>Scopes:</strong> ${scopes}</p>
            <p><strong>Redirect URI:</strong> ${redirectUri}</p>
        </div>

        <div class="step">
            <h3>Step 1: Manual OAuth URL</h3>
            <p>This is the OAuth URL that should be called:</p>
            <div class="oauth-url">${oauthUrl}</div>
            <a href="${oauthUrl}" class="button" target="_blank">🚀 Start Manual OAuth</a>
        </div>

        <div class="step">
            <h3>Step 2: What should happen</h3>
            <ol>
                <li>Click the button above</li>
                <li>You should be redirected to Shopify authorization page</li>
                <li>After authorization, you should be redirected back to your app</li>
                <li>The app should be installed and you should see the dashboard</li>
            </ol>
        </div>

        <div class="step">
            <h3>Step 3: Debug Links</h3>
            <p>Use these links to debug the process:</p>
            <a href="/api/debug/installation-flow?shop=${shop}" class="button">Check Installation Status</a>
            <a href="/app?shop=${shop}" class="button">Test App Endpoint</a>
            <a href="/dashboard?shop=${shop}" class="button">Test Dashboard</a>
        </div>

        <div class="info-box">
            <h3>⚠️ Important Notes</h3>
            <ul>
                <li>This bypasses the normal Shopify app installation flow</li>
                <li>Use this only for testing and debugging</li>
                <li>Make sure your Shopify Partner Dashboard App URL is set to: <code>https://bargin-hunter2.vercel.app/app</code></li>
            </ul>
        </div>
    </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
