import type { NextFunction, Request, Response } from 'express';
import type { UserContext } from './user.service';
import { userContextRepository } from './user.service';
import { resolvePermissions } from '../rbac/rbac';

export type AuthenticatedRequest = Request & {
  user?: { userId?: string; role?: string; email?: string; username?: string };
  userContext?: UserContext;
};

/**
 * Resolve UserContext for the current request.
 * Fail closed: if anything required is missing, deny.
 */
export async function attachUserContext(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const workspaceId = req.header('x-workspace-id');

    if (!userId || !workspaceId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const baseCtx = await userContextRepository.getUserContext({ userId, workspaceId });
    const permissions = resolvePermissions(baseCtx.roles);

    req.userContext = {
      ...baseCtx,
      permissions,
    };

    return next();
  } catch (err) {
    // Fail closed
    return res.status(403).json({ error: 'Forbidden' });
  }
}

