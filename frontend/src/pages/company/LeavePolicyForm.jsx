import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import FormField from '../../components/ui/FormField';

const schema = z.object({
    leaveType: z.enum(['ANNUAL', 'SICK', 'PERMIT', 'OTHER']),
    quota: z.coerce.number().min(1, 'Kuota minimal 1 hari').max(365),
    carryOver: z.boolean().optional(),
});

export default function LeavePolicyForm({ onSuccess, onCancel }) {
    const toast = useToast();
    const confirm = useConfirm();

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            leaveType: 'ANNUAL',
            quota: 12,
            carryOver: false,
        },
    });

    const mutation = useMutation({
        mutationFn: (data) => api.post('/company/leave-policies', data),
        onSuccess: () => {
            toast('Kebijakan cuti berhasil ditambahkan', 'success');
            onSuccess();
        },
        onError: (err) => {
            toast(err.response?.data?.message || 'Gagal menyimpan', 'error');
        },
    });

    const onSubmit = async (data) => {
        const ok = await confirm({
            title: 'Simpan Kebijakan Cuti?',
            message: `Kuota ${data.quota} hari untuk jenis cuti ${data.leaveType} akan disimpan.`,
            confirmText: 'Simpan',
            type: 'info',
        });
        if (ok) mutation.mutate(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Jenis Cuti" required error={errors.leaveType?.message}>
                <select {...register('leaveType')} className="input-field">
                    <option value="ANNUAL">Cuti Tahunan</option>
                    <option value="SICK">Sakit</option>
                    <option value="PERMIT">Izin</option>
                    <option value="OTHER">Lainnya</option>
                </select>
            </FormField>

            <FormField
                label="Kuota (hari per tahun)"
                required
                error={errors.quota?.message}
            >
                <input {...register('quota')} type="number" className="input-field" placeholder="12" />
            </FormField>

            <div className="flex items-center gap-3">
                <input
                    {...register('carryOver')}
                    type="checkbox"
                    id="carryOver"
                    className="w-4 h-4 rounded text-primary-600"
                />
                <label htmlFor="carryOver" className="text-sm text-gray-700">
                    Sisa cuti bisa dibawa ke tahun berikutnya (carry over)
                </label>
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={onCancel} className="flex-1 btn-secondary">Batal</button>
                <button type="submit" disabled={mutation.isPending} className="flex-1 btn-primary">
                    {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
            </div>
        </form>
    );
}