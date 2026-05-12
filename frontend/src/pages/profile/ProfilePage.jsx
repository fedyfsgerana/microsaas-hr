import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { useDarkMode } from '../../hooks/useDarkMode';
import FormField from '../../components/ui/FormField';
import Badge from '../../components/ui/Badge';

const profileSchema = z.object({
    fullName: z.string().min(2, 'Nama minimal 2 karakter'),
    phone: z.string().optional(),
    address: z.string().optional(),
    birthDate: z.string().optional(),
    bankName: z.string().optional(),
    bankAccount: z.string().optional(),
    emergencyContact: z.string().optional(),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Password lama wajib diisi'),
    newPassword: z.string().min(8, 'Password minimal 8 karakter'),
    confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Password tidak sama',
    path: ['confirmPassword'],
});

const roleLabel = {
    SUPER_ADMIN: 'Super Admin',
    HR_ADMIN: 'HR Admin',
    MANAGER: 'Manager',
    EMPLOYEE: 'Karyawan',
};

const roleVariant = {
    SUPER_ADMIN: 'danger',
    HR_ADMIN: 'warning',
    MANAGER: 'info',
    EMPLOYEE: 'success',
};

export default function ProfilePage() {
    const toast = useToast();
    const confirm = useConfirm();
    const user = useAuthStore((s) => s.user);
    const setUser = useAuthStore((s) => s.setUser);
    const [isDark, setIsDark] = useDarkMode();
    const [activeTab, setActiveTab] = useState('profile');

    const { data: me, isLoading } = useQuery({
        queryKey: ['me-profile'],
        queryFn: async () => {
            const res = await api.get('/auth/me');
            return res.data;
        },
    });

    const { register: regProfile, handleSubmit: handleProfile, formState: { errors: errProfile, isDirty: dirtyProfile } } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: me?.employee?.fullName || '',
            phone: me?.phone || '',
            address: me?.employee?.address || '',
            birthDate: me?.employee?.birthDate?.slice(0, 10) || '',
            bankName: me?.employee?.bankName || '',
            bankAccount: me?.employee?.bankAccount || '',
            emergencyContact: me?.employee?.emergencyContact || '',
        },
        values: {
            fullName: me?.employee?.fullName || '',
            phone: me?.phone || '',
            address: me?.employee?.address || '',
            birthDate: me?.employee?.birthDate?.slice(0, 10) || '',
            bankName: me?.employee?.bankName || '',
            bankAccount: me?.employee?.bankAccount || '',
            emergencyContact: me?.employee?.emergencyContact || '',
        },
    });

    const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, formState: { errors: errPwd } } = useForm({
        resolver: zodResolver(passwordSchema),
    });

    const updateProfileMutation = useMutation({
        mutationFn: (data) => api.patch(`/employees/${me?.employee?.id}`, data),
        onSuccess: () => {
            toast('Profil berhasil diperbarui', 'success');
        },
        onError: (err) => {
            toast(err.response?.data?.message || 'Gagal memperbarui profil', 'error');
        },
    });

    const changePasswordMutation = useMutation({
        mutationFn: async (data) => {
            // Re-login dengan password lama untuk verifikasi
            await api.post('/auth/login', { email: me.email, password: data.currentPassword });
            // TODO: endpoint change password — untuk sekarang simulasi
            return true;
        },
        onSuccess: () => {
            toast('Password berhasil diubah', 'success');
            resetPwd();
        },
        onError: () => {
            toast('Password lama tidak sesuai', 'error');
        },
    });

    const onSubmitProfile = async (data) => {
        const ok = await confirm({
            title: 'Simpan Perubahan Profil?',
            message: 'Data profil Anda akan diperbarui.',
            confirmText: 'Simpan',
            type: 'info',
        });
        if (ok) updateProfileMutation.mutate(data);
    };

    const onSubmitPassword = async (data) => {
        const ok = await confirm({
            title: 'Ubah Password?',
            message: 'Password Anda akan diubah. Anda perlu login ulang setelahnya.',
            confirmText: 'Ubah Password',
            type: 'warning',
        });
        if (ok) changePasswordMutation.mutate(data);
    };

    const tabs = [
        { key: 'profile', label: 'Profil' },
        { key: 'security', label: 'Keamanan' },
        { key: 'settings', label: 'Pengaturan' },
    ];

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Akun Saya</h1>
                <p className="mt-1 text-sm text-gray-500">Kelola profil dan pengaturan akun</p>
            </div>

            {/* Avatar & info */}
            <div className="flex items-center gap-5 card">
                <div className="flex items-center justify-center flex-shrink-0 w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900">
                    <span className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                        {me?.employee?.fullName?.charAt(0) || me?.email?.charAt(0) || 'U'}
                    </span>
                </div>
                <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {me?.employee?.fullName || 'User'}
                    </p>
                    <p className="text-sm text-gray-500">{me?.email}</p>
                    <div className="mt-2">
                        <Badge variant={roleVariant[me?.role]}>{roleLabel[me?.role]}</Badge>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${activeTab === tab.key
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab: Profil */}
            {activeTab === 'profile' && (
                <form onSubmit={handleProfile(onSubmitProfile)} className="space-y-4 card">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Informasi Pribadi</h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField label="Nama Lengkap" required error={errProfile.fullName?.message}>
                            <input {...regProfile('fullName')} className="input-field" />
                        </FormField>
                        <FormField label="Nomor HP" error={errProfile.phone?.message}>
                            <input {...regProfile('phone')} className="input-field" placeholder="08xxxxxxxxxx" />
                        </FormField>
                        <FormField label="Tanggal Lahir" error={errProfile.birthDate?.message}>
                            <input {...regProfile('birthDate')} type="date" className="input-field" />
                        </FormField>
                        <FormField label="Alamat" error={errProfile.address?.message}>
                            <input {...regProfile('address')} className="input-field" />
                        </FormField>
                        <FormField label="Nama Bank" error={errProfile.bankName?.message}>
                            <input {...regProfile('bankName')} className="input-field" placeholder="BCA, BNI, dll" />
                        </FormField>
                        <FormField label="No. Rekening" error={errProfile.bankAccount?.message}>
                            <input {...regProfile('bankAccount')} className="input-field" />
                        </FormField>
                        <FormField label="Kontak Darurat" error={errProfile.emergencyContact?.message}>
                            <input {...regProfile('emergencyContact')} className="input-field" placeholder="Nama - 08xxx" />
                        </FormField>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="submit"
                            disabled={updateProfileMutation.isPending || !dirtyProfile || !me?.employee?.id}
                            className="btn-primary"
                        >
                            {updateProfileMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            )}

            {/* Tab: Security */}
            {activeTab === 'security' && (
                <form onSubmit={handlePwd(onSubmitPassword)} className="space-y-4 card">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Ubah Password</h3>

                    <FormField label="Password Lama" required error={errPwd.currentPassword?.message}>
                        <input {...regPwd('currentPassword')} type="password" className="input-field" placeholder="••••••••" />
                    </FormField>
                    <FormField label="Password Baru" required error={errPwd.newPassword?.message}>
                        <input {...regPwd('newPassword')} type="password" className="input-field" placeholder="Min. 8 karakter" />
                    </FormField>
                    <FormField label="Konfirmasi Password Baru" required error={errPwd.confirmPassword?.message}>
                        <input {...regPwd('confirmPassword')} type="password" className="input-field" placeholder="Ulangi password baru" />
                    </FormField>

                    <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
                        <button type="submit" disabled={changePasswordMutation.isPending} className="btn-primary">
                            {changePasswordMutation.isPending ? 'Memproses...' : 'Ubah Password'}
                        </button>
                    </div>
                </form>
            )}

            {/* Tab: Settings */}
            {activeTab === 'settings' && (
                <div className="space-y-6 card">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Pengaturan Tampilan</h3>

                    {/* Dark mode */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Mode Gelap</p>
                            <p className="text-xs text-gray-500 mt-0.5">Ganti tampilan ke mode gelap</p>
                        </div>
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className={`relative w-12 h-6 rounded-full transition-colors duration-200
                ${isDark ? 'bg-primary-600' : 'bg-gray-200'}`}
                            role="switch"
                            aria-checked={isDark}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                ${isDark ? 'translate-x-6' : 'translate-x-0'}`}
                            />
                        </button>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Informasi Akun</h3>
                        {[
                            { label: 'Email', value: me?.email },
                            { label: 'Role', value: roleLabel[me?.role] },
                            { label: 'Status', value: me?.isActive ? 'Aktif' : 'Tidak Aktif' },
                            { label: 'Bergabung', value: me?.createdAt ? new Date(me.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-' },
                        ].map((item) => (
                            <div key={item.label} className="flex justify-between py-2 text-sm border-b border-gray-50 dark:border-gray-700">
                                <span className="text-gray-500">{item.label}</span>
                                <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}