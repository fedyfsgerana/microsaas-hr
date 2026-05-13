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
import PayrollDetailModal from './PayrollDetailModal';
import { usePagination } from '../../hooks/usePagination';
import { useExport } from '../../hooks/useExport';

const STATUS = {
    DRAFT: { label: 'Draft', cls: 'badge-gray' },
    APPROVED: { label: 'Disetujui', cls: 'badge-info' },
    SENT: { label: 'Terkirim', cls: 'badge-success' },
};

const currentMonth = new Date().toISOString().slice(0, 7);

export default function PayrollPage() {
    const toast = useToast();
    const confirm = useConfirm();
    const queryClient = useQueryClient();
    const { exportCSV } = useExport();
    const user = useAuthStore((s) => s.user);
    const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN'].includes(user?.role);

    const [period, setPeriod] = useState(currentMonth);
    const [detailModal, setDetailModal] = useState(false);
    const [selected, setSelected] = useState(null);

    const { data: payrolls = [], isLoading } = useQuery({
        queryKey: ['payrolls', period],
        queryFn: () => api.get('/payroll', { params: { period } }).then((r) => r.data),
        enabled: isAdmin,
    });

    const { data: myPayrolls = [], isLoading: loadingMy } = useQuery({
        queryKey: ['my-payrolls'],
        queryFn: () => api.get('/payroll/my').then((r) => r.data),
        enabled: !isAdmin,
    });

    const { data: summary } = useQuery({
        queryKey: ['payroll-summary', period],
        queryFn: () => api.get('/payroll/summary', { params: { period } }).then((r) => r.data),
        enabled: isAdmin,
    });

    const { page, totalPages, paginated, goToPage, nextPage, prevPage } = usePagination(payrolls, 10);

    const generateMutation = useMutation({
        mutationFn: () => api.post('/payroll/generate', { period }),
        onSuccess: (res) => {
            const created = res.data.results?.filter((r) => r.status === 'created').length || 0;
            toast(`${created} payroll berhasil dibuat`, 'success');
            queryClient.invalidateQueries(['payrolls']);
            queryClient.invalidateQueries(['payroll-summary']);
        },
        onError: (err) => toast(err.response?.data?.message || 'Gagal generate', 'error'),
    });

    const approveMutation = useMutation({
        mutationFn: (id) => api.patch(`/payroll/${id}/approve`),
        onSuccess: () => { toast('Payroll disetujui', 'success'); queryClient.invalidateQueries(['payrolls', 'payroll-summary']); },
        onError: (err) => toast(err.response?.data?.message || 'Gagal', 'error'),
    });

    const sendMutation = useMutation({
        mutationFn: (id) => api.patch(`/payroll/${id}/send`),
        onSuccess: () => { toast('Slip gaji terkirim ✓', 'success'); queryClient.invalidateQueries(['payrolls', 'payroll-summary']); },
        onError: (err) => toast(err.response?.data?.message || 'Gagal', 'error'),
    });

    const handleGenerate = async () => {
        const ok = await confirm({
            title: 'Generate Payroll?',
            message: `Payroll periode ${period} akan dibuat berdasarkan data absensi.`,
            confirmText: 'Generate',
            type: 'info',
        });
        if (ok) generateMutation.mutate();
    };

    const handleApprove = async (p) => {
        const ok = await confirm({
            title: 'Setujui Payroll?',
            message: `${p.employee?.fullName} · Rp ${Number(p.totalSalary).toLocaleString('id-ID')}`,
            confirmText: 'Setujui',
            type: 'info',
        });
        if (ok) approveMutation.mutate(p.id);
    };

    const handleSend = async (p) => {
        const ok = await confirm({
            title: 'Kirim Slip Gaji?',
            message: `Slip gaji ${p.employee?.fullName} akan dikirim. Tidak bisa dibatalkan.`,
            confirmText: 'Kirim',
            type: 'warning',
        });
        if (ok) sendMutation.mutate(p.id);
    };

    const handleCSV = () => {
        exportCSV(payrolls.map((p) => ({
            Karyawan: p.employee?.fullName,
            Jabatan: p.employee?.position || '',
            'Gaji Pokok': Number(p.baseSalary),
            Tunjangan: Number(p.allowances),
            Potongan: Number(p.deductions) + Number(p.bpjsDeduction),
            'Total Bersih': Number(p.totalSalary),
            'Hari Hadir': p.presentDays,
            'Hari Kerja': p.workingDays,
            Status: STATUS[p.status]?.label,
        })), `payroll_${period}`);
    };

    // Employee view
    if (!isAdmin) {
        return (
            <div className="space-y-5 page-enter">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Slip Gaji</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Riwayat slip gaji Anda</p>
                </div>

                {loadingMy ? <LoadingSpinner center /> : myPayrolls.length === 0 ? (
                    <EmptyState title="Belum ada slip gaji" description="Slip gaji akan muncul setelah diproses HR" />
                ) : (
                    <div className="space-y-3">
                        {myPayrolls.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => { setSelected(p); setDetailModal(true); }}
                                className="flex items-center gap-4 p-5 card-hover"
                            >
                                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-white">Periode {p.period}</p>
                                    <p className="text-sm text-gray-500 mt-0.5">{p.presentDays}/{p.workingDays} hari hadir</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-gray-900 dark:text-white">
                                        Rp {Number(p.totalSalary).toLocaleString('id-ID')}
                                    </p>
                                    <span className={STATUS[p.status]?.cls}>{STATUS[p.status]?.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title="Detail Slip Gaji">
                    <PayrollDetailModal payroll={selected} />
                </Modal>
            </div>
        );
    }

    // Admin view
    return (
        <div className="space-y-5 page-enter">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Penggajian</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Periode {period}</p>
                </div>
                <div className="flex gap-2">
                    <ExportButton onCSV={handleCSV} />
                    <button
                        onClick={handleGenerate}
                        disabled={generateMutation.isPending}
                        className="btn-primary"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {generateMutation.isPending ? 'Generating...' : 'Generate'}
                    </button>
                </div>
            </div>

            {/* Summary */}
            {summary && (
                <>
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {[
                            { label: 'Total Karyawan', value: summary.totalEmployees, cls: 'text-gray-900 dark:text-white', bg: 'bg-gray-50 dark:bg-gray-800' },
                            { label: 'Draft', value: summary.draft, cls: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800' },
                            { label: 'Disetujui', value: summary.approved, cls: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                            { label: 'Terkirim', value: summary.sent, cls: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                        ].map((s) => (
                            <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
                                <p className={`text-3xl font-black ${s.cls}`}>{s.value}</p>
                                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="mb-1 text-xs text-gray-500">Total Bruto</p>
                                <p className="text-lg font-black text-gray-900 dark:text-white">Rp {Number(summary.totalGross || 0).toLocaleString('id-ID')}</p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs text-gray-500">Total Potongan</p>
                                <p className="text-lg font-black text-red-600">-Rp {Number(summary.totalDeductions || 0).toLocaleString('id-ID')}</p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs text-gray-500">Total Bersih</p>
                                <p className="text-lg font-black text-green-600">Rp {Number(summary.totalNet || 0).toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Period filter */}
            <div className="flex items-center gap-3">
                <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-auto input-field" />
            </div>

            {/* Table */}
            <div className="p-0 overflow-hidden card">
                {isLoading ? <LoadingSpinner center /> : payrolls.length === 0 ? (
                    <EmptyState
                        title="Belum ada data payroll"
                        description={`Klik "Generate" untuk membuat payroll periode ${period}`}
                        action={<button onClick={handleGenerate} className="btn-primary">Generate Payroll</button>}
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-800">
                                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Karyawan</th>
                                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hadir</th>
                                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Gaji Pokok</th>
                                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Potongan</th>
                                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                        <th className="px-6 py-3.5" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                    {paginated.map((p) => (
                                        <tr key={p.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.employee?.fullName}</p>
                                                <p className="text-xs text-gray-400">{p.employee?.position}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-gray-900 dark:text-white">{p.presentDays}</span>
                                                <span className="text-gray-400">/{p.workingDays}</span>
                                                {p.lateDays > 0 && <span className="ml-1 text-xs text-amber-500">({p.lateDays}×tl)</span>}
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                Rp {Number(p.baseSalary).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 text-red-500">
                                                -Rp {(Number(p.deductions) + Number(p.bpjsDeduction)).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 font-black text-gray-900 dark:text-white">
                                                Rp {Number(p.totalSalary).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={STATUS[p.status]?.cls}>{STATUS[p.status]?.label}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 justify-end">
                                                    <button
                                                        onClick={() => { setSelected(p); setDetailModal(true); }}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    {p.status === 'DRAFT' && (
                                                        <button onClick={() => handleApprove(p)} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 transition-colors">
                                                            Setujui
                                                        </button>
                                                    )}
                                                    {p.status === 'APPROVED' && (
                                                        <button onClick={() => handleSend(p)} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 transition-colors">
                                                            Kirim
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
                    </>
                )}
            </div>

            <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title="Detail Payroll">
                <PayrollDetailModal payroll={selected} />
            </Modal>
        </div>
    );
}