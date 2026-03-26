import express from 'express';
import {
  getStatistics,
  getAuditLogs,
  getUsers,
  getPatientDetailsByUser,
  searchPatients,
  getPermissions,
  savePermissions
} from '../controllers/admin.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = express.Router();

router.use(protect, authorizeRoles('admin'));

router.get('/statistics', getStatistics);
router.get('/audit-logs', getAuditLogs);
router.get('/users', getUsers);
router.get('/patients/search', searchPatients);
router.get('/patients/user/:userId', getPatientDetailsByUser);
router.get('/permissions', getPermissions);
router.post('/permissions', savePermissions);

export default router;
