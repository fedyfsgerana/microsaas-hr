import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';

const schema = z.object({
    email: z.string().email('Email tidak valid'),
    password: z.string().min(1, 'Password wajib diisi'),
});

export default function LoginPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);
    const { isDark, setDark, themeKey, themes, setTheme } = useThemeStore();
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data) => {
        try {
            setError('');
            const res = await api.post('/auth/login', data);
            const { accessToken, refreshToken } = res.data;
            const meRes = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            setAuth(meRes.data, accessToken, refreshToken);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Email atau password salah');
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Left panel - decorative */}
            <div className="relative items-center justify-center hidden p-12 overflow-hidden lg:flex lg:w-1/2 bg-primary">
                <div className="absolute inset-0 opacity-20">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute border rounded-full border-white/30"
                            style={{
                                width: `${(i + 1) * 120}px`,
                                height: `${(i + 1) * 120}px`,
                                top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                    ))}
                </div>
                <div className="relative text-center text-white">
                    <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/20 backdrop-blur">
                        <span className="text-3xl font-black">HR</span>
                    </div>
                    <h1 className="mb-4 text-4xl font-black">Micro SaaS HR</h1>
                    <p className="max-w-sm text-lg text-white/80">
                        Manajemen SDM modern untuk UMKM Indonesia. Mudah, cepat, dan terjangkau.
                    </p>
                    <div className="grid grid-cols-3 gap-4 mt-10">
                        {[
                            { label: 'Karyawan', value: '50+' },
                            { label: 'Fitur', value: '20+' },
                            { label: 'UMKM', value: '100+' },
                        ].map((s) => (
                            <div key={s.label} className="p-4 bg-white/10 backdrop-blur rounded-2xl">
                                <p className="text-2xl font-black">{s.value}</p>
                                <p className="text-sm text-white/70">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel - form */}
            <div className="flex flex-col items-center justify-center flex-1 p-6 lg:p-12">
                {/* Theme toggles */}
                <div className="absolute flex items-center gap-2 top-4 right-4">
                    {Object.entries(themes).map(([key, theme]) => (
                        <button
                            key={key}
                            onClick={() => setTheme(key)}
                            title={theme.name}
                            className={`w-5 h-5 rounded-full transition-all ${themeKey === key ? 'ring-2 ring-offset-2 ring-gray-400 scale-125' : ''}`}
                            style={{ backgroundColor: `rgb(${theme.primary})` }}
                        />
                    ))}
                    <button
                        onClick={() => setDark(!isDark)}
                        className="p-2 ml-2 text-gray-600 transition-colors bg-gray-100 rounded-xl dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        {isDark
                            ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        }
                    </button>
                </div>

                <div className="w-full max-w-md">
                    {/* Logo mobile */}
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary">
                            <span className="text-sm font-black text-white">HR</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">Micro SaaS HR</span>
                    </div>

                    <h2 className="mb-1 text-3xl font-black text-gray-900 dark:text-white">Selamat datang</h2>
                    <p className="mb-8 text-gray-500 dark:text-gray-400">Masuk ke akun Anda untuk melanjutkan</p>

                    {error && (
                        <div className="flex items-center gap-3 p-4 mb-4 text-sm text-red-700 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-2xl dark:text-red-400">
                            <svg className="flex-shrink-0 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="nama@email.com"
                                className="input-field"
                                autoComplete="email"
                            />
                            {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="input-field pr-11"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute text-gray-400 -translate-y-1/2 right-3 top-1/2 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showPassword
                                        ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    }
                                </button>
                            </div>
                            {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
                        </div>

                        <button type="submit" disabled={isSubmitting} className="w-full py-3 mt-2 text-base btn-primary">
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Memproses...
                                </span>
                            ) : 'Masuk'}
                        </button>
                    </form>

                    <p className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
                        Belum punya akun?{' '}
                        <Link to="/register" className="font-semibold text-primary hover:underline">
                            Daftar gratis
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}