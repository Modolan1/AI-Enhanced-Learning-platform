import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import instructorRoutes from './routes/instructorRoutes.js';
import { authService } from './services/authService.js';
import { sanitizeRequest } from './middleware/sanitizeMiddleware.js';
import { notFound } from './middleware/notFoundMiddleware.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { globalLimiter, authLimiter, aiLimiter, uploadLimiter } from './middleware/rateLimitMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');
mkdirSync(uploadsDir, { recursive: true });

const app = express();
const normalizeOrigin = (origin) => String(origin || '').trim().replace(/\/$/, '');
const allowedOrigins = new Set((env.clientUrls || []).map(normalizeOrigin));

app.use(cors({
	origin: (origin, callback) => {
		if (!origin) return callback(null, true);
		if (allowedOrigins.has(normalizeOrigin(origin))) return callback(null, true);
		return callback(new Error(`CORS blocked for origin: ${origin}`));
	},
	credentials: true,
}));
app.use(express.json());
app.use(sanitizeRequest);
app.use(morgan('dev'));

// ── Rate limiting ──────────────────────────────────────────────────────────────
// Broad global cap — covers all /api/* traffic
app.use('/api/', globalLimiter);
// Tighter caps for sensitive / expensive sub-paths
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/update-password', authLimiter);
app.use('/api/student/recommendations/refresh', aiLimiter);
app.use('/api/student/documents/analyze', uploadLimiter);
app.use('/api/student/documents', aiLimiter);          // chat + quiz endpoints

app.use('/uploads', express.static(uploadsDir));
app.get('/', (req, res) => res.json({ success: true, message: 'AI Learning API running' }));
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Backend is healthy' });
});
app.get('/api/public/courses', async (_req, res, next) => {
	try {
		res.json({ success: true, data: await authService.listPublishedCourses() });
	} catch (error) {
		next(error);
	}
});
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/instructor', instructorRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
