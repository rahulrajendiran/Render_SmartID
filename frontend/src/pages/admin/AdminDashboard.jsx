import { useEffect, useMemo, useState } from "react";
import adminApi from "../../services/admin.api";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeCards: 0,
        dailyScans: 0,
        emergencyAccess: 0,
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
                    totalUsers: Number(statsResponse.totalUsers || 0),
                    activeCards: Number(statsResponse.activeCards || 0),
                    dailyScans: Number(statsResponse.dailyScans || 0),
                    emergencyAccess: Number(statsResponse.emergencyAccess || 0),
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

    const roleSummary = useMemo(() => {
        const roles = [
            { key: "admin", label: "System Root" },
            { key: "hospital", label: "Hospitals" },
            { key: "doctor", label: "Doctors" },
            { key: "medical_shop", label: "Pharmacies" },
            { key: "patient", label: "Patients" },
        ];

        const counts = users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {});

        return roles.map((role) => ({
            ...role,
            count: counts[role.key] || 0,
        }));
    }, [users]);

    const activitySeries = useMemo(() => {
        const byDay = new Map();

        logs.forEach((log) => {
            const label = log.time
                ? new Date(log.time).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "Unknown";
            byDay.set(label, (byDay.get(label) || 0) + 1);
        });

        const points = Array.from(byDay.entries())
            .slice(-7)
            .map(([label, value]) => ({ label, value }));

        return points.length ? points : [{ label: "No Data", value: 0 }];
    }, [logs]);

    const chartMax = useMemo(() => Math.max(...activitySeries.map((item) => item.value), 1), [activitySeries]);

    const healthMetrics = useMemo(() => {
        const adoption = stats.totalUsers > 0 ? Math.round((stats.activeCards / stats.totalUsers) * 100) : 0;
        const scanRate = stats.activeCards > 0 ? Math.min(100, Math.round((stats.dailyScans / stats.activeCards) * 100)) : 0;
        const incidentPressure = Math.min(100, stats.emergencyAccess * 12);
        const directoryCoverage = stats.totalUsers > 0 ? Math.min(100, Math.round((users.length / stats.totalUsers) * 100)) : 0;

        return [
            { label: "Card adoption", value: adoption, tone: "emerald" },
            { label: "Directory coverage", value: directoryCoverage, tone: "sky" },
            { label: "Scan throughput", value: scanRate, tone: "amber" },
            { label: "Incident pressure", value: incidentPressure, tone: "rose" },
        ];
    }, [stats, users]);

    const recentUsers = useMemo(() => users.slice(0, 5), [users]);
    const latestLogs = useMemo(() => logs.slice(0, 5), [logs]);
    const commandBrief = useMemo(() => {
        const dominantRole = [...roleSummary].sort((a, b) => b.count - a.count)[0];
        return {
            dominantRole: dominantRole?.label || "No active domains",
            activeShare: stats.totalUsers > 0 ? Math.round((stats.activeCards / stats.totalUsers) * 100) : 0,
        };
    }, [roleSummary, stats]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-4 text-slate-200">
                    <div className="size-8 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
                    <span className="text-sm font-bold tracking-wide">Loading system root telemetry...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 text-white">
            <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(226,232,240,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(145deg,_#0f172a_0%,_#0b1120_46%,_#020617_100%)] p-8 lg:p-10 shadow-[0_30px_80px_rgba(2,6,23,0.55)]">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:28px_28px] opacity-15" />
                <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <div className="relative grid gap-8 xl:grid-cols-[1.45fr_0.9fr] xl:items-end">
                    <div className="max-w-3xl space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-emerald-200 backdrop-blur-md">
                            <span className="size-2 rounded-full bg-emerald-400" />
                            System Root Online
                        </div>
                        <div className="space-y-4">
                            <h1 className="max-w-4xl text-4xl font-black tracking-[-0.04em] text-white lg:text-6xl">Unified Smart-ID Executive Control Surface</h1>
                            <p className="max-w-2xl text-sm leading-7 text-slate-300 lg:text-base">
                                Premium root visibility across identity issuance, access assurance, emergency escalation, and trust telemetry for the entire Smart-ID network.
                            </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            <ExecutiveChip label="Primary domain" value={commandBrief.dominantRole} />
                            <ExecutiveChip label="Card activation" value={`${commandBrief.activeShare}%`} />
                            <ExecutiveChip label="Audit cadence" value={logs.length ? "Monitored" : "Awaiting flow"} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
                        <SignalPill label="API" value="Live" tone="emerald" />
                        <SignalPill label="Audit" value={logs.length ? "Flowing" : "Idle"} tone="sky" />
                        <SignalPill label="Cards" value={stats.activeCards} tone="amber" />
                        <SignalPill label="Alerts" value={stats.emergencyAccess} tone="rose" />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                <KpiCard label="Total identities" value={stats.totalUsers} helper="Registered users across all domains" tone="emerald" />
                <KpiCard label="Active smart cards" value={stats.activeCards} helper="Linked and ready for live access" tone="sky" />
                <KpiCard label="Daily audit events" value={stats.dailyScans} helper="Recent interactions in the last 24h" tone="amber" />
                <KpiCard label="Emergency overrides" value={stats.emergencyAccess} helper="Critical-access interventions recorded" tone="rose" />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                <Panel title="Audit velocity" subtitle="Recent command traffic across the network">
                    <div className="space-y-6">
                        <div className="flex h-64 items-end gap-3 rounded-[28px] border border-white/5 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(2,6,23,0.9))] p-6 shadow-inner shadow-black/20">
                            {activitySeries.map((point) => (
                                <div key={point.label} className="flex flex-1 flex-col items-center justify-end gap-3">
                                    <div className="w-full rounded-2xl bg-gradient-to-t from-emerald-500 via-emerald-400 to-emerald-300 shadow-[0_12px_30px_rgba(16,185,129,0.25)]" style={{ height: `${Math.max(12, Math.round((point.value / chartMax) * 100))}%` }} />
                                    <div className="text-center">
                                        <div className="text-xs font-black text-slate-200">{point.value}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{point.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            {roleSummary.slice(0, 3).map((item) => (
                                <div key={item.key} className="rounded-[22px] border border-white/5 bg-white/[0.03] px-4 py-4 backdrop-blur-sm">
                                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
                                    <div className="mt-2 text-2xl font-black text-white">{item.count}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Panel>

                <Panel title="System health" subtitle="Live operational posture">
                    <div className="space-y-5">
                        {healthMetrics.map((metric) => (
                            <HealthMeter key={metric.label} {...metric} />
                        ))}

                        <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-5 backdrop-blur-sm">
                            <div className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Role distribution</div>
                            <div className="space-y-3">
                                {roleSummary.map((item) => (
                                    <div key={item.key} className="flex items-center justify-between text-sm">
                                        <span className="font-semibold text-slate-300">{item.label}</span>
                                        <span className="font-black text-white">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Panel>
            </section>

            <section className="grid gap-6 2xl:grid-cols-[1.2fr_1fr]">
                <Panel title="Recent audit trail" subtitle="Latest verified root-visible actions">
                    <div className="space-y-3">
                        {latestLogs.length > 0 ? latestLogs.map((log) => (
                            <div key={log.id} className="flex flex-col gap-4 rounded-[24px] border border-white/5 bg-white/[0.03] p-5 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                                        <span className="material-symbols-outlined">
                                            {log.action?.includes("NFC") ? "contactless" : log.action?.includes("EMERGENCY") ? "emergency" : log.action?.includes("LOGIN") ? "login" : "data_usage"}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm font-black uppercase tracking-wide text-white">{(log.action || "Unknown event").replace(/_/g, " ")}</div>
                                        <div className="text-sm text-slate-400">{log.user || "Unknown user"} {"->"} {log.target || "System"}</div>
                                    </div>
                                </div>
                                <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                    {log.time ? new Date(log.time).toLocaleString() : "N/A"}
                                </div>
                            </div>
                        )) : (
                            <EmptyState text="No audit events available yet." />
                        )}
                    </div>
                </Panel>

                <Panel title="Newest identities" subtitle="Most recent accounts visible to system root">
                    <div className="space-y-3">
                        {recentUsers.length > 0 ? recentUsers.map((user) => (
                            <div key={user.id} className="flex items-center justify-between rounded-[22px] border border-white/5 bg-white/[0.03] px-5 py-4 backdrop-blur-sm">
                                <div className="flex items-center gap-4">
                                    <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-800 text-sm font-black text-emerald-300">
                                        {(user.name || "U").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{user.name}</div>
                                        <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{user.username}</div>
                                    </div>
                                </div>
                                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
                                    {String(user.role).replace("_", " ")}
                                </span>
                            </div>
                        )) : (
                            <EmptyState text="No user identities available yet." />
                        )}
                    </div>
                </Panel>
            </section>
        </div>
    );
}

function Panel({ title, subtitle, children }) {
    return (
        <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.35)] lg:p-7">
            <div className="mb-6 flex flex-col gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">{title}</h2>
                <p className="text-sm text-slate-400">{subtitle}</p>
            </div>
            {children}
        </section>
    );
}

function KpiCard({ label, value, helper, tone }) {
    const toneClass = {
        emerald: "from-emerald-500/18 via-emerald-500/6 to-white/[0.02]",
        sky: "from-sky-500/18 via-sky-500/6 to-white/[0.02]",
        amber: "from-amber-500/18 via-amber-500/6 to-white/[0.02]",
        rose: "from-rose-500/18 via-rose-500/6 to-white/[0.02]",
    }[tone];

    return (
        <div className={`rounded-[28px] border border-white/10 bg-gradient-to-br ${toneClass} p-6 shadow-[0_18px_40px_rgba(2,6,23,0.22)]`}>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
            <div className="mt-4 text-4xl font-black tracking-tight text-white">{Number(value).toLocaleString()}</div>
            <div className="mt-2 text-sm text-slate-400">{helper}</div>
        </div>
    );
}

function SignalPill({ label, value, tone }) {
    const toneClass = {
        emerald: "border-emerald-400/15 bg-white/[0.04] text-emerald-200",
        sky: "border-sky-400/15 bg-white/[0.04] text-sky-200",
        amber: "border-amber-400/15 bg-white/[0.04] text-amber-200",
        rose: "border-rose-400/15 bg-white/[0.04] text-rose-200",
    }[tone];

    return (
        <div className={`rounded-[20px] border px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md ${toneClass}`}>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] opacity-80">{label}</div>
            <div className="mt-1 text-lg font-black text-white">{typeof value === "number" ? value.toLocaleString() : value}</div>
        </div>
    );
}

function HealthMeter({ label, value, tone }) {
    const barClass = {
        emerald: "bg-emerald-400",
        sky: "bg-sky-400",
        amber: "bg-amber-400",
        rose: "bg-rose-400",
    }[tone];

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-300">{label}</span>
                <span className="font-black text-white">{value}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div className={`h-full rounded-full ${barClass}`} style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

function EmptyState({ text }) {
    return (
        <div className="rounded-[24px] border border-dashed border-slate-700 bg-slate-950/50 px-5 py-10 text-center text-sm font-medium text-slate-500">
            {text}
        </div>
    );
}

function ExecutiveChip({ label, value }) {
    return (
        <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-5 py-4 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</div>
            <div className="mt-2 text-base font-black text-white">{value}</div>
        </div>
    );
}
