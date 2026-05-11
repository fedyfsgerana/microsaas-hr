import { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
    const [dialog, setDialog] = useState(null);

    const confirm = useCallback(({ title, message, confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', type = 'danger' }) => {
        return new Promise((resolve) => {
            setDialog({ title, message, confirmText, cancelText, type, resolve });
        });
    }, []);

    const handleConfirm = () => {
        dialog?.resolve(true);
        setDialog(null);
    };

    const handleCancel = () => {
        dialog?.resolve(false);
        setDialog(null);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {dialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black bg-opacity-50"
                        onClick={handleCancel}
                    />

                    {/* Dialog */}
                    <div className="relative w-full max-w-md p-6 bg-white shadow-xl rounded-2xl animate-scale-in">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4
              ${dialog.type === 'danger' ? 'bg-red-100' : ''}
              ${dialog.type === 'warning' ? 'bg-yellow-100' : ''}
              ${dialog.type === 'info' ? 'bg-blue-100' : ''}
            `}>
                            {dialog.type === 'danger' && (
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            )}
                            {dialog.type === 'warning' && (
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                            )}
                            {dialog.type === 'info' && (
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                                </svg>
                            )}
                        </div>

                        <h3 className="mb-2 text-lg font-semibold text-center text-gray-900">
                            {dialog.title}
                        </h3>
                        <p className="mb-6 text-sm text-center text-gray-500">
                            {dialog.message}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCancel}
                                className="flex-1 btn-secondary"
                            >
                                {dialog.cancelText}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors
                  ${dialog.type === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                  ${dialog.type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : ''}
                  ${dialog.type === 'info' ? 'btn-primary' : ''}
                `}
                            >
                                {dialog.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
    return context.confirm;
}