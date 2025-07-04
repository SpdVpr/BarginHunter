import { NextApiRequest, NextApiResponse } from 'next';
import { AdminUserService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, setupKey } = req.body;

    // Check setup key for security
    const validSetupKey = process.env.ADMIN_SETUP_KEY || 'setup-bargain-hunter-admin-2024';
    
    if (setupKey !== validSetupKey) {
      return res.status(401).json({ error: 'Invalid setup key' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    console.log('🔧 Setting up admin user:', email);

    // Check if admin user already exists
    const existingAdmin = await AdminUserService.getAdminUser(email);
    
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin user already exists' });
    }

    // Create super admin user
    const adminId = await AdminUserService.createAdminUser({
      email,
      role: 'super_admin',
      permissions: {
        viewAnalytics: true,
        manageShops: true,
        manageBilling: true,
        viewSupport: true,
        systemAdmin: true,
      },
      isActive: true,
    });

    console.log('✅ Admin user created:', adminId);

    res.status(200).json({
      success: true,
      message: 'Admin user created successfully',
      adminId,
      email,
      loginUrl: '/api/admin/auth/login'
    });

  } catch (error) {
    console.error('❌ Admin setup failed:', error);
    res.status(500).json({
      error: 'Admin setup failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
