import express from 'express';
import {
  requestConsent,
  getMyConsentRequests,
  respondToConsent,
  revokeConsent
} from '../controllers/consent.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = express.Router();

// 🧑‍⚕️ / 🏥 Request consent (Doctor / Hospital)
router.post(
  '/request',
  protect,
  authorizeRoles('doctor', 'hospital'),
  requestConsent
);

// 👤 View my consent requests (Patient)
router.get(
  '/my',
  protect,
  authorizeRoles('patient'),
  getMyConsentRequests
);

// 👤 Approve / Reject consent (Patient)
router.post(
  '/respond',
  protect,
  authorizeRoles('patient'),
  respondToConsent
);

// 👤 Revoke consent (Patient)
router.post(
  '/revoke',
  protect,
  authorizeRoles('patient'),
  revokeConsent
);

export default router;
