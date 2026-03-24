import { createContext, useContext, useState, useCallback } from "react";

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
    const [patient, setPatient] = useState(null);
    const [otpVerified, setOtpVerified] = useState(false);
    const [authMethod, setAuthMethod] = useState(null); // "patient" | "nominee"
    const [fingerprintVerified, setFingerprintVerified] = useState(false);
    const [sessionStartedAt, setSessionStartedAt] = useState(null);

    // Emergency Override State
    const [emergencyMode, setEmergencyMode] = useState(false);
    const [emergencyBy, setEmergencyBy] = useState(null);
    const [emergencyReason, setEmergencyReason] = useState(null);

    const startSession = useCallback((patientData) => {
        setPatient(patientData);
        setOtpVerified(false);
        setAuthMethod(null);
        setFingerprintVerified(false);
        setEmergencyMode(false);
        setEmergencyBy(null);
        setEmergencyReason(null);
        setSessionStartedAt(new Date().toISOString());
    }, []);

    const resetSession = useCallback(() => {
        setPatient(null);
        setOtpVerified(false);
        setAuthMethod(null);
        setFingerprintVerified(false);
        setEmergencyMode(false);
        setEmergencyBy(null);
        setEmergencyReason(null);
        setSessionStartedAt(null);
    }, []);

    return (
        <SessionContext.Provider value={{
            patient,
            setPatient: startSession,
            otpVerified,
            setOtpVerified,
            authMethod,
            setAuthMethod,
            fingerprintVerified,
            setFingerprintVerified,
            emergencyMode,
            setEmergencyMode,
            emergencyBy,
            setEmergencyBy,
            emergencyReason,
            setEmergencyReason,
            sessionStartedAt,
            resetSession
        }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error("useSession must be used within a SessionProvider");
    }
    return context;
};
