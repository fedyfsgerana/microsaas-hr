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
import LeaveForm from './LeaveForm';
import ApproveLeaveForm from './ApproveLeaveForm';

const statusVariant = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    CANCELLED: 'gray',
};

const statusLabel = {
    PENDING: 'Menunggu',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
    CANCELLED: 'Dibatalkan',
};

const leaveTypeLabel = {
    ANNUAL: 'Cuti Tahunan',
    SICK: 'Sakit',
    PERMIT: 'Izin',
    OTHER: 'Lainnya',
};

export default function LeavePage() {
    const toast = useToast();
    const confirm = useConfirm();
    const queryClient = useQueryClient();
    const user = useAuthStore((s) => s.user);
    const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(user?.role);

    const [modalOpen, setModalOpen] = useState(false);
    const [approveModal, setApproveModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [filterStatus, setFilterStatus] = useState('');

    const { data: leaves = [], isLoading } = useQuery({
        queryKey: ['leaves', isAdmin, filterStatus],
        queryFn: async () => {
            const endpoint = isAdmin ? '/leaves/company' : '/leaves/my';
            const res = await api.get(endpoint, {
                params: filterStatus ? { status: filterStatus } : {},
            });
            return res.data;
        },
    });

    const cancelMutation = useMutation({
        mutationFn: (id) => api.patch(`/leaves/${id}/cancel`),
        onSuccess: () => {
            toast('Pengajuan cuti dibatalkan', 'success');
            queryClient.invalidateQueries(['leaves']);
        },
        onError: (err) => {
            toast(err.response?.data?.message || 'Gagal membatalkan cuti', 'error');
        },
    });

    const handleCancel = async (leave) => {
        const ok = await confirm({
            title: 'Batalkan Pengajuan Cuti?',
            message: 'Pengajuan cuti yang dibatalkan tidak bisa dikembalikan.',
            confirmText: 'Ya, Batalkan',
            type: 'danger',
        });
        if (ok) cancelMutation.mutate(leave.id);
    };

    const handleApprove = (leave) => {
        setSelectedLeave(leave);
        setApproveModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Cuti & Izin</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {isAdmin ? 'Kelola pengajuan cuti karyawan' : 'Pengajuan cuti Anda'}
                    </p>
                </div>
                {!isAdmin && (
                    <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 btn-primary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Ajukan Cuti
                    </button>
                )}
            </div>

            {/* Filter */}
            <div className="flex flex-wrap items-center gap-2">
                {['', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${filterStatus === status
                                ? 'bg-primary-600 text-white'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {status === '' ? 'Semua' : statusLabel[status]}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="p-0 overflow-hidden card">
                {isLoading ? (
                    <LoadingSpinner center />
                ) : leaves.length === 0 ? (
                    <EmptyState
                        title="Belum ada pengajuan cuti"
                        description={isAdmin ? 'Belum ada karyawan yang mengajukan cuti' : 'Anda belum pernah mengajukan cuti'}
                        action={
                            !isAdmin && (
                                <button onClick={() => setModalOpen(true)} className="btn-primary">
                                    Ajukan Cuti
                                </button>
                            )
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    {isAdmin && (
                                        <th className="px-6 py-3 font-medium text-left text-gray-500">Karyawan</th>
                                    )}
                                    <th className="px-6 py-3 font-medium text-left text-gray-500">Jenis Cuti</th>
                                    <th className="px-6 py-3 font-medium text-left text-gray-500">Tanggal</th>
                                    <th className="px-6 py-3 font-medium text-left text-gray-500">Durasi</th>
                                    <th className="px-6 py-3 font-medium text-left text-gray-500">Alasan</th>
                                    <th className="px-6 py-3 font-medium text-left text-gray-500">Status</th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {leaves.map((leave) => (
                                    <tr key={leave.id} className="transition-colors hover:bg-gray-50">
                                        {isAdmin && (
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">{leave.employee?.fullName}</p>
                                                <p className="text-xs text-gray-400">{leave.employee?.department?.name}</p>
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <Badge variant="info">{leaveTypeLabel[leave.leaveType]}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <p>{new Date(leave.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                                            {leave.startDate !== leave.endDate && (
                                                <p className="text-xs text-gray-400">
                                                    s/d {new Date(leave.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {leave.totalDays} hari
                                        </td>
                                        <td className="max-w-xs px-6 py-4 text-gray-500 truncate">
                                            {leave.reason || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={statusVariant[leave.status]}>
                                                {statusLabel[leave.status]}
                                            </Badge>
                                            {leave.rejectReason && (
                                                <p className="mt-1 text-xs text-red-500">{leave.rejectReason}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {isAdmin && leave.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleApprove(leave)}
                                                        className="px-3 py-1 text-xs btn-primary"
                                                    >
                                                        Review
                                                    </button>
                                                )}
                                                {!isAdmin && leave.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleCancel(leave)}
                                                        className="text-gray-400 transition-colors hover:text-red-500"
                                                        title="Batalkan"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal ajukan cuti */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Ajukan Cuti"
            >
                <LeaveForm
                    onSuccess={() => {
                        setModalOpen(false);
                        queryClient.invalidateQueries(['leaves']);
                    }}
                    onCancel={() => setModalOpen(false)}
                />
            </Modal>

            {/* Modal approve */}
            <Modal
                isOpen={approveModal}
                onClose={() => setApproveModal(false)}
                title="Review Pengajuan Cuti"
            >
                <ApproveLeaveForm
                    leave={selectedLeave}
                    onSuccess={() => {
                        setApproveModal(false);
                        queryClient.invalidateQueries(['leaves']);
                    }}
                    onCancel={() => setApproveModal(false)}
                />
            </Modal>
        </div>
    );
}