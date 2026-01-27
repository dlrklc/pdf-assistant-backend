import type { NextFunction, Request, Response } from 'express';
import type { Permission, UserContext } from '../services/user.service';
import { hasPermission } from './rbac';

/**
 * Attaches UserContext to req for downstream handlers.
 */
export type RequestWithContext = Request & { userContext?: UserContext };

export function requirePermission(required: Permission) {
  return (req: RequestWithContext, res: Response, next: NextFunction) => {
    const ctx = req.userContext;
    if (!ctx || !Array.isArray(ctx.permissions) || ctx.permissions.length === 0) {
      // Fail closed: no context/permissions => deny
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!hasPermission(ctx.permissions, required)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
}

