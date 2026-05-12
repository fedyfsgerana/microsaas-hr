import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import FormField from '../../components/ui/FormField';

const schema = z.object({
    shiftName: z.string().min(2, 'Nama shift wajib diisi'),
    startTime: z.string().min(1, 'Jam masuk wajib diisi'),
    endTime: z.string().min(1, 'Jam pulang wajib diisi'),
    lateToleranceMinutes: z.coerce.number().min(0).max(120),
    workDays: z.string().min(1, 'Hari kerja wajib diisi'),
    gpsRadius: z.coerce.number().min(50).max(1000),
});

export default function WorkPolicyForm({ onSuccess, onCancel }) {
    const toast = useToast();
    const confirm = useConfirm();

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            shiftName: 'Shift Pagi',
            startTime: '08:00',
            endTime: '17:00',
            lateToleranceMinutes: 15,
            workDays: '1,2,3,4,5',
            gpsRadius: 100,
        },
    });

    const mutation = useMutation({
        mutationFn: (data) => api.post('/company/work-policies', data),
        onSuccess: () => {
            toast('Kebijakan kerja berhasil ditambahkan', 'success');
            onSuccess();
        },
        onError: (err) => {
            toast(err.response?.data?.message || 'Gagal menyimpan', 'error');
        },
    });

    const onSubmit = async (data) => {
        const ok = await confirm({
            title: 'Simpan Kebijakan Kerja?',
            message: `Shift "${data.shiftName}" jam ${data.startTime} - ${data.endTime} akan disimpan.`,
            confirmText: 'Simpan',
            type: 'info',
        });
        if (ok) mutation.mutate(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Nama Shift" required error={errors.shiftName?.message}>
                <input {...register('shiftName')} className="input-field" placeholder="Shift Pagi" />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
                <FormField label="Jam Masuk" required error={errors.startTime?.message}>
                    <input {...register('startTime')} type="time" className="input-field" />
                </FormField>
                <FormField label="Jam Pulang" required error={errors.endTime?.message}>
                    <input {...register('endTime')} type="time" className="input-field" />
                </FormField>
            </div>

            <FormField
                label="Toleransi Keterlambatan (menit)"
                error={errors.lateToleranceMinutes?.message}
                hint="0 = tidak ada toleransi"
            >
                <input {...register('lateToleranceMinutes')} type="number" className="input-field" />
            </FormField>

            <FormField
                label="Hari Kerja"
                error={errors.workDays?.message}
                hint="1=Senin, 2=Selasa, ... 7=Minggu. Pisahkan dengan koma"
            >
                <input {...register('workDays')} className="input-field" placeholder="1,2,3,4,5" />
            </FormField>

            <FormField
                label="Radius GPS (meter)"
                error={errors.gpsRadius?.message}
                hint="Jarak maksimal dari lokasi kerja"
            >
                <input {...register('gpsRadius')} type="number" className="input-field" />
            </FormField>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={onCancel} className="flex-1 btn-secondary">Batal</button>
                <button type="submit" disabled={mutation.isPending} className="flex-1 btn-primary">
                    {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
            </div>
        </form>
    );
}