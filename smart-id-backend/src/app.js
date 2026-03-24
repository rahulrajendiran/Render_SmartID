import express from 'express';
import cors from 'cors';

// Routes
import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patient.routes.js';
import consentRoutes from './routes/consent.routes.js';
import nfcRoutes from './routes/nfc.routes.js';
import auditRoutes from './routes/audit.routes.js';
import otpRoutes from './routes/otpRoutes.js';
import adminRoutes from './routes/admin.routes.js';
import medicalShopRoutes from './routes/medicalShop.routes.js';
import hospitalRoutes from './routes/hospital.routes.js';
import doctorRoutes from './routes/doctor.routes.js';

// Middleware
import { protect } from './middleware/auth.middleware.js';
import { authorizeRoles } from './middleware/role.middleware.js';

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// =====================
// ROUTES
// =====================

// Auth Routes (Username/Password)
app.use('/api/auth', authRoutes);

// OTP Routes (Phone/SMS)
app.use('/api/otp', otpRoutes);

// Patient Profile Routes
app.use('/api/patient', patientRoutes);

// Consent Management Routes
app.use('/api/consent', consentRoutes);

// NFC Routes
app.use('/api/nfc', nfcRoutes);

// Audit Routes
app.use('/api/audit', auditRoutes);

// Admin Routes
app.use('/api/admin', adminRoutes);

// Medical shop routes
app.use('/api/medical-shop', medicalShopRoutes);

// Hospital routes
app.use('/api/hospital', hospitalRoutes);

// Doctor routes
app.use('/api/doctor', doctorRoutes);

// =====================
// TEST & RBAC ROUTES
// =====================

app.get('/api/protected', protect, (req, res) => {
  res.json({
    message: 'JWT working',
    user: req.user
  });
});

app.get('/', (req, res) => {
  res.send('Unified Smart ID Backend is running');
});

export default app;
