import { NextApiRequest, NextApiResponse } from 'next';
import { AdminUserService } from '../../../../src/lib/database';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Show login form
    const loginForm = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bargain Hunter - Admin Login</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .login-container {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
          }
          .logo {
            text-align: center;
            margin-bottom: 2rem;
          }
          .logo h1 {
            color: #333;
            margin: 0;
            font-size: 1.8rem;
          }
          .logo p {
            color: #666;
            margin: 0.5rem 0 0 0;
            font-size: 0.9rem;
          }
          .form-group {
            margin-bottom: 1rem;
          }
          label {
            display: block;
            margin-bottom: 0.5rem;
            color: #333;
            font-weight: 500;
          }
          input[type="email"], input[type="password"] {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e1e5e9;
            border-radius: 6px;
            font-size: 1rem;
            transition: border-color 0.2s;
            box-sizing: border-box;
          }
          input[type="email"]:focus, input[type="password"]:focus {
            outline: none;
            border-color: #667eea;
          }
          .login-btn {
            width: 100%;
            padding: 0.75rem;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
          }
          .login-btn:hover {
            background: #5a6fd8;
          }
          .error {
            color: #e74c3c;
            margin-top: 1rem;
            text-align: center;
          }
          .security-note {
            margin-top: 1.5rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 6px;
            font-size: 0.85rem;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="login-container">
          <div class="logo">
            <h1>🏢 Bargain Hunter</h1>
            <p>Admin Dashboard</p>
          </div>
          
          <form method="POST" action="/api/admin/auth/login">
            <div class="form-group">
              <label for="email">Admin Email</label>
              <input type="email" id="email" name="email" required placeholder="admin@bargainhunter.com">
            </div>
            
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required placeholder="Enter your password">
            </div>
            
            <button type="submit" class="login-btn">Login to Admin Dashboard</button>
          </form>
          
          <div class="security-note">
            🔐 This area is restricted to authorized administrators only. 
            All access attempts are logged and monitored.
          </div>
        </div>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(loginForm);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    console.log('🔐 Admin login attempt:', email);

    // Check if admin user exists
    const adminUser = await AdminUserService.getAdminUser(email);
    
    if (!adminUser) {
      console.log('❌ Admin user not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For demo purposes, we'll use a simple password check
    // In production, you should use proper password hashing
    const validPassword = password === process.env.ADMIN_PASSWORD || password === 'admin123';
    
    if (!validPassword) {
      console.log('❌ Invalid password for admin:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const secret = process.env.ADMIN_JWT_SECRET || 'your-super-secret-admin-key';
    const token = jwt.sign(
      { 
        email: adminUser.email, 
        role: adminUser.role,
        permissions: adminUser.permissions 
      },
      secret,
      { expiresIn: '24h' }
    );

    // Set secure cookie
    res.setHeader('Set-Cookie', [
      `admin_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`
    ]);

    // Update last login
    await AdminUserService.updateLastLogin(email);

    console.log('✅ Admin login successful:', email);

    // Redirect to admin dashboard
    res.redirect(302, '/admin/dashboard');

  } catch (error) {
    console.error('❌ Admin login failed:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
