import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import FormField from '../../components/ui/FormField';
import Badge from '../../components/ui/Badge';

const leaveTypeLabel = {
    ANNUAL: 'Cuti Tahunan',
    SICK: 'Sakit',
    PERMIT: 'Izin',
    OTHER: 'Lainnya',
};

const schema = z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    rejectReason: z.string().optional(),
}).refine((data) => {
    if (data.status === 'REJECTED' && !data.rejectReason?.trim()) {
        return false;
    }
    return true;
}, {
    message: 'Alasan penolakan wajib diisi',
    path: ['rejectReason'],
});

export default function ApproveLeaveForm({ leave, onSuccess, onCancel }) {
    const toast = useToast();
    const confirm = useConfirm();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { status: 'APPROVED' },
    });

    const status = watch('status');

    const mutation = useMutation({
        mutationFn: (data) => api.patch(`/leaves/${leave.id}/approve`, data),
        onSuccess: (_, variables) => {
            toast(
                variables.status === 'APPROVED' ? 'Cuti disetujui' : 'Cuti ditolak',
                variables.status === 'APPROVED' ? 'success' : 'warning',
            );
            onSuccess();
        },
        onError: (err) => {
            toast(err.response?.data?.message || 'Gagal memproses cuti', 'error');
        },
    });

    const onSubmit = async (data) => {
        const isApprove = data.status === 'APPROVED';
        const ok = await confirm({
            title: isApprove ? 'Setujui Cuti?' : 'Tolak Cuti?',
            message: isApprove
                ? `Cuti ${leave?.employee?.fullName} selama ${leave?.totalDays} hari akan disetujui.`
                : `Cuti ${leave?.employee?.fullName} akan ditolak.`,
            confirmText: isApprove ? 'Setujui' : 'Tolak',
            type: isApprove ? 'info' : 'danger',
        });
        if (ok) mutation.mutate(data);
    };

    if (!leave) return null;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Detail cuti */}
            <div className="p-4 space-y-2 text-sm bg-gray-50 rounded-xl">
                <div className="flex justify-between">
                    <span className="text-gray-500">Karyawan</span>
                    <span className="font-medium text-gray-900">{leave.employee?.fullName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Jenis Cuti</span>
                    <Badge variant="info">{leaveTypeLabel[leave.leaveType]}</Badge>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Tanggal</span>
                    <span className="font-medium text-gray-900">
                        {new Date(leave.startDate).toLocaleDateString('id-ID')} —{' '}
                        {new Date(leave.endDate).toLocaleDateString('id-ID')}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Durasi</span>
                    <span className="font-medium text-gray-900">{leave.totalDays} hari</span>
                </div>
                {leave.reason && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Alasan</span>
                        <span className="max-w-xs font-medium text-right text-gray-900">{leave.reason}</span>
                    </div>
                )}
            </div>

            <FormField label="Keputusan" required error={errors.status?.message}>
                <select {...register('status')} className="input-field">
                    <option value="APPROVED">Setujui</option>
                    <option value="REJECTED">Tolak</option>
                </select>
            </FormField>

            {status === 'REJECTED' && (
                <FormField label="Alasan Penolakan" required error={errors.rejectReason?.message}>
                    <textarea
                        {...register('rejectReason')}
                        className="resize-none input-field"
                        rows={3}
                        placeholder="Jelaskan alasan penolakan..."
                    />
                </FormField>
            )}

            <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={onCancel} className="flex-1 btn-secondary">
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={mutation.isPending}
                    className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors
            ${status === 'APPROVED' ? 'btn-primary' : 'btn-danger'}
          `}
                >
                    {mutation.isPending ? 'Memproses...' : status === 'APPROVED' ? 'Setujui' : 'Tolak'}
                </button>
            </div>
        </form>
    );
}