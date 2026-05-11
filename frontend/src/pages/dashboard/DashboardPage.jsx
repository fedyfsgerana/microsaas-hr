import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';

const StatCard = ({ title, value, subtitle, color, icon }) => (
    <div className="card">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
                {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace('text', 'bg').replace('-600', '-100').replace('-700', '-100')}`}>
                {icon}
            </div>
        </div>
    </div>
);

export default function DashboardPage() {
    const user = useAuthStore((s) => s.user);
    const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN'].includes(user?.role);

    const { data, isLoading } = useQuery({
        queryKey: ['dashboard', isAdmin ? 'admin' : 'employee'],
        queryFn: async () => {
            const res = await api.get(isAdmin ? '/dashboard/admin' : '/dashboard/employee');
            return res.data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary-600" />
            </div>
        );
    }

    if (isAdmin && data) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">{data.company?.name}</p>
                </div>

                {/* Stats */}
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
                    <h3 className="mb-4 font-semibold text-gray-900">Penggajian Bulan Ini</h3>
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                        <div>
                            <p className="text-sm text-gray-500">Total Payroll</p>
                            <p className="mt-1 text-xl font-bold text-gray-900">
                                Rp {Number(data.payroll?.totalPayroll || 0).toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Diproses</p>
                            <p className="mt-1 text-xl font-bold text-gray-900">
                                {data.payroll?.processedCount} karyawan
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Terlambat Bulan Ini</p>
                            <p className="mt-1 text-xl font-bold text-yellow-600">
                                {data.attendance?.lateThisMonth} kali
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Employee dashboard
    if (!isAdmin && data) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Halo, {data.employee?.fullName} 👋
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {data.employee?.position} · {data.employee?.department}
                    </p>
                </div>

                {/* Today status */}
                <div className="card">
                    <h3 className="mb-4 font-semibold text-gray-900">Status Hari Ini</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-gray-50">
                            <p className="text-xs text-gray-500">Absen Masuk</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">
                                {data.today?.checkIn
                                    ? new Date(data.today.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                    : '-'}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-gray-50">
                            <p className="text-xs text-gray-500">Absen Pulang</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">
                                {data.today?.checkOut
                                    ? new Date(data.today.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                    : '-'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* This month */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center card">
                        <p className="text-2xl font-bold text-green-600">{data.thisMonth?.presentDays}</p>
                        <p className="mt-1 text-xs text-gray-500">Hadir</p>
                    </div>
                    <div className="text-center card">
                        <p className="text-2xl font-bold text-yellow-600">{data.thisMonth?.lateDays}</p>
                        <p className="mt-1 text-xs text-gray-500">Terlambat</p>
                    </div>
                    <div className="text-center card">
                        <p className="text-2xl font-bold text-red-600">{data.thisMonth?.absentDays}</p>
                        <p className="mt-1 text-xs text-gray-500">Absen</p>
                    </div>
                </div>

                {/* Leave balances */}
                <div className="card">
                    <h3 className="mb-4 font-semibold text-gray-900">Saldo Cuti</h3>
                    {data.leaveBalances?.length > 0 ? (
                        <div className="space-y-3">
                            {data.leaveBalances.map((balance) => (
                                <div key={balance.id} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">{balance.leaveType}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 h-2 bg-gray-200 rounded-full">
                                            <div
                                                className="h-2 rounded-full bg-primary-600"
                                                style={{ width: `${(balance.remaining / balance.quota) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {balance.remaining}/{balance.quota} hari
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">Belum ada data saldo cuti</p>
                    )}
                </div>
            </div>
        );
    }

    return null;
}