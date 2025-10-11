import { Router } from 'express';
import multer from 'multer';
import { usersController } from '../controllers/users.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

// All routes require authentication
router.use(authMiddleware);

// Profile routes
router.get('/me', usersController.getProfile.bind(usersController));
router.put('/me', usersController.updateProfile.bind(usersController));
router.post('/me/avatar', upload.single('avatar'), usersController.uploadAvatar.bind(usersController));

// Password routes
router.put('/me/password', usersController.updatePassword.bind(usersController));

// Notification preferences
router.get('/me/notifications', usersController.getNotificationPreferences.bind(usersController));
router.put('/me/notifications', usersController.updateNotificationPreferences.bind(usersController));

// Activity & Sessions
router.get('/me/activity', usersController.getActivity.bind(usersController));
router.get('/me/sessions', usersController.getSessions.bind(usersController));
router.delete('/me/sessions/:sessionId', usersController.revokeSession.bind(usersController));
router.delete('/me/sessions', usersController.revokeAllSessions.bind(usersController));

// Delete account
router.delete('/me', usersController.deleteAccount.bind(usersController));

export default router;