import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../context/SessionContext";
import hospitalAPI from "../../services/management.api";

export default function OtpAuth() {
    const navigate = useNavigate();
    const { patient, setOtpVerified, setAuthMethod } = useSession();
    const [otp, setOtp] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState(null);
    const [resendTimer, setResendTimer] = useState(30);
    const [consentTarget, setConsentTarget] = useState("PATIENT"); // PATIENT or NOMINEE

    useEffect(() => {
        if (!patient) {
            navigate("/hospital");
            return;
        }

        // Trigger initial OTP send
        hospitalAPI.sendOtp(patient.phone).catch(err => {
            console.error("Failed to send initial OTP:", err);
        });

        const timer = setInterval(() => {
            setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [patient, navigate]);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (otp.length < 4) return;

        setIsVerifying(true);
        setError(null);

        try {
            const res = await hospitalAPI.verifyOtp({ phone: patient.phone, otp });
            if (res.success) {
                setOtpVerified(true);
                setAuthMethod(res.method || consentTarget.toUpperCase());
                navigate("/hospital/clinical-note/biometric");
            } else {
                setError("Invalid authorization code. Please try again.");
            }
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || "Verification failed. Check your connection.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;
        try {
            if (consentTarget === "PATIENT") {
                await hospitalAPI.resendOtp(patient.phone);
            } else {
                setError("Nominee OTP is not configured yet.");
                return;
            }
            setResendTimer(30);
            setError(null);
        } catch {
            setError("Failed to resend OTP.");
        }
    };

    const switchConsentTarget = async (target) => {
        setConsentTarget(target);
        setResendTimer(30);
        setError(null);
        try {
            if (target === "PATIENT") {
                await hospitalAPI.sendOtp(patient.phone);
            } else {
                setError("Nominee OTP is not configured yet.");
                return;
            }
        } catch {
            setError(`Failed to send OTP to ${target.toLowerCase()}.`);
        }
    };

    if (!patient) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">

                <div className="p-8 text-center">
                    <div className="mx-auto size-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-3xl">
                            lock_person
                        </span>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Patient Consent Required</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        A 6-digit authorization code has been sent to the {consentTarget.toLowerCase()}'s registered mobile.
                    </p>
                </div>

                <div className="px-8 pb-8">
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="0 0 0 0 0 0"
                                className="w-full text-center text-3xl tracking-widest font-bold py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all dark:text-white"
                                autoFocus
                            />
                            {error && <p className="text-red-500 text-sm font-bold mt-2 text-center">{error}</p>}
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={isVerifying || otp.length < 4}
                                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                            >
                                {isVerifying ? "Verifying..." : "Confirm Authorization"}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 flex flex-col gap-4">
                        <div className="flex items-center justify-between text-sm">
                            <button
                                onClick={handleResend}
                                disabled={resendTimer > 0}
                                className="text-emerald-600 font-bold disabled:text-slate-400"
                            >
                                Resend Code {resendTimer > 0 && `(${resendTimer}s)`}
                            </button>

                            <button
                                onClick={() => switchConsentTarget(consentTarget === "PATIENT" ? "NOMINEE" : "PATIENT")}
                                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline underline-offset-4"
                            >
                                Use {consentTarget === "PATIENT" ? "Nominee" : "Patient"} OTP
                            </button>
                        </div>

                        <button
                            onClick={() => navigate("/hospital")}
                            className="w-full py-3 text-slate-400 font-bold hover:text-red-500 transition-all text-sm"
                        >
                            Cancel & Return to Dashboard
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400">info</span>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider leading-tight">
                        This session is being recorded for audit purposes. OTP represents legal consent for medical record access.
                    </p>
                </div>
            </div>
        </div>
    );
}
