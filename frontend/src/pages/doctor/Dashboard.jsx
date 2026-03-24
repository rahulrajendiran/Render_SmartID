import { useState, useEffect } from "react";
import doctorApi from "../../services/doctor.api";

export default function DoctorDashboard() {
    const [patient, setPatient] = useState(null);
    const [isEmergency, setIsEmergency] = useState(false);
    const [stats, setStats] = useState(null);
    const [recentPatients, setRecentPatients] = useState([]);

    // Authentication Flow states:
    // idle -> scanning -> fingerprint -> sending_otp -> verify_otp -> success
    const [step, setStep] = useState('idle');
    const [scannedUid, setScannedUid] = useState(null);
    const [otp, setOtp] = useState('');
    const [phone, setPhone] = useState('');
    
    // Hardware Status
    const [hardware, setHardware] = useState({
        nfc: "Checking...",
        fingerprint: "Checking...",
        gsm: "Checking...",
        pi: "Checking..."
    });

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const [status, statsResponse, recentResponse] = await Promise.all([
                    doctorApi.getDeviceStatus(),
                    doctorApi.getStats(),
                    doctorApi.getRecentPatients(),
                ]);
                setHardware(status || {
                    nfc: "Unavailable",
                    fingerprint: "Unavailable",
                    gsm: "Unavailable",
                    pi: "Unavailable"
                });
                setStats(statsResponse || null);
                setRecentPatients(recentResponse || []);
            } catch {
                setHardware({
                    nfc: "Unavailable",
                    fingerprint: "Unavailable",
                    gsm: "Unavailable",
                    pi: "Unavailable"
                });
            }
        };
        fetchStatus();
    }, []);

    // Step 1: Trigger NFC Scan (Optional manual fallback)
    const handleStartScan = async () => {
        setStep('scanning');
        try {
            const data = await doctorApi.scanNfc();
            if (data && data.uid) {
                setScannedUid(data.uid);
                setStep('fingerprint');
            }
        } catch (err) {
            console.error("NFC Scan Failed", err);
            alert("NFC Scan Failed. Please try again.");
            setStep('idle');
        }
    };

    // Step 2: Trigger Fingerprint Verification
    const handleVerifyFingerprint = async () => {
        try {
            const data = await doctorApi.verifyFingerprint({ uid: scannedUid });
            if (data.verified) {
                setStep('sending_otp');
                const patientData = await doctorApi.getPatientByUid(scannedUid);
                setPhone(patientData.phone);
                await doctorApi.sendOtp(patientData.phone);
                setStep('verify_otp');
            } else {
                alert("Fingerprint mismatch. Verification failed.");
                setStep('idle');
            }
        } catch (err) {
            console.error("Fingerprint Error", err);
            alert("Fingerprint scanner error.");
            setStep('idle');
        }
    };

    // Step 3: Verify OTP and fetch full data
    const handleVerifyOtp = async () => {
        try {
            const result = await doctorApi.verifyOtp({ phone, otp });
            if (result.success || result.token || result.verified) { 
                setStep('success');
                const finalPatientData = await doctorApi.getPatientByUid(scannedUid);
                setPatient({
                    ...finalPatientData,
                    name: finalPatientData.fullName || finalPatientData.name || "Unknown Patient",
                    healthId: finalPatientData.user?.username || finalPatientData.nfcUuid || finalPatientData._id,
                });
            } else {
                alert("Invalid OTP");
            }
        } catch (err) {
            console.error("OTP Error", err);
            alert("OTP Verification Failed");
        }
    };

    const resetSession = () => {
        setStep('idle');
        setPatient(null);
        setScannedUid(null);
        setOtp('');
        setPhone('');
    };

    return (
        <div className="max-w-4xl mx-auto px-4 pb-20">

            {/* DEVICE STATUS PANEL */}
            <div className="mb-8 bg-slate-100 dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Hardware Status</h3>
                <div className="flex flex-wrap gap-4 md:gap-8 text-sm font-bold">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${hardware.nfc === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        NFC Reader: <span className="text-slate-500">{hardware.nfc}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${hardware.fingerprint === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        Fingerprint: <span className="text-slate-500">{hardware.fingerprint}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${hardware.gsm === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        GSM Module: <span className="text-slate-500">{hardware.gsm}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${hardware.pi === 'Online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        Raspberry Pi: <span className="text-slate-500">{hardware.pi}</span>
                    </div>
                </div>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <MetricCard label="Patients" value={stats.totalPatients} />
                    <MetricCard label="Today" value={stats.todayConsultations} />
                    <MetricCard label="Pending Consents" value={stats.pendingConsents} />
                    <MetricCard label="Emergency" value={stats.emergencyAccessToday} />
                </div>
            )}

            {/* ALERT BOX FOR EMERGENCY MODE */}
            {isEmergency && !patient && (
                <div className="mb-8 bg-red-500 text-white p-6 rounded-[2rem] flex items-center gap-6 animate-pulse shadow-xl shadow-red-500/20">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined font-black">emergency</span>
                    </div>
                    <div>
                        <h2 className="font-black text-lg">EMERGENCY OVERRIDE ACTIVE</h2>
                        <p className="text-white/80 text-sm font-medium">Scanning now will bypass standard consent protocols. Audit log will be flagged.</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Clinical Portal</h1>
                    <p className="text-slate-500 font-medium">Verified practitioner session active.</p>
                </div>

                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 p-2 rounded-2xl">
                    <button
                        onClick={() => setIsEmergency(false)}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${!isEmergency ? "bg-white dark:bg-slate-800 shadow-sm text-primary" : "text-slate-500"}`}
                    >
                        Standard
                    </button>
                    <button
                        onClick={() => setIsEmergency(true)}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${isEmergency ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-slate-500"}`}
                    >
                        Emergency
                    </button>
                </div>
            </div>

            {/* MAIN AUTHENTICATION & RECORD UI */}
            {!patient && step !== 'success' ? (
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl p-10 flex flex-col items-center justify-center text-center overflow-hidden min-h-[400px]">
                    
                    {/* STEP 1: IDLE / SCANNING */}
                    {(step === 'idle' || step === 'scanning') && (
                        <div className="flex flex-col items-center animate-in fade-in duration-500">
                            <button
                                onClick={handleStartScan}
                                disabled={step === 'scanning'}
                                className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all hover:scale-105
                                    ${step === 'scanning' ? "bg-primary text-white shadow-lg shadow-primary/40 animate-pulse" : "bg-primary/10 text-primary"}
                                `}
                            >
                                <span className="material-symbols-outlined text-5xl">contactless</span>
                            </button>
                            <h2 className="text-2xl font-bold mb-2">
                                {step === 'scanning' ? "Scanning NFC..." : "Tap Patient Smart-ID"}
                            </h2>
                            <p className="text-slate-500 font-medium max-w-sm mb-6">
                                {step === 'scanning' ? "Waiting for Raspberry Pi NFC reader response." : "Hold the NFC card near the reader to extract the patient UID."}
                            </p>
                            {step === 'scanning' && (
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: FINGERPRINT */}
                    {step === 'fingerprint' && (
                        <div className="flex flex-col items-center animate-in slide-in-from-right duration-500">
                            <div className="w-24 h-24 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6 animate-pulse">
                                <span className="material-symbols-outlined text-5xl">fingerprint</span>
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Place Finger</h2>
                            <p className="text-slate-500 font-medium max-w-sm mb-8">
                                Patient UID verified: <span className="font-bold text-slate-800 dark:text-slate-200">{scannedUid}</span>. Please authorize via biometric scanner.
                            </p>
                            <button 
                                onClick={handleVerifyFingerprint}
                                className="bg-blue-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:scale-105 transition-all"
                            >
                                Trigger Biometric Verification
                            </button>
                        </div>
                    )}

                    {/* STEP 3: SENDING OTP */}
                    {step === 'sending_otp' && (
                        <div className="flex flex-col items-center animate-in fade-in duration-500">
                            <div className="w-24 h-24 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6 animate-pulse">
                                <span className="material-symbols-outlined text-5xl">sms</span>
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Transmitting OTP...</h2>
                            <p className="text-slate-500 font-medium max-w-sm mb-6">
                                Fingerprint verified. Dispatching SMS over GSM Module (SIM800L).
                            </p>
                            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}

                    {/* STEP 4: VERIFY OTP */}
                    {step === 'verify_otp' && (
                        <div className="flex flex-col items-center animate-in slide-in-from-right duration-500 w-full max-w-sm">
                            <div className="w-20 h-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-4xl">domain_verification</span>
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Enter OTP</h2>
                            <p className="text-slate-500 font-medium mb-6 text-center">
                                Access code was sent to the patient's registered mobile device.
                            </p>
                            
                            <input 
                                type="text"
                                placeholder="• • • • • •"
                                className="w-full text-center tracking-[0.5em] text-2xl font-bold bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl px-6 py-4 mb-6 outline-none focus:border-primary transition-all"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />

                            <button 
                                onClick={handleVerifyOtp}
                                className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:scale-[1.01] transition-all"
                            >
                                Authenticate Secure Session
                            </button>
                        </div>
                    )}
                </div>
            ) : patient && (
                /* PATIENT DETAIL VIEW (REAL DATA) */
                <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden relative">

                        <div className="flex items-center gap-8 mb-12 pb-12 border-b dark:border-slate-800 mt-4">
                            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-white font-black text-2xl shadow-lg
                                ${isEmergency ? "bg-red-500" : "bg-primary"}
                            `}>
                                {patient.name ? patient.name.split(' ').map(n => n[0]).join('') : "P"}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black tracking-tight">{patient.name || "Unknown"}</h2>
                                <p className="text-slate-500 font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">fingerprint</span>
                                    Health ID: {patient.healthId || patient.id}
                                </p>
                            </div>
                            {patient.bloodGroup && (
                                <div className="ml-auto bg-red-50 dark:bg-red-900/20 px-6 py-3 rounded-2xl border border-red-100 dark:border-red-900/20 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1 leading-none">Blood Group</p>
                                    <p className="text-2xl font-black text-red-600 leading-none">{patient.bloodGroup}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Clinical Condition</label>
                                    <p className="text-xl font-bold bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border dark:border-slate-700">
                                        {patient.condition || "Routine Checkup"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Data Source</label>
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold">
                                            <span className="material-symbols-outlined text-sm">cloud_sync</span>
                                            Global Network Sync (Live from DB)
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 rounded-[2rem] border bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-900/40">
                                    <h3 className="font-bold flex items-center gap-2 mb-4 text-green-600">
                                        <span className="material-symbols-outlined">verified_user</span>
                                        Fully Authenticated Session
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        Multifactor authentication (NFC + Bio + OTP) completed successfully. Access to sensitive records is actively logged.
                                    </p>
                                </div>
                                <button
                                    onClick={resetSession}
                                    className="w-full py-4 text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">exit_to_app</span>
                                    Close Secure Session
                                </button>
                            </div>
                        </div>

                        <button className="w-full mt-12 bg-slate-900 dark:bg-white dark:text-slate-950 text-white py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:scale-[1.01] transition-all">
                            View Full Medical History
                        </button>
                    </div>
                </div>
            )}

            {!patient && recentPatients.length > 0 && (
                <div className="mt-10 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">Recent Patients</h3>
                        <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Backend data</span>
                    </div>
                    <div className="space-y-3">
                        {recentPatients.slice(0, 5).map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
                                <div>
                                    <p className="font-semibold">{entry.name}</p>
                                    <p className="text-sm text-slate-500">{entry.condition}</p>
                                </div>
                                <span className="text-xs font-mono text-slate-400">{new Date(entry.lastVisit).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function MetricCard({ label, value }) {
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-black">{value ?? 0}</p>
        </div>
    );
}
