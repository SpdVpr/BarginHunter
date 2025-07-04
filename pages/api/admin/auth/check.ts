import { NextApiRequest, NextApiResponse } from 'next';
import { AdminUserService } from '../../../../src/lib/database';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for admin token in cookies or headers
    const token = req.cookies.admin_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(200).json({ 
        authenticated: false,
        message: 'No admin token found'
      });
    }

    // Verify JWT token
    const secret = process.env.ADMIN_JWT_SECRET || 'your-super-secret-admin-key';
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtError) {
      return res.status(200).json({ 
        authenticated: false,
        message: 'Invalid admin token'
      });
    }

    // Check if admin user exists and is active
    const adminUser = await AdminUserService.getAdminUser(decoded.email);
    
    if (!adminUser) {
      return res.status(200).json({ 
        authenticated: false,
        message: 'Admin user not found'
      });
    }

    // Update last login
    await AdminUserService.updateLastLogin(decoded.email);

    console.log('✅ Admin authenticated:', decoded.email);

    res.status(200).json({
      authenticated: true,
      user: {
        email: adminUser.email,
        role: adminUser.role,
        permissions: adminUser.permissions
      }
    });

  } catch (error) {
    console.error('❌ Admin auth check failed:', error);
    res.status(500).json({
      authenticated: false,
      error: 'Authentication check failed'
    });
  }
}
