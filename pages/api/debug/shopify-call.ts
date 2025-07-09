import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shop, hmac, host, timestamp } = req.query;

  const debugInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'referer': req.headers['referer'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-shopify-shop-domain': req.headers['x-shopify-shop-domain'],
      'x-shopify-hmac-sha256': req.headers['x-shopify-hmac-sha256'],
    },
    shopifyParams: {
      shop: shop || 'NOT PROVIDED',
      hmac: hmac || 'NOT PROVIDED',
      host: host || 'NOT PROVIDED',
      timestamp: timestamp || 'NOT PROVIDED',
    },
    analysis: {
      isShopifyCall: !!(shop && hmac && host),
      isEmbeddedContext: !!(host),
      hasValidParams: !!(shop && hmac && host && timestamp),
    }
  };

  console.log('🔍 Shopify Call Debug:', JSON.stringify(debugInfo, null, 2));

  // Return HTML response that can be viewed in browser
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Shopify Call Debug</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; }
        .warning { background: #fff3cd; color: #856404; }
        .error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <h1>🔍 Shopify Call Debug</h1>
    
    <div class="status ${debugInfo.analysis.isShopifyCall ? 'success' : 'error'}">
        ${debugInfo.analysis.isShopifyCall ? '✅ This appears to be a valid Shopify call' : '❌ This does not appear to be a Shopify call'}
    </div>

    ${debugInfo.analysis.isEmbeddedContext ? 
      '<div class="status success">✅ Embedded app context detected</div>' : 
      '<div class="status warning">⚠️ No embedded app context</div>'
    }

    <h2>Debug Information</h2>
    <pre>${JSON.stringify(debugInfo, null, 2)}</pre>

    <h2>Next Steps</h2>
    <ul>
        <li><a href="/?shop=${shop}&hmac=${hmac}&host=${host}&timestamp=${timestamp}">Test Root URL</a></li>
        <li><a href="/app?shop=${shop}&hmac=${hmac}&host=${host}&timestamp=${timestamp}">Test App URL</a></li>
        <li><a href="/dashboard?shop=${shop}&hmac=${hmac}&host=${host}&timestamp=${timestamp}">Test Dashboard URL</a></li>
    </ul>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
