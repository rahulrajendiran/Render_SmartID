# Smart ID Deployment

## Backend on Render

- Root directory: `smart-id-backend`
- Build command: `npm install`
- Start command: `node server.js`
- Environment variables:
  - `PORT=10000`
  - `MONGO_URI=<your mongodb connection string>`
  - `JWT_SECRET=<long random secret>`
  - `HARDWARE_BRIDGE_URL=<bridge base url>`
  - `HARDWARE_BRIDGE_KEY=<optional bearer token>`

Notes:
- Render assigns the port dynamically, so set `PORT=10000` only as a fallback and keep `server.js` using `process.env.PORT`.
- If your hardware bridge is on a private LAN or Raspberry Pi without public access, Render will not be able to reach it unless you expose that bridge securely.

## Frontend on Railway

- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Start command: `npm run preview -- --host 0.0.0.0 --port $PORT`
- Environment variables:
  - `VITE_API_URL=https://your-render-backend.onrender.com`

Notes:
- Update `VITE_API_URL` after the Render backend is live.
- Railway injects `PORT`, so the preview command must bind to `0.0.0.0` and use that port.

## Working pipeline

1. Hospital user logs in through the frontend.
2. Frontend stores the JWT and sends it on API requests.
3. Hospital registration collects personal, contact, and medical data, then reads the NFC card.
4. Frontend sends the combined payload to `POST /api/patient/register`.
5. Backend validates required fields, including positive `heightCm` and `weightKg` values.
6. Backend creates the patient user account and patient profile in MongoDB.
7. Backend returns the created patient details to the frontend success screen.

## Post-deploy checks

- Backend health: `GET /`
- Hospital health: `GET /api/hospital/health`
- Hospital login: `POST /api/auth/login`
- Patient registration: complete the hospital registration flow from the frontend
- Hardware endpoints: `POST /api/nfc/scan` and `POST /api/nfc/fingerprint`
