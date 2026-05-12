import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

const ICONS = {
    success: (
        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-green-100 rounded-xl dark:bg-green-900/40">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
        </div>
    ),
    error: (
        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-red-100 rounded-xl dark:bg-red-900/40">
            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </div>
    ),
    warning: (
        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
        </div>
    ),
    info: (
        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-blue-100 rounded-xl dark:bg-blue-900/40">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
            </svg>
        </div>
    ),
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    }, []);

    const remove = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 shadow-xl pointer-events-auto dark:bg-gray-900 dark:border-gray-700 rounded-2xl animate-slide-in"
                    >
                        {ICONS[toast.type]}
                        <p className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{toast.message}</p>
                        <button
                            onClick={() => remove(toast.id)}
                            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx.addToast;
}