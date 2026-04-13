export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireSpecialChar: true,
};

const SPECIAL_CHAR_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;
const UPPERCASE_RE = /[A-Z]/;

export function validatePassword(password) {
  const errors = [];

  if (typeof password !== 'string' || !password) {
    errors.push('Password is required.');
    return errors;
  }

  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Password must be at least ${PASSWORD_RULES.minLength} characters.`);
  }

  if (password.length > PASSWORD_RULES.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_RULES.maxLength} characters.`);
  }

  if (!UPPERCASE_RE.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }

  if (!SPECIAL_CHAR_RE.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&* …).');
  }

  return errors;
}
