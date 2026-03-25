import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

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

// Validate required environment variables on startup
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is not configured');
    process.exit(1);
}

const app = express();

// =====================
// SECURITY MIDDLEWARE
// =====================

// Helmet - Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"]
        }
    }
}));

// CORS - Configure allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body size limit - Prevent memory exhaustion attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window
    message: { error: 'Too many attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});

const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // 5 OTP requests per window
    message: { error: 'Too many OTP requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});

// =====================
// REQUEST LOGGING
// =====================
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (process.env.NODE_ENV !== 'test') {
            console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
        }
    });
    next();
});

// =====================
// ROUTES
// =====================

// Auth Routes (Username/Password) - Rate limited
app.use('/api/auth', authLimiter, authRoutes);

// OTP Routes (Phone/SMS) - Rate limited
app.use('/api/otp', otpLimiter, otpRoutes);

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

// =====================
// CENTRALIZED ERROR HANDLING
// =====================
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    
    // Don't expose stack traces in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(isProduction ? {} : { stack: err.stack })
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

export default app;
