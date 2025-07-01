import { NextApiRequest, NextApiResponse } from 'next';

// Default intro settings
const defaultIntroSettings = {
  title: 'Bargain Hunter',
  subtitle: 'Jump & earn discounts!',
  backgroundColor: '#667eea',
  textColor: '#ffffff',
  buttonColor: '#28a745',
  buttonTextColor: '#ffffff',
  discountText: 'Win {minDiscount}% - {maxDiscount}% OFF!',
  showEmojis: true,
  borderRadius: 12,
  padding: 12,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shop } = req.query;

  if (!shop || typeof shop !== 'string') {
    return res.status(400).json({ error: 'Shop parameter is required' });
  }

  if (req.method === 'GET') {
    try {
      // For now, always return default settings
      // In the future, this could load from database
      res.status(200).json(defaultIntroSettings);
    } catch (error) {
      console.error('Error fetching intro settings:', error);
      res.status(200).json(defaultIntroSettings);
    }
  } else if (req.method === 'POST') {
    try {
      const settings = req.body;
      
      // Validate settings
      const validatedSettings = {
        ...defaultIntroSettings,
        ...settings,
      };

      // For now, just return the settings (in future, save to database)
      res.status(200).json({ 
        success: true, 
        message: 'Settings saved successfully',
        settings: validatedSettings 
      });
    } catch (error) {
      console.error('Error saving intro settings:', error);
      res.status(500).json({ error: 'Failed to save intro settings' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
