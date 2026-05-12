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
import PayrollDetailModal from './PayrollDetailModal';

const statusVariant = {
    DRAFT: 'gray',
    APPROVED: 'info',
    SENT: 'success',
};

const statusLabel = {
    DRAFT: 'Draft',
    APPROVED: 'Disetujui',
    SENT: 'Terkirim',
};

const currentMonth = new Date().toISOString().slice(0, 7);

export default function PayrollPage() {
    const toast = useToast();
    const confirm = useConfirm();
    const queryClient = useQueryClient();
    const user = useAuthStore((s) => s.user);
    const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN'].includes(user?.role);

    const [period, setPeriod] = useState(currentMonth);
    const [detailModal, setDetailModal] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState(null);

    // Admin: payroll list
    const { data: payrolls = [], isLoading } = useQuery({
        queryKey: ['payrolls', period],
        queryFn: async () => {
            const res = await api.get('/payroll', { params: { period } });
            return res.data;
        },
        enabled: isAdmin,
    });

    // Employee: my payrolls
    const { data: myPayrolls = [], isLoading: loadingMy } = useQuery({
        queryKey: ['my-payrolls'],
        queryFn: async () => {
            const res = await api.get('/payroll/my');
            return res.data;
        },
        enabled: !isAdmin,
    });

    // Summary
    const { data: summary } = useQuery({
        queryKey: ['payroll-summary', period],
        queryFn: async () => {
            const res = await api.get('/payroll/summary', { params: { period } });
            return res.data;
        },
        enabled: isAdmin,
    });

    const generateMutation = useMutation({
        mutationFn: (period) => api.post('/payroll/generate', { period }),
        onSuccess: (data) => {
            const created = data.data.results.filter((r) => r.status === 'created').length;
            const skipped = data.data.results.filter((r) => r.status === 'skipped').length;
            toast(`${created} payroll dibuat, ${skipped} dilewati`, 'success');
            queryClient.invalidateQueries(['payrolls']);
            queryClient.invalidateQueries(['payroll-summary']);
        },
        onError: (err) => {
            toast(err.response?.data?.message || 'Gagal generate payroll', 'error');
        },
    });

    const approveMutation = useMutation({
        mutationFn: (id) => api.patch(`/payroll/${id}/approve`),
        onSuccess: () => {
            toast('Payroll disetujui', 'success');
            queryClient.invalidateQueries(['payrolls']);
            queryClient.invalidateQueries(['payroll-summary']);
        },
        onError: (err) => {
            toast(err.response?.data?.message || 'Gagal menyetujui payroll', 'error');
        },
    });

    const sendMutation = useMutation({
        mutationFn: (id) => api.patch(`/payroll/${id}/send`),
        onSuccess: () => {
            toast('Slip gaji berhasil dikirim', 'success');
            queryClient.invalidateQueries(['payrolls']);
            queryClient.invalidateQueries(['payroll-summary']);
        },
        onError: (err) => {
            toast(err.response?.data?.message || 'Gagal mengirim slip gaji', 'error');
        },
    });

    const handleGenerate = async () => {
        const ok = await confirm({
            title: 'Generate Payroll?',
            message: `Payroll untuk periode ${period} akan digenerate berdasarkan data absensi. Karyawan yang sudah ada payroll-nya akan dilewati.`,
            confirmText: 'Generate',
            type: 'info',
        });
        if (ok) generateMutation.mutate(period);
    };

    const handleApprove = async (payroll) => {
        const ok = await confirm({
            title: 'Setujui Payroll?',
            message: `Payroll ${payroll.employee?.fullName} sebesar Rp ${Number(payroll.totalSalary).toLocaleString('id-ID')} akan disetujui.`,
            confirmText: 'Setujui',
            type: 'info',
        });
        if (ok) approveMutation.mutate(payroll.id);
    };

    const handleSend = async (payroll) => {
        const ok = await confirm({
            title: 'Kirim Slip Gaji?',
            message: `Slip gaji ${payroll.employee?.fullName} akan dikirim. Tindakan ini tidak bisa dibatalkan.`,
            confirmText: 'Kirim',
            type: 'warning',
        });
        if (ok) sendMutation.mutate(payroll.id);
    };

    const handleDetail = (payroll) => {
        setSelectedPayroll(payroll);
        setDetailModal(true);
    };

    // Employee view
    if (!isAdmin) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Slip Gaji</h1>
                    <p className="mt-1 text-sm text-gray-500">Riwayat slip gaji Anda</p>
                </div>

                {loadingMy ? (
                    <LoadingSpinner center />
                ) : myPayrolls.length === 0 ? (
                    <EmptyState
                        title="Belum ada slip gaji"
                        description="Slip gaji akan muncul di sini setelah diproses oleh HR"
                    />
                ) : (
                    <div className="space-y-3">
                        {myPayrolls.map((payroll) => (
                            <div
                                key={payroll.id}
                                className="transition-shadow cursor-pointer card hover:shadow-md"
                                onClick={() => handleDetail(payroll)}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">{payroll.period}</p>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {payroll.presentDays} hari hadir dari {payroll.workingDays} hari kerja
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-gray-900">
                                            Rp {Number(payroll.totalSalary).toLocaleString('id-ID')}
                                        </p>
                                        <Badge variant={statusVariant[payroll.status]}>
                                            {statusLabel[payroll.status]}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Modal
                    isOpen={detailModal}
                    onClose={() => setDetailModal(false)}
                    title="Detail Slip Gaji"
                >
                    <PayrollDetailModal payroll={selectedPayroll} />
                </Modal>
            </div>
        );
    }

    // Admin view
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Penggajian</h1>
                    <p className="mt-1 text-sm text-gray-500">Kelola payroll karyawan</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending}
                    className="flex items-center gap-2 btn-primary"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {generateMutation.isPending ? 'Generating...' : 'Generate Payroll'}
                </button>
            </div>

            {/* Summary */}
            {summary && (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[
                        { label: 'Total Karyawan', value: summary.totalEmployees, color: 'text-gray-900' },
                        { label: 'Draft', value: summary.draft, color: 'text-gray-500' },
                        { label: 'Disetujui', value: summary.approved, color: 'text-blue-600' },
                        { label: 'Terkirim', value: summary.sent, color: 'text-green-600' },
                    ].map((stat) => (
                        <div key={stat.label} className="text-center card">
                            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {summary && (
                <div className="card">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-sm text-gray-500">Total Gaji Bruto</p>
                            <p className="mt-1 text-xl font-bold text-gray-900">
                                Rp {Number(summary.totalGross || 0).toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Potongan</p>
                            <p className="mt-1 text-xl font-bold text-red-600">
                                Rp {Number(summary.totalDeductions || 0).toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Gaji Bersih</p>
                            <p className="mt-1 text-xl font-bold text-green-600">
                                Rp {Number(summary.totalNet || 0).toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div>
                <input
                    type="month"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-auto input-field"
                />
            </div>

            {/* Table */}
            <div className="p-0 overflow-hidden card">
                {isLoading ? (
                    <LoadingSpinner center />
                ) : payrolls.length === 0 ? (
                    <EmptyState
                        title="Belum ada data payroll"
                        description={`Klik "Generate Payroll" untuk membuat payroll periode ${period}`}
                        action={
                            <button onClick={handleGenerate} className="btn-primary">
                                Generate Payroll
                            </button>
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-6 py-3 font-medium text-left text-gray-500">Karyawan</th>
                                    <th className="px-6 py-3 font-medium text-left text-gray-500">Hadir</th>
                                    <th className="px-6 py-3 font-medium text-left text-gray-500">Gaji Pokok</th>
                                    <th className="px-6 py-3 font-medium text-left text-gray-500">Tunjangan</th>
                                    <th className="px-6 py-3 font-medium text-left text-gray-500">Potongan</th>
                                    <th className="px-6 py-3 font-medium text-left text-gray-500">Total</th>
                                    <th className="px-6 py-3 font-medium text-left text-gray-500">Status</th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {payrolls.map((payroll) => (
                                    <tr key={payroll.id} className="transition-colors hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900">{payroll.employee?.fullName}</p>
                                            <p className="text-xs text-gray-400">{payroll.employee?.position}</p>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {payroll.presentDays}/{payroll.workingDays}
                                            {payroll.lateDays > 0 && (
                                                <span className="ml-1 text-xs text-yellow-600">
                                                    ({payroll.lateDays} tlmbat)
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            Rp {Number(payroll.baseSalary).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-green-600">
                                            +Rp {Number(payroll.allowances).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-red-500">
                                            -Rp {(Number(payroll.deductions) + Number(payroll.bpjsDeduction)).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">
                                            Rp {Number(payroll.totalSalary).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={statusVariant[payroll.status]}>
                                                {statusLabel[payroll.status]}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleDetail(payroll)}
                                                    className="text-gray-400 transition-colors hover:text-primary-600"
                                                    title="Detail"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                {payroll.status === 'DRAFT' && (
                                                    <button
                                                        onClick={() => handleApprove(payroll)}
                                                        className="px-2 py-1 text-xs text-blue-600 transition-colors rounded-lg bg-blue-50 hover:bg-blue-100"
                                                    >
                                                        Setujui
                                                    </button>
                                                )}
                                                {payroll.status === 'APPROVED' && (
                                                    <button
                                                        onClick={() => handleSend(payroll)}
                                                        className="px-2 py-1 text-xs text-green-600 transition-colors rounded-lg bg-green-50 hover:bg-green-100"
                                                    >
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
                )}
            </div>

            <Modal
                isOpen={detailModal}
                onClose={() => setDetailModal(false)}
                title="Detail Payroll"
            >
                <PayrollDetailModal payroll={selectedPayroll} />
            </Modal>
        </div>
    );
}