import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  authLimiter,
  passwordResetLimiter,
} from '../middleware/rateLimit.middleware';

const router = Router();

// Public routes (no authentication required)
router.post('/signup', authLimiter, authController.signup.bind(authController));
router.post('/login', authLimiter, authController.login.bind(authController));
router.post('/oauth/:provider', authLimiter, authController.oauthLogin.bind(authController));
router.post('/verify-email', authController.verifyEmail.bind(authController));
router.post('/resend-verification', authLimiter, authController.resendVerification.bind(authController));
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));

// Protected routes (authentication required)
router.use(authenticate); // Apply auth middleware to all routes below

router.get('/me', authController.getMe.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.post('/logout-all', authController.logoutAll.bind(authController));

// 2FA routes
router.post('/2fa/setup', authController.setup2FA.bind(authController));
router.post('/2fa/verify', authController.verify2FA.bind(authController));
router.post('/2fa/disable', authController.disable2FA.bind(authController));

// Session management
router.get('/sessions', authController.getSessions.bind(authController));
router.delete('/sessions/:sessionId', authController.deleteSession.bind(authController));

export default router;