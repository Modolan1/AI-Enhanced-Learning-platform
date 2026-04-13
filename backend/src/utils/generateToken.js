import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function generateToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}
