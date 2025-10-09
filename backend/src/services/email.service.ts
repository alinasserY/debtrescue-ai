import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  try {
    await sgMail.send({
      from: process.env.EMAIL_FROM!,
      ...options,
    });
    logger.info(`Email sent to ${options.to}`);
  } catch (error: any) {
    logger.error('Email send failed', { to: options.to, error: error.message });
    throw new AppError('Failed to send email', 500, 'EMAIL_SEND_FAILED', { details: error.message });
  }
};

export const sendVerificationEmail = async (email: string, token: string, name?: string): Promise<void> => {
  const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Welcome to DebtRescue.AI${name ? `, ${name}` : ''}!</h2>
      <p>Thanks for signing up. Please verify your email to activate your account.</p>
      <p style="background: #f0f0f0; padding: 10px; border-radius: 4px;">
        <a href="${verifyUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Your Email</a>
      </p>
      <p>Or copy-paste this link: <a href="${verifyUrl}">${verifyUrl}</a></p>
      <p style="color: #666; font-size: 12px;">If you didn't create an account, ignore this email.</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <small>DebtRescue.AI - AI-Powered Debt Relief</small>
    </div>
  `;
  await sendEmail({
    to: email,
    subject: 'Verify your DebtRescue.AI Account',
    html,
  });
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Reset Your DebtRescue.AI Password</h2>
      <p>You requested a password reset. Click below to set a new one (expires in 1 hour).</p>
      <p style="background: #f0f0f0; padding: 10px; border-radius: 4px;">
        <a href="${resetUrl}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
      </p>
      <p>Or copy-paste: <a href="${resetUrl}">${resetUrl}</a></p>
      <p style="color: #666; font-size: 12px;">If you didn't request this, ignore it.</p>
      <small>DebtRescue.AI</small>
    </div>
  `;
  await sendEmail({
    to: email,
    subject: 'Password Reset Request - DebtRescue.AI',
    html,
  });
};