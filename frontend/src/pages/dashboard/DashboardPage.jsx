import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AttendanceChart from '../../components/charts/AttendanceChart';
import PayrollChart from '../../components/charts/PayrollChart';

const StatCard = ({ title, value, subtitle, color, icon }) => (
    <div className="card">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
                {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-700">
                {icon}
            </div>
        </div>
    </div>
);

export default function DashboardPage() {
    const user = useAuthStore((s) => s.user);
    const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN'].includes(user?.role);
    const currentYear = new Date().getFullYear();

    const { data, isLoading, isError } = useQuery({
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
    });

    if (isLoading) return <LoadingSpinner center />;

    // Belum setup
    if (isError || (!isLoading && !data)) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <div className="py-12 text-center card">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900">
                        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Selamat Datang!</h2>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                        {isAdmin
                            ? 'Setup perusahaan Anda terlebih dahulu untuk mulai menggunakan aplikasi.'
                            : 'Akun Anda belum terhubung ke perusahaan. Hubungi HR Admin Anda.'}
                    </p>
                    {isAdmin && (
                        <a href="/company" className="inline-block btn-primary">
                            Setup Perusahaan
                        </a>
                    )}
                </div>
            </div>
        );
    }

    // Admin dashboard
    if (isAdmin && data) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{data.company?.name}</p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard
                        title="Total Karyawan"
                        value={data.overview?.totalEmployees}
                        color="text-primary-600"
                        icon={
                            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Hadir Hari Ini"
                        value={data.overview?.presentToday}
                        subtitle={`${data.overview?.lateToday} terlambat`}
                        color="text-green-600"
                        icon={
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Tidak Hadir"
                        value={data.overview?.absentToday}
                        subtitle={`${data.overview?.onLeaveToday} cuti`}
                        color="text-red-600"
                        icon={
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Pengajuan Cuti"
                        value={data.overview?.pendingLeaves}
                        subtitle="menunggu approval"
                        color="text-yellow-600"
                        icon={
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                </div>

                {/* Payroll summary */}
                <div className="card">
                    <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Penggajian Bulan Ini</h3>
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Payroll</p>
                            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                                Rp {Number(data.payroll?.totalPayroll || 0).toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Diproses</p>
                            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                                {data.payroll?.processedCount} karyawan
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Terlambat Bulan Ini</p>
                            <p className="mt-1 text-xl font-bold text-yellow-600">
                                {data.attendance?.lateThisMonth} kali
                            </p>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                {analytics && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <AttendanceChart data={analytics.monthlyAttendance} />
                        <PayrollChart data={analytics.monthlyPayroll} />
                    </div>
                )}

                {/* Top late */}
                {analytics?.topLate?.length > 0 && (
                    <div className="card">
                        <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                            Top Keterlambatan {currentYear}
                        </h3>
                        <div className="space-y-3">
                            {analytics.topLate.map((emp, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900">
                                            <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                                                {emp.fullName?.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{emp.fullName}</p>
                                            <p className="text-xs text-gray-400">{emp.position}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-yellow-600">{emp.lateCount}x</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Employee dashboard
    if (!isAdmin && data) {
        if (!data.employee) {
            return (
                <div className="space-y-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                    <div className="py-12 text-center card">
                        <p className="text-gray-500 dark:text-gray-400">
                            Akun Anda belum terhubung ke perusahaan. Hubungi HR Admin Anda.
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Halo, {data.employee?.fullName} 👋
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {data.employee?.position} · {data.employee?.department}
                    </p>
                </div>

                {/* Today status */}
                <div className="card">
                    <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Status Hari Ini</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 text-center bg-gray-50 dark:bg-gray-700 rounded-xl">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Absen Masuk</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                {data.today?.checkIn
                                    ? new Date(data.today.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                    : '--:--'}
                            </p>
                        </div>
                        <div className="p-4 text-center bg-gray-50 dark:bg-gray-700 rounded-xl">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Absen Pulang</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                {data.today?.checkOut
                                    ? new Date(data.today.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                    : '--:--'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* This month */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center card">
                        <p className="text-2xl font-bold text-green-600">{data.thisMonth?.presentDays}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Hadir</p>
                    </div>
                    <div className="text-center card">
                        <p className="text-2xl font-bold text-yellow-600">{data.thisMonth?.lateDays}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Terlambat</p>
                    </div>
                    <div className="text-center card">
                        <p className="text-2xl font-bold text-red-600">{data.thisMonth?.absentDays}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Absen</p>
                    </div>
                </div>

                {/* Leave balances */}
                <div className="card">
                    <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Saldo Cuti</h3>
                    {data.leaveBalances?.length > 0 ? (
                        <div className="space-y-3">
                            {data.leaveBalances.map((balance) => (
                                <div key={balance.id} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">{balance.leaveType}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-600">
                                            <div
                                                className="h-2 transition-all rounded-full bg-primary-600"
                                                style={{ width: `${(balance.remaining / balance.quota) * 100}%` }}
                                            />
                                        </div>
                                        <span className="w-16 text-sm font-medium text-right text-gray-900 dark:text-white">
                                            {balance.remaining}/{balance.quota}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">Belum ada data saldo cuti</p>
                    )}
                </div>

                {/* Recent leaves */}
                {data.recentLeaves?.length > 0 && (
                    <div className="card">
                        <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Pengajuan Cuti Terbaru</h3>
                        <div className="space-y-3">
                            {data.recentLeaves.map((leave) => (
                                <div key={leave.id} className="flex items-center justify-between text-sm">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{leave.leaveType}</p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(leave.startDate).toLocaleDateString('id-ID')} —{' '}
                                            {new Date(leave.endDate).toLocaleDateString('id-ID')}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : ''}
                    ${leave.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : ''}
                    ${leave.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : ''}
                    ${leave.status === 'CANCELLED' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : ''}
                  `}>
                                        {leave.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Latest payroll */}
                {data.latestPayroll && (
                    <div className="card">
                        <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Slip Gaji Terakhir</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Periode {data.latestPayroll.period}
                                </p>
                                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                    Rp {Number(data.latestPayroll.totalSalary).toLocaleString('id-ID')}
                                </p>
                            </div>
                            <span className="badge-success">Terkirim</span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
}