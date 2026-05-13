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
import LeaveForm from './LeaveForm';
import ApproveLeaveForm from './ApproveLeaveForm';
import { usePagination } from '../../hooks/usePagination';

const STATUS = {
    PENDING: { label: 'Menunggu', cls: 'badge-warning' },
    APPROVED: { label: 'Disetujui', cls: 'badge-success' },
    REJECTED: { label: 'Ditolak', cls: 'badge-danger' },
    CANCELLED: { label: 'Dibatalkan', cls: 'badge-gray' },
};

const TYPE = {
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

    const [filterStatus, setFilterStatus] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [approveModal, setApproveModal] = useState(false);
    const [selected, setSelected] = useState(null);

    const { data: leaves = [], isLoading } = useQuery({
        queryKey: ['leaves', isAdmin, filterStatus],
        queryFn: async () => {
            const res = await api.get(isAdmin ? '/leaves/company' : '/leaves/my', {
                params: filterStatus ? { status: filterStatus } : {},
            });
            return res.data;
        },
    });

    const { page, totalPages, paginated, goToPage, nextPage, prevPage } = usePagination(leaves, 10);

    const cancelMutation = useMutation({
        mutationFn: (id) => api.patch(`/leaves/${id}/cancel`),
        onSuccess: () => { toast('Pengajuan dibatalkan', 'success'); queryClient.invalidateQueries(['leaves']); },
        onError: (err) => toast(err.response?.data?.message || 'Gagal', 'error'),
    });

    const handleCancel = async (leave) => {
        const ok = await confirm({
            title: 'Batalkan Cuti?',
            message: 'Pengajuan yang dibatalkan tidak bisa dikembalikan.',
            confirmText: 'Batalkan',
            type: 'danger',
        });
        if (ok) cancelMutation.mutate(leave.id);
    };

    const pendingCount = leaves.filter((l) => l.status === 'PENDING').length;

    return (
        <div className="space-y-5 page-enter">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Cuti & Izin</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {isAdmin
                            ? `${pendingCount} menunggu approval`
                            : `${leaves.length} pengajuan`}
                    </p>
                </div>
                {!isAdmin && (
                    <button onClick={() => setModalOpen(true)} className="btn-primary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Ajukan Cuti
                    </button>
                )}
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2">
                {[{ val: '', label: 'Semua' }, ...Object.entries(STATUS).map(([val, { label }]) => ({ val, label }))].map(({ val, label }) => (
                    <button
                        key={val}
                        onClick={() => setFilterStatus(val)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
              ${filterStatus === val
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        {label}
                        {val === 'PENDING' && pendingCount > 0 && (
                            <span className="ml-1.5 bg-amber-400 text-white rounded-full px-1.5 text-xs">{pendingCount}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {isLoading ? (
                <LoadingSpinner center />
            ) : leaves.length === 0 ? (
                <EmptyState
                    title="Belum ada pengajuan cuti"
                    description={isAdmin ? 'Belum ada karyawan yang mengajukan cuti' : 'Anda belum pernah mengajukan cuti'}
                    action={!isAdmin && <button onClick={() => setModalOpen(true)} className="btn-primary">Ajukan Cuti</button>}
                />
            ) : (
                <div className="p-0 overflow-hidden card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800">
                                    {isAdmin && <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Karyawan</th>}
                                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Jenis</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Durasi</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Alasan</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                    <th className="px-6 py-3.5" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {paginated.map((leave) => (
                                    <tr key={leave.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        {isAdmin && (
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center justify-center flex-shrink-0 rounded-lg w-7 h-7 bg-primary-50">
                                                        <span className="text-xs font-bold text-primary">{leave.employee?.fullName?.charAt(0)}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{leave.employee?.fullName}</p>
                                                        <p className="text-xs text-gray-400">{leave.employee?.department?.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <span className="badge-info">{TYPE[leave.leaveType]}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                            <p>{new Date(leave.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                                            {leave.startDate !== leave.endDate && (
                                                <p className="text-xs text-gray-400">
                                                    s/d {new Date(leave.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                                            {leave.totalDays}h
                                        </td>
                                        <td className="max-w-xs px-6 py-4 text-gray-500 truncate">
                                            {leave.reason || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={STATUS[leave.status]?.cls}>{STATUS[leave.status]?.label}</span>
                                            {leave.rejectReason && <p className="mt-1 text-xs text-red-500">{leave.rejectReason}</p>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                {isAdmin && leave.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => { setSelected(leave); setApproveModal(true); }}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary-50 text-primary hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 transition-colors"
                                                    >
                                                        Review
                                                    </button>
                                                )}
                                                {!isAdmin && leave.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleCancel(leave)}
                                                        className="p-2 text-gray-400 transition-colors rounded-xl hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
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
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                        <Pagination page={page} totalPages={totalPages} onPage={goToPage} onPrev={prevPage} onNext={nextPage} />
                    </div>
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Ajukan Cuti">
                <LeaveForm
                    onSuccess={() => { setModalOpen(false); queryClient.invalidateQueries(['leaves']); }}
                    onCancel={() => setModalOpen(false)}
                />
            </Modal>

            <Modal isOpen={approveModal} onClose={() => setApproveModal(false)} title="Review Pengajuan Cuti">
                <ApproveLeaveForm
                    leave={selected}
                    onSuccess={() => { setApproveModal(false); queryClient.invalidateQueries(['leaves']); }}
                    onCancel={() => setApproveModal(false)}
                />
            </Modal>
        </div>
    );
}