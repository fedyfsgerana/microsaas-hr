import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import FormField from '../../components/ui/FormField';

const employeeSchema = z.object({
    fullName: z.string().min(2, 'Nama minimal 2 karakter'),
    email: z.string().email('Format email tidak valid'),
    phone: z.string().optional(),
    position: z.string().optional(),
    departmentId: z.string().optional(),
    employeeCode: z.string().optional(),
    joinDate: z.string().optional(),
    birthDate: z.string().optional(),
    address: z.string().optional(),
    bankName: z.string().optional(),
    bankAccount: z.string().optional(),
    ktpNumber: z.string().optional(),
    emergencyContact: z.string().optional(),
    baseSalary: z.coerce.number().min(0, 'Gaji tidak boleh negatif').optional(),
});

export default function EmployeeForm({ employee, onSuccess, onCancel }) {
    const toast = useToast();
    const confirm = useConfirm();
    const isEdit = !!employee;

    const { data: departments = [] } = useQuery({
        queryKey: ['departments-list'],
        queryFn: async () => {
            const meRes = await api.get('/company/me');
            const res = await api.get(`/company/${meRes.data.id}/departments`);
            return res.data;
        },
    });

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm({
        resolver: zodResolver(employeeSchema),
        defaultValues: employee
            ? {
                fullName: employee.fullName || '',
                email: employee.user?.email || '',
                phone: employee.user?.phone || '',
                position: employee.position || '',
                departmentId: employee.departmentId || '',
                employeeCode: employee.employeeCode || '',
                joinDate: employee.joinDate?.slice(0, 10) || '',
                birthDate: employee.birthDate?.slice(0, 10) || '',
                address: employee.address || '',
                bankName: employee.bankName || '',
                bankAccount: employee.bankAccount || '',
                ktpNumber: employee.ktpNumber || '',
                emergencyContact: employee.emergencyContact || '',
                baseSalary: Number(employee.baseSalary) || 0,
            }
            : {},
    });

    const createMutation = useMutation({
        mutationFn: (data) => api.post('/employees', data),
        onSuccess: () => {
            toast('Karyawan berhasil ditambahkan', 'success');
            onSuccess();
        },
        onError: (err) => {
            toast(err.response?.data?.message || 'Gagal menambahkan karyawan', 'error');
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data) => api.patch(`/employees/${employee.id}`, data),
        onSuccess: () => {
            toast('Data karyawan berhasil diperbarui', 'success');
            onSuccess();
        },
        onError: (err) => {
            toast(err.response?.data?.message || 'Gagal memperbarui data', 'error');
        },
    });

    const onSubmit = async (data) => {
        const ok = await confirm({
            title: isEdit ? 'Simpan Perubahan?' : 'Tambah Karyawan?',
            message: isEdit
                ? `Perubahan data ${data.fullName} akan disimpan.`
                : `${data.fullName} akan ditambahkan sebagai karyawan baru. Password default: password123`,
            confirmText: isEdit ? 'Simpan' : 'Tambahkan',
            type: 'info',
        });

        if (!ok) return;

        if (isEdit) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Informasi Dasar */}
            <div>
                <h3 className="mb-3 text-sm font-semibold tracking-wide text-gray-700 uppercase">
                    Informasi Dasar
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label="Nama Lengkap" required error={errors.fullName?.message}>
                        <input {...register('fullName')} className="input-field" placeholder="John Doe" />
                    </FormField>

                    <FormField label="Email" required error={errors.email?.message}>
                        <input
                            {...register('email')}
                            type="email"
                            className="input-field"
                            placeholder="john@email.com"
                            disabled={isEdit}
                        />
                    </FormField>

                    <FormField label="Nomor HP" error={errors.phone?.message}>
                        <input {...register('phone')} className="input-field" placeholder="08xxxxxxxxxx" />
                    </FormField>

                    <FormField label="Kode Karyawan" error={errors.employeeCode?.message}>
                        <input {...register('employeeCode')} className="input-field" placeholder="EMP001" />
                    </FormField>

                    <FormField label="Jabatan" error={errors.position?.message}>
                        <input {...register('position')} className="input-field" placeholder="Staff, Manager, dll" />
                    </FormField>

                    <FormField label="Divisi" error={errors.departmentId?.message}>
                        <select {...register('departmentId')} className="input-field">
                            <option value="">Pilih Divisi</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Tanggal Bergabung" error={errors.joinDate?.message}>
                        <input {...register('joinDate')} type="date" className="input-field" />
                    </FormField>

                    <FormField label="Tanggal Lahir" error={errors.birthDate?.message}>
                        <input {...register('birthDate')} type="date" className="input-field" />
                    </FormField>
                </div>
            </div>

            {/* Informasi Bank & Gaji */}
            <div>
                <h3 className="mb-3 text-sm font-semibold tracking-wide text-gray-700 uppercase">
                    Gaji & Bank
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label="Gaji Pokok" error={errors.baseSalary?.message}>
                        <input
                            {...register('baseSalary')}
                            type="number"
                            className="input-field"
                            placeholder="5000000"
                        />
                    </FormField>

                    <FormField label="Nama Bank" error={errors.bankName?.message}>
                        <input {...register('bankName')} className="input-field" placeholder="BCA, BNI, Mandiri, dll" />
                    </FormField>

                    <FormField label="Nomor Rekening" error={errors.bankAccount?.message}>
                        <input {...register('bankAccount')} className="input-field" placeholder="1234567890" />
                    </FormField>

                    <FormField label="Nomor KTP" error={errors.ktpNumber?.message}>
                        <input {...register('ktpNumber')} className="input-field" placeholder="16 digit NIK" />
                    </FormField>
                </div>
            </div>

            {/* Informasi Tambahan */}
            <div>
                <h3 className="mb-3 text-sm font-semibold tracking-wide text-gray-700 uppercase">
                    Informasi Tambahan
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label="Alamat" error={errors.address?.message}>
                        <input {...register('address')} className="input-field" placeholder="Jl. ..." />
                    </FormField>

                    <FormField
                        label="Kontak Darurat"
                        error={errors.emergencyContact?.message}
                        hint="Nama & nomor HP"
                    >
                        <input {...register('emergencyContact')} className="input-field" placeholder="Nama - 08xxx" />
                    </FormField>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={onCancel} className="flex-1 btn-secondary">
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={isLoading || (isEdit && !isDirty)}
                    className="flex-1 btn-primary"
                >
                    {isLoading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Karyawan'}
                </button>
            </div>
        </form>
    );
}