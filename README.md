# Smart-ID Healthcare Platform

> A secure, blockchain-inspired healthcare identity management system with NFC cards, biometric authentication, and OTP-based consent management.

## 🎯 Overview

Smart-ID is a comprehensive healthcare platform that provides:
- **Secure Patient Identity** using NFC cards
- **Multi-Factor Authentication** (OTP + Fingerprint)
- **Consent-Based Access** for medical records
- **Nominee Emergency Access** when patients are unconscious
- **Role-Based Access Control** (Admin, Hospital, Doctor, Medical Shop, Patient)

## ✨ Features

### Core Features
- **NFC Card Integration** - Patient identification via NFC cards
- **Biometric Authentication** - Fingerprint verification
- **OTP Consent System** - SMS-based authorization for record access
- **Nominee OTP** - Emergency consent from registered nominee
- **Emergency Override** - Hospital admin emergency access with password
- **Audit Logging** - Complete audit trail for all actions

### Security Features
- **Rate Limiting** - Protection against brute force attacks
- **Timing-Safe Comparison** - Prevention of timing attacks
- **Helmet Security Headers** - XSS, clickjacking protection
- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with cost factor 12
- **Consent Ownership** - Patients control who accesses their data

### User Roles
| Role | Permissions |
|------|-------------|
| Admin | User management, system monitoring |
| Hospital | Patient registration, clinical notes |
| Doctor | View patient records with consent |
| Medical Shop | View prescriptions |
| Patient | View own records, manage consent |

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend       │────▶│   Backend API    │────▶│   MongoDB       │
│   (React+Vite)   │     │   (Express.js)   │     │   (Atlas)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   Raspberry Pi   │
                        │   (GSM Module)   │
                        └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

```bash
cd smart-id-backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your values

npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
# Edit .env with VITE_API_URL

npm run dev
```

### Environment Variables

**Backend (.env)**
```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secure-secret-key
ALLOWED_ORIGINS=https://your-frontend.com
```

**Frontend (.env)**
```env
VITE_API_URL=https://your-backend-api.com
```

## 📱 User Flows

### 1. Patient Registration
```
Hospital Admin → Scan NFC Card → Enter Patient Details → Verify Fingerprint → Patient Created
```

### 2. Clinical Note (Patient Consented)
```
Hospital Admin → Scan NFC Card → Send OTP to Patient → Patient Shares OTP → Fingerprint Verify → Add Clinical Note
```

### 3. Clinical Note (Patient Unconscious - Nominee)
```
Hospital Admin → Scan NFC Card → Switch to Nominee OTP → Send OTP to Nominee → Nominee Shares OTP → Fingerprint Verify → Add Clinical Note
```

### 4. Emergency Access
```
Hospital Admin → Scan NFC Card → Emergency Override → Enter Emergency Password → Add Clinical Note
```

## 🔐 Security

### Authentication Flow
1. **Primary**: Username/Password login
2. **Secondary**: OTP verification (for sensitive actions)
3. **Tertiary**: Fingerprint verification

### Rate Limits
| Endpoint | Limit | Window |
|----------|-------|-------|
| Login | 10 attempts | 15 min |
| OTP Send | 5 attempts | 10 min |
| OTP Verify | 3 attempts | Per OTP |

### API Security
- Helmet.js security headers
- CORS with configurable origins
- Request body size limits (10kb)
- Timing-safe OTP comparison
- JWT with 1-hour expiry for OTP auth

## 📊 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | User login |
| POST | /api/auth/register | User registration |

### OTP
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/otp/send-otp | Send OTP |
| POST | /api/otp/verify-otp | Verify OTP |

### Patient
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/patient/register | Register patient |
| GET | /api/patient/profile | Get profile |
| GET | /api/patient/:uid | Get by NFC UID |

### NFC
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/nfc/scan | Scan NFC card |
| POST | /api/nfc/fingerprint | Verify fingerprint |

### Consent
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/consent/request | Request consent |
| GET | /api/consent/my | Get my consents |
| POST | /api/consent/respond | Respond to consent |

## 🧪 Testing

### Run Lighthouse Performance Tests
```bash
cd frontend
npm run lhci
```

### Manual Testing Checklist
- [ ] Patient registration flow
- [ ] Hospital login
- [ ] OTP sending and verification
- [ ] Nominee OTP (if configured)
- [ ] Fingerprint verification
- [ ] Emergency override
- [ ] Dark mode toggle
- [ ] Session timeout

## 📈 Performance

Performance budgets are monitored using Lighthouse CI:

| Metric | Target | Threshold |
|--------|--------|-----------|
| LCP | < 2.5s | Warning at 3s |
| FID | < 100ms | Warning at 300ms |
| CLS | < 0.1 | Error at 0.25 |
| Bundle Size | < 500KB | Warning at 600KB |

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

**Backend (Render)**
```
Root Directory: smart-id-backend
Build Command: npm install
Start Command: node server.js
```

**Frontend (Vercel/Railway)**
```
Root Directory: frontend
Build Command: npm install && npm run build
Output Directory: dist
```

## 🛠️ Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS 4
- React Router 7
- Axios
- React Hot Toast

### Backend
- Express.js
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcrypt
- Helmet
- express-rate-limit

### Hardware Integration
- Raspberry Pi (GSM Module)
- NFC Card Reader
- Fingerprint Scanner

## 📝 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

For issues and feature requests, please open a GitHub issue.

---

**Built with ❤️ for secure healthcare identity management**
