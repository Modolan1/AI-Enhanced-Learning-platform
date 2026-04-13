import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function protect(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token missing' });
  }

  try {
    req.user = jwt.verify(header.split(' ')[1], env.jwtSecret);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
}
