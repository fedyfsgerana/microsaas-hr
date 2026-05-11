import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

const registerSchema = z.object({
    fullName: z.string().min(2, 'Nama minimal 2 karakter'),
    email: z.string().email('Email tidak valid'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Password tidak sama',
    path: ['confirmPassword'],
});

export default function RegisterPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(registerSchema) });

    const onSubmit = async (data) => {
        try {
            setError('');
            const res = await api.post('/auth/register', {
                fullName: data.fullName,
                email: data.email,
                phone: data.phone,
                password: data.password,
            });

            const { accessToken, refreshToken } = res.data;

            const meRes = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            setAuth(meRes.data, accessToken, refreshToken);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registrasi gagal, coba lagi');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-primary-50 to-blue-100">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-primary-600 rounded-2xl">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Micro SaaS HR</h1>
                    <p className="mt-1 text-sm text-gray-500">Daftar gratis, trial 14 hari</p>
                </div>

                <div className="card">
                    <h2 className="mb-6 text-xl font-semibold text-gray-900">Buat akun baru</h2>

                    {error && (
                        <div className="p-3 mb-4 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                Nama Lengkap
                            </label>
                            <input
                                {...register('fullName')}
                                type="text"
                                placeholder="John Doe"
                                className="input-field"
                            />
                            {errors.fullName && (
                                <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="nama@email.com"
                                className="input-field"
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                Nomor HP <span className="text-gray-400">(opsional)</span>
                            </label>
                            <input
                                {...register('phone')}
                                type="tel"
                                placeholder="08xxxxxxxxxx"
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                {...register('password')}
                                type="password"
                                placeholder="Min. 8 karakter"
                                className="input-field"
                            />
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                Konfirmasi Password
                            </label>
                            <input
                                {...register('confirmPassword')}
                                type="password"
                                placeholder="Ulangi password"
                                className="input-field"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full mt-2 btn-primary"
                        >
                            {isSubmitting ? 'Memproses...' : 'Daftar Sekarang'}
                        </button>
                    </form>

                    <p className="mt-6 text-sm text-center text-gray-500">
                        Sudah punya akun?{' '}
                        <Link to="/login" className="font-medium text-primary-600 hover:underline">
                            Masuk di sini
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}