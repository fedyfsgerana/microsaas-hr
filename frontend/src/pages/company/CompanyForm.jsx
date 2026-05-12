import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import FormField from '../../components/ui/FormField';

const schema = z.object({
    name: z.string().min(2, 'Nama perusahaan minimal 2 karakter'),
    industry: z.string().optional(),
    address: z.string().optional(),
    timezone: z.string().optional(),
});

export default function CompanyForm({ company, onSuccess, onCancel }) {
    const toast = useToast();
    const confirm = useConfirm();
    const isEdit = !!company;

    const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            name: company?.name || '',
            industry: company?.industry || '',
            address: company?.address || '',
            timezone: company?.timezone || 'Asia/Jakarta',
        },
    });

    const mutation = useMutation({
        mutationFn: (data) => isEdit ? api.patch('/company', data) : api.post('/company', data),
        onSuccess: () => {
            toast(isEdit ? 'Profil perusahaan diperbarui' : 'Perusahaan berhasil dibuat', 'success');
            onSuccess();
        },
        onError: (err) => {
            toast(err.response?.data?.message || 'Gagal menyimpan', 'error');
        },
    });

    const onSubmit = async (data) => {
        const ok = await confirm({
            title: isEdit ? 'Simpan Perubahan?' : 'Buat Perusahaan?',
            message: isEdit ? 'Profil perusahaan akan diperbarui.' : `Perusahaan "${data.name}" akan dibuat.`,
            confirmText: 'Simpan',
            type: 'info',
        });
        if (ok) mutation.mutate(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Nama Perusahaan" required error={errors.name?.message}>
                <input {...register('name')} className="input-field" placeholder="PT. Maju Bersama" />
            </FormField>

            <FormField label="Industri" error={errors.industry?.message}>
                <input {...register('industry')} className="input-field" placeholder="F&B, Retail, Jasa, dll" />
            </FormField>

            <FormField label="Alamat" error={errors.address?.message}>
                <input {...register('address')} className="input-field" placeholder="Jl. ..." />
            </FormField>

            <FormField label="Zona Waktu" error={errors.timezone?.message}>
                <select {...register('timezone')} className="input-field">
                    <option value="Asia/Jakarta">WIB - Asia/Jakarta</option>
                    <option value="Asia/Makassar">WITA - Asia/Makassar</option>
                    <option value="Asia/Jayapura">WIT - Asia/Jayapura</option>
                </select>
            </FormField>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={onCancel} className="flex-1 btn-secondary">Batal</button>
                <button
                    type="submit"
                    disabled={mutation.isPending || (isEdit && !isDirty)}
                    className="flex-1 btn-primary"
                >
                    {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
            </div>
        </form>
    );
}