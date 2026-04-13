import dotenv from 'dotenv';

dotenv.config();

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
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

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || 'change_this_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: clientUrls[0],
  clientUrls,
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  documentUploadMaxBytes: toPositiveInt(process.env.DOCUMENT_UPLOAD_MAX_BYTES, 5 * 1024 * 1024),
  bcryptSaltRounds: toPositiveInt(process.env.BCRYPT_SALT_ROUNDS, 12),
  passwordPepper: process.env.PASSWORD_PEPPER || '',
};
