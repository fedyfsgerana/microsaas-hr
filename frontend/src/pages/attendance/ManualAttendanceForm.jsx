import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import FormField from '../../components/ui/FormField';

const schema = z.object({
    employeeId: z.string().min(1, 'Pilih karyawan'),
    date: z.string().min(1, 'Tanggal wajib diisi'),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'PERMIT', 'SICK']),
    note: z.string().optional(),
});

export default function ManualAttendanceForm({ onSuccess, onCancel }) {
    const toast = useToast();
    const confirm = useConfirm();

    const { data: employees = [] } = useQuery({
        queryKey: ['employees-list'],
        queryFn: async () => {
            const res = await api.get('/employees');
            return res.data;
        },
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            date: new Date().toISOString().slice(0, 10),
            status: 'PRESENT',
        },
    });

    const mutation = useMutation({
        mutationFn: (data) => api.post('/attendance/manual', data),
        onSuccess: () => {
            toast('Absensi manual berhasil disimpan', 'success');
            onSuccess();
        },
        onError: (err) => {
            toast(err.response?.data?.message || 'Gagal menyimpan absensi', 'error');
        },
    });

    const onSubmit = async (data) => {
        const ok = await confirm({
            title: 'Simpan Absensi Manual?',
            message: 'Data absensi akan disimpan dan tidak bisa diubah tanpa approval.',
            confirmText: 'Simpan',
            type: 'warning',
        });
        if (ok) mutation.mutate(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Karyawan" required error={errors.employeeId?.message}>
                <select {...register('employeeId')} className="input-field">
                    <option value="">Pilih Karyawan</option>
                    {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                    ))}
                </select>
            </FormField>

            <FormField label="Tanggal" required error={errors.date?.message}>
                <input {...register('date')} type="date" className="input-field" />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
                <FormField label="Jam Masuk" error={errors.checkIn?.message}>
                    <input {...register('checkIn')} type="time" className="input-field" />
                </FormField>

                <FormField label="Jam Pulang" error={errors.checkOut?.message}>
                    <input {...register('checkOut')} type="time" className="input-field" />
                </FormField>
            </div>

            <FormField label="Status" required error={errors.status?.message}>
                <select {...register('status')} className="input-field">
                    <option value="PRESENT">Hadir</option>
                    <option value="LATE">Terlambat</option>
                    <option value="ABSENT">Tidak Hadir</option>
                    <option value="PERMIT">Izin</option>
                    <option value="SICK">Sakit</option>
                </select>
            </FormField>

            <FormField label="Keterangan" error={errors.note?.message}>
                <input {...register('note')} className="input-field" placeholder="Opsional" />
            </FormField>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={onCancel} className="flex-1 btn-secondary">
                    Batal
                </button>
                <button type="submit" disabled={mutation.isPending} className="flex-1 btn-primary">
                    {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
            </div>
        </form>
    );
}