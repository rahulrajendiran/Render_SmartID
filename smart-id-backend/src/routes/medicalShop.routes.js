import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { checkPermission } from '../middleware/permission.middleware.js';
import {
  getPrescriptionPdf,
  scanPatientForMedicalShop
} from '../controllers/medicalShop.controller.js';

const router = express.Router();

router.use(protect, authorizeRoles('medical_shop'));

router.post('/nfc/scan', checkPermission('prescription_view'), scanPatientForMedicalShop);
router.get('/prescriptions/:prescriptionId/pdf', checkPermission('prescription_view'), getPrescriptionPdf);

export default router;
