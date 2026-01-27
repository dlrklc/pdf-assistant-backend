import type { UserContext } from '../services/user.service';

/**
 * Builds a Pinecone metadata filter from UserContext.
 *
 * Fail-closed: if context is missing required fields, return a filter that matches nothing.
 *
 * Metadata contract:
 * - workspace_id: string
 * - owner_id: string
 * - allowed_roles: Role[]
 * - allowed_users: string[]
 */
export function buildPineconeFilterFromUserContext(ctx: UserContext | null | undefined) {
  if (!ctx?.userId || !ctx?.workspaceId || !Array.isArray(ctx.roles) || ctx.roles.length === 0) {
    // Matches nothing
    return { workspace_id: { $eq: '__deny__' } };
  }

  return {
    workspace_id: { $eq: ctx.workspaceId },
    $or: [
      { owner_id: { $eq: ctx.userId } },
      { allowed_users: { $in: [ctx.userId] } },
      { allowed_roles: { $in: ctx.roles } },
    ],
  };
}

