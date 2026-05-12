import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore, { THEMES } from '../../store/themeStore';
import api from '../../api/axios';

const NAV_ITEMS = [
    {
        path: '/dashboard', label: 'Dashboard',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    },
    {
        path: '/employees', label: 'Karyawan',
        roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'],
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
    },
    {
        path: '/attendance', label: 'Absensi',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
    },
    {
        path: '/leave', label: 'Cuti & Izin',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    },
    {
        path: '/payroll', label: 'Penggajian',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
    {
        path: '/company', label: 'Perusahaan',
        roles: ['SUPER_ADMIN', 'HR_ADMIN'],
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
    },
];

function Icon({ d }) {
    return (
        <svg className="flex-shrink-0 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {d}
        </svg>
    );
}

function NavItem({ item, collapsed, onClick }) {
    return (
        <NavLink
            to={item.path}
            onClick={onClick}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }
        >
            <Icon d={item.icon} />
            {!collapsed && <span>{item.label}</span>}
        </NavLink>
    );
}

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [themeOpen, setThemeOpen] = useState(false);

    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();
    const location = useLocation();

    const { isDark, layout, themeKey, themes, setDark, setLayout, setTheme } = useThemeStore();

    // Close sidebar on route change (mobile)
    useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

    const handleLogout = async () => {
        try { await api.post('/auth/logout'); } catch { }
        logout();
        navigate('/login');
    };

    const filteredNav = NAV_ITEMS.filter(
        (item) => !item.roles || item.roles.includes(user?.role),
    );

    const userInitial = user?.employee?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U';
    const userName = user?.employee?.fullName || user?.email || 'User';

    // ── TOPBAR LAYOUT ──────────────────────────────────────────────
    if (layout === 'topbar') {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
                {/* Top navbar */}
                <header className="sticky top-0 z-40 flex items-center h-16 gap-4 px-4 shadow-sm glass lg:px-6">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 mr-4">
                        <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-xl bg-primary">
                            HR
                        </div>
                        <span className="hidden font-bold text-gray-900 dark:text-white sm:block">Micro SaaS HR</span>
                    </div>

                    {/* Nav links */}
                    <nav className="items-center flex-1 hidden gap-1 md:flex">
                        {filteredNav.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all
                  ${isActive
                                        ? 'bg-primary-50 text-primary'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                    }`
                                }
                            >
                                <Icon d={item.icon} />
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2 ml-auto">
                        {/* Theme & settings */}
                        <ThemePanel
                            open={themeOpen}
                            setOpen={setThemeOpen}
                            isDark={isDark}
                            setDark={setDark}
                            layout={layout}
                            setLayout={setLayout}
                            themeKey={themeKey}
                            themes={themes}
                            setTheme={setTheme}
                        />

                        {/* Profile */}
                        <NavLink to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex items-center justify-center rounded-full w-7 h-7 bg-primary-100">
                                <span className="text-xs font-bold text-primary">{userInitial}</span>
                            </div>
                            <span className="hidden text-sm font-medium text-gray-900 dark:text-white lg:block">{userName}</span>
                        </NavLink>

                        <button onClick={handleLogout} className="text-red-500 btn-ghost hover:bg-red-50 dark:hover:bg-red-900/20">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>

                        {/* Mobile menu */}
                        <button className="md:hidden btn-ghost" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Mobile drawer */}
                {sidebarOpen && (
                    <>
                        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
                        <div className="fixed left-0 right-0 z-50 p-3 space-y-1 bg-white border-b border-gray-200 top-16 dark:bg-gray-900 dark:border-gray-800 md:hidden">
                            {filteredNav.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `sidebar-link ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <Icon d={item.icon} />
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    </>
                )}

                {/* Page */}
                <main className="flex-1 p-4 lg:p-6 page-enter" role="main">
                    <Outlet />
                </main>
            </div>
        );
    }

    // ── SIDEBAR LAYOUT ─────────────────────────────────────────────
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 flex flex-col
        bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        ${collapsed ? 'w-16' : 'w-64'}
      `}>
                {/* Logo */}
                <div className={`flex items-center h-16 px-4 border-b border-gray-100 dark:border-gray-800 ${collapsed ? 'justify-center' : 'gap-3'}`}>
                    <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-bold text-white rounded-xl bg-primary">
                        HR
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate dark:text-white">Micro SaaS HR</p>
                            <p className="text-xs text-gray-400 truncate">UMKM Indonesia</p>
                        </div>
                    )}
                    {/* Collapse button (desktop) */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:flex btn-ghost p-1.5 ml-auto"
                        title={collapsed ? 'Perlebar' : 'Perkecil'}
                    >
                        <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
                    {filteredNav.map((item) => (
                        <NavItem key={item.path} item={item} collapsed={collapsed} onClick={() => setSidebarOpen(false)} />
                    ))}
                </nav>

                {/* Bottom */}
                <div className={`p-2 border-t border-gray-100 dark:border-gray-800 space-y-0.5`}>
                    {/* Theme panel trigger */}
                    <button
                        onClick={() => setThemeOpen(!themeOpen)}
                        className={`sidebar-link w-full ${collapsed ? 'justify-center px-2' : ''}`}
                        title={collapsed ? 'Pengaturan Tema' : undefined}
                    >
                        <svg className="flex-shrink-0 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        {!collapsed && <span>Tema & Tampilan</span>}
                    </button>

                    {/* Profile */}
                    <NavLink
                        to="/profile"
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
                        }
                        title={collapsed ? userName : undefined}
                    >
                        <div className="flex items-center justify-center flex-shrink-0 w-5 h-5 rounded-full bg-primary-100">
                            <span style={{ color: 'rgb(var(--color-primary))' }} className="text-xs font-bold">{userInitial}</span>
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate dark:text-white">{userName}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.role}</p>
                            </div>
                        )}
                    </NavLink>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className={`sidebar-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 ${collapsed ? 'justify-center px-2' : ''}`}
                        title={collapsed ? 'Keluar' : undefined}
                    >
                        <svg className="flex-shrink-0 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {!collapsed && <span>Keluar</span>}
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="flex items-center flex-shrink-0 h-16 gap-3 px-4 border-b border-gray-100 glass lg:px-6 dark:border-gray-800">
                    <button
                        className="lg:hidden btn-ghost"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Buka menu"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <PageTitle location={location} nav={filteredNav} />

                    <div className="flex items-center gap-2 ml-auto">
                        <span className="hidden text-xs text-gray-400 sm:block">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </header>

                <main className="flex-1 p-4 overflow-y-auto lg:p-6 page-enter" role="main">
                    <Outlet />
                </main>
            </div>

            {/* Theme panel overlay */}
            {themeOpen && (
                <ThemePanel
                    open={themeOpen}
                    setOpen={setThemeOpen}
                    isDark={isDark}
                    setDark={setDark}
                    layout={layout}
                    setLayout={setLayout}
                    themeKey={themeKey}
                    themes={themes}
                    setTheme={setTheme}
                    mode="drawer"
                />
            )}
        </div>
    );
}

function PageTitle({ location, nav }) {
    const current = nav.find((n) => location.pathname.startsWith(n.path));
    return (
        <h1 className="text-base font-semibold text-gray-900 dark:text-white">
            {current?.label || 'Dashboard'}
        </h1>
    );
}

function ThemePanel({ open, setOpen, isDark, setDark, layout, setLayout, themeKey, themes, setTheme, mode = 'floating' }) {
    if (!open) return null;

    const content = (
        <div className="space-y-5">
            {/* Dark mode */}
            <div>
                <p className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">Mode Tampilan</p>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { val: false, label: '☀️ Terang' },
                        { val: true, label: '🌙 Gelap' },
                    ].map(({ val, label }) => (
                        <button
                            key={String(val)}
                            onClick={() => setDark(val)}
                            className={`py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all
                ${isDark === val
                                    ? 'border-primary bg-primary-50 text-primary'
                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Layout */}
            <div>
                <p className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">Layout</p>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { val: 'sidebar', label: '⬛ Sidebar' },
                        { val: 'topbar', label: '▬ Topbar' },
                    ].map(({ val, label }) => (
                        <button
                            key={val}
                            onClick={() => setLayout(val)}
                            className={`py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all
                ${layout === val
                                    ? 'border-primary bg-primary-50 text-primary'
                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Color themes */}
            <div>
                <p className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">Warna Tema</p>
                <div className="grid grid-cols-3 gap-2">
                    {Object.entries(themes).map(([key, theme]) => (
                        <button
                            key={key}
                            onClick={() => setTheme(key)}
                            className={`flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-medium border-2 transition-all
                ${themeKey === key
                                    ? 'border-gray-900 dark:border-white'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <span
                                className="flex-shrink-0 w-4 h-4 rounded-full"
                                style={{ backgroundColor: `rgb(${theme.primary})` }}
                            />
                            {theme.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    if (mode === 'drawer') {
        return (
            <>
                <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
                <div className="fixed top-0 bottom-0 right-0 z-50 p-5 overflow-y-auto bg-white border-l border-gray-200 w-72 dark:bg-gray-900 dark:border-gray-800 animate-slide-in">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Tema & Tampilan</h2>
                        <button onClick={() => setOpen(false)} className="btn-ghost p-1.5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {content}
                </div>
            </>
        );
    }

    return (
        <div className="relative">
            <div className="absolute right-0 z-50 p-4 mt-2 bg-white border border-gray-200 shadow-xl top-full w-72 dark:bg-gray-900 dark:border-gray-800 rounded-2xl animate-scale-in">
                {content}
            </div>
        </div>
    );
}