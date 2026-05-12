import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';

const schema = z.object({
    fullName: z.string().min(2, 'Nama minimal 2 karakter'),
    email: z.string().email('Email tidak valid'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: 'Password tidak sama',
    path: ['confirmPassword'],
});

const STEPS = ['Identitas', 'Keamanan'];

export default function RegisterPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);
    const { isDark, setDark } = useThemeStore();
    const [error, setError] = useState('');
    const [step, setStep] = useState(0);
    const [showPwd, setShowPwd] = useState(false);

    const { register, handleSubmit, trigger, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
    });

    const nextStep = async () => {
        const valid = await trigger(['fullName', 'email', 'phone']);
        if (valid) setStep(1);
    };

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
            setError(err.response?.data?.message || 'Registrasi gagal');
            setStep(0);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Left decorative */}
            <div className="relative items-center justify-center hidden p-12 overflow-hidden lg:flex lg:w-1/2 bg-primary">
                <div className="absolute inset-0 opacity-20">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute border rounded-full border-white/30"
                            style={{ width: `${(i + 1) * 120}px`, height: `${(i + 1) * 120}px`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                    ))}
                </div>
                <div className="relative text-center text-white">
                    <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/20 backdrop-blur">
                        <span className="text-3xl font-black">HR</span>
                    </div>
                    <h1 className="mb-4 text-4xl font-black">Bergabung Sekarang</h1>
                    <p className="max-w-sm text-lg text-white/80">Trial gratis 14 hari. Tidak perlu kartu kredit.</p>
                    <div className="mt-10 space-y-3 text-left">
                        {['✓ Setup dalam 15 menit', '✓ Notifikasi via WhatsApp', '✓ Data aman & terenkripsi', '✓ Support 7 hari seminggu'].map((f) => (
                            <p key={f} className="font-medium text-white/90">{f}</p>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right form */}
            <div className="flex flex-col items-center justify-center flex-1 p-6 lg:p-12">
                <button
                    onClick={() => setDark(!isDark)}
                    className="absolute p-2 text-gray-600 bg-gray-100 top-4 right-4 rounded-xl dark:bg-gray-800 dark:text-gray-400"
                >
                    {isDark
                        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                    }
                </button>

                <div className="w-full max-w-md">
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary">
                            <span className="text-sm font-black text-white">HR</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">Micro SaaS HR</span>
                    </div>

                    <h2 className="mb-1 text-3xl font-black text-gray-900 dark:text-white">Buat akun baru</h2>
                    <p className="mb-6 text-gray-500 dark:text-gray-400">Trial gratis 14 hari, tidak perlu kartu kredit</p>

                    {/* Step indicator */}
                    <div className="flex items-center gap-3 mb-6">
                        {STEPS.map((s, i) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${i <= step ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                    {i < step ? '✓' : i + 1}
                                </div>
                                <span className={`text-sm font-medium ${i === step ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{s}</span>
                                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 w-8 rounded ${i < step ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 p-4 mb-4 text-sm text-red-700 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-2xl dark:text-red-400">
                            <svg className="flex-shrink-0 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {step === 0 && (
                            <div className="space-y-4 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nama Lengkap</label>
                                    <input {...register('fullName')} className="input-field" placeholder="John Doe" />
                                    {errors.fullName && <p className="mt-1.5 text-xs text-red-500">{errors.fullName.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                                    <input {...register('email')} type="email" className="input-field" placeholder="nama@email.com" />
                                    {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        Nomor HP <span className="font-normal text-gray-400">(opsional)</span>
                                    </label>
                                    <input {...register('phone')} className="input-field" placeholder="08xxxxxxxxxx" />
                                </div>
                                <button type="button" onClick={nextStep} className="w-full py-3 text-base btn-primary">
                                    Lanjut →
                                </button>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-4 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                                    <div className="relative">
                                        <input {...register('password')} type={showPwd ? 'text' : 'password'} className="input-field pr-11" placeholder="Min. 8 karakter" />
                                        <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute text-gray-400 -translate-y-1/2 right-3 top-1/2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                    </div>
                                    {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Konfirmasi Password</label>
                                    <input {...register('confirmPassword')} type="password" className="input-field" placeholder="Ulangi password" />
                                    {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>}
                                </div>

                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setStep(0)} className="flex-1 py-3 btn-secondary">
                                        ← Kembali
                                    </button>
                                    <button type="submit" disabled={isSubmitting} className="flex-1 py-3 btn-primary">
                                        {isSubmitting ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Mendaftar...
                                            </span>
                                        ) : 'Daftar Sekarang'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    <p className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
                        Sudah punya akun?{' '}
                        <Link to="/login" className="font-semibold text-primary hover:underline">Masuk di sini</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}