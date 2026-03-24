import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import adminApi from "../../services/admin.api";

export default function AdminDashboard() {
    const { logout } = useAuth();
    const [view, setView] = useState("analytics");
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeCards: 0,
        dailyScans: 0,
        emergencyAccess: 0
    });
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            adminApi.getStatistics(),
            adminApi.getAuditLogs(),
            adminApi.getUsers(),
        ])
            .then(([statsResponse, logsResponse, usersResponse]) => {
                setStats({
                    totalUsers: statsResponse.totalUsers?.toLocaleString?.() || String(statsResponse.totalUsers || 0),
                    activeCards: statsResponse.activeCards?.toLocaleString?.() || String(statsResponse.activeCards || 0),
                    dailyScans: statsResponse.dailyScans?.toLocaleString?.() || String(statsResponse.dailyScans || 0),
                    emergencyAccess: statsResponse.emergencyAccess?.toLocaleString?.() || String(statsResponse.emergencyAccess || 0),
                });
                setLogs(logsResponse || []);
                setUsers(usersResponse || []);
            })
            .catch((error) => {
                console.error("Failed to load admin dashboard data:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const activitySeries = useMemo(() => {
        const byDay = new Map();

        logs.forEach((log) => {
            const label = log.time ? new Date(log.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
            byDay.set(label, (byDay.get(label) || 0) + 1);
        });

        const points = Array.from(byDay.entries())
            .slice(0, 8)
            .map(([label, value]) => ({ label, value }));

        return points.length > 0 ? points : [{ label: 'No Data', value: 0 }];
    }, [logs]);

    const healthMetrics = useMemo(() => {
        const totalUsers = Number(stats.totalUsers || 0);
        const activeCards = Number(stats.activeCards || 0);
        const dailyScans = Number(stats.dailyScans || 0);
        const emergencyAccess = Number(stats.emergencyAccess || 0);
        const adoption = totalUsers > 0 ? Math.min(100, Math.round((activeCards / totalUsers) * 100)) : 0;
        const verifiedCoverage = totalUsers > 0 ? Math.min(100, Math.round((users.length / totalUsers) * 100)) : 0;
        const scanRate = activeCards > 0 ? Math.min(100, Math.round((dailyScans / activeCards) * 100)) : 0;
        const safetyScore = Math.max(0, 100 - Math.min(100, emergencyAccess * 10));

        return [
            { label: 'Card Adoption', level: adoption },
            { label: 'Directory Coverage', level: verifiedCoverage },
            { label: 'Daily Scan Rate', level: scanRate },
            { label: 'Safety Score', level: safetyScore },
        ];
    }, [stats, users]);

    const chartMax = useMemo(() => Math.max(...activitySeries.map((item) => item.value), 1), [activitySeries]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin size-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 font-display text-slate-900 dark:text-slate-100 transition-colors duration-300">

            {/* SIDEBAR FOR ADMIN */}
            <aside className="fixed left-0 top-0 bottom-0 w-72 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-8 z-50">
                <div className="flex items-center gap-3 text-primary mb-12">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined font-black">admin_panel_settings</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight">System Root</span>
                </div>

                <nav className="space-y-3">
                    <AdminNavLink active={view === "analytics"} onClick={() => setView("analytics")} icon="monitoring" label="Analytics" />
                    <AdminNavLink active={view === "users"} onClick={() => setView("users")} icon="group" label="User Control" />
                    <AdminNavLink active={view === "audit"} onClick={() => setView("audit")} icon="receipt_long" label="Audit Vault" />
                    <AdminNavLink active={view === "config"} onClick={() => setView("config")} icon="tune" label="System Config" />
                </nav>

                <div className="absolute bottom-8 left-8 right-8">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-6 py-4 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-2xl font-bold hover:bg-red-100 transition-all"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        Logout
                    </button>
                </div>
            </aside>

            {/* MAIN ADMIN AREA */}
            <main className="pl-72 min-h-screen">

                {/* TOP BAR */}
                <div className="h-20 px-10 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-40">
                    <h2 className="text-xl font-bold capitalize">{view.replace('_', ' ')} Command Center</h2>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => document.documentElement.classList.toggle("dark")}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                        >
                            <span className="material-symbols-outlined">dark_mode</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" alt="admin" />
                            </div>
                            <span className="text-sm font-bold">Admin Root</span>
                        </div>
                    </div>
                </div>

                {/* VIEW CONTENT */}
                <div className="p-10 space-y-10 animate-in fade-in duration-500">

                    {view === "analytics" && (
                        <>
                            {/* STATS GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <StatBlock label="Total Ecosystem Users" value={stats.totalUsers} sub="Managed identities" />
                                <StatBlock label="Verified Smart Cards" value={stats.activeCards} sub="82% Adoption" />
                                <StatBlock label="Live NFC Scans" value={stats.dailyScans} sub="+12% from yesterday" />
                                <StatBlock label="Emergency Overrides" value={stats.emergencyAccess} sub="Critical interventions" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                <section className="lg:col-span-8 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="font-bold text-lg">Cross-Domain Activity</h3>
                                        <span className="bg-white dark:bg-slate-800 rounded-xl text-xs font-bold px-4 py-2 shadow-sm">Live audit feed</span>
                                    </div>
                                    <div className="flex items-end justify-between h-56 gap-4 mb-4 px-4 overflow-hidden">
                                        {activitySeries.map((point) => (
                                            <div key={point.label} className="flex-1 bg-primary/20 hover:bg-primary rounded-t-2xl transition-all relative group" style={{ height: `${Math.max(10, Math.round((point.value / chartMax) * 100))}%` }}>
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all font-bold shadow-xl z-10 whitespace-nowrap">
                                                    {point.value} events
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-tighter pt-4 border-t dark:border-slate-800">
                                        {activitySeries.map((point) => <span key={point.label}>{point.label}</span>)}
                                    </div>
                                </section>

                                <section className="lg:col-span-4 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-lg">System Health</h3>
                                        <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]"></span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
                                        {healthMetrics.map((metric) => (
                                            <HealthBar key={metric.label} label={metric.label} level={metric.level} />
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </>
                    )}

                    {view === "users" && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-slate-500 font-medium">Manage and provision access for medical staff across the network.</p>
                                <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">person_add</span>
                                    New Staff Identity
                                </button>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Identify</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Authorized Role</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Affiliation</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Access Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-slate-800">
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500">
                                                            {u.name[0]}
                                                        </div>
                                                        <span className="font-bold">{u.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-xs font-black uppercase py-1.5 px-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
                                                        {u.role.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-sm text-slate-500 font-medium">{u.hospital}</td>
                                                <td className="px-8 py-6 text-right">
                                                    <button className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full transition-all border
                                            ${u.status === 'active'
                                                            ? "bg-green-50 text-green-600 border-green-100 dark:bg-green-900/10"
                                                            : "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/10"}
                                        `}>
                                                        {u.status}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {view === "audit" && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="flex flex-col gap-6">
                                {logs.map(log => (
                                    <div key={log.id} className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-primary/50 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                                                <span className="material-symbols-outlined text-3xl">
                                                    {log.action?.includes("NFC") ? "contactless" : log.action?.includes("EMERGENCY") ? "emergency" : log.action?.includes("LOGIN") ? "login" : "receipt_long"}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-black text-xl leading-none">{log.action?.replace(/_/g, " ") || "ACTION"} TRIGGERED</h4>
                                                <p className="text-sm text-slate-500 font-medium">Initiated by <span className="text-slate-900 dark:text-white font-bold">{log.user}</span> • Target: {log.target}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{log.time ? new Date(log.time).toLocaleString() : "N/A"}</p>
                                            <span className="text-[10px] font-bold text-green-500 bg-green-50 dark:bg-green-900/10 px-3 py-1 rounded-full uppercase">Verified Transaction</span>
                                        </div>
                                    </div>
                                ))}
                                {logs.length === 0 && (
                                    <div className="text-center py-12 text-slate-500">
                                        No audit logs found
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {view === "config" && (
                        <div className="max-w-3xl space-y-8 animate-in slide-in-from-right-5 duration-500">
                            <h3 className="text-2xl font-bold mb-6">Master Protocol Configuration</h3>
                            <div className="space-y-4">
                                <ConfigToggle label="Enable WebNFC Browser API" active={true} />
                                <ConfigToggle label="Enforce Multi-Factor Staff Auth" active={true} />
                                <ConfigToggle label="Allow Emergency Overrides" active={true} />
                                <ConfigToggle label="Enable Auto-Sync Local Vault" active={false} />
                                <ConfigToggle label="Diagnostic Logging Mode" active={false} />
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}

function AdminNavLink({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${active
                    ? "bg-primary text-white shadow-xl shadow-primary/30"
                    : "text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm"
                }`}
        >
            <span className="material-symbols-outlined">{icon}</span>
            <span>{label}</span>
            {active && <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>}
        </button>
    );
}

function StatBlock({ label, value, sub }) {
    return (
        <div className="bg-slate-100 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 transition-all hover:scale-[1.02] group">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">{label}</p>
            <p className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter transition-all group-hover:text-primary">{value}</p>
            <p className="text-xs text-slate-500 font-medium">{sub}</p>
        </div>
    );
}

function HealthBar({ label, level }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>{label}</span>
                <span className="text-primary">{level}%</span>
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${level}%` }}></div>
            </div>
        </div>
    )
}

function ConfigToggle({ label, active }) {
    return (
        <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all hover:border-primary/30">
            <span className="font-bold">{label}</span>
            <div className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${active ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? "right-1" : "left-1"}`}></div>
            </div>
        </div>
    )
}
