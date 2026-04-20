import dotenv from 'dotenv';

dotenv.config();

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toPositiveNumber = (value, fallback) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toStringList = (value, fallback) => {
  const parsed = (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return parsed.length ? parsed : fallback;
};

const defaultClientUrls = ['http://localhost:5173', 'http://localhost:5174'];
const clientUrls = toStringList(process.env.CLIENT_URLS || process.env.CLIENT_URL, defaultClientUrls);
const FALLBACK_VIDEO_UPLOAD_MAX_BYTES = 50 * 1024 * 1024;
const legacyVideoUploadMaxKb = toPositiveInt(process.env.VIDEO_UPLOAD_MAX_KB, Math.round(FALLBACK_VIDEO_UPLOAD_MAX_BYTES / 1024));
const legacyVideoUploadMaxBytes = legacyVideoUploadMaxKb * 1024;
const configuredVideoUploadMaxGb = toPositiveNumber(process.env.VIDEO_UPLOAD_MAX_GB, legacyVideoUploadMaxBytes / (1024 * 1024 * 1024));
const videoUploadMaxBytes = Math.round(configuredVideoUploadMaxGb * 1024 * 1024 * 1024);
const videoUploadMaxMb = videoUploadMaxBytes / (1024 * 1024);

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || 'change_this_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: clientUrls[0],
  clientUrls,
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  documentUploadMaxBytes: toPositiveInt(process.env.DOCUMENT_UPLOAD_MAX_BYTES, 5 * 1024 * 1024),
  videoUploadMaxBytes,
  videoUploadMaxMb,
  bcryptSaltRounds: toPositiveInt(process.env.BCRYPT_SALT_ROUNDS, 12),
  passwordPepper: process.env.PASSWORD_PEPPER || '',
};
