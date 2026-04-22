export function getRegistrationErrorDetails(error, fallbackTitle = 'Registration failed') {
  const status = Number(error?.response?.status || 0);
  const rawMessage = String(error?.response?.data?.message || error?.message || '').trim();
  const lowerMessage = rawMessage.toLowerCase();

  if (lowerMessage.includes('user already exists')) {
    return {
      title: 'Email already in use',
      message: 'An account already exists with that email address. Sign in instead, or use a different email to create a new account.',
    };
  }

  if (lowerMessage.includes('duplicate key') || lowerMessage.includes('e11000')) {
    return {
      title: 'Account could not be created right now',
      message: 'We hit a temporary server data conflict while creating your account. Please try again in a moment.',
    };
  }

  if (status === 400 || status === 422) {
    return {
      title: 'Check your details',
      message: rawMessage || 'Some registration details are invalid. Review the form and try again.',
    };
  }

  if (status >= 500) {
    return {
      title: 'We could not create your account',
      message: 'Something went wrong on the server while creating your account. Please try again shortly.',
    };
  }

  return {
    title: fallbackTitle,
    message: rawMessage || 'We could not complete your registration. Please review your details and try again.',
  };
}