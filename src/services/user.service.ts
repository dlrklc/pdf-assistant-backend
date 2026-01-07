// Simple user service for testing purposes
interface User {
  userId: string;
  username: string;
  email: string;
  password: string;
  role: string;
}

// Demo users
const users: User[] = [
  {
    userId: '1',
    username: 'john.doe',
    email: 'johndoe@gmail.com',
    password: 'password123',
    role: 'admin',
  },
  {
    userId: '2',
    username: 'jane.smith',
    email: 'jane.smith@gmail.com',
    password: 'password123',
    role: 'user',
  },
];

export async function findUserByEmail(email: string): Promise<User | null> {
  return users.find((u) => u.email === email) || null;
}

export async function findUserByUsername(username: string): Promise<User | null> {
  return users.find((u) => u.username === username) || null;
}

export async function findUserByEmailOrUsername(
  identifier: string
): Promise<User | null> {
  return (
    users.find(
      (u) => u.email === identifier || u.username === identifier
    ) || null
  );
}

export function validatePassword(
  inputPassword: string,
  userPassword: string
): boolean {
  return inputPassword === userPassword;
}

export function getUserWithoutPassword(user: User): Omit<User, 'password'> {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

