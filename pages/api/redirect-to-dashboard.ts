import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shop } = req.query;
  
  if (!shop) {
    return res.status(400).json({ error: 'Shop parameter required' });
  }
  
  // Redirect to the new dashboard
  const dashboardUrl = `https://bargin-hunter2.vercel.app/dashboard?shop=${shop}`;
  
  return res.redirect(302, dashboardUrl);
}
