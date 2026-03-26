import express from 'express';
import {
  getHospitalStats,
  getPatientFlow,
  getRecentActivity,
  getSystemHealth,
  authenticateEmergencyManager
} from '../controllers/hospital.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { checkPermission } from '../middleware/permission.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Hospital dashboard statistics
router.get('/stats', authorizeRoles('hospital'), getHospitalStats);

// Patient flow data for charts
router.get('/patient-flow', authorizeRoles('hospital', 'admin'), getPatientFlow);

// Recent hospital activity
router.get('/activity', authorizeRoles('hospital'), getRecentActivity);

// System health status
router.get('/health', authorizeRoles('hospital', 'admin'), getSystemHealth);

// Emergency authentication - needs emergency_bypass permission
router.post('/emergency/auth', authorizeRoles('hospital', 'admin'), checkPermission('emergency_bypass'), authenticateEmergencyManager);

export default router;
