import { ValidationError } from './errors';

export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }

  // Additional checks
  const [localPart, domain] = email.split('@');
  
  if (localPart.length > 64) {
    throw new ValidationError('Email local part too long');
  }

  if (domain.length > 255) {
    throw new ValidationError('Email domain too long');
  }

  // Block disposable email domains (add more as needed)
  const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
  if (disposableDomains.some(d => domain.toLowerCase().includes(d))) {
    throw new ValidationError('Disposable email addresses are not allowed');
  }
};

export const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};