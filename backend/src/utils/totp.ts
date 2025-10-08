import { authenticator } from 'otplib';

authenticator.options = {
  window: 1, // Allow 30 seconds before/after
};

export const generateTOTPSecret = (): string => {
  return authenticator.generateSecret();
};

export const generateTOTPUri = (email: string, secret: string): string => {
  return authenticator.keyuri(email, 'DebtRescue.AI', secret);
};

export const verifyTOTP = (token: string, secret: string): boolean => {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
};