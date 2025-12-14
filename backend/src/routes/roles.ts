import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../types/index.js';
import { requireAccess } from '../middleware/checkPermission.js';

const router = Router();

// Get all roles
router.get('/', requireAccess('roles', 'view'), async (req: AuthRequest, res: Response) => {
  try {
    const roles = await prisma.accessRole.findMany({
      include: { permissions: true }
    });

    // Transform permissions string to array for frontend
    const rolesWithArrayPermissions = roles.map(role => ({
      ...role,
      permissions: role.permissions.map(p => ({
        ...p,
        actions: p.actions.split(',')
      }))
    }));

    res.json({ success: true, data: rolesWithArrayPermissions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get role by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const role = await prisma.accessRole.findUnique({
      where: { id: req.params.id },
      include: { permissions: true }
    });

    if (!role) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }

    // Transform permissions string to array for frontend
    const roleWithArrayPermissions = {
      ...role,
      permissions: role.permissions.map(p => ({
        ...p,
        actions: p.actions.split(',')
      }))
    };

    res.json({ success: true, data: roleWithArrayPermissions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create role (admin only)
router.post('/', requireAccess('roles', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Only admins can create roles' });
    }

    const { name, description, permissions } = req.body;
    if (!name || !description) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Transform permissions array to match schema format
    const formattedPermissions = (permissions || []).map((p: any) => ({
      resource: p.resource,
      actions: Array.isArray(p.actions) ? p.actions.join(',') : p.actions
    }));

    const role = await prisma.accessRole.create({
      data: {
        name,
        description,
        isSystem: false, // Explicitly set custom roles as non-system
        permissions: {
          create: formattedPermissions
        }
      },
      include: { permissions: true }
    });

    // Transform permissions string to array for frontend response
    const roleWithArrayPermissions = {
      ...role,
      permissions: role.permissions.map(p => ({
        ...p,
        actions: p.actions.split(',')
      }))
    };

    res.status(201).json({ success: true, data: roleWithArrayPermissions, message: 'Role created' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update role (admin only)
router.put('/:id', requireAccess('roles', 'edit'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Only admins can update roles' });
    }

    const role = await prisma.accessRole.findUnique({ where: { id: req.params.id } });
    if (!role) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }

    if (role.isSystem) {
      return res.status(400).json({ success: false, error: 'Cannot update system roles' });
    }

    const { name, description } = req.body;
    const updated = await prisma.accessRole.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description && { description })
      },
      include: { permissions: true }
    });

    // Transform permissions string to array for frontend
    const updatedWithArrayPermissions = {
      ...updated,
      permissions: updated.permissions.map(p => ({
        ...p,
        actions: p.actions.split(',')
      }))
    };

    res.json({ success: true, data: updatedWithArrayPermissions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete role (admin only)
router.delete('/:id', requireAccess('roles', 'delete'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Only admins can delete roles' });
    }

    const role = await prisma.accessRole.findUnique({ where: { id: req.params.id } });
    if (!role) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }

    if (role.isSystem) {
      return res.status(400).json({ success: false, error: 'Cannot delete system roles' });
    }

    await prisma.accessRole.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Role deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check permission
router.post('/check-permission', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { resource, action } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { accessRole: { include: { permissions: true } } }
    });

    if (!user || !user.accessRole) {
      return res.json({ success: true, data: { allowed: false } });
    }

    const permission = user.accessRole.permissions.find(p => p.resource === resource);
    const allowed = permission ? permission.actions.includes(action) : false;

    res.json({ success: true, data: { allowed } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
