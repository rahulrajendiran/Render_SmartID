import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import {
  getPrescriptionPdf,
  scanPatientForMedicalShop
} from '../controllers/medicalShop.controller.js';

const router = express.Router();

router.use(protect, authorizeRoles('medical_shop'));

router.post('/nfc/scan', scanPatientForMedicalShop);
router.get('/prescriptions/:prescriptionId/pdf', getPrescriptionPdf);

export default router;
