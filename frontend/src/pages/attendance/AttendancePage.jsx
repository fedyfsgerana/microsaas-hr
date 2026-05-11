import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import ManualAttendanceForm from './ManualAttendanceForm';

const statusVariant = {
    PRESENT: 'success',
    LATE: 'warning',
    ABSENT: 'danger',
    PERMIT: 'info',
    SICK: 'gray',
};

const statusLabel = {
    PRESENT: 'Hadir',
    LATE: 'Terlambat',
    ABSENT: 'Tidak Hadir',
    PERMIT: 'Izin',
    SICK: 'Sakit',
};

const currentMonth = new Date().toISOString().slice(0, 7);

export default function AttendancePage() {
    const toast = useToast();
    const confirm = useConfirm();
    const queryClient = useQueryClient();
    const user = useAuthStore((s) => s.user);
    const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN'].includes(user?.role);

    const [month, setMonth] = useState(currentMonth);
    const [modalOpen, setModalOpen] = useState(false);

    // Today status (for employee)
    const { data: todayStatus, isLoading: loadingToday } = useQuery({
        queryKey: ['attendance-today'],
        queryFn: async () => {
            const res = await api.get('/attendance/today');
            return res.data;
        },
        enabled: !isAdmin,
    });

    // Attendance list
    const { data: attendances = [], isLoading } = useQuery({
        queryKey: ['attendances', month, isAdmin],
        queryFn: async () => {
            const endpoint = isAdmin ? '/attendance/company' : '/attendance/my';
            const res = await api.get(endpoint, { params: { month } });
            return res.data;
        },
    });

    // Summary (admin)
    const { data: summary } = useQuery({
        queryKey: ['attendance-summary', month],
        queryFn: async () => {
            const res = await api.get('/attendance/summary', { params: { month } });
            return res.data;
        },
        enabled: isAdmin,
    });

    const checkInMutation = useMutation({
        mutationFn: () => api.post('/attendance/check-in', {}),
        onSuccess: () => {
            toast('Absen masuk berhasil', 'success');
            queryClient.invalidateQueries(['attendance-today']);
            queryClient.invalidateQueries(['attendances']);
        },
        onError: (err) => {
            toast(err.response?.data?.message || 'Gagal absen masuk', 'error');
        },
    });

    const checkOutMutation = useMutation({
        mutationFn: () => api.post('/attendance/check-out', {}),
        onSuccess: () => {
            toast('Absen pulang berhasil', 'success');
            queryClient.invalidateQueries(['attendance-today']);
            queryClient.invalidateQueries(['attendances']);
        },
        onError: (err) => {
            toast(err.response?.data?.message || 'Gagal absen pulang', 'error');
        },
    });

    const handleCheckIn = async () => {
        const ok = await confirm({
            title: 'Absen Masuk?',
            message: `Waktu sekarang: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
            confirmText: 'Absen Masuk',
            type: 'info',
        });
        if (ok) checkInMutation.mutate();
    };

    const handleCheckOut = async () => {
        const ok = await confirm({
            title: 'Absen Pulang?',
            message: `Waktu sekarang: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
            confirmText: 'Absen Pulang',
            type: 'info',
        });
        if (ok) checkOutMutation.mutate();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Absensi</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {isAdmin ? 'Rekap kehadiran seluruh karyawan' : 'Rekap kehadiran Anda'}
                    </p>
                </div>
                {isAdmin && (
                    <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 btn-primary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Input Manual
                    </button>
                )}
            </div>

            {/* Check in/out card (employee) */}
            {!isAdmin && (
                <div className="card">
                    <h3 className="mb-4 font-semibold text-gray-900">Absensi Hari Ini</h3>
                    {loadingToday ? (
                        <LoadingSpinner center size="sm" />
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 text-center bg-gray-50 rounded-xl">
                                    <p className="mb-1 text-xs text-gray-500">Absen Masuk</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {todayStatus?.attendance?.checkIn
                                            ? new Date(todayStatus.attendance.checkIn).toLocaleTimeString('id-ID', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })
                                            : '--:--'}
                                    </p>
                                    {todayStatus?.attendance?.isLate && (
                                        <Badge variant="warning" className="mt-1">
                                            Terlambat {todayStatus.attendance.lateMinutes} menit
                                        </Badge>
                                    )}
                                </div>
                                <div className="p-4 text-center bg-gray-50 rounded-xl">
                                    <p className="mb-1 text-xs text-gray-500">Absen Pulang</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {todayStatus?.attendance?.checkOut
                                            ? new Date(todayStatus.attendance.checkOut).toLocaleTimeString('id-ID', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })
                                            : '--:--'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleCheckIn}
                                    disabled={todayStatus?.hasCheckedIn || checkInMutation.isPending}
                                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {checkInMutation.isPending ? 'Memproses...' : 'Absen Masuk'}
                                </button>
                                <button
                                    onClick={handleCheckOut}
                                    disabled={!todayStatus?.hasCheckedIn || todayStatus?.hasCheckedOut || checkOutMutation.isPending}
                                    className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {checkOutMutation.isPending ? 'Memproses...' : 'Absen Pulang'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Summary (admin) */}
            {isAdmin && summary && (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[
                        { label: 'Total Absensi', value: summary.total, color: 'text-gray-900' },
                        { label: 'Hadir', value: summary.present, color: 'text-green-600' },
                        { label: 'Terlambat', value: summary.late, color: 'text-yellow-600' },
                        { label: 'Tidak Hadir', value: summary.absent, color: 'text-red-600' },
                    ].map((stat) => (
                        <div key={stat.label} className="text-center card">
                            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-3">
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-auto input-field"
                />
            </div>

            {/* Table */}
            <div className="p-0 overflow-hidden card">
                {isLoading ? (
                    <LoadingSpinner center />
                ) : attendances.length === 0 ? (
                    <EmptyState
                        title="Belum ada data absensi"
                        description="Data absensi bulan ini belum tersedia"
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    {isAdmin && (
                                        <th className="px-6 py-3 font-medium text-left text-gray-500">Karyawan</th>
                                    )}
                                    <th className="px-6 py-3 font-medium text-left text-gray-500">Tanggal</th>
                                    <th className="px-6 py-3 font-medium text-left text-gray-500">Masuk</th>
                                    <th className="px-6 py-3 font-medium text-left text-gray-500">Pulang</th>
                                    <th className="px-6 py-3 font-medium text-left text-gray-500">Status</th>
                                    <th className="px-6 py-3 font-medium text-left text-gray-500">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {attendances.map((att) => (
                                    <tr key={att.id} className="transition-colors hover:bg-gray-50">
                                        {isAdmin && (
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">{att.employee?.fullName}</p>
                                                <p className="text-xs text-gray-400">{att.employee?.department?.name}</p>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(att.date).toLocaleDateString('id-ID', {
                                                weekday: 'short',
                                                day: 'numeric',
                                                month: 'short',
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {att.checkIn
                                                ? new Date(att.checkIn).toLocaleTimeString('id-ID', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })
                                                : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {att.checkOut
                                                ? new Date(att.checkOut).toLocaleTimeString('id-ID', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })
                                                : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={statusVariant[att.status]}>
                                                {statusLabel[att.status]}
                                            </Badge>
                                            {att.isLate && att.lateMinutes > 0 && (
                                                <span className="ml-2 text-xs text-yellow-600">
                                                    +{att.lateMinutes} mnt
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400">
                                            {att.isManualEntry ? '📝 Manual' : ''}
                                            {att.note || ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal manual entry */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Input Absensi Manual"
            >
                <ManualAttendanceForm
                    onSuccess={() => {
                        setModalOpen(false);
                        queryClient.invalidateQueries(['attendances']);
                    }}
                    onCancel={() => setModalOpen(false)}
                />
            </Modal>
        </div>
    );
}