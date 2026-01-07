// src/env.ts
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.ACCESS_TOKEN_SECRET) {
  throw new Error('ACCESS_TOKEN_SECRET is missing');
}
