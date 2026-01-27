/**
 * In-memory user store
 *
 * This file is intentionally shaped like a DB-backed repository
 */

export type Role = 'Admin' | 'Editor' | 'Viewer';
export type Permission =
  | 'documents:upload'
  | 'documents:delete'
  | 'documents:reindex'
  | 'rag:query';

export interface UserContext {
  userId: string;
  workspaceId: string;
  roles: Role[];
  permissions: Permission[];
}

export interface UserRecord {
  userId: string;
  username: string;
  email: string;
  password: string;
  globalRole?: Role;
}

// Demo users
const users: UserRecord[] = [
  {
    userId: '1',
    username: 'john.doe',
    email: 'johndoe@gmail.com',
    password: 'password123',
    globalRole: 'Admin',
  },
  {
    userId: '2',
    username: 'jane.smith',
    email: 'jane.smith@gmail.com',
    password: 'password123',
    globalRole: 'Viewer',
  },
];

// Mock workspace memberships
const workspaceRoles: Record<string, Record<string, Role[]>> = {
  'ws-1': {
    '1': ['Admin'],
    '2': ['Viewer'],
  },
  'ws-2': {
    '1': ['Editor'],
    '2': ['Editor'],
  },
};

export interface UserContextRepository {
  getUserContext(params: { userId: string; workspaceId: string }): Promise<Omit<UserContext, 'permissions'>>;
}

/**
 * Default in-memory implementation.
 */
export const userContextRepository: UserContextRepository = {
  async getUserContext({ userId, workspaceId }) {
    const roles = workspaceRoles?.[workspaceId]?.[userId];
    if (!roles || roles.length === 0) {
      // Fail closed: no membership, no context
      throw new Error('User is not a member of this workspace');
    }

    return {
      userId,
      workspaceId,
      roles,
    };
  },
};

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  return users.find((u) => u.email === email) || null;
}

export async function findUserByUsername(username: string): Promise<UserRecord | null> {
  return users.find((u) => u.username === username) || null;
}

export async function findUserByEmailOrUsername(identifier: string): Promise<UserRecord | null> {
  return users.find((u) => u.email === identifier || u.username === identifier) || null;
}

export function validatePassword(inputPassword: string, userPassword: string): boolean {
  return inputPassword === userPassword;
}

export function getUserWithoutPassword(user: UserRecord): Omit<UserRecord, 'password'> {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
