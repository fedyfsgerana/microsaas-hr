import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import ExportButton from '../../components/ui/ExportButton';
import ManualAttendanceForm from './ManualAttendanceForm';
import { usePagination } from '../../hooks/usePagination';
import { useExport } from '../../hooks/useExport';

const STATUS = {
    PRESENT: { label: 'Hadir', cls: 'badge-success' },
    LATE: { label: 'Terlambat', cls: 'badge-warning' },
    ABSENT: { label: 'Tidak Hadir', cls: 'badge-danger' },
    PERMIT: { label: 'Izin', cls: 'badge-info' },
    SICK: { label: 'Sakit', cls: 'badge-gray' },
};

const currentMonth = new Date().toISOString().slice(0, 7);

export default function AttendancePage() {
    const toast = useToast();
    const confirm = useConfirm();
    const queryClient = useQueryClient();
    const { exportCSV } = useExport();
    const user = useAuthStore((s) => s.user);
    const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN'].includes(user?.role);

    const [month, setMonth] = useState(currentMonth);
    const [modalOpen, setModalOpen] = useState(false);

    const { data: todayStatus } = useQuery({
        queryKey: ['attendance-today'],
        queryFn: () => api.get('/attendance/today').then((r) => r.data),
        enabled: !isAdmin,
        refetchInterval: 30000,
    });

    const { data: attendances = [], isLoading } = useQuery({
        queryKey: ['attendances', month, isAdmin],
        queryFn: async () => {
            const res = await api.get(isAdmin ? '/attendance/company' : '/attendance/my', { params: { month } });
            return res.data;
        },
    });

    const { data: summary } = useQuery({
        queryKey: ['attendance-summary', month],
        queryFn: () => api.get('/attendance/summary', { params: { month } }).then((r) => r.data),
        enabled: isAdmin,
    });

    const { page, totalPages, paginated, goToPage, nextPage, prevPage } = usePagination(attendances, 15);

    const checkInMutation = useMutation({
        mutationFn: () => api.post('/attendance/check-in', {}),
        onSuccess: () => {
            toast('Absen masuk berhasil! ✓', 'success');
            queryClient.invalidateQueries(['attendance-today']);
            queryClient.invalidateQueries(['attendances']);
        },
        onError: (err) => toast(err.response?.data?.message || 'Gagal absen', 'error'),
    });

    const checkOutMutation = useMutation({
        mutationFn: () => api.post('/attendance/check-out', {}),
        onSuccess: () => {
            toast('Absen pulang berhasil! ✓', 'success');
            queryClient.invalidateQueries(['attendance-today']);
            queryClient.invalidateQueries(['attendances']);
        },
        onError: (err) => toast(err.response?.data?.message || 'Gagal absen', 'error'),
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

    const handleCSV = () => {
        exportCSV(attendances.map((a) => ({
            Tanggal: new Date(a.date).toLocaleDateString('id-ID'),
            Karyawan: a.employee?.fullName || '',
            'Jam Masuk': a.checkIn ? new Date(a.checkIn).toLocaleTimeString('id-ID') : '',
            'Jam Pulang': a.checkOut ? new Date(a.checkOut).toLocaleTimeString('id-ID') : '',
            Status: STATUS[a.status]?.label || a.status,
            Terlambat: a.isLate ? `${a.lateMinutes} menit` : '-',
        })), 'absensi');
    };

    return (
        <div className="space-y-5 page-enter">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Absensi</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {isAdmin ? 'Rekap kehadiran karyawan' : 'Rekap kehadiran Anda'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <ExportButton onCSV={handleCSV} />
                    {isAdmin && (
                        <button onClick={() => setModalOpen(true)} className="btn-primary">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Input Manual
                        </button>
                    )}
                </div>
            </div>

            {/* Check in/out (employee) */}
            {!isAdmin && (
                <div className="overflow-hidden card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900 dark:text-white">Absensi Hari Ini</h3>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${todayStatus?.hasCheckedIn && !todayStatus?.hasCheckedOut ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                            <span className="text-xs text-gray-500">
                                {todayStatus?.hasCheckedOut ? 'Selesai' : todayStatus?.hasCheckedIn ? 'Sedang kerja' : 'Belum absen'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-2xl">
                            <p className="mb-1 text-xs text-gray-500">Masuk</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                                {todayStatus?.attendance?.checkIn
                                    ? new Date(todayStatus.attendance.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                    : '--:--'}
                            </p>
                            {todayStatus?.attendance?.isLate && (
                                <span className="inline-block mt-1 badge-warning">
                                    +{todayStatus.attendance.lateMinutes}m terlambat
                                </span>
                            )}
                        </div>
                        <div className="p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-2xl">
                            <p className="mb-1 text-xs text-gray-500">Pulang</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                                {todayStatus?.attendance?.checkOut
                                    ? new Date(todayStatus.attendance.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                    : '--:--'}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleCheckIn}
                            disabled={todayStatus?.hasCheckedIn || checkInMutation.isPending}
                            className="flex-1 py-3 btn-primary disabled:opacity-40"
                        >
                            {checkInMutation.isPending ? 'Memproses...' : '✓ Absen Masuk'}
                        </button>
                        <button
                            onClick={handleCheckOut}
                            disabled={!todayStatus?.hasCheckedIn || todayStatus?.hasCheckedOut || checkOutMutation.isPending}
                            className="flex-1 py-3 btn-secondary disabled:opacity-40"
                        >
                            {checkOutMutation.isPending ? 'Memproses...' : 'Absen Pulang'}
                        </button>
                    </div>
                </div>
            )}

            {/* Summary cards (admin) */}
            {isAdmin && summary && (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[
                        { label: 'Total', value: summary.total, cls: 'text-gray-900 dark:text-white', bg: 'bg-gray-50 dark:bg-gray-800' },
                        { label: 'Hadir', value: summary.present, cls: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                        { label: 'Terlambat', value: summary.late, cls: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                        { label: 'Tidak Hadir', value: summary.absent, cls: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
                    ].map((s) => (
                        <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
                            <p className={`text-3xl font-black ${s.cls}`}>{s.value}</p>
                            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
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
                <span className="text-sm text-gray-500">{attendances.length} data</span>
            </div>

            {/* Table */}
            <div className="p-0 overflow-hidden card">
                {isLoading ? (
                    <LoadingSpinner center />
                ) : attendances.length === 0 ? (
                    <EmptyState title="Belum ada data absensi" description="Data absensi bulan ini belum tersedia" />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-800">
                                        {isAdmin && <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Karyawan</th>}
                                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
                                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Masuk</th>
                                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pulang</th>
                                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ket.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                    {paginated.map((att) => (
                                        <tr key={att.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            {isAdmin && (
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{att.employee?.fullName}</p>
                                                    <p className="text-xs text-gray-400">{att.employee?.department?.name}</p>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                {new Date(att.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-gray-700 dark:text-gray-300">
                                                {att.checkIn ? new Date(att.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-gray-700 dark:text-gray-300">
                                                {att.checkOut ? new Date(att.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={STATUS[att.status]?.cls}>{STATUS[att.status]?.label}</span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-400">
                                                {att.isLate && att.lateMinutes > 0 && `+${att.lateMinutes}m`}
                                                {att.isManualEntry && ' 📝'}
                                                {att.note && ` · ${att.note}`}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                            <Pagination page={page} totalPages={totalPages} onPage={goToPage} onPrev={prevPage} onNext={nextPage} />
                        </div>
                    </>
                )}
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Input Absensi Manual">
                <ManualAttendanceForm
                    onSuccess={() => { setModalOpen(false); queryClient.invalidateQueries(['attendances']); }}
                    onCancel={() => setModalOpen(false)}
                />
            </Modal>
        </div>
    );
}