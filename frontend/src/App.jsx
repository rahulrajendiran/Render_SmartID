import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./auth/AuthProvider"
import LoginPage from "./pages/LoginPage"
import DoctorLayout from "./layouts/DoctorLayout"
import DoctorDashboard from "./pages/doctor/Dashboard"
import PatientHistory from "./pages/doctor/PatientHistory"
import MedicalShopLayout from "./layouts/MedicalShopLayout"
import MedicalShopDashboard from "./pages/medicalShop/Dashboard"
import PrescriptionViewer from "./pages/medicalShop/PrescriptionViewer"
import ClinicalNote from "./pages/hospital/ClinicalNote"
import PatientRoutes from "./routes/PatientRoutes"
import AdminRoutes from "./routes/AdminRoutes"
import HospitalLayout from "./layouts/HospitalLayout"
import HospitalDashboard from "./pages/hospital/Dashboard"
import RegisterPatient from "./pages/hospital/register/RegisterPatient"
import Step1Personal from "./pages/hospital/register/Step1Personal"
import Step2Contact from "./pages/hospital/register/Step2Contact"
import Step3Medical from "./pages/hospital/register/Step3Medical"
import Step4FingerAuth from "./pages/hospital/register/Step4FingerAuth"
import RegisterSuccess from "./pages/hospital/register/RegisterSuccess"
import OtpAuth from "./pages/hospital/OtpAuth"
import BiometricAuth from "./pages/hospital/BiometricAuth"
import EmergencyConfirm from "./pages/hospital/EmergencyConfirm"
import EmergencyNFC from "./pages/hospital/EmergencyNFC"
import ProtectedRoute from "./components/ProtectedRoute"
import { ROLES } from "./utils/roles"

function App() {
  const { user, loading } = useAuth()

  // Diagnostic Log helps in role-based debugging
  console.log("App Render: User State:", { user, loading })

  if (loading) return null

  return (
    <Routes>
      <Route
        path="/"
        element={
          user?.role === ROLES.DOCTOR
            ? <Navigate to="/doctor" replace />
            : user?.role === ROLES.MEDICAL_SHOP
              ? <Navigate to="/medical-shop" replace />
              : user?.role === ROLES.PATIENT
                ? <Navigate to="/patient" replace />
                : user?.role === ROLES.HOSPITAL
                  ? <Navigate to="/hospital" replace />
                  : user?.role === ROLES.ADMIN
                    ? <Navigate to="/admin" replace />
                    : <LoginPage />
        }
      />

      {/* DOCTOR ROUTES */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
            <DoctorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DoctorDashboard />} />
        <Route path="history" element={<PatientHistory />} />
      </Route>

      {/* MEDICAL SHOP ROUTES */}
      <Route
        path="/medical-shop"
        element={
          <ProtectedRoute allowedRoles={[ROLES.MEDICAL_SHOP]}>
            <MedicalShopLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MedicalShopDashboard />} />
      </Route>

      {/* PATIENT ROUTES */}
      <Route
        path="/patient/*"
        element={
          <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
            <PatientRoutes />
          </ProtectedRoute>
        }
      />

      {/* HOSPITAL ROUTES */}
      <Route
        path="/hospital"
        element={
          <ProtectedRoute allowedRoles={[ROLES.HOSPITAL]}>
            <HospitalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HospitalDashboard />} />
        <Route path="register" element={<RegisterPatient />}>
          <Route index element={<Step1Personal />} />
          <Route path="contact" element={<Step2Contact />} />
          <Route path="medical" element={<Step3Medical />} />
          <Route path="fingerprint" element={<Step4FingerAuth />} />
        </Route>
        <Route path="clinical-note/auth" element={<OtpAuth />} />
        <Route path="clinical-note/biometric" element={<BiometricAuth />} />
        <Route path="emergency/confirm" element={<EmergencyConfirm />} />
        <Route path="emergency/nfc-scan" element={<EmergencyNFC />} />
        <Route path="clinical-note" element={<ClinicalNote />} />
      </Route>

      <Route
        path="/hospital/register/success"
        element={
          <ProtectedRoute allowedRoles={[ROLES.HOSPITAL]}>
            <RegisterSuccess />
          </ProtectedRoute>
        }
      />

      {/* ADMIN ROUTES */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminRoutes />
          </ProtectedRoute>
        }
      />

      {/* SECURE PRESCRIPTION VIEWER */}
      <Route
        path="/medical-shop/prescription/:id"
        element={
          <ProtectedRoute allowedRoles={[ROLES.MEDICAL_SHOP]}>
            <PrescriptionViewer />
          </ProtectedRoute>
        }
      />

      <Route path="/admin-test" element={<div className="p-20 text-white bg-red-600 font-black">ROUTING TEST SUCCESSFUL</div>} />
      <Route path="/unauthorized" element={<div className="p-20 text-center text-red-500 font-bold">Unauthorized Access</div>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
