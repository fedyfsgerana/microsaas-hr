import { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
    const [dialog, setDialog] = useState(null);

    const confirm = useCallback((opts) =>
        new Promise((resolve) => setDialog({ ...opts, resolve }))
        , []);

    const handle = (val) => { dialog?.resolve(val); setDialog(null); };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {dialog && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => handle(false)} />
                    <div className="relative w-full max-w-sm p-6 bg-white border border-gray-200 shadow-2xl dark:bg-gray-900 rounded-3xl animate-scale-in dark:border-gray-800">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4
              ${dialog.type === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : ''}
              ${dialog.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30' : ''}
              ${dialog.type === 'info' ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
            `}>
                            {dialog.type === 'danger' && (
                                <svg className="text-red-600 w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            )}
                            {dialog.type === 'warning' && (
                                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                            )}
                            {dialog.type === 'info' && (
                                <svg className="text-blue-600 w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                                </svg>
                            )}
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-center text-gray-900 dark:text-white">{dialog.title}</h3>
                        <p className="mb-6 text-sm text-center text-gray-500 dark:text-gray-400">{dialog.message}</p>
                        <div className="flex gap-3">
                            <button onClick={() => handle(false)} className="flex-1 btn-secondary">
                                {dialog.cancelText || 'Batal'}
                            </button>
                            <button
                                onClick={() => handle(true)}
                                className={`flex-1 font-medium py-2 px-4 rounded-xl transition-all active:scale-95
                  ${dialog.type === 'danger' ? 'btn-danger' : ''}
                  ${dialog.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-white rounded-xl' : ''}
                  ${dialog.type === 'info' ? 'btn-primary' : ''}
                `}
                            >
                                {dialog.confirmText || 'Ya'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
    return ctx.confirm;
}