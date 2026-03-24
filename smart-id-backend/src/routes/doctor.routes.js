import express from 'express';
import {
  getDoctorStats,
  getPatientByNfc,
  getRecentPatients,
  getDeviceStatus
} from '../controllers/doctor.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Doctor dashboard statistics
router.get('/stats', authorizeRoles('doctor'), getDoctorStats);

// Get patient by NFC UID
router.get('/patient/:uid', authorizeRoles('doctor', 'hospital'), getPatientByNfc);

// Get recent patients
router.get('/recent-patients', authorizeRoles('doctor'), getRecentPatients);

// Get device status
router.get('/device-status', authorizeRoles('doctor', 'hospital'), getDeviceStatus);

export default router;