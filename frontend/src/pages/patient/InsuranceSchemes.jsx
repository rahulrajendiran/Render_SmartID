import { checkEligibility } from "../../utils/insuranceEligibility";
import RecommendedHospital from "../../components/patient/RecommendedHospital";

export default function InsuranceSchemes() {
    // Mock Patient Profile - In production, this would come from an API/Auth state
    const patientProfile = {
        age: 42,
        annualIncome: 65000,
        isGovEmployee: false
    };

    const eligibility = checkEligibility(patientProfile);

    // Claim History Mock Data
    const claimHistory = [
        {
            id: "CLM-10231",
            scheme: "CMCHIS",
            hospital: "Rajiv Gandhi Govt Hospital",
            amount: "₹48,000",
            date: "12 Oct 2023",
            status: "Approved"
        },
        {
            id: "CLM-98211",
            scheme: "Star Health",
            hospital: "Apollo Hospitals, Chennai",
            amount: "₹1,12,000",
            date: "04 Jun 2022",
            status: "Settled"
        }
    ];

    // Hospital Coverage Matching Data
    const hospitalCoverage = [
        {
            hospital: "Apollo Hospitals, Chennai",
            schemes: ["Star Health", "ICICI Lombard", "HDFC ERGO"]
        },
        {
            hospital: "Rajiv Gandhi Govt Hospital",
            schemes: ["CMCHIS", "PM-JAY"]
        },
        {
            hospital: "Government Stanley Medical College",
            schemes: ["CMCHIS", "PM-JAY"]
        },
        {
            hospital: "Fortis Malar Hospital",
            schemes: ["Star Health", "HDFC ERGO"]
        }
    ];

    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
            <header className="mb-12">
                <div className="flex items-center gap-4 mb-3">
                    <div className="size-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                        <span className="material-symbols-outlined text-3xl">policy</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white">
                        Insurance Command Center
                    </h1>
                </div>
                <p className="text-slate-500 font-medium text-lg ml-16">
                    Real-time eligibility verification and claim analytics for your coverage domain.
                </p>
            </header>

            {/* 1. ELIGIBILITY & SCHEMES */}
            <section className="mb-20">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 mb-8 flex items-center gap-3">
                    <span className="w-8 h-[1px] bg-emerald-500/30"></span>
                    Live Scheme Eligibility
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <SchemeCard
                        title="CMCHIS"
                        description="Chief Minister’s Comprehensive Health Insurance (Tamil Nadu)."
                        link="https://www.cmchistn.com"
                        isGov={true}
                        eligible={eligibility.CMCHIS}
                    />

                    <SchemeCard
                        title="Ayushman Bharat (PM-JAY)"
                        description="Central government healthcare safety net for vulnerable families."
                        link="https://pmjay.gov.in"
                        isGov={true}
                        eligible={eligibility.PMJAY}
                    />

                    <SchemeCard
                        title="Urban Health Scheme"
                        description="Specialized coverage for TN government employees and pensioners."
                        link="https://tnuhs.tn.gov.in"
                        isGov={true}
                        eligible={eligibility.TN_UHS}
                    />

                    <SchemeCard
                        title="Star Health"
                        description="Comprehensive private health insurance plans with local network focus."
                        link="https://www.starhealth.in"
                        eligible={eligibility.PRIVATE}
                    />

                    <SchemeCard
                        title="HDFC ERGO Health"
                        description="Premium private insurance with global standards and fast claims."
                        link="https://www.hdfcergo.com/health-insurance"
                        eligible={eligibility.PRIVATE}
                    />

                    <SchemeCard
                        title="ICICI Lombard"
                        description="Reliable health insurance coverage with 6000+ hospital network."
                        link="https://www.icicilombard.com/health-insurance"
                        eligible={eligibility.PRIVATE}
                    />
                </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                {/* 2. CLAIM HISTORY */}
                <section className="xl:col-span-8">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-slate-500/30"></span>
                        Claim Audit Vault
                    </h2>

                    <div className="bg-[#0f172a] rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/50 border-b border-slate-800">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Reference ID</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Scheme</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Hospital</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Settlement</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {claimHistory.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-800/30 transition-all group">
                                            <td className="px-8 py-6">
                                                <span className="font-mono text-emerald-500 font-bold">{c.id}</span>
                                                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">{c.date}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-bold text-white">{c.scheme}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm text-slate-400 font-medium">{c.hospital}</span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-black text-white">{c.amount}</span>
                                                    <span className="text-[10px] font-black uppercase px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 mt-1">
                                                        {c.status}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* 3. HOSPITAL COVERAGE MATCHING */}
                <section className="xl:col-span-4">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-slate-500/30"></span>
                        Network Coverage
                    </h2>

                    <div className="space-y-6">
                        {hospitalCoverage.map((h, i) => (
                            <div
                                key={i}
                                className="bg-[#0f172a] rounded-3xl p-6 border border-slate-800 hover:border-emerald-500/20 transition-all group"
                            >
                                <h3 className="font-bold text-white text-lg mb-3 tracking-tight group-hover:text-emerald-500 transition-colors">
                                    {h.hospital}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {h.schemes.map((s) => (
                                        <span
                                            key={s}
                                            className="px-3 py-1 text-[10px] font-black uppercase rounded-lg bg-slate-900 text-slate-400 border border-slate-800 transition-all hover:border-emerald-500/40 hover:text-emerald-500"
                                        >
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

function SchemeCard({ title, description, link, isGov, eligible }) {
    return (
        <div className={`group bg-[#111827] rounded-[2.5rem] p-8 border hover:border-emerald-500/40 transition-all duration-500 shadow-2xl flex flex-col justify-between ${isGov ? 'border-emerald-500/10' : 'border-slate-800'}`}>
            <div>
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-emerald-500 transition-colors">
                        {title}
                    </h3>
                    <div className="flex flex-col items-end gap-2">
                        {isGov && <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full">Official TN</span>}
                        <EligibilityBadge eligible={eligible} />
                    </div>
                </div>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">
                    {description}
                </p>
                <RecommendedHospital scheme={title === "CMCHIS" ? "CMCHIS" : title.includes("Ayushman") ? "PM-JAY" : title.includes("Urban") ? "TN_UHS" : title} />
            </div>

            <div className="mt-10">
                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 text-xs font-black uppercase tracking-widest text-white bg-slate-800 group-hover:bg-emerald-600 rounded-2xl transition-all shadow-lg active:scale-95"
                >
                    Verify eligibility
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
            </div>
        </div>
    );
}

function EligibilityBadge({ eligible }) {
    return eligible ? (
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Likely Eligible
        </div>
    ) : (
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
            <span className="size-1.5 bg-slate-600 rounded-full"></span>
            Check Criteria
        </div>
    );
}
