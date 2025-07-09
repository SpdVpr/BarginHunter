import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const shop = req.query.shop || 'bleblehoho.myshopify.com';

  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Shop Manager - ${shop}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .button { 
            display: inline-block; 
            background: #5c6ac4; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 10px 5px;
            cursor: pointer;
            border: none;
            font-size: 14px;
        }
        .button:hover { background: #4c5aa0; }
        .button.danger { background: #d72c0d; }
        .button.danger:hover { background: #b02a0c; }
        .info-box { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .result { margin: 20px 0; padding: 15px; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .loading { background: #fff3cd; color: #856404; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Shop Manager</h1>
        
        <div class="info-box">
            <h3>Shop Information</h3>
            <p><strong>Shop:</strong> ${shop}</p>
            <p><strong>Current Time:</strong> ${new Date().toISOString()}</p>
        </div>

        <h2>Actions</h2>
        <button class="button" onclick="checkShopStatus()">📊 Check Shop Status</button>
        <button class="button" onclick="activateShop()">✅ Activate Shop</button>
        <button class="button" onclick="testGameSession()">🎮 Test Game Session</button>
        <button class="button danger" onclick="resetShop()">🔄 Reset Shop Data</button>

        <div id="result"></div>

        <h2>Quick Links</h2>
        <a href="/dashboard?shop=${shop}" class="button">📱 Dashboard</a>
        <a href="/widget/game?shop=${shop}&test=true" class="button" target="_blank">🎮 Test Game Widget</a>
        <a href="/api/debug/installation-flow?shop=${shop}" class="button" target="_blank">🔍 Installation Debug</a>
    </div>

    <script>
        const shop = '${shop}';
        const resultDiv = document.getElementById('result');

        function showResult(message, type = 'info') {
            resultDiv.innerHTML = \`<div class="result \${type}">\${message}</div>\`;
        }

        function showLoading(message) {
            showResult(message, 'loading');
        }

        async function checkShopStatus() {
            showLoading('Checking shop status...');
            
            try {
                const response = await fetch(\`/api/debug/installation-flow?shop=\${shop}\`);
                const data = await response.json();
                
                if (data.success) {
                    const store = data.debug.store;
                    const gameConfig = data.debug.gameConfig;
                    
                    let html = '<h3>Shop Status</h3>';
                    html += \`<p><strong>Store Active:</strong> \${store?.isActive ? '✅ Yes' : '❌ No'}</p>\`;
                    html += \`<p><strong>Has Access Token:</strong> \${store?.hasAccessToken ? '✅ Yes' : '❌ No'}</p>\`;
                    html += \`<p><strong>Game Config:</strong> \${gameConfig ? '✅ Found' : '❌ Missing'}</p>\`;
                    html += \`<p><strong>Installation Complete:</strong> \${data.debug.installationComplete ? '✅ Yes' : '❌ No'}</p>\`;
                    
                    if (data.debug.missingComponents) {
                        html += '<h4>Missing Components:</h4><ul>';
                        Object.entries(data.debug.missingComponents).forEach(([key, missing]) => {
                            if (missing) html += \`<li>\${key}</li>\`;
                        });
                        html += '</ul>';
                    }
                    
                    showResult(html, 'success');
                } else {
                    showResult('Failed to check shop status: ' + data.error, 'error');
                }
            } catch (error) {
                showResult('Error checking shop status: ' + error.message, 'error');
            }
        }

        async function activateShop() {
            showLoading('Activating shop...');
            
            try {
                const response = await fetch('/api/debug/activate-shop', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ shop: shop })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    let html = '<h3>Shop Activated Successfully!</h3>';
                    html += \`<p><strong>Store Active:</strong> \${data.store.isActive ? '✅ Yes' : '❌ No'}</p>\`;
                    html += \`<p><strong>Game Config:</strong> \${data.gameConfig ? '✅ Created' : '❌ Failed'}</p>\`;
                    html += '<p>You can now test the games!</p>';
                    
                    showResult(html, 'success');
                } else {
                    showResult('Failed to activate shop: ' + data.error, 'error');
                }
            } catch (error) {
                showResult('Error activating shop: ' + error.message, 'error');
            }
        }

        async function testGameSession() {
            showLoading('Testing game session...');
            
            try {
                const response = await fetch('/api/game/start-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        shop: shop,
                        gameType: 'runner',
                        test: true
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    let html = '<h3>Game Session Test Successful!</h3>';
                    html += \`<p><strong>Session ID:</strong> \${data.sessionId}</p>\`;
                    html += \`<p><strong>Can Play:</strong> \${data.canPlay ? '✅ Yes' : '❌ No'}</p>\`;
                    html += \`<p><strong>Plays Remaining:</strong> \${data.playsRemaining}</p>\`;
                    
                    showResult(html, 'success');
                } else {
                    showResult('Game session test failed: ' + data.message, 'error');
                }
            } catch (error) {
                showResult('Error testing game session: ' + error.message, 'error');
            }
        }

        async function resetShop() {
            if (!confirm('Are you sure you want to reset all shop data? This cannot be undone.')) {
                return;
            }
            
            showLoading('Resetting shop data...');
            showResult('Reset functionality not implemented yet', 'error');
        }

        // Auto-check status on load
        window.onload = function() {
            checkShopStatus();
        };
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
