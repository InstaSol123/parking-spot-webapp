import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../types/index.js';
import { requireAccess } from '../middleware/checkPermission.js';

const router = Router();

// Get system settings (accessible to all authenticated users)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    let settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { smsApiKey: '', maskedCallApiKey: '' }
      });
    }

    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update system settings (admin only)
router.put('/', requireAccess('settings', 'edit'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Only admins can update settings' });
    }

    const { smsApiKey, maskedCallApiKey, adminPaymentInfo, adminPaymentQr, supportEmail, supportPhone, logoUrl } = req.body;

    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          smsApiKey: smsApiKey || '',
          maskedCallApiKey: maskedCallApiKey || '',
          adminPaymentInfo,
          adminPaymentQr,
          supportEmail,
          supportPhone,
          logoUrl
        }
      });
    } else {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          ...(smsApiKey !== undefined && { smsApiKey }),
          ...(maskedCallApiKey !== undefined && { maskedCallApiKey }),
          ...(adminPaymentInfo !== undefined && { adminPaymentInfo }),
          ...(adminPaymentQr !== undefined && { adminPaymentQr }),
          ...(supportEmail !== undefined && { supportEmail }),
          ...(supportPhone !== undefined && { supportPhone }),
          ...(logoUrl !== undefined && { logoUrl })
        }
      });
    }

    res.json({ success: true, data: settings, message: 'Settings updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get SMS templates
router.get('/sms-templates', async (req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.sMSTemplate.findMany();
    res.json({ success: true, data: templates });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create SMS template (admin only)
router.post('/sms-templates', requireAccess('settings', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Only admins can create SMS templates' });
    }

    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    const template = await prisma.sMSTemplate.create({ data: { text } });
    res.status(201).json({ success: true, data: template });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete SMS template (admin only)
router.delete('/sms-templates/:id', requireAccess('settings', 'delete'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Only admins can delete SMS templates' });
    }

    await prisma.sMSTemplate.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'SMS template deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
