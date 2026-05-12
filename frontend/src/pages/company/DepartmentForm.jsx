import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import FormField from '../../components/ui/FormField';

const schema = z.object({
    name: z.string().min(2, 'Nama divisi minimal 2 karakter'),
});

export default function DepartmentForm({ onSuccess, onCancel }) {
    const toast = useToast();
    const confirm = useConfirm();

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
    });

    const mutation = useMutation({
        mutationFn: (data) => api.post('/company/departments', { name: data.name }),
        onSuccess: () => {
            toast('Divisi berhasil ditambahkan', 'success');
            onSuccess();
        },
        onError: (err) => {
            toast(err.response?.data?.message || 'Gagal menambahkan divisi', 'error');
        },
    });

    const onSubmit = async (data) => {
        const ok = await confirm({
            title: 'Tambah Divisi?',
            message: `Divisi "${data.name}" akan ditambahkan.`,
            confirmText: 'Tambahkan',
            type: 'info',
        });
        if (ok) mutation.mutate(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Nama Divisi" required error={errors.name?.message}>
                <input {...register('name')} className="input-field" placeholder="Marketing, HRD, IT, dll" />
            </FormField>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={onCancel} className="flex-1 btn-secondary">Batal</button>
                <button type="submit" disabled={mutation.isPending} className="flex-1 btn-primary">
                    {mutation.isPending ? 'Menyimpan...' : 'Tambahkan'}
                </button>
            </div>
        </form>
    );
}