import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';
import AttendanceChart from '../../components/charts/AttendanceChart';
import PayrollChart from '../../components/charts/PayrollChart';

function SkeletonCard() {
    return (
        <div className="space-y-3 card">
            <div className="w-24 h-4 skeleton" />
            <div className="w-16 h-8 skeleton" />
            <div className="w-32 h-3 skeleton" />
        </div>
    );
}

function StatCard({ title, value, subtitle, icon, color, trend }) {
    const colors = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
        red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    };

    return (
        <div className="card group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${colors[color]}`}>
                    {icon}
                </div>
                {trend !== undefined && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg
            ${trend >= 0 ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{value ?? 0}</p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">{title}</p>
            {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
    );
}

function QuickAction({ to, icon, label, desc, color }) {
    return (
        <Link to={to} className="flex items-center gap-4 p-4 card-hover group">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
            </div>
            <svg className="w-4 h-4 ml-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </Link>
    );
}

export default function DashboardPage() {
    const user = useAuthStore((s) => s.user);
    const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN'].includes(user?.role);
    const currentYear = new Date().getFullYear();

    const { data, isLoading } = useQuery({
        queryKey: ['dashboard', isAdmin ? 'admin' : 'employee'],
        queryFn: async () => {
            try {
                const res = await api.get(isAdmin ? '/dashboard/admin' : '/dashboard/employee');
                return res.data;
            } catch (err) {
                if (err.response?.status === 404) return null;
                throw err;
            }
        },
    });

    const { data: analytics } = useQuery({
        queryKey: ['analytics', currentYear],
        queryFn: async () => {
            const res = await api.get('/dashboard/analytics', { params: { year: currentYear } });
            return res.data;
        },
        enabled: isAdmin && !!data,
        refetchInterval: 5 * 60 * 1000,
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="w-48 h-8 skeleton" />
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
                <div className="w-full h-64 skeleton rounded-2xl" />
            </div>
        );
    }

    // Belum setup company
    if (!data) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Dashboard</h1>
                </div>
                <div className="py-16 text-center card">
                    <div className="flex items-center justify-center w-20 h-20 mx-auto mb-5 bg-primary-50 rounded-3xl">
                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Selamat Datang! 👋</h2>
                    <p className="max-w-sm mx-auto mb-6 text-gray-500 dark:text-gray-400">
                        {isAdmin
                            ? 'Setup profil perusahaan Anda untuk mulai menggunakan semua fitur.'
                            : 'Akun Anda belum terhubung ke perusahaan. Hubungi HR Admin Anda.'}
                    </p>
                    {isAdmin && (
                        <Link to="/company" className="btn-primary">
                            Setup Perusahaan →
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    // ── ADMIN DASHBOARD ────────────────────────────────────────────
    if (isAdmin) {
        const attendance = data.overview || {};
        const attendanceRate = attendance.totalEmployees
            ? Math.round((attendance.presentToday / attendance.totalEmployees) * 100)
            : 0;

        return (
            <div className="space-y-6 page-enter">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                            {data.company?.name}
                        </h1>
                    </div>
                    <div className="items-center hidden gap-2 px-4 py-2 sm:flex bg-green-50 dark:bg-green-900/20 rounded-2xl">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-semibold text-green-700 dark:text-green-400">Live</span>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard
                        title="Total Karyawan"
                        value={attendance.totalEmployees}
                        color="blue"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    />
                    <StatCard
                        title="Hadir Hari Ini"
                        value={attendance.presentToday}
                        subtitle={`${attendanceRate}% tingkat kehadiran`}
                        color="green"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <StatCard
                        title="Tidak Hadir"
                        value={attendance.absentToday}
                        subtitle={`${attendance.onLeaveToday} sedang cuti`}
                        color="red"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <StatCard
                        title="Cuti Pending"
                        value={attendance.pendingLeaves}
                        subtitle="menunggu approval"
                        color="amber"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                </div>

                {/* Attendance rate bar */}
                <div className="card">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900 dark:text-white">Tingkat Kehadiran Hari Ini</h3>
                        <span className="text-2xl font-black text-primary">{attendanceRate}%</span>
                    </div>
                    <div className="w-full h-3 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-800">
                        <div
                            className="h-3 transition-all duration-1000 rounded-full bg-primary"
                            style={{ width: `${attendanceRate}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                        <span>{attendance.presentToday} hadir</span>
                        <span>{attendance.lateToday} terlambat</span>
                        <span>{attendance.absentToday} absen</span>
                    </div>
                </div>

                {/* Charts */}
                {analytics && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <AttendanceChart data={analytics.monthlyAttendance} />
                        <PayrollChart data={analytics.monthlyPayroll} />
                    </div>
                )}

                {/* Payroll + Quick actions */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Payroll summary */}
                    <div className="card">
                        <h3 className="mb-4 font-bold text-gray-900 dark:text-white">Penggajian Bulan Ini</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Total Payroll', value: `Rp ${Number(data.payroll?.totalPayroll || 0).toLocaleString('id-ID')}`, color: 'text-gray-900 dark:text-white' },
                                { label: 'Karyawan Diproses', value: `${data.payroll?.processedCount || 0} orang`, color: 'text-gray-900 dark:text-white' },
                                { label: 'Terlambat Bulan Ini', value: `${data.attendance?.lateThisMonth || 0} kali`, color: 'text-amber-600' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                                    <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick actions */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-gray-900 dark:text-white">Aksi Cepat</h3>
                        <QuickAction
                            to="/employees"
                            label="Tambah Karyawan"
                            desc="Daftarkan karyawan baru"
                            color="bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
                        />
                        <QuickAction
                            to="/leave"
                            label="Approval Cuti"
                            desc={`${attendance.pendingLeaves} menunggu review`}
                            color="bg-amber-50 dark:bg-amber-900/20 text-amber-600"
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                        />
                        <QuickAction
                            to="/payroll"
                            label="Proses Payroll"
                            desc="Generate & kirim slip gaji"
                            color="bg-green-50 dark:bg-green-900/20 text-green-600"
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        />
                    </div>
                </div>

                {/* Top late */}
                {analytics?.topLate?.length > 0 && (
                    <div className="card">
                        <h3 className="mb-4 font-bold text-gray-900 dark:text-white">Top Keterlambatan {currentYear}</h3>
                        <div className="space-y-3">
                            {analytics.topLate.map((emp, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="w-4 text-xs font-bold text-gray-400">{i + 1}</span>
                                    <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-full bg-primary-50">
                                        <span className="text-xs font-bold text-primary">{emp.fullName?.charAt(0)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate dark:text-white">{emp.fullName}</p>
                                        <p className="text-xs text-gray-400">{emp.position}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                                            <div
                                                className="bg-amber-400 h-1.5 rounded-full"
                                                style={{ width: `${Math.min((emp.lateCount / (analytics.topLate[0]?.lateCount || 1)) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <span className="w-8 text-sm font-bold text-right text-amber-600">{emp.lateCount}x</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── EMPLOYEE DASHBOARD ─────────────────────────────────────────
    if (!data.employee) {
        return (
            <div className="py-12 text-center card">
                <p className="text-gray-500">Akun belum terhubung ke perusahaan. Hubungi HR Admin.</p>
            </div>
        );
    }

    const today = data.today || {};
    const thisMonth = data.thisMonth || {};

    return (
        <div className="space-y-6 page-enter">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                        Halo, {data.employee.fullName?.split(' ')[0]} 👋
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {data.employee.position} · {data.employee.company}
                    </p>
                </div>
            </div>

            {/* Check in/out card */}
            <div className="text-white border-0 card bg-gradient-to-br from-primary to-blue-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">Absensi Hari Ini</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold
            ${today.hasCheckedIn
                            ? today.hasCheckedOut ? 'bg-white/20' : 'bg-green-400/30'
                            : 'bg-white/10'
                        }`}>
                        {today.hasCheckedOut ? '✓ Selesai' : today.hasCheckedIn ? '● Sedang Kerja' : '○ Belum Absen'}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="p-4 text-center bg-white/10 backdrop-blur rounded-2xl">
                        <p className="mb-1 text-xs text-white/70">Masuk</p>
                        <p className="text-2xl font-black">
                            {today.checkIn ? new Date(today.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </p>
                    </div>
                    <div className="p-4 text-center bg-white/10 backdrop-blur rounded-2xl">
                        <p className="mb-1 text-xs text-white/70">Pulang</p>
                        <p className="text-2xl font-black">
                            {today.checkOut ? new Date(today.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </p>
                    </div>
                </div>
                <Link
                    to="/attendance"
                    className="block w-full py-3 text-sm font-semibold text-center transition-colors rounded-2xl bg-white/20 hover:bg-white/30"
                >
                    {today.hasCheckedOut ? 'Lihat Rekap Absensi' : today.hasCheckedIn ? 'Absen Pulang →' : 'Absen Sekarang →'}
                </Link>
            </div>

            {/* Month stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Hadir', value: thisMonth.presentDays || 0, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                    { label: 'Terlambat', value: thisMonth.lateDays || 0, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    { label: 'Absen', value: thisMonth.absentDays || 0, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
                ].map((s) => (
                    <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Leave balances */}
            {data.leaveBalances?.length > 0 && (
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900 dark:text-white">Saldo Cuti</h3>
                        <Link to="/leave" className="text-sm font-semibold text-primary hover:underline">Ajukan →</Link>
                    </div>
                    <div className="space-y-3">
                        {data.leaveBalances.map((b) => (
                            <div key={b.id}>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="font-medium text-gray-600 dark:text-gray-400">{b.leaveType}</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{b.remaining}/{b.quota} hari</span>
                                </div>
                                <div className="w-full h-2 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-800">
                                    <div
                                        className="h-2 transition-all duration-700 rounded-full bg-primary"
                                        style={{ width: `${b.quota > 0 ? (b.remaining / b.quota) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent leaves */}
            {data.recentLeaves?.length > 0 && (
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900 dark:text-white">Pengajuan Terbaru</h3>
                        <Link to="/leave" className="text-sm font-semibold text-primary hover:underline">Lihat semua →</Link>
                    </div>
                    <div className="space-y-2">
                        {data.recentLeaves.map((leave) => (
                            <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{leave.leaveType}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {new Date(leave.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                        {' — '}
                                        {new Date(leave.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                                <span className={`badge
                  ${leave.status === 'APPROVED' ? 'badge-success' : ''}
                  ${leave.status === 'PENDING' ? 'badge-warning' : ''}
                  ${leave.status === 'REJECTED' ? 'badge-danger' : ''}
                  ${leave.status === 'CANCELLED' ? 'badge-gray' : ''}
                `}>
                                    {leave.status === 'APPROVED' ? 'Disetujui' : leave.status === 'PENDING' ? 'Menunggu' : leave.status === 'REJECTED' ? 'Ditolak' : 'Dibatalkan'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Latest payroll */}
            {data.latestPayroll && (
                <div className="card">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white">Slip Gaji Terakhir</h3>
                        <Link to="/payroll" className="text-sm font-semibold text-primary hover:underline">Lihat →</Link>
                    </div>
                    <p className="mb-3 text-xs text-gray-400">Periode {data.latestPayroll.period}</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">
                        Rp {Number(data.latestPayroll.totalSalary).toLocaleString('id-ID')}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="badge-success">Terkirim</span>
                        <span className="text-xs text-gray-400">{data.latestPayroll.presentDays} hari hadir</span>
                    </div>
                </div>
            )}
        </div>
    );
}