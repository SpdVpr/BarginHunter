import { NextApiRequest, NextApiResponse } from 'next';
import { AdminUserService } from './database';
import jwt from 'jsonwebtoken';

export interface AdminAuthRequest extends NextApiRequest {
  adminUser?: {
    email: string;
    role: string;
    permissions: any;
  };
}

export function withAdminAuth(
  handler: (req: AdminAuthRequest, res: NextApiResponse) => Promise<void>,
  requiredPermission?: string
) {
  return async (req: AdminAuthRequest, res: NextApiResponse) => {
    try {
      // Get token from cookies or headers
      const token = req.cookies.admin_token || req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'Admin authentication required' });
      }

      // Verify JWT token
      const secret = process.env.ADMIN_JWT_SECRET || 'your-super-secret-admin-key';
      let decoded: any;
      
      try {
        decoded = jwt.verify(token, secret);
      } catch (jwtError) {
        return res.status(401).json({ error: 'Invalid admin token' });
      }

      // Check if admin user exists and is active
      const adminUser = await AdminUserService.getAdminUser(decoded.email);
      
      if (!adminUser) {
        return res.status(401).json({ error: 'Admin user not found' });
      }

      // Check specific permission if required
      if (requiredPermission && !adminUser.permissions[requiredPermission as keyof typeof adminUser.permissions]) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Add admin user to request
      req.adminUser = {
        email: adminUser.email,
        role: adminUser.role,
        permissions: adminUser.permissions
      };

      // Set admin email header for other API calls
      req.headers['x-admin-email'] = adminUser.email;

      // Update last login
      await AdminUserService.updateLastLogin(decoded.email);

      // Call the actual handler
      return handler(req, res);

    } catch (error) {
      console.error('❌ Admin auth middleware error:', error);
      return res.status(500).json({ error: 'Authentication error' });
    }
  };
}

export function requireAdminPermission(permission: string) {
  return (req: AdminAuthRequest, res: NextApiResponse, next: () => void) => {
    if (!req.adminUser) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    if (!req.adminUser.permissions[permission]) {
      return res.status(403).json({ error: `Permission required: ${permission}` });
    }

    next();
  };
}

export async function isAdminAuthenticated(req: NextApiRequest): Promise<boolean> {
  try {
    const token = req.cookies.admin_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) return false;

    const secret = process.env.ADMIN_JWT_SECRET || 'your-super-secret-admin-key';
    const decoded: any = jwt.verify(token, secret);
    
    const adminUser = await AdminUserService.getAdminUser(decoded.email);
    return !!adminUser;
    
  } catch (error) {
    return false;
  }
}

export function generateAdminToken(email: string, role: string, permissions: any): string {
  const secret = process.env.ADMIN_JWT_SECRET || 'your-super-secret-admin-key';
  
  return jwt.sign(
    { email, role, permissions },
    secret,
    { expiresIn: '24h' }
  );
}

export function verifyAdminToken(token: string): any {
  const secret = process.env.ADMIN_JWT_SECRET || 'your-super-secret-admin-key';
  return jwt.verify(token, secret);
}
