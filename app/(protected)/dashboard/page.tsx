"use client"

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Layers,
    Network,
    FolderKanban,
    Briefcase,
    Database,
    Cpu,
    Server,
    ArrowUpRight,
    Search
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from "recharts";
import { useRouter } from "next/navigation";

interface DashboardStats {
    totalComponents: number;
    bianCount: number;
    bcCount: number;
    dcCount: number;
    abbCount: number;
    sbbCount: number;
    projectCount: number;
    relationshipCount: number;
}

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function loadStats() {
            try {
                // Load catalog
                const catalogRes = await fetch('/api/catalog');
                const catalog = catalogRes.ok ? await catalogRes.json() : null;

                // Load projects
                const projectsRes = await fetch('/api/projects');
                const projects = projectsRes.ok ? await projectsRes.json() : [];

                if (catalog) {
                    setStats({
                        bianCount: catalog.bians?.length || 0,
                        bcCount: catalog.businessCapabilities?.length || 0,
                        dcCount: catalog.dataCapabilities?.length || 0,
                        abbCount: catalog.abbs?.length || 0,
                        sbbCount: catalog.sbbs?.length || 0,
                        totalComponents:
                            (catalog.bians?.length || 0) +
                            (catalog.businessCapabilities?.length || 0) +
                            (catalog.dataCapabilities?.length || 0) +
                            (catalog.abbs?.length || 0) +
                            (catalog.sbbs?.length || 0),
                        relationshipCount: catalog.relationships?.length || 0,
                        projectCount: projects?.length || 0
                    });
                }
            } catch (error) {
                console.error('Error loading stats:', error);
            } finally {
                setLoading(false);
            }
        }
        loadStats();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    const chartData = stats ? [
        { name: 'Business', count: stats.bcCount, color: '#f59e0b' },
        { name: 'BIAN Services', count: stats.bianCount, color: '#ec4899' },
        { name: 'Data', count: stats.dcCount, color: '#10b981' },
        { name: 'Architecture Building Blocks', count: stats.abbCount, color: '#3b82f6' },
        { name: 'Solution Building Blocks', count: stats.sbbCount, color: '#8b5cf6' },
    ] : [];

    return (
        <div className="min-h-screen bg-slate-50/50 p-8 overflow-y-auto">
            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl mix-blend-multiply animate-blob" />
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-4000" />
            </div>

            <motion.div
                className="relative max-w-7xl mx-auto space-y-8"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {/* Header */}
                <motion.div variants={item} className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                            Architecture Overview
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">
                            Real-time insights across your enterprise landscape
                        </p>
                    </div>
                </motion.div>

                {/* Key Metrics */}
                <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <GlassCard
                        title="Total Components"
                        value={stats?.totalComponents}
                        icon={Layers}
                        color="blue"
                        loading={loading}
                    />
                    <GlassCard
                        title="Active Projects"
                        value={stats?.projectCount}
                        icon={FolderKanban}
                        color="indigo"
                        loading={loading}
                        onClick={() => router.push('/projects')}
                    />
                    <GlassCard
                        title="Relationships"
                        value={stats?.relationshipCount}
                        icon={Network}
                        color="emerald"
                        loading={loading}
                    />
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Layer Distribution Chart */}
                    <motion.div variants={item} className="lg:col-span-2">
                        <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl shadow-slate-200/50 h-[400px] flex flex-col">
                            <h3 className="text-xl font-bold text-slate-800 mb-6">Landscape Distribution</h3>
                            <div className="flex-1 w-full min-h-0 [&_.recharts-surface]:outline-none [&_.recharts-sector]:outline-none [&_.recharts-wrapper]:outline-none">
                                <ResponsiveContainer width="100%" height="100%" className="outline-none" style={{ outline: 'none' }}>
                                    <BarChart
                                        data={chartData}
                                        barSize={60}
                                        style={{ outline: 'none' }}
                                    >
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                                            dy={10}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                outline: 'none'
                                            }}
                                        />
                                        <Bar
                                            dataKey="count"
                                            radius={[12, 12, 12, 12]}
                                            animationDuration={1500}
                                            style={{ outline: 'none' }}
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                    fillOpacity={0.8}
                                                    strokeWidth={0}
                                                    style={{ outline: 'none' }}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Activity & Access Logs */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <RecentActivity />
                            <AccessLogs />
                        </div>
                    </motion.div>

                    {/* Quick Access / Breakdown */}
                    <motion.div variants={item} className="space-y-6">
                        <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl shadow-slate-200/50">
                            <h3 className="text-xl font-bold text-slate-800 mb-4">Layer Breakdown</h3>
                            <div className="space-y-4">
                                <LayerRow
                                    label="Business Capabilities"
                                    count={stats?.bcCount}
                                    icon={Briefcase}
                                    color="amber"
                                    loading={loading}
                                />
                                <LayerRow
                                    label="BIAN Service Domains"
                                    count={stats?.bianCount}
                                    icon={Layers}
                                    color="pink"
                                    loading={loading}
                                />
                                <LayerRow
                                    label="Data Capabilities"
                                    count={stats?.dcCount}
                                    icon={Database}
                                    color="emerald"
                                    loading={loading}
                                />
                                <LayerRow
                                    label="Architecture Building Blocks"
                                    count={stats?.abbCount}
                                    icon={Cpu}
                                    color="blue"
                                    loading={loading}
                                />
                                <LayerRow
                                    label="Solution Building Blocks"
                                    count={stats?.sbbCount}
                                    icon={Server}
                                    color="violet"
                                    loading={loading}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}

