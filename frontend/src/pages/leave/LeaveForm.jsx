import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import FormField from '../../components/ui/FormField';

const schema = z.object({
    leaveType: z.enum(['ANNUAL', 'SICK', 'PERMIT', 'OTHER']),
    startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
    endDate: z.string().min(1, 'Tanggal akhir wajib diisi'),
    reason: z.string().min(3, 'Alasan minimal 3 karakter'),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'Tanggal akhir tidak boleh sebelum tanggal mulai',
    path: ['endDate'],
});

export default function LeaveForm({ onSuccess, onCancel }) {
    const toast = useToast();
    const confirm = useConfirm();

    const { data: balances = [] } = useQuery({
        queryKey: ['leave-balances-me'],
        queryFn: async () => {
            const meRes = await api.get('/auth/me');
            const res = await api.get(`/employees/${meRes.data.employee.id}/leave-balances`);
            return res.data;
        },
    });

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            leaveType: 'ANNUAL',
            startDate: '',
            endDate: '',
            reason: '',
        },
    });

    const startDate = watch('startDate');
    const endDate = watch('endDate');
    const leaveType = watch('leaveType');

    const totalDays = startDate && endDate
        ? Math.max(0, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1)
        : 0;

    const annualBalance = balances.find((b) => b.leaveType === 'ANNUAL');

    const mutation = useMutation({
        mutationFn: (data) => api.post('/leaves', data),
        onSuccess: () => {
            toast('Pengajuan cuti berhasil dikirim', 'success');
            onSuccess();
        },
        onError: (err) => {
            toast(err.response?.data?.message || 'Gagal mengajukan cuti', 'error');
        },
    });

    const onSubmit = async (data) => {
        const ok = await confirm({
            title: 'Ajukan Cuti?',
            message: `Cuti ${totalDays} hari kerja akan diajukan dan menunggu persetujuan atasan.`,
            confirmText: 'Ya, Ajukan',
            type: 'info',
        });
        if (ok) mutation.mutate(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Saldo cuti */}
            {annualBalance && (
                <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm font-medium text-blue-700">
                        Saldo Cuti Tahunan: <span className="font-bold">{annualBalance.remaining} hari</span>
                        <span className="text-blue-500"> dari {annualBalance.quota} hari</span>
                    </p>
                </div>
            )}

            <FormField label="Jenis Cuti" required error={errors.leaveType?.message}>
                <select {...register('leaveType')} className="input-field">
                    <option value="ANNUAL">Cuti Tahunan</option>
                    <option value="SICK">Sakit</option>
                    <option value="PERMIT">Izin</option>
                    <option value="OTHER">Lainnya</option>
                </select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
                <FormField label="Tanggal Mulai" required error={errors.startDate?.message}>
                    <input {...register('startDate')} type="date" className="input-field" />
                </FormField>

                <FormField label="Tanggal Akhir" required error={errors.endDate?.message}>
                    <input {...register('endDate')} type="date" className="input-field" />
                </FormField>
            </div>

            {totalDays > 0 && (
                <div className="px-4 py-2 text-sm text-gray-600 rounded-lg bg-gray-50">
                    Durasi: <span className="font-semibold text-gray-900">{totalDays} hari</span>
                </div>
            )}

            <FormField label="Alasan" required error={errors.reason?.message}>
                <textarea
                    {...register('reason')}
                    className="resize-none input-field"
                    rows={3}
                    placeholder="Jelaskan alasan cuti..."
                />
            </FormField>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={onCancel} className="flex-1 btn-secondary">
                    Batal
                </button>
                <button type="submit" disabled={mutation.isPending} className="flex-1 btn-primary">
                    {mutation.isPending ? 'Mengajukan...' : 'Ajukan Cuti'}
                </button>
            </div>
        </form>
    );
}