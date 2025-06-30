import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../src/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface IntroSettings {
  title: string;
  subtitle: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  discountText: string;
  showEmojis: boolean;
  borderRadius: number;
  padding: number;
  customCSS: string;
}

const DEFAULT_INTRO_SETTINGS: IntroSettings = {
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
  customCSS: '',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shop } = req.query;

  if (!shop || typeof shop !== 'string') {
    return res.status(400).json({ error: 'Shop parameter is required' });
  }

  try {
    if (req.method === 'GET') {
      // Get intro settings
      const settingsRef = doc(db, 'introSettings', shop);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        const settings = settingsDoc.data() as IntroSettings;
        res.status(200).json(settings);
      } else {
        // Return default settings if none exist
        res.status(200).json(DEFAULT_INTRO_SETTINGS);
      }
    } else if (req.method === 'POST') {
      // Save intro settings
      const { settings } = req.body;
      
      if (!settings) {
        return res.status(400).json({ error: 'Settings data is required' });
      }

      // Validate settings structure
      const validatedSettings: IntroSettings = {
        title: settings.title || DEFAULT_INTRO_SETTINGS.title,
        subtitle: settings.subtitle || DEFAULT_INTRO_SETTINGS.subtitle,
        backgroundColor: settings.backgroundColor || DEFAULT_INTRO_SETTINGS.backgroundColor,
        textColor: settings.textColor || DEFAULT_INTRO_SETTINGS.textColor,
        buttonColor: settings.buttonColor || DEFAULT_INTRO_SETTINGS.buttonColor,
        buttonTextColor: settings.buttonTextColor || DEFAULT_INTRO_SETTINGS.buttonTextColor,
        discountText: settings.discountText || DEFAULT_INTRO_SETTINGS.discountText,
        showEmojis: settings.showEmojis !== undefined ? settings.showEmojis : DEFAULT_INTRO_SETTINGS.showEmojis,
        borderRadius: settings.borderRadius !== undefined ? settings.borderRadius : DEFAULT_INTRO_SETTINGS.borderRadius,
        padding: settings.padding !== undefined ? settings.padding : DEFAULT_INTRO_SETTINGS.padding,
        customCSS: settings.customCSS || DEFAULT_INTRO_SETTINGS.customCSS,
      };

      const settingsRef = doc(db, 'introSettings', shop);
      await setDoc(settingsRef, {
        ...validatedSettings,
        updatedAt: new Date().toISOString(),
        shop: shop,
      });

      res.status(200).json({ 
        success: true, 
        message: 'Intro settings saved successfully',
        settings: validatedSettings 
      });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Error handling intro settings:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