function GlassCard({ title, value, icon: Icon, color, loading, onClick }: any) {
    const colorStyles: any = {
        blue: "bg-blue-500/10 text-blue-600",
        indigo: "bg-indigo-500/10 text-indigo-600",
        emerald: "bg-emerald-500/10 text-emerald-600",
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            onClick={onClick}
            className={`
                bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl p-6 
                shadow-xl shadow-slate-200/50 relative overflow-hidden group
                ${onClick ? 'cursor-pointer' : ''}
            `}
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-slate-500 font-medium text-sm mb-1">{title}</h3>
                    <div className="text-4xl font-bold text-slate-800">
                        {loading ? '-' : value}
                    </div>
                </div>
                <div className={`p-3 rounded-2xl ${colorStyles[color]} transition-colors group-hover:bg-opacity-20`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            {onClick && (
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </div>
            )}
        </motion.div>
    );
}

function LayerRow({ label, count, icon: Icon, color, loading }: any) {
    const colorStyles: any = {
        amber: "bg-amber-100 text-amber-600",
        emerald: "bg-emerald-100 text-emerald-600",
        blue: "bg-blue-100 text-blue-600",
        violet: "bg-violet-100 text-violet-600",
        pink: "bg-pink-100 text-pink-600",
    };

    return (
        <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${colorStyles[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-slate-700">{label}</span>
            </div>
            <span className="font-bold text-slate-900 bg-white px-3 py-1 rounded-full shadow-sm">
                {loading ? '-' : count}
            </span>
        </div>
    );
}

function RecentActivity() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLogs() {
            try {
                const res = await fetch('/api/logs');
                if (res.ok) {
                    setLogs(await res.json());
                }
            } catch (error) {
                console.error('Error fetching logs', error);
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, []);

    if (loading) return null;

    return (
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl shadow-slate-200/50">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Recent System Activity</h3>
            <div className="space-y-4">
                {logs.length === 0 ? (
                    <p className="text-slate-500 text-sm">No recent activity.</p>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50/50 transition-colors border border-transparent hover:border-slate-100">
                            <div className={`p-2 rounded-xl mt-1 ${log.action === 'ADD' ? 'bg-emerald-100 text-emerald-600' :
                                log.action === 'REMOVE' ? 'bg-red-100 text-red-600' :
                                    'bg-blue-100 text-blue-600'
                                }`}>
                                <ActivityIcon action={log.action} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-800">
                                    <span className="font-bold">{log.action}</span>: {log.target}
                                </p>
                                <p className="text-xs text-slate-500">
                                    in project <span className="font-medium text-slate-700">{log.project}</span> • {new Date(log.timestamp).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function ActivityIcon({ action }: { action: string }) {
    if (action === 'ADD') return <ArrowUpRight className="w-4 h-4" />;
    if (action === 'REMOVE') return <ArrowUpRight className="w-4 h-4 rotate-180" />;
    return <Search className="w-4 h-4" />;
}

import { Shield, Lock, Eye, AlertCircle } from "lucide-react";

function AccessLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLogs() {
            try {
                const res = await fetch('/api/access-logs');
                if (res.ok) {
                    setLogs(await res.json());
                }
            } catch (error) {
                console.error('Error fetching access logs', error);
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, []);

    if (loading) return null;

    return (
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl shadow-slate-200/50">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Access Logs</h3>
            <div className="space-y-4">
                {logs.length === 0 ? (
                    <p className="text-slate-500 text-sm">No access logs.</p>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50/50 transition-colors border border-transparent hover:border-slate-100">
                            <div className={`p-2 rounded-xl mt-1 ${log.status === 'FAILURE' ? 'bg-red-100 text-red-600' :
                                log.action === 'LOGIN' ? 'bg-indigo-100 text-indigo-600' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                <AccessIcon action={log.action} status={log.status} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-800">
                                    <span className="font-bold">{log.action}</span>: {log.resource}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {log.user} • {new Date(log.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function AccessIcon({ action, status }: { action: string, status: string }) {
    if (status === 'FAILURE') return <AlertCircle className="w-4 h-4" />;
    if (action === 'LOGIN') return <Lock className="w-4 h-4" />;
    if (action.includes('VIEW')) return <Eye className="w-4 h-4" />;
    return <Shield className="w-4 h-4" />;
}
