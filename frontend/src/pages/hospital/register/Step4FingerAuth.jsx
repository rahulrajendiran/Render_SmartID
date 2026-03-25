import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePatientRegistration } from "../../../context/PatientRegistrationContext";
import hospitalAPI from "../../../services/management.api";

const STATES = {
    IDLE: "idle",
    SCANNING: "scanning",
    FIRST_SUCCESS: "first_success",
    SECOND_SCANNING: "second_scanning",
    ENROLLING: "enrolling",
    SUCCESS: "success",
    ERROR: "error"
};

export default function Step4FingerAuth() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { update } = usePatientRegistration();

    const patientId = state?.patientId;

    const [enrollState, setEnrollState] = useState(STATES.IDLE);
    const [statusMessage, setStatusMessage] = useState("Place patient's finger on the scanner");
    const [errorMessage, setErrorMessage] = useState("");
    const [retryCount, setRetryCount] = useState(0);

    const startEnrollment = async () => {
        if (!patientId) {
            setEnrollState(STATES.ERROR);
            setErrorMessage("Patient ID is missing. Please complete registration first.");
            return;
        }

        setEnrollState(STATES.SCANNING);
        setStatusMessage("Capturing first fingerprint scan...");
        setErrorMessage("");

        try {
            await simulateHardwareDelay(1200);

            setEnrollState(STATES.FIRST_SUCCESS);
            setStatusMessage("First scan captured. Remove finger and place again.");
        } catch (err) {
            setEnrollState(STATES.ERROR);
            setErrorMessage("First scan failed. Please try again.");
            return;
        }

        try {
            await simulateHardwareDelay(1000);

            setEnrollState(STATES.SECOND_SCANNING);
            setStatusMessage("Place same finger again for second scan...");

            await simulateHardwareDelay(1500);

            setEnrollState(STATES.ENROLLING);
            setStatusMessage("Processing enrollment, please wait...");

            const response = await hospitalAPI.enrollFingerprint(patientId);

            if (response.success) {
                update("fingerprintId", response.fingerId);
                setEnrollState(STATES.SUCCESS);
                setStatusMessage("Fingerprint enrolled successfully!");

                setTimeout(() => {
                    navigate("/hospital/register/success", {
                        state: {
                            ...state,
                            fingerId: response.fingerId,
                            fingerprintEnrolled: true
                        }
                    });
                }, 1500);
            } else {
                throw new Error(response.message || "Enrollment failed");
            }
        } catch (err) {
            console.error("Fingerprint enrollment error:", err);
            setEnrollState(STATES.ERROR);
            setErrorMessage(
                err.response?.data?.message ||
                err.message ||
                "Enrollment failed. Please try again."
            );
        }
    };

    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
        setEnrollState(STATES.IDLE);
        setErrorMessage("");
        setStatusMessage("Place patient's finger on the scanner");
        setTimeout(startEnrollment, 300);
    };

    const goBack = () => {
        navigate("/hospital/register/medical");
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                    Fingerprint Enrollment
                </h3>
                <p className="text-sm text-slate-500">
                    Capture the patient&apos;s biometric fingerprint for future authentication.
                </p>
            </div>

            {/* Fingerprint Capture Card */}
            <div
                onClick={() => {
                    if (enrollState === STATES.IDLE || enrollState === STATES.ERROR) {
                        startEnrollment();
                    }
                }}
                className={`mt-6 p-8 rounded-2xl border-2 border-dashed flex flex-col items-center gap-5 text-center transition-all cursor-pointer
                    ${enrollState === STATES.SUCCESS
                        ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-400 dark:border-emerald-600 cursor-default"
                        : enrollState === STATES.ERROR
                            ? "bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-700"
                            : enrollState === STATES.FIRST_SUCCESS
                                ? "bg-amber-50 dark:bg-amber-900/10 border-amber-400 dark:border-amber-600 cursor-default"
                                : enrollState === STATES.ENROLLING
                                    ? "bg-blue-50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-700 cursor-wait"
                                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
            >
                {/* Icon */}
                <div className={`size-20 rounded-full flex items-center justify-center transition-all
                    ${enrollState === STATES.SUCCESS
                        ? "bg-emerald-500 text-white"
                        : enrollState === STATES.ERROR
                            ? "bg-red-500 text-white"
                            : enrollState === STATES.FIRST_SUCCESS
                                ? "bg-amber-500 text-white"
                                : enrollState === STATES.ENROLLING
                                    ? "bg-blue-500 text-white animate-spin"
                                    : enrollState === STATES.SCANNING || enrollState === STATES.SECOND_SCANNING
                                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 animate-pulse"
                                        : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                    }`}>
                    <span className="material-symbols-outlined text-5xl">
                        {enrollState === STATES.SUCCESS ? "check_circle" :
                         enrollState === STATES.ERROR ? "error" :
                         enrollState === STATES.FIRST_SUCCESS ? "check" :
                         enrollState === STATES.ENROLLING ? "sync" :
                         enrollState === STATES.SCANNING || enrollState === STATES.SECOND_SCANNING ? "fingerprint" :
                         "fingerprint"}
                    </span>
                </div>

                {/* Status Message */}
                <div className="space-y-2">
                    <h4 className={`font-bold text-lg
                        ${enrollState === STATES.SUCCESS ? "text-emerald-700 dark:text-emerald-400" :
                          enrollState === STATES.ERROR ? "text-red-700 dark:text-red-400" :
                          enrollState === STATES.FIRST_SUCCESS ? "text-amber-700 dark:text-amber-400" :
                          enrollState === STATES.ENROLLING ? "text-blue-700 dark:text-blue-400" :
                          "text-slate-700 dark:text-slate-300"}`}>
                        {enrollState === STATES.SUCCESS ? "Enrollment Successful" :
                         enrollState === STATES.ERROR ? "Enrollment Failed" :
                         enrollState === STATES.FIRST_SUCCESS ? "First Scan Complete" :
                         enrollState === STATES.ENROLLING ? "Processing..." :
                         enrollState === STATES.SCANNING ? "Scanning — Scan 1 of 2" :
                         enrollState === STATES.SECOND_SCANNING ? "Scanning — Scan 2 of 2" :
                         "Tap to Start Enrollment"}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        {enrollState === STATES.SUCCESS
                            ? "Fingerprint template stored in database. Redirecting..."
                            : enrollState === STATES.ERROR
                                ? errorMessage
                                : enrollState === STATES.FIRST_SUCCESS
                                    ? "First scan captured. Remove finger and place the same finger again."
                                    : enrollState === STATES.ENROLLING
                                        ? "Storing biometric template in the database..."
                                        : enrollState === STATES.SCANNING || enrollState === STATES.SECOND_SCANNING
                                            ? "Hold finger steady on the sensor..."
                                            : "Place the patient's finger on the R307 scanner to capture their biometric template."}
                    </p>
                </div>

                {/* Progress Bar for scanning states */}
                {(enrollState === STATES.SCANNING || enrollState === STATES.SECOND_SCANNING || enrollState === STATES.ENROLLING) && (
                    <div className="w-full max-w-xs">
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500
                                ${enrollState === STATES.ENROLLING ? "bg-blue-500 w-full animate-pulse" : "bg-emerald-500 animate-pulse"}`}
                                style={{ width: enrollState === STATES.ENROLLING ? "100%" : "60%" }} />
                        </div>
                    </div>
                )}

                {/* First Scan Checklist */}
                {enrollState === STATES.FIRST_SUCCESS && (
                    <div className="flex gap-4 mt-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                            <span className="material-symbols-outlined text-sm">check</span>
                            Scan 1 of 2
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 text-xs font-bold">
                            <span className="material-symbols-outlined text-sm">radio_button_unchecked</span>
                            Scan 2 of 2
                        </div>
                    </div>
                )}

                {/* Both Scans Done */}
                {(enrollState === STATES.ENROLLING || enrollState === STATES.SUCCESS) && (
                    <div className="flex gap-4 mt-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                            <span className="material-symbols-outlined text-sm">check</span>
                            Scan 1 of 2
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                            <span className="material-symbols-outlined text-sm">check</span>
                            Scan 2 of 2
                        </div>
                    </div>
                )}

                {/* Idle hint */}
                {enrollState === STATES.IDLE && (
                    <div className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-emerald-100 dark:bg-emerald-800 dark:text-emerald-200 rounded-lg">
                        <div className="size-2 bg-emerald-500 rounded-full animate-ping" />
                        Hardware Reader Active — Tap to Begin
                    </div>
                )}
            </div>

            {/* Error with Retry */}
            {enrollState === STATES.ERROR && (
                <div className="flex justify-center">
                    <button
                        onClick={handleRetry}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red-600/20"
                    >
                        <span className="material-symbols-outlined">refresh</span>
                        Retry Enrollment
                    </button>
                </div>
            )}

            {/* Back Button */}
            <div className="pt-4">
                <button
                    onClick={goBack}
                    disabled={enrollState === STATES.SCANNING || enrollState === STATES.SECOND_SCANNING || enrollState === STATES.ENROLLING}
                    className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back
                </button>
            </div>
        </div>
    );
}

function simulateHardwareDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
